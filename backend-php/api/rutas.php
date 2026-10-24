<?php
/**
 * RepoStock Pro - CRUD de Planificacion de Rutas (cabecera)
 * Tabla: reposicion_productos.rutas
 *
 * GET     -> listar rutas con repositor, estado y conteo de paradas
 * POST    -> crear
 * PUT     -> actualizar (requiere ?id=...)
 * DELETE  -> eliminar ruta y sus paradas (requiere ?id=...)
 */

require_once __DIR__ . '/../config/db.php';

if (!isset($pdo) || !$pdo) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'No se pudo conectar a la base de datos reposicion_productos.'
            . (isset($db_connection_error) ? ' ' . $db_connection_error : '')
    ], 500);
}

$fields = [
    'fecha' => ['label' => 'Fecha', 'type' => 'date', 'required' => true],
    'id_repositor' => ['label' => 'Repositor', 'type' => 'int', 'required' => true, 'min' => 1],
    'hora_inicio_plan' => ['label' => 'Hora de inicio', 'type' => 'time', 'required' => true],
    'hora_fin_plan' => ['label' => 'Hora de fin', 'type' => 'time', 'required' => true],
    'descripcion' => ['label' => 'Descripcion', 'type' => 'string', 'required' => false, 'max' => 200],
    'id_estado' => ['label' => 'Estado', 'type' => 'int', 'required' => true, 'min' => 1],
    'observacion' => ['label' => 'Observacion', 'type' => 'text', 'required' => false, 'max' => 2000],
];

function validateRutaFields(array $fields, array $input, bool $isUpdate): array
{
    $data = [];
    $errors = [];

    foreach ($fields as $name => $def) {
        $provided = array_key_exists($name, $input);

        if (!$provided) {
            if ($isUpdate) {
                continue;
            }
            if (array_key_exists('default', $def)) {
                $data[$name] = $def['default'];
                continue;
            }
            if (!empty($def['required'])) {
                $errors[] = "El campo \"{$def['label']}\" es obligatorio.";
            } else {
                $data[$name] = null;
            }
            continue;
        }

        $value = $input[$name];
        $label = $def['label'];

        if ($def['type'] === 'int') {
            if ($value === '' || $value === null) {
                if (!empty($def['required'])) {
                    $errors[] = "El campo \"{$label}\" es obligatorio.";
                } else {
                    $data[$name] = null;
                }
                continue;
            }
            if (!is_numeric($value)) {
                $errors[] = "El campo \"{$label}\" debe ser numerico.";
                continue;
            }
            $value = (int) $value;
            if (isset($def['min']) && $value < $def['min']) {
                $errors[] = "El campo \"{$label}\" debe ser mayor o igual a {$def['min']}.";
                continue;
            }
            $data[$name] = $value;
            continue;
        }

        if ($def['type'] === 'date') {
            if ($value === '' || $value === null) {
                if (!empty($def['required'])) {
                    $errors[] = "El campo \"{$label}\" es obligatorio.";
                } else {
                    $data[$name] = null;
                }
                continue;
            }

            $value = trim((string) $value);
            if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $matches)
                || !checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1])) {
                $errors[] = "El campo \"{$label}\" debe tener una fecha valida (AAAA-MM-DD).";
                continue;
            }
            $data[$name] = $value;
            continue;
        }

        if ($def['type'] === 'time') {
            if ($value === '' || $value === null) {
                if (!empty($def['required'])) {
                    $errors[] = "El campo \"{$label}\" es obligatorio.";
                } else {
                    $data[$name] = null;
                }
                continue;
            }

            $value = trim((string) $value);
            if (!preg_match('/^([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/', $value, $matches)) {
                $errors[] = "El campo \"{$label}\" debe tener una hora valida (HH:MM).";
                continue;
            }
            $data[$name] = sprintf(
                '%02d:%02d:%02d',
                (int) $matches[1],
                (int) $matches[2],
                isset($matches[3]) ? (int) $matches[3] : 0
            );
            continue;
        }

        $value = trim((string) $value);

        if ($value === '') {
            if (!empty($def['required'])) {
                $errors[] = "El campo \"{$label}\" es obligatorio.";
            } else {
                $data[$name] = null;
            }
            continue;
        }

        if (isset($def['max']) && mb_strlen($value, 'UTF-8') > $def['max']) {
            $errors[] = "El campo \"{$label}\" no puede superar {$def['max']} caracteres.";
            continue;
        }

        $data[$name] = $value;
    }

    return [$data, $errors];
}

function ensureRutaReferential(PDO $pdo, $table, $column, $value, $label)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE `{$column}` = ?");
    $stmt->execute([$value]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => "El/la {$label} seleccionado/a no existe.",
        ], 422);
    }
}

function ensureRutaEstado(PDO $pdo, $idEstado)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM estado_general WHERE id_estado = ? AND entidad = 'RUTA'");
    $stmt->execute([$idEstado]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El estado seleccionado no es valido para una ruta.',
        ], 422);
    }
}

function assertRutaTimeRange($horaInicio, $horaFin)
{
    if ($horaInicio !== null && $horaFin !== null && $horaFin <= $horaInicio) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La hora de fin debe ser posterior a la hora de inicio.',
        ], 422);
    }
}

function findRutaRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM rutas WHERE id_ruta = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'La ruta no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT r.*,
                       CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
                       re.documento AS repositor_documento,
                       e.descripcion AS estado_nombre,
                       (SELECT COUNT(*) FROM ruta_detalle d WHERE d.id_ruta = r.id_ruta) AS total_paradas,
                       (SELECT COUNT(*) FROM ruta_detalle d WHERE d.id_ruta = r.id_ruta AND d.visitado = 1) AS visitadas
                FROM rutas r
                INNER JOIN repositores re ON re.id_repositor = r.id_repositor
                INNER JOIN estado_general e ON e.id_estado = r.id_estado
                ORDER BY r.fecha DESC, r.hora_inicio_plan ASC, r.id_ruta DESC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateRutaFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureRutaReferential($pdo, 'repositores', 'id_repositor', $data['id_repositor'], 'repositor');
            ensureRutaEstado($pdo, $data['id_estado']);
            assertRutaTimeRange($data['hora_inicio_plan'], $data['hora_fin_plan']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO rutas (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);

            sendJsonResponse([
                'status' => 'created',
                'id' => (int) $pdo->lastInsertId(),
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $id = (int) ($_GET['id'] ?? 0);
            if ($id <= 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El ID es obligatorio.'], 400);
            }

            $current = findRutaRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateRutaFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureRutaReferential($pdo, 'repositores', 'id_repositor', $merged['id_repositor'], 'repositor');
            ensureRutaEstado($pdo, $merged['id_estado']);
            assertRutaTimeRange($merged['hora_inicio_plan'], $merged['hora_fin_plan']);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_ruta_param'] = $id;

            $stmt = $pdo->prepare("UPDATE rutas SET {$set} WHERE id_ruta = :id_ruta_param");
            $stmt->execute($data);

            sendJsonResponse([
                'status' => 'updated',
                'affected' => $stmt->rowCount(),
            ]);
            break;

        case 'DELETE':
            $id = (int) ($_GET['id'] ?? 0);
            if ($id <= 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El ID es obligatorio.'], 400);
            }

            findRutaRow($pdo, $id);

            $pdo->beginTransaction();
            $detailStmt = $pdo->prepare("DELETE FROM ruta_detalle WHERE id_ruta = ?");
            $detailStmt->execute([$id]);
            $routeStmt = $pdo->prepare("DELETE FROM rutas WHERE id_ruta = ?");
            $routeStmt->execute([$id]);
            $pdo->commit();

            sendJsonResponse(['status' => 'deleted']);
            break;

        default:
            sendJsonResponse(['status' => 'error', 'message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $mysqlCode = isset($e->errorInfo[1]) ? (int) $e->errorInfo[1] : 0;

    if ($mysqlCode === 1451) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'No se puede eliminar la ruta porque esta siendo usada por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El repositor o estado seleccionado no existe.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

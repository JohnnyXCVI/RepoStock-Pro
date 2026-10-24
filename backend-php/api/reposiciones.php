<?php
/**
 * RepoStock Pro - CRUD de Reposiciones (cabecera)
 * Tabla: reposicion_productos.reposiciones
 *
 * GET     -> listar reposiciones con visita, PDV, repositor, estado y resumen de detalle
 * GET opciones=visitas -> listar visitas disponibles para asociar
 * POST    -> crear
 * PUT     -> actualizar (requiere ?id=...)
 * DELETE  -> eliminar reposicion y su detalle (requiere ?id=...)
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
    'id_visita' => ['label' => 'Visita', 'type' => 'int', 'required' => true, 'min' => 1],
    'fecha_reposicion' => [
        'label' => 'Fecha de reposicion',
        'type' => 'datetime',
        'required' => true,
        'default' => date('Y-m-d H:i:s')
    ],
    'id_repositor' => ['label' => 'Repositor', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_estado' => ['label' => 'Estado', 'type' => 'int', 'required' => true, 'min' => 1],
    'observacion' => ['label' => 'Observacion', 'type' => 'text', 'required' => false, 'max' => 5000],
];

function validateReposicionFields(array $fields, array $input, bool $isUpdate): array
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

        if ($def['type'] === 'datetime') {
            if ($value === '' || $value === null) {
                if (!empty($def['required'])) {
                    $errors[] = "El campo \"{$label}\" es obligatorio.";
                } else {
                    $data[$name] = null;
                }
                continue;
            }

            $value = trim((string) $value);
            $value = str_replace('T', ' ', $value);

            if (!preg_match('/^(\d{4})-(\d{2})-(\d{2}) ([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/', $value, $matches)
                || !checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1])) {
                $errors[] = "El campo \"{$label}\" debe tener una fecha y hora validas.";
                continue;
            }

            $data[$name] = sprintf(
                '%04d-%02d-%02d %02d:%02d:%02d',
                (int) $matches[1],
                (int) $matches[2],
                (int) $matches[3],
                (int) $matches[4],
                (int) $matches[5],
                isset($matches[6]) ? (int) $matches[6] : 0
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

function ensureReposicionReferential(PDO $pdo, $table, $column, $value, $label)
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

function ensureReposicionEstado(PDO $pdo, $idEstado)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM estado_general WHERE id_estado = ? AND entidad = 'REPOSICION'");
    $stmt->execute([$idEstado]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El estado seleccionado no es valido para una reposicion.',
        ], 422);
    }
}

function findReposicionRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM reposiciones WHERE id_reposicion = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'La reposicion no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['opciones']) && $_GET['opciones'] === 'visitas') {
                $stmt = $pdo->query("
                    SELECT v.id_visita,
                           v.fecha_visita,
                           v.id_repositor,
                           v.id_punto_venta,
                           v.id_estado,
                           v.hora_llegada,
                           v.hora_salida,
                           CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
                           re.documento AS repositor_documento,
                           pv.nombre AS punto_venta_nombre,
                           pv.direccion AS punto_venta_direccion,
                           pv.ciudad AS punto_venta_ciudad,
                           e.descripcion AS visita_estado_nombre,
                           (SELECT COUNT(*) FROM visita_detalle d WHERE d.id_visita = v.id_visita) AS total_productos
                    FROM visitas v
                    INNER JOIN repositores re ON re.id_repositor = v.id_repositor
                    INNER JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
                    INNER JOIN estado_general e ON e.id_estado = v.id_estado
                    ORDER BY v.fecha_visita DESC, v.id_visita DESC
                ");
                sendJsonResponse([
                    'status' => 'success',
                    'data' => $stmt->fetchAll(),
                ]);
                break;
            }

            $stmt = $pdo->query("
                SELECT rp.*,
                       v.fecha_visita,
                       v.hora_llegada,
                       v.hora_salida,
                       v.id_punto_venta,
                       pv.nombre AS punto_venta_nombre,
                       pv.direccion AS punto_venta_direccion,
                       pv.ciudad AS punto_venta_ciudad,
                       CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
                       re.documento AS repositor_documento,
                       e.descripcion AS estado_nombre,
                       ve.descripcion AS visita_estado_nombre,
                       (SELECT COUNT(*) FROM reposicion_detalle d WHERE d.id_reposicion = rp.id_reposicion) AS total_lineas,
                       (SELECT COALESCE(SUM(d.cantidad_repuesta), 0) FROM reposicion_detalle d WHERE d.id_reposicion = rp.id_reposicion) AS total_repuesta,
                       (SELECT COALESCE(SUM(d.cantidad_retirada), 0) FROM reposicion_detalle d WHERE d.id_reposicion = rp.id_reposicion) AS total_retirada
                FROM reposiciones rp
                INNER JOIN visitas v ON v.id_visita = rp.id_visita
                INNER JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
                INNER JOIN repositores re ON re.id_repositor = rp.id_repositor
                INNER JOIN estado_general e ON e.id_estado = rp.id_estado
                LEFT JOIN estado_general ve ON ve.id_estado = v.id_estado
                ORDER BY rp.fecha_reposicion DESC, rp.id_reposicion DESC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateReposicionFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureReposicionReferential($pdo, 'visitas', 'id_visita', $data['id_visita'], 'visita');
            ensureReposicionReferential($pdo, 'repositores', 'id_repositor', $data['id_repositor'], 'repositor');
            ensureReposicionEstado($pdo, $data['id_estado']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO reposiciones (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findReposicionRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateReposicionFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureReposicionReferential($pdo, 'visitas', 'id_visita', $merged['id_visita'], 'visita');
            ensureReposicionReferential($pdo, 'repositores', 'id_repositor', $merged['id_repositor'], 'repositor');
            ensureReposicionEstado($pdo, $merged['id_estado']);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_reposicion_param'] = $id;

            $stmt = $pdo->prepare("UPDATE reposiciones SET {$set} WHERE id_reposicion = :id_reposicion_param");
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

            findReposicionRow($pdo, $id);

            $pdo->beginTransaction();
            $detailStmt = $pdo->prepare("DELETE FROM reposicion_detalle WHERE id_reposicion = ?");
            $detailStmt->execute([$id]);
            $reposicionStmt = $pdo->prepare("DELETE FROM reposiciones WHERE id_reposicion = ?");
            $reposicionStmt->execute([$id]);
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
            'message' => 'No se puede eliminar la reposicion porque esta siendo usada por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La visita, el repositor o el estado seleccionado no existe.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

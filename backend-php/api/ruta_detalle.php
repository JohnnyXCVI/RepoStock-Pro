<?php
/**
 * RepoStock Pro - CRUD de paradas de ruta (detalle)
 * Tabla: reposicion_productos.ruta_detalle
 *
 * GET     -> listar paradas (requiere ?id_ruta=...)
 * POST    -> crear parada
 * PUT     -> actualizar parada (requiere ?id=...)
 * DELETE  -> eliminar parada   (requiere ?id=...)
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
    'id_ruta' => ['label' => 'Ruta', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_punto_venta' => ['label' => 'Punto de venta', 'type' => 'int', 'required' => true, 'min' => 1],
    'orden_visita' => ['label' => 'Orden de visita', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_prioridad' => ['label' => 'Prioridad', 'type' => 'int', 'required' => true, 'min' => 1],
    'hora_estimada_llegada' => ['label' => 'Hora estimada de llegada', 'type' => 'time', 'required' => false],
    'minutos_estimados' => ['label' => 'Minutos estimados en el PDV', 'type' => 'int', 'required' => true, 'min' => 0, 'default' => 30],
    'minutos_traslado_estimados' => ['label' => 'Minutos de traslado', 'type' => 'int', 'required' => true, 'min' => 0, 'default' => 0],
    'motivo_visita' => ['label' => 'Motivo de visita', 'type' => 'string', 'required' => false, 'max' => 200],
    'visitado' => ['label' => 'Estado de visita', 'type' => 'bool', 'default' => 0],
];

function validateRutaDetalleFields(array $fields, array $input, bool $isUpdate): array
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

        if ($def['type'] === 'bool') {
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $data[$name] = $value === null ? 0 : ($value ? 1 : 0);
            continue;
        }

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

function ensureRutaDetalleReferential(PDO $pdo, $table, $column, $value, $label)
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

function assertRutaDetalleUnique(PDO $pdo, $idRuta, $ordenVisita, $excludeId = null)
{
    $sql = "SELECT COUNT(*) FROM ruta_detalle WHERE id_ruta = ? AND orden_visita = ?";
    $params = [$idRuta, $ordenVisita];

    if ($excludeId !== null) {
        $sql .= " AND id_ruta_detalle <> ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ((int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe una parada con ese orden en la ruta.',
        ], 422);
    }
}

function findRutaDetalleRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM ruta_detalle WHERE id_ruta_detalle = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'La parada no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $idRuta = (int) ($_GET['id_ruta'] ?? 0);
            if ($idRuta <= 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El id_ruta es obligatorio.'], 400);
            }

            $stmt = $pdo->prepare("
                SELECT d.*,
                       pv.nombre AS punto_venta_nombre,
                       pv.direccion AS punto_venta_direccion,
                       pv.ciudad AS punto_venta_ciudad,
                       pr.descripcion AS prioridad_nombre,
                       pr.nivel AS prioridad_nivel
                FROM ruta_detalle d
                INNER JOIN puntos_venta pv ON pv.id_punto_venta = d.id_punto_venta
                INNER JOIN prioridad pr ON pr.id_prioridad = d.id_prioridad
                WHERE d.id_ruta = ?
                ORDER BY d.orden_visita ASC, d.id_ruta_detalle ASC
            ");
            $stmt->execute([$idRuta]);

            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateRutaDetalleFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureRutaDetalleReferential($pdo, 'rutas', 'id_ruta', $data['id_ruta'], 'ruta');
            ensureRutaDetalleReferential($pdo, 'puntos_venta', 'id_punto_venta', $data['id_punto_venta'], 'punto de venta');
            ensureRutaDetalleReferential($pdo, 'prioridad', 'id_prioridad', $data['id_prioridad'], 'prioridad');
            assertRutaDetalleUnique($pdo, $data['id_ruta'], $data['orden_visita']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO ruta_detalle (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findRutaDetalleRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateRutaDetalleFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureRutaDetalleReferential($pdo, 'rutas', 'id_ruta', $merged['id_ruta'], 'ruta');
            ensureRutaDetalleReferential($pdo, 'puntos_venta', 'id_punto_venta', $merged['id_punto_venta'], 'punto de venta');
            ensureRutaDetalleReferential($pdo, 'prioridad', 'id_prioridad', $merged['id_prioridad'], 'prioridad');
            assertRutaDetalleUnique($pdo, $merged['id_ruta'], $merged['orden_visita'], $id);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_ruta_detalle_param'] = $id;

            $stmt = $pdo->prepare("UPDATE ruta_detalle SET {$set} WHERE id_ruta_detalle = :id_ruta_detalle_param");
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

            $stmt = $pdo->prepare("DELETE FROM ruta_detalle WHERE id_ruta_detalle = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'La parada no existe.'], 404);
            }

            sendJsonResponse(['status' => 'deleted']);
            break;

        default:
            sendJsonResponse(['status' => 'error', 'message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $e) {
    $mysqlCode = isset($e->errorInfo[1]) ? (int) $e->errorInfo[1] : 0;

    if ($mysqlCode === 1451) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'No se puede eliminar la parada porque esta siendo usada por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La ruta, el punto de venta o la prioridad seleccionada no existe.',
        ], 409);
    }
    if ($mysqlCode === 1062) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe una parada con ese orden en la ruta.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

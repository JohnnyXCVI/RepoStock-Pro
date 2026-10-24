<?php
/**
 * RepoStock Pro - CRUD de Visitas (cabecera)
 * Tabla: reposicion_productos.visitas
 *
 * GET     -> listar visitas con repositor, PDV, estado y resumen de detalle
 * GET opciones=rutas -> listar paradas de ruta disponibles
 * POST    -> crear
 * PUT     -> actualizar (requiere ?id=...)
 * DELETE  -> eliminar visita y su detalle (requiere ?id=...)
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
    'id_ruta_detalle' => ['label' => 'Parada de ruta', 'type' => 'int', 'required' => false, 'min' => 1],
    'id_repositor' => ['label' => 'Repositor', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_punto_venta' => ['label' => 'Punto de venta', 'type' => 'int', 'required' => true, 'min' => 1],
    'fecha_visita' => ['label' => 'Fecha de visita', 'type' => 'date', 'required' => true],
    'hora_llegada' => ['label' => 'Hora de llegada', 'type' => 'datetime', 'required' => false],
    'hora_salida' => ['label' => 'Hora de salida', 'type' => 'datetime', 'required' => false],
    'id_estado' => ['label' => 'Estado', 'type' => 'int', 'required' => true, 'min' => 1],
    'observacion' => ['label' => 'Observacion', 'type' => 'text', 'required' => false, 'max' => 2000],
    'latitud_registro' => ['label' => 'Latitud', 'type' => 'decimal', 'required' => false, 'min' => -90, 'max' => 90],
    'longitud_registro' => ['label' => 'Longitud', 'type' => 'decimal', 'required' => false, 'min' => -180, 'max' => 180],
];

function validateVisitaFields(array $fields, array $input, bool $isUpdate): array
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

        if ($def['type'] === 'decimal') {
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

            $value = (float) $value;
            if (isset($def['min']) && $value < $def['min']) {
                $errors[] = "El campo \"{$label}\" debe ser mayor o igual a {$def['min']}.";
                continue;
            }
            if (isset($def['max']) && $value > $def['max']) {
                $errors[] = "El campo \"{$label}\" debe ser menor o igual a {$def['max']}.";
                continue;
            }

            $data[$name] = round($value, 7);
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

function ensureVisitaReferential(PDO $pdo, $table, $column, $value, $label)
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

function ensureVisitaEstado(PDO $pdo, $idEstado)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM estado_general WHERE id_estado = ? AND entidad = 'VISITA'");
    $stmt->execute([$idEstado]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El estado seleccionado no es valido para una visita.',
        ], 422);
    }
}

function assertVisitaTimes($horaLlegada, $horaSalida)
{
    if ($horaLlegada !== null && $horaSalida !== null && $horaSalida <= $horaLlegada) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La hora de salida debe ser posterior a la hora de llegada.',
        ], 422);
    }
}

function findVisitaRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM visitas WHERE id_visita = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'La visita no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['opciones']) && $_GET['opciones'] === 'rutas') {
                $stmt = $pdo->query("
                    SELECT rd.id_ruta_detalle,
                           rd.id_ruta,
                           rd.id_punto_venta,
                           rd.orden_visita,
                           rd.hora_estimada_llegada,
                           r.fecha AS ruta_fecha,
                           r.descripcion AS ruta_descripcion,
                           r.id_repositor,
                           CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
                           pv.nombre AS punto_venta_nombre,
                           pv.ciudad AS punto_venta_ciudad
                    FROM ruta_detalle rd
                    INNER JOIN rutas r ON r.id_ruta = rd.id_ruta
                    INNER JOIN repositores re ON re.id_repositor = r.id_repositor
                    INNER JOIN puntos_venta pv ON pv.id_punto_venta = rd.id_punto_venta
                    ORDER BY r.fecha DESC, r.id_ruta DESC, rd.orden_visita ASC
                ");
                sendJsonResponse([
                    'status' => 'success',
                    'data' => $stmt->fetchAll(),
                ]);
                break;
            }

            $stmt = $pdo->query("
                SELECT v.*,
                       CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
                       re.documento AS repositor_documento,
                       pv.nombre AS punto_venta_nombre,
                       pv.direccion AS punto_venta_direccion,
                       pv.ciudad AS punto_venta_ciudad,
                       e.descripcion AS estado_nombre,
                       r.id_ruta,
                       r.fecha AS ruta_fecha,
                       r.descripcion AS ruta_descripcion,
                       rd.orden_visita,
                       (SELECT COUNT(*) FROM visita_detalle d WHERE d.id_visita = v.id_visita) AS total_productos,
                       (SELECT COUNT(*) FROM visita_detalle d WHERE d.id_visita = v.id_visita AND d.requiere_reposicion = 1) AS productos_reposicion,
                       (SELECT COUNT(*) FROM visita_detalle d WHERE d.id_visita = v.id_visita AND d.requiere_cambio_precio = 1) AS productos_cambio_precio,
                       (SELECT COALESCE(SUM(d.cantidad_danada), 0) FROM visita_detalle d WHERE d.id_visita = v.id_visita) AS total_danada
                FROM visitas v
                INNER JOIN repositores re ON re.id_repositor = v.id_repositor
                INNER JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
                INNER JOIN estado_general e ON e.id_estado = v.id_estado
                LEFT JOIN ruta_detalle rd ON rd.id_ruta_detalle = v.id_ruta_detalle
                LEFT JOIN rutas r ON r.id_ruta = rd.id_ruta
                ORDER BY v.fecha_visita DESC, v.id_visita DESC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateVisitaFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureVisitaReferential($pdo, 'repositores', 'id_repositor', $data['id_repositor'], 'repositor');
            ensureVisitaReferential($pdo, 'puntos_venta', 'id_punto_venta', $data['id_punto_venta'], 'punto de venta');
            ensureVisitaEstado($pdo, $data['id_estado']);
            if ($data['id_ruta_detalle'] !== null) {
                ensureVisitaReferential($pdo, 'ruta_detalle', 'id_ruta_detalle', $data['id_ruta_detalle'], 'parada de ruta');
            }
            assertVisitaTimes($data['hora_llegada'], $data['hora_salida']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO visitas (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findVisitaRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateVisitaFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureVisitaReferential($pdo, 'repositores', 'id_repositor', $merged['id_repositor'], 'repositor');
            ensureVisitaReferential($pdo, 'puntos_venta', 'id_punto_venta', $merged['id_punto_venta'], 'punto de venta');
            ensureVisitaEstado($pdo, $merged['id_estado']);
            if ($merged['id_ruta_detalle'] !== null) {
                ensureVisitaReferential($pdo, 'ruta_detalle', 'id_ruta_detalle', $merged['id_ruta_detalle'], 'parada de ruta');
            }
            assertVisitaTimes($merged['hora_llegada'], $merged['hora_salida']);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_visita_param'] = $id;

            $stmt = $pdo->prepare("UPDATE visitas SET {$set} WHERE id_visita = :id_visita_param");
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

            findVisitaRow($pdo, $id);

            $pdo->beginTransaction();
            $detailStmt = $pdo->prepare("DELETE FROM visita_detalle WHERE id_visita = ?");
            $detailStmt->execute([$id]);
            $visitStmt = $pdo->prepare("DELETE FROM visitas WHERE id_visita = ?");
            $visitStmt->execute([$id]);
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
            'message' => 'No se puede eliminar la visita porque esta siendo usada por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El repositor, punto de venta, estado o parada de ruta no existe.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

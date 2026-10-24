<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = $GLOBALS['pdo'] ?? null;

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getInput() {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return array();
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return array();
    }
    return $decoded;
}

function normalizeDateTime($value) {
    if ($value === null || $value === '') {
        return null;
    }
    $value = str_replace('T', ' ', trim($value));
    if (strlen($value) === 16) {
        $value .= ':00';
    }
    $timestamp = strtotime($value);
    return $timestamp === false ? null : date('Y-m-d H:i:s', $timestamp);
}

function estadoIncidenciaValido($pdo, $id_estado) {
    $stmt = $pdo->prepare("SELECT id_estado FROM estado_general WHERE id_estado = ? AND entidad = 'INCIDENCIA'");
    $stmt->execute(array($id_estado));
    return (bool)$stmt->fetchColumn();
}

function ensureExists($pdo, $table, $idColumn, $id, $label) {
    $stmt = $pdo->prepare("SELECT `$idColumn` FROM `$table` WHERE `$idColumn` = ?");
    $stmt->execute(array($id));
    if (!$stmt->fetchColumn()) {
        sendJson(array('status' => 'error', 'message' => $label . ' no encontrado'), 422);
    }
}

function nullableInt($value) {
    if ($value === null || $value === '') {
        return null;
    }
    return intval($value);
}

if ($method === 'GET') {
    if (isset($_GET['opciones'])) {
        if ($_GET['opciones'] === 'estados') {
            $stmt = $pdo->query("SELECT id_estado, descripcion FROM estado_general WHERE entidad = 'INCIDENCIA' ORDER BY id_estado ASC");
            sendJson(array('data' => $stmt->fetchAll()));
        }

        if ($_GET['opciones'] === 'visitas') {
            $stmt = $pdo->query("
                SELECT 
                    v.id_visita,
                    v.id_ruta_detalle,
                    v.id_repositor,
                    v.id_punto_venta,
                    v.fecha_visita,
                    v.hora_llegada,
                    v.hora_salida,
                    v.id_estado,
                    pv.nombre AS punto_venta_nombre,
                    CONCAT(r.nombres, ' ', r.apellidos) AS repositor_nombre,
                    eg.descripcion AS visita_estado_nombre
                FROM visitas v
                LEFT JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
                LEFT JOIN repositores r ON r.id_repositor = v.id_repositor
                LEFT JOIN estado_general eg ON eg.id_estado = v.id_estado
                ORDER BY v.fecha_visita DESC, v.id_visita DESC
            ");
            sendJson(array('data' => $stmt->fetchAll()));
        }

        if ($_GET['opciones'] === 'rutas') {
            $stmt = $pdo->query("
                SELECT 
                    rd.id_ruta_detalle,
                    rd.id_ruta,
                    rd.id_punto_venta,
                    rd.orden_visita,
                    rd.motivo_visita,
                    rt.fecha AS ruta_fecha,
                    rt.id_repositor,
                    rt.descripcion AS ruta_descripcion,
                    pv.nombre AS punto_venta_nombre,
                    CONCAT(r.nombres, ' ', r.apellidos) AS repositor_nombre
                FROM ruta_detalle rd
                INNER JOIN rutas rt ON rt.id_ruta = rd.id_ruta
                LEFT JOIN puntos_venta pv ON pv.id_punto_venta = rd.id_punto_venta
                LEFT JOIN repositores r ON r.id_repositor = rt.id_repositor
                ORDER BY rt.fecha DESC, rd.id_ruta DESC, rd.orden_visita ASC
            ");
            sendJson(array('data' => $stmt->fetchAll()));
        }
    }

    $stmt = $pdo->query("
        SELECT 
            i.id_incidencia,
            i.id_visita,
            i.id_ruta_detalle,
            i.id_repositor,
            i.id_tipo_incidente,
            i.fecha_incidencia,
            i.descripcion,
            i.solucion_aplicada,
            i.requiere_nueva_visita,
            i.fecha_nueva_visita,
            i.id_estado,
            v.fecha_visita,
            pv.nombre AS visita_punto_venta_nombre,
            rd.id_ruta,
            rd.orden_visita,
            rt.fecha AS ruta_fecha,
            rt.descripcion AS ruta_descripcion,
            rdpv.nombre AS ruta_punto_venta_nombre,
            COALESCE(pv.nombre, rdpv.nombre) AS punto_venta_nombre,
            CONCAT(r.nombres, ' ', r.apellidos) AS repositor_nombre,
            ti.descripcion AS tipo_incidente_nombre,
            eg.descripcion AS estado_nombre,
            COALESCE((SELECT COUNT(*) FROM incidencia_detalle d WHERE d.id_incidencia = i.id_incidencia), 0) AS total_lineas,
            COALESCE((SELECT SUM(d.cantidad_afectada) FROM incidencia_detalle d WHERE d.id_incidencia = i.id_incidencia), 0) AS total_afectada
        FROM incidencias i
        LEFT JOIN visitas v ON v.id_visita = i.id_visita
        LEFT JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
        LEFT JOIN ruta_detalle rd ON rd.id_ruta_detalle = i.id_ruta_detalle
        LEFT JOIN rutas rt ON rt.id_ruta = rd.id_ruta
        LEFT JOIN puntos_venta rdpv ON rdpv.id_punto_venta = rd.id_punto_venta
        LEFT JOIN repositores r ON r.id_repositor = i.id_repositor
        LEFT JOIN tipo_incidente ti ON ti.id_tipo_incidente = i.id_tipo_incidente
        LEFT JOIN estado_general eg ON eg.id_estado = i.id_estado
        ORDER BY i.id_incidencia DESC
    ");
    sendJson(array('data' => $stmt->fetchAll()));
}

if ($method === 'POST') {
    $input = getInput();
    $id_visita = nullableInt(isset($input['id_visita']) ? $input['id_visita'] : null);
    $id_ruta_detalle = nullableInt(isset($input['id_ruta_detalle']) ? $input['id_ruta_detalle'] : null);
    $id_repositor = isset($input['id_repositor']) ? intval($input['id_repositor']) : 0;
    $id_tipo_incidente = isset($input['id_tipo_incidente']) ? intval($input['id_tipo_incidente']) : 0;
    $fecha_incidencia = isset($input['fecha_incidencia']) ? normalizeDateTime($input['fecha_incidencia']) : date('Y-m-d H:i:s');
    $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';
    $solucion_aplicada = isset($input['solucion_aplicada']) && trim($input['solucion_aplicada']) !== '' ? trim($input['solucion_aplicada']) : null;
    $requiere_nueva_visita = !empty($input['requiere_nueva_visita']) ? 1 : 0;
    $fecha_nueva_visita = isset($input['fecha_nueva_visita']) && $input['fecha_nueva_visita'] !== '' ? $input['fecha_nueva_visita'] : null;
    $id_estado = isset($input['id_estado']) ? intval($input['id_estado']) : 16;

    if ($id_repositor <= 0 || $id_tipo_incidente <= 0 || $descripcion === '') {
        sendJson(array('status' => 'error', 'message' => 'id_repositor, id_tipo_incidente y descripcion son obligatorios'), 422);
    }
    if (!estadoIncidenciaValido($pdo, $id_estado)) {
        sendJson(array('status' => 'error', 'message' => 'Estado de incidencia invalido'), 422);
    }
    if ($fecha_incidencia === null) {
        sendJson(array('status' => 'error', 'message' => 'Fecha de incidencia invalida'), 422);
    }
    if (!$requiere_nueva_visita) {
        $fecha_nueva_visita = null;
    }

    try {
        ensureExists($pdo, 'repositores', 'id_repositor', $id_repositor, 'Repositor');
        ensureExists($pdo, 'tipo_incidente', 'id_tipo_incidente', $id_tipo_incidente, 'Tipo de incidente');
        if ($id_visita !== null) {
            ensureExists($pdo, 'visitas', 'id_visita', $id_visita, 'Visita');
        }
        if ($id_ruta_detalle !== null) {
            ensureExists($pdo, 'ruta_detalle', 'id_ruta_detalle', $id_ruta_detalle, 'Detalle de ruta');
        }

        $stmt = $pdo->prepare("
            INSERT INTO incidencias 
                (id_visita, id_ruta_detalle, id_repositor, id_tipo_incidente, fecha_incidencia, descripcion, solucion_aplicada, requiere_nueva_visita, fecha_nueva_visita, id_estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute(array(
            $id_visita,
            $id_ruta_detalle,
            $id_repositor,
            $id_tipo_incidente,
            $fecha_incidencia,
            $descripcion,
            $solucion_aplicada,
            $requiere_nueva_visita,
            $fecha_nueva_visita,
            $id_estado
        ));
        $id = $pdo->lastInsertId();
        sendJson(array('status' => 'created', 'id' => intval($id)), 201);
    } catch (Exception $e) {
        sendJson(array('status' => 'error', 'message' => $e->getMessage()), 500);
    }
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id requerido'), 400);
    }
    $input = getInput();
    $fields = array();
    $values = array();

    $allowed = array(
        'id_visita',
        'id_ruta_detalle',
        'id_repositor',
        'id_tipo_incidente',
        'fecha_incidencia',
        'descripcion',
        'solucion_aplicada',
        'requiere_nueva_visita',
        'fecha_nueva_visita',
        'id_estado'
    );

    foreach ($allowed as $key) {
        if (!array_key_exists($key, $input)) {
            continue;
        }

        if ($key === 'id_visita' || $key === 'id_ruta_detalle') {
            $fields[] = "$key = ?";
            $values[] = nullableInt($input[$key]);
        } elseif ($key === 'fecha_incidencia') {
            $normalized = normalizeDateTime($input[$key]);
            if ($normalized === null) {
                sendJson(array('status' => 'error', 'message' => 'Fecha de incidencia invalida'), 422);
            }
            $fields[] = "$key = ?";
            $values[] = $normalized;
        } elseif ($key === 'fecha_nueva_visita') {
            $fields[] = "$key = ?";
            $values[] = ($input[$key] === '' || $input[$key] === null) ? null : $input[$key];
        } elseif ($key === 'solucion_aplicada') {
            $fields[] = "$key = ?";
            $values[] = ($input[$key] === null || trim($input[$key]) === '') ? null : trim($input[$key]);
        } elseif ($key === 'descripcion') {
            $value = trim((string)$input[$key]);
            if ($value === '') {
                sendJson(array('status' => 'error', 'message' => 'La descripcion no puede estar vacia'), 422);
            }
            $fields[] = "$key = ?";
            $values[] = $value;
        } elseif ($key === 'requiere_nueva_visita') {
            $fields[] = "$key = ?";
            $values[] = !empty($input[$key]) ? 1 : 0;
        } else {
            $fields[] = "$key = ?";
            $values[] = intval($input[$key]);
        }
    }

    if (empty($fields)) {
        sendJson(array('status' => 'error', 'message' => 'sin campos para actualizar'), 422);
    }
    if (isset($input['id_estado']) && !estadoIncidenciaValido($pdo, intval($input['id_estado']))) {
        sendJson(array('status' => 'error', 'message' => 'Estado de incidencia invalido'), 422);
    }
    if (isset($input['requiere_nueva_visita']) && empty($input['requiere_nueva_visita']) && !array_key_exists('fecha_nueva_visita', $input)) {
        $fields[] = 'fecha_nueva_visita = ?';
        $values[] = null;
    }

    try {
        if (array_key_exists('id_repositor', $input)) {
            ensureExists($pdo, 'repositores', 'id_repositor', intval($input['id_repositor']), 'Repositor');
        }
        if (array_key_exists('id_tipo_incidente', $input)) {
            ensureExists($pdo, 'tipo_incidente', 'id_tipo_incidente', intval($input['id_tipo_incidente']), 'Tipo de incidente');
        }
        if (array_key_exists('id_visita', $input) && $input['id_visita'] !== '' && $input['id_visita'] !== null) {
            ensureExists($pdo, 'visitas', 'id_visita', intval($input['id_visita']), 'Visita');
        }
        if (array_key_exists('id_ruta_detalle', $input) && $input['id_ruta_detalle'] !== '' && $input['id_ruta_detalle'] !== null) {
            ensureExists($pdo, 'ruta_detalle', 'id_ruta_detalle', intval($input['id_ruta_detalle']), 'Detalle de ruta');
        }

        $values[] = $id;
        $sql = 'UPDATE incidencias SET ' . implode(', ', $fields) . ' WHERE id_incidencia = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id_incidencia FROM incidencias WHERE id_incidencia = ?');
            $exists->execute(array($id));
            if (!$exists->fetchColumn()) {
                sendJson(array('status' => 'error', 'message' => 'no encontrado'), 404);
            }
        }
        sendJson(array('status' => 'updated'));
    } catch (Exception $e) {
        sendJson(array('status' => 'error', 'message' => $e->getMessage()), 500);
    }
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id requerido'), 400);
    }

    try {
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM incidencia_detalle WHERE id_incidencia = ?')->execute(array($id));
        $stmt = $pdo->prepare('DELETE FROM incidencias WHERE id_incidencia = ?');
        $stmt->execute(array($id));
        $pdo->commit();
        if ($stmt->rowCount() === 0) {
            sendJson(array('status' => 'error', 'message' => 'no encontrado'), 404);
        }
        sendJson(array('status' => 'deleted'));
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendJson(array('status' => 'error', 'message' => $e->getMessage()), 500);
    }
}

sendJson(array('status' => 'error', 'message' => 'metodo no soportado'), 405);

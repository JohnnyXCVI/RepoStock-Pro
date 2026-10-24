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

function nullableInt($value) {
    if ($value === null || $value === '') {
        return null;
    }
    return intval($value);
}

function ensureExists($pdo, $table, $idColumn, $id, $label) {
    $stmt = $pdo->prepare("SELECT `$idColumn` FROM `$table` WHERE `$idColumn` = ?");
    $stmt->execute(array($id));
    if (!$stmt->fetchColumn()) {
        sendJson(array('status' => 'error', 'message' => $label . ' no encontrado'), 422);
    }
}

if ($method === 'GET') {
    $id_incidencia = isset($_GET['id_incidencia']) ? intval($_GET['id_incidencia']) : 0;
    if ($id_incidencia <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id_incidencia requerido'), 400);
    }

    $stmt = $pdo->prepare("
        SELECT 
            d.id_incidencia_detalle,
            d.id_incidencia,
            d.id_producto,
            d.id_motivo,
            d.cantidad_afectada,
            d.descripcion,
            p.codigo AS producto_codigo,
            p.descripcion AS producto_nombre,
            um.abreviatura AS producto_unidad,
            m.descripcion AS motivo_nombre
        FROM incidencia_detalle d
        LEFT JOIN productos p ON p.id_producto = d.id_producto
        LEFT JOIN unidad_medida um ON um.id_unidad = p.id_unidad
        LEFT JOIN motivo_incidencia m ON m.id_motivo = d.id_motivo
        WHERE d.id_incidencia = ?
        ORDER BY d.id_incidencia_detalle ASC
    ");
    $stmt->execute(array($id_incidencia));
    sendJson(array('data' => $stmt->fetchAll()));
}

if ($method === 'POST') {
    $input = getInput();
    $id_incidencia = isset($input['id_incidencia']) ? intval($input['id_incidencia']) : 0;
    $id_producto = nullableInt(isset($input['id_producto']) ? $input['id_producto'] : null);
    $id_motivo = isset($input['id_motivo']) ? intval($input['id_motivo']) : 0;
    $cantidad_afectada = isset($input['cantidad_afectada']) ? floatval($input['cantidad_afectada']) : 0;
    $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';

    if ($id_incidencia <= 0 || $id_motivo <= 0 || $descripcion === '') {
        sendJson(array('status' => 'error', 'message' => 'id_incidencia, id_motivo y descripcion son obligatorios'), 422);
    }
    if ($cantidad_afectada < 0) {
        sendJson(array('status' => 'error', 'message' => 'La cantidad afectada no puede ser negativa'), 422);
    }
    if (strlen($descripcion) > 500) {
        sendJson(array('status' => 'error', 'message' => 'La descripcion no puede superar los 500 caracteres'), 422);
    }

    try {
        ensureExists($pdo, 'incidencias', 'id_incidencia', $id_incidencia, 'Incidencia');
        ensureExists($pdo, 'motivo_incidencia', 'id_motivo', $id_motivo, 'Motivo de incidencia');
        if ($id_producto !== null) {
            ensureExists($pdo, 'productos', 'id_producto', $id_producto, 'Producto');
        }

        $stmt = $pdo->prepare("
            INSERT INTO incidencia_detalle
                (id_incidencia, id_producto, id_motivo, cantidad_afectada, descripcion)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute(array($id_incidencia, $id_producto, $id_motivo, $cantidad_afectada, $descripcion));
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

    if (array_key_exists('id_producto', $input)) {
        $fields[] = 'id_producto = ?';
        $values[] = nullableInt($input['id_producto']);
    }
    if (array_key_exists('id_motivo', $input)) {
        $fields[] = 'id_motivo = ?';
        $values[] = intval($input['id_motivo']);
    }
    if (array_key_exists('cantidad_afectada', $input)) {
        $fields[] = 'cantidad_afectada = ?';
        $values[] = floatval($input['cantidad_afectada']);
    }
    if (array_key_exists('descripcion', $input)) {
        $descripcion = trim((string)$input['descripcion']);
        if ($descripcion === '') {
            sendJson(array('status' => 'error', 'message' => 'La descripcion no puede estar vacia'), 422);
        }
        if (strlen($descripcion) > 500) {
            sendJson(array('status' => 'error', 'message' => 'La descripcion no puede superar los 500 caracteres'), 422);
        }
        $fields[] = 'descripcion = ?';
        $values[] = $descripcion;
    }

    if (empty($fields)) {
        sendJson(array('status' => 'error', 'message' => 'sin campos para actualizar'), 422);
    }
    if (array_key_exists('cantidad_afectada', $input) && floatval($input['cantidad_afectada']) < 0) {
        sendJson(array('status' => 'error', 'message' => 'La cantidad afectada no puede ser negativa'), 422);
    }

    try {
        if (array_key_exists('id_producto', $input) && $input['id_producto'] !== '' && $input['id_producto'] !== null) {
            ensureExists($pdo, 'productos', 'id_producto', intval($input['id_producto']), 'Producto');
        }
        if (array_key_exists('id_motivo', $input)) {
            ensureExists($pdo, 'motivo_incidencia', 'id_motivo', intval($input['id_motivo']), 'Motivo de incidencia');
        }

        $values[] = $id;
        $sql = 'UPDATE incidencia_detalle SET ' . implode(', ', $fields) . ' WHERE id_incidencia_detalle = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id_incidencia_detalle FROM incidencia_detalle WHERE id_incidencia_detalle = ?');
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
    $stmt = $pdo->prepare('DELETE FROM incidencia_detalle WHERE id_incidencia_detalle = ?');
    $stmt->execute(array($id));
    if ($stmt->rowCount() === 0) {
        sendJson(array('status' => 'error', 'message' => 'no encontrado'), 404);
    }
    sendJson(array('status' => 'deleted'));
}

sendJson(array('status' => 'error', 'message' => 'metodo no soportado'), 405);

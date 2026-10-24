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

if ($method === 'GET') {
    $id_pedido = isset($_GET['id_pedido']) ? intval($_GET['id_pedido']) : 0;
    if ($id_pedido <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id_pedido requerido'), 400);
    }

    $stmt = $pdo->prepare("
        SELECT 
            pd.id_pedido_detalle,
            pd.id_pedido,
            pd.id_producto,
            pd.cantidad_solicitada,
            pd.cantidad_recibida,
            pd.precio_unitario,
            pr.codigo AS producto_codigo,
            pr.descripcion AS producto_nombre,
            um.abreviatura AS producto_unidad
        FROM pedido_detalle pd
        LEFT JOIN productos pr ON pr.id_producto = pd.id_producto
        LEFT JOIN unidad_medida um ON um.id_unidad = pr.id_unidad
        WHERE pd.id_pedido = ?
        ORDER BY pd.id_pedido_detalle ASC
    ");
    $stmt->execute(array($id_pedido));
    sendJson(array('data' => $stmt->fetchAll()));
}

if ($method === 'POST') {
    $input = getInput();
    $id_pedido = isset($input['id_pedido']) ? intval($input['id_pedido']) : 0;
    $id_producto = isset($input['id_producto']) ? intval($input['id_producto']) : 0;
    $cantidad_solicitada = isset($input['cantidad_solicitada']) ? floatval($input['cantidad_solicitada']) : 0;
    $cantidad_recibida = isset($input['cantidad_recibida']) ? floatval($input['cantidad_recibida']) : 0;
    $precio_unitario = isset($input['precio_unitario']) ? floatval($input['precio_unitario']) : 0;

    if ($id_pedido <= 0 || $id_producto <= 0 || $cantidad_solicitada <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id_pedido, id_producto y cantidad_solicitada > 0 son obligatorios'), 422);
    }
    if ($cantidad_recibida < 0 || $precio_unitario < 0) {
        sendJson(array('status' => 'error', 'message' => 'Las cantidades recibidas y el precio no pueden ser negativos'), 422);
    }

    $checkPedido = $pdo->prepare('SELECT id_pedido FROM pedidos WHERE id_pedido = ?');
    $checkPedido->execute(array($id_pedido));
    if (!$checkPedido->fetchColumn()) {
        sendJson(array('status' => 'error', 'message' => 'Pedido no encontrado'), 422);
    }
    $checkProducto = $pdo->prepare('SELECT id_producto FROM productos WHERE id_producto = ?');
    $checkProducto->execute(array($id_producto));
    if (!$checkProducto->fetchColumn()) {
        sendJson(array('status' => 'error', 'message' => 'Producto no encontrado'), 422);
    }

    $check = $pdo->prepare('SELECT id_pedido_detalle FROM pedido_detalle WHERE id_pedido = ? AND id_producto = ?');
    $check->execute(array($id_pedido, $id_producto));
    if ($check->fetch()) {
        sendJson(array('status' => 'error', 'message' => 'El producto ya esta registrado en este pedido'), 422);
    }

    $stmt = $pdo->prepare("INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad_solicitada, cantidad_recibida, precio_unitario) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute(array($id_pedido, $id_producto, $cantidad_solicitada, $cantidad_recibida, $precio_unitario));
    $id = $pdo->lastInsertId();
    sendJson(array('status' => 'created', 'id' => intval($id)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id requerido'), 400);
    }
    $input = getInput();
    $fields = array();
    $values = array();

    if (array_key_exists('cantidad_solicitada', $input)) {
        $fields[] = 'cantidad_solicitada = ?';
        $values[] = floatval($input['cantidad_solicitada']);
    }
    if (array_key_exists('cantidad_recibida', $input)) {
        $fields[] = 'cantidad_recibida = ?';
        $values[] = floatval($input['cantidad_recibida']);
    }
    if (array_key_exists('precio_unitario', $input)) {
        $fields[] = 'precio_unitario = ?';
        $values[] = floatval($input['precio_unitario']);
    }

    if (empty($fields)) {
        sendJson(array('status' => 'error', 'message' => 'sin campos para actualizar'), 422);
    }
    if (array_key_exists('cantidad_solicitada', $input) && floatval($input['cantidad_solicitada']) <= 0) {
        sendJson(array('status' => 'error', 'message' => 'cantidad_solicitada debe ser mayor a 0'), 422);
    }
    if (array_key_exists('cantidad_recibida', $input) && floatval($input['cantidad_recibida']) < 0) {
        sendJson(array('status' => 'error', 'message' => 'cantidad_recibida no puede ser negativa'), 422);
    }
    if (array_key_exists('precio_unitario', $input) && floatval($input['precio_unitario']) < 0) {
        sendJson(array('status' => 'error', 'message' => 'precio_unitario no puede ser negativo'), 422);
    }

    $values[] = $id;
    $sql = 'UPDATE pedido_detalle SET ' . implode(', ', $fields) . ' WHERE id_pedido_detalle = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $exists = $pdo->prepare('SELECT id_pedido_detalle FROM pedido_detalle WHERE id_pedido_detalle = ?');
        $exists->execute(array($id));
        if (!$exists->fetchColumn()) {
            sendJson(array('status' => 'error', 'message' => 'no encontrado'), 404);
        }
    }
    sendJson(array('status' => 'updated'));
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id requerido'), 400);
    }
    $stmt = $pdo->prepare('DELETE FROM pedido_detalle WHERE id_pedido_detalle = ?');
    $stmt->execute(array($id));
    if ($stmt->rowCount() === 0) {
        sendJson(array('status' => 'error', 'message' => 'no encontrado'), 404);
    }
    sendJson(array('status' => 'deleted'));
}

sendJson(array('status' => 'error', 'message' => 'metodo no soportado'), 405);

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

function estadoPedidoValido($pdo, $id_estado) {
    $stmt = $pdo->prepare("SELECT id_estado FROM estado_general WHERE id_estado = ? AND entidad = 'PEDIDO'");
    $stmt->execute(array($id_estado));
    return (bool)$stmt->fetchColumn();
}

function generateNumeroPedido($pdo) {
    $prefix = 'PED-' . date('Ym') . '-';
    $stmt = $pdo->prepare("SELECT numero_pedido FROM pedidos WHERE numero_pedido LIKE ? ORDER BY id_pedido DESC LIMIT 1");
    $stmt->execute(array($prefix . '%'));
    $last = $stmt->fetchColumn();
    if ($last && preg_match('/-(\d+)$/', $last, $m)) {
        $num = intval($m[1]) + 1;
    } else {
        $num = 1;
    }
    return $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    if (isset($_GET['opciones']) && $_GET['opciones'] === 'estados') {
        $stmt = $pdo->query("SELECT id_estado, descripcion FROM estado_general WHERE entidad = 'PEDIDO' ORDER BY id_estado ASC");
        sendJson(array('data' => $stmt->fetchAll()));
    }

    $stmt = $pdo->query("
        SELECT 
            p.id_pedido,
            p.numero_pedido,
            p.id_punto_venta,
            p.id_repositor,
            p.fecha_pedido,
            p.fecha_entrega_prevista,
            p.id_estado,
            p.observacion,
            pv.nombre AS punto_venta_nombre,
            r.nombres AS repositor_nombres,
            r.apellidos AS repositor_apellidos,
            eg.descripcion AS estado_nombre,
            COALESCE((SELECT COUNT(*) FROM pedido_detalle pd WHERE pd.id_pedido = p.id_pedido), 0) AS total_lineas,
            COALESCE((SELECT SUM(pd.cantidad_solicitada * pd.precio_unitario) FROM pedido_detalle pd WHERE pd.id_pedido = p.id_pedido), 0) AS monto_total
        FROM pedidos p
        LEFT JOIN puntos_venta pv ON pv.id_punto_venta = p.id_punto_venta
        LEFT JOIN repositores r ON r.id_repositor = p.id_repositor
        LEFT JOIN estado_general eg ON eg.id_estado = p.id_estado
        ORDER BY p.id_pedido DESC
    ");
    sendJson(array('data' => $stmt->fetchAll()));
}

if ($method === 'POST') {
    $input = getInput();
    $id_punto_venta = isset($input['id_punto_venta']) ? intval($input['id_punto_venta']) : 0;
    $id_repositor = isset($input['id_repositor']) ? intval($input['id_repositor']) : 0;
    $id_estado = isset($input['id_estado']) ? intval($input['id_estado']) : 12;
    $fecha_pedido = isset($input['fecha_pedido']) ? normalizeDateTime($input['fecha_pedido']) : date('Y-m-d H:i:s');
    $fecha_entrega_prevista = isset($input['fecha_entrega_prevista']) && $input['fecha_entrega_prevista'] !== '' ? $input['fecha_entrega_prevista'] : null;
    $observacion = isset($input['observacion']) ? trim($input['observacion']) : null;

    if ($id_punto_venta <= 0 || $id_repositor <= 0) {
        sendJson(array('status' => 'error', 'message' => 'id_punto_venta e id_repositor son obligatorios'), 422);
    }
    if (!estadoPedidoValido($pdo, $id_estado)) {
        sendJson(array('status' => 'error', 'message' => 'Estado de pedido invalido'), 422);
    }
    if ($fecha_pedido === null) {
        sendJson(array('status' => 'error', 'message' => 'Fecha de pedido invalida'), 422);
    }

    try {
        $checkPdv = $pdo->prepare('SELECT id_punto_venta FROM puntos_venta WHERE id_punto_venta = ?');
        $checkPdv->execute(array($id_punto_venta));
        if (!$checkPdv->fetchColumn()) {
            sendJson(array('status' => 'error', 'message' => 'Punto de venta no encontrado'), 422);
        }
        $checkRepositor = $pdo->prepare('SELECT id_repositor FROM repositores WHERE id_repositor = ?');
        $checkRepositor->execute(array($id_repositor));
        if (!$checkRepositor->fetchColumn()) {
            sendJson(array('status' => 'error', 'message' => 'Repositor no encontrado'), 422);
        }

        $pdo->beginTransaction();
        $numero_pedido = generateNumeroPedido($pdo);
        $stmt = $pdo->prepare("INSERT INTO pedidos (numero_pedido, id_punto_venta, id_repositor, fecha_pedido, fecha_entrega_prevista, id_estado, observacion) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(array($numero_pedido, $id_punto_venta, $id_repositor, $fecha_pedido, $fecha_entrega_prevista, $id_estado, $observacion));
        $id_pedido = $pdo->lastInsertId();
        $pdo->commit();
        sendJson(array('status' => 'created', 'id' => intval($id_pedido), 'numero_pedido' => $numero_pedido), 201);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
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

    $allowed = array('id_punto_venta', 'id_repositor', 'fecha_pedido', 'fecha_entrega_prevista', 'id_estado', 'observacion');
    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            if ($key === 'fecha_entrega_prevista') {
                $fields[] = "$key = ?";
                $values[] = ($input[$key] === '' || $input[$key] === null) ? null : $input[$key];
            } elseif ($key === 'fecha_pedido') {
                $normalized = normalizeDateTime($input[$key]);
                if ($normalized === null) {
                    sendJson(array('status' => 'error', 'message' => 'Fecha de pedido invalida'), 422);
                }
                $fields[] = "$key = ?";
                $values[] = $normalized;
            } elseif ($key === 'observacion') {
                $fields[] = "$key = ?";
                $values[] = ($input[$key] === null) ? null : trim($input[$key]);
            } else {
                $fields[] = "$key = ?";
                $values[] = intval($input[$key]);
            }
        }
    }

    if (empty($fields)) {
        sendJson(array('status' => 'error', 'message' => 'sin campos para actualizar'), 422);
    }
    if (isset($input['id_estado']) && !estadoPedidoValido($pdo, intval($input['id_estado']))) {
        sendJson(array('status' => 'error', 'message' => 'Estado de pedido invalido'), 422);
    }

    try {
        $values[] = $id;
        $sql = 'UPDATE pedidos SET ' . implode(', ', $fields) . ' WHERE id_pedido = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id_pedido FROM pedidos WHERE id_pedido = ?');
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
        $pdo->prepare('DELETE FROM pedido_detalle WHERE id_pedido = ?')->execute(array($id));
        $stmt = $pdo->prepare('DELETE FROM pedidos WHERE id_pedido = ?');
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

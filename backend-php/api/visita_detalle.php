<?php
/**
 * RepoStock Pro - CRUD de detalle de visitas
 * Tabla: reposicion_productos.visita_detalle
 *
 * GET     -> listar productos auditados (requiere ?id_visita=...)
 * POST    -> crear
 * PUT     -> actualizar (requiere ?id=...)
 * DELETE  -> eliminar (requiere ?id=...)
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
    'id_producto' => ['label' => 'Producto', 'type' => 'int', 'required' => true, 'min' => 1],
    'stock_gondola' => ['label' => 'Stock en gondola', 'type' => 'decimal', 'required' => true, 'min' => 0, 'scale' => 3, 'default' => 0],
    'stock_deposito' => ['label' => 'Stock en deposito', 'type' => 'decimal', 'required' => true, 'min' => 0, 'scale' => 3, 'default' => 0],
    'cantidad_danada' => ['label' => 'Cantidad danada', 'type' => 'decimal', 'required' => true, 'min' => 0, 'scale' => 3, 'default' => 0],
    'precio_cartel' => ['label' => 'Precio de cartel', 'type' => 'decimal', 'required' => false, 'min' => 0, 'scale' => 2],
    'precio_esperado' => ['label' => 'Precio esperado', 'type' => 'decimal', 'required' => false, 'min' => 0, 'scale' => 2],
    'fecha_vencimiento_mas_proxima' => ['label' => 'Vencimiento mas proximo', 'type' => 'date', 'required' => false],
    'requiere_reposicion' => ['label' => 'Requiere reposicion', 'type' => 'bool', 'default' => 0],
    'requiere_cambio_precio' => ['label' => 'Requiere cambio de precio', 'type' => 'bool', 'default' => 0],
    'observacion' => ['label' => 'Observacion', 'type' => 'text', 'required' => false, 'max' => 500],
];

function validateVisitaDetalleFields(array $fields, array $input, bool $isUpdate): array
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

            $scale = isset($def['scale']) ? (int) $def['scale'] : 3;
            $data[$name] = number_format($value, $scale, '.', '');
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

function ensureVisitaDetalleReferential(PDO $pdo, $table, $column, $value, $label)
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

function assertVisitaDetalleUnique(PDO $pdo, $idVisita, $idProducto, $excludeId = null)
{
    $sql = "SELECT COUNT(*) FROM visita_detalle WHERE id_visita = ? AND id_producto = ?";
    $params = [$idVisita, $idProducto];

    if ($excludeId !== null) {
        $sql .= " AND id_visita_detalle <> ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ((int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El producto ya esta registrado en esta visita.',
        ], 422);
    }
}

function findVisitaDetalleRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM visita_detalle WHERE id_visita_detalle = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'El producto de la visita no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $idVisita = (int) ($_GET['id_visita'] ?? 0);
            if ($idVisita <= 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El id_visita es obligatorio.'], 400);
            }

            $stmt = $pdo->prepare("
                SELECT d.*,
                       p.codigo AS producto_codigo,
                       p.descripcion AS producto_descripcion,
                       p.precio_referencia AS producto_precio_referencia,
                       p.stock_minimo_gondola AS producto_stock_minimo,
                       p.stock_objetivo_gondola AS producto_stock_objetivo
                FROM visita_detalle d
                INNER JOIN productos p ON p.id_producto = d.id_producto
                WHERE d.id_visita = ?
                ORDER BY p.descripcion ASC, d.id_visita_detalle ASC
            ");
            $stmt->execute([$idVisita]);

            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateVisitaDetalleFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureVisitaDetalleReferential($pdo, 'visitas', 'id_visita', $data['id_visita'], 'visita');
            ensureVisitaDetalleReferential($pdo, 'productos', 'id_producto', $data['id_producto'], 'producto');
            assertVisitaDetalleUnique($pdo, $data['id_visita'], $data['id_producto']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO visita_detalle (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findVisitaDetalleRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateVisitaDetalleFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureVisitaDetalleReferential($pdo, 'visitas', 'id_visita', $merged['id_visita'], 'visita');
            ensureVisitaDetalleReferential($pdo, 'productos', 'id_producto', $merged['id_producto'], 'producto');
            assertVisitaDetalleUnique($pdo, $merged['id_visita'], $merged['id_producto'], $id);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_visita_detalle_param'] = $id;

            $stmt = $pdo->prepare("UPDATE visita_detalle SET {$set} WHERE id_visita_detalle = :id_visita_detalle_param");
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

            $stmt = $pdo->prepare("DELETE FROM visita_detalle WHERE id_visita_detalle = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El producto de la visita no existe.'], 404);
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
            'message' => 'No se puede eliminar el producto porque esta siendo usado por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La visita o el producto seleccionado no existe.',
        ], 409);
    }
    if ($mysqlCode === 1062) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El producto ya esta registrado en esta visita.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

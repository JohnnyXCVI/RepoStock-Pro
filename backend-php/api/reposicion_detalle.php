<?php
/**
 * RepoStock Pro - CRUD de detalle de reposiciones
 * Tabla: reposicion_productos.reposicion_detalle
 *
 * GET     -> listar productos de una reposicion (requiere ?id_reposicion=...)
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
    'id_reposicion' => ['label' => 'Reposicion', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_producto' => ['label' => 'Producto', 'type' => 'int', 'required' => true, 'min' => 1],
    'cantidad_repuesta' => ['label' => 'Cantidad repuesta', 'type' => 'decimal', 'required' => true, 'min' => 0, 'scale' => 3],
    'cantidad_retirada' => ['label' => 'Cantidad retirada', 'type' => 'decimal', 'required' => false, 'min' => 0, 'scale' => 3, 'default' => 0],
    'observacion' => ['label' => 'Observacion', 'type' => 'text', 'required' => false, 'max' => 300],
];

function validateReposicionDetalleFields(array $fields, array $input, bool $isUpdate): array
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

function ensureReposicionDetalleReferential(PDO $pdo, $table, $column, $value, $label)
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

function assertReposicionDetalleUnique(PDO $pdo, $idReposicion, $idProducto, $excludeId = null)
{
    $sql = "SELECT COUNT(*) FROM reposicion_detalle WHERE id_reposicion = ? AND id_producto = ?";
    $params = [$idReposicion, $idProducto];

    if ($excludeId !== null) {
        $sql .= " AND id_reposicion_detalle <> ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ((int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El producto ya esta registrado en esta reposicion.',
        ], 422);
    }
}

function findReposicionDetalleRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM reposicion_detalle WHERE id_reposicion_detalle = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'El producto de la reposicion no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $idReposicion = (int) ($_GET['id_reposicion'] ?? 0);
            if ($idReposicion <= 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El id_reposicion es obligatorio.'], 400);
            }

            $stmt = $pdo->prepare("
                SELECT d.*,
                       p.codigo AS producto_codigo,
                       p.descripcion AS producto_descripcion,
                       p.precio_referencia AS producto_precio_referencia,
                       p.stock_minimo_gondola AS producto_stock_minimo,
                       p.stock_objetivo_gondola AS producto_stock_objetivo,
                       u.abreviatura AS producto_unidad
                FROM reposicion_detalle d
                INNER JOIN productos p ON p.id_producto = d.id_producto
                LEFT JOIN unidad_medida u ON u.id_unidad = p.id_unidad
                WHERE d.id_reposicion = ?
                ORDER BY p.descripcion ASC, d.id_reposicion_detalle ASC
            ");
            $stmt->execute([$idReposicion]);

            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateReposicionDetalleFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureReposicionDetalleReferential($pdo, 'reposiciones', 'id_reposicion', $data['id_reposicion'], 'reposicion');
            ensureReposicionDetalleReferential($pdo, 'productos', 'id_producto', $data['id_producto'], 'producto');
            assertReposicionDetalleUnique($pdo, $data['id_reposicion'], $data['id_producto']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO reposicion_detalle (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findReposicionDetalleRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateReposicionDetalleFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureReposicionDetalleReferential($pdo, 'reposiciones', 'id_reposicion', $merged['id_reposicion'], 'reposicion');
            ensureReposicionDetalleReferential($pdo, 'productos', 'id_producto', $merged['id_producto'], 'producto');
            assertReposicionDetalleUnique($pdo, $merged['id_reposicion'], $merged['id_producto'], $id);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_reposicion_detalle_param'] = $id;

            $stmt = $pdo->prepare("UPDATE reposicion_detalle SET {$set} WHERE id_reposicion_detalle = :id_reposicion_detalle_param");
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

            $stmt = $pdo->prepare("DELETE FROM reposicion_detalle WHERE id_reposicion_detalle = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El producto de la reposicion no existe.'], 404);
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
            'message' => 'La reposicion o el producto seleccionado no existe.',
        ], 409);
    }
    if ($mysqlCode === 1062) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El producto ya esta registrado en esta reposicion.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

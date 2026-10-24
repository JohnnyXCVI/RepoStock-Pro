<?php
/**
 * RepoStock Pro - CRUD de Productos
 * Tabla: reposicion_productos.productos
 *
 * GET     -> listar (incluye categoria, marca y unidad)
 * POST    -> crear
 * PUT     -> actualizar (requiere ?id=...)
 * DELETE  -> eliminar   (requiere ?id=...)
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
    'codigo' => ['label' => 'Codigo', 'type' => 'string', 'required' => true, 'max' => 50],
    'codigo_barras' => ['label' => 'Codigo de barras', 'type' => 'string', 'required' => false, 'max' => 80],
    'descripcion' => ['label' => 'Descripcion', 'type' => 'string', 'required' => true, 'max' => 180],
    'id_categoria' => ['label' => 'Categoria', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_marca' => ['label' => 'Marca', 'type' => 'int', 'required' => false, 'min' => 1],
    'id_unidad' => ['label' => 'Unidad de medida', 'type' => 'int', 'required' => true, 'min' => 1],
    'dias_alerta_vencimiento' => ['label' => 'Dias de alerta de vencimiento', 'type' => 'int', 'required' => true, 'min' => 0, 'default' => 30],
    'stock_minimo_gondola' => ['label' => 'Stock minimo de gondola', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 0, 'decimals' => 3],
    'stock_objetivo_gondola' => ['label' => 'Stock objetivo de gondola', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 10, 'decimals' => 3],
    'precio_referencia' => ['label' => 'Precio de referencia', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 0, 'decimals' => 2],
    'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
];

/**
 * @return array{0: array<string, mixed>, 1: array<int, string>}
 */
function validateProductoFields(array $fields, array $input, bool $isUpdate): array
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
            $value = round((float) $value, isset($def['decimals']) ? (int) $def['decimals'] : 3);
            if (isset($def['min']) && $value < $def['min']) {
                $errors[] = "El campo \"{$label}\" debe ser mayor o igual a {$def['min']}.";
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

function ensureProductoReferential(PDO $pdo, $table, $column, $value, $label)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE `{$column}` = ?");
    $stmt->execute([$value]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => "La {$label} seleccionada no existe.",
        ], 422);
    }
}

function assertProductoUnique(PDO $pdo, array $data, $excludeId = null)
{
    if (array_key_exists('codigo', $data) && $data['codigo'] !== null) {
        $sql = "SELECT COUNT(*) FROM productos WHERE codigo = ?";
        $params = [$data['codigo']];
        if ($excludeId !== null) {
            $sql .= " AND id_producto <> ?";
            $params[] = $excludeId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ((int) $stmt->fetchColumn()) {
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Ya existe un producto con ese codigo.',
            ], 422);
        }
    }

    if (array_key_exists('codigo_barras', $data) && $data['codigo_barras'] !== null) {
        $sql = "SELECT COUNT(*) FROM productos WHERE codigo_barras = ?";
        $params = [$data['codigo_barras']];
        if ($excludeId !== null) {
            $sql .= " AND id_producto <> ?";
            $params[] = $excludeId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ((int) $stmt->fetchColumn()) {
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Ya existe un producto con ese codigo de barras.',
            ], 422);
        }
    }
}

function productRowExists(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM productos WHERE id_producto = ?");
    $stmt->execute([$id]);
    return (int) $stmt->fetchColumn() > 0;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT p.*,
                       c.descripcion AS categoria_nombre,
                       m.descripcion AS marca_nombre,
                       u.descripcion AS unidad_nombre,
                       u.abreviatura AS unidad_abreviatura
                FROM productos p
                INNER JOIN categoria_producto c ON c.id_categoria = p.id_categoria
                LEFT JOIN marca m ON m.id_marca = p.id_marca
                INNER JOIN unidad_medida u ON u.id_unidad = p.id_unidad
                ORDER BY p.descripcion ASC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateProductoFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureProductoReferential($pdo, 'categoria_producto', 'id_categoria', $data['id_categoria'], 'categoria');
            ensureProductoReferential($pdo, 'unidad_medida', 'id_unidad', $data['id_unidad'], 'unidad de medida');
            if (array_key_exists('id_marca', $data) && $data['id_marca'] !== null) {
                ensureProductoReferential($pdo, 'marca', 'id_marca', $data['id_marca'], 'marca');
            }

            assertProductoUnique($pdo, $data);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO productos (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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
            if (!productRowExists($pdo, $id)) {
                sendJsonResponse(['status' => 'error', 'message' => 'El producto no existe.'], 404);
            }

            $input = getJsonInput();
            [$data, $errors] = validateProductoFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            if (array_key_exists('id_categoria', $data)) {
                ensureProductoReferential($pdo, 'categoria_producto', 'id_categoria', $data['id_categoria'], 'categoria');
            }
            if (array_key_exists('id_unidad', $data)) {
                ensureProductoReferential($pdo, 'unidad_medida', 'id_unidad', $data['id_unidad'], 'unidad de medida');
            }
            if (array_key_exists('id_marca', $data) && $data['id_marca'] !== null) {
                ensureProductoReferential($pdo, 'marca', 'id_marca', $data['id_marca'], 'marca');
            }

            assertProductoUnique($pdo, $data, $id);

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_producto_param'] = $id;

            $stmt = $pdo->prepare("UPDATE productos SET {$set} WHERE id_producto = :id_producto_param");
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

            $stmt = $pdo->prepare("DELETE FROM productos WHERE id_producto = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El producto no existe.'], 404);
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
            'message' => 'No se puede eliminar el producto porque tiene asignaciones por punto de venta.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La categoria, marca o unidad de medida seleccionada no existe.',
        ], 409);
    }
    if ($mysqlCode === 1062) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe un producto con el mismo codigo o codigo de barras.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

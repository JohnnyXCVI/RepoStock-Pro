<?php
/**
 * RepoStock Pro - CRUD de Productos por Punto de Venta
 * Tabla: reposicion_productos.producto_punto_venta
 *
 * GET     -> listar (incluye producto y punto de venta)
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
    'id_producto' => ['label' => 'Producto', 'type' => 'int', 'required' => true, 'min' => 1],
    'id_punto_venta' => ['label' => 'Punto de venta', 'type' => 'int', 'required' => true, 'min' => 1],
    'precio_esperado' => ['label' => 'Precio esperado', 'type' => 'decimal', 'required' => true, 'min' => 0, 'decimals' => 2],
    'fecha_vigencia_desde' => ['label' => 'Fecha de vigencia desde', 'type' => 'date', 'required' => true],
    'fecha_vigencia_hasta' => ['label' => 'Fecha de vigencia hasta', 'type' => 'date', 'required' => false],
    'stock_minimo' => ['label' => 'Stock minimo', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 0, 'decimals' => 3],
    'stock_objetivo' => ['label' => 'Stock objetivo', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 10, 'decimals' => 3],
    'activo' => ['label' => 'Activo', 'type' => 'bool', 'default' => 1],
];

/**
 * @return array{0: array<string, mixed>, 1: array<int, string>}
 */
function validateProductoPuntoVentaFields(array $fields, array $input, bool $isUpdate): array
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
            $parsed = DateTime::createFromFormat('Y-m-d', $value);
            if (!$parsed || $parsed->format('Y-m-d') !== $value) {
                $errors[] = "El campo \"{$label}\" debe tener formato AAAA-MM-DD.";
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

function validateProductoPuntoVentaRange($desde, $hasta)
{
    if ($desde !== null && $hasta !== null && $hasta < $desde) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La fecha de vigencia hasta no puede ser anterior a la fecha desde.',
        ], 422);
    }
}

function ensureProductoPuntoVentaReferential(PDO $pdo, $table, $column, $value, $label)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE `{$column}` = ?");
    $stmt->execute([$value]);
    if (!(int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => "El {$label} seleccionado no existe.",
        ], 422);
    }
}

function assertProductoPuntoVentaUnique(PDO $pdo, $productoId, $puntoVentaId, $desde, $excludeId = null)
{
    $sql = "SELECT COUNT(*) FROM producto_punto_venta
            WHERE id_producto = ? AND id_punto_venta = ? AND fecha_vigencia_desde = ?";
    $params = [$productoId, $puntoVentaId, $desde];

    if ($excludeId !== null) {
        $sql .= " AND id_producto_pv <> ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ((int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe una asignacion para ese producto y punto de venta con la misma fecha de vigencia.',
        ], 422);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT ppv.*,
                       pr.codigo AS producto_codigo,
                       pr.descripcion AS producto_descripcion,
                       pdv.nombre AS punto_venta_nombre
                FROM producto_punto_venta ppv
                INNER JOIN productos pr ON pr.id_producto = ppv.id_producto
                INNER JOIN puntos_venta pdv ON pdv.id_punto_venta = ppv.id_punto_venta
                ORDER BY pdv.nombre ASC, pr.descripcion ASC, ppv.fecha_vigencia_desde DESC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateProductoPuntoVentaFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            validateProductoPuntoVentaRange($data['fecha_vigencia_desde'], $data['fecha_vigencia_hasta']);
            ensureProductoPuntoVentaReferential($pdo, 'productos', 'id_producto', $data['id_producto'], 'producto');
            ensureProductoPuntoVentaReferential($pdo, 'puntos_venta', 'id_punto_venta', $data['id_punto_venta'], 'punto de venta');
            assertProductoPuntoVentaUnique(
                $pdo,
                $data['id_producto'],
                $data['id_punto_venta'],
                $data['fecha_vigencia_desde']
            );

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO producto_punto_venta (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $existingStmt = $pdo->prepare("SELECT * FROM producto_punto_venta WHERE id_producto_pv = ?");
            $existingStmt->execute([$id]);
            $existing = $existingStmt->fetch();
            if (!$existing) {
                sendJsonResponse(['status' => 'error', 'message' => 'La asignacion no existe.'], 404);
            }

            $input = getJsonInput();
            [$data, $errors] = validateProductoPuntoVentaFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($existing, $data);
            validateProductoPuntoVentaRange(
                $merged['fecha_vigencia_desde'],
                $merged['fecha_vigencia_hasta']
            );
            ensureProductoPuntoVentaReferential($pdo, 'productos', 'id_producto', $merged['id_producto'], 'producto');
            ensureProductoPuntoVentaReferential($pdo, 'puntos_venta', 'id_punto_venta', $merged['id_punto_venta'], 'punto de venta');
            assertProductoPuntoVentaUnique(
                $pdo,
                $merged['id_producto'],
                $merged['id_punto_venta'],
                $merged['fecha_vigencia_desde'],
                $id
            );

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_producto_pv_param'] = $id;

            $stmt = $pdo->prepare("UPDATE producto_punto_venta SET {$set} WHERE id_producto_pv = :id_producto_pv_param");
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

            $stmt = $pdo->prepare("DELETE FROM producto_punto_venta WHERE id_producto_pv = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'La asignacion no existe.'], 404);
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
            'message' => 'No se puede eliminar la asignacion porque esta siendo usada por otro modulo.',
        ], 409);
    }
    if ($mysqlCode === 1452) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El producto o punto de venta seleccionado no existe.',
        ], 409);
    }
    if ($mysqlCode === 1062) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe una asignacion para ese producto y punto de venta con la misma fecha de vigencia.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

<?php
/**
 * RepoStock Pro - CRUD de Lotes y Vencimientos
 * Tabla: reposicion_productos.lotes_producto
 *
 * GET     -> listar en orden FEFO (incluye producto y punto de venta)
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
    'numero_lote' => ['label' => 'Numero de lote', 'type' => 'string', 'required' => true, 'max' => 80],
    'fecha_ingreso' => ['label' => 'Fecha de ingreso', 'type' => 'date', 'required' => false],
    'fecha_vencimiento' => ['label' => 'Fecha de vencimiento', 'type' => 'date', 'required' => true],
    'cantidad_deposito' => ['label' => 'Cantidad en deposito', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 0, 'decimals' => 3],
    'cantidad_gondola' => ['label' => 'Cantidad en gondola', 'type' => 'decimal', 'required' => true, 'min' => 0, 'default' => 0, 'decimals' => 3],
];

function validateLoteFields(array $fields, array $input, bool $isUpdate): array
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

function ensureLoteReferential(PDO $pdo, $table, $column, $value, $label)
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

function assertLoteUnique(PDO $pdo, $idProducto, $idPuntoVenta, $numeroLote, $excludeId = null)
{
    $sql = "SELECT COUNT(*) FROM lotes_producto
            WHERE id_producto = ? AND id_punto_venta = ? AND numero_lote = ?";
    $params = [$idProducto, $idPuntoVenta, $numeroLote];

    if ($excludeId !== null) {
        $sql .= " AND id_lote <> ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ((int) $stmt->fetchColumn()) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe un lote con ese numero para el mismo producto y punto de venta.',
        ], 422);
    }
}

function assertLoteDateRange($fechaIngreso, $fechaVencimiento)
{
    if ($fechaIngreso !== null && $fechaVencimiento !== null && $fechaVencimiento < $fechaIngreso) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'La fecha de vencimiento no puede ser anterior a la fecha de ingreso.',
        ], 422);
    }
}

function loteRowExists(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM lotes_producto WHERE id_lote = ?");
    $stmt->execute([$id]);
    return (int) $stmt->fetchColumn() > 0;
}

function findLoteRow(PDO $pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM lotes_producto WHERE id_lote = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendJsonResponse(['status' => 'error', 'message' => 'El lote no existe.'], 404);
    }

    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT l.*,
                       p.codigo AS producto_codigo,
                       p.descripcion AS producto_descripcion,
                       pv.nombre AS punto_venta_nombre,
                       DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
                FROM lotes_producto l
                INNER JOIN productos p ON p.id_producto = l.id_producto
                INNER JOIN puntos_venta pv ON pv.id_punto_venta = l.id_punto_venta
                ORDER BY l.fecha_vencimiento ASC, l.numero_lote ASC
            ");
            sendJsonResponse([
                'status' => 'success',
                'criterio' => 'FEFO',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateLoteFields($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            ensureLoteReferential($pdo, 'productos', 'id_producto', $data['id_producto'], 'producto');
            ensureLoteReferential($pdo, 'puntos_venta', 'id_punto_venta', $data['id_punto_venta'], 'punto de venta');
            assertLoteDateRange($data['fecha_ingreso'], $data['fecha_vencimiento']);
            assertLoteUnique($pdo, $data['id_producto'], $data['id_punto_venta'], $data['numero_lote']);

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO lotes_producto (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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

            $current = findLoteRow($pdo, $id);
            $input = getJsonInput();
            [$data, $errors] = validateLoteFields($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $merged = array_merge($current, $data);

            ensureLoteReferential($pdo, 'productos', 'id_producto', $merged['id_producto'], 'producto');
            ensureLoteReferential($pdo, 'puntos_venta', 'id_punto_venta', $merged['id_punto_venta'], 'punto de venta');
            assertLoteDateRange($merged['fecha_ingreso'], $merged['fecha_vencimiento']);
            assertLoteUnique(
                $pdo,
                $merged['id_producto'],
                $merged['id_punto_venta'],
                $merged['numero_lote'],
                $id
            );

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_lote_param'] = $id;

            $stmt = $pdo->prepare("UPDATE lotes_producto SET {$set} WHERE id_lote = :id_lote_param");
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

            $stmt = $pdo->prepare("DELETE FROM lotes_producto WHERE id_lote = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El lote no existe.'], 404);
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
            'message' => 'No se puede eliminar el lote porque esta siendo usado por otro modulo.',
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
            'message' => 'Ya existe un lote con ese numero para el mismo producto y punto de venta.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

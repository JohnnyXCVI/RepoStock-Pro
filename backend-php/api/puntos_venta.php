<?php
/**
 * RepoStock Pro - CRUD de Puntos de Venta
 * Tabla: reposicion_productos.puntos_venta
 *
 * GET     -> listar (incluye descripcion del tipo de punto de venta)
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
    'id_tipo_punto' => ['label' => 'Tipo de punto de venta', 'type' => 'int', 'required' => true, 'min' => 1],
    'nombre' => ['label' => 'Nombre', 'type' => 'string', 'required' => true, 'max' => 150],
    'ruc' => ['label' => 'RUC', 'type' => 'string', 'required' => false, 'max' => 30],
    'direccion' => ['label' => 'Direccion', 'type' => 'string', 'required' => true, 'max' => 200],
    'ciudad' => ['label' => 'Ciudad', 'type' => 'string', 'required' => false, 'max' => 100],
    'departamento' => ['label' => 'Departamento', 'type' => 'string', 'required' => false, 'max' => 100],
    'latitud' => ['label' => 'Latitud', 'type' => 'decimal', 'required' => false, 'min' => -90, 'max' => 90],
    'longitud' => ['label' => 'Longitud', 'type' => 'decimal', 'required' => false, 'min' => -180, 'max' => 180],
    'contacto' => ['label' => 'Contacto', 'type' => 'string', 'required' => false, 'max' => 100],
    'telefono' => ['label' => 'Telefono', 'type' => 'string', 'required' => false, 'max' => 30],
    'hora_apertura' => ['label' => 'Hora de apertura', 'type' => 'time', 'required' => false],
    'hora_cierre' => ['label' => 'Hora de cierre', 'type' => 'time', 'required' => false],
    'frecuencia_visita_dias' => ['label' => 'Frecuencia de visita (dias)', 'type' => 'int', 'required' => true, 'min' => 1, 'default' => 7],
    'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
];

/**
 * @return array{0: array<string, mixed>, 1: array<int, string>}
 */
function validatePuntoVenta(array $fields, array $input, bool $isUpdate): array
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
                continue;
            }
            $data[$name] = null;
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
                $data[$name] = null;
                continue;
            }
            if (!is_numeric($value)) {
                $errors[] = "El campo \"{$label}\" debe ser numerico.";
                continue;
            }
            $value = round((float) $value, 7);
            if (isset($def['min']) && $value < $def['min']) {
                $errors[] = "El campo \"{$label}\" debe ser mayor o igual a {$def['min']}.";
                continue;
            }
            if (isset($def['max']) && $value > $def['max']) {
                $errors[] = "El campo \"{$label}\" debe ser menor o igual a {$def['max']}.";
                continue;
            }
            $data[$name] = $value;
            continue;
        }

        $value = trim((string) $value);

        if ($value === '') {
            if (!empty($def['required'])) {
                $errors[] = "El campo \"{$label}\" es obligatorio.";
                continue;
            }
            $data[$name] = null;
            continue;
        }

        if (isset($def['max']) && mb_strlen($value, 'UTF-8') > $def['max']) {
            $errors[] = "El campo \"{$label}\" no puede superar {$def['max']} caracteres.";
            continue;
        }

        if ($def['type'] === 'time' && !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $value)) {
            $errors[] = "El campo \"{$label}\" debe tener formato HH:MM.";
            continue;
        }

        $data[$name] = $value;
    }

    return [$data, $errors];
}

function isPuntoVentaConstraintError(PDOException $e): bool
{
    return (string) $e->getCode() === '23000'
        || ($e->errorInfo[1] ?? null) === 1062
        || ($e->errorInfo[1] ?? null) === 1451
        || ($e->errorInfo[1] ?? null) === 1452;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT p.*, t.descripcion AS tipo_nombre
                FROM puntos_venta p
                INNER JOIN tipo_punto_venta t ON t.id_tipo_punto = p.id_tipo_punto
                ORDER BY p.nombre ASC
            ");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validatePuntoVenta($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            $typeCheck = $pdo->prepare("SELECT COUNT(*) FROM tipo_punto_venta WHERE id_tipo_punto = ?");
            $typeCheck->execute([$data['id_tipo_punto']]);
            if (!(int) $typeCheck->fetchColumn()) {
                sendJsonResponse(['status' => 'error', 'message' => 'El tipo de punto de venta seleccionado no existe.'], 422);
            }

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);

            $sql = "INSERT INTO puntos_venta (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';
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

            $input = getJsonInput();
            [$data, $errors] = validatePuntoVenta($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            if (array_key_exists('id_tipo_punto', $data)) {
                $typeCheck = $pdo->prepare("SELECT COUNT(*) FROM tipo_punto_venta WHERE id_tipo_punto = ?");
                $typeCheck->execute([$data['id_tipo_punto']]);
                if (!(int) $typeCheck->fetchColumn()) {
                    sendJsonResponse(['status' => 'error', 'message' => 'El tipo de punto de venta seleccionado no existe.'], 422);
                }
            }

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_punto_venta_param'] = $id;

            $stmt = $pdo->prepare("UPDATE puntos_venta SET {$set} WHERE id_punto_venta = :id_punto_venta_param");
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

            $stmt = $pdo->prepare("DELETE FROM puntos_venta WHERE id_punto_venta = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El punto de venta no existe.'], 404);
            }

            sendJsonResponse(['status' => 'deleted']);
            break;

        default:
            sendJsonResponse(['status' => 'error', 'message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $e) {
    if (isPuntoVentaConstraintError($e)) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El punto de venta esta asociado a otros modulos o el tipo seleccionado no es valido.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

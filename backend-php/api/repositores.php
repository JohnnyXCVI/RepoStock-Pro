<?php
/**
 * RepoStock Pro - CRUD de Repositores
 * Tabla: reposicion_productos.repositores
 *
 * GET     -> listar
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
    'nombres' => ['label' => 'Nombres', 'type' => 'string', 'required' => true, 'max' => 100],
    'apellidos' => ['label' => 'Apellidos', 'type' => 'string', 'required' => true, 'max' => 100],
    'documento' => ['label' => 'Documento', 'type' => 'string', 'required' => true, 'max' => 30],
    'telefono' => ['label' => 'Telefono', 'type' => 'string', 'required' => false, 'max' => 30],
    'email' => ['label' => 'Email', 'type' => 'email', 'required' => false, 'max' => 120],
    'hora_inicio' => ['label' => 'Hora de inicio', 'type' => 'time', 'required' => false],
    'hora_fin' => ['label' => 'Hora de fin', 'type' => 'time', 'required' => false],
    'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
];

/**
 * @return array{0: array<string, mixed>, 1: array<int, string>}
 */
function validateRepositor(array $fields, array $input, bool $isUpdate): array
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

        if ($def['type'] === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "El campo \"{$label}\" no tiene un formato valido.";
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

function isRepositorConstraintError(PDOException $e): bool
{
    return (string) $e->getCode() === '23000'
        || ($e->errorInfo[1] ?? null) === 1062
        || ($e->errorInfo[1] ?? null) === 1451;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM repositores ORDER BY apellidos ASC, nombres ASC");
            sendJsonResponse([
                'status' => 'success',
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateRepositor($fields, $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);

            $sql = "INSERT INTO repositores (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';
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
            [$data, $errors] = validateRepositor($fields, $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_repositor_param'] = $id;

            $stmt = $pdo->prepare("UPDATE repositores SET {$set} WHERE id_repositor = :id_repositor_param");
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

            $stmt = $pdo->prepare("DELETE FROM repositores WHERE id_repositor = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El repositor no existe.'], 404);
            }

            sendJsonResponse(['status' => 'deleted']);
            break;

        default:
            sendJsonResponse(['status' => 'error', 'message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $e) {
    if (isRepositorConstraintError($e)) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ya existe un repositor con ese documento o el registro esta asociado a otros modulos.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

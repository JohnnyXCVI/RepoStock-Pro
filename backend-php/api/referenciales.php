<?php
/**
 * RepoStock Pro - CRUD de tablas referenciales
 * Base de datos: reposicion_productos (MySQL / MariaDB)
 *
 * Recursos disponibles (parametro ?tipo=):
 *   tipo-pdv, categoria, marca, unidad, estado, prioridad, motivo, tipo-incidente
 *
 * Metodos:
 *   GET     -> listar
 *   POST    -> crear
 *   PUT     -> actualizar   (requiere ?tipo=...&id=...)
 *   DELETE  -> eliminar     (requiere ?tipo=...&id=...)
 */

require_once __DIR__ . '/../config/db.php';

if (!isset($pdo) || !$pdo) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'No se pudo conectar a la base de datos reposicion_productos.'
            . (isset($db_connection_error) ? ' ' . $db_connection_error : '')
    ], 500);
}

$resources = [
    'tipo-pdv' => [
        'table' => 'tipo_punto_venta',
        'id' => 'id_tipo_punto',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 60],
            'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
        ],
    ],
    'categoria' => [
        'table' => 'categoria_producto',
        'id' => 'id_categoria',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 100],
            'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
        ],
    ],
    'marca' => [
        'table' => 'marca',
        'id' => 'id_marca',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 100],
            'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
        ],
    ],
    'unidad' => [
        'table' => 'unidad_medida',
        'id' => 'id_unidad',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 50],
            'abreviatura' => ['label' => 'Abreviatura', 'type' => 'text', 'required' => true, 'max' => 10],
        ],
    ],
    'estado' => [
        'table' => 'estado_general',
        'id' => 'id_estado',
        'fields' => [
            'entidad' => ['label' => 'Entidad', 'type' => 'text', 'required' => true, 'max' => 40],
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 50],
        ],
    ],
    'prioridad' => [
        'table' => 'prioridad',
        'id' => 'id_prioridad',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 30],
            'nivel' => ['label' => 'Nivel', 'type' => 'int', 'required' => true, 'min' => 1],
            'minutos_estimados' => ['label' => 'Minutos estimados', 'type' => 'int', 'required' => true, 'min' => 0],
        ],
    ],
    'motivo' => [
        'table' => 'motivo_incidencia',
        'id' => 'id_motivo',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 100],
            'estado' => ['label' => 'Estado', 'type' => 'bool', 'default' => 1],
        ],
    ],
    'tipo-incidente' => [
        'table' => 'tipo_incidente',
        'id' => 'id_tipo_incidente',
        'fields' => [
            'descripcion' => ['label' => 'Descripcion', 'type' => 'text', 'required' => true, 'max' => 80],
        ],
    ],
];

$tipo = $_GET['tipo'] ?? '';

if (!isset($resources[$tipo])) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Recurso no valido. Use uno de: ' . implode(', ', array_keys($resources))
    ], 400);
}

$config = $resources[$tipo];
$table = $config['table'];
$idColumn = $config['id'];
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Normaliza y valida los campos recibidos.
 *
 * @return array{0: array<string, mixed>, 1: array<int, string>}
 */
function validateReferencialFields(array $fields, array $input, bool $isUpdate): array
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
            }
            continue;
        }

        $value = $input[$name];
        $label = $def['label'];

        if ($def['type'] === 'int') {
            if ($value === '' || $value === null) {
                if (!empty($def['required'])) {
                    $errors[] = "El campo \"{$label}\" es obligatorio.";
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
            if (isset($def['max']) && $value > $def['max']) {
                $errors[] = "El campo \"{$label}\" debe ser menor o igual a {$def['max']}.";
                continue;
            }
        } elseif ($def['type'] === 'bool') {
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $value = $value === null ? 0 : ($value ? 1 : 0);
        } else {
            $value = trim((string) $value);
            if ($value === '' && !empty($def['required'])) {
                $errors[] = "El campo \"{$label}\" es obligatorio.";
                continue;
            }
            if (isset($def['max']) && mb_strlen($value, 'UTF-8') > $def['max']) {
                $errors[] = "El campo \"{$label}\" no puede superar {$def['max']} caracteres.";
                continue;
            }
        }

        $data[$name] = $value;
    }

    return [$data, $errors];
}

function isDuplicateOrConstraintError(PDOException $e): bool
{
    return (string) $e->getCode() === '23000' || ($e->errorInfo[1] ?? null) === 1062 || ($e->errorInfo[1] ?? null) === 1451;
}

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM `{$table}` ORDER BY `{$idColumn}` ASC");
            sendJsonResponse([
                'status' => 'success',
                'tipo' => $tipo,
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $input = getJsonInput();
            [$data, $errors] = validateReferencialFields($config['fields'], $input, false);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }

            $columns = array_keys($data);
            $placeholders = array_map(static function ($column) {
                return ':' . $column;
            }, $columns);
            $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . '`) VALUES (' . implode(', ', $placeholders) . ')';

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
            [$data, $errors] = validateReferencialFields($config['fields'], $input, true);

            if ($errors) {
                sendJsonResponse(['status' => 'error', 'message' => implode(' ', $errors)], 422);
            }
            if (!$data) {
                sendJsonResponse(['status' => 'error', 'message' => 'No se recibieron campos para actualizar.'], 422);
            }

            $set = implode(', ', array_map(static function ($column) {
                return "`{$column}` = :{$column}";
            }, array_keys($data)));
            $data['id_referencial'] = $id;

            $stmt = $pdo->prepare("UPDATE `{$table}` SET {$set} WHERE `{$idColumn}` = :id_referencial");
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

            $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `{$idColumn}` = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                sendJsonResponse(['status' => 'error', 'message' => 'El registro no existe.'], 404);
            }

            sendJsonResponse(['status' => 'deleted']);
            break;

        default:
            sendJsonResponse(['status' => 'error', 'message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $e) {
    if (isDuplicateOrConstraintError($e)) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'El registro ya existe o esta siendo usado por otro modulo y no se puede modificar/eliminar.',
        ], 409);
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la solicitud en la base de datos.',
    ], 500);
}

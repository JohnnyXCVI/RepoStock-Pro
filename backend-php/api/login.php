<?php
/**
 * RepoStock Pro - API Autenticación / Inicio de Sesión
 * Endpoint para autenticar usuarios comparando la contraseña mediante password_verify() (BCRYPT).
 *
 * POST -> { "username": "...", "password": "..." }
 */

require_once __DIR__ . '/../config/db.php';

if (!isset($pdo) || !$pdo) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'No se pudo conectar a la base de datos MySQL reposicion_productos.'
            . (isset($db_connection_error) ? ' ' . $db_connection_error : '')
    ], 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    // Endpoint informativo
    sendJsonResponse([
        'status' => 'online',
        'endpoint' => 'POST /api/login.php',
        'description' => 'Autenticación de usuarios con hashing seguro BCRYPT'
    ]);
}

if ($method !== 'POST') {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Método no permitido. Utilice POST para iniciar sesión.'
    ], 405);
}

// Obtener datos de la petición
$input = getJsonInput();
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($username) || empty($password)) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Por favor ingrese su nombre de usuario y contraseña.'
    ], 422);
}

try {
    // Buscar usuario por username
    $stmt = $pdo->prepare("
        SELECT id_usuario, username, password_hash, nombre_completo, email, rol, id_repositor, estado 
        FROM usuarios 
        WHERE username = :username 
        LIMIT 1
    ");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        // Usuario inexistente
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Usuario o contraseña incorrectos.'
        ], 401);
    }

    // Verificar si el usuario está activo
    if ((int)$user['estado'] !== 1) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Esta cuenta de usuario se encuentra inactiva. Contacte al administrador.'
        ], 403);
    }

    // Verificar hash de la contraseña con password_verify (compatible con BCRYPT / ARGON2)
    if (!password_verify($password, $user['password_hash'])) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Usuario o contraseña incorrectos.'
        ], 401);
    }

    // Actualizar fecha y hora del último acceso
    $updateStmt = $pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = :id");
    $updateStmt->execute([':id' => $user['id_usuario']]);

    // Generar token de sesión seguro
    $token = bin2hex(random_bytes(32));

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Inicio de sesión exitoso. ¡Bienvenido ' . $user['nombre_completo'] . '!',
        'token' => $token,
        'user' => [
            'id' => (int)$user['id_usuario'],
            'username' => $user['username'],
            'nombreCompleto' => $user['nombre_completo'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'idRepositor' => $user['id_repositor'] ? (int)$user['id_repositor'] : null
        ]
    ], 200);

} catch (PDOException $e) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al procesar la autenticación en MySQL: ' . $e->getMessage()
    ], 500);
}

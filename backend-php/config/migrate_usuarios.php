<?php
/**
 * RepoStock Pro - Migración y Configuración de Tabla de Usuarios
 * Crea la tabla `usuarios` e inserta los usuarios iniciales con contraseña hasheada (BCRYPT).
 */

require_once __DIR__ . '/db.php';

if (!isset($pdo) || !$pdo) {
    echo "ERROR: No se pudo conectar a la base de datos MySQL reposicion_productos.\n";
    if (isset($db_connection_error)) {
        echo $db_connection_error . "\n";
    }
    exit(1);
}

try {
    // 1. Crear tabla usuarios si no existe
    $sqlTable = "CREATE TABLE IF NOT EXISTS `usuarios` (
      `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
      `username` VARCHAR(50) NOT NULL UNIQUE,
      `password_hash` VARCHAR(255) NOT NULL,
      `nombre_completo` VARCHAR(150) NOT NULL,
      `email` VARCHAR(120) NULL,
      `rol` ENUM('ADMIN', 'SUPERVISOR', 'REPOSITOR') NOT NULL DEFAULT 'ADMIN',
      `id_repositor` INT NULL,
      `estado` TINYINT(1) NOT NULL DEFAULT 1,
      `ultimo_acceso` DATETIME NULL,
      `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY `fk_usuarios_repositor` (`id_repositor`),
      CONSTRAINT `fk_usuarios_repositor` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sqlTable);
    echo "OK: Tabla `usuarios` verificada / creada exitosamente.\n";

    // 2. Usuarios a sembrar con password_hash (BCRYPT)
    $usuarios = [
        [
            'username' => 'admin',
            'password' => 'admin123',
            'nombre_completo' => 'Administrador RepoStock',
            'email' => 'admin@repostock.com',
            'rol' => 'ADMIN',
            'id_repositor' => null
        ],
        [
            'username' => 'supervisor',
            'password' => 'super123',
            'nombre_completo' => 'Supervisor de Operaciones',
            'email' => 'supervisor@repostock.com',
            'rol' => 'SUPERVISOR',
            'id_repositor' => null
        ],
        [
            'username' => 'repositor',
            'password' => 'repo123',
            'nombre_completo' => 'Luis Guzmán (Repositor)',
            'email' => 'repositor@repostock.com',
            'rol' => 'REPOSITOR',
            'id_repositor' => 3
        ]
    ];

    $stmt = $pdo->prepare("
        INSERT INTO `usuarios` (`username`, `password_hash`, `nombre_completo`, `email`, `rol`, `id_repositor`, `estado`)
        VALUES (:username, :password_hash, :nombre_completo, :email, :rol, :id_repositor, 1)
        ON DUPLICATE KEY UPDATE 
            `password_hash` = VALUES(`password_hash`),
            `nombre_completo` = VALUES(`nombre_completo`),
            `email` = VALUES(`email`),
            `rol` = VALUES(`rol`),
            `estado` = 1
    ");

    foreach ($usuarios as $u) {
        $hash = password_hash($u['password'], PASSWORD_BCRYPT);
        $stmt->execute([
            ':username' => $u['username'],
            ':password_hash' => $hash,
            ':nombre_completo' => $u['nombre_completo'],
            ':email' => $u['email'],
            ':rol' => $u['rol'],
            ':id_repositor' => $u['id_repositor']
        ]);
        echo "OK: Usuario creado/actualizado: {$u['username']} (Clave en texto claro para pruebas: '{$u['password']}')\n";
        echo "    Hash BCRYPT generado: {$hash}\n";
    }

    echo "\nMigración finalizada con éxito.\n";

} catch (PDOException $e) {
    echo "ERROR PDO: " . $e->getMessage() . "\n";
    exit(1);
}

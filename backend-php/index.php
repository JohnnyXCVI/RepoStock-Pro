<?php
/**
 * RepoStock Pro - Router y Gateway API PHP
 * Permite servir la API REST en servidores Apache, Nginx o PHP Built-in Server
 */

require_once __DIR__ . '/config/db.php';

$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Parse path
$path = parse_url($request_uri, PHP_URL_PATH);
$path = trim(str_replace(['/backend-php', '/api'], '', $path), '/');

// Respuesta informativa de bienvenida a la API
if (empty($path) || $path === 'index.php') {
    sendJsonResponse([
        'app' => 'RepoStock Pro API (PHP/MySQL)',
        'version' => '1.0.0',
        'endpoints' => [
            'GET /api/dashboard.php' => 'Métricas agregadas y widgets en tiempo real para el Resumen General',
            'GET /api/referenciales.php?tipo=...' => 'Gestión de tablas maestras referenciales',
            'GET,POST,PUT,DELETE /api/repositores.php' => 'Gestión del personal repositor',
            'GET,POST,PUT,DELETE /api/puntos_venta.php' => 'Gestión de puntos de venta',
            'GET,POST,PUT,DELETE /api/productos.php' => 'Catálogo y precios por PDV',
            'GET,POST,PUT /api/lotes.php' => 'Control de lotes, vencimientos y FEFO',
            'GET,POST,PUT /api/rutas.php' => 'Planificación y despacho de rutas',
            'GET,POST,PUT /api/visitas.php' => 'Auditorías, check-in y checklist de visita',
            'GET,POST /api/reposiciones.php' => 'Registro de reposición y stock góndola/depósito',
            'GET,POST,PUT /api/pedidos.php' => 'Pedidos de reposición a CEDI o proveedor',
            'GET,POST,PUT /api/incidencias.php' => 'Registro y resolución de incidencias en góndola'
        ],
        'author' => 'RepoStock Enterprise Architecture'
    ]);
}

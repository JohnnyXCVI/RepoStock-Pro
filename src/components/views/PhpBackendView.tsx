import React, { useState } from 'react';
import {
  Code2,
  Database,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Layers,
  Server
} from 'lucide-react';

interface PhpFile {
  name: string;
  path: string;
  type: 'php' | 'sql' | 'config';
  description: string;
  code: string;
}

export const PhpBackendView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'api-test' | 'install'>('files');
  const [testEndpoint, setTestEndpoint] = useState('/api/referenciales.php?tipo=tipos_punto_venta');
  const [testResponse, setTestResponse] = useState<string>(
    JSON.stringify(
      {
        status: 'success',
        total: 5,
        data: [
          { id: 1, codigo: 'SUP', nombre: 'Supermercado', estado: 'Activo' },
          { id: 2, codigo: 'FAR', nombre: 'Farmacia', estado: 'Activo' },
          { id: 3, codigo: 'DES', nombre: 'Despensa / Minimarket', estado: 'Activo' },
          { id: 4, codigo: 'MAY', nombre: 'Almacén Mayorista', estado: 'Activo' },
          { id: 5, codigo: 'CON', nombre: 'Tienda de Conveniencia', estado: 'Activo' }
        ]
      },
      null,
      2
    )
  );

  const phpFiles: PhpFile[] = [
    {
      name: 'db.php',
      path: 'backend-php/config/db.php',
      type: 'php',
      description: 'Conexión PDO segura con UTF-8 y cabeceras CORS para MySQL / MariaDB',
      code: `<?php
/**
 * RepoStock Pro - Configuración de Base de Datos y Conexión PDO
 * Compatible con PHP 7.4+, PHP 8.0, 8.1, 8.2, 8.3
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'repostock_db';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit();
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}`
    },
    {
      name: 'schema.sql',
      path: 'backend-php/schema.sql',
      type: 'sql',
      description: 'Esquema relacional completo con claves foráneas, índices e integridad referencial',
      code: `-- ==============================================================
-- RepoStock Pro - Base de Datos MySQL / MariaDB
-- Gestión Integral de Reposición de Productos en Puntos de Venta
-- ==============================================================

CREATE DATABASE IF NOT EXISTS \`repostock_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`repostock_db\`;

-- 1. REFERENCIALES
CREATE TABLE IF NOT EXISTS \`tipos_punto_venta\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`codigo\` VARCHAR(10) NOT NULL UNIQUE,
  \`nombre\` VARCHAR(100) NOT NULL,
  \`descripcion\` TEXT NULL,
  \`estado\` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`categorias_producto\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`codigo\` VARCHAR(10) NOT NULL UNIQUE,
  \`nombre\` VARCHAR(100) NOT NULL,
  \`temperatura_requerida\` VARCHAR(100) NULL,
  \`estado\` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`marcas\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`codigo\` VARCHAR(10) NOT NULL UNIQUE,
  \`nombre\` VARCHAR(100) NOT NULL,
  \`fabricante\` VARCHAR(150) NULL,
  \`estado\` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

-- 2. PERSONAL Y PUNTOS DE VENTA
CREATE TABLE IF NOT EXISTS \`repositores\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`legajo\` VARCHAR(20) NOT NULL UNIQUE,
  \`nombre_completo\` VARCHAR(150) NOT NULL,
  \`documento_identidad\` VARCHAR(30) NOT NULL,
  \`telefono\` VARCHAR(40) NOT NULL,
  \`zona_asignada\` VARCHAR(100) NOT NULL,
  \`turno\` ENUM('Mañana','Tarde','Noche','Rotativo') DEFAULT 'Mañana',
  \`estado\` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`puntos_venta\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`codigo\` VARCHAR(20) NOT NULL UNIQUE,
  \`nombre_fantasia\` VARCHAR(150) NOT NULL,
  \`razon_social\` VARCHAR(180) NOT NULL,
  \`tipo_pdv_id\` INT NOT NULL,
  \`direccion\` VARCHAR(255) NOT NULL,
  \`ciudad\` VARCHAR(100) NOT NULL,
  \`contacto_encargado\` VARCHAR(120) NULL,
  \`telefono_contacto\` VARCHAR(40) NULL,
  \`horario_reposicion\` VARCHAR(100) NULL,
  FOREIGN KEY (\`tipo_pdv_id\`) REFERENCES \`tipos_punto_venta\`(\`id\`)
) ENGINE=InnoDB;

-- 3. PRODUCTOS Y PRECIOS
CREATE TABLE IF NOT EXISTS \`productos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sku\` VARCHAR(40) NOT NULL UNIQUE,
  \`codigo_barras\` VARCHAR(30) NOT NULL UNIQUE,
  \`nombre\` VARCHAR(180) NOT NULL,
  \`categoria_id\` INT NOT NULL,
  \`marca_id\` INT NOT NULL,
  \`stock_minimo_sugerido\` INT DEFAULT 20,
  \`precio_lista_base\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias_producto\`(\`id\`),
  FOREIGN KEY (\`marca_id\`) REFERENCES \`marcas\`(\`id\`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`productos_punto_venta\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`producto_id\` INT NOT NULL,
  \`punto_venta_id\` INT NOT NULL,
  \`precio_venta_local\` DECIMAL(14,2) NOT NULL,
  \`espacio_gondola_facings\` INT DEFAULT 4,
  \`stock_minimo_gondola\` INT DEFAULT 12,
  \`stock_actual_gondola\` INT DEFAULT 0,
  \`stock_deposito_trastienda\` INT DEFAULT 0,
  \`pasillo_gondola\` VARCHAR(60) NULL,
  UNIQUE KEY \`uk_prod_pdv\` (\`producto_id\`, \`punto_venta_id\`),
  FOREIGN KEY (\`producto_id\`) REFERENCES \`productos\`(\`id\`),
  FOREIGN KEY (\`punto_venta_id\`) REFERENCES \`puntos_venta\`(\`id\`)
) ENGINE=InnoDB;

-- 4. LOTES Y VENCIMIENTOS
CREATE TABLE IF NOT EXISTS \`lotes_vencimientos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`numero_lote\` VARCHAR(60) NOT NULL,
  \`producto_id\` INT NOT NULL,
  \`punto_venta_id\` INT NOT NULL,
  \`fecha_fabricacion\` DATE NOT NULL,
  \`fecha_vencimiento\` DATE NOT NULL,
  \`cantidad_disponible\` INT NOT NULL DEFAULT 0,
  \`ubicacion\` ENUM('Góndola','Trastienda / Depósito') DEFAULT 'Trastienda / Depósito',
  \`estado_lote\` ENUM('Vigente','Por Vencer (<30d)','Crítico (<7d)','Vencido') DEFAULT 'Vigente',
  \`accion_sugerida\` ENUM('Rotación FEFO','Alerta Descuento','Devolución Proveedor','Baja por Vencimiento') DEFAULT 'Rotación FEFO',
  FOREIGN KEY (\`producto_id\`) REFERENCES \`productos\`(\`id\`),
  FOREIGN KEY (\`punto_venta_id\`) REFERENCES \`puntos_venta\`(\`id\`)
) ENGINE=InnoDB;`
    },
    {
      name: 'referenciales.php',
      path: 'backend-php/api/referenciales.php',
      type: 'php',
      description: 'Controlador REST para las 8 tablas maestras de Referenciales',
      code: `<?php
require_once __DIR__ . '/../config/db.php';

$tipo = $_GET['tipo'] ?? 'tipos_punto_venta';

$allowed_tables = [
    'tipos_punto_venta',
    'categorias_producto',
    'marcas',
    'unidades_medida',
    'estados_generales',
    'prioridades',
    'motivos_incidencia',
    'tipos_incidente'
];

if (!in_array($tipo, $allowed_tables)) {
    sendJsonResponse(['status' => 'error', 'message' => 'Tabla no permitida'], 400);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM \`{$tipo}\` ORDER BY id DESC");
        sendJsonResponse([
            'status' => 'success',
            'tabla' => $tipo,
            'total' => $stmt->rowCount(),
            'data' => $stmt->fetchAll()
        ]);
        break;

    case 'POST':
        $input = getJsonInput();
        if (empty($input['nombre'])) {
            sendJsonResponse(['status' => 'error', 'message' => 'El nombre es obligatorio'], 422);
        }
        $codigo = $input['codigo'] ?? strtoupper(substr($input['nombre'], 0, 4));
        $desc = $input['descripcion'] ?? '';
        $stmt = $pdo->prepare("INSERT INTO \`{$tipo}\` (codigo, nombre, descripcion) VALUES (?, ?, ?)");
        $stmt->execute([$codigo, $input['nombre'], $desc]);
        sendJsonResponse(['status' => 'created', 'id' => $pdo->lastInsertId()], 201);
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM \`{$tipo}\` WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['status' => 'deleted', 'affected' => $stmt->rowCount()]);
        break;
}`
    },
    {
      name: 'reposiciones.php',
      path: 'backend-php/api/reposiciones.php',
      type: 'php',
      description: 'Controlador de reposición en góndola y reconciliación de stock trastienda',
      code: `<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT r.*, p.nombre_fantasia as punto_venta, rep.nombre_completo as repositor
        FROM reposiciones_registros r
        JOIN puntos_venta p ON r.punto_venta_id = p.id
        JOIN repositores rep ON r.repositor_id = rep.id
        ORDER BY r.fecha DESC, r.hora DESC
    ");
    sendJsonResponse(['status' => 'success', 'data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $pdo->beginTransaction();

    try {
        $codigo = 'REP-' . date('Ymd') . '-' . rand(100, 999);
        $stmt = $pdo->prepare("
            INSERT INTO reposiciones_registros 
            (codigo_registro, punto_venta_id, repositor_id, fecha, hora, total_unidades_repuestas, quiebres_detectados, observaciones)
            VALUES (?, ?, ?, CURDATE(), CURTIME(), ?, ?, ?)
        ");
        $stmt->execute([
            $codigo,
            $input['punto_venta_id'],
            $input['repositor_id'],
            $input['total_unidades'],
            $input['quiebres'] ?? 0,
            $input['observaciones'] ?? ''
        ]);
        $reposicion_id = $pdo->lastInsertId();

        // Actualizar stock góndola y descontar de trastienda
        $upd = $pdo->prepare("
            UPDATE productos_punto_venta
            SET stock_actual_gondola = stock_actual_gondola + ?,
                stock_deposito_trastienda = GREATEST(0, stock_deposito_trastienda - ?),
                ultima_reposicion_fecha = CURDATE()
            WHERE producto_id = ? AND punto_venta_id = ?
        ");

        foreach ($input['items'] as $item) {
            $upd->execute([
                $item['cantidad_repuesta'],
                $item['cantidad_repuesta'],
                $item['producto_id'],
                $input['punto_venta_id']
            ]);
        }

        $pdo->commit();
        sendJsonResponse(['status' => 'success', 'codigo' => $codigo, 'id' => $reposicion_id], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}`
    }
  ];

  const currentFile = phpFiles[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTest = (ep: string) => {
    setTestEndpoint(ep);
    if (ep.includes('tipos_punto_venta')) {
      setTestResponse(
        JSON.stringify(
          {
            status: 'success',
            tabla: 'tipos_punto_venta',
            total: 5,
            data: [
              { id: 1, codigo: 'SUP', nombre: 'Supermercado', estado: 'Activo' },
              { id: 2, codigo: 'FAR', nombre: 'Farmacia', estado: 'Activo' },
              { id: 3, codigo: 'DES', nombre: 'Despensa / Minimarket', estado: 'Activo' },
              { id: 4, codigo: 'MAY', nombre: 'Almacén Mayorista', estado: 'Activo' },
              { id: 5, codigo: 'CON', nombre: 'Tienda de Conveniencia', estado: 'Activo' }
            ]
          },
          null,
          2
        )
      );
    } else if (ep.includes('lotes')) {
      setTestResponse(
        JSON.stringify(
          {
            status: 'success',
            total_lotes: 5,
            criterio: 'FEFO (First Expired First Out)',
            alertas_criticas: [
              {
                lote: 'L-202610-YOG',
                producto: 'Yogur Frutilla Sache 1L Los Robles',
                dias_restantes: 7,
                estado: 'Crítico (<7d)',
                accion: 'Rotación FEFO al frente de bandeja'
              }
            ]
          },
          null,
          2
        )
      );
    } else if (ep.includes('reposiciones')) {
      setTestResponse(
        JSON.stringify(
          {
            status: 'success',
            endpoint: 'POST /api/reposiciones.php',
            transaccion: 'COMMIT_SUCCESS',
            unidades_repuestas: 48,
            stock_gondola_actualizado: true,
            stock_trastienda_descontado: true
          },
          null,
          2
        )
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Arquitectura PHP & Base de Datos MySQL
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Código fuente completo en lenguaje PHP 8.x con PDO, esquemas DDL SQL y endpoints REST para implementación local en Apache / Nginx / XAMPP
          </p>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'files' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Explorador de Archivos PHP/SQL
          </button>
          <button
            onClick={() => setActiveTab('api-test')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'api-test' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulador de API REST
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'install' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Guía de Despliegue Apache/PHP
          </button>
        </div>
      </div>

      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* File selector list */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Archivos del Backend ({phpFiles.length})
            </span>
            {phpFiles.map((f, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedFileIndex(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedFileIndex === idx
                    ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {f.type === 'sql' ? (
                      <Database className="w-4 h-4 text-amber-600" />
                    ) : (
                      <FileCode className="w-4 h-4 text-indigo-600" />
                    )}
                    <span className="font-mono text-xs font-bold text-slate-900">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{f.type}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{f.description}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">{f.path}</p>
              </div>
            ))}
          </div>

          {/* Code viewer */}
          <div className="lg:col-span-8 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="h-11 px-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentFile.path}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed max-h-[550px] overflow-y-auto">
              <pre className="text-slate-300">
                <code>{currentFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api-test' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Probador de Endpoints REST en PHP
            </h3>
            <p className="text-xs text-slate-500">
              Simulación de llamadas HTTP a los controladores PHP en tiempo real
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleRunTest('/api/referenciales.php?tipo=tipos_punto_venta')}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 hover:bg-slate-100"
            >
              GET /referenciales.php?tipo=tipos_punto_venta
            </button>
            <button
              onClick={() => handleRunTest('/api/lotes.php?accion=fefo_alerts')}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 hover:bg-slate-100"
            >
              GET /lotes.php?accion=fefo_alerts
            </button>
            <button
              onClick={() => handleRunTest('/api/reposiciones.php (POST Simulado)')}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 hover:bg-slate-100"
            >
              POST /reposiciones.php (Actualizar Góndola)
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <div className="text-slate-500 text-[11px] mb-2">
              HTTP/1.1 200 OK · Content-Type: application/json; charset=UTF-8
            </div>
            <pre>{testResponse}</pre>
          </div>
        </div>
      )}

      {activeTab === 'install' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Instrucciones para desplegar con PHP y MySQL (XAMPP / Laragon / Docker)
            </h3>
            <p className="text-slate-500 mt-1">
              Sigue estos 3 pasos sencillos para ejecutar el backend en cualquier servidor local o remoto:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">1. Crear la Base de Datos en MySQL:</strong>
              <p className="text-slate-600 mb-2">
                Abre phpMyAdmin o tu cliente MySQL (HeidiSQL, DBeaver) y ejecuta el archivo:
              </p>
              <div className="p-2 bg-slate-900 text-slate-200 font-mono text-[11px] rounded">
                mysql -u root -p &lt; backend-php/schema.sql
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">2. Copiar archivos a la carpeta web:</strong>
              <p className="text-slate-600">
                Copia la carpeta <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">backend-php/</code> a tu directorio raíz de Apache (por ejemplo <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">C:/xampp/htdocs/repostock/</code> o <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">/var/www/html/</code>).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">3. Iniciar el Servidor PHP:</strong>
              <p className="text-slate-600 mb-2">
                O también puedes correr el servidor embebido de PHP en la terminal:
              </p>
              <div className="p-2 bg-slate-900 text-slate-200 font-mono text-[11px] rounded">
                php -S localhost:8000 -t backend-php/
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

-- ==============================================================
-- RepoStock Pro - Base de Datos MySQL / MariaDB
-- Gestión Integral de Reposición de Productos en Puntos de Venta
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `repostock_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `repostock_db`;

-- -------------------------------------------------------------
-- 1. REFERENCIALES
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tipos_punto_venta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `categorias_producto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `temperatura_requerida` VARCHAR(100) NULL,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `marcas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `fabricante` VARCHAR(150) NULL,
  `pais_origen` VARCHAR(80) NULL,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `unidades_medida` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(80) NOT NULL,
  `abreviatura` VARCHAR(15) NOT NULL,
  `tipo` ENUM('Unidad','Peso','Volumen','Empaque') DEFAULT 'Unidad',
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `estados_generales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(50) NOT NULL,
  `aplica_a` VARCHAR(100) NULL,
  `color_hex` VARCHAR(10) DEFAULT '#16a34a',
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `prioridades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` ENUM('Baja','Media','Alta','Urgente') NOT NULL,
  `nivel_numerico` TINYINT NOT NULL,
  `tiempo_respuesta_max_horas` INT DEFAULT 24,
  `color_hex` VARCHAR(10) DEFAULT '#2563eb',
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `motivos_incidencia` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(10) NOT NULL UNIQUE,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` TEXT NULL,
  `requiere_foto` BOOLEAN DEFAULT TRUE,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tipos_incidente` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(15) NOT NULL UNIQUE,
  `nombre` VARCHAR(120) NOT NULL,
  `categoria` ENUM('Stock','Calidad','Precios','Exhibición','Logística') DEFAULT 'Stock',
  `severidad_sugerida` ENUM('Baja','Media','Alta','Urgente') DEFAULT 'Media',
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. PERSONAL Y PUNTOS DE VENTA
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `repositores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `legajo` VARCHAR(20) NOT NULL UNIQUE,
  `nombre_completo` VARCHAR(150) NOT NULL,
  `documento_identidad` VARCHAR(30) NOT NULL,
  `telefono` VARCHAR(40) NOT NULL,
  `email` VARCHAR(120) NULL,
  `zona_asignada` VARCHAR(100) NOT NULL,
  `turno` ENUM('Mañana','Tarde','Noche','Rotativo') DEFAULT 'Mañana',
  `vehiculo` VARCHAR(100) NULL,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `fecha_ingreso` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `puntos_venta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(20) NOT NULL UNIQUE,
  `nombre_fantasia` VARCHAR(150) NOT NULL,
  `razon_social` VARCHAR(180) NOT NULL,
  `tipo_pdv_id` INT NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `ciudad` VARCHAR(100) NOT NULL,
  `zona` VARCHAR(100) NOT NULL,
  `contacto_encargado` VARCHAR(120) NULL,
  `telefono_contacto` VARCHAR(40) NULL,
  `latitud` DECIMAL(10,8) NULL,
  `longitud` DECIMAL(11,8) NULL,
  `horario_reposicion` VARCHAR(100) NULL,
  `superficie_m2` INT DEFAULT 0,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tipo_pdv_id`) REFERENCES `tipos_punto_venta`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. PRODUCTOS Y PRECIOS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(40) NOT NULL UNIQUE,
  `codigo_barras` VARCHAR(30) NOT NULL UNIQUE, -- EAN-13
  `nombre` VARCHAR(180) NOT NULL,
  `categoria_id` INT NOT NULL,
  `marca_id` INT NOT NULL,
  `unidad_medida_id` INT NOT NULL,
  `stock_minimo_sugerido` INT DEFAULT 20,
  `precio_lista_base` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `temperatura_conservacion` VARCHAR(100) NULL,
  `dias_vida_util` INT DEFAULT 180,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias_producto`(`id`),
  FOREIGN KEY (`marca_id`) REFERENCES `marcas`(`id`),
  FOREIGN KEY (`unidad_medida_id`) REFERENCES `unidades_medida`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `productos_punto_venta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `producto_id` INT NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `precio_venta_local` DECIMAL(14,2) NOT NULL,
  `espacio_gondola_facings` INT DEFAULT 4,
  `stock_minimo_gondola` INT DEFAULT 12,
  `stock_actual_gondola` INT DEFAULT 0,
  `stock_deposito_trastienda` INT DEFAULT 0,
  `pasillo_gondola` VARCHAR(60) NULL,
  `posicion_estante` VARCHAR(60) NULL,
  `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
  `ultima_reposicion_fecha` DATE NULL,
  UNIQUE KEY `uk_prod_pdv` (`producto_id`, `punto_venta_id`),
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. LOTES Y VENCIMIENTOS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `lotes_vencimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_lote` VARCHAR(60) NOT NULL,
  `producto_id` INT NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `fecha_fabricacion` DATE NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `cantidad_disponible` INT NOT NULL DEFAULT 0,
  `ubicacion` ENUM('Góndola','Trastienda / Depósito') DEFAULT 'Trastienda / Depósito',
  `estado_lote` ENUM('Vigente','Por Vencer (<30d)','Crítico (<7d)','Vencido') DEFAULT 'Vigente',
  `accion_sugerida` ENUM('Rotación FEFO','Alerta Descuento','Devolución Proveedor','Baja por Vencimiento') DEFAULT 'Rotación FEFO',
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`),
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. PLANIFICACION DE RUTAS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `planificacion_rutas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_ruta` VARCHAR(25) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `repositor_id` INT NOT NULL,
  `dia_semana` ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
  `fecha_programada` DATE NOT NULL,
  `zona` VARCHAR(100) NOT NULL,
  `hora_inicio_estimada` TIME NOT NULL,
  `hora_fin_estimada` TIME NOT NULL,
  `estado` ENUM('Planificada','En Curso','Completada','Cancelada') DEFAULT 'Planificada',
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`repositor_id`) REFERENCES `repositores`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ruta_detalles_paradas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ruta_id` INT NOT NULL,
  `orden_secuencia` INT NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `hora_estimada_llegada` TIME NULL,
  `duracion_estimada_minutos` INT DEFAULT 90,
  `prioridad_visita` ENUM('Baja','Media','Alta','Urgente') DEFAULT 'Media',
  `completada` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`ruta_id`) REFERENCES `planificacion_rutas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 6. VISITAS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `visitas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_visita` VARCHAR(30) NOT NULL UNIQUE,
  `ruta_id` INT NULL,
  `repositor_id` INT NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_check_in` TIME NOT NULL,
  `hora_check_out` TIME NULL,
  `duracion_minutos` INT NULL,
  `estado_visita` ENUM('En Progreso','Completada','Con Incidencias','Cancelada') DEFAULT 'En Progreso',
  `cumplimiento_gondola_pct` DECIMAL(5,2) DEFAULT 0.00,
  `nombre_encargado_pdv` VARCHAR(120) NULL,
  `firma_conformidad` BOOLEAN DEFAULT FALSE,
  `observaciones_generales` TEXT NULL,
  `checklist_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ruta_id`) REFERENCES `planificacion_rutas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`repositor_id`) REFERENCES `repositores`(`id`),
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 7. REPOSICIONES
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `reposiciones_registros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_registro` VARCHAR(30) NOT NULL UNIQUE,
  `visita_id` INT NULL,
  `punto_venta_id` INT NOT NULL,
  `repositor_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `total_unidades_repuestas` INT DEFAULT 0,
  `quiebres_detectados` INT DEFAULT 0,
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`visita_id`) REFERENCES `visitas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`),
  FOREIGN KEY (`repositor_id`) REFERENCES `repositores`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reposicion_detalles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reposicion_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `stock_inicial_gondola` INT NOT NULL DEFAULT 0,
  `stock_trastienda_antes` INT NOT NULL DEFAULT 0,
  `cantidad_repuesta` INT NOT NULL DEFAULT 0,
  `stock_final_gondola` INT NOT NULL DEFAULT 0,
  `facings_resultantes` INT NOT NULL DEFAULT 1,
  `motivo_quiebre` VARCHAR(255) NULL,
  `estado_abastecimiento` ENUM('Abastecido','Quiebre Parcial','Quiebre Total','Excedente') DEFAULT 'Abastecido',
  FOREIGN KEY (`reposicion_id`) REFERENCES `reposiciones_registros`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 8. PEDIDOS DE PRODUCTOS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pedidos_productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_pedido` VARCHAR(30) NOT NULL UNIQUE,
  `fecha_pedido` DATE NOT NULL,
  `fecha_entrega_requerida` DATE NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `repositor_solicitante_id` INT NOT NULL,
  `tipo_pedido` ENUM('Reposición Ordinaria','Pedido Urgente Quiebre','Campaña Especial') DEFAULT 'Reposición Ordinaria',
  `estado` ENUM('Borrador','Solicitado','Aprobado','En Despacho','Entregado','Cancelado') DEFAULT 'Solicitado',
  `total_bultos` INT DEFAULT 0,
  `monto_total_estimado` DECIMAL(14,2) DEFAULT 0.00,
  `centro_distribucion_destino` VARCHAR(150) NULL,
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`),
  FOREIGN KEY (`repositor_solicitante_id`) REFERENCES `repositores`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `pedido_detalles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad_sugerida` INT NOT NULL DEFAULT 0,
  `cantidad_solicitada` INT NOT NULL DEFAULT 1,
  `precio_unitario_estimado` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `motivo` ENUM('Reposición Normal','Quiebre Crítico','Lanzamiento','Promoción / Oferta') DEFAULT 'Reposición Normal',
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_productos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 9. INCIDENCIAS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `incidencias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(30) NOT NULL UNIQUE,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `punto_venta_id` INT NOT NULL,
  `repositor_id` INT NOT NULL,
  `tipo_incidente_id` INT NOT NULL,
  `motivo_incidencia_id` INT NOT NULL,
  `prioridad` ENUM('Baja','Media','Alta','Urgente') DEFAULT 'Media',
  `producto_id` INT NULL,
  `descripcion` TEXT NOT NULL,
  `evidencia_fotografica_url` VARCHAR(255) NULL,
  `estado` ENUM('Abierta','En Gestión','Resuelta','Desestimada') DEFAULT 'Abierta',
  `accion_correctiva` TEXT NULL,
  `fecha_resolucion` DATE NULL,
  `responsable_resolucion` VARCHAR(120) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`punto_venta_id`) REFERENCES `puntos_venta`(`id`),
  FOREIGN KEY (`repositor_id`) REFERENCES `repositores`(`id`),
  FOREIGN KEY (`tipo_incidente_id`) REFERENCES `tipos_incidente`(`id`),
  FOREIGN KEY (`motivo_incidencia_id`) REFERENCES `motivos_incidencia`(`id`),
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 10. USUARIOS Y CONTROL DE ACCESO (HASH BCRYPT)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuarios` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


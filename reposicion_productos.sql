-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.1.30-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win32
-- HeidiSQL Versión:             12.21.0.7344
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando estructura para tabla reposicion_productos.categoria_producto
CREATE TABLE IF NOT EXISTS `categoria_producto` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) COLLATE utf8_spanish_ci NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.categoria_producto: ~7 rows (aproximadamente)
DELETE FROM `categoria_producto`;
INSERT INTO `categoria_producto` (`id_categoria`, `descripcion`, `estado`) VALUES
	(1, 'Alimentos', 1),
	(2, 'Bebidas', 1),
	(3, 'Limpieza', 1),
	(4, 'Cuidado personal', 1),
	(5, 'Medicamentos', 1),
	(6, 'Otros', 1),
	(9, 'Frutas y Verduras', 1);

-- Volcando estructura para tabla reposicion_productos.estado_general
CREATE TABLE IF NOT EXISTS `estado_general` (
  `id_estado` int(11) NOT NULL AUTO_INCREMENT,
  `entidad` varchar(40) COLLATE utf8_spanish_ci NOT NULL,
  `descripcion` varchar(50) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `entidad` (`entidad`,`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.estado_general: ~19 rows (aproximadamente)
DELETE FROM `estado_general`;
INSERT INTO `estado_general` (`id_estado`, `entidad`, `descripcion`) VALUES
	(1, 'RUTA', 'Planificada'),
	(2, 'RUTA', 'En curso'),
	(3, 'RUTA', 'Completada'),
	(4, 'RUTA', 'Parcial'),
	(5, 'RUTA', 'Cancelada'),
	(6, 'VISITA', 'Pendiente'),
	(7, 'VISITA', 'En curso'),
	(8, 'VISITA', 'Completada'),
	(9, 'VISITA', 'No realizada'),
	(10, 'REPOSICION', 'Pendiente'),
	(11, 'REPOSICION', 'Completada'),
	(12, 'PEDIDO', 'Pendiente'),
	(13, 'PEDIDO', 'Aprobado'),
	(14, 'PEDIDO', 'Entregado parcialmente'),
	(15, 'PEDIDO', 'Entregado'),
	(16, 'INCIDENCIA', 'Abierta'),
	(17, 'INCIDENCIA', 'En proceso'),
	(18, 'INCIDENCIA', 'Resuelta'),
	(19, 'INCIDENCIA', 'Cerrada');

-- Volcando estructura para tabla reposicion_productos.incidencia_detalle
CREATE TABLE IF NOT EXISTS `incidencia_detalle` (
  `id_incidencia_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_incidencia` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `id_motivo` int(11) NOT NULL,
  `cantidad_afectada` decimal(12,3) NOT NULL DEFAULT '0.000',
  `descripcion` varchar(500) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_incidencia_detalle`),
  KEY `id_incidencia` (`id_incidencia`),
  KEY `id_producto` (`id_producto`),
  KEY `id_motivo` (`id_motivo`),
  CONSTRAINT `incidencia_detalle_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `incidencias` (`id_incidencia`),
  CONSTRAINT `incidencia_detalle_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `incidencia_detalle_ibfk_3` FOREIGN KEY (`id_motivo`) REFERENCES `motivo_incidencia` (`id_motivo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.incidencia_detalle: ~2 rows (aproximadamente)
DELETE FROM `incidencia_detalle`;
INSERT INTO `incidencia_detalle` (`id_incidencia_detalle`, `id_incidencia`, `id_producto`, `id_motivo`, `cantidad_afectada`, `descripcion`) VALUES
	(5, 3, NULL, 6, 1.000, 'sin detalles'),
	(6, 4, 5, 4, 50.000, 'Diferencia de precio en el fleque como al pasar por linea de caja');

-- Volcando estructura para tabla reposicion_productos.incidencias
CREATE TABLE IF NOT EXISTS `incidencias` (
  `id_incidencia` int(11) NOT NULL AUTO_INCREMENT,
  `id_visita` int(11) DEFAULT NULL,
  `id_ruta_detalle` int(11) DEFAULT NULL,
  `id_repositor` int(11) NOT NULL,
  `id_tipo_incidente` int(11) NOT NULL,
  `fecha_incidencia` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` text COLLATE utf8_spanish_ci NOT NULL,
  `solucion_aplicada` text COLLATE utf8_spanish_ci,
  `requiere_nueva_visita` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_nueva_visita` date DEFAULT NULL,
  `id_estado` int(11) NOT NULL,
  PRIMARY KEY (`id_incidencia`),
  KEY `id_visita` (`id_visita`),
  KEY `id_ruta_detalle` (`id_ruta_detalle`),
  KEY `id_repositor` (`id_repositor`),
  KEY `id_tipo_incidente` (`id_tipo_incidente`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `incidencias_ibfk_1` FOREIGN KEY (`id_visita`) REFERENCES `visitas` (`id_visita`),
  CONSTRAINT `incidencias_ibfk_2` FOREIGN KEY (`id_ruta_detalle`) REFERENCES `ruta_detalle` (`id_ruta_detalle`),
  CONSTRAINT `incidencias_ibfk_3` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`),
  CONSTRAINT `incidencias_ibfk_4` FOREIGN KEY (`id_tipo_incidente`) REFERENCES `tipo_incidente` (`id_tipo_incidente`),
  CONSTRAINT `incidencias_ibfk_5` FOREIGN KEY (`id_estado`) REFERENCES `estado_general` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.incidencias: ~2 rows (aproximadamente)
DELETE FROM `incidencias`;
INSERT INTO `incidencias` (`id_incidencia`, `id_visita`, `id_ruta_detalle`, `id_repositor`, `id_tipo_incidente`, `fecha_incidencia`, `descripcion`, `solucion_aplicada`, `requiere_nueva_visita`, `fecha_nueva_visita`, `id_estado`) VALUES
	(3, 4, 8, 3, 5, '2026-10-23 17:15:00', 'problemas con el personal de guardia para el ingreso al local', NULL, 1, '2026-10-27', 16),
	(4, 9, 9, 4, 2, '2026-10-26 19:08:00', 'Diferencia de precio del producto', NULL, 1, '2026-10-29', 16);

-- Volcando estructura para tabla reposicion_productos.lotes_producto
CREATE TABLE IF NOT EXISTS `lotes_producto` (
  `id_lote` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_punto_venta` int(11) NOT NULL,
  `numero_lote` varchar(80) COLLATE utf8_spanish_ci NOT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `fecha_vencimiento` date NOT NULL,
  `cantidad_deposito` decimal(12,3) NOT NULL DEFAULT '0.000',
  `cantidad_gondola` decimal(12,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id_lote`),
  UNIQUE KEY `id_producto` (`id_producto`,`id_punto_venta`,`numero_lote`),
  KEY `id_punto_venta` (`id_punto_venta`),
  CONSTRAINT `lotes_producto_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `lotes_producto_ibfk_2` FOREIGN KEY (`id_punto_venta`) REFERENCES `puntos_venta` (`id_punto_venta`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.lotes_producto: ~2 rows (aproximadamente)
DELETE FROM `lotes_producto`;
INSERT INTO `lotes_producto` (`id_lote`, `id_producto`, `id_punto_venta`, `numero_lote`, `fecha_ingreso`, `fecha_vencimiento`, `cantidad_deposito`, `cantidad_gondola`) VALUES
	(4, 4, 3, 'LE-2026-001', '2026-10-23', '2026-11-22', 420.000, 80.000),
	(5, 5, 3, 'LB-2026-001', '2026-10-23', '2026-11-22', 800.000, 50.000);

-- Volcando estructura para tabla reposicion_productos.marca
CREATE TABLE IF NOT EXISTS `marca` (
  `id_marca` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) COLLATE utf8_spanish_ci NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_marca`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.marca: ~7 rows (aproximadamente)
DELETE FROM `marca`;
INSERT INTO `marca` (`id_marca`, `descripcion`, `estado`) VALUES
	(2, 'Lactolanda', 1),
	(3, 'Trebol', 1),
	(4, 'Pepsi', 1),
	(5, 'Bimbo', 1),
	(6, 'Paso de los Toros', 1),
	(7, 'Ochsi', 1),
	(8, 'Protex', 1);

-- Volcando estructura para tabla reposicion_productos.motivo_incidencia
CREATE TABLE IF NOT EXISTS `motivo_incidencia` (
  `id_motivo` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) COLLATE utf8_spanish_ci NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_motivo`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.motivo_incidencia: ~10 rows (aproximadamente)
DELETE FROM `motivo_incidencia`;
INSERT INTO `motivo_incidencia` (`id_motivo`, `descripcion`, `estado`) VALUES
	(1, 'Producto vencido', 1),
	(2, 'Producto proximo a vencer', 1),
	(3, 'Falta de stock', 1),
	(4, 'Precio incorrecto', 1),
	(5, 'Producto dañado', 1),
	(6, 'Acceso denegado', 1),
	(7, 'Punto de venta cerrado', 1),
	(8, 'Demora en el recorrido', 1),
	(9, 'Falta de mercaderia', 1),
	(10, 'Otro', 1);

-- Volcando estructura para tabla reposicion_productos.pedido_detalle
CREATE TABLE IF NOT EXISTS `pedido_detalle` (
  `id_pedido_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad_solicitada` decimal(12,3) NOT NULL,
  `cantidad_recibida` decimal(12,3) NOT NULL DEFAULT '0.000',
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id_pedido_detalle`),
  UNIQUE KEY `id_pedido` (`id_pedido`,`id_producto`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `pedido_detalle_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `pedido_detalle_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.pedido_detalle: ~2 rows (aproximadamente)
DELETE FROM `pedido_detalle`;
INSERT INTO `pedido_detalle` (`id_pedido_detalle`, `id_pedido`, `id_producto`, `cantidad_solicitada`, `cantidad_recibida`, `precio_unitario`) VALUES
	(8, 5, 4, 400.000, 400.000, 5000.00),
	(9, 6, 5, 800.000, 800.000, 4500.00);

-- Volcando estructura para tabla reposicion_productos.pedidos
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `numero_pedido` varchar(40) COLLATE utf8_spanish_ci NOT NULL,
  `id_punto_venta` int(11) NOT NULL,
  `id_repositor` int(11) NOT NULL,
  `fecha_pedido` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega_prevista` date DEFAULT NULL,
  `id_estado` int(11) NOT NULL,
  `observacion` text COLLATE utf8_spanish_ci,
  PRIMARY KEY (`id_pedido`),
  UNIQUE KEY `numero_pedido` (`numero_pedido`),
  KEY `id_punto_venta` (`id_punto_venta`),
  KEY `id_repositor` (`id_repositor`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_punto_venta`) REFERENCES `puntos_venta` (`id_punto_venta`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`),
  CONSTRAINT `pedidos_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estado_general` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.pedidos: ~2 rows (aproximadamente)
DELETE FROM `pedidos`;
INSERT INTO `pedidos` (`id_pedido`, `numero_pedido`, `id_punto_venta`, `id_repositor`, `fecha_pedido`, `fecha_entrega_prevista`, `id_estado`, `observacion`) VALUES
	(5, 'PED-202610-001', 3, 3, '2026-10-23 16:49:00', '2026-10-24', 12, NULL),
	(6, 'PED-202610-002', 4, 4, '2026-10-27 19:07:00', '2026-10-28', 12, NULL);

-- Volcando estructura para tabla reposicion_productos.prioridad
CREATE TABLE IF NOT EXISTS `prioridad` (
  `id_prioridad` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(30) COLLATE utf8_spanish_ci NOT NULL,
  `nivel` int(11) NOT NULL,
  `minutos_estimados` int(11) NOT NULL DEFAULT '30',
  PRIMARY KEY (`id_prioridad`),
  UNIQUE KEY `descripcion` (`descripcion`),
  UNIQUE KEY `nivel` (`nivel`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.prioridad: ~4 rows (aproximadamente)
DELETE FROM `prioridad`;
INSERT INTO `prioridad` (`id_prioridad`, `descripcion`, `nivel`, `minutos_estimados`) VALUES
	(1, 'Baja', 1, 20),
	(2, 'Normal', 2, 30),
	(3, 'Alta', 3, 40),
	(4, 'Urgente', 4, 45);

-- Volcando estructura para tabla reposicion_productos.producto_punto_venta
CREATE TABLE IF NOT EXISTS `producto_punto_venta` (
  `id_producto_pv` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_punto_venta` int(11) NOT NULL,
  `precio_esperado` decimal(14,2) NOT NULL,
  `fecha_vigencia_desde` date NOT NULL,
  `fecha_vigencia_hasta` date DEFAULT NULL,
  `stock_minimo` decimal(12,3) NOT NULL DEFAULT '0.000',
  `stock_objetivo` decimal(12,3) NOT NULL DEFAULT '10.000',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_producto_pv`),
  UNIQUE KEY `id_producto` (`id_producto`,`id_punto_venta`,`fecha_vigencia_desde`),
  KEY `id_punto_venta` (`id_punto_venta`),
  CONSTRAINT `producto_punto_venta_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `producto_punto_venta_ibfk_2` FOREIGN KEY (`id_punto_venta`) REFERENCES `puntos_venta` (`id_punto_venta`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.producto_punto_venta: ~2 rows (aproximadamente)
DELETE FROM `producto_punto_venta`;
INSERT INTO `producto_punto_venta` (`id_producto_pv`, `id_producto`, `id_punto_venta`, `precio_esperado`, `fecha_vigencia_desde`, `fecha_vigencia_hasta`, `stock_minimo`, `stock_objetivo`, `activo`) VALUES
	(4, 4, 3, 5000.00, '2026-10-23', '2026-10-26', 80.000, 10.000, 1),
	(5, 5, 4, 4500.00, '2026-10-23', '2026-10-28', 50.000, 10.000, 1);

-- Volcando estructura para tabla reposicion_productos.productos
CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) COLLATE utf8_spanish_ci NOT NULL,
  `codigo_barras` varchar(80) COLLATE utf8_spanish_ci DEFAULT NULL,
  `descripcion` varchar(180) COLLATE utf8_spanish_ci NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_marca` int(11) DEFAULT NULL,
  `id_unidad` int(11) NOT NULL,
  `dias_alerta_vencimiento` int(11) NOT NULL DEFAULT '30',
  `stock_minimo_gondola` decimal(12,3) NOT NULL DEFAULT '0.000',
  `stock_objetivo_gondola` decimal(12,3) NOT NULL DEFAULT '10.000',
  `precio_referencia` decimal(14,2) NOT NULL DEFAULT '0.00',
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `id_categoria` (`id_categoria`),
  KEY `id_marca` (`id_marca`),
  KEY `id_unidad` (`id_unidad`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_producto` (`id_categoria`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_marca`) REFERENCES `marca` (`id_marca`),
  CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`id_unidad`) REFERENCES `unidad_medida` (`id_unidad`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.productos: ~2 rows (aproximadamente)
DELETE FROM `productos`;
INSERT INTO `productos` (`id_producto`, `codigo`, `codigo_barras`, `descripcion`, `id_categoria`, `id_marca`, `id_unidad`, `dias_alerta_vencimiento`, `stock_minimo_gondola`, `stock_objetivo_gondola`, `precio_referencia`, `estado`) VALUES
	(4, 'LAC-LECH-01', '0945645355753452', 'Leche entera', 1, 3, 5, 30, 80.000, 10.000, 5000.00, 1),
	(5, 'JB-JAPB-001', '0956356345654', 'Jabón para baño', 4, 8, 9, 180, 50.000, 10.000, 4500.00, 1);

-- Volcando estructura para tabla reposicion_productos.puntos_venta
CREATE TABLE IF NOT EXISTS `puntos_venta` (
  `id_punto_venta` int(11) NOT NULL AUTO_INCREMENT,
  `id_tipo_punto` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8_spanish_ci NOT NULL,
  `ruc` varchar(30) COLLATE utf8_spanish_ci DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8_spanish_ci NOT NULL,
  `ciudad` varchar(100) COLLATE utf8_spanish_ci DEFAULT NULL,
  `departamento` varchar(100) COLLATE utf8_spanish_ci DEFAULT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  `contacto` varchar(100) COLLATE utf8_spanish_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8_spanish_ci DEFAULT NULL,
  `hora_apertura` time DEFAULT NULL,
  `hora_cierre` time DEFAULT NULL,
  `frecuencia_visita_dias` int(11) NOT NULL DEFAULT '7',
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_punto_venta`),
  KEY `id_tipo_punto` (`id_tipo_punto`),
  CONSTRAINT `puntos_venta_ibfk_1` FOREIGN KEY (`id_tipo_punto`) REFERENCES `tipo_punto_venta` (`id_tipo_punto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.puntos_venta: ~2 rows (aproximadamente)
DELETE FROM `puntos_venta`;
INSERT INTO `puntos_venta` (`id_punto_venta`, `id_tipo_punto`, `nombre`, `ruc`, `direccion`, `ciudad`, `departamento`, `latitud`, `longitud`, `contacto`, `telefono`, `hora_apertura`, `hora_cierre`, `frecuencia_visita_dias`, `estado`) VALUES
	(3, 1, 'Stock Itaugua', '80467546-9', 'Ruta PY02 entre Av. Luis Salinas y Cerro Corá', 'Itauguá', 'Central', NULL, NULL, 'Gabriela Rios', '0294345632', '07:00:00', '21:00:00', 7, 1),
	(4, 1, 'Superseis', '8012454-6', 'Ruta PY02 e/ Ruta D027', 'San Lorenzo', 'Central', NULL, NULL, 'Jorge Martinez', '0973656456', '07:00:00', '21:30:00', 3, 1);

-- Volcando estructura para tabla reposicion_productos.reposicion_detalle
CREATE TABLE IF NOT EXISTS `reposicion_detalle` (
  `id_reposicion_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_reposicion` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad_repuesta` decimal(12,3) NOT NULL,
  `cantidad_retirada` decimal(12,3) NOT NULL DEFAULT '0.000',
  `observacion` varchar(300) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id_reposicion_detalle`),
  UNIQUE KEY `id_reposicion` (`id_reposicion`,`id_producto`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `reposicion_detalle_ibfk_1` FOREIGN KEY (`id_reposicion`) REFERENCES `reposiciones` (`id_reposicion`),
  CONSTRAINT `reposicion_detalle_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.reposicion_detalle: ~2 rows (aproximadamente)
DELETE FROM `reposicion_detalle`;
INSERT INTO `reposicion_detalle` (`id_reposicion_detalle`, `id_reposicion`, `id_producto`, `cantidad_repuesta`, `cantidad_retirada`, `observacion`) VALUES
	(7, 4, 4, 70.000, 10.000, NULL),
	(8, 5, 5, 80.000, 15.000, NULL);

-- Volcando estructura para tabla reposicion_productos.reposiciones
CREATE TABLE IF NOT EXISTS `reposiciones` (
  `id_reposicion` int(11) NOT NULL AUTO_INCREMENT,
  `id_visita` int(11) NOT NULL,
  `fecha_reposicion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_repositor` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `observacion` text COLLATE utf8_spanish_ci,
  PRIMARY KEY (`id_reposicion`),
  KEY `id_visita` (`id_visita`),
  KEY `id_repositor` (`id_repositor`),
  KEY `id_estado` (`id_estado`),
  KEY `idx_reposicion_fecha` (`fecha_reposicion`),
  CONSTRAINT `reposiciones_ibfk_1` FOREIGN KEY (`id_visita`) REFERENCES `visitas` (`id_visita`),
  CONSTRAINT `reposiciones_ibfk_2` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`),
  CONSTRAINT `reposiciones_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estado_general` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.reposiciones: ~2 rows (aproximadamente)
DELETE FROM `reposiciones`;
INSERT INTO `reposiciones` (`id_reposicion`, `id_visita`, `fecha_reposicion`, `id_repositor`, `id_estado`, `observacion`) VALUES
	(4, 4, '2026-10-23 16:32:00', 3, 10, NULL),
	(5, 9, '2026-10-26 19:06:00', 4, 10, NULL);

-- Volcando estructura para tabla reposicion_productos.repositores
CREATE TABLE IF NOT EXISTS `repositores` (
  `id_repositor` int(11) NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) COLLATE utf8_spanish_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8_spanish_ci NOT NULL,
  `documento` varchar(30) COLLATE utf8_spanish_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8_spanish_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8_spanish_ci DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_repositor`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.repositores: ~2 rows (aproximadamente)
DELETE FROM `repositores`;
INSERT INTO `repositores` (`id_repositor`, `nombres`, `apellidos`, `documento`, `telefono`, `email`, `hora_inicio`, `hora_fin`, `estado`) VALUES
	(3, 'Luis', 'Guzman', '3452363', '0991652424', 'lguzman@stock.com.py', '08:00:00', '14:00:00', 1),
	(4, 'Richard', 'Fernandez', '3446457', '0981634578', 'rfernandez@mail.com', '14:00:00', '21:00:00', 1);

-- Volcando estructura para tabla reposicion_productos.ruta_detalle
CREATE TABLE IF NOT EXISTS `ruta_detalle` (
  `id_ruta_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_ruta` int(11) NOT NULL,
  `id_punto_venta` int(11) NOT NULL,
  `orden_visita` int(11) NOT NULL,
  `id_prioridad` int(11) NOT NULL,
  `hora_estimada_llegada` time DEFAULT NULL,
  `minutos_estimados` int(11) NOT NULL DEFAULT '30',
  `minutos_traslado_estimados` int(11) NOT NULL DEFAULT '0',
  `motivo_visita` varchar(200) COLLATE utf8_spanish_ci DEFAULT NULL,
  `visitado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_ruta_detalle`),
  UNIQUE KEY `id_ruta` (`id_ruta`,`orden_visita`),
  KEY `id_punto_venta` (`id_punto_venta`),
  KEY `id_prioridad` (`id_prioridad`),
  CONSTRAINT `ruta_detalle_ibfk_1` FOREIGN KEY (`id_ruta`) REFERENCES `rutas` (`id_ruta`),
  CONSTRAINT `ruta_detalle_ibfk_2` FOREIGN KEY (`id_punto_venta`) REFERENCES `puntos_venta` (`id_punto_venta`),
  CONSTRAINT `ruta_detalle_ibfk_3` FOREIGN KEY (`id_prioridad`) REFERENCES `prioridad` (`id_prioridad`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.ruta_detalle: ~2 rows (aproximadamente)
DELETE FROM `ruta_detalle`;
INSERT INTO `ruta_detalle` (`id_ruta_detalle`, `id_ruta`, `id_punto_venta`, `orden_visita`, `id_prioridad`, `hora_estimada_llegada`, `minutos_estimados`, `minutos_traslado_estimados`, `motivo_visita`, `visitado`) VALUES
	(8, 5, 3, 1, 2, '08:05:00', 30, 60, 'control de precios y vencimientos', 0),
	(9, 6, 4, 1, 2, '14:00:00', 30, 60, 'Reposición de góndola', 0);

-- Volcando estructura para tabla reposicion_productos.rutas
CREATE TABLE IF NOT EXISTS `rutas` (
  `id_ruta` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `id_repositor` int(11) NOT NULL,
  `hora_inicio_plan` time NOT NULL,
  `hora_fin_plan` time NOT NULL,
  `descripcion` varchar(200) COLLATE utf8_spanish_ci DEFAULT NULL,
  `id_estado` int(11) NOT NULL,
  `observacion` text COLLATE utf8_spanish_ci,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ruta`),
  KEY `id_repositor` (`id_repositor`),
  KEY `id_estado` (`id_estado`),
  KEY `idx_ruta_fecha_repositor` (`fecha`,`id_repositor`),
  CONSTRAINT `rutas_ibfk_1` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`),
  CONSTRAINT `rutas_ibfk_2` FOREIGN KEY (`id_estado`) REFERENCES `estado_general` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.rutas: ~2 rows (aproximadamente)
DELETE FROM `rutas`;
INSERT INTO `rutas` (`id_ruta`, `fecha`, `id_repositor`, `hora_inicio_plan`, `hora_fin_plan`, `descripcion`, `id_estado`, `observacion`, `fecha_creacion`) VALUES
	(5, '2026-10-26', 3, '08:00:00', '14:00:00', 'Circuito x', 1, 'Revisión de inventario de lácteos', '2026-10-23 15:46:34'),
	(6, '2026-10-23', 4, '14:00:00', '21:00:00', 'Aratirí', 1, NULL, '2026-10-23 19:02:30');

-- Volcando estructura para tabla reposicion_productos.tipo_incidente
CREATE TABLE IF NOT EXISTS `tipo_incidente` (
  `id_tipo_incidente` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(80) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_tipo_incidente`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.tipo_incidente: ~8 rows (aproximadamente)
DELETE FROM `tipo_incidente`;
INSERT INTO `tipo_incidente` (`id_tipo_incidente`, `descripcion`) VALUES
	(1, 'Vencimiento'),
	(2, 'Precio'),
	(3, 'Stock'),
	(4, 'Acceso al establecimiento'),
	(5, 'Demora'),
	(6, 'Problema de transporte'),
	(7, 'Ausencia del repositor'),
	(8, 'Otro');

-- Volcando estructura para tabla reposicion_productos.tipo_punto_venta
CREATE TABLE IF NOT EXISTS `tipo_punto_venta` (
  `id_tipo_punto` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(60) COLLATE utf8_spanish_ci NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_tipo_punto`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.tipo_punto_venta: ~6 rows (aproximadamente)
DELETE FROM `tipo_punto_venta`;
INSERT INTO `tipo_punto_venta` (`id_tipo_punto`, `descripcion`, `estado`) VALUES
	(1, 'Supermercado', 1),
	(2, 'Farmacia', 1),
	(3, 'Despensa', 1),
	(4, 'Tienda', 1),
	(5, 'Almacen mayorista', 1),
	(6, 'Almacen minorista', 1);

-- Volcando estructura para tabla reposicion_productos.unidad_medida
CREATE TABLE IF NOT EXISTS `unidad_medida` (
  `id_unidad` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(50) COLLATE utf8_spanish_ci NOT NULL,
  `abreviatura` varchar(10) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_unidad`),
  UNIQUE KEY `descripcion` (`descripcion`),
  UNIQUE KEY `abreviatura` (`abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.unidad_medida: ~7 rows (aproximadamente)
DELETE FROM `unidad_medida`;
INSERT INTO `unidad_medida` (`id_unidad`, `descripcion`, `abreviatura`) VALUES
	(1, 'Unidad', 'un'),
	(2, 'Paquete', 'paq'),
	(3, 'Caja', 'caja'),
	(4, 'Kilogramo', 'kg'),
	(5, 'Litro', 'L'),
	(6, 'Docena', 'doc'),
	(9, 'Miligramo', 'Ml');

-- Volcando estructura para tabla reposicion_productos.visita_detalle
CREATE TABLE IF NOT EXISTS `visita_detalle` (
  `id_visita_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_visita` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `stock_gondola` decimal(12,3) NOT NULL DEFAULT '0.000',
  `stock_deposito` decimal(12,3) NOT NULL DEFAULT '0.000',
  `cantidad_danada` decimal(12,3) NOT NULL DEFAULT '0.000',
  `precio_cartel` decimal(14,2) DEFAULT NULL,
  `precio_esperado` decimal(14,2) DEFAULT NULL,
  `fecha_vencimiento_mas_proxima` date DEFAULT NULL,
  `requiere_reposicion` tinyint(1) NOT NULL DEFAULT '0',
  `requiere_cambio_precio` tinyint(1) NOT NULL DEFAULT '0',
  `observacion` varchar(500) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id_visita_detalle`),
  UNIQUE KEY `id_visita` (`id_visita`,`id_producto`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `visita_detalle_ibfk_1` FOREIGN KEY (`id_visita`) REFERENCES `visitas` (`id_visita`),
  CONSTRAINT `visita_detalle_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.visita_detalle: ~2 rows (aproximadamente)
DELETE FROM `visita_detalle`;
INSERT INTO `visita_detalle` (`id_visita_detalle`, `id_visita`, `id_producto`, `stock_gondola`, `stock_deposito`, `cantidad_danada`, `precio_cartel`, `precio_esperado`, `fecha_vencimiento_mas_proxima`, `requiere_reposicion`, `requiere_cambio_precio`, `observacion`) VALUES
	(7, 4, 4, 80.000, 400.000, 2.000, 5000.00, 5000.00, '2026-11-27', 0, 0, NULL),
	(8, 9, 5, 50.000, 800.000, 0.000, 5000.00, 4500.00, '2026-11-10', 0, 1, 'Diferencia de precio');

-- Volcando estructura para tabla reposicion_productos.visitas
CREATE TABLE IF NOT EXISTS `visitas` (
  `id_visita` int(11) NOT NULL AUTO_INCREMENT,
  `id_ruta_detalle` int(11) DEFAULT NULL,
  `id_repositor` int(11) NOT NULL,
  `id_punto_venta` int(11) NOT NULL,
  `fecha_visita` date NOT NULL,
  `hora_llegada` datetime DEFAULT NULL,
  `hora_salida` datetime DEFAULT NULL,
  `id_estado` int(11) NOT NULL,
  `observacion` text COLLATE utf8_spanish_ci,
  `latitud_registro` decimal(10,7) DEFAULT NULL,
  `longitud_registro` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id_visita`),
  KEY `id_ruta_detalle` (`id_ruta_detalle`),
  KEY `id_repositor` (`id_repositor`),
  KEY `id_punto_venta` (`id_punto_venta`),
  KEY `id_estado` (`id_estado`),
  KEY `idx_visita_fecha_punto` (`fecha_visita`,`id_punto_venta`),
  CONSTRAINT `visitas_ibfk_1` FOREIGN KEY (`id_ruta_detalle`) REFERENCES `ruta_detalle` (`id_ruta_detalle`),
  CONSTRAINT `visitas_ibfk_2` FOREIGN KEY (`id_repositor`) REFERENCES `repositores` (`id_repositor`),
  CONSTRAINT `visitas_ibfk_3` FOREIGN KEY (`id_punto_venta`) REFERENCES `puntos_venta` (`id_punto_venta`),
  CONSTRAINT `visitas_ibfk_4` FOREIGN KEY (`id_estado`) REFERENCES `estado_general` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- Volcando datos para la tabla reposicion_productos.visitas: ~2 rows (aproximadamente)
DELETE FROM `visitas`;
INSERT INTO `visitas` (`id_visita`, `id_ruta_detalle`, `id_repositor`, `id_punto_venta`, `fecha_visita`, `hora_llegada`, `hora_salida`, `id_estado`, `observacion`, `latitud_registro`, `longitud_registro`) VALUES
	(4, 8, 3, 3, '2026-10-26', '2026-10-26 08:05:00', '2026-10-26 14:10:00', 6, NULL, NULL, NULL),
	(9, 9, 4, 4, '2026-10-23', '2026-10-26 14:00:00', '2026-10-26 21:00:00', 6, NULL, NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

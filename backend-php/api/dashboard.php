<?php
/**
 * RepoStock Pro - API Dashboard / Resumen General
 * Provee métricas y resúmenes en tiempo real desde MySQL (base de datos reposicion_productos)
 * para los widgets de Resumen General.
 */

require_once __DIR__ . '/../config/db.php';

if (!isset($pdo) || !$pdo) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'No se pudo conectar a la base de datos MySQL reposicion_productos.'
            . (isset($db_connection_error) ? ' ' . $db_connection_error : '')
    ], 500);
}

try {
    // 1. KPI: Puntos de Venta
    $stmtPdv = $pdo->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 1 THEN 1 ELSE 0 END) AS activos
        FROM puntos_venta
    ");
    $pdvStats = $stmtPdv->fetch() ?: ['total' => 0, 'activos' => 0];

    // 2. KPI: Repositores
    $stmtRep = $pdo->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 1 THEN 1 ELSE 0 END) AS activos
        FROM repositores
    ");
    $repStats = $stmtRep->fetch() ?: ['total' => 0, 'activos' => 0];

    // Repositores con rutas asignadas activas (planificadas o en curso)
    $stmtRepRuta = $pdo->query("
        SELECT COUNT(DISTINCT id_repositor)
        FROM rutas
        WHERE id_estado IN (1, 2)
    ");
    $repEnRuta = (int) $stmtRepRuta->fetchColumn();

    // 3. KPI: Visitas
    $stmtVisitas = $pdo->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN fecha_visita = CURDATE() THEN 1 ELSE 0 END) AS hoy,
            SUM(CASE WHEN id_estado = 7 THEN 1 ELSE 0 END) AS en_curso,
            SUM(CASE WHEN id_estado = 8 THEN 1 ELSE 0 END) AS completadas
        FROM visitas
    ");
    $visitasStats = $stmtVisitas->fetch() ?: ['total' => 0, 'hoy' => 0, 'en_curso' => 0, 'completadas' => 0];

    // 4. KPI: Unidades Repuestas (Suma de cantidad_repuesta de reposicion_detalle)
    $stmtRepuestas = $pdo->query("
        SELECT 
            COALESCE(SUM(cantidad_repuesta), 0) AS total_repuestas,
            COALESCE(SUM(cantidad_retirada), 0) AS total_retiradas
        FROM reposicion_detalle
    ");
    $repuestasStats = $stmtRepuestas->fetch() ?: ['total_repuestas' => 0, 'total_retiradas' => 0];

    // 5. KPI: Lotes y Vencimientos (FEFO)
    $stmtLotesKpi = $pdo->query("
        SELECT 
            COUNT(*) AS total_lotes,
            SUM(CASE WHEN fecha_vencimiento <= CURDATE() THEN 1 ELSE 0 END) AS vencidos,
            SUM(CASE WHEN fecha_vencimiento > CURDATE() AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS criticos_7d,
            SUM(CASE WHEN fecha_vencimiento > CURDATE() AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS proximos_30d,
            COALESCE(SUM(cantidad_deposito), 0) AS stock_deposito,
            COALESCE(SUM(cantidad_gondola), 0) AS stock_gondola
        FROM lotes_producto
    ");
    $lotesKpi = $stmtLotesKpi->fetch() ?: [
        'total_lotes' => 0,
        'vencidos' => 0,
        'criticos_7d' => 0,
        'proximos_30d' => 0,
        'stock_deposito' => 0,
        'stock_gondola' => 0
    ];

    // 6. KPI: Incidencias (16 = Abierta, 17 = En proceso)
    $stmtIncKpi = $pdo->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN id_estado IN (16, 17) THEN 1 ELSE 0 END) AS abiertas,
            SUM(CASE WHEN id_estado = 18 THEN 1 ELSE 0 END) AS resueltas,
            SUM(CASE WHEN id_estado = 19 THEN 1 ELSE 0 END) AS cerradas
        FROM incidencias
    ");
    $incKpi = $stmtIncKpi->fetch() ?: ['total' => 0, 'abiertas' => 0, 'resueltas' => 0, 'cerradas' => 0];

    // 7. Lista: Lotes Próximos a Vencer (Orden FEFO)
    $stmtLotesCriticos = $pdo->query("
        SELECT 
            l.id_lote,
            l.numero_lote,
            l.fecha_ingreso,
            l.fecha_vencimiento,
            l.cantidad_deposito,
            l.cantidad_gondola,
            (l.cantidad_deposito + l.cantidad_gondola) AS cantidad_total,
            p.codigo AS producto_codigo,
            p.descripcion AS producto_descripcion,
            pv.nombre AS punto_venta_nombre,
            pv.ciudad AS punto_venta_ciudad,
            DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes,
            CASE 
                WHEN l.fecha_vencimiento <= CURDATE() THEN 'Vencido'
                WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) <= 7 THEN 'Crítico (<7d)'
                WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) <= 30 THEN 'Próximo (<30d)'
                ELSE 'Normal'
            END AS estado_fefo
        FROM lotes_producto l
        INNER JOIN productos p ON p.id_producto = l.id_producto
        INNER JOIN puntos_venta pv ON pv.id_punto_venta = l.id_punto_venta
        ORDER BY l.fecha_vencimiento ASC, l.numero_lote ASC
        LIMIT 6
    ");
    $lotesCriticos = $stmtLotesCriticos->fetchAll();

    // 8. Lista: Incidencias Recientes
    $stmtIncRecientes = $pdo->query("
        SELECT 
            i.id_incidencia,
            i.fecha_incidencia,
            i.descripcion,
            i.solucion_aplicada,
            i.requiere_nueva_visita,
            i.fecha_nueva_visita,
            ti.descripcion AS tipo_incidente_nombre,
            eg.descripcion AS estado_nombre,
            CONCAT(r.nombres, ' ', r.apellidos) AS repositor_nombre,
            COALESCE(pv.nombre, rdpv.nombre, 'Sin PDV asignado') AS punto_venta_nombre,
            (SELECT COUNT(*) FROM incidencia_detalle d WHERE d.id_incidencia = i.id_incidencia) AS total_productos_afectados
        FROM incidencias i
        LEFT JOIN visitas v ON v.id_visita = i.id_visita
        LEFT JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
        LEFT JOIN ruta_detalle rd ON rd.id_ruta_detalle = i.id_ruta_detalle
        LEFT JOIN puntos_venta rdpv ON rdpv.id_punto_venta = rd.id_punto_venta
        LEFT JOIN repositores r ON r.id_repositor = i.id_repositor
        LEFT JOIN tipo_incidente ti ON ti.id_tipo_incidente = i.id_tipo_incidente
        LEFT JOIN estado_general eg ON eg.id_estado = i.id_estado
        ORDER BY i.fecha_incidencia DESC, i.id_incidencia DESC
        LIMIT 5
    ");
    $incidenciasRecientes = $stmtIncRecientes->fetchAll();

    // 9. Lista: Visitas y Auditorías Recientes
    $stmtVisitasRecientes = $pdo->query("
        SELECT 
            v.id_visita,
            CONCAT('VIS-', LPAD(v.id_visita, 4, '0')) AS codigo_visita,
            v.fecha_visita,
            DATE_FORMAT(v.hora_llegada, '%H:%i') AS hora_check_in,
            DATE_FORMAT(v.hora_salida, '%H:%i') AS hora_check_out,
            v.id_estado,
            eg.descripcion AS estado_nombre,
            pv.nombre AS punto_venta_nombre,
            pv.contacto AS encargado_pdv,
            CONCAT(re.nombres, ' ', re.apellidos) AS repositor_nombre,
            (SELECT COUNT(*) FROM visita_detalle vd WHERE vd.id_visita = v.id_visita) AS total_items,
            (SELECT COUNT(*) FROM visita_detalle vd WHERE vd.id_visita = v.id_visita AND vd.requiere_reposicion = 1) AS items_reposicion,
            (SELECT COUNT(*) FROM visita_detalle vd WHERE vd.id_visita = v.id_visita AND vd.requiere_cambio_precio = 1) AS items_cambio_precio
        FROM visitas v
        INNER JOIN puntos_venta pv ON pv.id_punto_venta = v.id_punto_venta
        INNER JOIN repositores re ON re.id_repositor = v.id_repositor
        INNER JOIN estado_general eg ON eg.id_estado = v.id_estado
        ORDER BY v.fecha_visita DESC, v.id_visita DESC
        LIMIT 6
    ");
    $visitasRecientes = $stmtVisitasRecientes->fetchAll();

    // 10. Totales adicionales para completitud
    $stmtRutas = $pdo->query("SELECT COUNT(*) FROM rutas");
    $totalRutas = (int) $stmtRutas->fetchColumn();

    $stmtPedidos = $pdo->query("SELECT COUNT(*) FROM pedidos");
    $totalPedidos = (int) $stmtPedidos->fetchColumn();

    sendJsonResponse([
        'status' => 'success',
        'database' => $db_name,
        'timestamp' => date('Y-m-d H:i:s'),
        'data' => [
            'kpis' => [
                'puntosVenta' => [
                    'total' => (int) $pdvStats['total'],
                    'activos' => (int) $pdvStats['activos']
                ],
                'repositores' => [
                    'total' => (int) $repStats['total'],
                    'activos' => (int) $repStats['activos'],
                    'enRuta' => (int) $repEnRuta
                ],
                'visitas' => [
                    'total' => (int) $visitasStats['total'],
                    'hoy' => (int) $visitasStats['hoy'],
                    'enCurso' => (int) $visitasStats['en_curso'],
                    'completadas' => (int) $visitasStats['completadas']
                ],
                'unidadesRepuestas' => [
                    'total' => (float) $repuestasStats['total_repuestas'],
                    'retiradas' => (float) $repuestasStats['total_retiradas']
                ],
                'lotes' => [
                    'total' => (int) $lotesKpi['total_lotes'],
                    'vencidos' => (int) $lotesKpi['vencidos'],
                    'criticos7d' => (int) $lotesKpi['criticos_7d'],
                    'proximos30d' => (int) $lotesKpi['proximos_30d'],
                    'alertasTotal' => (int) $lotesKpi['vencidos'] + (int) $lotesKpi['criticos_7d'] + (int) $lotesKpi['proximos_30d'],
                    'stockDeposito' => (float) $lotesKpi['stock_deposito'],
                    'stockGondola' => (float) $lotesKpi['stock_gondola']
                ],
                'incidencias' => [
                    'total' => (int) $incKpi['total'],
                    'abiertas' => (int) $incKpi['abiertas'],
                    'resueltas' => (int) $incKpi['resueltas'],
                    'cerradas' => (int) $incKpi['cerradas']
                ],
                'rutas' => [
                    'total' => $totalRutas
                ],
                'pedidos' => [
                    'total' => $totalPedidos
                ]
            ],
            'lotesCriticos' => $lotesCriticos,
            'incidenciasRecientes' => $incidenciasRecientes,
            'visitasRecientes' => $visitasRecientes
        ]
    ]);

} catch (PDOException $e) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error al consultar las métricas de la base de datos MySQL: ' . $e->getMessage()
    ], 500);
}

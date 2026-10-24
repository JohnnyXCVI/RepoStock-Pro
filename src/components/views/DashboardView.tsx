import React, { useEffect, useState } from 'react';
import {
  Store,
  Users,
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  RefreshCw,
  ChevronRight,
  Package,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Truck
} from 'lucide-react';
import { MainNavSection } from '../layout/Sidebar';
import {
  fetchDashboardData,
  type DashboardData,
  type DashboardKPIs,
  type DashboardLote,
  type DashboardIncidencia,
  type DashboardVisita
} from '../../services/dashboardService';

interface DashboardViewProps {
  onNavigate: (section: MainNavSection, subTab?: string) => void;
  // Props heredadas mantenidas opcionales por compatibilidad
  puntosVenta?: unknown[];
  repositores?: unknown[];
  lotes?: unknown[];
  visitas?: unknown[];
  incidencias?: unknown[];
  reposiciones?: unknown[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchDashboardData();
      setData(result);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al cargar datos de MySQL';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis: DashboardKPIs = data?.kpis ?? {
    puntosVenta: { total: 0, activos: 0 },
    repositores: { total: 0, activos: 0 },
    visitas: { total: 0, hoy: 0, enCurso: 0, completadas: 0 },
    unidadesRepuestas: { total: 0, retiradas: 0 },
    lotes: {
      total: 0,
      vencidos: 0,
      criticos7d: 0,
      proximos30d: 0,
      alertasTotal: 0,
      stockDeposito: 0,
      stockGondola: 0
    },
    incidencias: { total: 0, abiertas: 0, resueltas: 0, cerradas: 0 },
    rutas: { total: 0 },
    pedidos: { total: 0 }
  };

  const lotesCriticos: DashboardLote[] = data?.lotesCriticos ?? [];
  const incidenciasRecientes: DashboardIncidencia[] = data?.incidenciasRecientes ?? [];
  const visitasRecientes: DashboardVisita[] = data?.visitasRecientes ?? [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Title with MySQL Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Resumen General y Monitoreo
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MySQL: reposicion_productos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión en tiempo real de góndolas, rutas de repositores, alertas de vencimiento e incidencias operativas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Refrescar datos desde MySQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            {lastUpdated && !isRefreshing && (
              <span className="text-[10px] text-slate-400 font-mono ml-1">({lastUpdated})</span>
            )}
          </button>

          <button
            onClick={() => onNavigate('reposiciones')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Registrar Reposición</span>
          </button>

          <button
            onClick={() => onNavigate('incidencias')}
            className="px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Reportar Incidencia</span>
          </button>
        </div>
      </div>

      {/* Alerta de Error si no se puede conectar a MySQL */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-800">
            <p className="font-semibold text-red-900">Error de conexión con la base de datos MySQL</p>
            <p className="mt-0.5">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-2.5 px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
            >
              Reintentar conexión
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Strip: Direct from MySQL Tables */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Widget 1: Puntos de Venta (puntos_venta) */}
        <div
          onClick={() => onNavigate('personal-pdv', 'puntos-venta')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Puntos de Venta</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              kpis.puntosVenta.total
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{kpis.puntosVenta.activos} locales activos</span>
          </div>
        </div>

        {/* Widget 2: Repositores (repositores) */}
        <div
          onClick={() => onNavigate('personal-pdv', 'repositores')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Repositores</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              kpis.repositores.total
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{kpis.repositores.activos} en plantilla activa</span>
          </div>
        </div>

        {/* Widget 3: Visitas Registradas (visitas) */}
        <div
          onClick={() => onNavigate('visitas')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Visitas Auditoría</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              kpis.visitas.total
            )}
          </div>
          <div className="mt-1 text-[11px] text-teal-600 font-medium truncate">
            {kpis.visitas.hoy > 0 ? `${kpis.visitas.hoy} hoy en jornada` : `${kpis.visitas.completadas} completadas`}
          </div>
        </div>

        {/* Widget 4: Unidades Repuestas (reposicion_detalle) */}
        <div
          onClick={() => onNavigate('reposiciones')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Unidades Repuestas</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              Math.round(kpis.unidadesRepuestas.total)
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {kpis.unidadesRepuestas.retiradas > 0 ? `${Math.round(kpis.unidadesRepuestas.retiradas)} retiradas / mermas` : 'En góndola / expositor'}
          </div>
        </div>

        {/* Widget 5: Alertas de Lote (lotes_producto FEFO) */}
        <div
          onClick={() => onNavigate('lotes-vencimientos')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Alertas de Lote</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              kpis.lotes.alertasTotal
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {kpis.lotes.vencidos > 0
              ? `${kpis.lotes.vencidos} vencidos`
              : kpis.lotes.criticos7d > 0
              ? `${kpis.lotes.criticos7d} en <7 días`
              : `${kpis.lotes.proximos30d} en <30 días (FEFO)`}
          </div>
        </div>

        {/* Widget 6: Incidencias Abiertas (incidencias) */}
        <div
          onClick={() => onNavigate('incidencias')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium group-hover:text-slate-900 transition-colors">Incidencias Abiertas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 font-mono tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
            ) : (
              kpis.incidencias.abiertas
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {kpis.incidencias.total} registradas en total
          </div>
        </div>
      </div>

      {/* Two Column Layout: Control FEFO & Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Lotes Próximos a Vencer (Control FEFO desde lotes_producto) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Lotes y Vencimientos en PDV (Control FEFO)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  MySQL: lotes_producto
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioridad de rotación First Expired, First Out en góndolas y depósitos
              </p>
            </div>
            <button
              onClick={() => onNavigate('lotes-vencimientos')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos ({kpis.lotes.total})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ) : lotesCriticos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No se registran lotes en la base de datos MySQL.</p>
              </div>
            ) : (
              lotesCriticos.map((lote) => {
                const dias = Number(lote.dias_restantes);
                const isVencido = dias < 0 || lote.estado_fefo === 'Vencido';
                const isCritico = dias >= 0 && dias <= 7;

                return (
                  <div key={lote.id_lote} className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors rounded-lg px-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {lote.producto_descripcion}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {lote.producto_codigo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>Lote: <strong className="font-mono text-slate-700">{lote.numero_lote}</strong></span>
                        <span>·</span>
                        <span className="truncate font-medium text-slate-700">{lote.punto_venta_nombre}</span>
                        {lote.punto_venta_ciudad && (
                          <>
                            <span>·</span>
                            <span>{lote.punto_venta_ciudad}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded ${
                          isVencido
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isCritico
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isVencido
                          ? 'Vencido'
                          : dias === 0
                          ? 'Vence hoy'
                          : `Vence en ${dias}d (${lote.fecha_vencimiento})`}
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono mt-1">
                        Góndola: <strong>{Math.round(Number(lote.cantidad_gondola))}</strong> · Depósito: <strong>{Math.round(Number(lote.cantidad_deposito))}</strong>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 2: Incidencias Recientes (desde incidencias) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Incidencias Recientes en Góndola
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  MySQL: incidencias
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Problemas de stock, precios y mercadería reportados por repositores
              </p>
            </div>
            <button
              onClick={() => onNavigate('incidencias')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas ({kpis.incidencias.total})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ) : incidenciasRecientes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No se registran incidencias en la base de datos MySQL.</p>
              </div>
            ) : (
              incidenciasRecientes.map((inc) => (
                <div key={inc.id_incidencia} className="py-3 hover:bg-slate-50/50 transition-colors rounded-lg px-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {inc.tipo_incidente_nombre}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        #{inc.id_incidencia}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        inc.estado_nombre === 'Abierta'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : inc.estado_nombre === 'En proceso'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {inc.estado_nombre}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 mt-1">
                    {inc.descripcion}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                    <span className="font-medium text-slate-600">{inc.punto_venta_nombre}</span>
                    <span>·</span>
                    <span>{inc.repositor_nombre}</span>
                    <span>·</span>
                    <span className="font-mono">{inc.fecha_incidencia}</span>
                    {inc.requiere_nueva_visita === 1 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 font-medium">Requiere nueva visita {inc.fecha_nueva_visita ? `(${inc.fecha_nueva_visita})` : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Panel 3: Visitas y Auditorías Recientes (desde visitas) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Auditorías y Visitas de Reposición
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                MySQL: visitas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de horarios de check-in, check-out y estado de auditoría en terreno
            </p>
          </div>
          <button
            onClick={() => onNavigate('visitas')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            <span>Ver historial completo ({kpis.visitas.total})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/60">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Punto de Venta</th>
                <th className="py-2.5 px-3">Repositor Asignado</th>
                <th className="py-2.5 px-3">Fecha y Horario</th>
                <th className="py-2.5 px-3">Productos Auditados</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Cargando visitas desde MySQL...
                  </td>
                </tr>
              ) : visitasRecientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se registran visitas en la base de datos MySQL.
                  </td>
                </tr>
              ) : (
                visitasRecientes.map((v) => (
                  <tr key={v.id_visita} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">
                      {v.codigo_visita}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{v.punto_venta_nombre}</div>
                      {v.encargado_pdv && (
                        <div className="text-[11px] text-slate-500">Encargado: {v.encargado_pdv}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {v.repositor_nombre}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{v.fecha_visita}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.hora_check_in || '--:--'} {v.hora_check_out ? `→ ${v.hora_check_out}` : '(En curso)'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{v.total_items} items</span>
                        {v.items_reposicion > 0 && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {v.items_reposicion} reposición
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded ${
                          v.estado_nombre === 'Completada'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : v.estado_nombre === 'En curso'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {v.estado_nombre}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('visitas')}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

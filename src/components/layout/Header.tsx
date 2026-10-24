import React, { useEffect, useState } from 'react';
import { Menu, Store, Truck, AlertCircle, LogOut } from 'lucide-react';
import { MainNavSection } from './Sidebar';
import { fetchDashboardData } from '../../services/dashboardService';
import { type AuthUser } from '../../services/authService';

interface HeaderProps {
  currentSection: MainNavSection;
  subTabLabel?: string;
  onOpenMobile: () => void;
  onNavigate?: (section: MainNavSection, subTab?: string) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  // Props opcionales para compatibilidad
  onNewRecord?: () => void;
  onResetData?: () => void;
  hasOpenIncidents?: boolean;
  pdvsActivos?: number;
  repositoresEnRuta?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  subTabLabel,
  onOpenMobile,
  onNavigate,
  currentUser,
  onLogout,
  pdvsActivos: propPdvsActivos,
  repositoresEnRuta: propRepositoresEnRuta
}) => {
  const [stats, setStats] = useState<{
    pdvsActivos: number;
    repositoresEnRuta: number;
    openIncidents: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData()
      .then((data) => {
        if (isMounted && data?.kpis) {
          setStats({
            pdvsActivos: data.kpis.puntosVenta.activos,
            repositoresEnRuta: data.kpis.repositores.enRuta ?? data.kpis.repositores.activos,
            openIncidents: data.kpis.incidencias.abiertas
          });
        }
      })
      .catch(() => {
        // En caso de fallo de red, fallback a valores seguros
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const pdvsActivos = propPdvsActivos ?? stats?.pdvsActivos ?? 0;
  const repositoresEnRuta = propRepositoresEnRuta ?? stats?.repositoresEnRuta ?? 0;
  const openIncidents = stats?.openIncidents ?? 0;

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dashboard':
        return 'Panel de Control';
      case 'referenciales':
        return 'Tablas Maestras Referenciales';
      case 'personal-pdv':
        return 'Personal y Puntos de Venta';
      case 'productos-precios':
        return 'Catálogo de Productos y Precios PDV';
      case 'lotes-vencimientos':
        return 'Control de Lotes y Vencimientos (FEFO)';
      case 'rutas':
        return 'Planificación y Despacho de Rutas';
      case 'visitas':
        return 'Registro y Auditoría de Visitas';
      case 'reposiciones':
        return 'Gestión de Reposición en Góndola';
      case 'pedidos':
        return 'Pedidos de Abastecimiento';
      case 'incidencias':
        return 'Gestión y Resolución de Incidencias';
      default:
        return 'RepoStock Pro';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <span className="font-semibold text-slate-900 whitespace-nowrap">RepoStock</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="font-medium text-slate-700 truncate">{getSectionTitle()}</span>
          {subTabLabel && (
            <>
              <span aria-hidden="true" className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold truncate">{subTabLabel}</span>
            </>
          )}
        </nav>
      </div>

      {/* Zone 2: Información en vivo del Backend (PDVs Activos y Repositores en Ruta) */}
      <div className="hidden sm:flex items-center gap-3 text-xs">
        {/* Elemento 1: PDVs Activos */}
        <div
          onClick={() => onNavigate?.('personal-pdv', 'puntos-venta')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 shadow-2xs transition-all ${
            onNavigate ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300' : ''
          }`}
          title="Puntos de Venta activos en la base de datos MySQL"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Store className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">PDVs Activos:</span>
          {loading && !stats ? (
            <span className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          ) : (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold font-mono text-emerald-800 bg-emerald-100 rounded-md leading-none">
              {pdvsActivos}
            </span>
          )}
        </div>

        {/* Elemento 2: Repositores en ruta */}
        <div
          onClick={() => onNavigate?.('rutas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 shadow-2xs transition-all ${
            onNavigate ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300' : ''
          }`}
          title="Repositores con rutas asignadas en la base de datos MySQL"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <Truck className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Repositores en ruta:</span>
          {loading && !stats ? (
            <span className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          ) : (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold font-mono text-indigo-800 bg-indigo-100 rounded-md leading-none">
              {repositoresEnRuta}
            </span>
          )}
        </div>

        {/* Indicador opcional de incidencias pendientes */}
        {openIncidents > 0 && (
          <div
            onClick={() => onNavigate?.('incidencias')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 transition-all ${
              onNavigate ? 'cursor-pointer hover:bg-amber-100' : ''
            }`}
            title="Incidencias abiertas en góndola"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">{openIncidents}</span>
            <span className="text-[11px]">pendientes</span>
          </div>
        )}
      </div>

      {/* Zone 3: Perfil de Usuario y Cerrar Sesión */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>MySQL Online</span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.nombreCompleto || currentUser.username}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Rol: <strong className="text-blue-600">{currentUser.rol}</strong>
              </span>
            </div>

            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs"
              title={`${currentUser.nombreCompleto} (${currentUser.username})`}
            >
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

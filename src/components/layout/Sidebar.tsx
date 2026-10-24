import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  Store,
  Package,
  Tags,
  CalendarClock,
  MapPin,
  ClipboardCheck,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookmarkCheck,
  Scale,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';

export type MainNavSection =
  | 'dashboard'
  | 'referenciales'
  | 'personal-pdv'
  | 'productos-precios'
  | 'lotes-vencimientos'
  | 'rutas'
  | 'visitas'
  | 'reposiciones'
  | 'pedidos'
  | 'incidencias';

export type ReferencialSubTab =
  | 'tipo-pdv'
  | 'categoria'
  | 'marca'
  | 'unidad'
  | 'estado'
  | 'prioridad'
  | 'motivo'
  | 'tipo-incidente';

export type PersonalPdvSubTab = 'repositores' | 'puntos-venta';
export type ProductosPreciosSubTab = 'productos' | 'productos-pdv';

interface SidebarProps {
  currentSection: MainNavSection;
  referencialSubTab: ReferencialSubTab;
  personalPdvSubTab: PersonalPdvSubTab;
  productosPreciosSubTab: ProductosPreciosSubTab;
  onNavigate: (section: MainNavSection, subTab?: string) => void;
  openIncidenciasCount: number;
  criticalLotesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  referencialSubTab,
  personalPdvSubTab,
  productosPreciosSubTab,
  onNavigate,
  openIncidenciasCount,
  criticalLotesCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const [openReferenciales, setOpenReferenciales] = useState<boolean>(true);
  const [openPersonalPdv, setOpenPersonalPdv] = useState<boolean>(true);
  const [openProductosPrecios, setOpenProductosPrecios] = useState<boolean>(true);

  const handleParentClick = (
    section: MainNavSection,
    toggleState: boolean,
    setToggle: (val: boolean) => void,
    defaultSubTab?: string
  ) => {
    if (currentSection !== section) {
      onNavigate(section, defaultSubTab);
      setToggle(true);
    } else {
      setToggle(!toggleState);
    }
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer select-none ${
      isActive
        ? 'bg-slate-900 text-white font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const subItemClass = (isActive: boolean) =>
    `flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
      isActive
        ? 'bg-slate-200 text-slate-900 font-semibold'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base">
              R
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                RepoStock Pro
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                Gestión de Reposición
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Dashboard Resumen */}
          <div
            onClick={() => onNavigate('dashboard')}
            className={navItemClass(currentSection === 'dashboard')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">Resumen General</span>
            </div>
          </div>

          <div className="pt-2 pb-1 px-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Operaciones y Catálogo
            </span>
          </div>

          {/* 1. Referenciales */}
          <div>
            <div
              onClick={() =>
                handleParentClick(
                  'referenciales',
                  openReferenciales,
                  setOpenReferenciales,
                  referencialSubTab
                )
              }
              className={navItemClass(currentSection === 'referenciales')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="truncate">Referenciales</span>
              </div>
              {openReferenciales ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
              )}
            </div>

            {openReferenciales && (
              <div className="mt-1 space-y-0.5">
                <div
                  onClick={() => onNavigate('referenciales', 'tipo-pdv')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'tipo-pdv'
                  )}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tipo punto de venta</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'categoria')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'categoria'
                  )}
                >
                  <Tags className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Categoria producto</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'marca')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'marca'
                  )}
                >
                  <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Marca</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'unidad')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'unidad'
                  )}
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Unidad de medida</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'estado')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'estado'
                  )}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Estado general</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'prioridad')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'prioridad'
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Prioridad</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'motivo')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'motivo'
                  )}
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Motivo incidencia</span>
                </div>
                <div
                  onClick={() => onNavigate('referenciales', 'tipo-incidente')}
                  className={subItemClass(
                    currentSection === 'referenciales' && referencialSubTab === 'tipo-incidente'
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tipo de incidente</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Personal y puntos de venta */}
          <div>
            <div
              onClick={() =>
                handleParentClick(
                  'personal-pdv',
                  openPersonalPdv,
                  setOpenPersonalPdv,
                  personalPdvSubTab
                )
              }
              className={navItemClass(currentSection === 'personal-pdv')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">Personal y puntos de venta</span>
              </div>
              {openPersonalPdv ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
              )}
            </div>

            {openPersonalPdv && (
              <div className="mt-1 space-y-0.5">
                <div
                  onClick={() => onNavigate('personal-pdv', 'repositores')}
                  className={subItemClass(
                    currentSection === 'personal-pdv' && personalPdvSubTab === 'repositores'
                  )}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Repositores</span>
                </div>
                <div
                  onClick={() => onNavigate('personal-pdv', 'puntos-venta')}
                  className={subItemClass(
                    currentSection === 'personal-pdv' && personalPdvSubTab === 'puntos-venta'
                  )}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Puntos de venta</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Productos y Precios */}
          <div>
            <div
              onClick={() =>
                handleParentClick(
                  'productos-precios',
                  openProductosPrecios,
                  setOpenProductosPrecios,
                  productosPreciosSubTab
                )
              }
              className={navItemClass(currentSection === 'productos-precios')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Package className="w-4 h-4 shrink-0" />
                <span className="truncate">Productos y Precios</span>
              </div>
              {openProductosPrecios ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
              )}
            </div>

            {openProductosPrecios && (
              <div className="mt-1 space-y-0.5">
                <div
                  onClick={() => onNavigate('productos-precios', 'productos')}
                  className={subItemClass(
                    currentSection === 'productos-precios' && productosPreciosSubTab === 'productos'
                  )}
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Productos</span>
                </div>
                <div
                  onClick={() => onNavigate('productos-precios', 'productos-pdv')}
                  className={subItemClass(
                    currentSection === 'productos-precios' && productosPreciosSubTab === 'productos-pdv'
                  )}
                >
                  <Tags className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Productos punto de venta</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 pb-1 px-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ejecución en PDV
            </span>
          </div>

          {/* 4. Lotes y Vencimientos */}
          <div
            onClick={() => onNavigate('lotes-vencimientos')}
            className={navItemClass(currentSection === 'lotes-vencimientos')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <CalendarClock className="w-4 h-4 shrink-0" />
              <span className="truncate">Lotes y Vencimientos</span>
            </div>
            {criticalLotesCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-mono font-medium bg-amber-100 text-amber-800 rounded">
                {criticalLotesCount}
              </span>
            )}
          </div>

          {/* 5. Planificacion de Rutas */}
          <div
            onClick={() => onNavigate('rutas')}
            className={navItemClass(currentSection === 'rutas')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">Planificacion de Rutas</span>
            </div>
          </div>

          {/* 6. Visitas */}
          <div
            onClick={() => onNavigate('visitas')}
            className={navItemClass(currentSection === 'visitas')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Visitas</span>
            </div>
          </div>

          {/* 7. Reposiciones */}
          <div
            onClick={() => onNavigate('reposiciones')}
            className={navItemClass(currentSection === 'reposiciones')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span className="truncate">Reposiciones</span>
            </div>
          </div>

          {/* 8. Pedidos de Productos */}
          <div
            onClick={() => onNavigate('pedidos')}
            className={navItemClass(currentSection === 'pedidos')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">Pedidos de Productos</span>
            </div>
          </div>

          {/* 9. Incidencias */}
          <div
            onClick={() => onNavigate('incidencias')}
            className={navItemClass(currentSection === 'incidencias')}
          >
            <div className="flex items-center gap-2.5 truncate">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">Incidencias</span>
            </div>
            {openIncidenciasCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-mono font-medium bg-red-100 text-red-800 rounded">
                {openIncidenciasCount}
              </span>
            )}
          </div>

        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Versión 2.4.0</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            Supermercados, Farmacias, Mayoristas
            <br />
            Desarrollado por Yony Cazal
            <br />
            ©2026 RepoStock Pro. Todos los derechos reservados.
          </p>          
        </div>
      </aside>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import {
  MainNavSection,
  ReferencialSubTab,
  PersonalPdvSubTab,
  ProductosPreciosSubTab,
  Sidebar
} from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { ReferencialesView } from './components/views/ReferencialesView';
import { PersonalPuntosVentaView } from './components/views/PersonalPuntosVentaView';
import { ProductosPreciosView } from './components/views/ProductosPreciosView';
import { LotesVencimientosView } from './components/views/LotesVencimientosView';
import { PlanificacionRutasView } from './components/views/PlanificacionRutasView';
import { VisitasView } from './components/views/VisitasView';
import { ReposicionesView } from './components/views/ReposicionesView';
import { PedidosView } from './components/views/PedidosView';
import { IncidenciasView } from './components/views/IncidenciasView';
import { AuthService, type AuthUser } from './services/authService';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());

  // Navigation State
  const [currentSection, setCurrentSection] = useState<MainNavSection>('dashboard');
  const [referencialSubTab, setReferencialSubTab] = useState<ReferencialSubTab>('tipo-pdv');
  const [personalPdvSubTab, setPersonalPdvSubTab] = useState<PersonalPdvSubTab>('repositores');
  const [productosPreciosSubTab, setProductosPreciosSubTab] = useState<ProductosPreciosSubTab>('productos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  // Referential data still used by the demo modules (localStorage)
  const [motivos] = useState(StorageService.getMotivosIncidencia);
  const [tiposIncidente] = useState(StorageService.getTiposIncidente);

  const [repositores] = useState(StorageService.getRepositores);
  const [puntosVenta] = useState(StorageService.getPuntosVenta);

  const [productos] = useState(StorageService.getProductos);

  const [lotes] = useState(StorageService.getLotes);
  const [visitas] = useState(StorageService.getVisitas);
  const [reposiciones] = useState(StorageService.getReposiciones);

  const handleResetData = () => {
    if (!window.confirm('¿Desea restablecer todos los datos a los valores demostrativos iniciales?')) return;
    StorageService.resetAll();
    window.location.reload();
  };

  const handleNavigate = (section: MainNavSection, subTab?: string) => {
    setCurrentSection(section);
    if (subTab) {
      if (section === 'referenciales') setReferencialSubTab(subTab as ReferencialSubTab);
      if (section === 'personal-pdv') setPersonalPdvSubTab(subTab as PersonalPdvSubTab);
      if (section === 'productos-precios') setProductosPreciosSubTab(subTab as ProductosPreciosSubTab);
    }
    setIsMobileMenuOpen(false);
  };

  // SubTab Label for Breadcrumbs
  const getSubTabLabel = () => {
    if (currentSection === 'referenciales') {
      const labels: Record<ReferencialSubTab, string> = {
        'tipo-pdv': 'Tipo punto de venta',
        'categoria': 'Categoría producto',
        'marca': 'Marca',
        'unidad': 'Unidad de medida',
        'estado': 'Estado general',
        'prioridad': 'Prioridad',
        'motivo': 'Motivo incidencia',
        'tipo-incidente': 'Tipo de incidente'
      };
      return labels[referencialSubTab];
    }
    if (currentSection === 'personal-pdv') {
      return personalPdvSubTab === 'repositores' ? 'Repositores' : 'Puntos de venta';
    }
    if (currentSection === 'productos-precios') {
      return productosPreciosSubTab === 'productos' ? 'Productos' : 'Productos punto de venta';
    }
    return undefined;
  };

  const openIncidentsCount = 0;
  const criticalLotesCount = lotes.filter((l) => l.estadoLote === 'Crítico (<7d)' || l.estadoLote === 'Vencido').length;

  // Si no hay usuario autenticado, mostrar pantalla de inicio de sesión
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        referencialSubTab={referencialSubTab}
        personalPdvSubTab={personalPdvSubTab}
        productosPreciosSubTab={productosPreciosSubTab}
        onNavigate={handleNavigate}
        openIncidenciasCount={0}
        criticalLotesCount={criticalLotesCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          currentSection={currentSection}
          subTabLabel={getSubTabLabel()}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'dashboard' && (
            <DashboardView
              puntosVenta={puntosVenta}
              repositores={repositores}
              lotes={lotes}
              visitas={visitas}
              incidencias={[]}
              reposiciones={reposiciones}
              onNavigate={handleNavigate}
            />
          )}

          {currentSection === 'referenciales' && (
            <ReferencialesView
              subTab={referencialSubTab}
              onSubTabChange={(tab) => setReferencialSubTab(tab)}
            />
          )}

          {currentSection === 'personal-pdv' && (
            <PersonalPuntosVentaView
              subTab={personalPdvSubTab}
              onSubTabChange={(tab) => setPersonalPdvSubTab(tab)}
            />
          )}

          {currentSection === 'productos-precios' && (
            <ProductosPreciosView
              subTab={productosPreciosSubTab}
              onSubTabChange={(tab) => setProductosPreciosSubTab(tab)}
            />
          )}

          {currentSection === 'lotes-vencimientos' && <LotesVencimientosView />}

          {currentSection === 'rutas' && <PlanificacionRutasView />}

          {currentSection === 'visitas' && <VisitasView />}

          {currentSection === 'reposiciones' && <ReposicionesView />}

          {currentSection === 'pedidos' && <PedidosView />}

          {currentSection === 'incidencias' && <IncidenciasView />}

        </main>
      </div>
    </div>
  );
}

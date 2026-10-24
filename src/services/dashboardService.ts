export interface DashboardKPIs {
  puntosVenta: {
    total: number;
    activos: number;
  };
  repositores: {
    total: number;
    activos: number;
    enRuta?: number;
  };
  visitas: {
    total: number;
    hoy: number;
    enCurso: number;
    completadas: number;
  };
  unidadesRepuestas: {
    total: number;
    retiradas: number;
  };
  lotes: {
    total: number;
    vencidos: number;
    criticos7d: number;
    proximos30d: number;
    alertasTotal: number;
    stockDeposito: number;
    stockGondola: number;
  };
  incidencias: {
    total: number;
    abiertas: number;
    resueltas: number;
    cerradas: number;
  };
  rutas: {
    total: number;
  };
  pedidos: {
    total: number;
  };
}

export interface DashboardLote {
  id_lote: number;
  numero_lote: string;
  fecha_ingreso: string | null;
  fecha_vencimiento: string;
  cantidad_deposito: number | string;
  cantidad_gondola: number | string;
  cantidad_total: number | string;
  producto_codigo: string;
  producto_descripcion: string;
  punto_venta_nombre: string;
  punto_venta_ciudad: string | null;
  dias_restantes: number;
  estado_fefo: 'Vencido' | 'Crítico (<7d)' | 'Próximo (<30d)' | 'Normal';
}

export interface DashboardIncidencia {
  id_incidencia: number;
  fecha_incidencia: string;
  descripcion: string;
  solucion_aplicada: string | null;
  requiere_nueva_visita: number;
  fecha_nueva_visita: string | null;
  tipo_incidente_nombre: string;
  estado_nombre: string;
  repositor_nombre: string;
  punto_venta_nombre: string;
  total_productos_afectados: number;
}

export interface DashboardVisita {
  id_visita: number;
  codigo_visita: string;
  fecha_visita: string;
  hora_check_in: string | null;
  hora_check_out: string | null;
  id_estado: number;
  estado_nombre: string;
  punto_venta_nombre: string;
  encargado_pdv: string | null;
  repositor_nombre: string;
  total_items: number;
  items_reposicion: number;
  items_cambio_precio: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  lotesCriticos: DashboardLote[];
  incidenciasRecientes: DashboardIncidencia[];
  visitasRecientes: DashboardVisita[];
  database?: string;
  timestamp?: string;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  database?: string;
  timestamp?: string;
}

function getCandidateEndpoints(): string[] {
  const candidates: string[] = [];

  // 1. Si está en Apache bajo /RepoStock/
  if (typeof window !== 'undefined' && window.location.pathname.includes('/RepoStock')) {
    candidates.push('/RepoStock/backend-php/api/dashboard.php');
  }

  // 2. Si está en Vite dev server (con proxy configurado en vite.config.ts)
  candidates.push('/backend-php/api/dashboard.php');

  // 3. Resolución relativa estándar (ej. dist/ dentro de RepoStock)
  try {
    candidates.push(new URL('../backend-php/api/dashboard.php', document.baseURI).toString());
    candidates.push(new URL('backend-php/api/dashboard.php', document.baseURI).toString());
  } catch {
    // Ignore URL resolution errors
  }

  // 4. Ruta absoluta directa por defecto en Apache XAMPP
  candidates.push('http://localhost/RepoStock/backend-php/api/dashboard.php');

  return Array.from(new Set(candidates));
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const endpoints = getCandidateEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const text = await response.text();
      const payload: ApiResponse<DashboardData> = text ? JSON.parse(text) : { status: 'error' };

      if (payload.status === 'success' && payload.data) {
        return {
          ...payload.data,
          database: payload.database,
          timestamp: payload.timestamp,
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('No se pudo conectar con el servidor PHP/MySQL. Verifique que Apache y MySQL estén activos en XAMPP.');
}

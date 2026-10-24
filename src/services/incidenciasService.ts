export interface IncidenciaRow {
  id_incidencia: number;
  id_visita: number | null;
  id_ruta_detalle: number | null;
  id_repositor: number;
  id_tipo_incidente: number;
  fecha_incidencia: string;
  descripcion: string;
  solucion_aplicada: string | null;
  requiere_nueva_visita: number;
  fecha_nueva_visita: string | null;
  id_estado: number;
  fecha_visita?: string | null;
  visita_punto_venta_nombre?: string | null;
  id_ruta?: number | null;
  orden_visita?: number | null;
  ruta_fecha?: string | null;
  ruta_descripcion?: string | null;
  ruta_punto_venta_nombre?: string | null;
  punto_venta_nombre?: string | null;
  repositor_nombre?: string | null;
  tipo_incidente_nombre?: string | null;
  estado_nombre?: string | null;
  total_lineas?: number | string;
  total_afectada?: number | string;
}

export interface IncidenciaInput {
  id_visita?: number | null;
  id_ruta_detalle?: number | null;
  id_repositor: number;
  id_tipo_incidente: number;
  fecha_incidencia: string;
  descripcion: string;
  solucion_aplicada?: string | null;
  requiere_nueva_visita?: number;
  fecha_nueva_visita?: string | null;
  id_estado: number;
}

export interface IncidenciaEstadoRow {
  id_estado: number;
  descripcion: string;
}

export interface VisitaOpcionRow {
  id_visita: number;
  id_ruta_detalle: number | null;
  id_repositor: number;
  id_punto_venta: number;
  fecha_visita: string;
  hora_llegada: string | null;
  hora_salida: string | null;
  id_estado: number;
  punto_venta_nombre?: string | null;
  repositor_nombre?: string | null;
  visita_estado_nombre?: string | null;
}

export interface RutaDetalleOpcionRow {
  id_ruta_detalle: number;
  id_ruta: number;
  id_punto_venta: number;
  orden_visita: number;
  motivo_visita: string | null;
  ruta_fecha: string;
  id_repositor: number;
  ruta_descripcion: string | null;
  punto_venta_nombre?: string | null;
  repositor_nombre?: string | null;
}

export interface IncidenciaDetalleRow {
  id_incidencia_detalle: number;
  id_incidencia: number;
  id_producto: number | null;
  id_motivo: number;
  cantidad_afectada: number | string;
  descripcion: string;
  producto_codigo?: string | null;
  producto_nombre?: string | null;
  producto_unidad?: string | null;
  motivo_nombre?: string | null;
}

export interface IncidenciaDetalleInput {
  id_incidencia: number;
  id_producto?: number | null;
  id_motivo: number;
  cantidad_afectada: number;
  descripcion: string;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const incidenciasEndpoint = new URL('../backend-php/api/incidencias.php', document.baseURI).toString();
const detalleEndpoint = new URL('../backend-php/api/incidencia_detalle.php', document.baseURI).toString();

async function request<T>(
  endpoint: string,
  init?: RequestInit,
  query?: Record<string, string | number>
): Promise<ApiResponse<T>> {
  const url = new URL(endpoint);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifique que Apache y MySQL estan activos.');
  }

  const text = await response.text();
  let payload: ApiResponse<T>;

  try {
    payload = text ? JSON.parse(text) : { status: 'error' };
  } catch {
    throw new Error(`Respuesta invalida del servidor (HTTP ${response.status}).`);
  }

  if (!response.ok || payload.status === 'error') {
    throw new Error(payload.message || `Error del servidor (HTTP ${response.status}).`);
  }

  return payload;
}

export async function listIncidencias(): Promise<IncidenciaRow[]> {
  const response = await request<IncidenciaRow[]>(incidenciasEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listIncidenciaEstados(): Promise<IncidenciaEstadoRow[]> {
  const response = await request<IncidenciaEstadoRow[]>(incidenciasEndpoint, { method: 'GET' }, { opciones: 'estados' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listVisitaOpcionesIncidencias(): Promise<VisitaOpcionRow[]> {
  const response = await request<VisitaOpcionRow[]>(incidenciasEndpoint, { method: 'GET' }, { opciones: 'visitas' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listRutaOpcionesIncidencias(): Promise<RutaDetalleOpcionRow[]> {
  const response = await request<RutaDetalleOpcionRow[]>(incidenciasEndpoint, { method: 'GET' }, { opciones: 'rutas' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createIncidencia(input: IncidenciaInput): Promise<number> {
  const response = await request(incidenciasEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateIncidencia(id: number, input: Partial<IncidenciaInput>): Promise<void> {
  await request(incidenciasEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteIncidencia(id: number): Promise<void> {
  await request(incidenciasEndpoint, { method: 'DELETE' }, { id });
}

export async function listIncidenciaDetalle(idIncidencia: number): Promise<IncidenciaDetalleRow[]> {
  const response = await request<IncidenciaDetalleRow[]>(
    detalleEndpoint,
    { method: 'GET' },
    { id_incidencia: idIncidencia }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createIncidenciaDetalle(input: IncidenciaDetalleInput): Promise<number> {
  const response = await request(detalleEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateIncidenciaDetalle(
  id: number,
  input: Partial<Omit<IncidenciaDetalleInput, 'id_incidencia'>>
): Promise<void> {
  await request(detalleEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteIncidenciaDetalle(id: number): Promise<void> {
  await request(detalleEndpoint, { method: 'DELETE' }, { id });
}

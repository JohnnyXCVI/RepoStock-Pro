export interface RutaRow {
  id_ruta: number;
  fecha: string;
  id_repositor: number;
  hora_inicio_plan: string;
  hora_fin_plan: string;
  descripcion: string | null;
  id_estado: number;
  observacion: string | null;
  fecha_creacion: string;
  repositor_nombre?: string;
  repositor_documento?: string;
  estado_nombre?: string;
  total_paradas?: number | string;
  visitadas?: number | string;
}

export interface RutaInput {
  fecha: string;
  id_repositor: number;
  hora_inicio_plan: string;
  hora_fin_plan: string;
  descripcion: string | null;
  id_estado: number;
  observacion: string | null;
}

export interface RutaDetalleRow {
  id_ruta_detalle: number;
  id_ruta: number;
  id_punto_venta: number;
  orden_visita: number;
  id_prioridad: number;
  hora_estimada_llegada: string | null;
  minutos_estimados: number;
  minutos_traslado_estimados: number;
  motivo_visita: string | null;
  visitado: number;
  punto_venta_nombre?: string;
  punto_venta_direccion?: string;
  punto_venta_ciudad?: string | null;
  prioridad_nombre?: string;
  prioridad_nivel?: number;
}

export interface RutaDetalleInput {
  id_ruta: number;
  id_punto_venta: number;
  orden_visita: number;
  id_prioridad: number;
  hora_estimada_llegada: string | null;
  minutos_estimados: number;
  minutos_traslado_estimados: number;
  motivo_visita: string | null;
  visitado: number;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const rutasEndpoint = new URL('../backend-php/api/rutas.php', document.baseURI).toString();
const detalleEndpoint = new URL('../backend-php/api/ruta_detalle.php', document.baseURI).toString();

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
    throw new Error('No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.');
  }

  const text = await response.text();
  let payload: ApiResponse<T>;

  try {
    payload = text ? JSON.parse(text) : { status: 'error' };
  } catch {
    throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`);
  }

  if (!response.ok || payload.status === 'error') {
    throw new Error(payload.message || `Error del servidor (HTTP ${response.status}).`);
  }

  return payload;
}

export async function listRutas(): Promise<RutaRow[]> {
  const response = await request<RutaRow[]>(rutasEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createRuta(input: RutaInput): Promise<number> {
  const response = await request(rutasEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateRuta(id: number, input: RutaInput): Promise<void> {
  await request(rutasEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteRuta(id: number): Promise<void> {
  await request(rutasEndpoint, { method: 'DELETE' }, { id });
}

export async function listRutaDetalle(idRuta: number): Promise<RutaDetalleRow[]> {
  const response = await request<RutaDetalleRow[]>(detalleEndpoint, { method: 'GET' }, { id_ruta: idRuta });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createRutaDetalle(input: RutaDetalleInput): Promise<number> {
  const response = await request(detalleEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateRutaDetalle(
  id: number,
  input: Partial<RutaDetalleInput>
): Promise<void> {
  await request(detalleEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteRutaDetalle(id: number): Promise<void> {
  await request(detalleEndpoint, { method: 'DELETE' }, { id });
}

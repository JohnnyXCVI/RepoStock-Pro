export interface VisitaOption {
  id_visita: number;
  fecha_visita: string;
  id_repositor: number;
  id_punto_venta: number;
  id_estado: number;
  hora_llegada: string | null;
  hora_salida: string | null;
  repositor_nombre?: string;
  repositor_documento?: string;
  punto_venta_nombre?: string;
  punto_venta_direccion?: string;
  punto_venta_ciudad?: string | null;
  visita_estado_nombre?: string;
  total_productos?: number | string;
}

export interface ReposicionRow {
  id_reposicion: number;
  id_visita: number;
  fecha_reposicion: string;
  id_repositor: number;
  id_estado: number;
  observacion: string | null;
  fecha_visita: string;
  hora_llegada: string | null;
  hora_salida: string | null;
  id_punto_venta: number;
  punto_venta_nombre?: string;
  punto_venta_direccion?: string;
  punto_venta_ciudad?: string | null;
  repositor_nombre?: string;
  repositor_documento?: string;
  estado_nombre?: string;
  visita_estado_nombre?: string;
  total_lineas?: number | string;
  total_repuesta?: number | string;
  total_retirada?: number | string;
}

export interface ReposicionInput {
  id_visita: number;
  fecha_reposicion: string;
  id_repositor: number;
  id_estado: number;
  observacion: string | null;
}

export interface ReposicionDetalleRow {
  id_reposicion_detalle: number;
  id_reposicion: number;
  id_producto: number;
  cantidad_repuesta: number | string;
  cantidad_retirada: number | string;
  observacion: string | null;
  producto_codigo?: string;
  producto_descripcion?: string;
  producto_precio_referencia?: number | string;
  producto_stock_minimo?: number | string;
  producto_stock_objetivo?: number | string;
  producto_unidad?: string | null;
}

export interface ReposicionDetalleInput {
  id_reposicion: number;
  id_producto: number;
  cantidad_repuesta: number;
  cantidad_retirada: number;
  observacion: string | null;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const reposicionesEndpoint = new URL('../backend-php/api/reposiciones.php', document.baseURI).toString();
const detalleEndpoint = new URL('../backend-php/api/reposicion_detalle.php', document.baseURI).toString();

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

export async function listReposiciones(): Promise<ReposicionRow[]> {
  const response = await request<ReposicionRow[]>(reposicionesEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listVisitaOptionsReposiciones(): Promise<VisitaOption[]> {
  const response = await request<VisitaOption[]>(
    reposicionesEndpoint,
    { method: 'GET' },
    { opciones: 'visitas' }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createReposicion(input: ReposicionInput): Promise<number> {
  const response = await request(reposicionesEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateReposicion(id: number, input: Partial<ReposicionInput>): Promise<void> {
  await request(reposicionesEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteReposicion(id: number): Promise<void> {
  await request(reposicionesEndpoint, { method: 'DELETE' }, { id });
}

export async function listReposicionDetalle(idReposicion: number): Promise<ReposicionDetalleRow[]> {
  const response = await request<ReposicionDetalleRow[]>(
    detalleEndpoint,
    { method: 'GET' },
    { id_reposicion: idReposicion }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createReposicionDetalle(input: ReposicionDetalleInput): Promise<number> {
  const response = await request(detalleEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateReposicionDetalle(
  id: number,
  input: Partial<ReposicionDetalleInput>
): Promise<void> {
  await request(detalleEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteReposicionDetalle(id: number): Promise<void> {
  await request(detalleEndpoint, { method: 'DELETE' }, { id });
}

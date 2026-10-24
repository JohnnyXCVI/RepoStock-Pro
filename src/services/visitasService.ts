export interface VisitaRow {
  id_visita: number;
  id_ruta_detalle: number | null;
  id_repositor: number;
  id_punto_venta: number;
  fecha_visita: string;
  hora_llegada: string | null;
  hora_salida: string | null;
  id_estado: number;
  observacion: string | null;
  latitud_registro: number | string | null;
  longitud_registro: number | string | null;
  repositor_nombre?: string;
  repositor_documento?: string;
  punto_venta_nombre?: string;
  punto_venta_direccion?: string;
  punto_venta_ciudad?: string | null;
  estado_nombre?: string;
  id_ruta?: number | null;
  ruta_fecha?: string | null;
  ruta_descripcion?: string | null;
  orden_visita?: number | null;
  total_productos?: number | string;
  productos_reposicion?: number | string;
  productos_cambio_precio?: number | string;
  total_danada?: number | string;
}

export interface VisitaInput {
  id_ruta_detalle: number | null;
  id_repositor: number;
  id_punto_venta: number;
  fecha_visita: string;
  hora_llegada: string | null;
  hora_salida: string | null;
  id_estado: number;
  observacion: string | null;
  latitud_registro: number | null;
  longitud_registro: number | null;
}

export interface VisitaDetalleRow {
  id_visita_detalle: number;
  id_visita: number;
  id_producto: number;
  stock_gondola: number | string;
  stock_deposito: number | string;
  cantidad_danada: number | string;
  precio_cartel: number | string | null;
  precio_esperado: number | string | null;
  fecha_vencimiento_mas_proxima: string | null;
  requiere_reposicion: number;
  requiere_cambio_precio: number;
  observacion: string | null;
  producto_codigo?: string;
  producto_descripcion?: string;
  producto_precio_referencia?: number | string;
  producto_stock_minimo?: number | string;
  producto_stock_objetivo?: number | string;
}

export interface VisitaDetalleInput {
  id_visita: number;
  id_producto: number;
  stock_gondola: number;
  stock_deposito: number;
  cantidad_danada: number;
  precio_cartel: number | null;
  precio_esperado: number | null;
  fecha_vencimiento_mas_proxima: string | null;
  requiere_reposicion: number;
  requiere_cambio_precio: number;
  observacion: string | null;
}

export interface RutaDetalleOption {
  id_ruta_detalle: number;
  id_ruta: number;
  id_punto_venta: number;
  orden_visita: number;
  hora_estimada_llegada: string | null;
  ruta_fecha: string;
  ruta_descripcion: string | null;
  id_repositor: number;
  repositor_nombre?: string;
  punto_venta_nombre?: string;
  punto_venta_ciudad?: string | null;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const visitasEndpoint = new URL('../backend-php/api/visitas.php', document.baseURI).toString();
const detalleEndpoint = new URL('../backend-php/api/visita_detalle.php', document.baseURI).toString();

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

export async function listVisitas(): Promise<VisitaRow[]> {
  const response = await request<VisitaRow[]>(visitasEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listRutaDetalleOptions(): Promise<RutaDetalleOption[]> {
  const response = await request<RutaDetalleOption[]>(
    visitasEndpoint,
    { method: 'GET' },
    { opciones: 'rutas' }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createVisita(input: VisitaInput): Promise<number> {
  const response = await request(visitasEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateVisita(id: number, input: Partial<VisitaInput>): Promise<void> {
  await request(visitasEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteVisita(id: number): Promise<void> {
  await request(visitasEndpoint, { method: 'DELETE' }, { id });
}

export async function listVisitaDetalle(idVisita: number): Promise<VisitaDetalleRow[]> {
  const response = await request<VisitaDetalleRow[]>(
    detalleEndpoint,
    { method: 'GET' },
    { id_visita: idVisita }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createVisitaDetalle(input: VisitaDetalleInput): Promise<number> {
  const response = await request(detalleEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updateVisitaDetalle(
  id: number,
  input: Partial<VisitaDetalleInput>
): Promise<void> {
  await request(detalleEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deleteVisitaDetalle(id: number): Promise<void> {
  await request(detalleEndpoint, { method: 'DELETE' }, { id });
}

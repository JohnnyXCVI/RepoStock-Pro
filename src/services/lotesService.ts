export interface LoteRow {
  id_lote: number;
  id_producto: number;
  id_punto_venta: number;
  numero_lote: string;
  fecha_ingreso: string | null;
  fecha_vencimiento: string;
  cantidad_deposito: number | string;
  cantidad_gondola: number | string;
  producto_codigo?: string;
  producto_descripcion?: string;
  punto_venta_nombre?: string;
  dias_restantes?: number | string;
}

export interface LoteInput {
  id_producto: number;
  id_punto_venta: number;
  numero_lote: string;
  fecha_ingreso: string | null;
  fecha_vencimiento: string;
  cantidad_deposito: number;
  cantidad_gondola: number;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const lotesEndpoint = new URL('../backend-php/api/lotes.php', document.baseURI).toString();

async function request<T>(init?: RequestInit, id?: number): Promise<ApiResponse<T>> {
  const url = new URL(lotesEndpoint);
  if (id !== undefined) {
    url.searchParams.set('id', String(id));
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

export async function listLotes(): Promise<LoteRow[]> {
  const response = await request<LoteRow[]>({ method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createLote(input: LoteInput): Promise<void> {
  await request({ method: 'POST', body: JSON.stringify(input) });
}

export async function updateLote(id: number, input: LoteInput): Promise<void> {
  await request({ method: 'PUT', body: JSON.stringify(input) }, id);
}

export async function deleteLote(id: number): Promise<void> {
  await request({ method: 'DELETE' }, id);
}

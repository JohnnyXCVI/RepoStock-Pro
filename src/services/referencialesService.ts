export type ReferencialTipo =
  | 'tipo-pdv'
  | 'categoria'
  | 'marca'
  | 'unidad'
  | 'estado'
  | 'prioridad'
  | 'motivo'
  | 'tipo-incidente';

export type ReferencialValue = string | number | null;

export type ReferencialRow = Record<string, ReferencialValue>;

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
  affected?: number;
}

const endpoint = new URL('../backend-php/api/referenciales.php', document.baseURI).toString();

async function request<T>(tipo: ReferencialTipo, init?: RequestInit, id?: number): Promise<ApiResponse<T>> {
  const url = new URL(endpoint);
  url.searchParams.set('tipo', tipo);
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

export async function listReferenciales(tipo: ReferencialTipo): Promise<ReferencialRow[]> {
  const response = await request<ReferencialRow[]>(tipo, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export function createReferencial(
  tipo: ReferencialTipo,
  data: Record<string, ReferencialValue>
): Promise<ApiResponse> {
  return request(tipo, { method: 'POST', body: JSON.stringify(data) });
}

export function updateReferencial(
  tipo: ReferencialTipo,
  id: number,
  data: Record<string, ReferencialValue>
): Promise<ApiResponse> {
  return request(tipo, { method: 'PUT', body: JSON.stringify(data) }, id);
}

export function deleteReferencial(tipo: ReferencialTipo, id: number): Promise<ApiResponse> {
  return request(tipo, { method: 'DELETE' }, id);
}

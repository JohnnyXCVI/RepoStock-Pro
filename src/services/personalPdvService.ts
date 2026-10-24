export interface RepositorRow {
  id_repositor: number;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string | null;
  email: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: number;
}

export interface PuntoVentaRow {
  id_punto_venta: number;
  id_tipo_punto: number;
  nombre: string;
  ruc: string | null;
  direccion: string;
  ciudad: string | null;
  departamento: string | null;
  latitud: number | string | null;
  longitud: number | string | null;
  contacto: string | null;
  telefono: string | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  frecuencia_visita_dias: number;
  estado: number;
  tipo_nombre?: string;
}

export interface RepositorInput {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string | null;
  email: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: number;
}

export interface PuntoVentaInput {
  id_tipo_punto: number;
  nombre: string;
  ruc: string | null;
  direccion: string;
  ciudad: string | null;
  departamento: string | null;
  latitud: number | null;
  longitud: number | null;
  contacto: string | null;
  telefono: string | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  frecuencia_visita_dias: number;
  estado: number;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
}

const repositoriosEndpoint = new URL('../backend-php/api/repositores.php', document.baseURI).toString();
const puntosVentaEndpoint = new URL('../backend-php/api/puntos_venta.php', document.baseURI).toString();

async function request<T>(endpoint: string, init?: RequestInit, id?: number): Promise<ApiResponse<T>> {
  const url = new URL(endpoint);
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

export async function listRepositores(): Promise<RepositorRow[]> {
  const response = await request<RepositorRow[]>(repositoriosEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createRepositor(input: RepositorInput): Promise<void> {
  await request(repositoriosEndpoint, { method: 'POST', body: JSON.stringify(input) });
}

export async function updateRepositor(id: number, input: RepositorInput): Promise<void> {
  await request(repositoriosEndpoint, { method: 'PUT', body: JSON.stringify(input) }, id);
}

export async function deleteRepositor(id: number): Promise<void> {
  await request(repositoriosEndpoint, { method: 'DELETE' }, id);
}

export async function listPuntosVenta(): Promise<PuntoVentaRow[]> {
  const response = await request<PuntoVentaRow[]>(puntosVentaEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createPuntoVenta(input: PuntoVentaInput): Promise<void> {
  await request(puntosVentaEndpoint, { method: 'POST', body: JSON.stringify(input) });
}

export async function updatePuntoVenta(id: number, input: PuntoVentaInput): Promise<void> {
  await request(puntosVentaEndpoint, { method: 'PUT', body: JSON.stringify(input) }, id);
}

export async function deletePuntoVenta(id: number): Promise<void> {
  await request(puntosVentaEndpoint, { method: 'DELETE' }, id);
}

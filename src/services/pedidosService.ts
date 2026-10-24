export interface PedidoRow {
  id_pedido: number;
  numero_pedido: string;
  id_punto_venta: number;
  id_repositor: number;
  fecha_pedido: string;
  fecha_entrega_prevista: string | null;
  id_estado: number;
  observacion: string | null;
  punto_venta_nombre?: string;
  punto_venta_fantasia?: string;
  repositor_nombres?: string;
  repositor_apellidos?: string;
  estado_nombre?: string;
  total_lineas?: number | string;
  monto_total?: number | string;
}

export interface PedidoInput {
  id_punto_venta: number;
  id_repositor: number;
  fecha_pedido?: string;
  fecha_entrega_prevista: string | null;
  id_estado: number;
  observacion: string | null;
}

export interface PedidoEstadoRow {
  id_estado: number;
  descripcion: string;
}

export interface PedidoDetalleRow {
  id_pedido_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad_solicitada: number | string;
  cantidad_recibida: number | string;
  precio_unitario: number | string;
  producto_codigo?: string;
  producto_nombre?: string;
  producto_sku?: string;
  producto_unidad?: string | null;
}

export interface PedidoDetalleInput {
  id_pedido: number;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: number;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
  numero_pedido?: string;
}

const pedidosEndpoint = new URL('../backend-php/api/pedidos.php', document.baseURI).toString();
const detalleEndpoint = new URL('../backend-php/api/pedido_detalle.php', document.baseURI).toString();

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

export async function listPedidos(): Promise<PedidoRow[]> {
  const response = await request<PedidoRow[]>(pedidosEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function listPedidoEstados(): Promise<PedidoEstadoRow[]> {
  const response = await request<PedidoEstadoRow[]>(
    pedidosEndpoint,
    { method: 'GET' },
    { opciones: 'estados' }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createPedido(input: PedidoInput): Promise<{ id: number; numeroPedido: string }> {
  const response = await request(pedidosEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return {
    id: Number(response.id ?? 0),
    numeroPedido: response.numero_pedido || '',
  };
}

export async function updatePedido(id: number, input: Partial<PedidoInput>): Promise<void> {
  await request(pedidosEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deletePedido(id: number): Promise<void> {
  await request(pedidosEndpoint, { method: 'DELETE' }, { id });
}

export async function listPedidoDetalle(idPedido: number): Promise<PedidoDetalleRow[]> {
  const response = await request<PedidoDetalleRow[]>(
    detalleEndpoint,
    { method: 'GET' },
    { id_pedido: idPedido }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createPedidoDetalle(input: PedidoDetalleInput): Promise<number> {
  const response = await request(detalleEndpoint, { method: 'POST', body: JSON.stringify(input) });
  return Number(response.id ?? 0);
}

export async function updatePedidoDetalle(
  id: number,
  input: Partial<Omit<PedidoDetalleInput, 'id_pedido' | 'id_producto'>>
): Promise<void> {
  await request(detalleEndpoint, { method: 'PUT', body: JSON.stringify(input) }, { id });
}

export async function deletePedidoDetalle(id: number): Promise<void> {
  await request(detalleEndpoint, { method: 'DELETE' }, { id });
}

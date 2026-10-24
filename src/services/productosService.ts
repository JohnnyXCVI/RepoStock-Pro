export interface ProductoRow {
  id_producto: number;
  codigo: string;
  codigo_barras: string | null;
  descripcion: string;
  id_categoria: number;
  id_marca: number | null;
  id_unidad: number;
  dias_alerta_vencimiento: number;
  stock_minimo_gondola: number | string;
  stock_objetivo_gondola: number | string;
  precio_referencia: number | string;
  estado: number;
  categoria_nombre?: string;
  marca_nombre?: string | null;
  unidad_nombre?: string;
  unidad_abreviatura?: string;
}

export interface ProductoInput {
  codigo: string;
  codigo_barras: string | null;
  descripcion: string;
  id_categoria: number;
  id_marca: number | null;
  id_unidad: number;
  dias_alerta_vencimiento: number;
  stock_minimo_gondola: number;
  stock_objetivo_gondola: number;
  precio_referencia: number;
  estado: number;
}

export interface ProductoPuntoVentaRow {
  id_producto_pv: number;
  id_producto: number;
  id_punto_venta: number;
  precio_esperado: number | string;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  stock_minimo: number | string;
  stock_objetivo: number | string;
  activo: number;
  producto_codigo?: string;
  producto_descripcion?: string;
  punto_venta_nombre?: string;
}

export interface ProductoPuntoVentaInput {
  id_producto: number;
  id_punto_venta: number;
  precio_esperado: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  stock_minimo: number;
  stock_objetivo: number;
  activo: number;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  id?: number;
}

const productosEndpoint = new URL('../backend-php/api/productos.php', document.baseURI).toString();
const productosPdvEndpoint = new URL('../backend-php/api/producto_punto_venta.php', document.baseURI).toString();

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

export async function listProductos(): Promise<ProductoRow[]> {
  const response = await request<ProductoRow[]>(productosEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createProducto(input: ProductoInput): Promise<void> {
  await request(productosEndpoint, { method: 'POST', body: JSON.stringify(input) });
}

export async function updateProducto(id: number, input: ProductoInput): Promise<void> {
  await request(productosEndpoint, { method: 'PUT', body: JSON.stringify(input) }, id);
}

export async function deleteProducto(id: number): Promise<void> {
  await request(productosEndpoint, { method: 'DELETE' }, id);
}

export async function listProductosPuntoVenta(): Promise<ProductoPuntoVentaRow[]> {
  const response = await request<ProductoPuntoVentaRow[]>(productosPdvEndpoint, { method: 'GET' });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createProductoPuntoVenta(input: ProductoPuntoVentaInput): Promise<void> {
  await request(productosPdvEndpoint, { method: 'POST', body: JSON.stringify(input) });
}

export async function updateProductoPuntoVenta(
  id: number,
  input: ProductoPuntoVentaInput
): Promise<void> {
  await request(productosPdvEndpoint, { method: 'PUT', body: JSON.stringify(input) }, id);
}

export async function deleteProductoPuntoVenta(id: number): Promise<void> {
  await request(productosPdvEndpoint, { method: 'DELETE' }, id);
}

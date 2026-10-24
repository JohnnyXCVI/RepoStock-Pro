import {
  TipoPuntoVenta,
  CategoriaProducto,
  Marca,
  UnidadMedida,
  EstadoGeneralItem,
  PrioridadItem,
  MotivoIncidencia,
  TipoIncidente,
  Repositor,
  PuntoVenta,
  Producto,
  ProductoPuntoVenta,
  LoteVencimiento,
  PlanificacionRuta,
  Visita,
  ReposicionRegistro,
  PedidoProducto,
  Incidencia
} from '../types';

import {
  INITIAL_TIPOS_PDV,
  INITIAL_CATEGORIAS,
  INITIAL_MARCAS,
  INITIAL_UNIDADES_MEDIDA,
  INITIAL_ESTADOS_GENERALES,
  INITIAL_PRIORIDADES,
  INITIAL_MOTIVOS_INCIDENCIA,
  INITIAL_TIPOS_INCIDENTE,
  INITIAL_REPOSITORES,
  INITIAL_PUNTOS_VENTA,
  INITIAL_PRODUCTOS,
  INITIAL_PRODUCTOS_PDV,
  INITIAL_LOTES,
  INITIAL_RUTAS,
  INITIAL_VISITAS,
  INITIAL_REPOSICIONES,
  INITIAL_PEDIDOS,
  INITIAL_INCIDENCIAS
} from '../data/initialData';

const STORAGE_KEYS = {
  TIPOS_PDV: 'repostock_tipos_pdv',
  CATEGORIAS: 'repostock_categorias',
  MARCAS: 'repostock_marcas',
  UNIDADES_MEDIDA: 'repostock_unidades_medida',
  ESTADOS_GENERALES: 'repostock_estados_generales',
  PRIORIDADES: 'repostock_prioridades',
  MOTIVOS_INCIDENCIA: 'repostock_motivos_incidencia',
  TIPOS_INCIDENTE: 'repostock_tipos_incidente',
  REPOSITORES: 'repostock_repositores',
  PUNTOS_VENTA: 'repostock_puntos_venta',
  PRODUCTOS: 'repostock_productos',
  PRODUCTOS_PDV: 'repostock_productos_pdv',
  LOTES: 'repostock_lotes',
  RUTAS: 'repostock_rutas',
  VISITAS: 'repostock_visitas',
  REPOSICIONES: 'repostock_reposiciones',
  PEDIDOS: 'repostock_pedidos',
  INCIDENCIAS: 'repostock_incidencias',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Referenciales
  getTiposPdv: (): TipoPuntoVenta[] => getStored(STORAGE_KEYS.TIPOS_PDV, INITIAL_TIPOS_PDV),
  saveTiposPdv: (data: TipoPuntoVenta[]) => setStored(STORAGE_KEYS.TIPOS_PDV, data),

  getCategorias: (): CategoriaProducto[] => getStored(STORAGE_KEYS.CATEGORIAS, INITIAL_CATEGORIAS),
  saveCategorias: (data: CategoriaProducto[]) => setStored(STORAGE_KEYS.CATEGORIAS, data),

  getMarcas: (): Marca[] => getStored(STORAGE_KEYS.MARCAS, INITIAL_MARCAS),
  saveMarcas: (data: Marca[]) => setStored(STORAGE_KEYS.MARCAS, data),

  getUnidadesMedida: (): UnidadMedida[] => getStored(STORAGE_KEYS.UNIDADES_MEDIDA, INITIAL_UNIDADES_MEDIDA),
  saveUnidadesMedida: (data: UnidadMedida[]) => setStored(STORAGE_KEYS.UNIDADES_MEDIDA, data),

  getEstadosGenerales: (): EstadoGeneralItem[] => getStored(STORAGE_KEYS.ESTADOS_GENERALES, INITIAL_ESTADOS_GENERALES),
  saveEstadosGenerales: (data: EstadoGeneralItem[]) => setStored(STORAGE_KEYS.ESTADOS_GENERALES, data),

  getPrioridades: (): PrioridadItem[] => getStored(STORAGE_KEYS.PRIORIDADES, INITIAL_PRIORIDADES),
  savePrioridades: (data: PrioridadItem[]) => setStored(STORAGE_KEYS.PRIORIDADES, data),

  getMotivosIncidencia: (): MotivoIncidencia[] => getStored(STORAGE_KEYS.MOTIVOS_INCIDENCIA, INITIAL_MOTIVOS_INCIDENCIA),
  saveMotivosIncidencia: (data: MotivoIncidencia[]) => setStored(STORAGE_KEYS.MOTIVOS_INCIDENCIA, data),

  getTiposIncidente: (): TipoIncidente[] => getStored(STORAGE_KEYS.TIPOS_INCIDENTE, INITIAL_TIPOS_INCIDENTE),
  saveTiposIncidente: (data: TipoIncidente[]) => setStored(STORAGE_KEYS.TIPOS_INCIDENTE, data),

  // Personal y Puntos de Venta
  getRepositores: (): Repositor[] => getStored(STORAGE_KEYS.REPOSITORES, INITIAL_REPOSITORES),
  saveRepositores: (data: Repositor[]) => setStored(STORAGE_KEYS.REPOSITORES, data),

  getPuntosVenta: (): PuntoVenta[] => getStored(STORAGE_KEYS.PUNTOS_VENTA, INITIAL_PUNTOS_VENTA),
  savePuntosVenta: (data: PuntoVenta[]) => setStored(STORAGE_KEYS.PUNTOS_VENTA, data),

  // Productos y Precios
  getProductos: (): Producto[] => getStored(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS),
  saveProductos: (data: Producto[]) => setStored(STORAGE_KEYS.PRODUCTOS, data),

  getProductosPdv: (): ProductoPuntoVenta[] => getStored(STORAGE_KEYS.PRODUCTOS_PDV, INITIAL_PRODUCTOS_PDV),
  saveProductosPdv: (data: ProductoPuntoVenta[]) => setStored(STORAGE_KEYS.PRODUCTOS_PDV, data),

  // Lotes y Vencimientos
  getLotes: (): LoteVencimiento[] => getStored(STORAGE_KEYS.LOTES, INITIAL_LOTES),
  saveLotes: (data: LoteVencimiento[]) => setStored(STORAGE_KEYS.LOTES, data),

  // Planificación de Rutas
  getRutas: (): PlanificacionRuta[] => getStored(STORAGE_KEYS.RUTAS, INITIAL_RUTAS),
  saveRutas: (data: PlanificacionRuta[]) => setStored(STORAGE_KEYS.RUTAS, data),

  // Visitas
  getVisitas: (): Visita[] => getStored(STORAGE_KEYS.VISITAS, INITIAL_VISITAS),
  saveVisitas: (data: Visita[]) => setStored(STORAGE_KEYS.VISITAS, data),

  // Reposiciones
  getReposiciones: (): ReposicionRegistro[] => getStored(STORAGE_KEYS.REPOSICIONES, INITIAL_REPOSICIONES),
  saveReposiciones: (data: ReposicionRegistro[]) => setStored(STORAGE_KEYS.REPOSICIONES, data),

  // Pedidos
  getPedidos: (): PedidoProducto[] => getStored(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS),
  savePedidos: (data: PedidoProducto[]) => setStored(STORAGE_KEYS.PEDIDOS, data),

  // Incidencias
  getIncidencias: (): Incidencia[] => getStored(STORAGE_KEYS.INCIDENCIAS, INITIAL_INCIDENCIAS),
  saveIncidencias: (data: Incidencia[]) => setStored(STORAGE_KEYS.INCIDENCIAS, data),

  // Reset to factory mock data
  resetAll: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
};

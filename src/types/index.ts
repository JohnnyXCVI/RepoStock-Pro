export type StatusGeneral = 'Activo' | 'Inactivo' | 'Pendiente' | 'Bloqueado' | 'En Revisión';
export type PriorityLevel = 'Baja' | 'Media' | 'Alta' | 'Urgente';

// 1. Referenciales
export interface TipoPuntoVenta {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: StatusGeneral;
}

export interface CategoriaProducto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  temperaturaRequerida?: string;
  estado: StatusGeneral;
}

export interface Marca {
  id: string;
  codigo: string;
  nombre: string;
  fabricante: string;
  paisOrigen: string;
  estado: StatusGeneral;
}

export interface UnidadMedida {
  id: string;
  codigo: string;
  nombre: string;
  abreviatura: string;
  tipo: 'Unidad' | 'Peso' | 'Volumen' | 'Empaque';
  estado: StatusGeneral;
}

export interface EstadoGeneralItem {
  id: string;
  codigo: string;
  nombre: string;
  aplicaA: string;
  colorHex: string;
  estado: StatusGeneral;
}

export interface PrioridadItem {
  id: string;
  codigo: string;
  nombre: PriorityLevel;
  nivelNumerico: number;
  tiempoRespuestaMaxHoras: number;
  colorHex: string;
  estado: StatusGeneral;
}

export interface MotivoIncidencia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  requiereFoto: boolean;
  estado: StatusGeneral;
}

export interface TipoIncidente {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'Stock' | 'Calidad' | 'Precios' | 'Exhibición' | 'Logística';
  severidadSugerida: PriorityLevel;
  estado: StatusGeneral;
}

// 2. Personal y Puntos de Venta
export interface Repositor {
  id: string;
  legajo: string;
  nombreCompleto: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
  zonaAsignada: string;
  turno: 'Mañana' | 'Tarde' | 'Noche' | 'Rotativo';
  vehiculo: string;
  estado: StatusGeneral;
  fechaIngreso: string;
}

export interface PuntoVenta {
  id: string;
  codigo: string;
  nombreFantasia: string;
  razonSocial: string;
  tipoPdvId: string;
  tipoPdvNombre?: string;
  direccion: string;
  ciudad: string;
  zona: string;
  contactoEncargado: string;
  telefonoContacto: string;
  coordenadas?: { lat: number; lng: number };
  horarioReposicion: string;
  superficieM2?: number;
  estado: StatusGeneral;
}

// 3. Productos y Precios
export interface Producto {
  id: string;
  sku: string;
  codigoBarras: string; // EAN-13
  nombre: string;
  categoriaId: string;
  categoriaNombre?: string;
  marcaId: string;
  marcaNombre?: string;
  unidadMedidaId: string;
  unidadMedidaNombre?: string;
  stockMinimoSugerido: number;
  precioListaBase: number;
  temperaturaConservacion?: string;
  diasVidaUtil: number;
  estado: StatusGeneral;
}

export interface ProductoPuntoVenta {
  id: string;
  productoId: string;
  puntoVentaId: string;
  productoNombre?: string;
  productoSku?: string;
  puntoVentaNombre?: string;
  precioVentaLocal: number;
  espacioGondolaFacings: number;
  stockMinimoGondola: number;
  stockActualGondola: number;
  stockDepositoTrastienda: number;
  pasilloGondola: string;
  posicionEstante: string;
  estado: StatusGeneral;
  ultimaReposicionFecha?: string;
}

// 4. Lotes y Vencimientos
export interface LoteVencimiento {
  id: string;
  numeroLote: string;
  productoId: string;
  productoNombre?: string;
  sku?: string;
  puntoVentaId: string;
  puntoVentaNombre?: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  cantidadDisponible: number;
  ubicacion: 'Góndola' | 'Trastienda / Depósito';
  estadoLote: 'Vigente' | 'Por Vencer (<30d)' | 'Crítico (<7d)' | 'Vencido';
  accionSugerida: 'Rotación FEFO' | 'Alerta Descuento' | 'Devolución Proveedor' | 'Baja por Vencimiento';
  observaciones?: string;
}

// 5. Planificación de Rutas
export interface RutaDetalleParada {
  id: string;
  ordenSecuencia: number;
  puntoVentaId: string;
  puntoVentaNombre: string;
  direccion: string;
  horaEstimadaLlegada: string;
  duracionEstimadaMinutos: number;
  prioridadVisita: PriorityLevel;
  completada: boolean;
}

export interface PlanificacionRuta {
  id: string;
  codigoRuta: string;
  nombre: string;
  repositorId: string;
  repositorNombre: string;
  diaSemana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  fechaProgramada: string;
  zona: string;
  horaInicioEstimada: string;
  horaFinEstimada: string;
  paradas: RutaDetalleParada[];
  estado: 'Planificada' | 'En Curso' | 'Completada' | 'Cancelada';
  observaciones?: string;
}

// 6. Visitas
export interface CheckItemGondola {
  criterio: string;
  aprobado: boolean;
  comentario?: string;
}

export interface Visita {
  id: string;
  codigoVisita: string;
  rutaId?: string;
  repositorId: string;
  repositorNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  fecha: string;
  horaCheckIn: string;
  horaCheckOut?: string;
  duracionMinutos?: number;
  estadoVisita: 'En Progreso' | 'Completada' | 'Con Incidencias' | 'Cancelada';
  cumplimientoGondolaPct: number;
  checklist: CheckItemGondola[];
  nombreEncargadoPDV: string;
  firmaConformidad: boolean;
  observacionesGenerales: string;
}

// 7. Reposiciones
export interface DetalleReposicionItem {
  id: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  stockInicialGondola: number;
  stockTrastiendaAntes: number;
  cantidadRepuesta: number;
  stockFinalGondola: number;
  facingsResultantes: number;
  motivoQuiebre?: string;
  estadoAbastecimiento: 'Abastecido' | 'Quiebre Parcial' | 'Quiebre Total' | 'Excedente';
}

export interface ReposicionRegistro {
  id: string;
  codigoRegistro: string;
  visitaId?: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  repositorId: string;
  repositorNombre: string;
  fecha: string;
  hora: string;
  items: DetalleReposicionItem[];
  totalUnidadesRepuestas: number;
  quiebresDetectados: number;
  observaciones: string;
}

// 8. Pedidos de Productos
export interface DetallePedidoItem {
  id: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  cantidadSugerida: number;
  cantidadSolicitada: number;
  unidadMedida: string;
  precioUnitarioEstimado: number;
  subtotal: number;
  motivo: 'Reposición Normal' | 'Quiebre Crítico' | 'Lanzamiento' | 'Promoción / Oferta';
}

export interface PedidoProducto {
  id: string;
  numeroPedido: string;
  fechaPedido: string;
  fechaEntregaRequerida: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  repositorSolicitanteId: string;
  repositorSolicitanteNombre: string;
  tipoPedido: 'Reposición Ordinaria' | 'Pedido Urgente Quiebre' | 'Campaña Especial';
  estado: 'Borrador' | 'Solicitado' | 'Aprobado' | 'En Despacho' | 'Entregado' | 'Cancelado';
  items: DetallePedidoItem[];
  totalBultos: number;
  montoTotalEstimado: number;
  centroDistribucionDestino: string;
  observaciones: string;
}

// 9. Incidencias
export interface Incidencia {
  id: string;
  codigo: string;
  fecha: string;
  hora: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  repositorId: string;
  repositorNombre: string;
  tipoIncidenteId: string;
  tipoIncidenteNombre: string;
  motivoIncidenciaId: string;
  motivoIncidenciaNombre: string;
  prioridad: PriorityLevel;
  productoId?: string;
  productoNombre?: string;
  descripcion: string;
  evidenciaFotograficaUrl?: string;
  estado: 'Abierta' | 'En Gestión' | 'Resuelta' | 'Desestimada';
  accionCorrectiva?: string;
  fechaResolucion?: string;
  responsableResolucion?: string;
}

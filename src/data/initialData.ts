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

export const INITIAL_TIPOS_PDV: TipoPuntoVenta[] = [
  { id: 'tpdv-1', codigo: 'SUP', nombre: 'Supermercado', descripcion: 'Grandes superficies con alto tráfico y reposición diaria', estado: 'Activo' },
  { id: 'tpdv-2', codigo: 'FAR', nombre: 'Farmacia', descripcion: 'Cadenas farmacéuticas y boticas con góndola de cosmética y OTC', estado: 'Activo' },
  { id: 'tpdv-3', codigo: 'DES', nombre: 'Despensa / Minimarket', descripcion: 'Comercios de proximidad y tiendas de barrio', estado: 'Activo' },
  { id: 'tpdv-4', codigo: 'MAY', nombre: 'Almacén Mayorista', descripcion: 'Centros de distribución por bulto cerrado y pallets', estado: 'Activo' },
  { id: 'tpdv-5', codigo: 'CON', nombre: 'Tienda de Conveniencia', descripcion: 'Estaciones de servicio y locales express 24hs', estado: 'Activo' }
];

export const INITIAL_CATEGORIAS: CategoriaProducto[] = [
  { id: 'cat-1', codigo: 'LAC', nombre: 'Lácteos y Refrigerados', descripcion: 'Leches, yogures, quesos y mantecas', temperaturaRequerida: '2°C a 6°C', estado: 'Activo' },
  { id: 'cat-2', codigo: 'BEB', nombre: 'Bebidas y Refrescos', descripcion: 'Gaseosas, jugos, aguas minerales e isotónicas', temperaturaRequerida: 'Ambiente / Frío', estado: 'Activo' },
  { id: 'cat-3', codigo: 'OTC', nombre: 'Farmacia y Cuidado Salud', descripcion: 'Medicamentos OTC, analgésicos y vitaminas', temperaturaRequerida: 'Ambiente controlado < 25°C', estado: 'Activo' },
  { id: 'cat-4', codigo: 'LIM', nombre: 'Limpieza y Desinfección', descripcion: 'Detergentes, lavandinas, suavizantes y desodorantes', temperaturaRequerida: 'Ambiente', estado: 'Activo' },
  { id: 'cat-5', codigo: 'SNA', nombre: 'Snacks y Golosinas', descripcion: 'Galletitas, chocolates, papas fritas y barras de cereal', temperaturaRequerida: 'Ambiente seco', estado: 'Activo' },
  { id: 'cat-6', codigo: 'PER', nombre: 'Cuidado Personal e Higiene', descripcion: 'Jabones, shampoos, cremas dentales y desodorantes', temperaturaRequerida: 'Ambiente', estado: 'Activo' }
];

export const INITIAL_MARCAS: Marca[] = [
  { id: 'mar-1', codigo: 'TRB', nombre: 'Lácteos Los Robles', fabricante: 'Industrias Lácteas S.A.', paisOrigen: 'Paraguay', estado: 'Activo' },
  { id: 'mar-2', codigo: 'KO', nombre: 'Coca-Cola Company', fabricante: 'Embotelladora Central', paisOrigen: 'Internacional', estado: 'Activo' },
  { id: 'mar-3', codigo: 'BAY', nombre: 'Bayer Healthcare', fabricante: 'Bayer S.A.', paisOrigen: 'Alemania', estado: 'Activo' },
  { id: 'mar-4', codigo: 'COL', nombre: 'Colgate-Palmolive', fabricante: 'Colgate S.A.', paisOrigen: 'EE.UU.', estado: 'Activo' },
  { id: 'mar-5', codigo: 'ARC', nombre: 'Grupo Arcor', fabricante: 'Arcor Alimentos', paisOrigen: 'Argentina', estado: 'Activo' },
  { id: 'mar-6', codigo: 'UNI', nombre: 'Unilever', fabricante: 'Unilever de Sudamérica', paisOrigen: 'Internacional', estado: 'Activo' }
];

export const INITIAL_UNIDADES_MEDIDA: UnidadMedida[] = [
  { id: 'um-1', codigo: 'UN', nombre: 'Unidad', abreviatura: 'un', tipo: 'Unidad', estado: 'Activo' },
  { id: 'um-2', codigo: 'PK6', nombre: 'Pack por 6', abreviatura: 'pk6', tipo: 'Empaque', estado: 'Activo' },
  { id: 'um-3', codigo: 'CX12', nombre: 'Caja por 12 unidades', abreviatura: 'cx12', tipo: 'Empaque', estado: 'Activo' },
  { id: 'um-4', codigo: 'CX24', nombre: 'Caja por 24 unidades', abreviatura: 'cx24', tipo: 'Empaque', estado: 'Activo' },
  { id: 'um-5', codigo: 'KG', nombre: 'Kilogramo', abreviatura: 'kg', tipo: 'Peso', estado: 'Activo' },
  { id: 'um-6', codigo: 'LT', nombre: 'Litro', abreviatura: 'lt', tipo: 'Volumen', estado: 'Activo' },
  { id: 'um-7', codigo: 'BLI', nombre: 'Blíster por 10', abreviatura: 'blist', tipo: 'Empaque', estado: 'Activo' }
];

export const INITIAL_ESTADOS_GENERALES: EstadoGeneralItem[] = [
  { id: 'est-1', codigo: 'ACT', nombre: 'Activo', aplicaA: 'Todas las entidades', colorHex: '#16a34a', estado: 'Activo' },
  { id: 'est-2', codigo: 'INA', nombre: 'Inactivo', aplicaA: 'Entidades descontinuadas', colorHex: '#64748b', estado: 'Activo' },
  { id: 'est-3', codigo: 'PEN', nombre: 'Pendiente', aplicaA: 'Procesos por confirmar', colorHex: '#d97706', estado: 'Activo' },
  { id: 'est-4', codigo: 'BLO', nombre: 'Bloqueado', aplicaA: 'Restringido por auditoría o calidad', colorHex: '#dc2626', estado: 'Activo' },
  { id: 'est-5', codigo: 'REV', nombre: 'En Revisión', aplicaA: 'Observado en supervisión', colorHex: '#2563eb', estado: 'Activo' }
];

export const INITIAL_PRIORIDADES: PrioridadItem[] = [
  { id: 'prio-1', codigo: 'BAJ', nombre: 'Baja', nivelNumerico: 1, tiempoRespuestaMaxHoras: 72, colorHex: '#64748b', estado: 'Activo' },
  { id: 'prio-2', codigo: 'MED', nombre: 'Media', nivelNumerico: 2, tiempoRespuestaMaxHoras: 24, colorHex: '#2563eb', estado: 'Activo' },
  { id: 'prio-3', codigo: 'ALT', nombre: 'Alta', nivelNumerico: 3, tiempoRespuestaMaxHoras: 6, colorHex: '#d97706', estado: 'Activo' },
  { id: 'prio-4', codigo: 'URG', nombre: 'Urgente', nivelNumerico: 4, tiempoRespuestaMaxHoras: 2, colorHex: '#dc2626', estado: 'Activo' }
];

export const INITIAL_MOTIVOS_INCIDENCIA: MotivoIncidencia[] = [
  { id: 'mot-1', codigo: 'QUIE', nombre: 'Falta de Stock en Góndola (Quiebre)', descripcion: 'Góndola vacía mientras hay o no stock en depósito', requiereFoto: true, estado: 'Activo' },
  { id: 'mot-2', codigo: 'VENC', nombre: 'Producto Vencido / Próximo a Vencer', descripcion: 'Lote caducado o dentro del umbral crítico sin rotar', requiereFoto: true, estado: 'Activo' },
  { id: 'mot-3', codigo: 'AVER', nombre: 'Empaque Dañado / Avería de Envase', descripcion: 'Abolladuras, rasgaduras o pérdida de hermeticidad', requiereFoto: true, estado: 'Activo' },
  { id: 'mot-4', codigo: 'PREC', nombre: 'Discrepancia de Precio / Fleje Erróneo', descripcion: 'El precio exhibido difiere del sistema del PDV', requiereFoto: true, estado: 'Activo' },
  { id: 'mot-5', codigo: 'PLAN', nombre: 'Góndola Desordenada / Planograma Alterado', descripcion: 'Competencia invadiendo facings asignados', requiereFoto: true, estado: 'Activo' },
  { id: 'mot-6', codigo: 'POP', nombre: 'Falta de Material POP / Cenefas Rotas', descripcion: 'Exhibidor o material promocional deteriorado', requiereFoto: false, estado: 'Activo' }
];

export const INITIAL_TIPOS_INCIDENTE: TipoIncidente[] = [
  { id: 'tipi-1', codigo: 'INC-QG', nombre: 'Quiebre de Góndola', categoria: 'Stock', severidadSugerida: 'Alta', estado: 'Activo' },
  { id: 'tipi-2', codigo: 'INC-VP', nombre: 'Vencimiento Próximo o Caducado', categoria: 'Calidad', severidadSugerida: 'Urgente', estado: 'Activo' },
  { id: 'tipi-3', codigo: 'INC-AM', nombre: 'Avería de Mercadería', categoria: 'Calidad', severidadSugerida: 'Media', estado: 'Activo' },
  { id: 'tipi-4', codigo: 'INC-EP', nombre: 'Error de Precios / Flejes', categoria: 'Precios', severidadSugerida: 'Media', estado: 'Activo' },
  { id: 'tipi-5', codigo: 'INC-MP', nombre: 'Material POP Inadecuado o Dañado', categoria: 'Exhibición', severidadSugerida: 'Baja', estado: 'Activo' },
  { id: 'tipi-6', codigo: 'INC-BA', nombre: 'Bloqueo de Acceso a Depósito', categoria: 'Logística', severidadSugerida: 'Alta', estado: 'Activo' }
];

export const INITIAL_REPOSITORES: Repositor[] = [
  {
    id: 'rep-1',
    legajo: 'REP-101',
    nombreCompleto: 'Carlos Benítez Galeano',
    documentoIdentidad: '3.456.789',
    telefono: '+595 981 123 456',
    email: 'carlos.benitez@repostock.com',
    zonaAsignada: 'Zona Centro / Asunción',
    turno: 'Mañana',
    vehiculo: 'Motocicleta Honda 150',
    estado: 'Activo',
    fechaIngreso: '2023-03-15'
  },
  {
    id: 'rep-2',
    legajo: 'REP-102',
    nombreCompleto: 'María Inés González',
    documentoIdentidad: '4.120.334',
    telefono: '+595 982 789 012',
    email: 'maria.gonzalez@repostock.com',
    zonaAsignada: 'Zona Gran Asunción Norte',
    turno: 'Mañana',
    vehiculo: 'Automóvil Toyota Vitz',
    estado: 'Activo',
    fechaIngreso: '2022-08-10'
  },
  {
    id: 'rep-3',
    legajo: 'REP-103',
    nombreCompleto: 'Jorge Duarte Rojas',
    documentoIdentidad: '2.890.654',
    telefono: '+595 971 456 789',
    email: 'jorge.duarte@repostock.com',
    zonaAsignada: 'Zona Sur / Lambaré y Fdo.',
    turno: 'Tarde',
    vehiculo: 'Motocicleta Yamaha 125',
    estado: 'Activo',
    fechaIngreso: '2024-01-20'
  },
  {
    id: 'rep-4',
    legajo: 'REP-104',
    nombreCompleto: 'Andrea López Vera',
    documentoIdentidad: '4.789.012',
    telefono: '+595 985 654 321',
    email: 'andrea.lopez@repostock.com',
    zonaAsignada: 'Canal Farmacias y Especiales',
    turno: 'Rotativo',
    vehiculo: 'Automóvil Nissan Versa',
    estado: 'Activo',
    fechaIngreso: '2023-11-05'
  }
];

export const INITIAL_PUNTOS_VENTA: PuntoVenta[] = [
  {
    id: 'pdv-1',
    codigo: 'PDV-001',
    nombreFantasia: 'Superseis Los Laureles',
    razonSocial: 'Retail S.A.',
    tipoPdvId: 'tpdv-1',
    tipoPdvNombre: 'Supermercado',
    direccion: 'Avda. Boggiani c/ R.I. 6 Boquerón',
    ciudad: 'Asunción',
    zona: 'Zona Centro / Asunción',
    contactoEncargado: 'Lic. Fernando Vera (Gerente Salón)',
    telefonoContacto: '+595 21 611 200',
    coordenadas: { lat: -25.3032, lng: -57.5756 },
    horarioReposicion: '06:00 - 10:00 / 14:00 - 17:00',
    superficieM2: 2400,
    estado: 'Activo'
  },
  {
    id: 'pdv-2',
    codigo: 'PDV-002',
    nombreFantasia: 'Farmatodo Paseo La Galería',
    razonSocial: 'Farmatodo Internacional S.A.',
    tipoPdvId: 'tpdv-2',
    tipoPdvNombre: 'Farmacia',
    direccion: 'Avda. Santa Teresa e/ Aviadores del Chaco',
    ciudad: 'Asunción',
    zona: 'Zona Centro / Asunción',
    contactoEncargado: 'Dra. Gabriela Solís (Regente)',
    telefonoContacto: '+595 21 690 400',
    coordenadas: { lat: -25.2854, lng: -57.5583 },
    horarioReposicion: '08:00 - 12:00',
    superficieM2: 350,
    estado: 'Activo'
  },
  {
    id: 'pdv-3',
    codigo: 'PDV-003',
    nombreFantasia: 'Despensa & Minimarket San Cayetano',
    razonSocial: 'San Cayetano de Pedro Gómez',
    tipoPdvId: 'tpdv-3',
    tipoPdvNombre: 'Despensa / Minimarket',
    direccion: 'Calle Palma 845 c/ Colón',
    ciudad: 'Asunción',
    zona: 'Zona Centro / Asunción',
    contactoEncargado: 'Pedro Gómez (Propietario)',
    telefonoContacto: '+595 981 334 556',
    coordenadas: { lat: -25.2818, lng: -57.6415 },
    horarioReposicion: '07:30 - 11:00',
    superficieM2: 120,
    estado: 'Activo'
  },
  {
    id: 'pdv-4',
    codigo: 'PDV-004',
    nombreFantasia: 'Mayorista Makro Abasto Norte',
    razonSocial: 'Distribuidora Mayorista Makro S.A.',
    tipoPdvId: 'tpdv-4',
    tipoPdvNombre: 'Almacén Mayorista',
    direccion: 'Ruta Transchaco Km 14.5',
    ciudad: 'Limpio',
    zona: 'Zona Gran Asunción Norte',
    contactoEncargado: 'Ing. Rodrigo Almada (Jefe Depósito)',
    telefonoContacto: '+595 21 780 900',
    coordenadas: { lat: -25.1872, lng: -57.5142 },
    horarioReposicion: '05:00 - 09:00',
    superficieM2: 6500,
    estado: 'Activo'
  },
  {
    id: 'pdv-5',
    codigo: 'PDV-005',
    nombreFantasia: 'Tienda Express Petrobras San Martín',
    razonSocial: 'Servicentro San Martín S.R.L.',
    tipoPdvId: 'tpdv-5',
    tipoPdvNombre: 'Tienda de Conveniencia',
    direccion: 'Avda. San Martín esq. Austria',
    ciudad: 'Asunción',
    zona: 'Zona Centro / Asunción',
    contactoEncargado: 'Marcos Peralta (Encargado Turno)',
    telefonoContacto: '+595 21 602 110',
    coordenadas: { lat: -25.2951, lng: -57.5812 },
    horarioReposicion: '10:00 - 13:00',
    superficieM2: 180,
    estado: 'Activo'
  }
];

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 'prod-1',
    sku: 'LAC-LECH-01',
    codigoBarras: '7840001001012',
    nombre: 'Leche Entera UHT 1L Lácteos Los Robles',
    categoriaId: 'cat-1',
    categoriaNombre: 'Lácteos y Refrigerados',
    marcaId: 'mar-1',
    marcaNombre: 'Lácteos Los Robles',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 48,
    precioListaBase: 6500,
    temperaturaConservacion: 'Ambiente / Refrigerar al abrir',
    diasVidaUtil: 180,
    estado: 'Activo'
  },
  {
    id: 'prod-2',
    sku: 'LAC-YOG-02',
    codigoBarras: '7840001001029',
    nombre: 'Yogur Frutilla Sache 1L Los Robles',
    categoriaId: 'cat-1',
    categoriaNombre: 'Lácteos y Refrigerados',
    marcaId: 'mar-1',
    marcaNombre: 'Lácteos Los Robles',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 24,
    precioListaBase: 8200,
    temperaturaConservacion: 'Refrigerado 2°C a 6°C',
    diasVidaUtil: 35,
    estado: 'Activo'
  },
  {
    id: 'prod-3',
    sku: 'BEB-COCA-01',
    codigoBarras: '7840002002018',
    nombre: 'Coca-Cola Original Botella 2L Descartable',
    categoriaId: 'cat-2',
    categoriaNombre: 'Bebidas y Refrescos',
    marcaId: 'mar-2',
    marcaNombre: 'Coca-Cola Company',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 60,
    precioListaBase: 12500,
    temperaturaConservacion: 'Ambiente fresco',
    diasVidaUtil: 270,
    estado: 'Activo'
  },
  {
    id: 'prod-4',
    sku: 'BEB-COCA-02',
    codigoBarras: '7840002002025',
    nombre: 'Coca-Cola Sin Azúcar Lata 354ml Pack x6',
    categoriaId: 'cat-2',
    categoriaNombre: 'Bebidas y Refrescos',
    marcaId: 'mar-2',
    marcaNombre: 'Coca-Cola Company',
    unidadMedidaId: 'um-2',
    unidadMedidaNombre: 'Pack por 6',
    stockMinimoSugerido: 20,
    precioListaBase: 24000,
    temperaturaConservacion: 'Ambiente fresco',
    diasVidaUtil: 360,
    estado: 'Activo'
  },
  {
    id: 'prod-5',
    sku: 'OTC-ASPI-01',
    codigoBarras: '7840003003014',
    nombre: 'Aspirina 500mg Bayer Caja x20 Comprimidos',
    categoriaId: 'cat-3',
    categoriaNombre: 'Farmacia y Cuidado Salud',
    marcaId: 'mar-3',
    marcaNombre: 'Bayer Healthcare',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 30,
    precioListaBase: 18500,
    temperaturaConservacion: 'Menor a 25°C',
    diasVidaUtil: 720,
    estado: 'Activo'
  },
  {
    id: 'prod-6',
    sku: 'PER-COLG-01',
    codigoBarras: '7840004004010',
    nombre: 'Crema Dental Colgate Total 12 Clean Mint 90g',
    categoriaId: 'cat-6',
    categoriaNombre: 'Cuidado Personal e Higiene',
    marcaId: 'mar-4',
    marcaNombre: 'Colgate-Palmolive',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 36,
    precioListaBase: 14000,
    temperaturaConservacion: 'Ambiente',
    diasVidaUtil: 720,
    estado: 'Activo'
  },
  {
    id: 'prod-7',
    sku: 'SNA-GAL-01',
    codigoBarras: '7840005005016',
    nombre: 'Galletitas Rellenas Chocolinas 250g Arcor',
    categoriaId: 'cat-5',
    categoriaNombre: 'Snacks y Golosinas',
    marcaId: 'mar-5',
    marcaNombre: 'Grupo Arcor',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 40,
    precioListaBase: 9800,
    temperaturaConservacion: 'Ambiente seco',
    diasVidaUtil: 210,
    estado: 'Activo'
  },
  {
    id: 'prod-8',
    sku: 'LIM-JAB-01',
    codigoBarras: '7840006006012',
    nombre: 'Jabón Líquido para Ropa Omo Concentrado 3L',
    categoriaId: 'cat-4',
    categoriaNombre: 'Limpieza y Desinfección',
    marcaId: 'mar-6',
    marcaNombre: 'Unilever',
    unidadMedidaId: 'um-1',
    unidadMedidaNombre: 'Unidad',
    stockMinimoSugerido: 25,
    precioListaBase: 48000,
    temperaturaConservacion: 'Ambiente',
    diasVidaUtil: 540,
    estado: 'Activo'
  }
];

export const INITIAL_PRODUCTOS_PDV: ProductoPuntoVenta[] = [
  {
    id: 'ppdv-1',
    productoId: 'prod-1',
    productoNombre: 'Leche Entera UHT 1L Lácteos Los Robles',
    productoSku: 'LAC-LECH-01',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    precioVentaLocal: 6900,
    espacioGondolaFacings: 6,
    stockMinimoGondola: 36,
    stockActualGondola: 12, // Quiebre parcial
    stockDepositoTrastienda: 120,
    pasilloGondola: 'Pasillo 4 - Lácteos',
    posicionEstante: 'Estante Medio (Nivel Ojos)',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-22'
  },
  {
    id: 'ppdv-2',
    productoId: 'prod-2',
    productoNombre: 'Yogur Frutilla Sache 1L Los Robles',
    productoSku: 'LAC-YOG-02',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    precioVentaLocal: 8900,
    espacioGondolaFacings: 4,
    stockMinimoGondola: 20,
    stockActualGondola: 4,
    stockDepositoTrastienda: 48,
    pasilloGondola: 'Heladera Mural 2',
    posicionEstante: 'Nivel 2',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-22'
  },
  {
    id: 'ppdv-3',
    productoId: 'prod-3',
    productoNombre: 'Coca-Cola Original Botella 2L Descartable',
    productoSku: 'BEB-COCA-01',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    precioVentaLocal: 13500,
    espacioGondolaFacings: 8,
    stockMinimoGondola: 48,
    stockActualGondola: 42,
    stockDepositoTrastienda: 240,
    pasilloGondola: 'Cabecera de Góndola 7',
    posicionEstante: 'Exhibidor Doble Pallet',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-23'
  },
  {
    id: 'ppdv-4',
    productoId: 'prod-5',
    productoNombre: 'Aspirina 500mg Bayer Caja x20 Comprimidos',
    productoSku: 'OTC-ASPI-01',
    puntoVentaId: 'pdv-2',
    puntoVentaNombre: 'Farmatodo Paseo La Galería',
    precioVentaLocal: 19900,
    espacioGondolaFacings: 3,
    stockMinimoGondola: 15,
    stockActualGondola: 8,
    stockDepositoTrastienda: 50,
    pasilloGondola: 'Módulo OTC - Alivio del Dolor',
    posicionEstante: 'Estante 3',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-21'
  },
  {
    id: 'ppdv-5',
    productoId: 'prod-6',
    productoNombre: 'Crema Dental Colgate Total 12 Clean Mint 90g',
    productoSku: 'PER-COLG-01',
    puntoVentaId: 'pdv-2',
    puntoVentaNombre: 'Farmatodo Paseo La Galería',
    precioVentaLocal: 15200,
    espacioGondolaFacings: 4,
    stockMinimoGondola: 18,
    stockActualGondola: 16,
    stockDepositoTrastienda: 60,
    pasilloGondola: 'Góndola Cuidado Bucal',
    posicionEstante: 'Estante 2',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-23'
  },
  {
    id: 'ppdv-6',
    productoId: 'prod-7',
    productoNombre: 'Galletitas Rellenas Chocolinas 250g Arcor',
    productoSku: 'SNA-GAL-01',
    puntoVentaId: 'pdv-3',
    puntoVentaNombre: 'Despensa & Minimarket San Cayetano',
    precioVentaLocal: 10500,
    espacioGondolaFacings: 3,
    stockMinimoGondola: 12,
    stockActualGondola: 2, // Crítico
    stockDepositoTrastienda: 0, // Quiebre de trastienda
    pasilloGondola: 'Mostrador Principal',
    posicionEstante: 'Estante Frontal',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-19'
  },
  {
    id: 'ppdv-7',
    productoId: 'prod-8',
    productoNombre: 'Jabón Líquido para Ropa Omo Concentrado 3L',
    productoSku: 'LIM-JAB-01',
    puntoVentaId: 'pdv-4',
    puntoVentaNombre: 'Mayorista Makro Abasto Norte',
    precioVentaLocal: 45000,
    espacioGondolaFacings: 12,
    stockMinimoGondola: 50,
    stockActualGondola: 48,
    stockDepositoTrastienda: 600,
    pasilloGondola: 'Rack Industrial 12',
    posicionEstante: 'Pallet en Suelo',
    estado: 'Activo',
    ultimaReposicionFecha: '2026-10-23'
  }
];

export const INITIAL_LOTES: LoteVencimiento[] = [
  {
    id: 'lot-1',
    numeroLote: 'L-202610-YOG',
    productoId: 'prod-2',
    productoNombre: 'Yogur Frutilla Sache 1L Los Robles',
    sku: 'LAC-YOG-02',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    fechaFabricacion: '2026-09-25',
    fechaVencimiento: '2026-10-30', // vence en 7 días
    cantidadDisponible: 14,
    ubicacion: 'Góndola',
    estadoLote: 'Crítico (<7d)',
    accionSugerida: 'Rotación FEFO',
    observaciones: 'Mover al frente de la bandeja refrigerada, rotar con lote nuevo.'
  },
  {
    id: 'lot-2',
    numeroLote: 'L-202611-LECH',
    productoId: 'prod-1',
    productoNombre: 'Leche Entera UHT 1L Lácteos Los Robles',
    sku: 'LAC-LECH-01',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    fechaFabricacion: '2026-05-10',
    fechaVencimiento: '2026-11-10', // vence en 18 días
    cantidadDisponible: 38,
    ubicacion: 'Trastienda / Depósito',
    estadoLote: 'Por Vencer (<30d)',
    accionSugerida: 'Alerta Descuento',
    observaciones: 'Priorizar para reposición inmediata en salón de ventas.'
  },
  {
    id: 'lot-3',
    numeroLote: 'L-202705-COCA',
    productoId: 'prod-3',
    productoNombre: 'Coca-Cola Original Botella 2L Descartable',
    sku: 'BEB-COCA-01',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    fechaFabricacion: '2026-08-15',
    fechaVencimiento: '2027-05-15',
    cantidadDisponible: 120,
    ubicacion: 'Trastienda / Depósito',
    estadoLote: 'Vigente',
    accionSugerida: 'Rotación FEFO',
    observaciones: 'Lote en óptimas condiciones de frescura.'
  },
  {
    id: 'lot-4',
    numeroLote: 'L-202610-ASPI',
    productoId: 'prod-5',
    productoNombre: 'Aspirina 500mg Bayer Caja x20 Comprimidos',
    sku: 'OTC-ASPI-01',
    puntoVentaId: 'pdv-2',
    puntoVentaNombre: 'Farmatodo Paseo La Galería',
    fechaFabricacion: '2024-10-15',
    fechaVencimiento: '2026-10-20', // ya vencido hace 3 días
    cantidadDisponible: 6,
    ubicacion: 'Trastienda / Depósito',
    estadoLote: 'Vencido',
    accionSugerida: 'Devolución Proveedor',
    observaciones: 'Retirado de exhibición. Generar acta de devolución a Bayer.'
  },
  {
    id: 'lot-5',
    numeroLote: 'L-202703-OMO',
    productoId: 'prod-8',
    productoNombre: 'Jabón Líquido para Ropa Omo Concentrado 3L',
    sku: 'LIM-JAB-01',
    puntoVentaId: 'pdv-4',
    puntoVentaNombre: 'Mayorista Makro Abasto Norte',
    fechaFabricacion: '2026-09-01',
    fechaVencimiento: '2028-03-01',
    cantidadDisponible: 450,
    ubicacion: 'Trastienda / Depósito',
    estadoLote: 'Vigente',
    accionSugerida: 'Rotación FEFO',
    observaciones: 'Pallet completo en rack número 12.'
  }
];

export const INITIAL_RUTAS: PlanificacionRuta[] = [
  {
    id: 'rut-1',
    codigoRuta: 'RUT-CEN-01',
    nombre: 'Circuito Asunción Centro & Eje Corporativo',
    repositorId: 'rep-1',
    repositorNombre: 'Carlos Benítez Galeano',
    diaSemana: 'Lunes',
    fechaProgramada: '2026-10-26',
    zona: 'Zona Centro / Asunción',
    horaInicioEstimada: '06:30',
    horaFinEstimada: '15:30',
    estado: 'Planificada',
    paradas: [
      {
        id: 'par-1',
        ordenSecuencia: 1,
        puntoVentaId: 'pdv-1',
        puntoVentaNombre: 'Superseis Los Laureles',
        direccion: 'Avda. Boggiani c/ R.I. 6 Boquerón',
        horaEstimadaLlegada: '06:45',
        duracionEstimadaMinutos: 150,
        prioridadVisita: 'Alta',
        completada: false
      },
      {
        id: 'par-2',
        ordenSecuencia: 2,
        puntoVentaId: 'pdv-5',
        puntoVentaNombre: 'Tienda Express Petrobras San Martín',
        direccion: 'Avda. San Martín esq. Austria',
        horaEstimadaLlegada: '10:00',
        duracionEstimadaMinutos: 60,
        prioridadVisita: 'Media',
        completada: false
      },
      {
        id: 'par-3',
        ordenSecuencia: 3,
        puntoVentaId: 'pdv-3',
        puntoVentaNombre: 'Despensa & Minimarket San Cayetano',
        direccion: 'Calle Palma 845 c/ Colón',
        horaEstimadaLlegada: '11:45',
        duracionEstimadaMinutos: 75,
        prioridadVisita: 'Alta',
        completada: false
      }
    ],
    observaciones: 'Priorizar reposición de lácteos por alta demanda de fin de mes.'
  },
  {
    id: 'rut-2',
    codigoRuta: 'RUT-FAR-02',
    nombre: 'Circuito Farmacias & Centros Comerciales',
    repositorId: 'rep-4',
    repositorNombre: 'Andrea López Vera',
    diaSemana: 'Martes',
    fechaProgramada: '2026-10-27',
    zona: 'Canal Farmacias y Especiales',
    horaInicioEstimada: '08:00',
    horaFinEstimada: '16:00',
    estado: 'Planificada',
    paradas: [
      {
        id: 'par-4',
        ordenSecuencia: 1,
        puntoVentaId: 'pdv-2',
        puntoVentaNombre: 'Farmatodo Paseo La Galería',
        direccion: 'Avda. Santa Teresa e/ Aviadores del Chaco',
        horaEstimadaLlegada: '08:15',
        duracionEstimadaMinutos: 120,
        prioridadVisita: 'Urgente',
        completada: false
      }
    ],
    observaciones: 'Auditar lote vencido de analgésicos y verificar flejes de precios.'
  },
  {
    id: 'rut-3',
    codigoRuta: 'RUT-MAY-03',
    nombre: 'Operativo Mayoristas Eje Norte',
    repositorId: 'rep-2',
    repositorNombre: 'María Inés González',
    diaSemana: 'Viernes',
    fechaProgramada: '2026-10-23',
    zona: 'Zona Gran Asunción Norte',
    horaInicioEstimada: '05:30',
    horaFinEstimada: '13:30',
    estado: 'En Curso',
    paradas: [
      {
        id: 'par-5',
        ordenSecuencia: 1,
        puntoVentaId: 'pdv-4',
        puntoVentaNombre: 'Mayorista Makro Abasto Norte',
        direccion: 'Ruta Transchaco Km 14.5',
        horaEstimadaLlegada: '05:45',
        duracionEstimadaMinutos: 240,
        prioridadVisita: 'Alta',
        completada: true
      }
    ],
    observaciones: 'Descarga masiva de pallets de detergentes y bebidas.'
  }
];

export const INITIAL_VISITAS: Visita[] = [
  {
    id: 'vis-1',
    codigoVisita: 'VIS-20261023-01',
    rutaId: 'rut-3',
    repositorId: 'rep-2',
    repositorNombre: 'María Inés González',
    puntoVentaId: 'pdv-4',
    puntoVentaNombre: 'Mayorista Makro Abasto Norte',
    fecha: '2026-10-23',
    horaCheckIn: '05:45',
    horaCheckOut: '09:30',
    duracionMinutos: 225,
    estadoVisita: 'Completada',
    cumplimientoGondolaPct: 96,
    checklist: [
      { criterio: 'Limpieza de góndola y pallets', aprobado: true },
      { criterio: 'Flejes de precios actualizados y legibles', aprobado: true },
      { criterio: 'Rotación FEFO aplicada en estantería', aprobado: true },
      { criterio: 'Material POP y señalética visible', aprobado: true },
      { criterio: 'Sin productos vencidos en exposición', aprobado: true }
    ],
    nombreEncargadoPDV: 'Ing. Rodrigo Almada',
    firmaConformidad: true,
    observacionesGenerales: 'Reposición masiva de detergentes Omo completada. Excelente presentación.'
  },
  {
    id: 'vis-2',
    codigoVisita: 'VIS-20261023-02',
    rutaId: 'rut-1',
    repositorId: 'rep-1',
    repositorNombre: 'Carlos Benítez Galeano',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    fecha: '2026-10-23',
    horaCheckIn: '06:50',
    horaCheckOut: undefined,
    duracionMinutos: 110,
    estadoVisita: 'En Progreso',
    cumplimientoGondolaPct: 82,
    checklist: [
      { criterio: 'Limpieza de góndola y refrigeradores', aprobado: true },
      { criterio: 'Flejes de precios actualizados y legibles', aprobado: false, comentario: 'Fleje de leche Los Robles dañado' },
      { criterio: 'Rotación FEFO aplicada en estantería', aprobado: true },
      { criterio: 'Material POP y señalética visible', aprobado: true },
      { criterio: 'Sin productos vencidos en exposición', aprobado: true }
    ],
    nombreEncargadoPDV: 'Lic. Fernando Vera',
    firmaConformidad: false,
    observacionesGenerales: 'En proceso de reposición de lácteos y bebidas.'
  },
  {
    id: 'vis-3',
    codigoVisita: 'VIS-20261022-03',
    rutaId: 'rut-2',
    repositorId: 'rep-4',
    repositorNombre: 'Andrea López Vera',
    puntoVentaId: 'pdv-2',
    puntoVentaNombre: 'Farmatodo Paseo La Galería',
    fecha: '2026-10-22',
    horaCheckIn: '08:10',
    horaCheckOut: '10:40',
    duracionMinutos: 150,
    estadoVisita: 'Con Incidencias',
    cumplimientoGondolaPct: 75,
    checklist: [
      { criterio: 'Limpieza de góndola y estantes', aprobado: true },
      { criterio: 'Flejes de precios actualizados y legibles', aprobado: true },
      { criterio: 'Rotación FEFO aplicada en estantería', aprobado: true },
      { criterio: 'Material POP y señalética visible', aprobado: false, comentario: 'Falta cenefa Colgate Total 12' },
      { criterio: 'Sin productos vencidos en exposición', aprobado: false, comentario: 'Lote de Aspirinas vencidas retirado' }
    ],
    nombreEncargadoPDV: 'Dra. Gabriela Solís',
    firmaConformidad: true,
    observacionesGenerales: 'Se detectó lote caducado en depósito y falta de facings autorizados.'
  }
];

export const INITIAL_REPOSICIONES: ReposicionRegistro[] = [
  {
    id: 'rep-reg-1',
    codigoRegistro: 'REP-20261023-01',
    visitaId: 'vis-1',
    puntoVentaId: 'pdv-4',
    puntoVentaNombre: 'Mayorista Makro Abasto Norte',
    repositorId: 'rep-2',
    repositorNombre: 'María Inés González',
    fecha: '2026-10-23',
    hora: '08:30',
    totalUnidadesRepuestas: 72,
    quiebresDetectados: 0,
    observaciones: 'Se llenó la cabecera completa con pallets de Omo 3L.',
    items: [
      {
        id: 'ri-1',
        productoId: 'prod-8',
        productoNombre: 'Jabón Líquido para Ropa Omo Concentrado 3L',
        sku: 'LIM-JAB-01',
        stockInicialGondola: 12,
        stockTrastiendaAntes: 520,
        cantidadRepuesta: 72,
        stockFinalGondola: 84,
        facingsResultantes: 12,
        estadoAbastecimiento: 'Abastecido'
      }
    ]
  },
  {
    id: 'rep-reg-2',
    codigoRegistro: 'REP-20261023-02',
    visitaId: 'vis-2',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    repositorId: 'rep-1',
    repositorNombre: 'Carlos Benítez Galeano',
    fecha: '2026-10-23',
    hora: '08:15',
    totalUnidadesRepuestas: 48,
    quiebresDetectados: 1,
    observaciones: 'Quiebre parcial en Leche Entera; se repusieron 36 unidades desde depósito.',
    items: [
      {
        id: 'ri-2',
        productoId: 'prod-1',
        productoNombre: 'Leche Entera UHT 1L Lácteos Los Robles',
        sku: 'LAC-LECH-01',
        stockInicialGondola: 6,
        stockTrastiendaAntes: 80,
        cantidadRepuesta: 36,
        stockFinalGondola: 42,
        facingsResultantes: 6,
        estadoAbastecimiento: 'Abastecido'
      },
      {
        id: 'ri-3',
        productoId: 'prod-2',
        productoNombre: 'Yogur Frutilla Sache 1L Los Robles',
        sku: 'LAC-YOG-02',
        stockInicialGondola: 2,
        stockTrastiendaAntes: 12,
        cantidadRepuesta: 12,
        stockFinalGondola: 14,
        facingsResultantes: 4,
        motivoQuiebre: 'Stock de depósito agotado tras reposición',
        estadoAbastecimiento: 'Quiebre Parcial'
      }
    ]
  }
];

export const INITIAL_PEDIDOS: PedidoProducto[] = [
  {
    id: 'ped-1',
    numeroPedido: 'PED-202610-001',
    fechaPedido: '2026-10-23',
    fechaEntregaRequerida: '2026-10-25',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    repositorSolicitanteId: 'rep-1',
    repositorSolicitanteNombre: 'Carlos Benítez Galeano',
    tipoPedido: 'Reposición Ordinaria',
    estado: 'Solicitado',
    totalBultos: 15,
    montoTotalEstimado: 2450000,
    centroDistribucionDestino: 'CEDI Central Mariano Roque Alonso',
    observaciones: 'Pedido para reponer yogures y leches de cara al fin de semana.',
    items: [
      {
        id: 'pi-1',
        productoId: 'prod-1',
        productoNombre: 'Leche Entera UHT 1L Lácteos Los Robles',
        sku: 'LAC-LECH-01',
        cantidadSugerida: 96,
        cantidadSolicitada: 96,
        unidadMedida: 'un',
        precioUnitarioEstimado: 6500,
        subtotal: 624000,
        motivo: 'Reposición Normal'
      },
      {
        id: 'pi-2',
        productoId: 'prod-2',
        productoNombre: 'Yogur Frutilla Sache 1L Los Robles',
        sku: 'LAC-YOG-02',
        cantidadSugerida: 60,
        cantidadSolicitada: 60,
        unidadMedida: 'un',
        precioUnitarioEstimado: 8200,
        subtotal: 492000,
        motivo: 'Reposición Normal'
      },
      {
        id: 'pi-3',
        productoId: 'prod-3',
        productoNombre: 'Coca-Cola Original Botella 2L Descartable',
        sku: 'BEB-COCA-01',
        cantidadSugerida: 108,
        cantidadSolicitada: 108,
        unidadMedida: 'un',
        precioUnitarioEstimado: 12500,
        subtotal: 1350000,
        motivo: 'Promoción / Oferta'
      }
    ]
  },
  {
    id: 'ped-2',
    numeroPedido: 'PED-202610-002',
    fechaPedido: '2026-10-22',
    fechaEntregaRequerida: '2026-10-24',
    puntoVentaId: 'pdv-3',
    puntoVentaNombre: 'Despensa & Minimarket San Cayetano',
    repositorSolicitanteId: 'rep-1',
    repositorSolicitanteNombre: 'Carlos Benítez Galeano',
    tipoPedido: 'Pedido Urgente Quiebre',
    estado: 'Aprobado',
    totalBultos: 4,
    montoTotalEstimado: 392000,
    centroDistribucionDestino: 'CEDI Central Mariano Roque Alonso',
    observaciones: 'Quiebre total de galletitas Chocolinas en local.',
    items: [
      {
        id: 'pi-4',
        productoId: 'prod-7',
        productoNombre: 'Galletitas Rellenas Chocolinas 250g Arcor',
        sku: 'SNA-GAL-01',
        cantidadSugerida: 40,
        cantidadSolicitada: 40,
        unidadMedida: 'un',
        precioUnitarioEstimado: 9800,
        subtotal: 392000,
        motivo: 'Quiebre Crítico'
      }
    ]
  }
];

export const INITIAL_INCIDENCIAS: Incidencia[] = [
  {
    id: 'inc-1',
    codigo: 'INC-202610-001',
    fecha: '2026-10-23',
    hora: '07:20',
    puntoVentaId: 'pdv-1',
    puntoVentaNombre: 'Superseis Los Laureles',
    repositorId: 'rep-1',
    repositorNombre: 'Carlos Benítez Galeano',
    tipoIncidenteId: 'tipi-4',
    tipoIncidenteNombre: 'Error de Precios / Flejes',
    motivoIncidenciaId: 'mot-4',
    motivoIncidenciaNombre: 'Discrepancia de Precio / Fleje Erróneo',
    prioridad: 'Media',
    productoId: 'prod-1',
    productoNombre: 'Leche Entera UHT 1L Lácteos Los Robles',
    descripcion: 'El fleje electrónico de góndola muestra Gs. 7.500 cuando el precio pactado y catálogo es Gs. 6.900. Clientes reclamaron en caja.',
    estado: 'En Gestión',
    accionCorrectiva: 'Avisado a jefatura de salón para reimpresión y ajuste de fleje en sistema.',
    responsableResolucion: 'Lic. Fernando Vera'
  },
  {
    id: 'inc-2',
    codigo: 'INC-202610-002',
    fecha: '2026-10-22',
    hora: '09:15',
    puntoVentaId: 'pdv-2',
    puntoVentaNombre: 'Farmatodo Paseo La Galería',
    repositorId: 'rep-4',
    repositorNombre: 'Andrea López Vera',
    tipoIncidenteId: 'tipi-2',
    tipoIncidenteNombre: 'Vencimiento Próximo o Caducado',
    motivoIncidenciaId: 'mot-2',
    motivoIncidenciaNombre: 'Producto Vencido / Próximo a Vencer',
    prioridad: 'Urgente',
    productoId: 'prod-5',
    productoNombre: 'Aspirina 500mg Bayer Caja x20 Comprimidos',
    descripcion: 'Se hallaron 6 cajas de Aspirina Bayer con vencimiento 20/10/2026 en trastienda. Retiradas y aisladas en caja de merma.',
    estado: 'Abierta',
    accionCorrectiva: 'Emisión de nota de devolución y nota de crédito al laboratorio.',
    responsableResolucion: 'Dra. Gabriela Solís'
  },
  {
    id: 'inc-3',
    codigo: 'INC-202610-003',
    fecha: '2026-10-21',
    hora: '14:40',
    puntoVentaId: 'pdv-3',
    puntoVentaNombre: 'Despensa & Minimarket San Cayetano',
    repositorId: 'rep-1',
    repositorNombre: 'Carlos Benítez Galeano',
    tipoIncidenteId: 'tipi-1',
    tipoIncidenteNombre: 'Quiebre de Góndola',
    motivoIncidenciaId: 'mot-1',
    motivoIncidenciaNombre: 'Falta de Stock en Góndola (Quiebre)',
    prioridad: 'Alta',
    productoId: 'prod-7',
    productoNombre: 'Galletitas Rellenas Chocolinas 250g Arcor',
    descripcion: 'Góndola vacía sin stock en depósito del cliente. Se generó pedido de emergencia PED-202610-002.',
    estado: 'Resuelta',
    accionCorrectiva: 'Pedido urgente aprobado y en tránsito para entrega 24-Oct.',
    fechaResolucion: '2026-10-22',
    responsableResolucion: 'Carlos Benítez Galeano'
  }
];

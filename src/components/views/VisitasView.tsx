import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DollarSign,
  Edit2,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  Tag,
  Trash2,
  User,
  X
} from 'lucide-react';
import {
  listReferenciales,
  type ReferencialRow
} from '../../services/referencialesService';
import {
  listPuntosVenta,
  listRepositores,
  type PuntoVentaRow,
  type RepositorRow
} from '../../services/personalPdvService';
import {
  listProductos,
  type ProductoRow
} from '../../services/productosService';
import {
  createVisita,
  createVisitaDetalle,
  deleteVisita,
  deleteVisitaDetalle,
  listRutaDetalleOptions,
  listVisitaDetalle,
  listVisitas,
  updateVisita,
  updateVisitaDetalle,
  type RutaDetalleOption,
  type VisitaDetalleInput,
  type VisitaDetalleRow,
  type VisitaInput,
  type VisitaRow
} from '../../services/visitasService';

type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';

type DynamicOptionsKey = 'repositores' | 'puntosVenta' | 'estadosVisita' | 'productos' | 'rutas';

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  rows?: number;
  options?: FieldOption[];
  dynamicOptions?: DynamicOptionsKey;
  allowEmpty?: boolean;
  emptyLabel?: string;
  defaultValue?: string;
  span?: 1 | 2;
}

const BOOLEAN_OPTIONS: FieldOption[] = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Sí' }
];

const VISIT_FIELDS: FormField[] = [
  {
    key: 'fecha_visita',
    label: 'Fecha de Visita',
    type: 'date',
    required: true
  },
  {
    key: 'id_repositor',
    label: 'Repositor',
    type: 'select',
    required: true,
    dynamicOptions: 'repositores'
  },
  {
    key: 'id_punto_venta',
    label: 'Punto de Venta',
    type: 'select',
    required: true,
    dynamicOptions: 'puntosVenta'
  },
  {
    key: 'id_ruta_detalle',
    label: 'Parada de Ruta',
    type: 'select',
    dynamicOptions: 'rutas',
    allowEmpty: true,
    emptyLabel: 'Sin ruta asociada'
  },
  {
    key: 'hora_llegada',
    label: 'Hora de Llegada',
    type: 'datetime-local'
  },
  {
    key: 'hora_salida',
    label: 'Hora de Salida',
    type: 'datetime-local'
  },
  {
    key: 'id_estado',
    label: 'Estado',
    type: 'select',
    required: true,
    dynamicOptions: 'estadosVisita'
  },
  {
    key: 'latitud_registro',
    label: 'Latitud',
    type: 'number',
    min: -90,
    max: 90,
    step: '0.0000001',
    placeholder: 'Ej: -25.2861000'
  },
  {
    key: 'longitud_registro',
    label: 'Longitud',
    type: 'number',
    min: -180,
    max: 180,
    step: '0.0000001',
    placeholder: 'Ej: -57.6470000'
  },
  {
    key: 'observacion',
    label: 'Observación',
    type: 'textarea',
    rows: 3,
    maxLength: 2000,
    placeholder: 'Novedades de la visita, consignas o comentarios generales...',
    span: 2
  }
];

const DETAIL_FIELDS: FormField[] = [
  {
    key: 'id_producto',
    label: 'Producto',
    type: 'select',
    required: true,
    dynamicOptions: 'productos'
  },
  {
    key: 'fecha_vencimiento_mas_proxima',
    label: 'Vencimiento más Próximo',
    type: 'date'
  },
  {
    key: 'stock_gondola',
    label: 'Stock en Góndola',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'stock_deposito',
    label: 'Stock en Depósito',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'cantidad_danada',
    label: 'Cantidad Dañada',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'precio_cartel',
    label: 'Precio de Cartel',
    type: 'number',
    min: 0,
    step: '0.01',
    placeholder: 'Precio exhibido en góndola'
  },
  {
    key: 'precio_esperado',
    label: 'Precio Esperado',
    type: 'number',
    min: 0,
    step: '0.01',
    placeholder: 'Precio según lista'
  },
  {
    key: 'requiere_reposicion',
    label: 'Requiere Reposición',
    type: 'select',
    options: BOOLEAN_OPTIONS,
    defaultValue: '0'
  },
  {
    key: 'requiere_cambio_precio',
    label: 'Requiere Cambio de Precio',
    type: 'select',
    options: BOOLEAN_OPTIONS,
    defaultValue: '0'
  },
  {
    key: 'observacion',
    label: 'Observación del Producto',
    type: 'textarea',
    rows: 3,
    maxLength: 500,
    placeholder: 'Detalle de la auditoría, faltante, daño o diferencia de precio...',
    span: 2
  }
];

const pad = (value: number): string => String(value).padStart(2, '0');

const localDateInput = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const localDateTimeInput = (date: Date = new Date()): string => {
  return `${localDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 10);
};

const toDateTimeInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(' ', 'T').slice(0, 16);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const normalized = String(value).replace('T', ' ');
  const datePart = normalized.slice(0, 10);
  const timePart = normalized.slice(11, 16);
  return timePart ? `${formatDate(datePart)} ${timePart}` : formatDate(datePart);
};

const formatTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const normalized = String(value).replace('T', ' ');
  return normalized.slice(11, 16) || '—';
};

const formatQty = (value: unknown): string => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString('es-PY', { maximumFractionDigits: 3 });
};

const formatMoney = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `Gs. ${number.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

const formatDuration = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder} min`;
  return `${hours} h ${remainder} min`;
};

const visitDurationMinutes = (visit: VisitaRow): number | null => {
  if (!visit.hora_llegada || !visit.hora_salida) return null;
  const arrival = new Date(String(visit.hora_llegada).replace(' ', 'T'));
  const departure = new Date(String(visit.hora_salida).replace(' ', 'T'));
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return null;
  return Math.max(0, Math.round((departure.getTime() - arrival.getTime()) / 60000));
};

const statusBadgeClass = (status: string | null | undefined): string => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'en curso') return 'bg-blue-100 text-blue-800';
  if (normalized === 'completada') return 'bg-emerald-100 text-emerald-800';
  if (normalized === 'no realizada') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

const getVisitTitle = (visit: VisitaRow): string => {
  return visit.punto_venta_nombre || `Visita #${visit.id_visita}`;
};

export const VisitasView: React.FC = () => {
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [detalles, setDetalles] = useState<VisitaDetalleRow[]>([]);
  const [repositores, setRepositores] = useState<RepositorRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);
  const [estadosVisita, setEstadosVisita] = useState<ReferencialRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [rutaOptions, setRutaOptions] = useState<RutaDetalleOption[]>([]);

  const [selectedVisitaId, setSelectedVisitaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [detailReloadToken, setDetailReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [notice, setNotice] = useState<string | null>(null);

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisitaId, setEditingVisitaId] = useState<number | null>(null);
  const [visitFormValues, setVisitFormValues] = useState<Record<string, string>>({});
  const [visitFormError, setVisitFormError] = useState<string | null>(null);
  const [savingVisita, setSavingVisita] = useState(false);
  const [headerBusyAction, setHeaderBusyAction] = useState<'llegada' | 'salida' | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingDetalleId, setEditingDetalleId] = useState<number | null>(null);
  const [detailFormValues, setDetailFormValues] = useState<Record<string, string>>({});
  const [detailFormError, setDetailFormError] = useState<string | null>(null);
  const [savingDetalle, setSavingDetalle] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    Promise.all([
      listVisitas(),
      listRepositores(),
      listPuntosVenta(),
      listReferenciales('estado'),
      listProductos(),
      listRutaDetalleOptions()
    ])
      .then(([visitasData, repositoresData, puntosData, estadosData, productosData, rutasData]) => {
        if (cancelled) return;

        const visitStates = estadosData.filter(
          (row) => String(row.entidad ?? '').toUpperCase() === 'VISITA'
        );

        setVisitas(visitasData);
        setRepositores(repositoresData);
        setPuntosVenta(puntosData);
        setEstadosVisita(visitStates);
        setProductos(productosData);
        setRutaOptions(rutasData);

        setSelectedVisitaId((current) => {
          if (current !== null && visitasData.some((row) => row.id_visita === current)) {
            return current;
          }
          return visitasData[0]?.id_visita ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las visitas.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    setDetalles([]);
  }, [selectedVisitaId]);

  useEffect(() => {
    if (selectedVisitaId === null) {
      setDetalles([]);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let cancelled = false;

    setDetailLoading(true);
    setDetailError(null);

    listVisitaDetalle(selectedVisitaId)
      .then((data) => {
        if (!cancelled) setDetalles(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la visita.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVisitaId, detailReloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedVisita = visitas.find((row) => row.id_visita === selectedVisitaId) ?? null;

  const missingHeaderReferences: string[] = [];
  if (repositores.length === 0) missingHeaderReferences.push('repositores');
  if (puntosVenta.length === 0) missingHeaderReferences.push('puntos de venta');
  if (estadosVisita.length === 0) missingHeaderReferences.push('estados de visita');

  const missingDetailReferences = productos.length === 0 ? ['productos'] : [];

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'repositores':
        return repositores.map((row) => ({
          value: String(row.id_repositor),
          label: `${row.nombres} ${row.apellidos} (${row.documento})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'puntosVenta':
        return puntosVenta.map((row) => ({
          value: String(row.id_punto_venta),
          label: `${row.nombre}${row.ciudad ? ` (${row.ciudad})` : ''}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'estadosVisita':
        return estadosVisita.map((row) => ({
          value: String(row.id_estado),
          label: String(row.descripcion ?? '')
        }));
      case 'productos':
        return productos.map((row) => ({
          value: String(row.id_producto),
          label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'rutas':
        return rutaOptions.map((row) => ({
          value: String(row.id_ruta_detalle),
          label: `Ruta #${row.id_ruta} · ${formatDate(row.ruta_fecha)} · Parada ${row.orden_visita} · ${
            row.punto_venta_nombre ?? 'Punto de venta'
          }`
        }));
      default:
        return [];
    }
  };

  const findEstadoId = (name: string): number | null => {
    const state = estadosVisita.find(
      (row) => String(row.descripcion ?? '').toLowerCase() === name.toLowerCase()
    );
    return state ? Number(state.id_estado) : null;
  };

  const buildVisitCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    VISIT_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    const firstRepositor = repositores[0];
    const firstPuntoVenta = puntosVenta[0];
    const pendingState = findEstadoId('Pendiente') ?? (estadosVisita[0] ? Number(estadosVisita[0].id_estado) : null);

    values.fecha_visita = localDateInput();
    if (firstRepositor) values.id_repositor = String(firstRepositor.id_repositor);
    if (firstPuntoVenta) values.id_punto_venta = String(firstPuntoVenta.id_punto_venta);
    if (pendingState !== null) values.id_estado = String(pendingState);

    return values;
  };

  const buildDetailCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    DETAIL_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    const firstProduct = productos[0];
    if (firstProduct) {
      values.id_producto = String(firstProduct.id_producto);
      values.precio_esperado = String(firstProduct.precio_referencia ?? '');
    }

    return values;
  };

  const handleFieldChange = (
    key: string,
    value: string,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === 'id_ruta_detalle' && value !== '') {
        const option = rutaOptions.find((row) => String(row.id_ruta_detalle) === value);
        if (option) {
          next.id_repositor = String(option.id_repositor);
          next.id_punto_venta = String(option.id_punto_venta);
          next.fecha_visita = option.ruta_fecha;
        }
      }

      if (key === 'id_producto' && value !== '' && !String(current.precio_esperado ?? '').trim()) {
        const product = productos.find((row) => String(row.id_producto) === value);
        if (product) {
          next.precio_esperado = String(product.precio_referencia ?? '');
        }
      }

      return next;
    });
  };

  const openCreateVisit = () => {
    setEditingVisitaId(null);
    setVisitFormValues(buildVisitCreateValues());
    setVisitFormError(null);
    setIsVisitModalOpen(true);
  };

  const openEditVisit = (visit: VisitaRow) => {
    const values: Record<string, string> = {};

    VISIT_FIELDS.forEach((field) => {
      const rawValue = (visit as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'date') {
        values[field.key] = toDateInput(rawValue);
      } else if (field.type === 'datetime-local') {
        values[field.key] = toDateTimeInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingVisitaId(visit.id_visita);
    setVisitFormValues(values);
    setVisitFormError(null);
    setIsVisitModalOpen(true);
  };

  const openCreateDetalle = () => {
    if (!selectedVisita) return;
    setEditingDetalleId(null);
    setDetailFormValues(buildDetailCreateValues());
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const openEditDetalle = (row: VisitaDetalleRow) => {
    const values: Record<string, string> = {};

    DETAIL_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'date') {
        values[field.key] = toDateInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingDetalleId(row.id_visita_detalle);
    setDetailFormValues(values);
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const handleVisitSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setVisitFormError(null);

    if (missingHeaderReferences.length > 0) {
      setVisitFormError('Faltan repositores, puntos de venta o estados de visita para guardar.');
      return;
    }

    const payload: Record<string, string | null> = {};

    for (const field of VISIT_FIELDS) {
      const rawValue = (visitFormValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setVisitFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of VISIT_FIELDS) {
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setVisitFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    if (
      payload.hora_llegada !== null &&
      payload.hora_salida !== null &&
      payload.hora_salida <= payload.hora_llegada
    ) {
      setVisitFormError('La hora de salida debe ser posterior a la hora de llegada.');
      return;
    }

    const input: VisitaInput = {
      id_ruta_detalle:
        payload.id_ruta_detalle === null ? null : Number(payload.id_ruta_detalle),
      id_repositor: Number(payload.id_repositor),
      id_punto_venta: Number(payload.id_punto_venta),
      fecha_visita: String(payload.fecha_visita ?? ''),
      hora_llegada: payload.hora_llegada,
      hora_salida: payload.hora_salida,
      id_estado: Number(payload.id_estado),
      observacion: payload.observacion,
      latitud_registro:
        payload.latitud_registro === null ? null : Number(payload.latitud_registro),
      longitud_registro:
        payload.longitud_registro === null ? null : Number(payload.longitud_registro)
    };

    setSavingVisita(true);

    try {
      if (editingVisitaId !== null) {
        await updateVisita(editingVisitaId, input);
        setNotice('Visita actualizada correctamente.');
      } else {
        const newId = await createVisita(input);
        if (newId > 0) setSelectedVisitaId(newId);
        setNotice('Visita registrada correctamente.');
      }

      setIsVisitModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setVisitFormError(error instanceof Error ? error.message : 'No se pudo guardar la visita.');
    } finally {
      setSavingVisita(false);
    }
  };

  const handleDetalleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailFormError(null);

    if (selectedVisitaId === null) {
      setDetailFormError('Seleccione una visita antes de agregar productos.');
      return;
    }
    if (missingDetailReferences.length > 0) {
      setDetailFormError('Debe existir al menos un producto para registrar el detalle.');
      return;
    }

    const payload: Record<string, string | null> = {};

    for (const field of DETAIL_FIELDS) {
      const rawValue = (detailFormValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setDetailFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of DETAIL_FIELDS) {
      if (field.type === 'number' && payload[field.key] !== null) {
        const numeric = Number(payload[field.key]);
        if (!Number.isFinite(numeric)) {
          setDetailFormError(`El campo "${field.label}" debe ser numérico.`);
          return;
        }
        if (numeric < 0) {
          setDetailFormError(`El campo "${field.label}" no puede ser negativo.`);
          return;
        }
      }
    }

    const input: VisitaDetalleInput = {
      id_visita: selectedVisitaId,
      id_producto: Number(payload.id_producto),
      stock_gondola: Number(payload.stock_gondola),
      stock_deposito: Number(payload.stock_deposito),
      cantidad_danada: Number(payload.cantidad_danada),
      precio_cartel: payload.precio_cartel === null ? null : Number(payload.precio_cartel),
      precio_esperado: payload.precio_esperado === null ? null : Number(payload.precio_esperado),
      fecha_vencimiento_mas_proxima: payload.fecha_vencimiento_mas_proxima,
      requiere_reposicion: Number(payload.requiere_reposicion ?? '0'),
      requiere_cambio_precio: Number(payload.requiere_cambio_precio ?? '0'),
      observacion: payload.observacion
    };

    setSavingDetalle(true);

    try {
      if (editingDetalleId !== null) {
        await updateVisitaDetalle(editingDetalleId, input);
        setNotice('Producto de la visita actualizado correctamente.');
      } else {
        await createVisitaDetalle(input);
        setNotice('Producto agregado a la visita correctamente.');
      }

      setIsDetailModalOpen(false);
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailFormError(error instanceof Error ? error.message : 'No se pudo guardar el producto de la visita.');
    } finally {
      setSavingDetalle(false);
    }
  };

  const handleDeleteVisit = async (visit: VisitaRow) => {
    if (
      !window.confirm(
        `¿Eliminar la visita de "${getVisitTitle(visit)}" del ${formatDate(visit.fecha_visita)} y todo su detalle?`
      )
    ) {
      return;
    }

    setNotice(null);
    setLoadError(null);

    try {
      await deleteVisita(visit.id_visita);
      setSelectedVisitaId(null);
      setDetalles([]);
      setNotice('Visita eliminada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar la visita.');
    }
  };

  const handleDeleteDetalle = async (row: VisitaDetalleRow) => {
    if (
      !window.confirm(
        `¿Eliminar el producto "${row.producto_descripcion ?? 'seleccionado'}" del detalle de la visita?`
      )
    ) {
      return;
    }

    setNotice(null);
    setDetailError(null);

    try {
      await deleteVisitaDetalle(row.id_visita_detalle);
      setNotice('Producto eliminado del detalle correctamente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    }
  };

  const handleQuickArrival = async () => {
    if (!selectedVisita || headerBusyAction !== null) return;

    const now = localDateTimeInput();
    const inProgressId = findEstadoId('En curso');
    const currentStateName = String(selectedVisita.estado_nombre ?? '').toLowerCase();
    const payload: Partial<VisitaInput> = { hora_llegada: now };

    if (inProgressId !== null && currentStateName === 'pendiente') {
      payload.id_estado = inProgressId;
    }

    setHeaderBusyAction('llegada');
    setLoadError(null);

    try {
      await updateVisita(selectedVisita.id_visita, payload);
      setNotice('Llegada registrada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo registrar la llegada.');
    } finally {
      setHeaderBusyAction(null);
    }
  };

  const handleQuickDeparture = async () => {
    if (!selectedVisita || headerBusyAction !== null) return;

    const departure = new Date();
    if (selectedVisita.hora_llegada) {
      const arrival = new Date(String(selectedVisita.hora_llegada).replace(' ', 'T'));
      const minimumDeparture = arrival.getTime() + 60000;
      if (!Number.isNaN(arrival.getTime()) && departure.getTime() <= minimumDeparture) {
        departure.setTime(minimumDeparture);
      }
    }

    const completedId = findEstadoId('Completada');
    const payload: Partial<VisitaInput> = { hora_salida: localDateTimeInput(departure) };

    if (completedId !== null) {
      payload.id_estado = completedId;
    }

    setHeaderBusyAction('salida');
    setLoadError(null);

    try {
      await updateVisita(selectedVisita.id_visita, payload);
      setNotice('Salida registrada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo registrar la salida.');
    } finally {
      setHeaderBusyAction(null);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredVisitas = visitas.filter((visit) => {
    if (statusFilter !== 'todos' && String(visit.id_estado) !== statusFilter) return false;
    if (normalizedQuery === '') return true;

    return [
      visit.punto_venta_nombre,
      visit.repositor_nombre,
      visit.estado_nombre,
      visit.fecha_visita,
      visit.observacion,
      visit.ruta_descripcion
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  const totalProductos = detalles.length;
  const productosReposicion = detalles.filter((row) => Number(row.requiere_reposicion) === 1).length;
  const productosCambioPrecio = detalles.filter((row) => Number(row.requiere_cambio_precio) === 1).length;
  const totalDanada = detalles.reduce((sum, row) => sum + Number(row.cantidad_danada), 0);
  const selectedDuration = selectedVisita ? visitDurationMinutes(selectedVisita) : null;

  const renderFormFields = (
    fields: FormField[],
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((field) => {
        const options = field.dynamicOptions
          ? getDynamicOptions(field.dynamicOptions)
          : field.options ?? [];

        return (
          <div key={field.key} className={field.span === 2 ? 'sm:col-span-2' : undefined}>
            <label className="block font-medium text-slate-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>

            {field.type === 'select' ? (
              <select
                required={field.required}
                value={values[field.key] ?? ''}
                onChange={(event) => handleFieldChange(field.key, event.target.value, setValues)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {field.allowEmpty && (
                  <option value="">{field.emptyLabel ?? 'Ninguno'}</option>
                )}
                {field.required && (
                  <option value="" disabled>
                    Seleccione...
                  </option>
                )}
                {options.length === 0 && field.required && (
                  <option value="" disabled>
                    No hay opciones disponibles
                  </option>
                )}
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                rows={field.rows ?? 3}
                required={field.required}
                maxLength={field.maxLength}
                value={values[field.key] ?? ''}
                onChange={(event) => handleFieldChange(field.key, event.target.value, setValues)}
                placeholder={field.placeholder}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            ) : (
              <input
                type={field.type}
                required={field.required}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={field.maxLength}
                value={values[field.key] ?? ''}
                onChange={(event) => handleFieldChange(field.key, event.target.value, setValues)}
                placeholder={field.placeholder}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-slate-500" />
            Registro y Auditoría de Visitas en Punto de Venta
          </h2>
          <p className="text-xs text-slate-500">
            Cabecera de visita, control de llegada/salida y auditoría de productos, precios y vencimientos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadToken((token) => token + 1)}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateVisit}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Visita</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{loadError}</p>
            <button
              onClick={() => setReloadToken((token) => token + 1)}
              className="mt-1 font-semibold underline underline-offset-2 hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar visita, local, repositor..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="todos">Todos los estados</option>
              {estadosVisita.map((row) => (
                <option key={String(row.id_estado)} value={String(row.id_estado)}>
                  {String(row.descripcion ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Visitas ({filteredVisitas.length}/{visitas.length})
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando visitas...
                </span>
              </div>
            ) : filteredVisitas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                {visitas.length === 0
                  ? 'No hay visitas registradas.'
                  : 'No se encontraron visitas para el criterio de búsqueda.'}
              </div>
            ) : (
              filteredVisitas.map((visit) => (
                <button
                  key={visit.id_visita}
                  type="button"
                  onClick={() => setSelectedVisitaId(visit.id_visita)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedVisitaId === visit.id_visita
                      ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      VISITA #{visit.id_visita}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(
                        visit.estado_nombre
                      )}`}
                    >
                      {visit.estado_nombre || '—'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {getVisitTitle(visit)}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(visit.fecha_visita)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(visit.hora_llegada)} - {formatTime(visit.hora_salida)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{visit.repositor_nombre || 'Sin repositor'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>{Number(visit.total_productos ?? 0)} productos</span>
                    <span>{Number(visit.productos_reposicion ?? 0)} reponer</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedVisita ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      VISITA #{selectedVisita.id_visita}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(
                        selectedVisita.estado_nombre
                      )}`}
                    >
                      {selectedVisita.estado_nombre || '—'}
                    </span>
                    {selectedDuration !== null && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                        {formatDuration(selectedDuration)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {getVisitTitle(selectedVisita)}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVisita.repositor_nombre || 'Sin repositor'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(selectedVisita.fecha_visita)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Llegada: {formatDateTime(selectedVisita.hora_llegada)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Salida: {formatDateTime(selectedVisita.hora_salida)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVisita.punto_venta_direccion || 'Sin dirección'}
                      {selectedVisita.punto_venta_ciudad ? ` · ${selectedVisita.punto_venta_ciudad}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVisita.id_ruta
                        ? `Ruta #${selectedVisita.id_ruta} · ${formatDate(selectedVisita.ruta_fecha)}`
                        : 'Visita directa'}
                    </span>
                  </div>

                  {selectedVisita.observacion && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      {selectedVisita.observacion}
                    </p>
                  )}

                  {(selectedVisita.latitud_registro !== null ||
                    selectedVisita.longitud_registro !== null) && (
                    <p className="mt-1.5 text-[11px] text-slate-400 font-mono inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {Number(selectedVisita.latitud_registro ?? 0).toFixed(7)},{' '}
                      {Number(selectedVisita.longitud_registro ?? 0).toFixed(7)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!selectedVisita.hora_llegada && (
                    <button
                      onClick={handleQuickArrival}
                      disabled={headerBusyAction !== null}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {headerBusyAction === 'llegada' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>Registrar Llegada</span>
                    </button>
                  )}
                  {selectedVisita.hora_llegada && !selectedVisita.hora_salida && (
                    <button
                      onClick={handleQuickDeparture}
                      disabled={headerBusyAction !== null}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {headerBusyAction === 'salida' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>Registrar Salida</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditVisit(selectedVisita)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Visita</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVisit(selectedVisita)}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Visita</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Productos</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{totalProductos}</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-amber-600">Reposición</div>
                  <div className="text-lg font-bold text-amber-800 tabular-nums">{productosReposicion}</div>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-sky-600">Cambio precio</div>
                  <div className="text-lg font-bold text-sky-800 tabular-nums">{productosCambioPrecio}</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-red-600">Unidades dañadas</div>
                  <div className="text-lg font-bold text-red-800 tabular-nums">{formatQty(totalDanada)}</div>
                </div>
              </div>

              {detailError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{detailError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Detalle de Productos Auditados
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stock, daños, precios y vencimiento detectados durante la visita.
                    </p>
                  </div>

                  <button
                    onClick={openCreateDetalle}
                    disabled={detailLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Producto</span>
                  </button>
                </div>

                {detailLoading ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando productos...
                    </span>
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Esta visita no tiene productos auditados. Haz clic en "Agregar Producto" para registrar el detalle.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalles.map((row) => {
                      const lowStock =
                        Number(row.stock_gondola) < Number(row.producto_stock_minimo ?? 0);
                      const damaged = Number(row.cantidad_danada) > 0;

                      return (
                        <div
                          key={row.id_visita_detalle}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate">
                                  {row.producto_descripcion || 'Producto'}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {row.producto_codigo || '—'}
                                </p>
                                {row.observacion && (
                                  <p className="text-[11px] text-slate-500 mt-1">{row.observacion}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditDetalle(row)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                title="Editar producto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDetalle(row)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className={`rounded-lg px-2.5 py-1.5 ${lowStock ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'}`}>
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Góndola</span>
                              <span className="font-mono font-semibold">{formatQty(row.stock_gondola)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Depósito</span>
                              <span className="font-mono font-semibold">{formatQty(row.stock_deposito)}</span>
                            </div>
                            <div className={`rounded-lg px-2.5 py-1.5 ${damaged ? 'bg-red-50 text-red-800' : 'bg-slate-50 text-slate-600'}`}>
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Dañada</span>
                              <span className="font-mono font-semibold">{formatQty(row.cantidad_danada)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Vence</span>
                              <span className="font-semibold">{formatDate(row.fecha_vencimiento_mas_proxima)}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              Cartel: <strong>{formatMoney(row.precio_cartel)}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              Esperado: <strong>{formatMoney(row.precio_esperado)}</strong>
                            </span>
                            {lowStock && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                Bajo mínimo
                              </span>
                            )}
                            {Number(row.requiere_reposicion) === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                                Reposición
                              </span>
                            )}
                            {Number(row.requiere_cambio_precio) === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                                Cambio de precio
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-400">
              <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Selecciona o crea una visita para visualizar su cabecera y productos auditados.</p>
            </div>
          )}
        </div>
      </div>

      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingVisitaId !== null ? 'Editar Visita' : 'Registrar Nueva Visita'}
              </h3>
              <button
                onClick={() => setIsVisitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleVisitSubmit}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {missingHeaderReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Debe existir al menos un repositor, un punto de venta y un estado de visita.
                  </span>
                </div>
              )}

              {renderFormFields(VISIT_FIELDS, visitFormValues, setVisitFormValues)}

              {visitFormError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{visitFormError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  disabled={savingVisita}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVisita || missingHeaderReferences.length > 0}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingVisita && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingVisita ? 'Guardando...' : 'Guardar Visita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDetalleId !== null ? 'Editar Producto de Visita' : 'Agregar Producto a Visita'}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleDetalleSubmit}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {missingDetailReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Debe existir al menos un producto para guardar el detalle.</span>
                </div>
              )}

              {renderFormFields(DETAIL_FIELDS, detailFormValues, setDetailFormValues)}

              {detailFormError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{detailFormError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  disabled={savingDetalle}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDetalle || missingDetailReferences.length > 0}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingDetalle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingDetalle ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

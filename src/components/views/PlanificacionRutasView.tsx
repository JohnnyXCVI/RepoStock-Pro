import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Flag,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
  Store,
  Timer,
  Trash2,
  Users,
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
  createRuta,
  createRutaDetalle,
  deleteRuta,
  deleteRutaDetalle,
  listRutaDetalle,
  listRutas,
  updateRuta,
  updateRutaDetalle,
  type RutaDetalleInput,
  type RutaDetalleRow,
  type RutaInput,
  type RutaRow
} from '../../services/rutasService';

type FieldType = 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';

type DynamicOptionsKey = 'repositores' | 'estadosRuta' | 'puntosVenta' | 'prioridades';

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
  defaultValue?: string;
  span?: 1 | 2;
}

const VISITADO_OPTIONS: FieldOption[] = [
  { value: '0', label: 'Pendiente' },
  { value: '1', label: 'Visitado' }
];

const ROUTE_FIELDS: FormField[] = [
  {
    key: 'fecha',
    label: 'Fecha',
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
    key: 'hora_inicio_plan',
    label: 'Hora de Inicio',
    type: 'time',
    required: true
  },
  {
    key: 'hora_fin_plan',
    label: 'Hora de Fin',
    type: 'time',
    required: true
  },
  {
    key: 'descripcion',
    label: 'Descripción de la Ruta',
    type: 'text',
    maxLength: 200,
    placeholder: 'Ej: Circuito Mayoristas o Eje Supermercados...',
    span: 2
  },
  {
    key: 'id_estado',
    label: 'Estado',
    type: 'select',
    required: true,
    dynamicOptions: 'estadosRuta'
  },
  {
    key: 'observacion',
    label: 'Observación',
    type: 'textarea',
    rows: 3,
    placeholder: 'Prioridades especiales, consignas o indicaciones para el repositor...',
    span: 2
  }
];

const DETAIL_FIELDS: FormField[] = [
  {
    key: 'id_punto_venta',
    label: 'Punto de Venta',
    type: 'select',
    required: true,
    dynamicOptions: 'puntosVenta'
  },
  {
    key: 'orden_visita',
    label: 'Orden de Visita',
    type: 'number',
    required: true,
    min: 1,
    step: '1',
    defaultValue: '1'
  },
  {
    key: 'id_prioridad',
    label: 'Prioridad',
    type: 'select',
    required: true,
    dynamicOptions: 'prioridades'
  },
  {
    key: 'hora_estimada_llegada',
    label: 'Hora Estimada de Llegada',
    type: 'time'
  },
  {
    key: 'minutos_estimados',
    label: 'Minutos en PDV',
    type: 'number',
    required: true,
    min: 0,
    step: '1',
    defaultValue: '30'
  },
  {
    key: 'minutos_traslado_estimados',
    label: 'Minutos de Traslado',
    type: 'number',
    required: true,
    min: 0,
    step: '1',
    defaultValue: '0'
  },
  {
    key: 'motivo_visita',
    label: 'Motivo de Visita',
    type: 'text',
    maxLength: 200,
    placeholder: 'Ej: Reposición de góndola / control de vencimientos...',
    span: 2
  },
  {
    key: 'visitado',
    label: 'Estado de Visita',
    type: 'select',
    options: VISITADO_OPTIONS,
    defaultValue: '0'
  }
];

const getDateInput = (date: Date = new Date()): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getTodayInput = (): string => getDateInput();

const toDateInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 10);
};

const toTimeInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 5);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
};

const formatTime = (value: string | null | undefined): string => {
  const time = toTimeInput(value);
  return time || '—';
};

const formatTimeRange = (start: string, end: string): string => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const normalized = String(value).replace('T', ' ');
  const datePart = normalized.slice(0, 10);
  const timePart = normalized.slice(11, 16);
  return timePart ? `${formatDate(datePart)} ${timePart}` : formatDate(datePart);
};

const formatMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder} min`;
  return `${hours} h ${remainder} min`;
};

const statusBadgeClass = (status: string | null | undefined): string => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'en curso') return 'bg-blue-100 text-blue-800';
  if (normalized === 'completada') return 'bg-emerald-100 text-emerald-800';
  if (normalized === 'parcial') return 'bg-amber-100 text-amber-800';
  if (normalized === 'cancelada') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
};

const priorityBadgeClass = (priority: string | null | undefined): string => {
  const normalized = String(priority ?? '').toLowerCase();
  if (normalized === 'urgente') return 'bg-red-100 text-red-800';
  if (normalized === 'alta') return 'bg-amber-100 text-amber-800';
  if (normalized === 'normal') return 'bg-sky-100 text-sky-800';
  return 'bg-slate-100 text-slate-700';
};

const getRouteTitle = (route: RutaRow): string => {
  return route.descripcion?.trim() || `Ruta del ${formatDate(route.fecha)}`;
};

export const PlanificacionRutasView: React.FC = () => {
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [detalles, setDetalles] = useState<RutaDetalleRow[]>([]);
  const [repositores, setRepositores] = useState<RepositorRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);
  const [estadosRuta, setEstadosRuta] = useState<ReferencialRow[]>([]);
  const [prioridades, setPrioridades] = useState<ReferencialRow[]>([]);

  const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [detailReloadToken, setDetailReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRutaId, setEditingRutaId] = useState<number | null>(null);
  const [routeFormValues, setRouteFormValues] = useState<Record<string, string>>({});
  const [routeFormError, setRouteFormError] = useState<string | null>(null);
  const [savingRuta, setSavingRuta] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingDetalleId, setEditingDetalleId] = useState<number | null>(null);
  const [detailFormValues, setDetailFormValues] = useState<Record<string, string>>({});
  const [detailFormError, setDetailFormError] = useState<string | null>(null);
  const [savingDetalle, setSavingDetalle] = useState(false);
  const [detailBusyId, setDetailBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    Promise.all([
      listRutas(),
      listRepositores(),
      listPuntosVenta(),
      listReferenciales('estado'),
      listReferenciales('prioridad')
    ])
      .then(([rutasData, repositoresData, puntosData, estadosData, prioridadesData]) => {
        if (cancelled) return;

        const routeStates = estadosData.filter(
          (row) => String(row.entidad ?? '').toUpperCase() === 'RUTA'
        );

        setRutas(rutasData);
        setRepositores(repositoresData);
        setPuntosVenta(puntosData);
        setEstadosRuta(routeStates);
        setPrioridades(prioridadesData);

        setSelectedRutaId((current) => {
          if (current !== null && rutasData.some((row) => row.id_ruta === current)) {
            return current;
          }
          return rutasData[0]?.id_ruta ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las rutas.');
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
  }, [selectedRutaId]);

  useEffect(() => {
    if (selectedRutaId === null) {
      setDetalles([]);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let cancelled = false;

    setDetailLoading(true);
    setDetailError(null);

    listRutaDetalle(selectedRutaId)
      .then((data) => {
        if (!cancelled) setDetalles(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : 'No se pudieron cargar las paradas.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRutaId, detailReloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedRuta = rutas.find((row) => row.id_ruta === selectedRutaId) ?? null;

  const missingHeaderReferences: string[] = [];
  if (repositores.length === 0) missingHeaderReferences.push('repositores');
  if (estadosRuta.length === 0) missingHeaderReferences.push('estados de ruta');

  const missingDetailReferences: string[] = [];
  if (puntosVenta.length === 0) missingDetailReferences.push('puntos de venta');
  if (prioridades.length === 0) missingDetailReferences.push('prioridades');

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'repositores':
        return repositores.map((row) => ({
          value: String(row.id_repositor),
          label: `${row.nombres} ${row.apellidos} (${row.documento})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'estadosRuta':
        return estadosRuta.map((row) => ({
          value: String(row.id_estado),
          label: String(row.descripcion ?? '')
        }));
      case 'puntosVenta':
        return puntosVenta.map((row) => ({
          value: String(row.id_punto_venta),
          label: `${row.nombre}${row.ciudad ? ` (${row.ciudad})` : ''}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'prioridades':
        return prioridades.map((row) => ({
          value: String(row.id_prioridad),
          label: `${String(row.descripcion ?? '')}`
        }));
      default:
        return [];
    }
  };

  const buildRouteCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    ROUTE_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    const firstRepositor = repositores[0];
    values.fecha = getTodayInput();
    values.hora_inicio_plan = firstRepositor?.hora_inicio ? toTimeInput(firstRepositor.hora_inicio) : '07:00';
    values.hora_fin_plan = firstRepositor?.hora_fin ? toTimeInput(firstRepositor.hora_fin) : '15:00';

    if (firstRepositor) {
      values.id_repositor = String(firstRepositor.id_repositor);
    }

    const defaultEstado =
      estadosRuta.find((row) => String(row.descripcion).toLowerCase() === 'planificada') ??
      estadosRuta[0];

    if (defaultEstado) {
      values.id_estado = String(defaultEstado.id_estado);
    }

    return values;
  };

  const buildDetalleCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    DETAIL_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    const nextOrder = detalles.reduce(
      (max, row) => Math.max(max, Number(row.orden_visita) || 0),
      0
    ) + 1;

    values.orden_visita = String(nextOrder);
    values.visitado = '0';

    if (puntosVenta[0]) {
      values.id_punto_venta = String(puntosVenta[0].id_punto_venta);
    }

    const defaultPriority =
      prioridades.find((row) => String(row.descripcion).toLowerCase() === 'normal') ??
      prioridades[0];

    if (defaultPriority) {
      values.id_prioridad = String(defaultPriority.id_prioridad);
    }

    return values;
  };

  const openCreateRoute = () => {
    setEditingRutaId(null);
    setRouteFormValues(buildRouteCreateValues());
    setRouteFormError(null);
    setIsRouteModalOpen(true);
  };

  const openEditRoute = (route: RutaRow) => {
    const values: Record<string, string> = {};

    ROUTE_FIELDS.forEach((field) => {
      const rawValue = (route as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'date') {
        values[field.key] = toDateInput(rawValue);
      } else if (field.type === 'time') {
        values[field.key] = toTimeInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingRutaId(route.id_ruta);
    setRouteFormValues(values);
    setRouteFormError(null);
    setIsRouteModalOpen(true);
  };

  const openCreateDetalle = () => {
    if (!selectedRuta) return;
    setEditingDetalleId(null);
    setDetailFormValues(buildDetalleCreateValues());
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const openEditDetalle = (row: RutaDetalleRow) => {
    const values: Record<string, string> = {};

    DETAIL_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'time') {
        values[field.key] = toTimeInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingDetalleId(row.id_ruta_detalle);
    setDetailFormValues(values);
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const handleRouteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRouteFormError(null);

    if (missingHeaderReferences.length > 0) {
      setRouteFormError('Faltan repositores o estados de ruta para guardar la ruta.');
      return;
    }

    const payload: Record<string, string | null> = {};

    for (const field of ROUTE_FIELDS) {
      const rawValue = (routeFormValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setRouteFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of ROUTE_FIELDS) {
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setRouteFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    if (
      payload.hora_inicio_plan !== null &&
      payload.hora_fin_plan !== null &&
      payload.hora_fin_plan <= payload.hora_inicio_plan
    ) {
      setRouteFormError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const input: RutaInput = {
      fecha: String(payload.fecha ?? ''),
      id_repositor: Number(payload.id_repositor),
      hora_inicio_plan: String(payload.hora_inicio_plan ?? ''),
      hora_fin_plan: String(payload.hora_fin_plan ?? ''),
      descripcion: payload.descripcion,
      id_estado: Number(payload.id_estado),
      observacion: payload.observacion
    };

    setSavingRuta(true);

    try {
      if (editingRutaId !== null) {
        await updateRuta(editingRutaId, input);
        setNotice('Ruta actualizada correctamente.');
      } else {
        const newId = await createRuta(input);
        if (newId > 0) setSelectedRutaId(newId);
        setNotice('Ruta creada correctamente.');
      }

      setIsRouteModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setRouteFormError(error instanceof Error ? error.message : 'No se pudo guardar la ruta.');
    } finally {
      setSavingRuta(false);
    }
  };

  const handleDetalleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailFormError(null);

    if (selectedRutaId === null) {
      setDetailFormError('Seleccione una ruta antes de agregar paradas.');
      return;
    }
    if (missingDetailReferences.length > 0) {
      setDetailFormError('Faltan puntos de venta o prioridades para guardar la parada.');
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
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setDetailFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    const input: RutaDetalleInput = {
      id_ruta: selectedRutaId,
      id_punto_venta: Number(payload.id_punto_venta),
      orden_visita: Number(payload.orden_visita),
      id_prioridad: Number(payload.id_prioridad),
      hora_estimada_llegada: payload.hora_estimada_llegada,
      minutos_estimados: Number(payload.minutos_estimados),
      minutos_traslado_estimados: Number(payload.minutos_traslado_estimados),
      motivo_visita: payload.motivo_visita,
      visitado: Number(payload.visitado ?? '0')
    };

    setSavingDetalle(true);

    try {
      if (editingDetalleId !== null) {
        await updateRutaDetalle(editingDetalleId, input);
        setNotice('Parada actualizada correctamente.');
      } else {
        await createRutaDetalle(input);
        setNotice('Parada agregada correctamente.');
      }

      setIsDetailModalOpen(false);
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailFormError(error instanceof Error ? error.message : 'No se pudo guardar la parada.');
    } finally {
      setSavingDetalle(false);
    }
  };

  const handleDeleteRoute = async (route: RutaRow) => {
    if (!window.confirm(`¿Eliminar la ruta "${getRouteTitle(route)}" y todas sus paradas?`)) return;

    setNotice(null);
    setLoadError(null);

    try {
      await deleteRuta(route.id_ruta);
      setSelectedRutaId(null);
      setDetalles([]);
      setNotice('Ruta eliminada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar la ruta.');
    }
  };

  const handleDeleteDetalle = async (row: RutaDetalleRow) => {
    if (!window.confirm(`¿Eliminar la parada de "${row.punto_venta_nombre ?? 'este punto de venta'}"?`)) {
      return;
    }

    setNotice(null);
    setDetailError(null);

    try {
      await deleteRutaDetalle(row.id_ruta_detalle);
      setNotice('Parada eliminada correctamente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar la parada.');
    }
  };

  const handleToggleVisitado = async (row: RutaDetalleRow) => {
    if (detailBusyId !== null) return;

    const nextValue = Number(row.visitado) === 1 ? 0 : 1;
    setDetailBusyId(row.id_ruta_detalle);
    setDetailError(null);

    try {
      await updateRutaDetalle(row.id_ruta_detalle, { visitado: nextValue });
      setNotice(nextValue === 1 ? 'Parada marcada como visitada.' : 'Parada marcada como pendiente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo actualizar la parada.');
    } finally {
      setDetailBusyId(null);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredRutas = rutas.filter((route) => {
    if (normalizedQuery === '') return true;

    return [
      route.descripcion,
      route.repositor_nombre,
      route.estado_nombre,
      route.fecha,
      route.observacion
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  const totalParadas = detalles.length;
  const visitadas = detalles.filter((row) => Number(row.visitado) === 1).length;
  const pendientes = totalParadas - visitadas;
  const totalMinutos = detalles.reduce(
    (sum, row) => sum + Number(row.minutos_estimados) + Number(row.minutos_traslado_estimados),
    0
  );

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
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value
                  }))
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
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
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value
                  }))
                }
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
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value
                  }))
                }
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
            <Route className="w-4 h-4 text-slate-500" />
            Planificación y Despacho de Rutas
          </h2>
          <p className="text-xs text-slate-500">
            Cabecera de ruta y secuencia de visitas por punto de venta, con control de tiempos y prioridades.
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
            onClick={openCreateRoute}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Ruta</span>
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
          <Check className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ruta, repositor o estado..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-slate-50"
              />
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Rutas ({filteredRutas.length}/{rutas.length})
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando rutas...
                </span>
              </div>
            ) : filteredRutas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                {rutas.length === 0
                  ? 'No hay rutas registradas.'
                  : 'No se encontraron rutas para el criterio de búsqueda.'}
              </div>
            ) : (
              filteredRutas.map((route) => (
                <button
                  key={route.id_ruta}
                  type="button"
                  onClick={() => setSelectedRutaId(route.id_ruta)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedRutaId === route.id_ruta
                      ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      RUTA #{route.id_ruta}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(
                        route.estado_nombre
                      )}`}
                    >
                      {route.estado_nombre || '—'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {getRouteTitle(route)}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(route.fecha)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTimeRange(route.hora_inicio_plan, route.hora_fin_plan)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{route.repositor_nombre || 'Sin repositor'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>{Number(route.total_paradas ?? 0)} paradas</span>
                    <span>{Number(route.visitadas ?? 0)} visitadas</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedRuta ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      RUTA #{selectedRuta.id_ruta}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(
                        selectedRuta.estado_nombre
                      )}`}
                    >
                      {selectedRuta.estado_nombre || '—'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {getRouteTitle(selectedRuta)}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {selectedRuta.repositor_nombre || 'Sin repositor'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(selectedRuta.fecha)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTimeRange(selectedRuta.hora_inicio_plan, selectedRuta.hora_fin_plan)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                      Creada: {formatDateTime(selectedRuta.fecha_creacion)}
                    </span>
                  </div>

                  {selectedRuta.observacion && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      {selectedRuta.observacion}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditRoute(selectedRuta)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Ruta</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(selectedRuta)}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Ruta</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Paradas</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{totalParadas}</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600">Visitadas</div>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums">{visitadas}</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-amber-600">Pendientes</div>
                  <div className="text-lg font-bold text-amber-800 tabular-nums">{pendientes}</div>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-sky-600">Tiempo estimado</div>
                  <div className="text-lg font-bold text-sky-800 tabular-nums">{formatMinutes(totalMinutos)}</div>
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
                      Secuencia de Visitas (Paradas)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Orden de recorrido, prioridad y tiempos estimados por punto de venta.
                    </p>
                  </div>

                  <button
                    onClick={openCreateDetalle}
                    disabled={detailLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Parada</span>
                  </button>
                </div>

                {detailLoading ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando paradas...
                    </span>
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Esta ruta no tiene paradas agregadas. Haz clic en "Agregar Parada" para asignar puntos de venta.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalles.map((row) => {
                      const visitado = Number(row.visitado) === 1;
                      const busy = detailBusyId === row.id_ruta_detalle;

                      return (
                        <div
                          key={row.id_ruta_detalle}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            visitado
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                onClick={() => handleToggleVisitado(row)}
                                disabled={busy}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded disabled:opacity-50"
                                title={visitado ? 'Marcar pendiente' : 'Marcar visitado'}
                              >
                                {busy ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                ) : visitado ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300" />
                                )}
                              </button>

                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                                {row.orden_visita}
                              </div>

                              <div className="min-w-0">
                                <h5
                                  className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                                    visitado ? 'text-emerald-900 line-through' : 'text-slate-900'
                                  }`}
                                >
                                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{row.punto_venta_nombre || 'Punto de venta'}</span>
                                </h5>
                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>
                                    {row.punto_venta_direccion || 'Sin dirección'}
                                    {row.punto_venta_ciudad ? ` · ${row.punto_venta_ciudad}` : ''}
                                  </span>
                                </p>
                                {row.motivo_visita && (
                                  <p className="text-[11px] text-slate-500 mt-1">{row.motivo_visita}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditDetalle(row)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                title="Editar parada"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDetalle(row)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar parada"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${priorityBadgeClass(
                                row.prioridad_nombre
                              )}`}
                            >
                              <Flag className="w-3 h-3" />
                              {row.prioridad_nombre || 'Sin prioridad'}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              ETA {formatTime(row.hora_estimada_llegada)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5 text-slate-400" />
                              {row.minutos_estimados} min en PDV
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5 text-slate-400" />
                              {row.minutos_traslado_estimados} min traslado
                            </span>
                            <span
                              className={`ml-auto inline-flex items-center gap-1 font-semibold ${
                                visitado ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {visitado ? 'Visitado' : 'Pendiente'}
                            </span>
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
              <Route className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Selecciona o crea una ruta para visualizar su cabecera y paradas.</p>
            </div>
          )}
        </div>
      </div>

      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRutaId !== null ? 'Editar Ruta' : 'Planificar Nueva Ruta'}
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleRouteSubmit}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {missingHeaderReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Debe existir al menos un repositor y un estado de ruta. Regístrelos en sus módulos
                    correspondientes.
                  </span>
                </div>
              )}

              {renderFormFields(ROUTE_FIELDS, routeFormValues, setRouteFormValues)}

              {routeFormError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{routeFormError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  disabled={savingRuta}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRuta || missingHeaderReferences.length > 0}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingRuta && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingRuta ? 'Guardando...' : 'Guardar Ruta'}
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
                {editingDetalleId !== null ? 'Editar Parada' : 'Agregar Parada'}
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
                  <span>
                    Debe existir al menos un punto de venta y una prioridad para guardar paradas.
                  </span>
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
                  {savingDetalle ? 'Guardando...' : 'Guardar Parada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
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
  listProductos,
  type ProductoRow
} from '../../services/productosService';
import {
  listRepositores,
  type RepositorRow
} from '../../services/personalPdvService';
import {
  createReposicion,
  createReposicionDetalle,
  deleteReposicion,
  deleteReposicionDetalle,
  listReposicionDetalle,
  listReposiciones,
  listVisitaOptionsReposiciones,
  updateReposicion,
  updateReposicionDetalle,
  type ReposicionDetalleInput,
  type ReposicionDetalleRow,
  type ReposicionInput,
  type ReposicionRow,
  type VisitaOption
} from '../../services/reposicionesService';

type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';

type DynamicOptionsKey = 'visitas' | 'repositores' | 'estadosReposicion' | 'productos';

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

const HEADER_FIELDS: FormField[] = [
  {
    key: 'id_visita',
    label: 'Visita',
    type: 'select',
    required: true,
    dynamicOptions: 'visitas'
  },
  {
    key: 'fecha_reposicion',
    label: 'Fecha de Reposición',
    type: 'datetime-local',
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
    key: 'id_estado',
    label: 'Estado',
    type: 'select',
    required: true,
    dynamicOptions: 'estadosReposicion'
  },
  {
    key: 'observacion',
    label: 'Observación',
    type: 'textarea',
    rows: 3,
    maxLength: 5000,
    placeholder: 'Novedades, consignas o comentarios generales...',
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
    key: 'cantidad_repuesta',
    label: 'Cantidad Repuesta',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'cantidad_retirada',
    label: 'Cantidad Retirada',
    type: 'number',
    required: false,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'observacion',
    label: 'Observación del Producto',
    type: 'textarea',
    rows: 3,
    maxLength: 300,
    placeholder: 'Detalle de la reposición, faltante o motivo...',
    span: 2
  }
];

const pad = (value: number): string => String(value).padStart(2, '0');

const localDateTimeInput = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

const statusBadgeClass = (status: string | null | undefined): string => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'completada') return 'bg-emerald-100 text-emerald-800';
  if (normalized === 'pendiente') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
};

const getReposicionTitle = (row: ReposicionRow): string => {
  return row.punto_venta_nombre || `Reposición #${row.id_reposicion}`;
};

export const ReposicionesView: React.FC = () => {
  const [reposiciones, setReposiciones] = useState<ReposicionRow[]>([]);
  const [detalles, setDetalles] = useState<ReposicionDetalleRow[]>([]);
  const [visitaOptions, setVisitaOptions] = useState<VisitaOption[]>([]);
  const [repositoresList, setRepositoresList] = useState<RepositorRow[]>([]);
  const [estadosReposicion, setEstadosReposicion] = useState<ReferencialRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);

  const [selectedReposicionId, setSelectedReposicionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [detailReloadToken, setDetailReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [notice, setNotice] = useState<string | null>(null);

  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingReposicionId, setEditingReposicionId] = useState<number | null>(null);
  const [headerFormValues, setHeaderFormValues] = useState<Record<string, string>>({});
  const [headerFormError, setHeaderFormError] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerBusyAction, setHeaderBusyAction] = useState(false);

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
      listReposiciones(),
      listVisitaOptionsReposiciones(),
      listRepositores(),
      listReferenciales('estado'),
      listProductos()
    ])
      .then(([reposicionData, visitaData, repositoresData, estadosData, productosData]) => {
        if (cancelled) return;

        const reposicionStates = estadosData.filter(
          (row) => String(row.entidad ?? '').toUpperCase() === 'REPOSICION'
        );

        setReposiciones(reposicionData);
        setVisitaOptions(visitaData);
        setRepositoresList(repositoresData);
        setEstadosReposicion(reposicionStates);
        setProductos(productosData);

        setSelectedReposicionId((current) => {
          if (current !== null && reposicionData.some((row) => row.id_reposicion === current)) {
            return current;
          }
          return reposicionData[0]?.id_reposicion ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las reposiciones.');
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
  }, [selectedReposicionId]);

  useEffect(() => {
    if (selectedReposicionId === null) {
      setDetalles([]);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    listReposicionDetalle(selectedReposicionId)
      .then((data) => {
        if (!cancelled) setDetalles(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la reposición.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedReposicionId, detailReloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedReposicion = reposiciones.find((row) => row.id_reposicion === selectedReposicionId) ?? null;

  const missingHeaderReferences: string[] = [];
  if (visitaOptions.length === 0) missingHeaderReferences.push('visitas');
  if (repositoresList.length === 0) missingHeaderReferences.push('repositores');
  if (estadosReposicion.length === 0) missingHeaderReferences.push('estados de reposición');

  const missingDetailReferences = productos.length === 0 ? ['productos'] : [];

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'visitas':
        return visitaOptions.map((row) => ({
          value: String(row.id_visita),
          label: `Visita #${row.id_visita} · ${formatDate(row.fecha_visita)} · ${row.punto_venta_nombre ?? 'PDV'} · ${row.repositor_nombre ?? 'Repositor'}`
        }));
      case 'repositores':
        return repositoresList.map((row) => ({
          value: String(row.id_repositor),
          label: `${row.nombres} ${row.apellidos} (${row.documento})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'estadosReposicion':
        return estadosReposicion.map((row) => ({
          value: String(row.id_estado),
          label: String(row.descripcion ?? '')
        }));
      case 'productos':
        return productos.map((row) => ({
          value: String(row.id_producto),
          label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      default:
        return [];
    }
  };

  const findEstadoId = (name: string): number | null => {
    const state = estadosReposicion.find(
      (row) => String(row.descripcion ?? '').toLowerCase() === name.toLowerCase()
    );
    return state ? Number(state.id_estado) : null;
  };

  const buildHeaderCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};
    HEADER_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    const firstVisita = visitaOptions[0];
    const pendingState = findEstadoId('Pendiente') ?? (estadosReposicion[0] ? Number(estadosReposicion[0].id_estado) : null);

    values.fecha_reposicion = localDateTimeInput();
    if (firstVisita) {
      values.id_visita = String(firstVisita.id_visita);
      values.id_repositor = String(firstVisita.id_repositor);
    } else if (repositoresList[0]) {
      values.id_repositor = String(repositoresList[0].id_repositor);
    }
    if (pendingState !== null) values.id_estado = String(pendingState);
    return values;
  };

  const buildDetailCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};
    DETAIL_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });
    const firstProduct = productos[0];
    if (firstProduct) values.id_producto = String(firstProduct.id_producto);
    return values;
  };

  const handleFieldChange = (
    key: string,
    value: string,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'id_visita' && value !== '') {
        const visita = visitaOptions.find((row) => String(row.id_visita) === value);
        if (visita) {
          next.id_repositor = String(visita.id_repositor);
        }
      }
      return next;
    });
  };

  const openCreateHeader = () => {
    setEditingReposicionId(null);
    setHeaderFormValues(buildHeaderCreateValues());
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openEditHeader = (row: ReposicionRow) => {
    const values: Record<string, string> = {};
    HEADER_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'datetime-local') {
        values[field.key] = toDateTimeInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });
    setEditingReposicionId(row.id_reposicion);
    setHeaderFormValues(values);
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openCreateDetalle = () => {
    if (!selectedReposicion) return;
    setEditingDetalleId(null);
    setDetailFormValues(buildDetailCreateValues());
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const openEditDetalle = (row: ReposicionDetalleRow) => {
    const values: Record<string, string> = {};
    DETAIL_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });
    setEditingDetalleId(row.id_reposicion_detalle);
    setDetailFormValues(values);
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const handleHeaderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHeaderFormError(null);

    if (missingHeaderReferences.length > 0) {
      setHeaderFormError('Debe existir al menos una visita, un repositor y un estado de reposición.');
      return;
    }

    const payload: Record<string, string | null> = {};
    for (const field of HEADER_FIELDS) {
      const rawValue = (headerFormValues[field.key] ?? '').trim();
      if (field.required && rawValue === '') {
        setHeaderFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of HEADER_FIELDS) {
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setHeaderFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    const input: ReposicionInput = {
      id_visita: Number(payload.id_visita),
      fecha_reposicion: String(payload.fecha_reposicion ?? ''),
      id_repositor: Number(payload.id_repositor),
      id_estado: Number(payload.id_estado),
      observacion: payload.observacion
    };

    setSavingHeader(true);
    try {
      if (editingReposicionId !== null) {
        await updateReposicion(editingReposicionId, input);
        setNotice('Reposición actualizada correctamente.');
      } else {
        const newId = await createReposicion(input);
        if (newId > 0) setSelectedReposicionId(newId);
        setNotice('Reposición registrada correctamente.');
      }
      setIsHeaderModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setHeaderFormError(error instanceof Error ? error.message : 'No se pudo guardar la reposición.');
    } finally {
      setSavingHeader(false);
    }
  };

  const handleDetalleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailFormError(null);

    if (selectedReposicionId === null) {
      setDetailFormError('Seleccione una reposición antes de agregar productos.');
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

    const input: ReposicionDetalleInput = {
      id_reposicion: selectedReposicionId,
      id_producto: Number(payload.id_producto),
      cantidad_repuesta: Number(payload.cantidad_repuesta ?? '0'),
      cantidad_retirada: Number(payload.cantidad_retirada ?? '0'),
      observacion: payload.observacion
    };

    setSavingDetalle(true);
    try {
      if (editingDetalleId !== null) {
        await updateReposicionDetalle(editingDetalleId, input);
        setNotice('Producto de la reposición actualizado correctamente.');
      } else {
        await createReposicionDetalle(input);
        setNotice('Producto agregado a la reposición correctamente.');
      }
      setIsDetailModalOpen(false);
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailFormError(error instanceof Error ? error.message : 'No se pudo guardar el producto de la reposición.');
    } finally {
      setSavingDetalle(false);
    }
  };

  const handleDeleteHeader = async (row: ReposicionRow) => {
    if (!window.confirm(`¿Eliminar la reposición #${row.id_reposicion} y todo su detalle?`)) return;
    setNotice(null);
    setLoadError(null);
    try {
      await deleteReposicion(row.id_reposicion);
      setSelectedReposicionId(null);
      setDetalles([]);
      setNotice('Reposición eliminada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar la reposición.');
    }
  };

  const handleDeleteDetalle = async (row: ReposicionDetalleRow) => {
    if (!window.confirm(`¿Eliminar el producto "${row.producto_descripcion ?? 'seleccionado'}" del detalle de la reposición?`)) return;
    setNotice(null);
    setDetailError(null);
    try {
      await deleteReposicionDetalle(row.id_reposicion_detalle);
      setNotice('Producto eliminado del detalle correctamente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    }
  };

  const handleQuickComplete = async () => {
    if (!selectedReposicion || headerBusyAction) return;
    const completedId = findEstadoId('Completada');
    if (completedId === null) return;
    setHeaderBusyAction(true);
    setLoadError(null);
    try {
      await updateReposicion(selectedReposicion.id_reposicion, { id_estado: completedId });
      setNotice('Reposición marcada como completada.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
    } finally {
      setHeaderBusyAction(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredReposiciones = reposiciones.filter((row) => {
    if (statusFilter !== 'todos' && String(row.id_estado) !== statusFilter) return false;
    if (normalizedQuery === '') return true;
    return [
      row.id_reposicion,
      row.punto_venta_nombre,
      row.repositor_nombre,
      row.estado_nombre,
      row.fecha_reposicion,
      row.observacion
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  const totalLineas = detalles.length;
  const totalRepuesta = detalles.reduce((sum, row) => sum + Number(row.cantidad_repuesta), 0);
  const totalRetirada = detalles.reduce((sum, row) => sum + Number(row.cantidad_retirada), 0);

  const renderFormFields = (
    fields: FormField[],
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((field) => {
        const options = field.dynamicOptions ? getDynamicOptions(field.dynamicOptions) : field.options ?? [];
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
                {field.allowEmpty && <option value="">{field.emptyLabel ?? 'Ninguno'}</option>}
                {field.required && <option value="" disabled>Seleccione...</option>}
                {options.length === 0 && field.required && <option value="" disabled>No hay opciones disponibles</option>}
                {options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
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
            Control de Reposición y Movimiento de Góndola
          </h2>
          <p className="text-xs text-slate-500">
            Cabecera de reposición vinculada a visita y detalle de productos repuestos/retirados.
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
            onClick={openCreateHeader}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Reposición</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{loadError}</p>
            <button onClick={() => setReloadToken((token) => token + 1)} className="mt-1 font-semibold underline underline-offset-2 hover:text-red-900">
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
                placeholder="Buscar reposición, PDV, repositor..."
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
              {estadosReposicion.map((row) => (
                <option key={String(row.id_estado)} value={String(row.id_estado)}>
                  {String(row.descripcion ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Reposiciones ({filteredReposiciones.length}/{reposiciones.length})
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando reposiciones...
                </span>
              </div>
            ) : filteredReposiciones.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                {reposiciones.length === 0 ? 'No hay reposiciones registradas.' : 'No se encontraron reposiciones para el criterio de búsqueda.'}
              </div>
            ) : (
              filteredReposiciones.map((row) => (
                <button
                  key={row.id_reposicion}
                  type="button"
                  onClick={() => setSelectedReposicionId(row.id_reposicion)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedReposicionId === row.id_reposicion
                      ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">REPOSICIÓN #{row.id_reposicion}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(row.estado_nombre)}`}>
                      {row.estado_nombre || '—'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{getReposicionTitle(row)}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(row.fecha_reposicion)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {row.repositor_nombre || 'Sin repositor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>{Number(row.total_lineas ?? 0)} líneas</span>
                    <span>{Number(row.total_repuesta ?? 0)} repuestas</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedReposicion ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">REPOSICIÓN #{selectedReposicion.id_reposicion}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(selectedReposicion.estado_nombre)}`}>
                      {selectedReposicion.estado_nombre || '—'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{getReposicionTitle(selectedReposicion)}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {selectedReposicion.repositor_nombre || 'Sin repositor'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(selectedReposicion.fecha_reposicion)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Visita #{selectedReposicion.id_visita} · {formatDate(selectedReposicion.fecha_visita)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedReposicion.punto_venta_direccion || 'Sin dirección'}
                      {selectedReposicion.punto_venta_ciudad ? ` · ${selectedReposicion.punto_venta_ciudad}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {selectedReposicion.visita_estado_nombre ? `Visita ${selectedReposicion.visita_estado_nombre}` : 'Visita asociada'}
                    </span>
                  </div>
                  {selectedReposicion.observacion && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      {selectedReposicion.observacion}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {String(selectedReposicion.estado_nombre ?? '').toLowerCase() === 'pendiente' && findEstadoId('Completada') !== null && (
                    <button
                      onClick={handleQuickComplete}
                      disabled={headerBusyAction}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {headerBusyAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Marcar Completada</span>
                    </button>
                  )}
                  <button onClick={() => openEditHeader(selectedReposicion)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Reposición</span>
                  </button>
                  <button onClick={() => handleDeleteHeader(selectedReposicion)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Reposición</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Líneas</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{totalLineas}</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600">Repuestas</div>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums">{formatQty(totalRepuesta)}</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-amber-600">Retiradas</div>
                  <div className="text-lg font-bold text-amber-800 tabular-nums">{formatQty(totalRetirada)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Visita</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">#{selectedReposicion.id_visita}</div>
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
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detalle de Productos</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Cantidades repuestas y retiradas por producto.</p>
                  </div>
                  <button onClick={openCreateDetalle} disabled={detailLoading} className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50">
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
                    Esta reposición no tiene productos registrados. Haz clic en "Agregar Producto" para registrar el detalle.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalles.map((row) => (
                      <div key={row.id_reposicion_detalle} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{row.producto_descripcion || 'Producto'}</h5>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.producto_codigo || '—'}</p>
                              {row.observacion && <p className="text-[11px] text-slate-500 mt-1">{row.observacion}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditDetalle(row)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded" title="Editar producto">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteDetalle(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar producto">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Repuesta</span>
                            <span className="font-mono font-semibold">{formatQty(row.cantidad_repuesta)}</span>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Retirada</span>
                            <span className="font-mono font-semibold">{formatQty(row.cantidad_retirada)}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Precio ref.</span>
                            <span className="font-semibold">{formatMoney(row.producto_precio_referencia)}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Unidad</span>
                            <span className="font-semibold">{row.producto_unidad || '—'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-400">
              <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Selecciona o crea una reposición para visualizar su cabecera y productos.</p>
            </div>
          )}
        </div>
      </div>

      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{editingReposicionId !== null ? 'Editar Reposición' : 'Registrar Nueva Reposición'}</h3>
              <button onClick={() => setIsHeaderModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleHeaderSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {missingHeaderReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Debe existir al menos una visita, un repositor y un estado de reposición.</span>
                </div>
              )}
              {renderFormFields(HEADER_FIELDS, headerFormValues, setHeaderFormValues)}
              {headerFormError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{headerFormError}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsHeaderModalOpen(false)} disabled={savingHeader} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={savingHeader || missingHeaderReferences.length > 0} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
                  {savingHeader && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingHeader ? 'Guardando...' : 'Guardar Reposición'}
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
              <h3 className="text-sm font-bold text-slate-900">{editingDetalleId !== null ? 'Editar Producto de Reposición' : 'Agregar Producto a Reposición'}</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDetalleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
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
                <button type="button" onClick={() => setIsDetailModalOpen(false)} disabled={savingDetalle} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={savingDetalle || missingDetailReferences.length > 0} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
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

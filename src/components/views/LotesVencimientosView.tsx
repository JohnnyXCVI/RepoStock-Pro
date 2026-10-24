import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  Search,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Check,
  Store,
  Package
} from 'lucide-react';
import {
  listPuntosVenta,
  type PuntoVentaRow
} from '../../services/personalPdvService';
import {
  listProductos,
  type ProductoRow
} from '../../services/productosService';
import {
  createLote,
  deleteLote,
  listLotes,
  updateLote,
  type LoteInput,
  type LoteRow
} from '../../services/lotesService';

type FieldType = 'text' | 'number' | 'date' | 'select';

type DynamicOptionsKey = 'productos' | 'puntosVenta';

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
  options?: FieldOption[];
  dynamicOptions?: DynamicOptionsKey;
  defaultValue?: string;
  span?: 1 | 2;
}

type LoteFilter = 'all' | 'critico' | 'vencido';

const LOTE_FIELDS: FormField[] = [
  {
    key: 'numero_lote',
    label: 'N° de Lote',
    type: 'text',
    required: true,
    maxLength: 80,
    placeholder: 'Ej: L-2026-001',
    span: 2
  },
  {
    key: 'id_producto',
    label: 'Producto',
    type: 'select',
    required: true,
    dynamicOptions: 'productos'
  },
  {
    key: 'id_punto_venta',
    label: 'Punto de Venta',
    type: 'select',
    required: true,
    dynamicOptions: 'puntosVenta'
  },
  {
    key: 'fecha_ingreso',
    label: 'Fecha de Ingreso',
    type: 'date'
  },
  {
    key: 'fecha_vencimiento',
    label: 'Fecha de Vencimiento',
    type: 'date',
    required: true
  },
  {
    key: 'cantidad_deposito',
    label: 'Cantidad en Depósito',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'cantidad_gondola',
    label: 'Cantidad en Góndola',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  }
];

const getDateInput = (date: Date = new Date()): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getTodayInput = (): string => getDateInput();

const getFutureDateInput = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getDateInput(date);
};

const parseDate = (value: string): Date => {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDaysRemaining = (value: string): number => {
  if (!value) return 0;
  const target = parseDate(value);
  if (Number.isNaN(target.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getEstado = (days: number): string => {
  if (days < 0) return 'Vencido';
  if (days <= 7) return 'Crítico (<7d)';
  if (days <= 30) return 'Por Vencer (<30d)';
  return 'Vigente';
};

const getAccionFefo = (days: number): string => {
  if (days < 0) return 'Retirar de góndola';
  if (days <= 7) return 'Reposición urgente';
  if (days <= 30) return 'Rotación FEFO';
  return 'Sin acción';
};

const formatQuantity = (value: number | string): string => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  });
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
};

const toDateInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 10);
};

export const LotesVencimientosView: React.FC = () => {
  const [rows, setRows] = useState<LoteRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<LoteFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    Promise.all([listLotes(), listProductos(), listPuntosVenta()])
      .then(([lotesData, productosData, pdvData]) => {
        if (cancelled) return;
        setRows(lotesData);
        setProductos(productosData);
        setPuntosVenta(pdvData);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los lotes.');
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
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const missingReferences: string[] = [];
  if (productos.length === 0) missingReferences.push('productos');
  if (puntosVenta.length === 0) missingReferences.push('puntos de venta');

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'productos':
        return productos.map((row) => ({
          value: String(row.id_producto),
          label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'puntosVenta':
        return puntosVenta.map((row) => ({
          value: String(row.id_punto_venta),
          label: `${row.nombre}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      default:
        return [];
    }
  };

  const buildCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    LOTE_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    if (productos.length > 0) values.id_producto = String(productos[0].id_producto);
    if (puntosVenta.length > 0) values.id_punto_venta = String(puntosVenta[0].id_punto_venta);
    values.fecha_ingreso = getTodayInput();
    values.fecha_vencimiento = getFutureDateInput(30);

    return values;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormValues(buildCreateValues());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: LoteRow) => {
    const values: Record<string, string> = {};

    LOTE_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'date') {
        values[field.key] = toDateInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingId(row.id_lote);
    setFormValues(values);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (missingReferences.length > 0) {
      setFormError('Faltan productos o puntos de venta para registrar el lote.');
      return;
    }

    const payload: Record<string, string | null> = {};

    for (const field of LOTE_FIELDS) {
      const rawValue = (formValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of LOTE_FIELDS) {
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    if (
      payload.fecha_ingreso !== null &&
      payload.fecha_vencimiento !== null &&
      payload.fecha_vencimiento < payload.fecha_ingreso
    ) {
      setFormError('La fecha de vencimiento no puede ser anterior a la fecha de ingreso.');
      return;
    }

    const input: LoteInput = {
      id_producto: Number(payload.id_producto),
      id_punto_venta: Number(payload.id_punto_venta),
      numero_lote: String(payload.numero_lote ?? ''),
      fecha_ingreso: payload.fecha_ingreso,
      fecha_vencimiento: String(payload.fecha_vencimiento ?? ''),
      cantidad_deposito: Number(payload.cantidad_deposito),
      cantidad_gondola: Number(payload.cantidad_gondola)
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateLote(editingId, input);
        setNotice('Lote actualizado correctamente.');
      } else {
        await createLote(input);
        setNotice('Lote registrado correctamente.');
      }

      setIsModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el lote.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: LoteRow) => {
    if (!window.confirm(`¿Eliminar el lote ${row.numero_lote}?`)) return;

    setNotice(null);
    setLoadError(null);

    try {
      await deleteLote(row.id_lote);
      setNotice('Lote eliminado correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el lote.');
    }
  };

  const criticalCount = rows.filter((row) => {
    const days = getDaysRemaining(row.fecha_vencimiento);
    return days >= 0 && days <= 7;
  }).length;

  const expiredCount = rows.filter((row) => getDaysRemaining(row.fecha_vencimiento) < 0).length;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    const days = getDaysRemaining(row.fecha_vencimiento);

    const matchesSearch = [
      row.numero_lote,
      row.producto_codigo,
      row.producto_descripcion,
      row.punto_venta_nombre
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );

    const matchesEstado =
      filterEstado === 'all' ||
      (filterEstado === 'critico' && days >= 0 && days <= 7) ||
      (filterEstado === 'vencido' && days < 0);

    return matchesSearch && matchesEstado;
  });

  const tableColSpan = 8;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            Control de Lotes y Vencimientos (Criterio FEFO)
          </h2>
          <p className="text-xs text-slate-500">
            First Expired, First Out: priorización de rotación en góndola para evitar mermas y caducidades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterEstado('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterEstado === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos ({rows.length})
            </button>
            <button
              onClick={() => setFilterEstado('critico')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterEstado === 'critico'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              Críticos ({criticalCount})
            </button>
            <button
              onClick={() => setFilterEstado('vencido')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterEstado === 'vencido'
                  ? 'bg-red-100 text-red-900 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              Vencidos ({expiredCount})
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar lote, producto o PDV..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-slate-50"
            />
          </div>

          <button
            onClick={() => setReloadToken((token) => token + 1)}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Lote</span>
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

      {!loading && missingReferences.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Debe existir al menos un producto y un punto de venta para registrar lotes. Registre los
            faltantes en sus módulos correspondientes.
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-2.5 px-4 w-28">N° de Lote</th>
                <th className="py-2.5 px-4">Producto / Código</th>
                <th className="py-2.5 px-4">Punto de Venta</th>
                <th className="py-2.5 px-4">Ingreso / Vencimiento</th>
                <th className="py-2.5 px-4 text-center">Días Restantes</th>
                <th className="py-2.5 px-4 text-right">Stock</th>
                <th className="py-2.5 px-4">Acción FEFO</th>
                <th className="py-2.5 px-4 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando lotes...
                    </span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                    {rows.length === 0
                      ? 'No hay lotes registrados.'
                      : 'No se encontraron lotes para el criterio de búsqueda.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const days = getDaysRemaining(row.fecha_vencimiento);
                  const total =
                    Number(row.cantidad_deposito) + Number(row.cantidad_gondola);

                  return (
                    <tr key={row.id_lote} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {row.numero_lote}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.producto_descripcion || '—'}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {row.producto_codigo || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.punto_venta_nombre || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(row.fecha_vencimiento)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ingreso: {formatDate(row.fecha_ingreso)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded ${
                            days < 0
                              ? 'bg-red-100 text-red-800'
                              : days <= 7
                              ? 'bg-amber-100 text-amber-800'
                              : days <= 30
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {days < 0 ? `Vencido (${Math.abs(days)}d)` : `${days} días`}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {getEstado(days)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        <div>{formatQuantity(row.cantidad_deposito)} dep.</div>
                        <div>{formatQuantity(row.cantidad_gondola)} gónd.</div>
                        <div className="text-[11px] font-semibold text-slate-900">
                          {formatQuantity(total)} total
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            days < 0
                              ? 'text-red-700'
                              : days <= 7
                              ? 'text-amber-700'
                              : days <= 30
                              ? 'text-yellow-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {getAccionFefo(days)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(row)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && !loadError && (
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
            {filteredRows.length} de {rows.length} registros
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId !== null ? 'Editar Lote de Producto' : 'Registrar Nuevo Lote'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {missingReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Debe existir al menos un producto y un punto de venta. Registre los faltantes en
                    sus módulos correspondientes.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LOTE_FIELDS.map((field) => {
                  const options = field.dynamicOptions
                    ? getDynamicOptions(field.dynamicOptions)
                    : field.options ?? [];

                  return (
                    <div
                      key={field.key}
                      className={field.span === 2 ? 'sm:col-span-2' : undefined}
                    >
                      <label className="block font-medium text-slate-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={formValues[field.key] ?? ''}
                          onChange={(event) =>
                            setFormValues((values) => ({
                              ...values,
                              [field.key]: event.target.value
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="" disabled={field.required}>
                            Seleccione...
                          </option>
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
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          maxLength={field.maxLength}
                          value={formValues[field.key] ?? ''}
                          onChange={(event) =>
                            setFormValues((values) => ({
                              ...values,
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

              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || missingReferences.length > 0}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Guardando...' : 'Guardar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

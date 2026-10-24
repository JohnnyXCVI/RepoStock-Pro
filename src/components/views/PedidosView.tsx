import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  User,
  X
} from 'lucide-react';
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
  createPedido,
  createPedidoDetalle,
  deletePedido,
  deletePedidoDetalle,
  listPedidoDetalle,
  listPedidoEstados,
  listPedidos,
  updatePedido,
  updatePedidoDetalle,
  type PedidoDetalleInput,
  type PedidoDetalleRow,
  type PedidoEstadoRow,
  type PedidoInput,
  type PedidoRow
} from '../../services/pedidosService';

type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';

type DynamicOptionsKey = 'puntosVenta' | 'repositores' | 'estadosPedido' | 'productos';

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
  disabledOnEdit?: boolean;
}

const HEADER_FIELDS: FormField[] = [
  {
    key: 'id_punto_venta',
    label: 'Punto de Venta',
    type: 'select',
    required: true,
    dynamicOptions: 'puntosVenta'
  },
  {
    key: 'id_repositor',
    label: 'Repositor',
    type: 'select',
    required: true,
    dynamicOptions: 'repositores'
  },
  {
    key: 'fecha_pedido',
    label: 'Fecha del Pedido',
    type: 'datetime-local',
    required: true
  },
  {
    key: 'fecha_entrega_prevista',
    label: 'Fecha de Entrega Prevista',
    type: 'date'
  },
  {
    key: 'id_estado',
    label: 'Estado',
    type: 'select',
    required: true,
    dynamicOptions: 'estadosPedido'
  },
  {
    key: 'observacion',
    label: 'Observación',
    type: 'textarea',
    rows: 3,
    maxLength: 5000,
    placeholder: 'Instrucciones de entrega, referencias o comentarios generales...',
    span: 2
  }
];

const DETAIL_FIELDS: FormField[] = [
  {
    key: 'id_producto',
    label: 'Producto',
    type: 'select',
    required: true,
    dynamicOptions: 'productos',
    disabledOnEdit: true
  },
  {
    key: 'precio_unitario',
    label: 'Precio Unitario',
    type: 'number',
    required: true,
    min: 0,
    step: '0.01',
    defaultValue: '0'
  },
  {
    key: 'cantidad_solicitada',
    label: 'Cantidad Solicitada',
    type: 'number',
    required: true,
    min: 0.001,
    step: '0.001',
    defaultValue: '1'
  },
  {
    key: 'cantidad_recibida',
    label: 'Cantidad Recibida',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  }
];

const pad = (value: number): string => String(value).padStart(2, '0');

const localDateTimeInput = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const localDateInput = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toDateTimeInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(' ', 'T').slice(0, 16);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '-';
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-';
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
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return `Gs. ${number.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

const statusBadgeClass = (status: string | null | undefined): string => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'entregado') return 'bg-emerald-100 text-emerald-800';
  if (normalized.includes('parcial')) return 'bg-indigo-100 text-indigo-800';
  if (normalized === 'aprobado') return 'bg-blue-100 text-blue-800';
  if (normalized === 'pendiente') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
};

const getPedidoTitle = (row: PedidoRow): string => {
  return row.punto_venta_nombre || row.punto_venta_fantasia || `Pedido #${row.id_pedido}`;
};

const getRepositorName = (row: RepositorRow): string => {
  return `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim();
};

export const PedidosView: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [detalles, setDetalles] = useState<PedidoDetalleRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);
  const [repositores, setRepositores] = useState<RepositorRow[]>([]);
  const [estadosPedido, setEstadosPedido] = useState<PedidoEstadoRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);

  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
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
  const [editingPedidoId, setEditingPedidoId] = useState<number | null>(null);
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
      listPedidos(),
      listPedidoEstados(),
      listPuntosVenta(),
      listRepositores(),
      listProductos()
    ])
      .then(([pedidoData, estadoData, pdvData, repositorData, productoData]) => {
        if (cancelled) return;

        setPedidos(pedidoData);
        setEstadosPedido(estadoData);
        setPuntosVenta(pdvData);
        setRepositores(repositorData);
        setProductos(productoData);

        setSelectedPedidoId((current) => {
          if (current !== null && pedidoData.some((row) => row.id_pedido === current)) {
            return current;
          }
          return pedidoData[0]?.id_pedido ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos.');
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
  }, [selectedPedidoId]);

  useEffect(() => {
    if (selectedPedidoId === null) {
      setDetalles([]);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    listPedidoDetalle(selectedPedidoId)
      .then((data) => {
        if (!cancelled) setDetalles(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : 'No se pudo cargar el detalle del pedido.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPedidoId, detailReloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedPedido = pedidos.find((row) => row.id_pedido === selectedPedidoId) ?? null;

  const missingHeaderReferences: string[] = [];
  if (puntosVenta.length === 0) missingHeaderReferences.push('puntos de venta');
  if (repositores.length === 0) missingHeaderReferences.push('repositores');
  if (estadosPedido.length === 0) missingHeaderReferences.push('estados de pedido');

  const missingDetailReferences = productos.length === 0 ? ['productos'] : [];

  const findProducto = (idProducto: number): ProductoRow | undefined => {
    return productos.find((row) => Number(row.id_producto) === idProducto);
  };

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'puntosVenta':
        return puntosVenta.map((row) => ({
          value: String(row.id_punto_venta),
          label: `${row.nombre}${row.ciudad ? ` - ${row.ciudad}` : ''}`
        }));
      case 'repositores':
        return repositores.map((row) => ({
          value: String(row.id_repositor),
          label: `${getRepositorName(row)} (${row.documento})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'estadosPedido':
        return estadosPedido.map((row) => ({
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
    const state = estadosPedido.find(
      (row) => String(row.descripcion ?? '').toLowerCase() === name.toLowerCase()
    );
    return state ? Number(state.id_estado) : null;
  };

  const buildHeaderCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};
    HEADER_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    if (puntosVenta[0]) values.id_punto_venta = String(puntosVenta[0].id_punto_venta);
    if (repositores[0]) values.id_repositor = String(repositores[0].id_repositor);
    values.fecha_pedido = localDateTimeInput();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    values.fecha_entrega_prevista = localDateInput(tomorrow);

    const pendingState = findEstadoId('Pendiente') ?? (estadosPedido[0] ? Number(estadosPedido[0].id_estado) : null);
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
      values.precio_unitario = String(Number(firstProduct.precio_referencia ?? 0));
    }
    return values;
  };

  const handleHeaderFieldChange = (key: string, value: string) => {
    setHeaderFormValues((current) => ({ ...current, [key]: value }));
  };

  const handleDetailFieldChange = (key: string, value: string) => {
    setDetailFormValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'id_producto') {
        const product = findProducto(Number(value));
        if (product) {
          next.precio_unitario = String(Number(product.precio_referencia ?? 0));
        }
      }
      return next;
    });
  };

  const openCreateHeader = () => {
    setEditingPedidoId(null);
    setHeaderFormValues(buildHeaderCreateValues());
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openEditHeader = (row: PedidoRow) => {
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
    setEditingPedidoId(row.id_pedido);
    setHeaderFormValues(values);
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openCreateDetalle = () => {
    if (!selectedPedido) return;
    setEditingDetalleId(null);
    setDetailFormValues(buildDetailCreateValues());
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const openEditDetalle = (row: PedidoDetalleRow) => {
    const values: Record<string, string> = {};
    DETAIL_FIELDS.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });
    setEditingDetalleId(row.id_pedido_detalle);
    setDetailFormValues(values);
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const handleHeaderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHeaderFormError(null);

    if (missingHeaderReferences.length > 0) {
      setHeaderFormError('Debe existir al menos un punto de venta, un repositor y un estado de pedido.');
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

    const input: PedidoInput = {
      id_punto_venta: Number(payload.id_punto_venta),
      id_repositor: Number(payload.id_repositor),
      fecha_pedido: String(payload.fecha_pedido ?? ''),
      fecha_entrega_prevista: payload.fecha_entrega_prevista,
      id_estado: Number(payload.id_estado),
      observacion: payload.observacion
    };

    setSavingHeader(true);
    try {
      if (editingPedidoId !== null) {
        await updatePedido(editingPedidoId, input);
        setNotice('Pedido actualizado correctamente.');
      } else {
        const created = await createPedido(input);
        if (created.id > 0) setSelectedPedidoId(created.id);
        setNotice('Pedido registrado correctamente.');
      }
      setIsHeaderModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setHeaderFormError(error instanceof Error ? error.message : 'No se pudo guardar el pedido.');
    } finally {
      setSavingHeader(false);
    }
  };

  const handleDetalleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailFormError(null);

    if (selectedPedidoId === null) {
      setDetailFormError('Seleccione un pedido antes de agregar productos.');
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

    const cantidadSolicitada = Number(payload.cantidad_solicitada ?? 0);
    if (cantidadSolicitada <= 0) {
      setDetailFormError('La cantidad solicitada debe ser mayor a 0.');
      return;
    }

    const input: PedidoDetalleInput = {
      id_pedido: selectedPedidoId,
      id_producto: Number(payload.id_producto),
      cantidad_solicitada: cantidadSolicitada,
      cantidad_recibida: Number(payload.cantidad_recibida ?? 0),
      precio_unitario: Number(payload.precio_unitario ?? 0)
    };

    setSavingDetalle(true);
    try {
      if (editingDetalleId !== null) {
        await updatePedidoDetalle(editingDetalleId, {
          cantidad_solicitada: input.cantidad_solicitada,
          cantidad_recibida: input.cantidad_recibida,
          precio_unitario: input.precio_unitario
        });
        setNotice('Producto del pedido actualizado correctamente.');
      } else {
        await createPedidoDetalle(input);
        setNotice('Producto agregado al pedido correctamente.');
      }
      setIsDetailModalOpen(false);
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailFormError(error instanceof Error ? error.message : 'No se pudo guardar el producto del pedido.');
    } finally {
      setSavingDetalle(false);
    }
  };

  const handleDeleteHeader = async (row: PedidoRow) => {
    if (!window.confirm(`Eliminar el pedido ${row.numero_pedido} y todo su detalle?`)) return;
    setNotice(null);
    setLoadError(null);
    try {
      await deletePedido(row.id_pedido);
      setSelectedPedidoId(null);
      setDetalles([]);
      setNotice('Pedido eliminado correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el pedido.');
    }
  };

  const handleDeleteDetalle = async (row: PedidoDetalleRow) => {
    if (!window.confirm(`Eliminar el producto "${row.producto_nombre ?? 'seleccionado'}" del pedido?`)) return;
    setNotice(null);
    setDetailError(null);
    try {
      await deletePedidoDetalle(row.id_pedido_detalle);
      setNotice('Producto eliminado del detalle correctamente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    }
  };

  const handleQuickStatus = async () => {
    if (!selectedPedido || headerBusyAction) return;
    const currentStatus = String(selectedPedido.estado_nombre ?? '').toLowerCase();
    const targetName = currentStatus === 'pendiente' ? 'Aprobado' : 'Entregado';
    const targetId = findEstadoId(targetName);
    if (targetId === null) return;

    setHeaderBusyAction(true);
    setLoadError(null);
    try {
      await updatePedido(selectedPedido.id_pedido, { id_estado: targetId });
      setNotice(targetName === 'Aprobado' ? 'Pedido aprobado correctamente.' : 'Pedido marcado como entregado.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
    } finally {
      setHeaderBusyAction(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPedidos = pedidos.filter((row) => {
    if (statusFilter !== 'todos' && String(row.id_estado) !== statusFilter) return false;
    if (normalizedQuery === '') return true;
    return [
      row.numero_pedido,
      row.punto_venta_nombre,
      row.punto_venta_fantasia,
      row.repositor_nombres,
      row.repositor_apellidos,
      row.estado_nombre,
      row.fecha_pedido,
      row.fecha_entrega_prevista,
      row.observacion
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  const totalLineas = detalles.length;
  const totalSolicitada = detalles.reduce((sum, row) => sum + Number(row.cantidad_solicitada), 0);
  const totalRecibida = detalles.reduce((sum, row) => sum + Number(row.cantidad_recibida), 0);
  const totalMonto = detalles.reduce(
    (sum, row) => sum + Number(row.cantidad_solicitada) * Number(row.precio_unitario),
    0
  );

  const renderFormFields = (
    fields: FormField[],
    values: Record<string, string>,
    onChange: (key: string, value: string) => void,
    disabledKeys: string[] = []
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((field) => {
        const options = field.dynamicOptions ? getDynamicOptions(field.dynamicOptions) : field.options ?? [];
        const disabled = disabledKeys.includes(field.key);
        return (
          <div key={field.key} className={field.span === 2 ? 'sm:col-span-2' : undefined}>
            <label className="block font-medium text-slate-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'select' ? (
              <select
                required={field.required}
                disabled={disabled}
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
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
                disabled={disabled}
                maxLength={field.maxLength}
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
              />
            ) : (
              <input
                type={field.type}
                required={field.required}
                disabled={disabled}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={field.maxLength}
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
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
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            Pedidos de Productos
          </h2>
          <p className="text-xs text-slate-500">
            Cabecera de pedidos y detalle de productos solicitados y recibidos.
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
            <span>Nuevo Pedido</span>
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
                placeholder="Buscar pedido, PDV, repositor..."
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
              {estadosPedido.map((row) => (
                <option key={String(row.id_estado)} value={String(row.id_estado)}>
                  {String(row.descripcion ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Pedidos ({filteredPedidos.length}/{pedidos.length})
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando pedidos...
                </span>
              </div>
            ) : filteredPedidos.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                {pedidos.length === 0 ? 'No hay pedidos registrados.' : 'No se encontraron pedidos para el criterio de búsqueda.'}
              </div>
            ) : (
              filteredPedidos.map((row) => (
                <button
                  key={row.id_pedido}
                  type="button"
                  onClick={() => setSelectedPedidoId(row.id_pedido)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedPedidoId === row.id_pedido
                      ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">{row.numero_pedido}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(row.estado_nombre)}`}>
                      {row.estado_nombre || '-'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{getPedidoTitle(row)}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(row.fecha_pedido)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {`${row.repositor_nombres ?? ''} ${row.repositor_apellidos ?? ''}`.trim() || 'Sin repositor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>{Number(row.total_lineas ?? 0)} líneas</span>
                    <span>{formatMoney(row.monto_total)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedPedido ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedPedido.numero_pedido}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(selectedPedido.estado_nombre)}`}>
                      {selectedPedido.estado_nombre || '-'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{getPedidoTitle(selectedPedido)}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {selectedPedido.punto_venta_nombre || 'Punto de venta'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {`${selectedPedido.repositor_nombres ?? ''} ${selectedPedido.repositor_apellidos ?? ''}`.trim() || 'Sin repositor'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(selectedPedido.fecha_pedido)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>Entrega prevista: {formatDate(selectedPedido.fecha_entrega_prevista)}</span>
                  </div>
                  {selectedPedido.observacion && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      {selectedPedido.observacion}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {String(selectedPedido.estado_nombre ?? '').toLowerCase() !== 'entregado' && (
                    <button
                      onClick={handleQuickStatus}
                      disabled={headerBusyAction}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {headerBusyAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{String(selectedPedido.estado_nombre ?? '').toLowerCase() === 'pendiente' ? 'Aprobar Pedido' : 'Marcar Entregado'}</span>
                    </button>
                  )}
                  <button onClick={() => openEditHeader(selectedPedido)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Pedido</span>
                  </button>
                  <button onClick={() => handleDeleteHeader(selectedPedido)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Pedido</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Líneas</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{totalLineas}</div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-blue-600">Solicitadas</div>
                  <div className="text-lg font-bold text-blue-800 tabular-nums">{formatQty(totalSolicitada)}</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600">Recibidas</div>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums">{formatQty(totalRecibida)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Monto total</div>
                  <div className="text-sm font-bold text-slate-900 tabular-nums mt-1">{formatMoney(totalMonto)}</div>
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
                    <p className="text-[11px] text-slate-400 mt-0.5">Cantidades solicitadas, recibidas y precios unitarios.</p>
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
                    Este pedido no tiene productos registrados. Haz clic en "Agregar Producto" para registrar el detalle.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalles.map((row) => {
                      const product = findProducto(Number(row.id_producto));
                      const subtotal = Number(row.cantidad_solicitada) * Number(row.precio_unitario);
                      return (
                        <div key={row.id_pedido_detalle} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{row.producto_nombre || product?.descripcion || 'Producto'}</h5>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.producto_codigo || product?.codigo || '-'}</p>
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
                            <div className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-800">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Solicitada</span>
                              <span className="font-mono font-semibold">{formatQty(row.cantidad_solicitada)}</span>
                            </div>
                            <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Recibida</span>
                              <span className="font-mono font-semibold">{formatQty(row.cantidad_recibida)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Precio unit.</span>
                              <span className="font-semibold">{formatMoney(row.precio_unitario)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                              <span className="block text-[10px] uppercase tracking-wide opacity-70">Subtotal</span>
                              <span className="font-semibold">{formatMoney(subtotal)}</span>
                            </div>
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
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Selecciona o crea un pedido para visualizar su cabecera y productos.</p>
            </div>
          )}
        </div>
      </div>

      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{editingPedidoId !== null ? 'Editar Pedido' : 'Registrar Nuevo Pedido'}</h3>
                {editingPedidoId === null && <p className="text-[11px] text-slate-400 mt-0.5">El número de pedido se generará automáticamente.</p>}
              </div>
              <button onClick={() => setIsHeaderModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleHeaderSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {missingHeaderReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Debe existir al menos un punto de venta, un repositor y un estado de pedido.</span>
                </div>
              )}
              {renderFormFields(HEADER_FIELDS, headerFormValues, handleHeaderFieldChange)}
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
                  {savingHeader ? 'Guardando...' : 'Guardar Pedido'}
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
              <h3 className="text-sm font-bold text-slate-900">{editingDetalleId !== null ? 'Editar Producto del Pedido' : 'Agregar Producto al Pedido'}</h3>
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
              {renderFormFields(
                DETAIL_FIELDS,
                detailFormValues,
                handleDetailFieldChange,
                editingDetalleId !== null ? ['id_producto'] : []
              )}
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

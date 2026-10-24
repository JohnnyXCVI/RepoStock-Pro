import React, { useEffect, useState } from 'react';
import {
  Package,
  Tags,
  Search,
  Plus,
  Trash2,
  Edit2,
  Barcode,
  Layers,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Check,
  Store,
  Calendar
} from 'lucide-react';
import { ProductosPreciosSubTab } from '../layout/Sidebar';
import {
  listReferenciales,
  type ReferencialRow
} from '../../services/referencialesService';
import {
  listPuntosVenta,
  type PuntoVentaRow
} from '../../services/personalPdvService';
import {
  createProducto,
  createProductoPuntoVenta,
  deleteProducto,
  deleteProductoPuntoVenta,
  listProductos,
  listProductosPuntoVenta,
  updateProducto,
  updateProductoPuntoVenta,
  type ProductoInput,
  type ProductoPuntoVentaInput,
  type ProductoPuntoVentaRow,
  type ProductoRow
} from '../../services/productosService';

interface ProductosPreciosViewProps {
  subTab: ProductosPreciosSubTab;
  onSubTabChange: (tab: ProductosPreciosSubTab) => void;
}

type FieldType = 'text' | 'number' | 'date' | 'select';

type DynamicOptionsKey = 'categorias' | 'marcas' | 'unidades' | 'productos' | 'puntosVenta';

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
  allowEmpty?: boolean;
  emptyOptionLabel?: string;
  span?: 1 | 2;
}

const ESTADO_OPTIONS: FieldOption[] = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' }
];

const PRODUCTO_FIELDS: FormField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    required: true,
    maxLength: 50,
    placeholder: 'Ej: LAC-LECH-01'
  },
  {
    key: 'codigo_barras',
    label: 'Código de barras',
    type: 'text',
    maxLength: 80,
    placeholder: 'EAN-13 u otro código'
  },
  {
    key: 'descripcion',
    label: 'Descripción del producto',
    type: 'text',
    required: true,
    maxLength: 180,
    placeholder: 'Ej: Leche Entera UHT 1L',
    span: 2
  },
  {
    key: 'id_categoria',
    label: 'Categoría',
    type: 'select',
    required: true,
    dynamicOptions: 'categorias'
  },
  {
    key: 'id_marca',
    label: 'Marca',
    type: 'select',
    dynamicOptions: 'marcas',
    allowEmpty: true,
    emptyOptionLabel: 'Sin marca'
  },
  {
    key: 'id_unidad',
    label: 'Unidad de medida',
    type: 'select',
    required: true,
    dynamicOptions: 'unidades'
  },
  {
    key: 'dias_alerta_vencimiento',
    label: 'Días de alerta de vencimiento',
    type: 'number',
    required: true,
    min: 0,
    step: '1',
    defaultValue: '30'
  },
  {
    key: 'stock_minimo_gondola',
    label: 'Stock mínimo de góndola',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'stock_objetivo_gondola',
    label: 'Stock objetivo de góndola',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '10'
  },
  {
    key: 'precio_referencia',
    label: 'Precio de referencia',
    type: 'number',
    required: true,
    min: 0,
    step: '0.01',
    defaultValue: '0'
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: ESTADO_OPTIONS,
    defaultValue: '1'
  }
];

const PRODUCTO_PDV_FIELDS: FormField[] = [
  {
    key: 'id_punto_venta',
    label: 'Punto de venta',
    type: 'select',
    required: true,
    dynamicOptions: 'puntosVenta'
  },
  {
    key: 'id_producto',
    label: 'Producto',
    type: 'select',
    required: true,
    dynamicOptions: 'productos'
  },
  {
    key: 'precio_esperado',
    label: 'Precio esperado',
    type: 'number',
    required: true,
    min: 0,
    step: '0.01',
    defaultValue: '0'
  },
  {
    key: 'fecha_vigencia_desde',
    label: 'Vigencia desde',
    type: 'date',
    required: true
  },
  {
    key: 'fecha_vigencia_hasta',
    label: 'Vigencia hasta',
    type: 'date'
  },
  {
    key: 'stock_minimo',
    label: 'Stock mínimo',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '0'
  },
  {
    key: 'stock_objetivo',
    label: 'Stock objetivo',
    type: 'number',
    required: true,
    min: 0,
    step: '0.001',
    defaultValue: '10'
  },
  {
    key: 'activo',
    label: 'Estado',
    type: 'select',
    options: ESTADO_OPTIONS,
    defaultValue: '1'
  }
];

const getTodayInput = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const formatMoney = (value: number | string): string => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
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

const formatVigencia = (desde: string, hasta: string | null): string => {
  if (!desde) return '—';
  if (!hasta) return `Desde ${formatDate(desde)}`;
  return `${formatDate(desde)} → ${formatDate(hasta)}`;
};

const toDateInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 10);
};

const renderEstado = (value: number) => {
  const active = Number(value) === 1;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
};

export const ProductosPreciosView: React.FC<ProductosPreciosViewProps> = ({
  subTab,
  onSubTabChange
}) => {
  const isProducto = subTab === 'productos';
  const fields = isProducto ? PRODUCTO_FIELDS : PRODUCTO_PDV_FIELDS;

  const [productoRows, setProductoRows] = useState<ProductoRow[]>([]);
  const [productoPdvRows, setProductoPdvRows] = useState<ProductoPuntoVentaRow[]>([]);
  const [categorias, setCategorias] = useState<ReferencialRow[]>([]);
  const [marcas, setMarcas] = useState<ReferencialRow[]>([]);
  const [unidades, setUnidades] = useState<ReferencialRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPdvFilter, setSelectedPdvFilter] = useState('all');
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

    Promise.all([
      listProductos(),
      listProductosPuntoVenta(),
      listReferenciales('categoria'),
      listReferenciales('marca'),
      listReferenciales('unidad'),
      listPuntosVenta()
    ])
      .then(([productosData, productosPdvData, categoriasData, marcasData, unidadesData, pdvData]) => {
        if (cancelled) return;
        setProductoRows(productosData);
        setProductoPdvRows(productosPdvData);
        setCategorias(categoriasData);
        setMarcas(marcasData);
        setUnidades(unidadesData);
        setPuntosVenta(pdvData);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
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
    setSearchQuery('');
    setSelectedPdvFilter('all');
    setNotice(null);
    setFormError(null);
    setIsModalOpen(false);
    setEditingId(null);
  }, [subTab]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const missingReferences: string[] = [];
  if (isProducto) {
    if (categorias.length === 0) missingReferences.push('categorías');
    if (unidades.length === 0) missingReferences.push('unidades de medida');
  } else {
    if (productoRows.length === 0) missingReferences.push('productos');
    if (puntosVenta.length === 0) missingReferences.push('puntos de venta');
  }

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'categorias':
        return categorias.map((row) => ({
          value: String(row.id_categoria),
          label: `${String(row.descripcion ?? '')}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'marcas':
        return marcas.map((row) => ({
          value: String(row.id_marca),
          label: `${String(row.descripcion ?? '')}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'unidades':
        return unidades.map((row) => ({
          value: String(row.id_unidad),
          label: `${String(row.descripcion ?? '')} (${String(row.abreviatura ?? '')})`
        }));
      case 'puntosVenta':
        return puntosVenta.map((row) => ({
          value: String(row.id_punto_venta),
          label: `${row.nombre}${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'productos':
        return productoRows.map((row) => ({
          value: String(row.id_producto),
          label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      default:
        return [];
    }
  };

  const buildCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    fields.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    if (isProducto) {
      if (categorias.length > 0) values.id_categoria = String(categorias[0].id_categoria);
      values.id_marca = '';
      if (unidades.length > 0) values.id_unidad = String(unidades[0].id_unidad);
    } else {
      if (puntosVenta.length > 0) values.id_punto_venta = String(puntosVenta[0].id_punto_venta);
      if (productoRows.length > 0) values.id_producto = String(productoRows[0].id_producto);
      values.fecha_vigencia_desde = getTodayInput();
    }

    return values;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormValues(buildCreateValues());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: ProductoRow | ProductoPuntoVentaRow) => {
    const values: Record<string, string> = {};

    fields.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (field.type === 'date') {
        values[field.key] = toDateInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingId(isProducto ? (row as ProductoRow).id_producto : (row as ProductoPuntoVentaRow).id_producto_pv);
    setFormValues(values);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (missingReferences.length > 0) {
      setFormError('Faltan datos referenciales para guardar este registro.');
      return;
    }

    const payload: Record<string, string | null> = {};

    for (const field of fields) {
      const rawValue = (formValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      payload[field.key] = rawValue === '' ? null : rawValue;
    }

    for (const field of fields) {
      if (field.type === 'number' && payload[field.key] !== null && !Number.isFinite(Number(payload[field.key]))) {
        setFormError(`El campo "${field.label}" debe ser numérico.`);
        return;
      }
    }

    setSaving(true);

    try {
      if (isProducto) {
        const input: ProductoInput = {
          codigo: String(payload.codigo ?? ''),
          codigo_barras: payload.codigo_barras,
          descripcion: String(payload.descripcion ?? ''),
          id_categoria: Number(payload.id_categoria),
          id_marca: payload.id_marca === null ? null : Number(payload.id_marca),
          id_unidad: Number(payload.id_unidad),
          dias_alerta_vencimiento: Number(payload.dias_alerta_vencimiento),
          stock_minimo_gondola: Number(payload.stock_minimo_gondola),
          stock_objetivo_gondola: Number(payload.stock_objetivo_gondola),
          precio_referencia: Number(payload.precio_referencia),
          estado: Number(payload.estado ?? '1')
        };

        if (editingId !== null) {
          await updateProducto(editingId, input);
          setNotice('Producto actualizado correctamente.');
        } else {
          await createProducto(input);
          setNotice('Producto creado correctamente.');
        }
      } else {
        const desde = String(payload.fecha_vigencia_desde ?? '');
        const hasta = payload.fecha_vigencia_hasta;

        if (hasta !== null && hasta < desde) {
          setFormError('La fecha de vigencia hasta no puede ser anterior a la fecha desde.');
          return;
        }

        const input: ProductoPuntoVentaInput = {
          id_producto: Number(payload.id_producto),
          id_punto_venta: Number(payload.id_punto_venta),
          precio_esperado: Number(payload.precio_esperado),
          fecha_vigencia_desde: desde,
          fecha_vigencia_hasta: hasta,
          stock_minimo: Number(payload.stock_minimo),
          stock_objetivo: Number(payload.stock_objetivo),
          activo: Number(payload.activo ?? '1')
        };

        if (editingId !== null) {
          await updateProductoPuntoVenta(editingId, input);
          setNotice('Asignación actualizada correctamente.');
        } else {
          await createProductoPuntoVenta(input);
          setNotice('Asignación creada correctamente.');
        }
      }

      setIsModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ProductoRow | ProductoPuntoVentaRow) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;

    setNotice(null);
    setLoadError(null);

    try {
      if (isProducto) {
        await deleteProducto((row as ProductoRow).id_producto);
        setNotice('Producto eliminado correctamente.');
      } else {
        await deleteProductoPuntoVenta((row as ProductoPuntoVentaRow).id_producto_pv);
        setNotice('Asignación eliminada correctamente.');
      }
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el registro.');
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProductos =
    normalizedQuery === ''
      ? productoRows
      : productoRows.filter((row) =>
          [
            row.codigo,
            row.codigo_barras,
            row.descripcion,
            row.categoria_nombre,
            row.marca_nombre,
            row.unidad_nombre,
            row.unidad_abreviatura
          ].some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(normalizedQuery)
          )
        );

  const filteredProductosPdv = productoPdvRows.filter((row) => {
    const matchesSearch = [
      row.producto_codigo,
      row.producto_descripcion,
      row.punto_venta_nombre
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );

    const matchesPdv =
      selectedPdvFilter === 'all' || String(row.id_punto_venta) === selectedPdvFilter;

    return matchesSearch && matchesPdv;
  });

  const title = isProducto
    ? 'Catálogo Maestro de Productos'
    : 'Precios y Stock por Punto de Venta';
  const description = isProducto
    ? 'Códigos, categorías, unidades, precios de referencia y niveles de stock.'
    : 'Precios esperados, vigencias y niveles de stock de cada producto en cada punto de venta.';

  const tableColSpan = isProducto ? 10 : 8;

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 w-fit">
        <button
          onClick={() => onSubTabChange('productos')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            subTab === 'productos'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Productos ({productoRows.length})</span>
        </button>
        <button
          onClick={() => onSubTabChange('productos-pdv')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            subTab === 'productos-pdv'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Productos por Punto de Venta ({productoPdvRows.length})</span>
        </button>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isProducto && (
            <select
              value={selectedPdvFilter}
              onChange={(event) => setSelectedPdvFilter(event.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Todos los PDVs</option>
              {puntosVenta.map((pdv) => (
                <option key={pdv.id_punto_venta} value={String(pdv.id_punto_venta)}>
                  {pdv.nombre}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                isProducto
                  ? 'Buscar por código, descripción, categoría...'
                  : 'Buscar por producto o punto de venta...'
              }
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
            <span>{isProducto ? 'Nuevo Producto' : 'Asignar Producto'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Productos Table */}
      {isProducto && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Código / Barras</th>
                  <th className="py-2.5 px-4">Producto</th>
                  <th className="py-2.5 px-4">Categoría / Marca</th>
                  <th className="py-2.5 px-4">Unidad</th>
                  <th className="py-2.5 px-4 text-right">Precio ref.</th>
                  <th className="py-2.5 px-4 text-right">Stock góndola</th>
                  <th className="py-2.5 px-4 text-center">Alerta</th>
                  <th className="py-2.5 px-4 w-24">Estado</th>
                  <th className="py-2.5 px-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando productos...
                      </span>
                    </td>
                  </tr>
                ) : filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      {productoRows.length === 0
                        ? 'No hay productos registrados.'
                        : 'No se encontraron productos para el criterio de búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((row) => (
                    <tr key={row.id_producto} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.id_producto}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900">{row.codigo}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.codigo_barras || 'Sin código de barras'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{row.descripcion}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{row.categoria_nombre || 'Sin categoría'}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.marca_nombre || 'Sin marca'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{row.unidad_nombre || '—'}</div>
                        <div className="text-[11px] text-slate-400">
                          {row.unidad_abreviatura || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                        Gs. {formatMoney(row.precio_referencia)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        <div>{formatQuantity(row.stock_minimo_gondola)} mín.</div>
                        <div className="text-[11px] text-slate-400">
                          {formatQuantity(row.stock_objetivo_gondola)} obj.
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {Number(row.dias_alerta_vencimiento)} días
                      </td>
                      <td className="py-3 px-4">{renderEstado(row.estado)}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && !loadError && (
            <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
              {filteredProductos.length} de {productoRows.length} registros
            </div>
          )}
        </div>
      )}

      {/* Productos por PDV Table */}
      {!isProducto && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Punto de Venta</th>
                  <th className="py-2.5 px-4">Producto</th>
                  <th className="py-2.5 px-4 text-right">Precio esperado</th>
                  <th className="py-2.5 px-4">Vigencia</th>
                  <th className="py-2.5 px-4 text-right">Stock mín. / obj.</th>
                  <th className="py-2.5 px-4 w-24">Estado</th>
                  <th className="py-2.5 px-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando asignaciones...
                      </span>
                    </td>
                  </tr>
                ) : filteredProductosPdv.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      {productoPdvRows.length === 0
                        ? 'No hay productos asignados a puntos de venta.'
                        : 'No se encontraron asignaciones para el criterio de búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  filteredProductosPdv.map((row) => (
                    <tr key={row.id_producto_pv} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.id_producto_pv}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.punto_venta_nombre || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {row.producto_descripcion || '—'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {row.producto_codigo || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                        Gs. {formatMoney(row.precio_esperado)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatVigencia(row.fecha_vigencia_desde, row.fecha_vigencia_hasta)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        <div>{formatQuantity(row.stock_minimo)} mín.</div>
                        <div className="text-[11px] text-slate-400">
                          {formatQuantity(row.stock_objetivo)} obj.
                        </div>
                      </td>
                      <td className="py-3 px-4">{renderEstado(row.activo)}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && !loadError && (
            <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
              {filteredProductosPdv.length} de {productoPdvRows.length} registros
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId !== null
                  ? `Editar ${isProducto ? 'Producto' : 'Asignación'}`
                  : `Nuevo ${isProducto ? 'Producto' : 'Asignación'}`}
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
              {isProducto && missingReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    No hay {missingReferences.join(' ni ')} registradas. Créelas en Referenciales antes de
                    guardar productos.
                  </span>
                </div>
              )}

              {isProducto && marcas.length === 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                  <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>No hay marcas registradas. Puede guardar el producto como “Sin marca”.</span>
                </div>
              )}

              {!isProducto && missingReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Debe existir al menos un producto y un punto de venta. Registre los faltantes en
                    sus módulos correspondientes.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => {
                  const options = field.dynamicOptions
                    ? getDynamicOptions(field.dynamicOptions)
                    : field.options ?? [];
                  const showPlaceholder = Boolean(field.required || field.allowEmpty);

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
                          {showPlaceholder && (
                            <option value="" disabled={field.required}>
                              {field.required
                                ? 'Seleccione...'
                                : field.emptyOptionLabel ?? 'Sin asignar'}
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
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Store,
  Tags,
  BookmarkCheck,
  Scale,
  FileText,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  type LucideIcon
} from 'lucide-react';
import { ReferencialSubTab } from '../layout/Sidebar';
import {
  createReferencial,
  deleteReferencial,
  listReferenciales,
  updateReferencial,
  type ReferencialRow,
  type ReferencialValue
} from '../../services/referencialesService';

interface ReferencialesViewProps {
  subTab: ReferencialSubTab;
  onSubTabChange: (tab: ReferencialSubTab) => void;
}

type FieldType = 'text' | 'number' | 'boolean';

interface FieldOption {
  value: string;
  label: string;
}

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  options?: FieldOption[];
  defaultValue?: string;
}

interface TableColumn {
  key: string;
  label: string;
  render?: (row: ReferencialRow) => React.ReactNode;
}

interface ResourceDef {
  key: ReferencialSubTab;
  tabLabel: string;
  icon: LucideIcon;
  title: string;
  description: string;
  idColumn: string;
  fields: FieldDef[];
  columns: TableColumn[];
}

const STATUS_OPTIONS: FieldOption[] = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' }
];

const renderEstado = (row: ReferencialRow) => {
  const active = Number(row.estado) === 1;
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

const RESOURCES: Record<ReferencialSubTab, ResourceDef> = {
  'tipo-pdv': {
    key: 'tipo-pdv',
    tabLabel: 'Tipo PDV',
    icon: Store,
    title: 'Tipos de Punto de Venta',
    description: 'Clasificación de comercios: supermercados, farmacias, despensas, mayoristas, etc.',
    idColumn: 'id_tipo_punto',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 60,
        placeholder: 'Ej: Supermercado, Farmacia, Despensa...'
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'boolean',
        options: STATUS_OPTIONS,
        defaultValue: '1'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      { key: 'estado', label: 'Estado', render: renderEstado }
    ]
  },
  categoria: {
    key: 'categoria',
    tabLabel: 'Categoría producto',
    icon: Tags,
    title: 'Categorías de Producto',
    description: 'Familias de productos: lácteos, bebidas, OTC, limpieza, etc.',
    idColumn: 'id_categoria',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 100,
        placeholder: 'Ej: Lácteos, Bebidas, Limpieza...'
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'boolean',
        options: STATUS_OPTIONS,
        defaultValue: '1'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      { key: 'estado', label: 'Estado', render: renderEstado }
    ]
  },
  marca: {
    key: 'marca',
    tabLabel: 'Marca',
    icon: BookmarkCheck,
    title: 'Marcas Comerciales',
    description: 'Marcas fabricantes y líneas de productos para el control de reposición.',
    idColumn: 'id_marca',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 100,
        placeholder: 'Ej: Coca-Cola, Nestlé, Colgate...'
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'boolean',
        options: STATUS_OPTIONS,
        defaultValue: '1'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      { key: 'estado', label: 'Estado', render: renderEstado }
    ]
  },
  unidad: {
    key: 'unidad',
    tabLabel: 'Unidad medida',
    icon: Scale,
    title: 'Unidades de Medida',
    description: 'Unidades de venta y empaque: unidad, caja, pack, kilogramo, litro, etc.',
    idColumn: 'id_unidad',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 50,
        placeholder: 'Ej: Unidad, Caja por 12, Kilogramo...'
      },
      {
        key: 'abreviatura',
        label: 'Abreviatura',
        type: 'text',
        required: true,
        maxLength: 10,
        placeholder: 'Ej: un, cx12, kg, L'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      {
        key: 'abreviatura',
        label: 'Abreviatura',
        render: (row) => (
          <span className="font-mono text-[11px] text-slate-700">{String(row.abreviatura ?? '')}</span>
        )
      }
    ]
  },
  estado: {
    key: 'estado',
    tabLabel: 'Estado general',
    icon: FileText,
    title: 'Estados Generales',
    description: 'Estados de flujo por entidad: incidencias, pedidos, reposiciones, rutas y visitas.',
    idColumn: 'id_estado',
    fields: [
      {
        key: 'entidad',
        label: 'Entidad',
        type: 'text',
        required: true,
        maxLength: 40,
        placeholder: 'Ej: INCIDENCIA, PEDIDO, RUTA...'
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 50,
        placeholder: 'Ej: Abierta, En Gestión, Completada...'
      }
    ],
    columns: [
      {
        key: 'entidad',
        label: 'Entidad',
        render: (row) => (
          <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {String(row.entidad ?? '')}
          </span>
        )
      },
      { key: 'descripcion', label: 'Descripción' }
    ]
  },
  prioridad: {
    key: 'prioridad',
    tabLabel: 'Prioridad',
    icon: ShieldAlert,
    title: 'Niveles de Prioridad',
    description: 'Escala de criticidad y tiempo estimado de atención para incidencias.',
    idColumn: 'id_prioridad',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 30,
        placeholder: 'Ej: Baja, Normal, Alta, Urgente'
      },
      {
        key: 'nivel',
        label: 'Nivel',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '1',
        defaultValue: '1'
      },
      {
        key: 'minutos_estimados',
        label: 'Minutos estimados',
        type: 'number',
        required: true,
        min: 0,
        placeholder: '30',
        defaultValue: '30'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      {
        key: 'nivel',
        label: 'Nivel',
        render: (row) => (
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-700">
            Nivel {Number(row.nivel)}
          </span>
        )
      },
      {
        key: 'minutos_estimados',
        label: 'Tiempo estimado',
        render: (row) => <span className="text-slate-600">{Number(row.minutos_estimados)} min</span>
      }
    ]
  },
  motivo: {
    key: 'motivo',
    tabLabel: 'Motivo incidencia',
    icon: HelpCircle,
    title: 'Motivos de Incidencia',
    description: 'Causas tipificadas de problemas: quiebre, vencido, avería, faltante, etc.',
    idColumn: 'id_motivo',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 100,
        placeholder: 'Ej: Quiebre de stock, Producto vencido...'
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'boolean',
        options: STATUS_OPTIONS,
        defaultValue: '1'
      }
    ],
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      { key: 'estado', label: 'Estado', render: renderEstado }
    ]
  },
  'tipo-incidente': {
    key: 'tipo-incidente',
    tabLabel: 'Tipo de incidente',
    icon: AlertTriangle,
    title: 'Tipos de Incidente',
    description: 'Clasificación de anomalías detectadas en ruta y salón de ventas.',
    idColumn: 'id_tipo_incidente',
    fields: [
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: true,
        maxLength: 80,
        placeholder: 'Ej: Faltante de producto, Producto dañado...'
      }
    ],
    columns: [{ key: 'descripcion', label: 'Descripción' }]
  }
};

const TABS: { key: ReferencialSubTab; label: string; icon: LucideIcon }[] = (
  Object.values(RESOURCES) as ResourceDef[]
).map((resource) => ({
  key: resource.key,
  label: resource.tabLabel,
  icon: resource.icon
}));

export const ReferencialesView: React.FC<ReferencialesViewProps> = ({ subTab, onSubTabChange }) => {
  const resource = RESOURCES[subTab];

  const [rows, setRows] = useState<ReferencialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
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
    setRows([]);

    listReferenciales(subTab)
      .then((data) => {
        if (!cancelled) setRows(data);
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
  }, [subTab, reloadToken]);

  useEffect(() => {
    setSearchQuery('');
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRows =
    normalizedQuery === ''
      ? rows
      : rows.filter((row) =>
          Object.values(row).some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(normalizedQuery)
          )
        );

  const openCreateModal = () => {
    const initialValues: Record<string, string> = {};
    resource.fields.forEach((field) => {
      initialValues[field.key] = field.defaultValue ?? '';
    });
    setEditingId(null);
    setFormValues(initialValues);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: ReferencialRow) => {
    const values: Record<string, string> = {};
    resource.fields.forEach((field) => {
      const value = row[field.key];
      values[field.key] = value === null || value === undefined ? '' : String(value);
    });
    setEditingId(Number(row[resource.idColumn]));
    setFormValues(values);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload: Record<string, ReferencialValue> = {};

    for (const field of resource.fields) {
      const rawValue = (formValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      if (field.type === 'number' || field.type === 'boolean') {
        payload[field.key] = rawValue === '' ? null : Number(rawValue);
      } else {
        payload[field.key] = rawValue;
      }
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateReferencial(subTab, editingId, payload);
        setNotice('Registro actualizado correctamente.');
      } else {
        await createReferencial(subTab, payload);
        setNotice('Registro creado correctamente.');
      }
      setIsModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ReferencialRow) => {
    const id = Number(row[resource.idColumn]);
    if (!window.confirm('¿Desea eliminar este registro referencial?')) return;

    setNotice(null);
    setLoadError(null);

    try {
      await deleteReferencial(subTab, id);
      setNotice('Registro eliminado correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el registro.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Subtabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 overflow-x-auto flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSubTabChange(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{resource.title}</h2>
          <p className="text-xs text-slate-500">{resource.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar en ${resource.title.toLowerCase()}...`}
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
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-2.5 px-4 w-16">ID</th>
                {resource.columns.map((column) => (
                  <th key={column.key} className="py-2.5 px-4">
                    {column.label}
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={resource.columns.length + 2} className="py-8 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando registros...
                    </span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={resource.columns.length + 2} className="py-8 text-center text-slate-400">
                    {rows.length === 0
                      ? 'No hay registros en esta tabla.'
                      : 'No se encontraron registros para el criterio de búsqueda.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const id = Number(row[resource.idColumn]);
                  return (
                    <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{id}</td>
                      {resource.columns.map((column) => (
                        <td key={column.key} className="py-3 px-4">
                          {column.render ? (
                            column.render(row)
                          ) : (
                            <span className="font-medium text-slate-900">{String(row[column.key] ?? '')}</span>
                          )}
                        </td>
                      ))}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId !== null ? 'Editar referencial' : `Nuevo registro en ${resource.title}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {resource.fields.map((field) => (
                <div key={field.key}>
                  <label className="block font-medium text-slate-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>

                  {field.type === 'boolean' ? (
                    <select
                      required={field.required}
                      value={formValues[field.key] ?? ''}
                      onChange={(event) =>
                        setFormValues((values) => ({ ...values, [field.key]: event.target.value }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      {field.options?.map((option) => (
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
                      maxLength={field.maxLength}
                      value={formValues[field.key] ?? ''}
                      onChange={(event) =>
                        setFormValues((values) => ({ ...values, [field.key]: event.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  )}
                </div>
              ))}

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
                  disabled={saving}
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

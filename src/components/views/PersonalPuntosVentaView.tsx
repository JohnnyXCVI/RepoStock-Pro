import React, { useEffect, useState } from 'react';
import {
  Users,
  Store,
  Search,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Clock,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';
import { PersonalPdvSubTab } from '../layout/Sidebar';
import {
  listReferenciales,
  type ReferencialRow
} from '../../services/referencialesService';
import {
  createPuntoVenta,
  createRepositor,
  deletePuntoVenta,
  deleteRepositor,
  listPuntosVenta,
  listRepositores,
  updatePuntoVenta,
  updateRepositor,
  type PuntoVentaInput,
  type PuntoVentaRow,
  type RepositorInput,
  type RepositorRow
} from '../../services/personalPdvService';

interface PersonalPuntosVentaViewProps {
  subTab: PersonalPdvSubTab;
  onSubTabChange: (tab: PersonalPdvSubTab) => void;
}

type FieldType = 'text' | 'email' | 'tel' | 'time' | 'number' | 'select';

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
  dynamicOptions?: 'tiposPdv';
  defaultValue?: string;
  numeric?: boolean;
  span?: 1 | 2;
}

const ESTADO_OPTIONS: FieldOption[] = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' }
];

const REPOSITOR_FIELDS: FormField[] = [
  {
    key: 'nombres',
    label: 'Nombres',
    type: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Nombres del repositor'
  },
  {
    key: 'apellidos',
    label: 'Apellidos',
    type: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Apellidos del repositor'
  },
  {
    key: 'documento',
    label: 'Documento de identidad',
    type: 'text',
    required: true,
    maxLength: 30,
    placeholder: 'Ej: 3.456.789'
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'tel',
    maxLength: 30,
    placeholder: 'Ej: +595 981 000 000'
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    maxLength: 120,
    placeholder: 'nombre@empresa.com'
  },
  {
    key: 'hora_inicio',
    label: 'Hora de inicio',
    type: 'time'
  },
  {
    key: 'hora_fin',
    label: 'Hora de fin',
    type: 'time'
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: ESTADO_OPTIONS,
    defaultValue: '1',
    numeric: true
  }
];

const PUNTO_VENTA_FIELDS: FormField[] = [
  {
    key: 'id_tipo_punto',
    label: 'Tipo de Punto de Venta',
    type: 'select',
    required: true,
    dynamicOptions: 'tiposPdv',
    numeric: true
  },
  {
    key: 'nombre',
    label: 'Nombre del Punto de Venta',
    type: 'text',
    required: true,
    maxLength: 150,
    placeholder: 'Ej: Superseis Los Laureles',
    span: 2
  },
  {
    key: 'ruc',
    label: 'RUC',
    type: 'text',
    maxLength: 30,
    placeholder: 'Ej: 80012345-6'
  },
  {
    key: 'direccion',
    label: 'Dirección',
    type: 'text',
    required: true,
    maxLength: 200,
    placeholder: 'Calle, número, esquina...',
    span: 2
  },
  {
    key: 'ciudad',
    label: 'Ciudad',
    type: 'text',
    maxLength: 100,
    defaultValue: 'Asunción'
  },
  {
    key: 'departamento',
    label: 'Departamento',
    type: 'text',
    maxLength: 100,
    defaultValue: 'Central'
  },
  {
    key: 'contacto',
    label: 'Contacto',
    type: 'text',
    maxLength: 100,
    placeholder: 'Encargado o jefe de salón'
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'tel',
    maxLength: 30,
    placeholder: 'Ej: +595 21 000 000'
  },
  {
    key: 'hora_apertura',
    label: 'Hora de apertura',
    type: 'time'
  },
  {
    key: 'hora_cierre',
    label: 'Hora de cierre',
    type: 'time'
  },
  {
    key: 'frecuencia_visita_dias',
    label: 'Frecuencia de visita (días)',
    type: 'number',
    required: true,
    min: 1,
    defaultValue: '7'
  },
  {
    key: 'latitud',
    label: 'Latitud',
    type: 'number',
    min: -90,
    max: 90,
    step: '0.0000001',
    placeholder: '-25.2637000'
  },
  {
    key: 'longitud',
    label: 'Longitud',
    type: 'number',
    min: -180,
    max: 180,
    step: '0.0000001',
    placeholder: '-57.5759000'
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: ESTADO_OPTIONS,
    defaultValue: '1',
    numeric: true
  }
];

const formatTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  return String(value).slice(0, 5);
};

const formatSchedule = (start: string | null | undefined, end: string | null | undefined): string => {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from === '—' && to === '—') return '—';
  return `${from} a ${to}`;
};

const toTimeInput = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).slice(0, 5);
};

const renderEstado = (estado: number) => {
  const active = Number(estado) === 1;
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

export const PersonalPuntosVentaView: React.FC<PersonalPuntosVentaViewProps> = ({
  subTab,
  onSubTabChange
}) => {
  const isRepositor = subTab === 'repositores';
  const fields = isRepositor ? REPOSITOR_FIELDS : PUNTO_VENTA_FIELDS;

  const [repositorRows, setRepositorRows] = useState<RepositorRow[]>([]);
  const [puntoVentaRows, setPuntoVentaRows] = useState<PuntoVentaRow[]>([]);
  const [tiposPdv, setTiposPdv] = useState<ReferencialRow[]>([]);

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

    Promise.all([listRepositores(), listPuntosVenta(), listReferenciales('tipo-pdv')])
      .then(([repositoresData, puntosVentaData, tiposData]) => {
        if (cancelled) return;
        setRepositorRows(repositoresData);
        setPuntoVentaRows(puntosVentaData);
        setTiposPdv(tiposData);
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

  const filteredRepositores =
    normalizedQuery === ''
      ? repositorRows
      : repositorRows.filter((row) =>
          [row.nombres, row.apellidos, row.documento, row.telefono, row.email].some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(normalizedQuery)
          )
        );

  const filteredPuntosVenta =
    normalizedQuery === ''
      ? puntoVentaRows
      : puntoVentaRows.filter((row) =>
          [
            row.nombre,
            row.tipo_nombre,
            row.ruc,
            row.direccion,
            row.ciudad,
            row.departamento,
            row.contacto,
            row.telefono
          ].some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(normalizedQuery)
          )
        );

  const getTipoOptions = (): FieldOption[] =>
    tiposPdv.map((tipo) => ({
      value: String(tipo.id_tipo_punto),
      label: `${String(tipo.descripcion ?? '')}${Number(tipo.estado) === 0 ? ' (Inactivo)' : ''}`
    }));

  const openCreateModal = () => {
    const initialValues: Record<string, string> = {};
    fields.forEach((field) => {
      initialValues[field.key] = field.defaultValue ?? '';
    });

    if (!isRepositor && tiposPdv.length > 0) {
      initialValues.id_tipo_punto = String(tiposPdv[0].id_tipo_punto);
    }

    setEditingId(null);
    setFormValues(initialValues);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: RepositorRow | PuntoVentaRow) => {
    const values: Record<string, string> = {};

    fields.forEach((field) => {
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];

      if (field.type === 'time') {
        values[field.key] = toTimeInput(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        values[field.key] = '';
      } else {
        values[field.key] = String(rawValue);
      }
    });

    setEditingId(isRepositor ? (row as RepositorRow).id_repositor : (row as PuntoVentaRow).id_punto_venta);
    setFormValues(values);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload: Record<string, string | number | null> = {};

    for (const field of fields) {
      const rawValue = (formValues[field.key] ?? '').trim();

      if (field.required && rawValue === '') {
        setFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }

      if (field.type === 'number') {
        payload[field.key] = rawValue === '' ? null : Number(rawValue);
      } else if (field.numeric) {
        payload[field.key] = rawValue === '' ? null : Number(rawValue);
      } else {
        payload[field.key] = rawValue === '' ? null : rawValue;
      }
    }

    setSaving(true);
    try {
      if (isRepositor) {
        const input: RepositorInput = {
          nombres: String(payload.nombres ?? ''),
          apellidos: String(payload.apellidos ?? ''),
          documento: String(payload.documento ?? ''),
          telefono: payload.telefono as string | null,
          email: payload.email as string | null,
          hora_inicio: payload.hora_inicio as string | null,
          hora_fin: payload.hora_fin as string | null,
          estado: Number(payload.estado ?? 1)
        };

        if (editingId !== null) {
          await updateRepositor(editingId, input);
          setNotice('Repositor actualizado correctamente.');
        } else {
          await createRepositor(input);
          setNotice('Repositor creado correctamente.');
        }
      } else {
        const input: PuntoVentaInput = {
          id_tipo_punto: Number(payload.id_tipo_punto ?? 0),
          nombre: String(payload.nombre ?? ''),
          ruc: payload.ruc as string | null,
          direccion: String(payload.direccion ?? ''),
          ciudad: payload.ciudad as string | null,
          departamento: payload.departamento as string | null,
          latitud: payload.latitud === null ? null : Number(payload.latitud),
          longitud: payload.longitud === null ? null : Number(payload.longitud),
          contacto: payload.contacto as string | null,
          telefono: payload.telefono as string | null,
          hora_apertura: payload.hora_apertura as string | null,
          hora_cierre: payload.hora_cierre as string | null,
          frecuencia_visita_dias: Number(payload.frecuencia_visita_dias ?? 7),
          estado: Number(payload.estado ?? 1)
        };

        if (editingId !== null) {
          await updatePuntoVenta(editingId, input);
          setNotice('Punto de venta actualizado correctamente.');
        } else {
          await createPuntoVenta(input);
          setNotice('Punto de venta creado correctamente.');
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

  const handleDelete = async (row: RepositorRow | PuntoVentaRow) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;

    setNotice(null);
    setLoadError(null);

    try {
      if (isRepositor) {
        await deleteRepositor((row as RepositorRow).id_repositor);
        setNotice('Repositor eliminado correctamente.');
      } else {
        await deletePuntoVenta((row as PuntoVentaRow).id_punto_venta);
        setNotice('Punto de venta eliminado correctamente.');
      }
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el registro.');
    }
  };

  const title = isRepositor ? 'Plantel de Repositores' : 'Puntos de Venta y Canales Habilitados';
  const description = isRepositor
    ? 'Gestión del personal asignado a rutas, horarios y contacto.'
    : 'Supermercados, farmacias, minimarkets y mayoristas habilitados.';

  const tableColSpan = isRepositor ? 7 : 8;

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 w-fit">
        <button
          onClick={() => onSubTabChange('repositores')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            subTab === 'repositores'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Repositores ({repositorRows.length})</span>
        </button>
        <button
          onClick={() => onSubTabChange('puntos-venta')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            subTab === 'puntos-venta'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Puntos de Venta ({puntoVentaRows.length})</span>
        </button>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                isRepositor
                  ? 'Buscar por nombre, documento o contacto...'
                  : 'Buscar por nombre, tipo, ciudad o contacto...'
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
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isRepositor ? 'Nuevo Repositor' : 'Nuevo PDV'}</span>
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

      {/* Repositores Table */}
      {isRepositor && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Repositor</th>
                  <th className="py-2.5 px-4">Documento</th>
                  <th className="py-2.5 px-4">Contacto</th>
                  <th className="py-2.5 px-4">Horario</th>
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
                        Cargando repositores...
                      </span>
                    </td>
                  </tr>
                ) : filteredRepositores.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      {repositorRows.length === 0
                        ? 'No hay repositores registrados.'
                        : 'No se encontraron repositores para el criterio de búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  filteredRepositores.map((row) => (
                    <tr key={row.id_repositor} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.id_repositor}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {row.nombres} {row.apellidos}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {row.documento}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{row.telefono || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{row.email || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatSchedule(row.hora_inicio, row.hora_fin)}</span>
                        </div>
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
              {filteredRepositores.length} de {repositorRows.length} registros
            </div>
          )}
        </div>
      )}

      {/* Puntos de Venta Table */}
      {!isRepositor && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Punto de Venta</th>
                  <th className="py-2.5 px-4">Ubicación</th>
                  <th className="py-2.5 px-4">Contacto</th>
                  <th className="py-2.5 px-4">Horario</th>
                  <th className="py-2.5 px-4">Frecuencia</th>
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
                        Cargando puntos de venta...
                      </span>
                    </td>
                  </tr>
                ) : filteredPuntosVenta.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-slate-400">
                      {puntoVentaRows.length === 0
                        ? 'No hay puntos de venta registrados.'
                        : 'No se encontraron puntos de venta para el criterio de búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  filteredPuntosVenta.map((row) => (
                    <tr key={row.id_punto_venta} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.id_punto_venta}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{row.nombre}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.tipo_nombre || 'Sin tipo'}
                          {row.ruc ? ` · RUC ${row.ruc}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div>{row.direccion}</div>
                            <div className="text-[11px] text-slate-400">
                              {[row.ciudad, row.departamento].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{row.contacto || '—'}</div>
                        <div className="text-[11px] text-slate-500">{row.telefono || '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatSchedule(row.hora_apertura, row.hora_cierre)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Cada {Number(row.frecuencia_visita_dias)} días
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
              {filteredPuntosVenta.length} de {puntoVentaRows.length} registros
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
                  ? `Editar ${isRepositor ? 'Repositor' : 'Punto de Venta'}`
                  : `Nuevo ${isRepositor ? 'Repositor' : 'Punto de Venta'}`}
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
              {!isRepositor && tiposPdv.length === 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    No hay tipos de punto de venta. Cree al menos uno en Referenciales &gt; Tipo PDV.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => {
                  const options =
                    field.dynamicOptions === 'tiposPdv' ? getTipoOptions() : field.options ?? [];

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
                          {field.dynamicOptions === 'tiposPdv' && (
                            <option value="" disabled>
                              Seleccione un tipo...
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
                  disabled={saving || (!isRepositor && tiposPdv.length === 0)}
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

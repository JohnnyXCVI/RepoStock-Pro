import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
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
import { listReferenciales, type ReferencialRow } from '../../services/referencialesService';
import {
  createIncidencia,
  createIncidenciaDetalle,
  deleteIncidencia,
  deleteIncidenciaDetalle,
  listIncidenciaDetalle,
  listIncidenciaEstados,
  listIncidencias,
  listRutaOpcionesIncidencias,
  listVisitaOpcionesIncidencias,
  updateIncidencia,
  updateIncidenciaDetalle,
  type IncidenciaDetalleInput,
  type IncidenciaDetalleRow,
  type IncidenciaEstadoRow,
  type IncidenciaInput,
  type IncidenciaRow,
  type RutaDetalleOpcionRow,
  type VisitaOpcionRow
} from '../../services/incidenciasService';

type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';

type DynamicOptionsKey = 'repositores' | 'tiposIncidente' | 'estadosIncidencia' | 'visitas' | 'rutas' | 'productos' | 'motivos' | 'productosOpcional';

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
  { key: 'id_visita', label: 'Visita', type: 'select', dynamicOptions: 'visitas', allowEmpty: true, emptyLabel: 'Sin visita asociada' },
  { key: 'id_ruta_detalle', label: 'Detalle de Ruta', type: 'select', dynamicOptions: 'rutas', allowEmpty: true, emptyLabel: 'Sin ruta asociada' },
  { key: 'id_repositor', label: 'Repositor', type: 'select', required: true, dynamicOptions: 'repositores' },
  { key: 'id_tipo_incidente', label: 'Tipo de Incidente', type: 'select', required: true, dynamicOptions: 'tiposIncidente' },
  { key: 'fecha_incidencia', label: 'Fecha de Incidencia', type: 'datetime-local', required: true },
  { key: 'id_estado', label: 'Estado', type: 'select', required: true, dynamicOptions: 'estadosIncidencia' },
  { key: 'requiere_nueva_visita', label: 'Requiere nueva visita', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Sí' }], defaultValue: '0' },
  { key: 'fecha_nueva_visita', label: 'Fecha nueva visita', type: 'date' },
  { key: 'descripcion', label: 'Descripción del Suceso', type: 'textarea', required: true, rows: 4, maxLength: 5000, span: 2, placeholder: 'Detalle claro de lo ocurrido, lugar afectado o hallazgos...' },
  { key: 'solucion_aplicada', label: 'Solución aplicada', type: 'textarea', rows: 3, maxLength: 5000, span: 2, placeholder: 'Acción correctiva, seguimiento o cierre...' }
];

const DETAIL_FIELDS: FormField[] = [
  { key: 'id_producto', label: 'Producto', type: 'select', dynamicOptions: 'productosOpcional', allowEmpty: true, emptyLabel: 'General / Sin producto' },
  { key: 'id_motivo', label: 'Motivo', type: 'select', required: true, dynamicOptions: 'motivos' },
  { key: 'cantidad_afectada', label: 'Cantidad Afectada', type: 'number', required: true, min: 0, step: '0.001', defaultValue: '0' },
  { key: 'descripcion', label: 'Detalle de la afectación', type: 'textarea', required: true, rows: 3, maxLength: 500, span: 2, placeholder: 'Describir la afectación observada...' }
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

const statusBadgeClass = (status: string | null | undefined): string => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'resuelta' || normalized === 'cerrada') return 'bg-emerald-100 text-emerald-800';
  if (normalized === 'en proceso') return 'bg-blue-100 text-blue-800';
  if (normalized === 'abierta') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
};

const getIncidenciaTitle = (row: IncidenciaRow): string => {
  return row.punto_venta_nombre || row.visita_punto_venta_nombre || row.ruta_punto_venta_nombre || `Incidencia #${row.id_incidencia}`;
};

const getRepositorName = (row: RepositorRow): string => {
  return `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim();
};

export const IncidenciasView: React.FC = () => {
  const [incidencias, setIncidencias] = useState<IncidenciaRow[]>([]);
  const [detalles, setDetalles] = useState<IncidenciaDetalleRow[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaRow[]>([]);
  const [repositores, setRepositores] = useState<RepositorRow[]>([]);
  const [estadosIncidencia, setEstadosIncidencia] = useState<IncidenciaEstadoRow[]>([]);
  const [tiposIncidente, setTiposIncidente] = useState<ReferencialRow[]>([]);
  const [motivos, setMotivos] = useState<ReferencialRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [visitaOpciones, setVisitaOpciones] = useState<VisitaOpcionRow[]>([]);
  const [rutaOpciones, setRutaOpciones] = useState<RutaDetalleOpcionRow[]>([]);

  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<number | null>(null);
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
  const [editingIncidenciaId, setEditingIncidenciaId] = useState<number | null>(null);
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
      listIncidencias(),
      listIncidenciaEstados(),
      listRepositores(),
      listPuntosVenta(),
      listProductos(),
      listReferenciales('tipo-incidente'),
      listReferenciales('motivo'),
      listVisitaOpcionesIncidencias(),
      listRutaOpcionesIncidencias()
    ])
      .then(([incidenciaData, estadoData, repositorData, pdvData, productoData, tipoData, motivoData, visitaData, rutaData]) => {
        if (cancelled) return;

        setIncidencias(incidenciaData);
        setEstadosIncidencia(estadoData);
        setRepositores(repositorData);
        setPuntosVenta(pdvData);
        setProductos(productoData);
        setTiposIncidente(tipoData);
        setMotivos(motivoData);
        setVisitaOpciones(visitaData);
        setRutaOpciones(rutaData);

        setSelectedIncidenciaId((current) => {
          if (current !== null && incidenciaData.some((row) => row.id_incidencia === current)) {
            return current;
          }
          return incidenciaData[0]?.id_incidencia ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las incidencias.');
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
  }, [selectedIncidenciaId]);

  useEffect(() => {
    if (selectedIncidenciaId === null) {
      setDetalles([]);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    listIncidenciaDetalle(selectedIncidenciaId)
      .then((data) => {
        if (!cancelled) setDetalles(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la incidencia.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIncidenciaId, detailReloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedIncidencia = incidencias.find((row) => row.id_incidencia === selectedIncidenciaId) ?? null;

  const missingHeaderReferences: string[] = [];
  if (repositores.length === 0) missingHeaderReferences.push('repositores');
  if (tiposIncidente.length === 0) missingHeaderReferences.push('tipos de incidente');
  if (estadosIncidencia.length === 0) missingHeaderReferences.push('estados de incidencia');

  const missingDetailReferences = motivos.length === 0 ? ['motivos'] : [];

  const getDynamicOptions = (source?: DynamicOptionsKey): FieldOption[] => {
    switch (source) {
      case 'repositores':
        return repositores.map((row) => ({
          value: String(row.id_repositor),
          label: `${getRepositorName(row)} (${row.documento})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'tiposIncidente':
        return tiposIncidente.map((row) => ({
          value: String(row.id_tipo_incidente ?? row.id_tipo),
          label: String(row.descripcion ?? row.nombre ?? '')
        }));
      case 'estadosIncidencia':
        return estadosIncidencia.map((row) => ({
          value: String(row.id_estado),
          label: String(row.descripcion ?? '')
        }));
      case 'visitas':
        return visitaOpciones.map((row) => ({
          value: String(row.id_visita),
          label: `Visita #${row.id_visita} - ${formatDate(row.fecha_visita)} - ${row.punto_venta_nombre ?? 'PDV'} - ${row.repositor_nombre ?? 'Repositor'}`
        }));
      case 'rutas':
        return rutaOpciones.map((row) => ({
          value: String(row.id_ruta_detalle),
          label: `Ruta #${row.id_ruta} (Ord. ${row.orden_visita}) - ${formatDate(row.ruta_fecha)} - ${row.punto_venta_nombre ?? 'PDV'} - ${row.repositor_nombre ?? 'Repositor'}`
        }));
      case 'productos':
        return productos.map((row) => ({
          value: String(row.id_producto),
          label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
        }));
      case 'productosOpcional':
        return [
          { value: '', label: 'General / Sin producto' },
          ...productos.map((row) => ({
            value: String(row.id_producto),
            label: `${row.descripcion} (${row.codigo})${Number(row.estado) === 0 ? ' (Inactivo)' : ''}`
          }))
        ];
      case 'motivos':
        return motivos.map((row) => ({
          value: String(row.id_motivo ?? row.id),
          label: String(row.descripcion ?? row.nombre ?? '')
        }));
      default:
        return [];
    }
  };

  const findEstadoId = (name: string): number | null => {
    const state = estadosIncidencia.find(
      (row) => String(row.descripcion ?? '').toLowerCase() === name.toLowerCase()
    );
    return state ? Number(state.id_estado) : null;
  };

  const buildHeaderCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};
    HEADER_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });

    if (repositores[0]) values.id_repositor = String(repositores[0].id_repositor);
    if (tiposIncidente[0]) values.id_tipo_incidente = String((tiposIncidente[0] as any).id_tipo_incidente ?? (tiposIncidente[0] as any).id_tipo);
    values.fecha_incidencia = localDateTimeInput();
    values.requiere_nueva_visita = '0';
    values.fecha_nueva_visita = '';

    const abiertaId = findEstadoId('Abierta') ?? (estadosIncidencia[0] ? Number(estadosIncidencia[0].id_estado) : null);
    if (abiertaId !== null) values.id_estado = String(abiertaId);

    if (visitaOpciones[0]) {
      values.id_visita = String(visitaOpciones[0].id_visita);
      if (visitaOpciones[0].id_ruta_detalle) values.id_ruta_detalle = String(visitaOpciones[0].id_ruta_detalle);
    } else if (rutaOpciones[0]) {
      values.id_ruta_detalle = String(rutaOpciones[0].id_ruta_detalle);
    }
    return values;
  };

  const buildDetailCreateValues = (): Record<string, string> => {
    const values: Record<string, string> = {};
    DETAIL_FIELDS.forEach((field) => {
      values[field.key] = field.defaultValue ?? '';
    });
    if (motivos[0]) values.id_motivo = String((motivos[0] as any).id_motivo ?? (motivos[0] as any).id);
    return values;
  };

  const handleHeaderFieldChange = (key: string, value: string) => {
    setHeaderFormValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'id_visita' && value !== '') {
        const visita = visitaOpciones.find((row) => String(row.id_visita) === value);
        if (visita) {
          next.id_repositor = String(visita.id_repositor);
          if (visita.id_ruta_detalle) next.id_ruta_detalle = String(visita.id_ruta_detalle);
        }
      }
      if (key === 'id_ruta_detalle' && value !== '') {
        const ruta = rutaOpciones.find((row) => String(row.id_ruta_detalle) === value);
        if (ruta) next.id_repositor = String(ruta.id_repositor);
      }
      if (key === 'requiere_nueva_visita' && value === '0') {
        next.fecha_nueva_visita = '';
      }
      return next;
    });
  };

  const handleDetailFieldChange = (key: string, value: string) => {
    setDetailFormValues((current) => ({ ...current, [key]: value }));
  };

  const openCreateHeader = () => {
    setEditingIncidenciaId(null);
    setHeaderFormValues(buildHeaderCreateValues());
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openEditHeader = (row: IncidenciaRow) => {
    const values: Record<string, string> = {};
    HEADER_FIELDS.forEach((field) => {
      if (field.key === 'fecha_incidencia') {
        values[field.key] = toDateTimeInput(row.fecha_incidencia);
        return;
      }
      if (field.key === 'requiere_nueva_visita') {
        values[field.key] = row.requiere_nueva_visita ? '1' : '0';
        return;
      }
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (rawValue === null || rawValue === undefined) {
        values[field.key] = field.allowEmpty ? '' : (field.defaultValue ?? '');
      } else {
        values[field.key] = String(rawValue);
      }
    });
    setEditingIncidenciaId(row.id_incidencia);
    setHeaderFormValues(values);
    setHeaderFormError(null);
    setIsHeaderModalOpen(true);
  };

  const openCreateDetalle = () => {
    if (!selectedIncidencia) return;
    setEditingDetalleId(null);
    setDetailFormValues(buildDetailCreateValues());
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const openEditDetalle = (row: IncidenciaDetalleRow) => {
    const values: Record<string, string> = {};
    DETAIL_FIELDS.forEach((field) => {
      if (field.key === 'id_producto') {
        values[field.key] = row.id_producto === null || row.id_producto === undefined ? '' : String(row.id_producto);
        return;
      }
      const rawValue = (row as unknown as Record<string, unknown>)[field.key];
      if (rawValue === null || rawValue === undefined) {
        values[field.key] = field.allowEmpty ? '' : (field.defaultValue ?? '');
      } else {
        values[field.key] = String(rawValue);
      }
    });
    setEditingDetalleId(row.id_incidencia_detalle);
    setDetailFormValues(values);
    setDetailFormError(null);
    setIsDetailModalOpen(true);
  };

  const handleHeaderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHeaderFormError(null);

    if (missingHeaderReferences.length > 0) {
      setHeaderFormError('Debe existir al menos un repositor, un tipo de incidente y un estado de incidencia.');
      return;
    }

    const payload: Record<string, string | number | null> = {};
    for (const field of HEADER_FIELDS) {
      const rawValue = (headerFormValues[field.key] ?? '').trim();
      if (field.required && rawValue === '') {
        setHeaderFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
      if (rawValue === '') {
        payload[field.key] = field.key === 'id_visita' || field.key === 'id_ruta_detalle' || field.key === 'fecha_nueva_visita' || field.key === 'solucion_aplicada' ? null : '';
      } else {
        payload[field.key] = rawValue;
      }
    }

    if (payload.requiere_nueva_visita === '0') {
      payload.fecha_nueva_visita = null;
    }

    const input: IncidenciaInput = {
      id_visita: payload.id_visita === null || payload.id_visita === '' ? null : Number(payload.id_visita),
      id_ruta_detalle: payload.id_ruta_detalle === null || payload.id_ruta_detalle === '' ? null : Number(payload.id_ruta_detalle),
      id_repositor: Number(payload.id_repositor),
      id_tipo_incidente: Number(payload.id_tipo_incidente),
      fecha_incidencia: String(payload.fecha_incidencia),
      descripcion: String(payload.descripcion ?? ''),
      solucion_aplicada: payload.solucion_aplicada === '' ? null : (payload.solucion_aplicada as string | null),
      requiere_nueva_visita: payload.requiere_nueva_visita === '1' ? 1 : 0,
      fecha_nueva_visita: payload.fecha_nueva_visita as string | null,
      id_estado: Number(payload.id_estado)
    };

    setSavingHeader(true);
    try {
      if (editingIncidenciaId !== null) {
        await updateIncidencia(editingIncidenciaId, input);
        setNotice('Incidencia actualizada correctamente.');
      } else {
        const newId = await createIncidencia(input);
        if (newId > 0) setSelectedIncidenciaId(newId);
        setNotice('Incidencia registrada correctamente.');
      }
      setIsHeaderModalOpen(false);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setHeaderFormError(error instanceof Error ? error.message : 'No se pudo guardar la incidencia.');
    } finally {
      setSavingHeader(false);
    }
  };

  const handleDetalleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailFormError(null);

    if (selectedIncidenciaId === null) {
      setDetailFormError('Seleccione una incidencia antes de agregar el detalle.');
      return;
    }
    if (missingDetailReferences.length > 0) {
      setDetailFormError('Debe existir al menos un motivo de incidencia.');
      return;
    }

    const payload: Record<string, string | number | null> = {};
    for (const field of DETAIL_FIELDS) {
      const rawValue = (detailFormValues[field.key] ?? '').trim();
      if (field.required && rawValue === '') {
        setDetailFormError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
      if (rawValue === '') {
        payload[field.key] = field.key === 'id_producto' ? null : '';
      } else {
        payload[field.key] = rawValue;
      }
    }

    const cantidadAfectada = Number(payload.cantidad_afectada ?? 0);
    if (!Number.isFinite(cantidadAfectada) || cantidadAfectada < 0) {
      setDetailFormError('La cantidad afectada no puede ser negativa.');
      return;
    }

    const input: IncidenciaDetalleInput = {
      id_incidencia: selectedIncidenciaId,
      id_producto: payload.id_producto === null || payload.id_producto === '' ? null : Number(payload.id_producto),
      id_motivo: Number(payload.id_motivo),
      cantidad_afectada: cantidadAfectada,
      descripcion: String(payload.descripcion ?? '')
    };

    setSavingDetalle(true);
    try {
      if (editingDetalleId !== null) {
        await updateIncidenciaDetalle(editingDetalleId, input);
        setNotice('Detalle de incidencia actualizado correctamente.');
      } else {
        await createIncidenciaDetalle(input);
        setNotice('Detalle agregado a la incidencia correctamente.');
      }
      setIsDetailModalOpen(false);
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailFormError(error instanceof Error ? error.message : 'No se pudo guardar el detalle de la incidencia.');
    } finally {
      setSavingDetalle(false);
    }
  };

  const handleDeleteHeader = async (row: IncidenciaRow) => {
    if (!window.confirm(`Eliminar la incidencia #${row.id_incidencia} y todo su detalle?`)) return;
    setNotice(null);
    setLoadError(null);
    try {
      await deleteIncidencia(row.id_incidencia);
      setSelectedIncidenciaId(null);
      setDetalles([]);
      setNotice('Incidencia eliminada correctamente.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar la incidencia.');
    }
  };

  const handleDeleteDetalle = async (row: IncidenciaDetalleRow) => {
    if (!window.confirm(`Eliminar el detalle "${row.descripcion}" de la incidencia?`)) return;
    setNotice(null);
    setDetailError(null);
    try {
      await deleteIncidenciaDetalle(row.id_incidencia_detalle);
      setNotice('Detalle eliminado correctamente.');
      setDetailReloadToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar el detalle.');
    }
  };

  const handleQuickResolve = async () => {
    if (!selectedIncidencia || headerBusyAction) return;
    const resueltaId = findEstadoId('Resuelta') ?? findEstadoId('Cerrada');
    if (resueltaId === null) return;
    setHeaderBusyAction(true);
    setLoadError(null);
    try {
      await updateIncidencia(selectedIncidencia.id_incidencia, { id_estado: resueltaId });
      setNotice('Incidencia marcada como resuelta.');
      setReloadToken((token) => token + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
    } finally {
      setHeaderBusyAction(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredIncidencias = incidencias.filter((row) => {
    if (statusFilter !== 'todos' && String(row.id_estado) !== statusFilter) return false;
    if (normalizedQuery === '') return true;
    return [
      row.id_incidencia,
      row.descripcion,
      row.solucion_aplicada,
      row.punto_venta_nombre,
      row.visita_punto_venta_nombre,
      row.ruta_punto_venta_nombre,
      row.repositor_nombre,
      row.tipo_incidente_nombre,
      row.estado_nombre
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  const totalLineas = detalles.length;
  const totalAfectada = detalles.reduce((sum, row) => sum + Number(row.cantidad_afectada), 0);

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
        if (field.key === 'fecha_nueva_visita' && values.requiere_nueva_visita !== '1') {
          return null;
        }
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
                {field.required && !field.allowEmpty && <option value="" disabled>Seleccione...</option>}
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
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            Gestión y Seguimiento de Incidencias
          </h2>
          <p className="text-xs text-slate-500">
            Cabecera con visita/ruta, repositor, tipo/estado y detalle con producto, motivo y cantidad afectada.
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
            <span>Reportar Incidencia</span>
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
                placeholder="Buscar incidencia, PDV, repositor..."
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
              {estadosIncidencia.map((row) => (
                <option key={String(row.id_estado)} value={String(row.id_estado)}>
                  {String(row.descripcion ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Incidencias ({filteredIncidencias.length}/{incidencias.length})
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando incidencias...
                </span>
              </div>
            ) : filteredIncidencias.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                {incidencias.length === 0 ? 'No hay incidencias registradas.' : 'No se encontraron incidencias para el criterio de búsqueda.'}
              </div>
            ) : (
              filteredIncidencias.map((row) => (
                <button
                  key={row.id_incidencia}
                  type="button"
                  onClick={() => setSelectedIncidenciaId(row.id_incidencia)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedIncidenciaId === row.id_incidencia
                      ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">INCIDENCIA #{row.id_incidencia}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(row.estado_nombre)}`}>
                      {row.estado_nombre || '-'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{getIncidenciaTitle(row)}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(row.fecha_incidencia)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {row.repositor_nombre || 'Sin repositor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>{row.tipo_incidente_nombre || '-'}</span>
                    <span>{Number(row.total_lineas ?? 0)} líneas</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedIncidencia ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">INCIDENCIA #{selectedIncidencia.id_incidencia}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusBadgeClass(selectedIncidencia.estado_nombre)}`}>
                      {selectedIncidencia.estado_nombre || '-'}
                    </span>
                    {selectedIncidencia.requiere_nueva_visita ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800">Requiere nueva visita</span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{getIncidenciaTitle(selectedIncidencia)}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                      {selectedIncidencia.tipo_incidente_nombre || 'Sin tipo'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {selectedIncidencia.repositor_nombre || 'Sin repositor'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(selectedIncidencia.fecha_incidencia)}
                    </span>
                    {selectedIncidencia.fecha_nueva_visita && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Nueva visita: {formatDate(selectedIncidencia.fecha_nueva_visita)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    {selectedIncidencia.id_visita && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />Visita #{selectedIncidencia.id_visita}</span>}
                    {selectedIncidencia.id_ruta_detalle && <span className="inline-flex items-center gap-1"><Store className="w-3.5 h-3.5 text-slate-400" />Ruta #{selectedIncidencia.id_ruta} - Ord. {selectedIncidencia.orden_visita}</span>}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 space-y-2">
                    <div>
                      <p className="font-semibold text-slate-800">Descripción</p>
                      <p className="mt-0.5 whitespace-pre-wrap">{selectedIncidencia.descripcion}</p>
                    </div>
                    {selectedIncidencia.solucion_aplicada && (
                      <div>
                        <p className="font-semibold text-slate-800">Solución aplicada</p>
                        <p className="mt-0.5 whitespace-pre-wrap">{selectedIncidencia.solucion_aplicada}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {String(selectedIncidencia.estado_nombre ?? '').toLowerCase() !== 'resuelta' && String(selectedIncidencia.estado_nombre ?? '').toLowerCase() !== 'cerrada' && findEstadoId('Resuelta') !== null && (
                    <button
                      onClick={handleQuickResolve}
                      disabled={headerBusyAction}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {headerBusyAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Marcar Resuelta</span>
                    </button>
                  )}
                  <button onClick={() => openEditHeader(selectedIncidencia)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Incidencia</span>
                  </button>
                  <button onClick={() => handleDeleteHeader(selectedIncidencia)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Incidencia</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Líneas</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{totalLineas}</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-amber-600">Cantidad afectada</div>
                  <div className="text-lg font-bold text-amber-800 tabular-nums">{formatQty(totalAfectada)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Tipo</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">{selectedIncidencia.tipo_incidente_nombre || '-'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Estado</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">{selectedIncidencia.estado_nombre || '-'}</div>
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
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detalle de Incidencia</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Productos afectados, motivos y cantidades.</p>
                  </div>
                  <button onClick={openCreateDetalle} disabled={detailLoading} className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Detalle</span>
                  </button>
                </div>

                {detailLoading ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando detalle...
                    </span>
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Esta incidencia no tiene detalle registrado. Haz clic en "Agregar Detalle" para registrar las afectaciones.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalles.map((row) => (
                      <div key={row.id_incidencia_detalle} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{row.producto_nombre || 'Afectación general'}</h5>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.producto_codigo || row.motivo_nombre || '-'}</p>
                              <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{row.descripcion}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditDetalle(row)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded" title="Editar detalle">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteDetalle(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar detalle">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Cantidad</span>
                            <span className="font-mono font-semibold">{formatQty(row.cantidad_afectada)}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Motivo</span>
                            <span className="font-semibold">{row.motivo_nombre || '-'}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Unidad</span>
                            <span className="font-semibold">{row.producto_unidad || '-'}</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">Producto</span>
                            <span className="font-semibold">{row.producto_codigo || 'General'}</span>
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
              <AlertTriangle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Selecciona o crea una incidencia para visualizar su cabecera y detalle.</p>
            </div>
          )}
        </div>
      </div>

      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{editingIncidenciaId !== null ? 'Editar Incidencia' : 'Registrar Nueva Incidencia'}</h3>
              <button onClick={() => setIsHeaderModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleHeaderSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {missingHeaderReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Debe existir al menos un repositor, un tipo de incidente y un estado de incidencia.</span>
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
                  {savingHeader ? 'Guardando...' : 'Guardar Incidencia'}
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
              <h3 className="text-sm font-bold text-slate-900">{editingDetalleId !== null ? 'Editar Detalle de Incidencia' : 'Agregar Detalle a la Incidencia'}</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDetalleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {missingDetailReferences.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Debe existir al menos un motivo de incidencia.</span>
                </div>
              )}
              {renderFormFields(DETAIL_FIELDS, detailFormValues, handleDetailFieldChange)}
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
                  {savingDetalle ? 'Guardando...' : 'Guardar Detalle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

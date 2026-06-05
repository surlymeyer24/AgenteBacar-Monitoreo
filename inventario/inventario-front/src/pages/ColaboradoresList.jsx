import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Plus, Mail, MapPin, Briefcase,
  Trash2, Edit2, X, AlertCircle
} from 'lucide-react';
import { fetchUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../api/usuarioApi';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';

const DEPARTAMENTOS = [
  'Ingeniería',
  'Diseño UX/UI',
  'Recursos Humanos',
  'Ventas & Marketing',
  'Finanzas',
  'Soporte e IT',
  'Operaciones',
  'Gerencia',
];

const FORM_INICIAL = {
  nombre: '',
  email: '',
  cargo: '',
  departamento: 'Ingeniería',
  ubicacion: '',
  avatarUrl: '',
};

export default function ColaboradoresList() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDept, setFiltroDept] = useState('Todos');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Detail panel
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);

  function cargar() {
    setCargando(true);
    setError(null);
    fetchUsuarios()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el directorio de colaboradores'))
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargar(); }, []);

  const dataset = useMemo(() => {
    return lista.filter(u => {
      const matchSearch =
        (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.cargo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filtroDept === 'Todos' || u.departamento === filtroDept;
      return matchSearch && matchDept;
    });
  }, [lista, searchTerm, filtroDept]);

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormError('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (u, e) => {
    e.stopPropagation();
    setEditandoId(u.id);
    setForm({
      nombre: u.nombre || '',
      email: u.email || '',
      cargo: u.cargo || '',
      departamento: u.departamento || 'Ingeniería',
      ubicacion: u.ubicacion || '',
      avatarUrl: u.avatarUrl || '',
    });
    setFormError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormError('');
  };

  const onChangeCampo = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.cargo.trim()) {
      setFormError('Nombre, email y cargo son obligatorios.');
      return;
    }
    setGuardando(true);
    setFormError('');

    const body = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      cargo: form.cargo.trim(),
      departamento: form.departamento,
      ubicacion: form.ubicacion.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
    };

    const operacion = editandoId
      ? actualizarUsuario(editandoId, body)
      : crearUsuario(body);

    operacion
      .then(() => { cerrarModal(); cargar(); })
      .catch(() => setFormError('No se pudo guardar el colaborador. Verificá los datos.'))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (u, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Dar de baja a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    eliminarUsuario(u.id)
      .then(() => {
        setLista(prev => prev.filter(x => x.id !== u.id));
        if (usuarioDetalle?.id === u.id) setUsuarioDetalle(null);
      })
      .catch(() => alert('No se pudo eliminar el colaborador.'));
  };

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10 fade-in px-2 sm:px-6 lg:px-8 pt-4">

      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-slate-900 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Directorio de Colaboradores</h1>
            <p className="text-xs text-slate-500 mt-0.5">Administración de usuarios y sus roles corporativos.</p>
          </div>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Colaborador
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo o correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
          <span>Área:</span>
          <select
            value={filtroDept}
            onChange={e => setFiltroDept(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="Todos">Todos</option>
            {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="text-slate-500 text-xs font-semibold self-center">
          Colaboradores: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </div>

      {/* Grid */}
      {dataset.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
            <AlertCircle className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-950 text-base">No se encontraron colaboradores</h3>
            <p className="text-xs text-slate-500 max-w-sm">No hay registros que coincidan con los filtros actuales.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {dataset.map(u => (
            <div
              key={u.id}
              onClick={() => setUsuarioDetalle(u)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start gap-4">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.nombre}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:scale-105 transition-transform flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-lg">
                      {(u.nombre || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="space-y-1 overflow-hidden min-w-0">
                  <h3 className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors truncate">{u.nombre}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{u.cargo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-normal">Área</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                    {u.departamento || '—'}
                  </span>
                </div>
                {u.ubicacion && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-normal">Ubicación</span>
                    <div className="flex items-center justify-end gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[100px]">{u.ubicacion}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-1.5">
                <button
                  onClick={e => abrirModalEditar(u, e)}
                  className="p-1 px-2.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded font-medium transition-colors border border-transparent hover:border-blue-100"
                >
                  <Edit2 className="w-3 h-3 inline mr-1" />Editar
                </button>
                <button
                  onClick={e => handleEliminar(u, e)}
                  className="p-1 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-800 rounded font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />Baja
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo / Editar */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-950 text-sm">
                {editandoId ? 'Modificar Colaborador' : 'Registrar Nuevo Colaborador'}
              </h3>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej. Ana García"
                  value={form.nombre}
                  onChange={onChangeCampo}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Cargo / Puesto *</label>
                <input
                  type="text"
                  name="cargo"
                  required
                  placeholder="Ej. Analista de Sistemas"
                  value={form.cargo}
                  onChange={onChangeCampo}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Ej. ana.garcia@empresa.com"
                  value={form.email}
                  onChange={onChangeCampo}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Área / Departamento</label>
                  <select
                    name="departamento"
                    value={form.departamento}
                    onChange={onChangeCampo}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Ubicación / Sede</label>
                  <input
                    type="text"
                    name="ubicacion"
                    placeholder="Ej. Sede Central"
                    value={form.ubicacion}
                    onChange={onChangeCampo}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">URL de Avatar (opcional)</label>
                <input
                  type="text"
                  name="avatarUrl"
                  placeholder="https://..."
                  value={form.avatarUrl}
                  onChange={onChangeCampo}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel lateral de detalle */}
      {usuarioDetalle && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setUsuarioDetalle(null)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between translate-x-0 transition-transform duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-950 text-sm">Detalle del Colaborador</h3>
              <button onClick={() => setUsuarioDetalle(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="text-center space-y-2">
                {usuarioDetalle.avatarUrl ? (
                  <img
                    src={usuarioDetalle.avatarUrl}
                    alt={usuarioDetalle.nombre}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-blue-100 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-2xl">
                      {(usuarioDetalle.nombre || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-base">{usuarioDetalle.nombre}</h4>
                  <p className="text-xs font-semibold text-blue-600">{usuarioDetalle.cargo}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{usuarioDetalle.email}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Información Institucional</p>
                <div className="space-y-1.5 text-slate-600">
                  <p><span className="font-semibold text-slate-700">Área:</span> {usuarioDetalle.departamento || '—'}</p>
                  {usuarioDetalle.ubicacion && (
                    <p><span className="font-semibold text-slate-700">Sede:</span> {usuarioDetalle.ubicacion}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={e => { setUsuarioDetalle(null); abrirModalEditar(usuarioDetalle, e); }}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 inline mr-1.5" />Editar
              </button>
              <button
                onClick={() => setUsuarioDetalle(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

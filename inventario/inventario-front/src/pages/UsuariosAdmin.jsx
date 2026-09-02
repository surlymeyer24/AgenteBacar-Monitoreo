import { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, X, Mail, UserCog, Trash2, Edit2, RefreshCw } from 'lucide-react';
import {
  fetchUsuarios,
  lookupUsuarioAuth,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../api/usuarioApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioDataTable,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
  StudioFilterBar,
} from '../components/studio/StudioUi';
import TableFilters from '../components/TableFilters';
import { ROLES_SISTEMA, labelRolSistema, badgeClassRol } from '../constants/roles';

const FORM_INICIAL = {
  email: '',
  nombre: '',
  rol: 'VISUALIZADOR',
  activo: true,
  uid: '',
};

export default function UsuariosAdmin() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [buscandoAuth, setBuscandoAuth] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);

  function cargar() {
    setCargando(true);
    setError(null);
    fetchUsuarios()
      .then(setLista)
      .catch(() => setError('No se pudo cargar la lista de usuarios.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargar(); }, []);

  const conteos = useMemo(() => {
    const conPerfil = lista.filter(u => u.tienePerfil).length;
    const soloAuth = lista.filter(u => u.enAuth && !u.tienePerfil).length;
    return { total: lista.length, conPerfil, soloAuth };
  }, [lista]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return lista.filter(u => {
      const matchBuscar = !q
        || (u.nombre || '').toLowerCase().includes(q)
        || (u.email || '').toLowerCase().includes(q)
        || (u.id || '').toLowerCase().includes(q);
      let matchRol = true;
      if (filtroRol === 'SIN_ROL') {
        matchRol = !u.tienePerfil || !u.rol;
      } else if (filtroRol) {
        matchRol = u.rol === filtroRol;
      }
      return matchBuscar && matchRol;
    });
  }, [lista, buscar, filtroRol]);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setAuthInfo(null);
    setFormError('');
    setModalAbierto(true);
  }

  function abrirAsignarOEditar(u) {
    const tienePerfil = !!u.tienePerfil;
    setEditandoId(tienePerfil ? u.id : null);
    setForm({
      email: u.email || '',
      nombre: u.nombre || '',
      rol: u.rol || 'VISUALIZADOR',
      activo: u.activo !== false,
      uid: u.id || '',
    });
    setAuthInfo({
      uid: u.id,
      email: u.email,
      displayName: u.nombre,
      yaRegistrado: tienePerfil,
    });
    setFormError('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setFormError('');
    setAuthInfo(null);
  }

  async function buscarCuentaFirebase() {
    const email = form.email.trim();
    if (!email) {
      setFormError('Ingresá un correo para buscar en Firebase Auth.');
      return;
    }
    setBuscandoAuth(true);
    setFormError('');
    try {
      const info = await lookupUsuarioAuth(email);
      setAuthInfo(info);
      if (info.yaRegistrado && !editandoId) {
        setFormError('Ese correo ya tiene rol asignado en el inventario. Editá el registro existente.');
      } else if (info.displayName && !form.nombre.trim()) {
        setForm(f => ({ ...f, nombre: info.displayName }));
      }
      setForm(f => ({ ...f, uid: info.uid, email: info.email || email }));
    } catch (err) {
      setAuthInfo(null);
      setFormError(err.message || 'No se encontró la cuenta.');
    } finally {
      setBuscandoAuth(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.rol) {
      setFormError('Nombre, correo y rol son obligatorios.');
      return;
    }

    setGuardando(true);
    setFormError('');

    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
          activo: form.activo,
        });
      } else {
        let uid = authInfo?.uid || form.uid;
        if (!uid) {
          const info = await lookupUsuarioAuth(form.email.trim());
          if (info.yaRegistrado) {
            setFormError('Ese correo ya tiene rol asignado. Editá el registro existente.');
            return;
          }
          uid = info.uid;
          setAuthInfo(info);
        }
        await crearUsuario({
          uid,
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
        });
      }
      cerrarModal();
      cargar();
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }

  function handleEliminar(u) {
    if (!u.tienePerfil) {
      alert('Esta cuenta solo existe en Firebase Auth. No hay perfil de inventario para quitar.');
      return;
    }
    if (!window.confirm(`¿Quitar acceso de "${u.nombre || u.email}"?\n\nSe borra el registro de roles; la cuenta Firebase Auth no se elimina.`)) {
      return;
    }
    eliminarUsuario(u.id)
      .then(() => cargar())
      .catch(() => alert('No se pudo eliminar el usuario.'));
  }

  if (cargando) return <StudioLoading message="Cargando usuarios…" />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title="Usuarios y roles"
      subtitle={`${conteos.total} en Auth · ${conteos.conPerfil} con rol · ${conteos.soloAuth} sin rol asignado`}
      actions={(
        <>
          <StudioSecondaryButton onClick={cargar}>
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </StudioSecondaryButton>
          <StudioPrimaryButton onClick={abrirNuevo}>
            <Plus className="w-4 h-4" />
            Asignar rol
          </StudioPrimaryButton>
        </>
      )}
    >
      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            id="usuarios-buscar"
            value={buscar}
            onChange={setBuscar}
            placeholder="Nombre, correo o UID…"
          />
          <TableFilters.Select
            id="usuarios-rol"
            label="Rol"
            value={filtroRol}
            onChange={setFiltroRol}
          >
            <option value="">Todos</option>
            <option value="SIN_ROL">Sin rol</option>
            {ROLES_SISTEMA.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </TableFilters.Select>
        </TableFilters>
      </StudioFilterBar>

      <StudioDataTable>
        <table className={studioTableClass()}>
          <thead className={studioTheadClass()}>
            <tr>
              <th className={studioThClass()}>Usuario</th>
              <th className={studioThClass()}>Correo</th>
              <th className={studioThClass()}>Rol</th>
              <th className={studioThClass()}>Estado</th>
              <th className={`${studioThClass()} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${studioTdClass()} text-center text-slate-400 py-10`}>
                  No hay usuarios que coincidan con los filtros.
                </td>
              </tr>
            ) : filtrados.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/75">
                <td className={studioTdClass()}>
                  <div className="font-semibold text-slate-900">{u.nombre || '—'}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-[220px]" title={u.id}>
                    {u.id}
                  </div>
                </td>
                <td className={studioTdClass()}>
                  <span className="text-sm text-slate-700">{u.email || '—'}</span>
                </td>
                <td className={studioTdClass()}>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${badgeClassRol(u.rol)}`}>
                    {labelRolSistema(u.rol)}
                  </span>
                </td>
                <td className={studioTdClass()}>
                  {!u.tienePerfil ? (
                    <span className="text-amber-700 text-xs font-semibold">Solo Auth</span>
                  ) : u.activo !== false ? (
                    <span className="text-emerald-700 text-xs font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-600 text-xs font-semibold">Inactivo</span>
                  )}
                </td>
                <td className={`${studioTdClass()} text-right`}>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => abrirAsignarOEditar(u)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={u.tienePerfil ? 'Editar' : 'Asignar rol'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.tienePerfil ? (
                      <button
                        type="button"
                        onClick={() => handleEliminar(u)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Quitar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </StudioDataTable>

      <p className="text-xs text-slate-500 mt-4 flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        Se listan todas las cuentas de Firebase Auth. Las marcadas como «Solo Auth» aún no tienen rol en el inventario
        (efectivamente funcionan como visualizadores hasta que les asignes uno).
      </p>

      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 border-t-[3px] border-t-accent"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2.5 uppercase tracking-wide">
                <span className="w-1.5 h-5 rounded-full bg-accent shrink-0" aria-hidden />
                <UserCog className="w-4 h-4 text-purple-500 shrink-0" />
                {editandoId ? 'Editar usuario' : 'Asignar rol a cuenta Firebase'}
              </h3>
              <button type="button" onClick={cerrarModal} className="text-slate-400 hover:text-slate-600">
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
                <label className="text-slate-700 font-bold block mb-1">Correo (Firebase Auth) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={!!editandoId || !!form.uid}
                      placeholder="usuario@bacarsa.com.ar"
                      value={form.email}
                      onChange={e => {
                        setForm(f => ({ ...f, email: e.target.value }));
                        setAuthInfo(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50"
                    />
                  </div>
                  {!editandoId && !form.uid && (
                    <button
                      type="button"
                      onClick={buscarCuentaFirebase}
                      disabled={buscandoAuth}
                      className="px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shrink-0"
                    >
                      {buscandoAuth ? '…' : 'Buscar'}
                    </button>
                  )}
                </div>
                {authInfo && (
                  <p className="text-[10px] text-emerald-700 mt-1 font-mono">
                    UID: {authInfo.uid}
                    {authInfo.displayName ? ` · ${authInfo.displayName}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Rol del sistema *</label>
                <select
                  required
                  value={form.rol}
                  onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  {ROLES_SISTEMA.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {ROLES_SISTEMA.find(r => r.value === form.rol)?.descripcion}
                </p>
              </div>

              {editandoId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-700">Cuenta activa (desmarcar = solo lectura forzada)</span>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-60 text-white rounded-lg font-semibold"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudioPageShell>
  );
}

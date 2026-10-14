import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Smartphone, CheckCircle, Edit2, UserCheck, X, Check, BatteryCharging } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';
import { asignarCelular, actualizarCelular } from '../../api/celularApi';
import {
  CONDICION_CELULAR_LABELS,
  normalizarConCargador,
  normalizarCondicionCelular,
} from '../../constants/celulares';

function etiquetaCargador(celular) {
  const v = normalizarConCargador(celular?.conCargador);
  if (v === true) return 'Con cargador';
  if (v === false) return 'Sin cargador';
  return '—';
}

function etiquetaCondicion(celular) {
  const v = normalizarCondicionCelular(celular?.condicion);
  return CONDICION_CELULAR_LABELS[v] || '—';
}

function formDesdeCelular(celular) {
  const cargador = normalizarConCargador(celular?.conCargador);
  return {
    marca: celular?.marca ?? '',
    modelo: celular?.modelo ?? '',
    imei: celular?.imei ?? '',
    conCargador: cargador == null ? '' : cargador ? 'si' : 'no',
    condicion: normalizarCondicionCelular(celular?.condicion) || '',
    lineaNumero: celular?.lineaNumero ?? '',
    area: celular?.area ?? 'Depósito',
  };
}

export default function StockCelularesTab({ celularesEnStock }) {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formDesdeCelular(null));
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [asignando, setAsignando] = useState(null);
  const [asignarA, setAsignarA] = useState('');
  const [asignarArea, setAsignarArea] = useState('');
  const [asignarError, setAsignarError] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return celularesEnStock;
    return celularesEnStock.filter((c) => {
      const text = [c.marca, c.modelo, c.imei, c.lineaNumero, etiquetaCargador(c), etiquetaCondicion(c)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [celularesEnStock, buscar]);

  const totalNuevos = useMemo(
    () => celularesEnStock.filter((c) => normalizarCondicionCelular(c.condicion) === 'nuevo').length,
    [celularesEnStock],
  );

  function abrirEditar(celular) {
    setEditando(celular);
    setForm(formDesdeCelular(celular));
    setFormError('');
  }

  function abrirAsignar(celular) {
    setAsignando(celular);
    setAsignarA('');
    setAsignarArea(celular.area ? String(celular.area) : '');
    setAsignarError('');
  }

  async function handleGuardarEdicion(e) {
    e.preventDefault();
    if (!editando?.id) return;
    if (!form.marca.trim() || !form.modelo.trim() || !form.imei.trim()
        || !form.conCargador || !form.condicion) {
      setFormError('Marca, modelo, IMEI, cargador y condición son obligatorios.');
      return;
    }
    setGuardando(true);
    setFormError('');
    try {
      await actualizarCelular(editando.id, {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        imei: form.imei.trim(),
        conCargador: form.conCargador === 'si',
        condicion: form.condicion,
        lineaNumero: form.lineaNumero.trim() || undefined,
        area: form.area.trim() || 'Depósito',
        estado: 'en_stock',
      });
      await queryClient.invalidateQueries({ queryKey: ['celulares'] });
      setEditando(null);
    } catch (err) {
      setFormError(err?.message || 'No se pudo guardar el celular.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleConfirmarAsignacion() {
    if (!asignando) return;
    const responsable = asignarA.trim();
    if (!responsable) {
      setAsignarError('El responsable es obligatorio para asignar el celular');
      return;
    }
    setGuardandoAsignacion(true);
    setAsignarError('');
    try {
      await asignarCelular(asignando, {
        responsable,
        area: asignarArea.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['celulares'] });
      setAsignando(null);
    } catch (err) {
      setAsignarError(err?.message || 'No se pudo asignar el celular.');
    } finally {
      setGuardandoAsignacion(false);
    }
  }

  const vacioStock = celularesEnStock.length === 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">En depósito</span>
            <span className="text-3xl font-black font-mono text-sky-600">
              {celularesEnStock.length}
              {' '}
              <span className="text-base font-normal text-slate-400">celulares</span>
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Nuevos</span>
            <span className="text-3xl font-black font-mono text-slate-900">{totalNuevos}</span>
          </div>
        </div>
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por marca, modelo o IMEI…"
          />
        </TableFilters>
      </StudioFilterBar>

      {vacioStock ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-16 text-center">
          <div className="inline-flex p-3 bg-sky-50 text-sky-600 rounded-xl mb-3">
            <Smartphone className="w-7 h-7" />
          </div>
          <p className="text-slate-800 font-bold">No hay celulares en stock de depósito</p>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Cuando un celular esté en estado «En stock», va a aparecer acá para editarlo o asignarlo a un responsable.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Marca / Modelo</th>
                  <th className="py-4 px-5">IMEI</th>
                  <th className="py-4 px-5">Cargador</th>
                  <th className="py-4 px-5">Condición</th>
                  <th className="py-4 px-5 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center text-slate-400 font-medium">
                      Ningún celular coincide con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">{c.marca || '—'}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{c.modelo || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-slate-800 text-xs">{c.imei || '—'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-semibold text-slate-700">{etiquetaCargador(c)}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          etiquetaCondicion(c) === 'Nuevo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : etiquetaCondicion(c) === 'Usado'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        >
                          {etiquetaCondicion(c)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirAsignar(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Asignar
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirEditar(c)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="Editar celular"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  Editar celular en stock
                </span>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setEditando(null)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleGuardarEdicion} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                {formError ? (
                  <p className="text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Marca *</label>
                    <input
                      required
                      type="text"
                      value={form.marca}
                      onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Modelo *</label>
                    <input
                      required
                      type="text"
                      value={form.modelo}
                      onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>IMEI *</label>
                    <input
                      required
                      inputMode="numeric"
                      type="text"
                      value={form.imei}
                      onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Línea / Número</label>
                    <input
                      type="text"
                      value={form.lineaNumero}
                      onChange={(e) => setForm((f) => ({ ...f, lineaNumero: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Cargador *</label>
                    <select
                      required
                      value={form.conCargador}
                      onChange={(e) => setForm((f) => ({ ...f, conCargador: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Seleccionar…</option>
                      <option value="si">Con cargador</option>
                      <option value="no">Sin cargador</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Condición *</label>
                    <select
                      required
                      value={form.condicion}
                      onChange={(e) => setForm((f) => ({ ...f, condicion: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Seleccionar…</option>
                      <option value="nuevo">Nuevo</option>
                      <option value="usado">Usado</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Área</label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => setEditando(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold"
                  >
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {asignando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Asignar {asignando.marca || ''} {asignando.modelo || ''}
                </span>
                <button
                  type="button"
                  onClick={() => setAsignando(null)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                {asignarError ? (
                  <p className="text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {asignarError}
                  </p>
                ) : null}
                <p className="text-slate-500 font-medium">
                  IMEI:
                  {' '}
                  <span className="font-mono text-slate-800">{asignando.imei || '—'}</span>
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">Asignar a (responsable) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del responsable"
                    value={asignarA}
                    onChange={(e) => setAsignarA(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Área</label>
                  <input
                    type="text"
                    placeholder="Opcional — si falta se usa la del celular o Depósito"
                    value={asignarArea}
                    onChange={(e) => setAsignarArea(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignando(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarAsignacion}
                    disabled={!asignarA.trim() || guardandoAsignacion}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {guardandoAsignacion ? 'Asignando…' : 'Confirmar asignación'}
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Smartphone, Search, Edit2, Trash2, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImportModal from '../components/ImportModal';
import { celularesSchema } from '../lib/importSchemas/celularesSchema';
import {
  fetchCelulares,
  crearCelular,
  actualizarCelular,
  deleteCelular,
} from '../api/celularApi';
import {
  ESTADOS_CELULAR,
  ESTADO_CELULAR_LABELS,
  normalizarEstadoCelular,
} from '../constants/celulares';
import {
  StudioPageShell,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioLoading,
  StudioError,
} from '../components/studio/StudioUi';

const emptyForm = {
  marca: '',
  modelo: '',
  imei: '',
  lineaNumero: '',
  responsable: '',
  area: '',
  estado: 'activo',
};

function estadoBadgeClass(estado) {
  if (estado === 'activo') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (estado === 'en_stock') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
}

export default function CelularList() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  const [banner, setBanner] = useState('');

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchCelulares()
      .then(data => setLista(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudo cargar el inventario de celulares.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  const areas = useMemo(() => {
    const set = new Set(lista.map(c => c.area).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [lista]);

  const dataset = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return lista.filter(c => {
      if (filtroArea && c.area !== filtroArea) return false;
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (!q) return true;
      return [c.marca, c.modelo, c.imei, c.lineaNumero, c.responsable, c.area, c.estado]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [lista, searchTerm, filtroArea, filtroEstado]);

  function showBanner(msg) {
    setBanner(msg);
    setTimeout(() => setBanner(''), 4000);
  }

  function abrirNuevo() {
    setIsEdit(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setIsEdit(true);
    setEditingId(item.id);
    setForm({
      marca: item.marca ?? '',
      modelo: item.modelo ?? '',
      imei: item.imei ?? '',
      lineaNumero: item.lineaNumero ?? '',
      responsable: item.responsable ?? '',
      area: item.area ?? '',
      estado: item.estado ?? 'activo',
    });
    setFormError('');
    setModalAbierto(true);
  }

  async function handleDelete(item) {
    const label = `${item.marca ?? ''} ${item.modelo ?? ''}`.trim() || item.id;
    if (!window.confirm(`¿Eliminar celular "${label}"?`)) return;
    try {
      await deleteCelular(item.id);
      showBanner('Celular eliminado.');
      cargarLista();
    } catch {
      window.alert('No se pudo eliminar el celular.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim() || !form.area.trim()) {
      setFormError('Marca, modelo y área son obligatorios.');
      return;
    }
    const body = {
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      imei: form.imei.trim() || undefined,
      lineaNumero: form.lineaNumero.trim() || undefined,
      responsable: form.responsable.trim() || undefined,
      area: form.area.trim(),
      estado: normalizarEstadoCelular(form.estado),
    };
    setGuardando(true);
    setFormError('');
    try {
      if (isEdit) {
        await actualizarCelular(editingId, body);
        showBanner('Celular actualizado.');
      } else {
        await crearCelular(body);
        showBanner('Celular registrado.');
      }
      setModalAbierto(false);
      cargarLista();
    } catch (err) {
      setFormError(err?.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleImport(rows) {
    setImportando(true);
    let ok = 0;
    let fail = 0;
    for (const row of rows) {
      if (!row.marca?.trim() || !row.modelo?.trim() || !row.area?.trim()) continue;
      try {
        await crearCelular({
          marca: String(row.marca).trim(),
          modelo: String(row.modelo).trim(),
          imei: row.imei ? String(row.imei).trim() : undefined,
          lineaNumero: row.lineaNumero ? String(row.lineaNumero).trim() : undefined,
          responsable: row.responsable ? String(row.responsable).trim() : undefined,
          area: String(row.area).trim(),
          estado: normalizarEstadoCelular(row.estado),
        });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    showBanner(`Importación: ${ok} creados${fail ? `, ${fail} con error` : ''}.`);
    cargarLista();
  }

  if (cargando) return <StudioLoading message="Cargando celulares…" />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title={`Celulares (${lista.length})`}
      subtitle="Móviles corporativos asignados o en stock."
      actions={
        <>
          <StudioSecondaryButton requiresWrite onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton requiresWrite onClick={abrirNuevo}>
            Registrar celular
          </StudioPrimaryButton>
        </>
      }
    >
      <AnimatePresence>
        {banner ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{banner}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, IMEI, línea, responsable…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <select
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs min-w-[140px]"
          >
            <option value="">Todas las áreas</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs min-w-[140px]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_CELULAR.map(e => (
              <option key={e} value={e}>{ESTADO_CELULAR_LABELS[e]}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Visibles: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataset.map(cel => (
          <div
            key={cel.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{cel.marca}</h3>
                    <p className="text-sm text-slate-500">{cel.modelo}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold border ${estadoBadgeClass(cel.estado)}`}>
                  {ESTADO_CELULAR_LABELS[cel.estado] ?? cel.estado}
                </span>
              </div>
              <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <p><strong>Área:</strong> {cel.area || '—'}</p>
                <p><strong>Responsable:</strong> {cel.responsable || '—'}</p>
                <p><strong>Línea:</strong> <span className="font-mono">{cel.lineaNumero || '—'}</span></p>
                <p><strong>IMEI:</strong> <span className="font-mono">{cel.imei || '—'}</span></p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => abrirEditar(cel)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-sm text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md font-semibold"
              >
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cel)}
                className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-md"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {dataset.length === 0 ? (
          <div className="col-span-full bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic text-sm">
            No hay celulares registrados o no coinciden con los filtros.
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {modalAbierto ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border-t-[3px] border-t-accent"
            >
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-6 rounded-full bg-accent shrink-0" aria-hidden />
                  <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                    {isEdit ? 'Editar celular' : 'Registrar celular'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => !guardando && setModalAbierto(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700">
                {formError ? (
                  <p className="text-rose-600 font-medium">{formError}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Marca *</label>
                    <input
                      required
                      type="text"
                      value={form.marca}
                      onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-normal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Modelo *</label>
                    <input
                      required
                      type="text"
                      value={form.modelo}
                      onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-normal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Área *</label>
                    <input
                      required
                      type="text"
                      value={form.area}
                      onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="Ej. Ventas, Administración"
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-normal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Responsable</label>
                    <input
                      type="text"
                      value={form.responsable}
                      onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-normal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>IMEI</label>
                    <input
                      type="text"
                      value={form.imei}
                      onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-mono font-normal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Línea / Número</label>
                    <input
                      type="text"
                      value={form.lineaNumero}
                      onChange={e => setForm(f => ({ ...f, lineaNumero: e.target.value }))}
                      className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-mono font-normal"
                      placeholder="+54 9 …"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Estado *</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-normal"
                  >
                    {ESTADOS_CELULAR.map(e => (
                      <option key={e} value={e}>{ESTADO_CELULAR_LABELS[e]}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-normal"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-[#0c66e4] text-white rounded-lg shadow-sm hover:bg-[#0055cc] disabled:opacity-60"
                  >
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={celularesSchema}
        entityName="Celulares"
        isImporting={importando}
        existingData={lista}
      />
    </StudioPageShell>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Monitor } from 'lucide-react';
import { createComputadora } from '../api/computadoraApi';
import { UBICACIONES_COMPUTADORA } from '../constants/ubicaciones';
import { useComputadorasList } from '../context/ComputadorasListContext';
import FriendlySelect from '../components/FriendlySelect';

const empty = {
  hostname: '',
  usuarioActual: '',
  ubicacion: '',
  sistemaOperativo: '',
  arquitectura: '',
  motivo: '',
};

function ComputadoraNueva() {
  const navigate = useNavigate();
  const { mergeEnListado } = useComputadorasList();
  const [form, setForm] = useState(empty);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  function cerrar() {
    navigate('/computadoras');
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const hostname = form.hostname.trim();
    if (!hostname) {
      setError('El hostname es obligatorio.');
      return;
    }
    const body = { hostname };
    const u = form.usuarioActual.trim();
    const ub = form.ubicacion.trim();
    const so = form.sistemaOperativo.trim();
    const ar = form.arquitectura.trim();
    if (u) body.usuarioActual = u;
    if (ub) body.ubicacion = ub;
    if (so) body.sistemaOperativo = so;
    if (ar) body.arquitectura = ar;
    const mo = form.motivo.trim();
    if (mo) body.motivo = mo;

    setEnviando(true);
    createComputadora(body)
      .then(c => {
        if (c?.uuid) {
          mergeEnListado?.(c);
          navigate(`/computadoras/${encodeURIComponent(c.uuid)}`);
        } else {
          navigate('/computadoras');
        }
      })
      .catch(() => setError('No se pudo crear la computadora. Revisá hostname y ubicación (enum válido).'))
      .finally(() => setEnviando(false));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      onClick={cerrar}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl border-t-[3px] border-t-accent flex flex-col w-full max-w-2xl max-h-full overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-pc-title"
      >
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-1.5 h-6 rounded-full bg-accent shrink-0" aria-hidden />
            <Monitor className="w-5 h-5 text-emerald-600 shrink-0" />
            <span id="nueva-pc-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide truncate">
              Nueva computadora
            </span>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 font-bold text-xs text-slate-700 overflow-y-auto">
          <p className="text-xs font-medium text-slate-500 normal-case tracking-normal">
            El servidor genera el UUID. Podés cargar periféricos después desde el detalle del equipo.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Hostname *
              </label>
              <input
                name="hostname"
                value={form.hostname}
                onChange={onChange}
                required
                autoComplete="off"
                className="inventory-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Usuario actual
              </label>
              <input
                name="usuarioActual"
                value={form.usuarioActual}
                onChange={onChange}
                autoComplete="off"
                className="inventory-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Ubicación
              </label>
              <FriendlySelect
                name="ubicacion"
                value={form.ubicacion}
                placeholder="Sin definir"
                options={[
                  { value: '', label: 'Sin definir' },
                  ...UBICACIONES_COMPUTADORA.map(u => ({ value: u, label: u })),
                ]}
                onChange={next => onChange({ target: { name: 'ubicacion', value: next } })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Sistema operativo
              </label>
              <input
                name="sistemaOperativo"
                value={form.sistemaOperativo}
                onChange={onChange}
                className="inventory-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Arquitectura
              </label>
              <input
                name="arquitectura"
                value={form.arquitectura}
                onChange={onChange}
                placeholder="Ej. x64"
                className="inventory-input"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Motivo del alta
              </label>
              <input
                name="motivo"
                value={form.motivo}
                onChange={onChange}
                placeholder="Ej. Compra orden #123"
                className="inventory-input"
              />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={cerrar}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              {enviando ? 'Creando…' : 'Crear computadora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComputadoraNueva;

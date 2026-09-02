import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { actualizarProgresoLogistica, fetchProgresoLogistica } from '../api/etiquetaQrApi';
import { FASES, calcularResumenProgreso } from '../utils/logisticaProgreso';
import { esPerifericoParaFichaQr } from '../utils/perifericos';

const ESTILOS_FASE = {
  etiquetado: {
    texto: 'text-indigo-700',
    textoFuerte: 'text-indigo-950',
    fondo: 'bg-indigo-50',
    borde: 'border-indigo-200',
    barra: 'bg-indigo-600',
    barraFondo: 'bg-indigo-100',
    activo: 'bg-indigo-600 text-white border-indigo-600',
    marca: 'bg-indigo-600 text-white',
    tarjeta: 'bg-indigo-50/70 border-indigo-300',
  },
  embalado: {
    texto: 'text-amber-700',
    textoFuerte: 'text-amber-950',
    fondo: 'bg-amber-50',
    borde: 'border-amber-200',
    barra: 'bg-amber-500',
    barraFondo: 'bg-amber-100',
    activo: 'bg-amber-500 text-white border-amber-500',
    marca: 'bg-amber-500 text-white',
    tarjeta: 'bg-amber-50/70 border-amber-300',
  },
  destino: {
    texto: 'text-emerald-700',
    textoFuerte: 'text-emerald-950',
    fondo: 'bg-emerald-50',
    borde: 'border-emerald-200',
    barra: 'bg-emerald-500',
    barraFondo: 'bg-emerald-100',
    activo: 'bg-emerald-600 text-white border-emerald-600',
    marca: 'bg-emerald-600 text-white',
    tarjeta: 'bg-emerald-50/70 border-emerald-300',
  },
};

function vibrar(patron) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(patron);
}

function fmtActualizado(iso) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function nombreUsuario(usuario) {
  return usuario?.nombre || usuario?.email || usuario?.uid || 'Usuario desconocido';
}

export function EtiquetaQrChecklistProgreso({ ficha }) {
  const [faseActiva, setFaseActiva] = useState('etiquetado');
  const [marcas, setMarcas] = useState({});
  const [actualizado, setActualizado] = useState(null);
  const [ultimoUsuario, setUltimoUsuario] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const esNotebook = (ficha?.tipoEquipo ?? '').toLowerCase().includes('notebook');
  const monitores = useMemo(() => ficha?.monitores ?? [], [ficha]);
  const perifericos = useMemo(
    () => (ficha?.perifericos ?? []).filter(esPerifericoParaFichaQr),
    [ficha],
  );

  const items = useMemo(() => {
    if (!ficha) return [];
    const list = [
      {
        id: `pc-${ficha.uuid}`,
        tipo: esNotebook ? 'Notebook' : 'Gabinete PC',
        nombre: ficha.hostname,
        detalle: `${ficha.tipoEquipo} · ${labelUbicacionEnum(ficha.ubicacion)}`,
        serial: ficha.uuid,
      },
    ];

    monitores.forEach((m, idx) => {
      list.push({
        id: `mon-${idx}-${m.nombre}`,
        tipo: 'Monitor',
        nombre: m.nombre,
        detalle: m.detalle || 'Pantalla externa',
        serial: m.numeroSerie || '',
      });
    });

    perifericos.forEach((p, idx) => {
      list.push({
        id: `perif-${idx}-${p.nombre}`,
        tipo: p.tipo || 'Periférico',
        nombre: p.nombre,
        detalle: p.detalle || 'Accesorio de puesto',
        serial: p.numeroSerie || '',
      });
    });

    return list;
  }, [ficha, monitores, perifericos, esNotebook]);

  const itemIds = useMemo(() => items.map(it => it.id), [items]);

  const resumen = useMemo(() => calcularResumenProgreso(marcas, itemIds), [marcas, itemIds]);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError('');
    fetchProgresoLogistica(ficha.uuid)
      .then(data => {
        if (cancelado || !data) return;
        setMarcas(data.marcas ?? {});
        setActualizado(data.ultimaActualizacion ?? null);
        setUltimoUsuario(data.ultimoUsuario ?? null);
        setHistorial(Array.isArray(data.historial) ? data.historial : []);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el progreso logístico.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [ficha.uuid]);

  function aplicarRespuesta(data) {
    if (!data) return;
    setMarcas(data.marcas ?? {});
    setActualizado(data.ultimaActualizacion ?? null);
    setUltimoUsuario(data.ultimoUsuario ?? null);
    setHistorial(Array.isArray(data.historial) ? data.historial : []);
  }

  async function persistir(itemIdsAfectados, completado) {
    setGuardando(true);
    setError('');
    try {
      const data = await actualizarProgresoLogistica(ficha.uuid, {
        fase: faseActiva,
        itemIds: itemIdsAfectados,
        completado,
      });
      aplicarRespuesta(data);
    } catch {
      setError('No se pudo guardar el cambio. Intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
  }

  function toggleItem(itemId) {
    vibrar(35);
    persistir([itemId], !marcas[faseActiva]?.[itemId]);
  }

  function marcarTodos() {
    vibrar([40, 60, 40]);
    persistir(itemIds, true);
  }

  function reiniciarFase() {
    persistir(itemIds, false);
  }

  const estiloActivo = ESTILOS_FASE[faseActiva];
  const faseInfo = FASES.find(f => f.id === faseActiva);
  const avanceFase = resumen.porFase[faseActiva];
  const faseCompleta = avanceFase.total > 0 && avanceFase.pct === 100;
  const fechaActualizado = fmtActualizado(actualizado);

  if (cargando) {
    return (
      <div className="p-10 rounded-2xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
        <RefreshIndicator />
        Cargando progreso logístico...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 min-w-0">
              Progreso: <span className={estiloActivo.texto}>{faseInfo.label}</span>
            </h3>
          </div>
          <div className="hidden sm:block text-right text-xs font-mono text-slate-400 shrink-0">
            {guardando ? (
              <span>Guardando...</span>
            ) : fechaActualizado ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fechaActualizado}
                </span>
                {ultimoUsuario && <span className="block mt-0.5">por {nombreUsuario(ultimoUsuario)}</span>}
              </>
            ) : null}
          </div>
        </div>

        <div className="px-1 sm:px-6 pt-1">
          <div className="flex items-start">
            {FASES.map((fase, i) => {
              const avance = resumen.porFase[fase.id];
              const hecha = avance.pct === 100;
              const activa = faseActiva === fase.id;
              const circuloOn = hecha || activa;
              const lineaPct = i < FASES.length - 1
                ? (hecha ? 100 : activa ? 50 : 0)
                : null;

              return (
                <div key={fase.id} className={`flex items-start ${i < FASES.length - 1 ? 'flex-1' : 'shrink-0'}`}>
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => setFaseActiva(fase.id)}
                    title={fase.label}
                    aria-label={fase.label}
                    className="flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 shrink-0 disabled:opacity-60"
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-colors ${
                        circuloOn ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      {fase.orden}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {avance.marcadas}/{avance.total}
                    </span>
                  </button>

                  {lineaPct != null && (
                    <div className="flex-1 h-10 flex items-center px-1">
                      <div className="w-full h-[3px] bg-slate-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${lineaPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {faseCompleta ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              Fase &quot;{faseInfo.label}&quot; completa en este puesto.
            </span>
            <button
              type="button"
              disabled={guardando}
              onClick={reiniciarFase}
              className="text-xs text-emerald-700 underline font-normal cursor-pointer shrink-0"
            >
              Reiniciar fase
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-1 text-xs">
            <button
              type="button"
              disabled={guardando}
              onClick={marcarTodos}
              className={`font-bold underline cursor-pointer ${estiloActivo.texto} shrink-0`}
            >
              Marcar todos listos
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {items.map(it => {
          const isChecked = !!marcas[faseActiva]?.[it.id];

          return (
            <div
              key={it.id}
              onClick={() => {
                if (!guardando) toggleItem(it.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none shadow-2xs ${
                isChecked ? estiloActivo.tarjeta : 'bg-white border-slate-200 hover:bg-slate-50'
              } ${guardando ? 'opacity-60 cursor-wait' : ''}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isChecked ? estiloActivo.marca : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isChecked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {it.tipo}
                    </span>
                    {FASES.filter(f => f.id !== faseActiva && marcas[f.id]?.[it.id]).map(f => (
                      <span
                        key={f.id}
                        className={`text-xs font-bold ${ESTILOS_FASE[f.id].texto}`}
                        title={`${f.label} completado`}
                      >
                        {f.label} ✓
                      </span>
                    ))}
                  </div>
                  <p
                    className={`font-bold text-base truncate ${
                      isChecked ? 'line-through text-slate-600' : 'text-slate-900'
                    }`}
                  >
                    {it.nombre}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{it.detalle}</p>
                  {it.serial && <p className="text-xs font-mono text-slate-400">S/N: {it.serial}</p>}
                </div>
              </div>

              <div className="shrink-0 text-slate-300">
                {isChecked ? (
                  <Check className={`w-5 h-5 ${estiloActivo.texto}`} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {historial.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono mb-3">
            Actividad reciente
          </h4>
          <div className="space-y-2">
            {historial.slice(0, 8).map((actividad, idx) => (
              <div
                key={`${actividad.fechaHora}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-t border-slate-100 first:border-0 text-sm"
              >
                <span className="text-slate-700">
                  <strong>{nombreUsuario(actividad.usuario)}</strong>{' '}
                  {actividad.accion === 'MARCAR' ? 'marcó' : 'desmarcó'} {actividad.itemIds?.length ?? 0}{' '}
                  elemento(s) en <span className="font-bold">{actividad.fase}</span>.
                </span>
                <span className="font-mono text-xs text-slate-400 shrink-0">
                  {fmtActualizado(actividad.fechaHora)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">
        El avance y su historial de usuarios quedan guardados en la base de datos.
      </p>
    </div>
  );
}

function RefreshIndicator() {
  return <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin mr-2" />;
}

export default EtiquetaQrChecklistProgreso;

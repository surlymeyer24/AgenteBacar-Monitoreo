import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchComputadora,
  updateUbicacion,
  updateEstado,
  updateResponsableInventario,
  deleteComputadora,
} from '../api/computadoraApi';
import { useOptionalComputadorasList } from '../context/ComputadorasListContext';
import AgregarPerifericoForms from '../components/AgregarPerifericoForms';
import { UBICACIONES_COMPUTADORA } from '../constants/ubicaciones';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { textoConexionAgente } from '../utils/estadoConexion';
import { filtrarUsbParaInventario, filtrarAudioParaInventario } from '../utils/perifericos';

function fmtFechaIso(s) {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR');
}

/** Fecha/hora legible en es-AR y texto relativo (“hace 5 minutos”). */
function textoHaceDesde(date) {
  let diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return 'fecha en el futuro';
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'hace instantes';
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? 'hace 1 minuto' : `hace ${min} minutos`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`;
  const days = Math.floor(h / 24);
  if (days < 7) return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months < 12) return months <= 1 ? 'hace ~1 mes' : `hace ~${months} meses`;
  const years = Math.floor(days / 365);
  return years <= 1 ? 'hace más de 1 año' : `hace más de ${years} años`;
}

function fmtUltimaSincronizacion(raw) {
  if (raw == null || raw === '') return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  const legible = d.toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const rel = textoHaceDesde(d);
  return `${legible} (${rel})`;
}

function siNo(v) {
  if (v == null) return '—';
  return v ? 'Sí' : 'No';
}

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return '—';
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : '—';
}

const PROGRAMA_COL_PRIORITY = [
  'documentoId', 'nombre', 'name', 'version', 'editor', 'fabricante', 'publisher',
  'ruta', 'ruta_instalacion', 'install_location',
];

function columnasProgramas(programas) {
  if (!programas?.length) return [];
  const keys = new Set();
  for (const p of programas) Object.keys(p).forEach(k => keys.add(k));
  const pri = PROGRAMA_COL_PRIORITY.filter(k => keys.has(k));
  const rest = [...keys].filter(k => !PROGRAMA_COL_PRIORITY.includes(k)).sort();
  return [...pri, ...rest];
}

function etiquetaColumnaPrograma(clave) {
  const m = {
    documentoId: 'ID documento',
    nombre: 'Nombre',
    name: 'Nombre',
    version: 'Versión',
    editor: 'Editor',
    fabricante: 'Fabricante',
    publisher: 'Editor',
    ruta: 'Ruta',
    ruta_instalacion: 'Ruta de instalación',
    install_location: 'Ruta de instalación',
  };
  return m[clave] ?? clave;
}

function celdaPrograma(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const WIN_VER_KEYS_ORDER = ['edicion', 'display_version', 'build', 'ubr', 'build_lab'];

const WIN_VER_LABELS = {
  edicion: 'Edición',
  display_version: 'Versión mostrada',
  build: 'Build',
  ubr: 'UBR',
  build_lab: 'Build lab',
};

function clavesWindowsVersionDetallada(m) {
  if (!m || typeof m !== 'object') return [];
  const keys = new Set(Object.keys(m));
  const ordered = WIN_VER_KEYS_ORDER.filter(k => keys.has(k));
  const rest = [...keys].filter(k => !WIN_VER_KEYS_ORDER.includes(k)).sort();
  return [...ordered, ...rest];
}

function valorWindowsDetallado(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ComputadoraDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const listado = useOptionalComputadorasList();
  const mergeEnListadoRef = useRef(listado?.mergeEnListado);
  mergeEnListadoRef.current = listado?.mergeEnListado;
  const [c, setC] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ubicacionSel, setUbicacionSel] = useState('');
  const [guardandoUbi, setGuardandoUbi] = useState(false);
  const [msgUbi, setMsgUbi] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [textoResponsableInv, setTextoResponsableInv] = useState('');
  const [guardandoRi, setGuardandoRi] = useState(false);
  const [msgRi, setMsgRi] = useState(null);
  const [solapa, setSolapa] = useState('hardware');
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchComputadora(uuid)
      .then(data => {
        if (cancelled) return;
        setC(data);
        if (data?.ubicacion) setUbicacionSel(data.ubicacion);
        setTextoResponsableInv(data?.responsableInventario ?? '');
        if (data) mergeEnListadoRef.current?.(data);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el detalle');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!c) return <p className="estado-msg">Computadora no encontrada</p>;

  function guardarUbicacion(e) {
    e.preventDefault();
    if (!ubicacionSel) return;
    setGuardandoUbi(true);
    setMsgUbi(null);
    updateUbicacion(uuid, ubicacionSel)
      .then(data => {
        if (data) {
          setC(data);
          listado?.mergeEnListado?.(data);
        } else setMsgUbi('No se encontró la computadora');
      })
      .catch(() => setMsgUbi('No se pudo guardar la ubicación'))
      .finally(() => setGuardandoUbi(false));
  }

  function guardarResponsableInventario(e) {
    e.preventDefault();
    setGuardandoRi(true);
    setMsgRi(null);
    updateResponsableInventario(uuid, textoResponsableInv.trim() || null)
      .then(data => {
        if (data) {
          setC(data);
          setTextoResponsableInv(data.responsableInventario ?? '');
          listado?.mergeEnListado?.(data);
        } else {
          setMsgRi('No se encontró la computadora');
        }
      })
      .catch(() => setMsgRi('No se pudo guardar el asignado (IT)'))
      .finally(() => setGuardandoRi(false));
  }

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstado(uuid, estadoSel, motivoEstado.trim())
      .then(data => {
        if (data) {
          setC(data);
          setMotivoEstado('');
          listado?.mergeEnListado?.(data);
        } else {
          setMsgEstado('No se encontró la computadora');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  function solicitarEliminar() {
    const nombre = (c.hostname && String(c.hostname).trim()) ? c.hostname : 'esta PC';
    if (
      !window.confirm(
        `¿Seguro que querés borrar la computadora "${nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setEliminando(true);
    setMsgEliminar(null);
    deleteComputadora(uuid)
      .then(ok => {
        if (ok) {
          listado?.removeEnListado?.(uuid);
          navigate('/computadoras');
        } else setMsgEliminar('No se encontró la computadora (quizá ya fue borrada).');
      })
      .catch(() => setMsgEliminar('No se pudo eliminar la computadora'))
      .finally(() => setEliminando(false));
  }

  const historial = c.historialEstados ?? [];
  const programas = c.programas ?? [];
  const colsProgramas = columnasProgramas(programas);
  const winVer = c.windowsVersionDetallada;
  const winVerKeys = clavesWindowsVersionDetallada(winVer);

  return (
    <div className="page">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/computadoras')}>
          ← Volver
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={solicitarEliminar}
          disabled={eliminando}
        >
          {eliminando ? 'Eliminando…' : 'Eliminar esta PC'}
        </button>
      </div>
      {msgEliminar && (
        <p className="page error" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          {msgEliminar}
        </p>
      )}

      <h1 style={{ marginTop: '0.75rem' }}>{c.hostname}</h1>

      <div className="detail-tabs-block detail-tabs-block--tabs-only">
        <div className="detail-tabs detail-tabs--in-block" role="tablist" aria-label="Vista de computadora">
          <button
            type="button"
            role="tab"
            aria-selected={solapa === 'hardware'}
            className={`detail-tab${solapa === 'hardware' ? ' detail-tab--active' : ''}`}
            onClick={() => setSolapa('hardware')}
          >
            Hardware
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={solapa === 'software'}
            className={`detail-tab${solapa === 'software' ? ' detail-tab--active' : ''}`}
            onClick={() => setSolapa('software')}
          >
            Software
          </button>
        </div>
      </div>

      {solapa === 'hardware' && (
      <>
      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>UUID</dt><dd className="uuid">{c.uuid}</dd>
          <dt>Usuario</dt><dd>{c.usuarioActual}</dd>
          <dt>Ubicación</dt><dd>{c.ubicacion ?? '—'}</dd>
          <dt>Sistema operativo</dt><dd>{c.sistemaOperativo}</dd>
          <dt>Arquitectura</dt><dd>{c.arquitectura}</dd>
          <dt>Conexión (agente)</dt><dd>{textoConexionAgente(c)}</dd>
          {(c.estadoConexion != null && c.estadoConexion !== '') && (
            <><dt>Estado conexión (crudo)</dt><dd className="uuid">{c.estadoConexion}</dd></>
          )}
          <dt>Última sincronización</dt><dd>{fmtUltimaSincronizacion(c.ultimaSincronizacion)}</dd>
          <dt>Estado (IT)</dt><dd>{c.estadoActual ?? '—'}</dd>
        </dl>
        <form className="ubicacion-form ubicacion-form--assign" onSubmit={guardarResponsableInventario}>
          <label htmlFor="responsable-inv-pc">Asignado en inventario</label>
          <div className="ubicacion-form-row">
            <input
              id="responsable-inv-pc"
              type="text"
              value={textoResponsableInv}
              onChange={e => setTextoResponsableInv(e.target.value)}
              placeholder="Nombre, legajo o referencia"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardandoRi}>
              {guardandoRi ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {msgRi && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgRi}</p>}
        </form>
        <form className="ubicacion-form" onSubmit={guardarUbicacion} style={{ marginTop: '1rem' }}>
          <label htmlFor="ubicacion-pc">Cambiar ubicación</label>
          <div className="ubicacion-form-row">
            <select
              id="ubicacion-pc"
              value={ubicacionSel}
              onChange={e => setUbicacionSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {UBICACIONES_COMPUTADORA.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardandoUbi || !ubicacionSel}>
              {guardandoUbi ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {msgUbi && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgUbi}</p>}
        </form>
        <form className="ubicacion-form" style={{ marginTop: '1rem' }} onSubmit={guardarEstado}>
          <label htmlFor="estado-pc">Cambiar estado (IT)</label>
          <div className="ubicacion-form-row">
            <select
              id="estado-pc"
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_OPERATIVOS.map(k => (
                <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
          <label htmlFor="motivo-estado-pc" style={{ marginTop: '0.5rem', display: 'block' }}>Motivo (obligatorio)</label>
          <textarea
            id="motivo-estado-pc"
            rows={3}
            value={motivoEstado}
            onChange={e => setMotivoEstado(e.target.value)}
            placeholder="Ej.: alta en inventario, corrección de datos… (si elegís automático, explicá el motivo del ajuste)"
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={guardandoEstado || !estadoSel || !motivoEstado.trim()}
            >
              {guardandoEstado ? 'Guardando…' : 'Cambiar estado'}
            </button>
          </div>
          {msgEstado && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgEstado}</p>}
        </form>
        <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Historial de estados (IT)</h3>
        {historial.length === 0 ? (
          <p className="estado-msg">Sin cambios de estado registrados</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td>{h.estado ?? '—'}</td>
                    <td>{h.motivo ?? '—'}</td>
                    <td className="uuid">{fmtFechaIso(h.fechaHoraInicio)}</td>
                    <td className="uuid">{fmtFechaIso(h.fechaHoraFin)}</td>
                    <td>{h.activo ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {c.procesador && (
        <div className="card">
          <h2>Procesador</h2>
          <dl className="detail-dl">
            <dt>Modelo</dt><dd>{c.procesador.nombreRaw}</dd>
            <dt>Núcleos físicos</dt><dd>{c.procesador.nucleosFisicos}</dd>
            <dt>Arquitectura</dt><dd>{c.procesador.arquitectura}</dd>
            <dt>Fabricante</dt><dd>{c.procesador.fabricante}</dd>
          </dl>
        </div>
      )}

      {c.discos?.length > 0 && (
        <div className="card">
          <h2>Discos</h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Modelo</th>
                  <th>Total GB</th>
                  <th>Libre GB</th>
                  <th>Usado GB</th>
                  <th>% Usado</th>
                </tr>
              </thead>
              <tbody>
                {c.discos.map((d, i) => (
                  <tr key={i}>
                    <td>{d.tipoDisco}</td>
                    <td>{d.modeloDisco}</td>
                    <td>{d.totalGB?.toFixed(1)}</td>
                    <td>{d.libreGB?.toFixed(1)}</td>
                    <td>{d.usadoGB?.toFixed(1)}</td>
                    <td>{d.porcentajeUsado?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {c.modulos?.length > 0 && (
        <div className="card">
          <h2>RAM</h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Capacidad GB</th>
                  <th>Velocidad MHz</th>
                  <th>Modelo</th>
                  <th>Fabricante</th>
                </tr>
              </thead>
              <tbody>
                {c.modulos.map((r, i) => (
                  <tr key={i}>
                    <td>{r.capacidadGB}</td>
                    <td>{r.velocidadMHz}</td>
                    <td>{r.modelo}</td>
                    <td>{r.fabricante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {c.perifericos?.impresoras?.length > 0 && (
        <div className="card">
          <h2>Impresoras</h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Driver</th>
                  <th>Puerto</th>
                  <th>Tipo</th>
                  <th>Estado (Windows)</th>
                  <th>Compartida</th>
                  <th>Predeterminada</th>
                </tr>
              </thead>
              <tbody>
                {c.perifericos.impresoras.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre ?? '—'}</td>
                    <td>{p.driver ?? '—'}</td>
                    <td>{p.puerto ?? '—'}</td>
                    <td>{p.tipoImpresora ?? p.tipo ?? '—'}</td>
                    <td>{p.estado ?? '—'}</td>
                    <td>{siNo(p.compartida)}</td>
                    <td>{siNo(p.predeterminada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {c.perifericos?.dispositivosUsb?.length > 0 && (
        <div className="card">
          <h2>Dispositivos USB</h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fabricante</th>
                  <th>Categoría</th>
                  <th>Clase</th>
                  <th>Conexión</th>
                </tr>
              </thead>
              <tbody>
                {filtrarUsbParaInventario(c.perifericos.dispositivosUsb).map((u, i) => (
                  <tr key={i}>
                    <td>{u.nombre ?? '—'}</td>
                    <td>{u.fabricante ?? '—'}</td>
                    <td>{u.categoria ?? '—'}</td>
                    <td>{u.clase ?? '—'}</td>
                    <td>{u.conexion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {c.perifericos?.monitores?.length > 0 && (
        <div className="card">
          <h2>Monitores</h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Resolución</th>
                  <th>Pulgadas</th>
                  <th>Ancho (cm)</th>
                  <th>Alto (cm)</th>
                </tr>
              </thead>
              <tbody>
                {c.perifericos.monitores.map((m, i) => (
                  <tr key={i}>
                    <td>{m.nombre ?? '—'}</td>
                    <td>{m.resolucion ?? '—'}</td>
                    <td>{fmtNumOGuion(m.pulgadas, 1)}</td>
                    <td>{fmtNumOGuion(m.anchoCm, 1)}</td>
                    <td>{fmtNumOGuion(m.altoCm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const audio = c.perifericos?.audio;
        const entrada = filtrarAudioParaInventario(audio?.entrada ?? []);
        const salida = filtrarAudioParaInventario(audio?.salida ?? []);
        if (audio == null || (entrada.length === 0 && salida.length === 0)) return null;
        return (
          <div className="card">
            <h2>Audio</h2>
            {entrada.length > 0 && (
              <>
                <h3 style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>Entrada</h3>
                <div className="table-wrap" style={{ marginTop: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fabricante</th>
                        <th>Estado (Windows)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entrada.map((a, i) => (
                        <tr key={`entrada-${i}`}>
                          <td>{a.nombre ?? '—'}</td>
                          <td>{a.fabricante ?? '—'}</td>
                          <td>{a.estado ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {salida.length > 0 && (
              <>
                <h3 style={{ marginTop: entrada.length > 0 ? '1.25rem' : '0.5rem', marginBottom: '0.5rem' }}>Salida</h3>
                <div className="table-wrap" style={{ marginTop: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fabricante</th>
                        <th>Estado (Windows)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salida.map((a, i) => (
                        <tr key={`salida-${i}`}>
                          <td>{a.nombre ?? '—'}</td>
                          <td>{a.fabricante ?? '—'}</td>
                          <td>{a.estado ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })()}
      </>
      )}

      {solapa === 'software' && (
        <>
        <div className="card">
          <h2>Sistema operativo</h2>
          <dl className="detail-dl">
            <dt>Sistema operativo</dt>
            <dd>{c.sistemaOperativo ?? '—'}</dd>
            {winVerKeys.length === 0 ? (
              <><dt>Windows (detallado)</dt><dd className="estado-msg" style={{ margin: 0 }}>Sin datos de <code className="uuid">windows_version_detallada</code></dd></>
            ) : (
              winVerKeys.map(k => (
                <Fragment key={k}>
                  <dt>{WIN_VER_LABELS[k] ?? k}</dt>
                  <dd className={k === 'build_lab' ? 'uuid' : ''}>{valorWindowsDetallado(winVer[k])}</dd>
                </Fragment>
              ))
            )}
          </dl>
        </div>
        <div className="card">
          <h2>Programas</h2>
          {programas.length === 0 ? (
            <p className="estado-msg">No hay programas registrados.</p>
          ) : (
            <div className="table-wrap" style={{ marginTop: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    {colsProgramas.map(col => (
                      <th key={col}>{etiquetaColumnaPrograma(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programas.map((p, i) => (
                    <tr key={p.documentoId ?? i}>
                      {colsProgramas.map(col => (
                        <td key={col} className={typeof p[col] === 'object' && p[col] != null ? 'uuid' : ''}>
                          {celdaPrograma(p[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default ComputadoraDetail;

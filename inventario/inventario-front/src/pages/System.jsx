import { useMemo, useState } from 'react';
import { useComputadorasHW } from '../hooks/useComputadorasHW';
import { useComandoHW, enviarComandoAMaquinas } from '../hooks/useComandoHW';
import {
  useLogsActualizacion,
  deleteLogsActualizacionCoinciden,
  LOGS_SNAPSHOT_CAP,
} from '../hooks/useLogsActualizacion';
import { formatTimestamp } from '../lib/formatFirestore';
import { EVENTO_BADGE_HW } from '../lib/comandoLogBadges';
import { useConfigAgenteDescarga } from '../hooks/useConfigAgenteDescarga';

function BloqueDescargaAgente() {
  const { urlDescarga, versionEtiqueta, nombreArchivo, loading } = useConfigAgenteDescarga();

  return (
    <section className="section system-section">
      <h2>Descarga del agente</h2>
      <p className="muted">
        Instalador para Windows <strong>{versionEtiqueta ?? '—'}</strong> (
        <code>{nombreArchivo}</code>
        ). Podés instalarlo en equipos nuevos; en PCs ya con agente usá los comandos de actualización
        más abajo.
        {loading ? (
          <>
            {' '}
            <span className="muted small">Sincronizando con Firestore…</span>
          </>
        ) : null}
      </p>
      <a
        href={urlDescarga}
        className="btn btn-secondary"
        target="_blank"
        rel="noopener noreferrer"
        download={nombreArchivo}
      >
        Descargar {nombreArchivo}
      </a>
    </section>
  );
}

function inicioDiaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function finDiaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function versionInstaladaTexto(c) {
  const v = c.version_agente ?? c.version;
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

/** Búsqueda parcial sin distinguir mayúsculas en UUID u hostname. */
function coincideUuidHostname(needleRaw, uuid, hostname) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  const u = String(uuid ?? '').toLowerCase();
  const h = String(hostname ?? '').toLowerCase();
  return u.includes(needle) || h.includes(needle);
}

/** Filtro por texto de versión (parcial, sin distinguir mayúsculas). */
function coincideVersionTexto(needleRaw, versionStr) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  const v = String(versionStr ?? '').trim().toLowerCase();
  return v.includes(needle);
}

function ComandosMaquina({
  computadoraId,
  hostname,
  versionLabel,
  seleccionada,
  onToggleSeleccion,
}) {
  const { enviarActualizarDatos, enviarActualizarAgente, sending, error } = useComandoHW(computadoraId);
  const [enviandoResetUuid, setEnviandoResetUuid] = useState(false);
  const [errorResetUuid, setErrorResetUuid] = useState(null);

  async function handleResetUuid() {
    const etiqueta = hostname || computadoraId;
    if (
      !window.confirm(
        `¿Enviar RESETEAR_ID a ${etiqueta}?\n\nEl agente borrará su ID del registro de Windows y se reiniciará; al volver puede registrarse en Firestore con un UUID nuevo según el hardware.`,
      )
    ) {
      return;
    }
    setEnviandoResetUuid(true);
    setErrorResetUuid(null);
    const res = await enviarComandoAMaquinas([computadoraId], 'RESETEAR_ID');
    setEnviandoResetUuid(false);
    if (!res.ok) setErrorResetUuid(res.message);
  }

  return (
    <div
      className="comandos-hw"
      role="presentation"
      onClick={onToggleSeleccion}
      style={{ cursor: 'pointer' }}
      title="Clic en la fila para marcar o desmarcar en actualización masiva del agente"
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={seleccionada}
          onChange={onToggleSeleccion}
          aria-label={`Incluir ${hostname || computadoraId} en actualización masiva del agente`}
        />
      </label>
      <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
        <div className="comandos-hw-host">{hostname || computadoraId}</div>
        <div className="muted small" style={{ marginTop: '0.15rem' }}>
          UUID:{' '}
          <code className="uuid-inline" title={computadoraId}>
            {computadoraId}
          </code>
        </div>
        <div className="muted small" style={{ marginTop: '0.15rem' }}>
          Versión instalada: <strong>{versionLabel}</strong>
        </div>
      </div>
      <div className="actions" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={sending || enviandoResetUuid}
          onClick={() => enviarActualizarDatos()}
        >
          Actualizar datos
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={sending || enviandoResetUuid}
          onClick={() => enviarActualizarAgente()}
        >
          Actualizar agente
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={sending || enviandoResetUuid}
          onClick={() => void handleResetUuid()}
          title="Comando RESETEAR_ID en Firestore: el agente limpia el ID en Windows y puede generar un UUID nuevo"
        >
          {enviandoResetUuid ? 'Enviando…' : 'Resetear UUID'}
        </button>
      </div>
      {(error || errorResetUuid) && (
        <p
          className="error small"
          style={{ flexBasis: '100%', marginBottom: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {error || errorResetUuid}
        </p>
      )}
    </div>
  );
}

export default function System() {
  const { computadoras, loading: loadingPcs, error: errorPcs } = useComputadorasHW();
  const [logFechaDesde, setLogFechaDesde] = useState('');
  const [logFechaHasta, setLogFechaHasta] = useState('');
  const [borrandoLogs, setBorrandoLogs] = useState(false);
  const [feedbackBorrarLogs, setFeedbackBorrarLogs] = useState(null);
  const [enviandoActualizarTodas, setEnviandoActualizarTodas] = useState(false);
  const [errorActualizarTodas, setErrorActualizarTodas] = useState(null);
  const [idsAgenteSeleccion, setIdsAgenteSeleccion] = useState(() => new Set());
  const [enviandoAgenteSeleccion, setEnviandoAgenteSeleccion] = useState(false);
  const [errorAgenteSeleccion, setErrorAgenteSeleccion] = useState(null);
  const [enviandoResetUuidSeleccion, setEnviandoResetUuidSeleccion] = useState(false);
  const [busquedaComandosMaquinas, setBusquedaComandosMaquinas] = useState('');
  const [filtroVersionComandos, setFiltroVersionComandos] = useState('');
  const [busquedaHistorialLogs, setBusquedaHistorialLogs] = useState('');
  const [filtroVersionHistorial, setFiltroVersionHistorial] = useState('');

  const rangoFechasInvalido = Boolean(
    logFechaDesde && logFechaHasta && logFechaDesde > logFechaHasta,
  );

  const filtroLogsActualizacion = useMemo(() => {
    if (rangoFechasInvalido) return null;
    return {
      desde: logFechaDesde ? inicioDiaLocal(logFechaDesde) : null,
      hasta: logFechaHasta ? finDiaLocal(logFechaHasta) : null,
    };
  }, [logFechaDesde, logFechaHasta, rangoFechasInvalido]);

  const filtroLogsFirestore = filtroLogsActualizacion ?? { desde: null, hasta: null };

  const { logs, loading: loadingLogs, error: errorLogs } = useLogsActualizacion(filtroLogsFirestore);

  const computadorasFiltradas = useMemo(
    () =>
      computadoras.filter(c => {
        const okHost = coincideUuidHostname(busquedaComandosMaquinas, c.id, c.hostname ?? '');
        const okVer = coincideVersionTexto(filtroVersionComandos, versionInstaladaTexto(c));
        return okHost && okVer;
      }),
    [computadoras, busquedaComandosMaquinas, filtroVersionComandos],
  );

  const logsFiltrados = useMemo(
    () =>
      logs.filter(l => {
        const okPc = coincideUuidHostname(busquedaHistorialLogs, l.uuid, l.hostname);
        const okVer = coincideVersionTexto(filtroVersionHistorial, l.version_agente);
        return okPc && okVer;
      }),
    [logs, busquedaHistorialLogs, filtroVersionHistorial],
  );

  const idsComputadorasValidos = useMemo(
    () => new Set(computadoras.map(c => c.id)),
    [computadoras],
  );

  const idsAgenteSeleccionValidos = useMemo(
    () => new Set([...idsAgenteSeleccion].filter(id => idsComputadorasValidos.has(id))),
    [idsAgenteSeleccion, idsComputadorasValidos],
  );

  async function handleBorrarLogs() {
    const hayFiltroFecha = Boolean(logFechaDesde || logFechaHasta) && !rangoFechasInvalido;
    const aclaracion = hayFiltroFecha
      ? 'Solo se borrarán los registros cuyo timestamp cae en el rango de fechas (hora local) que elegiste.'
      : 'Se borrarán todos los registros de la colección que tengan campo timestamp (los que ves en la tabla).';
    if (
      !window.confirm(
        `¿Borrar esos logs en Firebase?\n\n${aclaracion}\n\nEsta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setFeedbackBorrarLogs(null);
    setBorrandoLogs(true);
    const res = await deleteLogsActualizacionCoinciden(filtroLogsFirestore);
    setBorrandoLogs(false);
    if (res.ok) {
      setFeedbackBorrarLogs({
        ok: true,
        text: `Se borraron ${res.deleted} registro${res.deleted !== 1 ? 's' : ''}.`,
      });
    } else {
      setFeedbackBorrarLogs({ ok: false, text: res.message });
    }
  }

  async function handleActualizarDatosTodas() {
    const n = computadoras.length;
    if (
      !window.confirm(
        `¿Enviar ACTUALIZAR_DATOS a las ${n} máquina${n !== 1 ? 's' : ''} listadas?\n\n` +
          'Cada agente hará una sincronización completa cuando lea el comando en Firestore.',
      )
    ) {
      return;
    }
    setErrorActualizarTodas(null);
    setEnviandoActualizarTodas(true);
    const res = await enviarComandoAMaquinas(
      computadoras.map(c => c.id),
      'ACTUALIZAR_DATOS',
    );
    setEnviandoActualizarTodas(false);
    if (!res.ok) {
      setErrorActualizarTodas(res.message);
    }
  }

  function toggleSeleccionAgente(id) {
    setIdsAgenteSeleccion(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function seleccionarTodasAgente() {
    setIdsAgenteSeleccion(new Set(computadorasFiltradas.map(c => c.id)));
  }

  function deseleccionarTodasAgente() {
    setIdsAgenteSeleccion(new Set());
  }

  async function handleActualizarAgenteSeleccionadas() {
    const ids = [...idsAgenteSeleccionValidos];
    const n = ids.length;
    if (n === 0) return;
    if (
      !window.confirm(
        `¿Enviar ACTUALIZAR_AGENTE a ${n} máquina${n !== 1 ? 's' : ''} seleccionada${n !== 1 ? 's' : ''}?\n\n` +
          'Cada una descargará el instalador desde la URL configurada y reiniciará el servicio.',
      )
    ) {
      return;
    }
    setErrorAgenteSeleccion(null);
    setEnviandoAgenteSeleccion(true);
    const res = await enviarComandoAMaquinas(ids, 'ACTUALIZAR_AGENTE');
    setEnviandoAgenteSeleccion(false);
    if (!res.ok) {
      setErrorAgenteSeleccion(res.message);
    }
  }

  async function handleResetearUuidSeleccionadas() {
    const ids = [...idsAgenteSeleccionValidos];
    const n = ids.length;
    if (n === 0) return;
    if (
      !window.confirm(
        `¿Enviar RESETEAR_ID a ${n} máquina${n !== 1 ? 's' : ''} seleccionada${n !== 1 ? 's' : ''}?\n\n` +
          'Los agentes borrarán su ID del registro de Windows y se reiniciarán; solo ante colisiones o IDs incorrectos.',
      )
    ) {
      return;
    }
    setErrorAgenteSeleccion(null);
    setEnviandoResetUuidSeleccion(true);
    const res = await enviarComandoAMaquinas(ids, 'RESETEAR_ID');
    setEnviandoResetUuidSeleccion(false);
    if (!res.ok) {
      setErrorAgenteSeleccion(res.message);
    }
  }

  if (loadingPcs) {
    return (
      <div className="page">
        <h1>Sistema</h1>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (errorPcs) {
    return (
      <div className="page">
        <h1>Sistema</h1>
        <p className="page error">{errorPcs}</p>
        <p className="muted">
          Esta pantalla usa Firebase directamente (<code>computadoras</code>,{' '}
          <code>logs_actualizaciones</code>). Copiá las variables <code>VITE_FIREBASE_*</code> desde
          MiniAgente-Front o desde la consola de Firebase.
        </p>
        <BloqueDescargaAgente />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Sistema</h1>
      <p className="muted">
        Comandos y logs en tiempo real vía Firestore. El agente identifica cada PC por UUID.
      </p>

      <BloqueDescargaAgente />

      <section className="section system-section">
        <h2>Comandos a máquinas</h2>
        <p className="muted">
          Seleccioná equipos para actualizar el agente. Resetear UUID para limpiar el ID.
        </p>
        {loadingPcs ? (
          <p className="muted">Cargando computadoras…</p>
        ) : computadoras.length === 0 ? (
          <p className="muted">No hay computadoras en Firestore.</p>
        ) : (
          <>
            <div className="filter-bar" style={{ marginBottom: '1rem' }}>
              <div className="filter-field" style={{ flex: '1 1 14rem', minWidth: '12rem' }}>
                <label className="filter-label" htmlFor="busqueda-comandos-maquinas">
                  Buscar por UUID o hostname
                </label>
                <input
                  id="busqueda-comandos-maquinas"
                  type="search"
                  className="filter-input"
                  placeholder="Ej.: DESKTOP-… o parte del UUID"
                  value={busquedaComandosMaquinas}
                  onChange={e => setBusquedaComandosMaquinas(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="filter-field" style={{ flex: '1 1 10rem', minWidth: '9rem' }}>
                <label className="filter-label" htmlFor="filtro-version-comandos">
                  Versión instalada
                </label>
                <input
                  id="filtro-version-comandos"
                  type="search"
                  className="filter-input"
                  placeholder="Ej.: 1.2"
                  value={filtroVersionComandos}
                  onChange={e => setFiltroVersionComandos(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            {busquedaComandosMaquinas.trim() || filtroVersionComandos.trim() ? (
              <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                Mostrando {computadorasFiltradas.length} de {computadoras.length} máquina
                {computadoras.length !== 1 ? 's' : ''}
              </p>
            ) : null}
            <div className="actions" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={enviandoActualizarTodas}
                onClick={() => void handleActualizarDatosTodas()}
              >
                {enviandoActualizarTodas
                  ? 'Enviando a todas…'
                  : `Actualizar datos en todas (${computadoras.length})`}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={computadorasFiltradas.length === 0}
                onClick={seleccionarTodasAgente}
              >
                Seleccionar todas (agente)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={idsAgenteSeleccionValidos.size === 0}
                onClick={deseleccionarTodasAgente}
              >
                Deseleccionar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={
                  idsAgenteSeleccionValidos.size === 0 ||
                  enviandoAgenteSeleccion ||
                  enviandoResetUuidSeleccion
                }
                onClick={() => void handleActualizarAgenteSeleccionadas()}
              >
                {enviandoAgenteSeleccion
                  ? 'Enviando ACTUALIZAR_AGENTE…'
                  : `Actualizar Agente (${idsAgenteSeleccionValidos.size})`}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={
                  idsAgenteSeleccionValidos.size === 0 ||
                  enviandoResetUuidSeleccion ||
                  enviandoAgenteSeleccion
                }
                onClick={() => void handleResetearUuidSeleccionadas()}
              >
                {enviandoResetUuidSeleccion
                  ? 'Enviando RESETEAR_ID…'
                  : `Resetear UUID (${idsAgenteSeleccionValidos.size})`}
              </button>
            </div>
            {errorActualizarTodas && (
              <p className="error small" style={{ marginBottom: '0.75rem' }}>
                {errorActualizarTodas}
              </p>
            )}
            {errorAgenteSeleccion && (
              <p className="error small" style={{ marginBottom: '0.75rem' }}>
                {errorAgenteSeleccion}
              </p>
            )}
            <div className="comandos-hw-list">
              {computadorasFiltradas.length === 0 ? (
                <p className="muted">
                  Ninguna máquina coincide con los filtros ({computadoras.length} en total).
                </p>
              ) : (
                computadorasFiltradas.map(c => (
                  <ComandosMaquina
                    key={c.id}
                    computadoraId={c.id}
                    hostname={c.hostname ?? c.id}
                    versionLabel={versionInstaladaTexto(c)}
                    seleccionada={idsAgenteSeleccionValidos.has(c.id)}
                    onToggleSeleccion={() => toggleSeleccionAgente(c.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </section>

      <section className="section system-section">
        <h2>Historial de comandos</h2>
        <p className="muted">
          Eventos en tiempo real desde <code>logs_actualizaciones</code>. Podés filtrar por día (hora
          local). Se sincronizan como máximo los <strong>{LOGS_SNAPSHOT_CAP}</strong> más recientes
          (rendimiento).
        </p>
        <div className="filter-bar">
          <div className="filter-field" style={{ flex: '1 1 14rem', minWidth: '12rem' }}>
            <label className="filter-label" htmlFor="busqueda-historial-logs">
              Buscar por UUID o hostname
            </label>
            <input
              id="busqueda-historial-logs"
              type="search"
              className="filter-input"
              placeholder="Filtra la tabla por PC"
              value={busquedaHistorialLogs}
              onChange={e => setBusquedaHistorialLogs(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filter-field" style={{ flex: '1 1 10rem', minWidth: '9rem' }}>
            <label className="filter-label" htmlFor="filtro-version-historial">
              Versión agente
            </label>
            <input
              id="filtro-version-historial"
              type="search"
              className="filter-input"
              placeholder="Ej.: 1.2"
              value={filtroVersionHistorial}
              onChange={e => setFiltroVersionHistorial(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="logs-fecha-desde">
              Desde
            </label>
            <input
              id="logs-fecha-desde"
              type="date"
              className="filter-input"
              value={logFechaDesde}
              onChange={e => {
                setLogFechaDesde(e.target.value);
                setFeedbackBorrarLogs(null);
              }}
            />
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="logs-fecha-hasta">
              Hasta
            </label>
            <input
              id="logs-fecha-hasta"
              type="date"
              className="filter-input"
              value={logFechaHasta}
              onChange={e => {
                setLogFechaHasta(e.target.value);
                setFeedbackBorrarLogs(null);
              }}
            />
          </div>
          <div className="filter-field">
            <span className="filter-label" aria-hidden="true">
              &nbsp;
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!logFechaDesde && !logFechaHasta}
              onClick={() => {
                setLogFechaDesde('');
                setLogFechaHasta('');
                setFeedbackBorrarLogs(null);
              }}
            >
              Quitar filtro de fechas
            </button>
          </div>
          <div className="filter-field">
            <span className="filter-label" aria-hidden="true">
              &nbsp;
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loadingLogs || borrandoLogs || !!errorLogs || logs.length === 0}
              onClick={() => void handleBorrarLogs()}
            >
              {borrandoLogs ? 'Borrando…' : 'Borrar logs'}
            </button>
          </div>
        </div>
        {feedbackBorrarLogs && (
          <p
            className={feedbackBorrarLogs.ok ? 'muted small' : 'error small'}
            style={{ marginBottom: '0.75rem' }}
          >
            {feedbackBorrarLogs.text}
          </p>
        )}
        {rangoFechasInvalido && (
          <p className="error small" style={{ marginBottom: '0.75rem' }}>
            La fecha &quot;Desde&quot; no puede ser posterior a &quot;Hasta&quot;.
          </p>
        )}
        {errorLogs && <p className="error small">Logs: {errorLogs}</p>}
        {!loadingLogs && !errorLogs && (
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            {busquedaHistorialLogs.trim() || filtroVersionHistorial.trim()
              ? `${logsFiltrados.length} de ${logs.length} registro${logs.length !== 1 ? 's' : ''}`
              : `${logs.length} registro${logs.length !== 1 ? 's' : ''}`}
            {logFechaDesde || logFechaHasta
              ? rangoFechasInvalido
                ? ' (sin filtro por rango inválido)'
                : ' (filtrado por timestamp)'
              : ''}
            {busquedaHistorialLogs.trim() || filtroVersionHistorial.trim()
              ? ' (filtrado por búsqueda)'
              : ''}
          </p>
        )}
        {loadingLogs ? (
          <p className="muted">Cargando logs…</p>
        ) : logs.length === 0 ? (
          <p className="muted">Sin entradas aún.</p>
        ) : logsFiltrados.length === 0 ? (
          <p className="muted">
            Ningún log coincide con los filtros ({logs.length} registro
            {logs.length !== 1 ? 's' : ''} con el filtro de fechas actual).
          </p>
        ) : (
          <div className="table-wrap table-wrap--scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>PC</th>
                  <th>Evento</th>
                  <th>Detalle</th>
                  <th>Versión</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map(l => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {l.timestamp ? formatTimestamp(l.timestamp) : '—'}
                    </td>
                    <td>{l.hostname || l.uuid || '—'}</td>
                    <td>
                      <span className={`badge ${EVENTO_BADGE_HW[l.evento] ?? 'badge-neutral'}`}>
                        {l.evento}
                      </span>
                    </td>
                    <td className="td-detalle-log">{l.detalle || '—'}</td>
                    <td>{l.version_agente || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

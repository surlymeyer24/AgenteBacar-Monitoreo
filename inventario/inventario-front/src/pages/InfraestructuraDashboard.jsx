import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Video, Camera, Router, EthernetPort, Banknote } from 'lucide-react';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchCamaras } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { fetchMaquinas } from '../api/maquinaTesoreriaApi';

/** Conteos por NVR (nombre visible); incluye "Sin NVR" y NVR huérfanos en datos. */
function camarasPorNvrDesdeLista(camaras, nvrs) {
  const list = Array.isArray(camaras) ? camaras : [];
  const nvrList = Array.isArray(nvrs) ? nvrs : [];
  const countBy = new Map();
  for (const cam of list) {
    const raw = cam?.nvrId;
    const id = raw != null && String(raw).trim() ? String(raw).trim() : '';
    countBy.set(id, (countBy.get(id) ?? 0) + 1);
  }
  const idsCatalogo = new Set(nvrList.map(n => n.id).filter(Boolean));
  const rows = [];
  for (const nvr of nvrList) {
    const c = countBy.get(nvr.id) ?? 0;
    if (c > 0) rows.push({ label: nvr.nombre ?? nvr.id, count: c });
  }
  const sin = countBy.get('') ?? 0;
  if (sin > 0) rows.push({ label: 'Sin NVR', count: sin });
  for (const [id, c] of countBy) {
    if (!id || c === 0) continue;
    if (!idsCatalogo.has(id)) {
      rows.push({ label: id, count: c });
    }
  }
  rows.sort((a, b) => b.count - a.count);
  const out = {};
  for (const r of rows) {
    out[r.label] = r.count;
  }
  return out;
}

const INFRA_BAR_COLORS = [
  '#6A1B9A',
  '#C62828',
  '#1565C0',
  '#00838F',
  '#2E7D32',
];

function TarjetaBarrasInfra({ titulo, porClave }) {
  const conDatos = porClave
    ? Object.entries(porClave).filter(([, n]) => Number(n) > 0)
    : [];
  const max = Math.max(1, ...conDatos.map(([, n]) => Number(n) || 0));

  if (!porClave || conDatos.length === 0) {
    return (
      <div className="card dashboard-perifericos-card">
        <h2 className="dashboard-perifericos-card__title">{titulo}</h2>
        <p className="muted" style={{ margin: 0 }}>
          Sin datos para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="card dashboard-perifericos-card">
      <h2 className="dashboard-perifericos-card__title">{titulo}</h2>
      <ul className="dashboard-perifericos-card__list">
        {conDatos.map(([label, raw], i) => {
          const n = Number(raw) || 0;
          const pct = Math.round((n / max) * 100);
          const color = INFRA_BAR_COLORS[i % INFRA_BAR_COLORS.length];
          return (
            <li key={label} className="dashboard-perifericos-card__row">
              <span className="dashboard-perifericos-card__label">{label}</span>
              <div
                className="dashboard-perifericos-card__track"
                role="presentation"
                aria-hidden="true"
              >
                <div
                  className="dashboard-perifericos-card__fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="dashboard-perifericos-card__value">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const INFRA_METRIC_LINK_CLASS =
  'metric-card dashboard-metric-icon-card dashboard-metric-link';

function InfraestructuraDashboard() {
  const [stats, setStats] = useState(null);
  const [listaNvrs, setListaNvrs] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [totalMaquinas, setTotalMaquinas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([
      fetchDashboardStats().catch(() => null),
      fetchNvrs().catch(() => []),
      fetchCamaras().catch(() => []),
      fetchMaquinas().catch(() => []),
    ])
      .then(([s, nvrs, cams, maqs]) => {
        setStats(s ?? null);
        setListaNvrs(Array.isArray(nvrs) ? nvrs : []);
        setCamaras(Array.isArray(cams) ? cams : []);
        setTotalMaquinas(Array.isArray(maqs) ? maqs.length : 0);
      })
      .catch(() => setError('No se pudo cargar el resumen de infraestructura.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalNvrs = listaNvrs.length;
  const totalCamaras = camaras.length;
  const camarasPorNvr = useMemo(
    () => camarasPorNvrDesdeLista(camaras, listaNvrs),
    [camaras, listaNvrs]
  );

  if (cargando) return <p className="estado-msg">Cargando...</p>;

  const s = stats ?? {};
  const totalRouters = Number(s.totalRouters ?? 0);
  const totalSwitches = Number(s.totalSwitches ?? 0);

  const totalActivos =
    totalNvrs + totalCamaras + totalRouters + totalSwitches + totalMaquinas;
  const subt =
    totalActivos === 0
      ? 'Sin equipos registrados'
      : `${totalActivos} activo${totalActivos === 1 ? '' : 's'} en inventario`;

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.35rem',
        }}
      >
        <div>
          <h1 className="inventory-page-title" style={{ marginBottom: '0.2rem' }}>
            Infraestructura
          </h1>
          <p className="inventory-page-sub" style={{ margin: 0 }}>{subt}</p>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Videovigilancia (NVR y cámaras), red y tesorería. El desglose de cámaras usa la asignación a NVR
        de cada cámara.
      </p>

      {error ? (
        <p className="estado-msg error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dashboard-metrics-row" style={{ marginBottom: '1rem' }}>
        <Link
          to="/nvrs"
          className={`${INFRA_METRIC_LINK_CLASS} metric-card--purple`}
        >
          <div>
            <p className="metric-card__title">NVR</p>
            <p className="metric-card__value">{totalNvrs}</p>
          </div>
          <Video size={36} color="#6a1b9a" opacity={0.85} />
        </Link>
        <Link
          to="/camaras"
          className={`${INFRA_METRIC_LINK_CLASS} metric-card--red`}
        >
          <div>
            <p className="metric-card__title">Cámaras</p>
            <p className="metric-card__value">{totalCamaras}</p>
          </div>
          <Camera size={36} color="#c62828" opacity={0.85} />
        </Link>
        <Link
          to="/routers"
          className={`${INFRA_METRIC_LINK_CLASS} metric-card--blue`}
        >
          <div>
            <p className="metric-card__title">Routers</p>
            <p className="metric-card__value">{totalRouters}</p>
          </div>
          <Router size={36} color="#1565c0" opacity={0.85} />
        </Link>
        <Link
          to="/switches"
          className={`${INFRA_METRIC_LINK_CLASS} metric-card--green`}
        >
          <div>
            <p className="metric-card__title">Switches</p>
            <p className="metric-card__value">{totalSwitches}</p>
          </div>
          <EthernetPort size={36} color="#2e7d32" opacity={0.85} />
        </Link>
        <Link
          to="/maquinas-tesoreria"
          className={`${INFRA_METRIC_LINK_CLASS} metric-card--orange`}
        >
          <div>
            <p className="metric-card__title">Máq. tesorería</p>
            <p className="metric-card__value">{totalMaquinas}</p>
          </div>
          <Banknote size={36} color="#ef6c00" opacity={0.85} />
        </Link>
      </div>

      <div className="dashboard-charts-row">
        <div style={{ gridColumn: '1 / -1' }}>
          <TarjetaBarrasInfra titulo="Cámaras por NVR" porClave={camarasPorNvr} />
        </div>
      </div>

      <div className="dashboard-charts-row">
        <TarjetaBarrasInfra
          titulo="Routers por ubicación"
          porClave={s.porUbicacionRouters ?? {}}
        />
        <TarjetaBarrasInfra
          titulo="Switches por ubicación"
          porClave={s.porUbicacionSwitches ?? {}}
        />
      </div>
    </div>
  );
}

export default InfraestructuraDashboard;

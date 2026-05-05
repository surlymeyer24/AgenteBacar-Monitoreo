import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchComputadoras } from '../api/computadoraApi';
import { fetchCamaras } from '../api/camaraApi';
import { textoConexionAgente } from '../utils/estadoConexion';
import { Monitor, CheckCircle2, Camera, Keyboard } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#2e7d32', '#c62828'];

/** Barras tipo tarjeta referencia (verde / naranja y alternancia). */
const PERIF_BAR_COLORS = [
  '#2E7D32',
  '#D84315',
  '#1565C0',
  '#00838F',
  '#6A1B9A',
  '#E65100',
  '#558B2F',
  '#C62828',
  '#455A64',
];

function TarjetaPerifericosPorTipo({ porTipo }) {
  const conDatos = porTipo ? Object.entries(porTipo).filter(([, n]) => Number(n) > 0) : [];
  const max = Math.max(1, ...conDatos.map(([, n]) => Number(n) || 0));

  if (!porTipo || conDatos.length === 0) {
    return (
      <div className="card dashboard-perifericos-card">
        <h2 className="dashboard-perifericos-card__title">Periféricos</h2>
        <p className="muted" style={{ margin: 0 }}>
          {!porTipo
            ? 'Sin desglose por tipo (necesitás API con estadísticas actualizadas).'
            : 'Ningún periférico reportado en las PCs.'}
        </p>
      </div>
    );
  }

  return (
    <div className="card dashboard-perifericos-card">
      <h2 className="dashboard-perifericos-card__title">Periféricos</h2>
      <ul className="dashboard-perifericos-card__list">
        {conDatos.map(([label, raw], i) => {
          const n = Number(raw) || 0;
          const pct = Math.round((n / max) * 100);
          const color = PERIF_BAR_COLORS[i % PERIF_BAR_COLORS.length];
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

function estadoBadgeClass(estado) {
  const e = (estado ?? '').toLowerCase();
  if (e === 'activo' || e === 'activa') return 'badge badge-success';
  if (e === 'baja' || e === 'inactivo' || e === 'inactiva') return 'badge badge-error';
  return 'badge badge-neutral';
}

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [computadoras, setComputadoras] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([
      fetchDashboardStats(),
      fetchComputadoras().catch(() => []),
      fetchCamaras().catch(() => []),
    ])
      .then(([statsData, pcs, cams]) => {
        setStats(statsData);
        setComputadoras(pcs ?? []);
        setCamaras(cams ?? []);
      })
      .catch(() => setError('No se pudo cargar el dashboard. Verificá que el servidor esté en ejecución.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !stats) return <p className="estado-msg">Cargando...</p>;
  if (error && !stats) return <p className="estado-msg error">{error}</p>;

  const s = stats ?? {};
  const totalPc = Number(s.totalComputadoras ?? 0);
  const totalCamaras = Number(s.totalCamaras ?? 0);
  const totalPerifericos = Number(s.totalPerifericos ?? 0);
  const activas = Number(s.computadorasSyncMenos10Min ?? 0);
  const inactivas = totalPc - activas;

  const pieData = [
    { name: `Activas: ${activas}`, value: activas },
    { name: `Inactivas: ${inactivas}`, value: Math.max(inactivas, 0) },
  ];

  return (
    <div className="page">
      <h1>Dashboard de Inventario - Componentes de PC</h1>

      {error && stats ? (
        <p className="estado-msg error" role="alert">{error}</p>
      ) : null}

      {/* Metric cards */}
      <div className="dashboard-metrics-row">
        <div className="metric-card metric-card--blue dashboard-metric-icon-card">
          <div>
            <p className="metric-card__title">Total Computadoras</p>
            <p className="metric-card__value">{totalPc}</p>
          </div>
          <Monitor size={36} color="#1565c0" opacity={0.8} />
        </div>
        <div className="metric-card metric-card--blue dashboard-metric-icon-card">
          <div>
            <p className="metric-card__title">Computadoras Activas</p>
            <p className="metric-card__value">{activas}</p>
          </div>
          <CheckCircle2 size={36} color="#1565c0" opacity={0.8} />
        </div>
        <div className="metric-card metric-card--red dashboard-metric-icon-card">
          <div>
            <p className="metric-card__title">Cámaras Instaladas</p>
            <p className="metric-card__value">{totalCamaras}</p>
          </div>
          <Camera size={36} color="#c62828" opacity={0.8} />
        </div>
        <div className="metric-card metric-card--red dashboard-metric-icon-card">
          <div>
            <p className="metric-card__title">Periféricos Totales</p>
            <p className="metric-card__value">{totalPerifericos}</p>
          </div>
          <Keyboard size={36} color="#c62828" opacity={0.8} />
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts-row">
        <div className="card">
          <h2>Estado de Computadoras</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                dataKey="value"
                label={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <TarjetaPerifericosPorTipo porTipo={s.perifericosPorTipo} />
      </div>

      {/* Listado de Computadoras */}
      <div className="card">
        <h2>🖥️ Listado de Computadoras</h2>
        <div className="table-wrap" style={{ marginTop: 0, maxHeight: '280px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Especificaciones</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {computadoras.length === 0 ? (
                <tr><td colSpan={5} className="table-empty">Sin datos</td></tr>
              ) : (
                computadoras.map((c, i) => {
                  const conexionAgente = textoConexionAgente(c);
                  return (
                  <tr
                    key={c.uuid}
                    className="table-row-link"
                    onClick={() => navigate(`/computadoras/${c.uuid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{i + 1}</td>
                    <td>{c.hostname ?? '—'}</td>
                    <td>
                      <span className={estadoBadgeClass(conexionAgente)}>
                        {conexionAgente}
                      </span>
                    </td>
                    <td>{c.procesador?.nombre ?? '—'}</td>
                    <td>{c.ubicacion ?? '—'}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cámaras Instaladas */}
      <div className="card">
        <h2>📷 Cámaras Instaladas</h2>
        <p className="muted" style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
          El inventario por ubicación se gestiona desde cada{' '}
          <Link to="/nvrs">NVR</Link>.
        </p>
        <div className="table-wrap" style={{ marginTop: 0, maxHeight: '280px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {camaras.length === 0 ? (
                <tr><td colSpan={4} className="table-empty">Sin datos</td></tr>
              ) : (
                camaras.map((cam, i) => (
                  <tr
                    key={cam.id ?? i}
                    className="table-row-link"
                    onClick={() =>
                      navigate(
                        cam.nvrId
                          ? `/nvrs/${encodeURIComponent(cam.nvrId)}`
                          : `/camaras/${encodeURIComponent(cam.id ?? '')}`,
                      )}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{i + 1}</td>
                    <td>{cam.nombre ?? '—'}</td>
                    <td>{cam.tipo ?? '—'}</td>
                    <td>{cam.ubicacion ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

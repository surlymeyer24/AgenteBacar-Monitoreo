import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPerifericosM } from '../api/perifericoManualApi';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';

function PerifericoManualList() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    fetchPerifericosM()
      .then(data => { if (!cancel) setLista(data ?? []); })
      .catch(() => { if (!cancel) setError('No se pudo cargar el inventario de periféricos.'); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, []);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1>Stock de periféricos</h1>
        <Link to="/perifericos/stock/nuevo" className="btn btn-primary btn-sm">+ Nuevo periférico</Link>
      </div>
      <p className="muted" style={{ marginTop: '0.35rem' }}>
        Registro de periféricos físicos en stock: en depósito o asignados a una computadora.
      </p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Uds.</th>
                <th>Nombre / Fabricante</th>
                <th>Conexión</th>
                <th>PC asignada</th>
                <th>Estado</th>
                <th>Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">Sin periféricos registrados</td>
                </tr>
              ) : (
                lista.map(p => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/perifericos/stock/${encodeURIComponent(p.id)}`)}
                  >
                    <td style={{ textTransform: 'capitalize' }}>{p.tipo ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.cantidad ?? 1}</td>
                    <td>
                      {p.nombre ?? p.fabricante ?? '—'}
                      {p.nombre && p.fabricante && (
                        <span className="muted" style={{ fontSize: '0.82em', marginLeft: '0.4rem' }}>({p.fabricante})</span>
                      )}
                    </td>
                    <td>{p.conexion ?? '—'}</td>
                    <td>{p.computadoraHostname ?? <span className="muted">—</span>}</td>
                    <td>
                      <span className={estadoBadgeClass(p.estado)}>{p.estado ?? '—'}</span>
                    </td>
                    <td>{p.fechaAlta ?? '—'}</td>
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

function estadoBadgeClass(estado) {
  if (!estado) return 'badge badge-neutral';
  const key = Object.keys(ESTADO_OPERATIVO_LABELS).find(k => ESTADO_OPERATIVO_LABELS[k] === estado);
  if (key === 'ASIGNADA') return 'badge badge-success';
  if (key === 'EN_MANTENIMIENTO') return 'badge badge-warning';
  if (key === 'BAJA') return 'badge badge-error';
  return 'badge badge-neutral';
}

export default PerifericoManualList;

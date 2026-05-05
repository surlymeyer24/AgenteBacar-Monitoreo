import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNvrs } from '../api/nvrApi';

function NvrList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchNvrs()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado de NVR'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>NVR</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/camaras/nueva" className="btn btn-secondary btn-sm">
            Nueva cámara
          </Link>
          <Link to="/nvrs/nueva" className="btn btn-primary btn-sm">
            Crear NVR
          </Link>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>IP</th>
              <th>Puerto</th>
              <th>Cámaras</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Sin NVR registradas.{' '}
                  <Link to="/nvrs/nueva">Crear la primera NVR</Link>
                </td>
              </tr>
            ) : (
              lista.map(n => (
                <tr
                  key={n.id}
                  onClick={() => navigate(`/nvrs/${encodeURIComponent(n.id)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="uuid">{n.id}</td>
                  <td>{n.nombre}</td>
                  <td className="uuid">{n.direccionIp ?? '—'}</td>
                  <td>{n.puerto != null ? n.puerto : '—'}</td>
                  <td>{n.cantidadCamaras != null ? n.cantidadCamaras : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NvrList;

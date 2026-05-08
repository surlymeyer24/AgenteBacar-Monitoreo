import { Link } from 'react-router-dom';
import { usePerifericosAgenteListados } from '../context/PerifericosAgenteListadosContext';

function claveFila(f, index) {
  return `${f.pcUuid ?? ''}-${f.nombre ?? ''}-${index}`;
}

function PerifericosMouseList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = listados?.mouse ?? [];

  if (loading) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error?.message ?? 'No se pudo cargar el listado'}</p>;

  return (
    <div className="page">
      <h1>Mouse</h1>
      <p className="muted">
        Dispositivos apuntadores USB detectados por el agente (heurística por clase/nombre). Misma carga
        compartida que teclados y webcams.
      </p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>PC origen</th>
                <th>Nombre</th>
                <th>Fabricante</th>
                <th>Clase</th>
                <th>Conexión</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Sin mouse reportados
                  </td>
                </tr>
              ) : (
                filas.map((f, index) => (
                  <tr key={claveFila(f, index)}>
                    <td>
                      {f.pcUuid ? (
                        <Link className="link-inline" to={`/computadoras/${f.pcUuid}`}>
                          {f.pcHostname ?? f.pcUuid ?? '—'}
                        </Link>
                      ) : (
                        (f.pcHostname ?? '—')
                      )}
                    </td>
                    <td>{f.nombre ?? '—'}</td>
                    <td>{f.fabricante ?? '—'}</td>
                    <td>{f.clase ?? '—'}</td>
                    <td>{f.conexion ?? '—'}</td>
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

export default PerifericosMouseList;

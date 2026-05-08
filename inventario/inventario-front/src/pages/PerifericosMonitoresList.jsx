import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMonitoresReportadosAgente } from '../api/monitorApi';

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return '—';
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : '—';
}

function claveFila(r, index) {
  return `${r.pcUuid ?? ''}-${r.nombre ?? ''}-${r.resolucion ?? ''}-${index}`;
}

function PerifericosMonitoresList() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchMonitoresReportadosAgente()
      .then(data => {
        if (!cancel) setFilas(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancel)
          setError(err?.message ? String(err.message) : 'No se pudo cargar el listado');
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <h1>Monitores</h1>
      <p className="muted">
        Monitores reportados por el agente en cada computadora. Los datos salen del mismo origen que
        el detalle de PC, en una sola respuesta del servidor.
      </p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>PC origen</th>
                <th>Nombre</th>
                <th>Resolución</th>
                <th>Pulgadas</th>
                <th>Ancho cm</th>
                <th>Alto cm</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Sin monitores reportados
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
                    <td>{f.resolucion ?? '—'}</td>
                    <td>{fmtNumOGuion(f.pulgadas, 1)}</td>
                    <td>{fmtNumOGuion(f.anchoCm, 1)}</td>
                    <td>{fmtNumOGuion(f.altoCm, 1)}</td>
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

export default PerifericosMonitoresList;

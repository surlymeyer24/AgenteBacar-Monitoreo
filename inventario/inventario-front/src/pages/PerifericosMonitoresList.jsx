import { useState, useEffect } from 'react';
import { fetchComputadoras, fetchComputadora } from '../api/computadoraApi';

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return '—';
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : '—';
}

function PerifericosMonitoresList() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchComputadoras()
      .then(list =>
        Promise.all(
          (list ?? []).map(pc =>
            fetchComputadora(pc.uuid)
              .then(det => ({ pc, det }))
              .catch(() => ({ pc, det: null }))
          )
        )
      )
      .then(pares => {
        if (cancel) return;
        const out = [];
        pares.forEach(({ pc, det }) => {
          const hostname = det?.hostname ?? pc?.hostname ?? '—';
          const uuid = pc?.uuid;
          const monitores = det?.perifericos?.monitores ?? [];
          monitores.forEach(m => {
            out.push({
              key: `${uuid}-${m.nombre ?? ''}-${out.length}`,
              hostname,
              nombre: m.nombre,
              resolucion: m.resolucion,
              pulgadas: m.pulgadas,
            });
          });
        });
        setFilas(out);
      })
      .catch(() => {
        if (!cancel) setError('No se pudo cargar el listado');
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
      <p className="muted">Monitores reportados por el agente en cada computadora.</p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>PC origen</th>
                <th>Nombre</th>
                <th>Resolución</th>
                <th>Pulgadas</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Sin monitores reportados
                  </td>
                </tr>
              ) : (
                filas.map(f => (
                  <tr key={f.key}>
                    <td>{f.hostname}</td>
                    <td>{f.nombre ?? '—'}</td>
                    <td>{f.resolucion ?? '—'}</td>
                    <td>{fmtNumOGuion(f.pulgadas, 1)}</td>
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

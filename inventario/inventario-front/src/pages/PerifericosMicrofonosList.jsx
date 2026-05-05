import { useState, useEffect } from 'react';
import { fetchComputadoras, fetchComputadora } from '../api/computadoraApi';

function PerifericosMicrofonosList() {
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
          const entrada = det?.perifericos?.audio?.entrada ?? [];
          entrada.forEach(a => {
            out.push({
              key: `${uuid}-${a.nombre ?? ''}-${out.length}`,
              hostname,
              nombre: a.nombre,
              fabricante: a.fabricante,
              estado: a.estado,
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
      <h1>Micrófonos</h1>
      <p className="muted">Dispositivos de audio de entrada (micrófonos) reportados por el agente.</p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>PC origen</th>
                <th>Nombre</th>
                <th>Fabricante</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Sin micrófonos reportados
                  </td>
                </tr>
              ) : (
                filas.map(f => (
                  <tr key={f.key}>
                    <td>{f.hostname}</td>
                    <td>{f.nombre ?? '—'}</td>
                    <td>{f.fabricante ?? '—'}</td>
                    <td>{f.estado ?? '—'}</td>
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

export default PerifericosMicrofonosList;

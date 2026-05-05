import { useState, useEffect } from 'react';
import { fetchComputadoras, fetchComputadora } from '../api/computadoraApi';
import { esWebcamClaseCamera } from '../utils/perifericos';

function PerifericosWebcamsList() {
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
          const usb = det?.perifericos?.dispositivosUsb ?? [];
          usb.filter(esWebcamClaseCamera).forEach(d => {
            out.push({
              key: `${uuid}-${d.nombre ?? ''}-${out.length}`,
              hostname,
              nombre: d.nombre,
              fabricante: d.fabricante,
              clase: d.clase,
              conexion: d.conexion,
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
      <h1>Webcams</h1>
      <p className="muted">
        Solo dispositivos con clase USB <strong>Camera</strong> (UVC). No se listan entradas duplicadas
        que Windows marca como <code>Media</code> para el mismo equipo.
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
                    Sin webcams reportadas
                  </td>
                </tr>
              ) : (
                filas.map(f => (
                  <tr key={f.key}>
                    <td>{f.hostname}</td>
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

export default PerifericosWebcamsList;

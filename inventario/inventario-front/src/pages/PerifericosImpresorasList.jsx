import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchImpresorasAgrupadas } from '../api/impresoraApi';

function claveFila(grupo, index) {
  const n = grupo?.nombre ?? '';
  const d = grupo?.driver ?? '';
  const p = grupo?.puerto ?? '';
  return `${n}|${d}|${p}|${index}`;
}

function PerifericosImpresorasList() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchImpresorasAgrupadas()
      .then(data => {
        if (!cancel) setGrupos(Array.isArray(data) ? data : []);
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
      <h1>Impresoras</h1>
      <p className="muted">
        Solo equipos de impresión físicos o de red hacia hardware real. Se excluyen virtuales del
        sistema (PDF, XPS, OneNote), fax de Windows, AnyDesk y similares. Una fila por impresora
        única (mismo nombre, driver y puerto); la columna PCs enlaza cada equipo donde aparece.
      </p>
      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Impresora</th>
                <th>Driver</th>
                <th>Puerto</th>
                <th>PCs</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Sin impresoras físicas reportadas. Si debería haber, comprobá en el detalle de la
                    computadora que el agente haya leído las impresoras y vuelva a sincronizar.
                  </td>
                </tr>
              ) : (
                grupos.map((grupo, index) => (
                  <tr key={claveFila(grupo, index)}>
                    <td>{grupo.nombre ?? '—'}</td>
                    <td>{grupo.driver ?? '—'}</td>
                    <td>{grupo.puerto ?? '—'}</td>
                    <td className="td-pcs-impresora">
                      {grupo.pcs?.length ? (
                        grupo.pcs.map((pc, i) => (
                          <span key={pc.uuid ?? `${i}`}>
                            {i > 0 ? (
                              <span className="pcs-sep" aria-hidden="true">
                                {' · '}
                              </span>
                            ) : null}
                            <Link className="link-inline" to={`/computadoras/${pc.uuid}`}>
                              {pc.hostname ?? pc.uuid ?? '—'}
                            </Link>
                          </span>
                        ))
                      ) : (
                        '—'
                      )}
                    </td>
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

export default PerifericosImpresorasList;

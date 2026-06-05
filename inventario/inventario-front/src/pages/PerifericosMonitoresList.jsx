import { useState, useEffect } from 'react';
import { fetchMonitoresReportadosAgente } from '../api/monitorApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
} from '../components/studio/StudioUi';
import PerifericosTable from '../components/PerifericosTable';

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return 'N/A';
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : 'N/A';
}

function claveFila(r, index) {
  return `${r.pcUuid ?? ''}-${r.nombre ?? ''}-${r.resolucion ?? ''}-${index}`;
}

function limpiarNombre(n) {
  return (n ?? '—').replace(/\u0000/g, '');
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

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title="Administración de Monitores"
      subtitle="Gestión de pantallas y displays enlazados a las estaciones de trabajo corporativas."
    >
      <PerifericosTable 
        items={filas} 
        type="monitor" 
        renderSpecs={(mon) => (
          <>Resolución: {mon.resolucion || '—'} <span className="text-slate-300 mx-1">|</span> Pulgadas: {fmtNumOGuion(mon.pulgadas, 1)}"</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosMonitoresList;

import { usePerifericosAgenteListados } from '../context/PerifericosAgenteListadosContext';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
} from '../components/studio/StudioUi';
import PerifericosTable from '../components/PerifericosTable';

function claveFila(f, index) {
  return `${f.pcUuid ?? ''}-${f.nombre ?? ''}-${index}`;
}

function PerifericosParlantesList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = (listados?.parlantes ?? [])
    .filter(p => {
      const nombre = (p.nombre ?? '').toLowerCase();
      const fabricante = (p.fabricante ?? '').toLowerCase();
      return !nombre.includes('integrado') && !fabricante.includes('integrado');
    });

  if (loading) return <StudioLoading />;
  if (error) return <StudioError message={error?.message ?? 'No se pudo cargar el listado'} />;

  return (
    <StudioPageShell
      title="Administración de Parlantes"
      subtitle="Dispositivos de reproducción de audio reportados por el agente en cada estación."
    >
      <PerifericosTable 
        items={filas} 
        type="parlante" 
        renderSpecs={(p) => (
          <>Fabricante: {p.fabricante || 'Standard'} <span className="text-slate-300 mx-1">|</span> {p.estado || 'OK'}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosParlantesList;

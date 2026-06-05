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

function PerifericosMicrofonosList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = listados?.microfonos ?? [];

  if (loading) return <StudioLoading />;
  if (error) return <StudioError message={error?.message ?? 'No se pudo cargar el listado'} />;

  return (
    <StudioPageShell
      title="Administración de Micrófonos"
      subtitle="Dispositivos de captura de voz reportados por el agente en cada estación de trabajo."
    >
      <PerifericosTable 
        items={filas} 
        type="microfono" 
        renderSpecs={(m) => (
          <>Fabricante: {m.fabricante || 'Standard'} <span className="text-slate-300 mx-1">|</span> {m.estado || 'OK'}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosMicrofonosList;

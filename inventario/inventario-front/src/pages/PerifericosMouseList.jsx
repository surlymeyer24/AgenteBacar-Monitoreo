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

function PerifericosMouseList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = listados?.mouse ?? [];

  if (loading) return <StudioLoading />;
  if (error) return <StudioError message={error?.message ?? 'No se pudo cargar el listado'} />;

  return (
    <StudioPageShell
      title="Administración de Mouses"
      subtitle="Unidades de puntero ópticos inalámbricos y ergonómicos activos analizados por telemetría."
    >
      <PerifericosTable 
        items={filas} 
        type="mouse" 
        renderSpecs={(m) => (
          <>Fabricante: {m.fabricante || 'Standard'} <span className="text-slate-300 mx-1">|</span> {m.conexion || 'USB'}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosMouseList;

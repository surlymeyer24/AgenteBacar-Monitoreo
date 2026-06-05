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

function PerifericosWebcamsList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = listados?.webcams ?? [];

  if (loading) return <StudioLoading />;
  if (error) return <StudioError message={error?.message ?? 'No se pudo cargar el listado'} />;

  return (
    <StudioPageShell
      title="Administración de Webcams"
      subtitle="Módulos de grabación de video y periféricos de captura habilitados."
    >
      <PerifericosTable 
        items={filas} 
        type="webcam" 
        renderSpecs={(cam) => (
          <>Fabricante: {cam.fabricante || 'USB Camera'} <span className="text-slate-300 mx-1">|</span> {cam.conexion || 'USB'}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosWebcamsList;

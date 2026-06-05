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

function PerifericosTecladosList() {
  const { listados, loading, error } = usePerifericosAgenteListados();
  const filas = listados?.teclados ?? [];

  if (loading) return <StudioLoading />;
  if (error) return <StudioError message={error?.message ?? 'No se pudo cargar el listado'} />;

  return (
    <StudioPageShell
      title="Administración de Teclados"
      subtitle="Módulos de entrada física inalámbricos y USB mapeados en los escritorios activos."
    >
      <PerifericosTable 
        items={filas} 
        type="teclado" 
        renderSpecs={(kb) => (
          <>Fabricante: {kb.fabricante || 'Standard'} <span className="text-slate-300 mx-1">|</span> {kb.conexion || 'USB'}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosTecladosList;

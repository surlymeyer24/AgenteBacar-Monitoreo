import { Laptop } from 'lucide-react';
import { StockInfoBanner } from '../StockEstadoBadges';
import { PIPELINE_COLUMNS, agruparPorPipeline } from '../../utils/pipelinePcHelpers';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';
import StockPcPipeline from './StockPcPipeline';

export default function StockUnidadesTab({
  pcsPipeline,
  buscarUnidad,
  onBuscarUnidadChange,
  estadoLabels,
  onOpenEditPc,
  onArmarPc,
  onAsignarPc,
  onSacarDePipeline,
  sacandoUuid,
}) {
  const grupos = agruparPorPipeline(pcsPipeline, estadoLabels);
  const enDeposito = grupos.deposito?.length ?? 0;
  const enProceso = (grupos.armando?.length ?? 0) + (grupos.agente_pendiente?.length ?? 0) + (grupos.lista?.length ?? 0);

  return (
    <>
      <StockInfoBanner tipo="unidades" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">En pipeline</span>
            <span className="text-3xl font-black font-mono text-blue-600">{pcsPipeline.length}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm sm:col-span-2">
          <div className="flex flex-wrap gap-4 w-full">
            {PIPELINE_COLUMNS.map(col => (
              <div key={col.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotCls}`} />
                <span className="text-xs font-bold text-slate-600">{col.title}</span>
                <span className="text-sm font-black font-mono text-slate-900">{grupos[col.id]?.length ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 font-medium -mt-2">
        {enDeposito}
        {' '}
        sin armar ·
        {' '}
        {enProceso}
        {' '}
        en preparación o conciliación
      </p>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscarUnidad}
            onChange={onBuscarUnidadChange}
            placeholder="Buscar por hostname, UUID, SO..."
          />
        </TableFilters>
      </StudioFilterBar>

      <StockPcPipeline
        pcs={pcsPipeline}
        estadoLabels={estadoLabels}
        onOpenEditPc={onOpenEditPc}
        onArmarPc={onArmarPc}
        onAsignarPc={onAsignarPc}
        onSacarDePipeline={onSacarDePipeline}
        sacandoUuid={sacandoUuid}
      />
    </>
  );
}

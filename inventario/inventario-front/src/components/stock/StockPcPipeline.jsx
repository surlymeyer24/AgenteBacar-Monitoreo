import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, UserCheck, Edit2, MapPin, GripVertical, ArrowRight, GitMerge, Monitor,
} from 'lucide-react';
import {
  PIPELINE_COLUMNS,
  agruparPorPipeline,
  transicionPipelinePermitida,
  puedeArmarEnPipeline,
  puedeAsignarEnPipeline,
} from '../../utils/pipelinePcHelpers';
import { UBICACION_DEPOSITO_DEFAULT } from '../../utils/stockPcHelpers';
import { getUbicacionStock } from '../../utils/stockListHelpers';
import WriteGate from '../WriteGate';

function resumenPc(pc) {
  const spec = pc?.especificacionEsperada;
  if (!spec) return pc?.sistemaOperativo || pc?.tipoEquipo || null;
  const parts = [];
  if (spec.cpuModelo) parts.push(spec.cpuModelo);
  if (spec.ramTotalGb) parts.push(`${spec.ramTotalGb} GB`);
  return parts.join(' · ') || pc?.sistemaOperativo || null;
}

function PipelineCard({
  pc,
  columnId,
  estadoLabels,
  onOpenEditPc,
  onArmarPc,
  onAsignarPc,
  onSacarDePipeline,
  sacando,
  onDragStart,
  onDragEnd,
  isDragging,
}) {
  const resumen = resumenPc(pc);
  const ubicacion = getUbicacionStock(pc) || pc?.ubicacion || UBICACION_DEPOSITO_DEFAULT;

  let accion = null;
  if (columnId === 'deposito' && puedeArmarEnPipeline(pc)) {
    accion = { label: 'Armar combo', icon: Package, onClick: () => onArmarPc(pc), cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' };
  } else if (columnId === 'lista' && puedeAsignarEnPipeline(pc, estadoLabels)) {
    accion = { label: 'Asignar', icon: UserCheck, onClick: () => onAsignarPc(pc), cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' };
  } else if (columnId === 'agente_pendiente') {
    accion = { label: 'Conciliaciones', icon: GitMerge, onClick: () => {}, cls: 'bg-amber-600 hover:bg-amber-700 text-white', to: '/conciliaciones' };
  }

  const AccionIcon = accion?.icon;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, pc, columnId)}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded-xl p-3 shadow-sm transition-all ${
        isDragging ? 'opacity-40 border-dashed border-slate-300' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
        <div className="flex-1 min-w-0">
          <Link
            to={`/computadoras/${pc.uuid}`}
            className="font-mono font-bold text-sm text-blue-600 hover:underline block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {pc.hostname || pc.uuid?.slice(0, 8)}
          </Link>
          {resumen && (
            <p className="text-[11px] text-slate-500 mt-1 truncate" title={resumen}>{resumen}</p>
          )}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{ubicacion}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditPc(pc);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
            <WriteGate>
              <button
                type="button"
                disabled={sacando}
                onClick={(e) => {
                  e.stopPropagation();
                  onSacarDePipeline?.(pc);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                title="Vuelve al lote de Stock de PCs y se elimina la unidad"
              >
                <Monitor className="w-3 h-3" />
                {sacando ? 'Sacando…' : 'Devolver a Stock de PCs'}
              </button>
            </WriteGate>
            {accion && (
              accion.to ? (
                <Link
                  to={accion.to}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md ${accion.cls}`}
                >
                  {AccionIcon && <AccionIcon className="w-3 h-3" />}
                  {accion.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={accion.onClick}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md ${accion.cls}`}
                >
                  {AccionIcon && <AccionIcon className="w-3 h-3" />}
                  {accion.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockPcPipeline({
  pcs,
  estadoLabels,
  onOpenEditPc,
  onArmarPc,
  onAsignarPc,
  onSacarDePipeline,
  sacandoUuid,
}) {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const grupos = useMemo(() => agruparPorPipeline(pcs, estadoLabels), [pcs, estadoLabels]);

  const handleDragStart = (e, pc, columnId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/pc-uuid', pc.uuid);
    e.dataTransfer.setData('application/from-col', columnId);
    setDragging({ pc, columnId });
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(columnId);
  };

  const handleDrop = (e, toCol) => {
    e.preventDefault();
    setDropTarget(null);
    const uuid = e.dataTransfer.getData('application/pc-uuid');
    const fromCol = e.dataTransfer.getData('application/from-col');
    const pc = pcs.find(p => p.uuid === uuid);
    if (!pc) return;

    const accion = transicionPipelinePermitida(fromCol, toCol, pc, estadoLabels);
    if (accion === 'armar') onArmarPc(pc);
    else if (accion === 'asignar') onAsignarPc(pc);
    else if (accion === 'conciliaciones') navigate('/conciliaciones');
    setDragging(null);
  };

  const total = pcs.length;

  if (total === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        No hay computadoras en el pipeline. Sacá una unidad del stock de PCs o creá una nueva.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5" />
        Arrastrá entre columnas para avanzar (Armar combo o Asignar). Clic en hostname para la ficha completa.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 flex-1 min-h-[420px]">
        {PIPELINE_COLUMNS.map((col) => {
          const items = grupos[col.id] ?? [];
          const isTarget = dropTarget === col.id && dragging && dragging.columnId !== col.id;
          return (
            <div
              key={col.id}
              className={`flex flex-col w-[min(100%,260px)] shrink-0 rounded-xl border transition-colors ${
                isTarget ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-200' : 'border-slate-200 bg-slate-50/80'
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDropTarget(prev => (prev === col.id ? null : prev))}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`px-3 py-2.5 border-b rounded-t-xl ${col.headerCls}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotCls}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wide truncate">{col.title}</span>
                  </div>
                  <span className="text-xs font-black font-mono bg-white/60 px-1.5 py-0.5 rounded">{items.length}</span>
                </div>
                <p className="text-[10px] font-medium opacity-80 mt-1 leading-snug">{col.hint}</p>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[520px] min-h-[120px]">
                {items.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-6 px-2">Vacío</p>
                ) : (
                  items.map(pc => (
                    <PipelineCard
                      key={pc.uuid}
                      pc={pc}
                      columnId={col.id}
                      estadoLabels={estadoLabels}
                      onOpenEditPc={onOpenEditPc}
                      onArmarPc={onArmarPc}
                      onAsignarPc={onAsignarPc}
                      onSacarDePipeline={onSacarDePipeline}
                      sacando={sacandoUuid === pc.uuid}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={dragging?.pc?.uuid === pc.uuid}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

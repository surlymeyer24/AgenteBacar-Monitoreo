import React, { useState } from 'react';
import { Asset, User, Assignment } from '../types';
import { 
  Users, CheckCircle, RefreshCw, Layers2, FileText, Plus,
  Sparkles, Calendar, ChevronRight, CornerLeftUp, ShieldAlert, BadgeInfo, Play, UserPlus, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssignmentsProps {
  assignments: Assignment[];
  assets: Asset[];
  users: User[];
  onAssign: (assignment: Omit<Assignment, 'id'>) => void;
  onReturn: (assignmentId: string, conditionOnReturn: string, notes?: string) => void;
}

export default function Assignments({ assignments, assets, users, onAssign, onReturn }: AssignmentsProps) {
  // Creator flow states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [conditionOnAssign, setConditionOnAssign] = useState('Excelente estado, limpio corporativo');
  const [assignNotes, setAssignNotes] = useState('');
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [errorWord, setErrorWord] = useState('');
  const [successWord, setSuccessWord] = useState('');

  // Return flow states
  const [returningAssignmentId, setReturningAssignmentId] = useState<string | null>(null);
  const [conditionOnReturn, setConditionOnReturn] = useState('Buen estado, desgaste cosmético normal');
  const [returnNotes, setReturnNotes] = useState('');

  // Filter available assets (Laptops, Monitors, etc. that are NOT assigned)
  const availableAssets = assets.filter(a => a.status === 'Available');

  // Submit assignments
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWord('');
    setSuccessWord('');

    if (!selectedUserId) {
      setErrorWord('Selecciona un colaborador.');
      return;
    }
    if (!selectedAssetId) {
      setErrorWord('Selecciona un dispositivo disponible de la lista.');
      return;
    }

    onAssign({
      assetId: selectedAssetId,
      userId: selectedUserId,
      assignedDate: new Date().toISOString().split('T')[0],
      conditionOnAssign: conditionOnAssign,
      status: 'Active',
      notes: assignNotes
    });

    setSuccessWord('Equipo asignado correctamente.');
    setSelectedUserId('');
    setSelectedAssetId('');
    setAssignNotes('');
    setShowAssignPanel(false);

    // Clear alert
    setTimeout(() => setSuccessWord(''), 4000);
  };

  // Submit returns
  const handleReturnSubmit = (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    onReturn(assignmentId, conditionOnReturn, returnNotes);
    setReturningAssignmentId(null);
    setReturnNotes('');
  };

  return (
    <div id="assignments-view" className="space-y-6">
      
      {/* Overview Head */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div id="assignments-title-block">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Custodia e Historial de Asignaciones</h1>
          <p className="text-xs text-slate-500">Supervisa las entregas y retornos de equipos físicos a los empleados de la organización.</p>
        </div>
        <div>
          <button 
            id="toggle-assign-form-btn"
            onClick={() => { setShowAssignPanel(!showAssignPanel); setErrorWord(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Asignar Nuevo Equipo
          </button>
        </div>
      </div>

      {successWord && (
        <div className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successWord}</span>
        </div>
      )}

      {/* RENDER NEW ASSIGNMENT CREATOR PANEL */}
      <AnimatePresence>
        {showAssignPanel && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-950 text-sm">Formulario de Asignación de Custodia</h3>
              </div>
              <button 
                onClick={() => setShowAssignPanel(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cerrar Panel
              </button>
            </div>

            {errorWord && (
              <div className="p-2.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>{errorWord}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Collaborator */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">1. Colaborador Receptor *</label>
                <select 
                  id="assign-user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium bg-white focus:ring-1 focus:ring-blue-600 focus:outline"
                >
                  <option value="">-- Seleccionar Persona --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department} • {u.role})</option>
                  ))}
                </select>
              </div>

              {/* Select Asset */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">2. Activo en Stock Disponible *</label>
                <select 
                  id="assign-asset-select"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium bg-white focus:ring-1 focus:ring-blue-600 focus:outline"
                >
                  <option value="">-- {availableAssets.length > 0 ? `Seleccionar (${availableAssets.length} listos)` : 'Sin equipos disponibles'} --</option>
                  {availableAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.id} - {a.name} ({a.manufacturer} {a.model})</option>
                  ))}
                </select>
                {availableAssets.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">⚠️ Debes registrar marcas 'Disponibles' en el Catálogo.</p>
                )}
              </div>

              {/* Condition On Assign */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">3. Estado de Recepción de Entrega</label>
                <input 
                  id="assign-condition-input"
                  type="text"
                  placeholder="Ej. Reacondicionado, empaque de fábrica"
                  value={conditionOnAssign}
                  onChange={(e) => setConditionOnAssign(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline"
                />
              </div>

              {/* Assignment Notes */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block">4. Observaciones o Responsiva Adicional</label>
                <input 
                  id="assign-notes-input"
                  type="text"
                  placeholder="Ej. Se incluye mouse, dock station y mochila protectora de viaje."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline"
                />
              </div>

              {/* Submit CTA button */}
              <div className="flex items-end">
                <button 
                  id="assign-submit-btn"
                  type="submit"
                  disabled={availableAssets.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-xs disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  Registrar Firma Digital
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE CUSTODIES SECTION */}
      <div id="custodias-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers2 className="w-5 h-5 text-[#0c66e4]" />
              Equipamiento Asignado y Activo
            </h2>
            <p className="text-xs text-slate-500">Colaboradores con hardware bajo su custodia. Se muestran firmas pendientes de retorno.</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-0.5 self-start">
            {assignments.filter(a => a.status === 'Active').length} Custodias Vigentes
          </span>
        </div>

        {/* Assignments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Dispositivo Custodiado</th>
                <th className="py-3 px-4">Responsable (Empleado)</th>
                <th className="py-3 px-4">Fecha Entrega</th>
                <th className="py-3 px-4">Condición de Entrega</th>
                <th className="py-3 px-4">Comentarios</th>
                <th className="py-3 px-4 text-right">Acciones de Almacén</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {assignments.filter(a => a.status === 'Active').length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No se detectan custodias registradas de momento.
                  </td>
                </tr>
              ) : (
                assignments.filter(a => a.status === 'Active').map((asg) => {
                  const asset = assets.find(a => a.id === asg.assetId);
                  const user = users.find(u => u.id === asg.userId);

                  if (!asset || !user) return null;

                  return (
                    <tr key={asg.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-blue-600 font-bold">{asset.id}</span>
                          <p className="font-semibold text-slate-900 text-xs">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{asset.manufacturer} • {asset.model}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          {user.avatarUrl && (
                            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full border border-slate-100 object-cover" referrerPolicy="no-referrer" />
                          )}
                          <div className="leading-tight">
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{user.department} • {user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{asg.assignedDate}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 px-2 py-0.5 rounded">
                          {asg.conditionOnAssign}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic truncate max-w-[200px]" title={asg.notes}>
                        {asg.notes || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => setReturningAssignmentId(asg.id)}
                          className="px-2.5 py-1 text-xs border border-blue-200 hover:bg-blue-50 text-[#0c66e4] font-bold rounded-md transition-all flex items-center gap-1 ml-auto"
                        >
                          <CornerLeftUp className="w-3.5 h-3.5" />
                          Registrar Retorno
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Return Asset Dialog */}
      <AnimatePresence>
        {returningAssignmentId && (
          <div id="return-modal" className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  Devolución de Activo a Almacén
                </h3>
                <button 
                  onClick={() => setReturningAssignmentId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={(e) => handleReturnSubmit(e, returningAssignmentId)} className="space-y-4 text-xs">
                <div className="p-3 border border-indigo-100 bg-indigo-50/10 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Al documentar el retorno, el activo IT liberado pasará automáticamente al estado <span className="font-semibold text-slate-900">Disponible</span> en bodega para próximas asignaciones de personal.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Condición Física de Recepción *</label>
                  <input 
                    id="return-condition-input"
                    type="text"
                    required
                    value={conditionOnReturn}
                    onChange={(e) => setConditionOnReturn(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Notas de Liquidación / Incidencias</label>
                  <textarea 
                    id="return-notes-input"
                    rows={2}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Escribe daño cosmético defectuoso, componentes faltantes o formateo de disco realizado..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setReturningAssignmentId(null)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
                  >
                    Cerrar
                  </button>
                  <button 
                    id="confirm-return-btn"
                    type="submit"
                    className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded text-xs font-bold"
                  >
                    Liberar y Almacenar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIOUS COMPLETED ASSIGNMENTS LOG */}
      <div id="historial-custodias-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              Bitácora Histórica de Retornos Completados
            </h2>
            <p className="text-xs text-slate-500">Auditoría de activos devueltos, firmas cerradas y control de desgaste.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {assignments.filter(a => a.status === 'Completed').length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400 font-medium">Historial vacío. Aún no se registran liberaciones de equipos de cómputo.</p>
          ) : (
            assignments.filter(a => a.status === 'Completed').map((asg) => {
              const asset = assets.find(a => a.id === asg.assetId);
              const user = users.find(u => u.id === asg.userId);

              return (
                <div key={asg.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      Liberación de: <span className="text-blue-600 font-mono font-bold mr-1">{asg.assetId}</span> 
                      {asset?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cerrado de custodia de: <span className="font-semibold text-slate-700">{user?.name || 'Inquilino'}</span> ({user?.department})
                    </p>
                    <div className="flex items-center gap-3.5 text-[10px] mt-1.5">
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">Entrega: {asg.assignedDate}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">Retorno: {asg.returnedDate}</span>
                    </div>
                  </div>

                  <div className="text-right sm:max-w-xs">
                    <p className="text-[11px] font-semibold text-slate-800">Recibido en: {asg.conditionOnReturn}</p>
                    {asg.notes && <p className="text-[10px] text-slate-400 italic">Notas: {asg.notes}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

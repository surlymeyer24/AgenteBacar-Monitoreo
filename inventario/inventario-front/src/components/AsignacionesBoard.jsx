import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Copy } from 'lucide-react';
import { updateEstado, updateResponsableInventario } from '../api/computadoraApi';

export default function AsignacionesBoard({ computadoras, onUpdateComputer }) {
  const navigate = useNavigate();
  const [selectedAssignSubTab, setSelectedAssignSubTab] = useState('todas');
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [assignFilterLocation, setAssignFilterLocation] = useState('All');
  const [assignSortOrder, setAssignSortOrder] = useState('hostname-asc');

  const [rowAssignee, setRowAssignee] = useState({});
  const [rowNewStatus, setRowNewStatus] = useState({});
  const [rowMotive, setRowMotive] = useState({});
  const [copiedAnydesk, setCopiedAnydesk] = useState(null);

  // Derive unique locations
  const locations = ['All', ...new Set(computadoras.map(c => c.ubicacion || 'CAPITAL_HUMANO'))];

  // Filtering
  const unifiedFilteredComputers = computadoras.filter(c => {
    // 1. Search
    const term = assignSearchTerm.toLowerCase();
    const searchMatch = !term || 
      (c.hostname && c.hostname.toLowerCase().includes(term)) ||
      (c.uuid && c.uuid.toLowerCase().includes(term)) ||
      (c.responsableInventario && c.responsableInventario.toLowerCase().includes(term)) ||
      (c.responsable_inventario && c.responsable_inventario.toLowerCase().includes(term));
    if (!searchMatch) return false;

    // 2. Location
    const ubi = c.ubicacion || 'CAPITAL_HUMANO';
    if (assignFilterLocation !== 'All' && ubi !== assignFilterLocation) return false;

    // 3. Subtab state
    const itState = c.estadoIt || c.estadoActual || 'Asignada';
    if (selectedAssignSubTab === 'asignadas' && itState !== 'Asignada') return false;
    if (selectedAssignSubTab === 'baja' && itState !== 'Retirada') return false;
    if (selectedAssignSubTab === 'sin_asignar' && itState !== 'Disponible') return false;
    if (selectedAssignSubTab === 'mantenimiento' && itState !== 'En Reparación') return false;

    return true;
  });

  // Sorting
  unifiedFilteredComputers.sort((a, b) => {
    if (assignSortOrder === 'hostname-asc') return (a.hostname||'').localeCompare(b.hostname||'');
    if (assignSortOrder === 'hostname-desc') return (b.hostname||'').localeCompare(a.hostname||'');
    if (assignSortOrder === 'uuid-asc') return (a.uuid||'').localeCompare(b.uuid||'');
    return 0;
  });

  // Counters
  const countTodas = computadoras.length;
  const countAsignadas = computadoras.filter(c => (c.estadoIt || c.estadoActual || 'Asignada') === 'Asignada').length;
  const countBaja = computadoras.filter(c => (c.estadoIt || c.estadoActual || 'Asignada') === 'Retirada').length;
  const countSinAsignar = computadoras.filter(c => (c.estadoIt || c.estadoActual || 'Asignada') === 'Disponible').length;
  const countMantenimiento = computadoras.filter(c => (c.estadoIt || c.estadoActual || 'Asignada') === 'En Reparación').length;

  const handleCopyAnydesk = (id, e) => {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedAnydesk(id);
    setTimeout(() => setCopiedAnydesk(null), 1800);
  };

  const handleSaveCustody = async (c) => {
    const value = rowAssignee[c.uuid] !== undefined ? rowAssignee[c.uuid] : (c.responsableInventario || c.responsable_inventario || '');
    try {
      await updateResponsableInventario(c.uuid, value.trim() || null);
      if (onUpdateComputer) {
        onUpdateComputer({ ...c, responsableInventario: value.trim() || null });
      }
      alert(`Asignado físico actualizado para "${c.hostname}". Copia guardada en registro.`);
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleApplyStateChange = async (c) => {
    const nextState = rowNewStatus[c.uuid] || c.estadoIt || c.estadoActual || 'Asignada';
    const motiveText = rowMotive[c.uuid] || '';

    if (!motiveText.trim()) {
      alert('Debe especificar un motivo detallado obligatoriamente para cambiar el estado.');
      return;
    }

    try {
      await updateEstado(c.uuid, nextState, motiveText);
      if (onUpdateComputer) {
        onUpdateComputer({ ...c, estadoActual: nextState, estadoIt: nextState });
      }
      setRowMotive(prev => ({ ...prev, [c.uuid]: '' }));
      alert(`Se actualizó el estado a "${nextState}" correctamente.`);
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  return (
    <div id="asignaciones-board-section" className="flex flex-col flex-1 min-h-0 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-slate-500 text-xs border-b border-slate-100 pb-2 shrink-0">
        <span>
          {unifiedFilteredComputers.length} de {computadoras.length} equipos • {selectedAssignSubTab === 'todas' ? 'Todos' : selectedAssignSubTab === 'asignadas' ? 'Asignadas' : selectedAssignSubTab === 'baja' ? 'Baja' : selectedAssignSubTab === 'sin_asignar' ? 'Sin Asignar' : 'Mantenimiento'}
        </span>
      </div>

      <div className="flex border-b border-slate-200 text-xs gap-4 overflow-x-auto whitespace-nowrap pb-1 shrink-0">
        {[
          { id: 'todas', label: `Todo (${countTodas})` },
          { id: 'asignadas', label: `Asignadas (${countAsignadas})` },
          { id: 'baja', label: `Baja (${countBaja})` },
          { id: 'sin_asignar', label: `Sin asignar (${countSinAsignar})` },
          { id: 'mantenimiento', label: `Mantenimiento (${countMantenimiento})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedAssignSubTab(tab.id)}
            className={`pb-2.5 font-extrabold relative transition-all px-1 cursor-pointer ${selectedAssignSubTab === tab.id ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Hostname, responsable, UUID..."
              value={assignSearchTerm}
              onChange={(e) => setAssignSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-700 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
            <span className="text-[10px] uppercase text-slate-400">Ubicación</span>
            <select
              value={assignFilterLocation}
              onChange={(e) => setAssignFilterLocation(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 cursor-pointer font-extrabold w-full"
            >
              <option value="All">Todas ({computadoras.length})</option>
              {locations.filter(l => l !== 'All').map(loc => {
                const locQty = computadoras.filter(c => (c.ubicacion || 'CAPITAL_HUMANO') === loc).length;
                return <option key={loc} value={loc}>{loc} ({locQty})</option>;
              })}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
            <span className="text-[10px] uppercase text-slate-400">Ordenar</span>
            <select
              value={assignSortOrder}
              onChange={(e) => setAssignSortOrder(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 cursor-pointer font-extrabold w-full"
            >
              <option value="hostname-asc">Hostname A-Z</option>
              <option value="hostname-desc">Hostname Z-A</option>
              <option value="uuid-asc">UUID A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto h-full relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">HOSTNAME</th>
                <th className="py-2.5 px-4">UUID</th>
                <th className="py-2.5 px-4">USUARIO (AGENTE)</th>
                <th className="py-2.5 px-4 min-w-[200px]">ASIGNADO (REGISTRO MANUAL)</th>
                <th className="py-2.5 px-4">UBICACIÓN</th>
                <th className="py-2.5 px-4">ESTADO</th>
                <th className="py-2.5 px-4 min-w-[250px]">CAMBIAR ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {unifiedFilteredComputers.length > 0 ? (
                unifiedFilteredComputers.map((c) => {
                  const currentAssignee = rowAssignee[c.uuid] !== undefined ? rowAssignee[c.uuid] : (c.responsableInventario || c.responsable_inventario || '');
                  const currentItState = c.estadoIt || c.estadoActual || 'Asignada';
                  const nextStateSelected = rowNewStatus[c.uuid] || currentItState;
                  const currentMotiveText = rowMotive[c.uuid] || '';

                  return (
                    <tr 
                      key={c.uuid}
                      className="hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
                      onClick={() => navigate(`/computadoras/${c.uuid}`)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.hostname}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-400 select-all" onClick={e => e.stopPropagation()}>
                        {(c.uuid || '').substring(0, 8)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-semibold">
                        SYSTEM
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5 max-w-sm">
                          <input 
                            type="text"
                            placeholder="Nombre o referencia"
                            value={currentAssignee}
                            onChange={(evt) => setRowAssignee(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0c66e4] focus:bg-white text-[11px] rounded transition-all font-semibold text-slate-700 w-full"
                          />
                          <button
                            onClick={() => handleSaveCustody(c)}
                            className="px-3 py-1 bg-[#0c66e4] hover:bg-blue-700 text-white font-bold text-[10px] rounded transition-colors cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase border border-slate-200">
                          {c.ubicacion || 'CAPITAL_HUMANO'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {currentItState === 'Asignada' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700">Asignada</span>
                        ) : currentItState === 'Disponible' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">Disponible</span>
                        ) : currentItState === 'En Reparación' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 border border-amber-200 text-amber-700">Reparación</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 border border-rose-200 text-rose-700">De baja</span>
                        )}
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 max-w-lg bg-slate-50/70 p-1.5 rounded border border-slate-200">
                          <div className="flex gap-1.5 mb-1">
                            <select
                              value={nextStateSelected}
                              onChange={(evt) => setRowNewStatus(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                              className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold cursor-pointer"
                            >
                              <option value="Asignada">Asignada</option>
                              <option value="Disponible">Disponible (Sin asignar)</option>
                              <option value="En Reparación">En Reparación</option>
                              <option value="Retirada">Retirada (Dar de baja)</option>
                            </select>
                          </div>
                          <div className="flex gap-1.5">
                            <input 
                              type="text"
                              placeholder="Motivo (obligatorio)"
                              value={currentMotiveText}
                              onChange={(evt) => setRowMotive(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0c66e4] text-[10px] rounded transition-all font-medium text-slate-800 w-full"
                            />
                            <button
                              onClick={() => handleApplyStateChange(c)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded transition-colors shrink-0 cursor-pointer"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                    No se encontraron resultados en la vista de asignación.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

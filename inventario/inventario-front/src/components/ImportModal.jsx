import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Check, Activity, Trash2, Plus, Info, RefreshCw, X 
} from 'lucide-react';
import { parseImportFile } from '../lib/genericImport';

function ImportModal({ isOpen, onClose, onImport, schema, entityName, isImporting, existingData = [], matchFields = ['numeroSerie', 'nroSerie', 'ip', 'direccionIp', 'nombre', 'mac', 'macUplink'] }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const columns = Object.keys(schema);

  const checkIfExists = useCallback((row) => {
    if (!existingData || existingData.length === 0) return false;
    return existingData.some(item => {
      return matchFields.some(field => {
        const rowVal = row[field];
        const itemVal = item[field];
        if (!rowVal || !itemVal) return false;
        return String(rowVal).trim().toLowerCase() === String(itemVal).trim().toLowerCase();
      });
    });
  }, [existingData, matchFields]);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');
    setPreviewData([]);
    try {
      setLoading(true);
      const rows = await parseImportFile(selectedFile, schema);
      setPreviewData(rows);
    } catch (err) {
      setError(err.message || 'Error al procesar el archivo');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, [schema]);

  const handleFileInputChange = (e) => {
    const selected = e.target.files[0];
    handleFile(selected);
  };

  const handleImport = () => {
    if (!previewData || previewData.length === 0) return;
    onImport(previewData);
  };

  const updateRow = (idx, colKey, value) => {
    const newData = [...previewData];
    newData[idx][colKey] = value;
    setPreviewData(newData);
  };

  const addRow = () => {
    const newRow = {};
    columns.forEach(k => newRow[k] = '');
    setPreviewData([...previewData, newRow]);
  };

  const removeRow = (idx) => {
    setPreviewData(previewData.filter((_, i) => i !== idx));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-slate-200 rounded-xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    Importación Masiva: {entityName}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sube tu archivo de datos. Podrás revisar y editar la tabla antes de guardar.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={!isImporting ? onClose : undefined}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded text-slate-600 transition-colors flex items-center gap-1"
                disabled={isImporting}
              >
                <X className="w-3.5 h-3.5" />
                Cerrar
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-bold text-slate-700 relative">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {previewData.length === 0 && !loading ? (
                <div className="space-y-4">
                  {/* File Dropzone */}
                  <label 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all flex flex-col items-center justify-center space-y-3 ${
                      isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[0.98]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-4 bg-emerald-50 rounded-full">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Arrastra tu planilla aquí o haz clic para seleccionar</p>
                      <p className="text-[11px] text-slate-400 font-medium font-sans mt-1">Soporta formatos estándar de planilla de cálculo (.xlsx, .xls, .csv, .json)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".csv, .xlsx, .xls, .json, text/csv, application/json" 
                      onChange={handleFileInputChange} 
                    />
                  </label>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 text-slate-600">
                    <Info className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Instrucciones del importador inteligente</span>
                      <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5 leading-relaxed">
                        El sistema mapeará automáticamente las columnas basadas en cabeceras conocidas. Una vez cargado el archivo, podrás visualizar todas las filas y hacer ediciones rápidas.
                      </p>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <span className="font-bold text-blue-900 block text-[10px] uppercase tracking-wider mb-1">Columnas detectadas automáticamente:</span>
                        <p className="text-[11px] text-blue-800 font-mono">
                          {Object.values(schema).map(arr => arr[0] || '').join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : previewData.length > 0 ? (
                /* INTERACTIVE SPREADSHEET PREVIEW GRID */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-500 text-white rounded-md">
                        <Check className="w-4 h-4 font-black" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">Lectura de archivo correcta</p>
                        <p className="text-[10px] text-slate-500 font-bold font-mono uppercase leading-tight mt-0.5">
                          {file?.name} - {previewData.length} filas detectadas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-bold"
                      disabled={isImporting}
                    >
                      Limpiar y cargar otro archivo
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <div className="flex items-center gap-3">
                        <span>PREVIEW - HAZ CLIC EN LAS CELDAS PARA MODIFICAR:</span>
                        {existingData && existingData.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] border border-emerald-200">Nuevos: {previewData.filter(r => !checkIfExists(r)).length}</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] border border-orange-200">Duplicados: {previewData.filter(r => checkIfExists(r)).length}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={addRow}
                        className="px-2 py-1.5 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded transition-all font-extrabold flex items-center gap-1 font-sans"
                        disabled={isImporting}
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                        <span>Agregar Fila</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto shadow-sm bg-white">
                      <table className="w-full text-left border-collapse font-sans">
                        <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm border-b border-slate-200">
                          <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                            <th className="py-3 px-3 w-12 text-center">Nº</th>
                            <th className="py-3 px-3 w-20 text-center">Estado</th>
                            {columns.map(col => (
                              <th key={col} className="py-3 px-3 capitalize">
                                {col}
                              </th>
                            ))}
                            <th className="py-3 px-3 text-center w-16">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {previewData.map((row, idx) => {
                            const yaExiste = checkIfExists(row);
                            return (
                            <tr key={idx} className={`transition-colors ${yaExiste ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-slate-50'}`}>
                              <td className="py-2.5 px-3 align-middle text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-2 align-middle text-center">
                                {yaExiste ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200" title="Posible duplicado (Coincide IP, Nro Serie, MAC o Nombre)">
                                    ⚠️ Existe
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    ✅ Nuevo
                                  </span>
                                )}
                              </td>
                              {columns.map(col => (
                                <td key={col} className="py-1 px-1 border-r border-slate-100 align-middle last:border-r-0">
                                  <input 
                                    type="text"
                                    value={row[col] || ''}
                                    onChange={(e) => updateRow(idx, col, e.target.value)}
                                    placeholder="Vacío"
                                    disabled={isImporting}
                                    className="w-full bg-transparent px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white border border-transparent hover:border-slate-200 rounded text-slate-700 transition-all placeholder:text-slate-300"
                                  />
                                </td>
                              ))}
                              <td className="py-2.5 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => removeRow(idx)}
                                  disabled={isImporting}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  title="Quitar Fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {previewData.length === 0 && (
                        <div className="p-8 text-center text-slate-400 font-medium">
                          No hay filas. Agrega una nueva o carga otro archivo.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Simulated Loading block */}
              {loading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3.5 rounded-b-xl">
                  <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                  <p className="text-sm font-black text-slate-800">Analizando y mapeando columnas...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isImporting}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || isImporting || !previewData || previewData.length === 0}
                onClick={handleImport}
                className="px-6 py-2.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>Confirmar e Importar {previewData.length > 0 ? previewData.length : ''} Registros</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ImportModal;

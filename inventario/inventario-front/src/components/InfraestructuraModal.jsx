import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Edit2, Server } from 'lucide-react';

export default function InfraestructuraModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isEdit,
  title, 
  fields, 
  formState, 
  onChange,
  error 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-650">
              {isEdit ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Server className="w-5 h-5 text-emerald-600" />}
              <span className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {isEdit ? `Editar ${title}` : `Nuevo Registro de ${title}`}
              </span>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5 font-bold text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(field => (
                <div key={field.name} className={`space-y-1 ${field.fullWidth ? 'sm:col-span-2' : ''}`}>
                  <label className="block text-slate-600 uppercase text-[10px] tracking-wider">{field.label} {field.required && '*'}</label>
                  
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formState[field.name] || ''}
                      onChange={onChange}
                      required={field.required}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-slate-800 font-semibold"
                    >
                      <option value="">-- Seleccionar --</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      value={formState[field.name] || ''}
                      onChange={onChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-slate-800 font-semibold resize-none"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      value={formState[field.name] || ''}
                      onChange={onChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-slate-800 font-semibold"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 mt-2 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

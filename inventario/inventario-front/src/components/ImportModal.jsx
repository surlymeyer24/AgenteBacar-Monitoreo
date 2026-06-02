import { useState } from 'react';
import { parseImportFile } from '../lib/genericImport';

function ImportModal({ isOpen, onClose, onImport, schema, entityName, isImporting }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setPreviewData(null);
    try {
      setLoading(true);
      const rows = await parseImportFile(selected, schema);
      setPreviewData(rows);
    } catch (err) {
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  }

  function handleImport() {
    if (!previewData || previewData.length === 0) return;
    onImport(previewData);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={!isImporting ? onClose : undefined}>
      <div
        className="modal-panel card"
        style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={ev => ev.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Importar {entityName} desde Excel/CSV</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls, .json, text/csv, application/json" 
            onChange={handleFileChange} 
            disabled={loading || isImporting} 
          />
        </div>

        {error && <p className="estado-msg error">{error}</p>}
        {loading && <p>Analizando archivo...</p>}

        {previewData && !loading && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
              Se detectaron {previewData.length} filas válidas.
            </p>
            {previewData.length > 0 && (
              <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                <table className="table" style={{ fontSize: '0.85rem', margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-table-header)' }}>
                    <tr>
                      {Object.keys(schema).map(k => <th key={k}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 15).map((row, i) => (
                      <tr key={i}>
                        {Object.keys(schema).map(k => <td key={k}>{row[k] || <span style={{ color: '#aaa' }}>—</span>}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {previewData.length > 15 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Mostrando solo las primeras 15 filas.
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onClose} 
            disabled={loading || isImporting}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            disabled={loading || isImporting || !previewData || previewData.length === 0}
            onClick={handleImport}
          >
            {isImporting ? 'Importando...' : 'Confirmar Importación'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;

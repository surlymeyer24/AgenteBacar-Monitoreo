import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchNvr, fetchCamarasPorNvr, fetchNvrs, actualizarNvr } from '../api/nvrApi';
import { fetchCamara, createCamara, asignarNvrCamara, fetchCamaras, deleteCamara } from '../api/camaraApi';
import {
  parseCamaraImportFile,
  importCamarasRowsToNvr,
  PLANTILLA_CSV_CAMARAS,
} from '../lib/camarasImport';
import { UBICACIONES_CAMARA_SUGERIDAS, labelUbicacionEnum } from '../constants/ubicaciones';
import InfraestructuraModal from '../components/InfraestructuraModal';

function fmtFechaAlta(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v);
}

function mergeCamaraDto(prev, dto) {
  if (!dto?.id) return prev;
  const idx = prev.findIndex(c => c.id === dto.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = { ...next[idx], ...dto };
    return next;
  }
  return [...prev, dto];
}

function NvrDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nvr, setNvr] = useState(null);
  const [camaras, setCamaras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
  const [progresoImport, setProgresoImport] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [msgBorrar, setMsgBorrar] = useState(null);
  const fileInputRef = useRef(null);
  const tablaCamarasRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    dispositivo: '',
    nombre: '',
    marca: '',
    descripcion: '',
    responsable: '',
    ubicacion: '',
    direccionIp: '',
    puerto: '',
    tipo: '',
    nvrId: '',
    estado: ''
  });
  const [modalError, setModalError] = useState('');
  const [nvrs, setNvrs] = useState([]);

  useEffect(() => {
    fetchNvrs()
      .then(setNvrs)
      .catch(() => {});
  }, []);

  const handleOpenAddModal = () => {
    setModalForm({
      dispositivo: '',
      nombre: '',
      marca: '',
      descripcion: '',
      responsable: '',
      ubicacion: '',
      direccionIp: '',
      puerto: '',
      tipo: 'Domo',
      nvrId: id || '',
      estado: 'OPERATIVO'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const [isEditNvrModalOpen, setIsEditNvrModalOpen] = useState(false);
  const [editNvrForm, setEditNvrForm] = useState({});
  const [editNvrError, setEditNvrError] = useState('');

  const handleOpenEditNvrModal = () => {
    if (!nvr) return;
    setEditNvrForm({
      id: nvr.id,
      nombre: nvr.nombre || '',
      direccionIp: nvr.direccionIp || '',
      puerto: nvr.puerto != null ? String(nvr.puerto) : '',
      descripcion: nvr.descripcion || ''
    });
    setEditNvrError('');
    setIsEditNvrModalOpen(true);
  };

  const handleEditNvrSubmit = async (e) => {
    e.preventDefault();
    setEditNvrError('');
    try {
      const payload = {
        dispositivo: nvr.id,
        nombre: editNvrForm.nombre.trim(),
        direccionIp: editNvrForm.direccionIp?.trim() || undefined,
        descripcion: editNvrForm.descripcion?.trim() || undefined,
      };
      const puertoNum = editNvrForm.puerto && String(editNvrForm.puerto).trim() !== '' 
        ? Number.parseInt(String(editNvrForm.puerto).trim(), 10) 
        : undefined;
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        payload.puerto = puertoNum;
      }
      await actualizarNvr(nvr.id, payload);
      const updatedNvr = await fetchNvr(nvr.id);
      setNvr(updatedNvr);
      setIsEditNvrModalOpen(false);
    } catch (err) {
      setEditNvrError(err.message || 'Error al actualizar NVR');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    // Parse port if provided
    const puertoNum =
      modalForm.puerto && String(modalForm.puerto).trim() !== '' 
        ? Number.parseInt(String(modalForm.puerto).trim(), 10) 
        : undefined;

    try {
      const body = {
        dispositivo: modalForm.dispositivo.trim(),
        nombre: modalForm.nombre.trim(),
        marca: modalForm.marca?.trim() || undefined,
        descripcion: modalForm.descripcion?.trim() || undefined,
        responsable: modalForm.responsable?.trim() || undefined,
        ubicacion: modalForm.ubicacion,
        direccionIp: modalForm.direccionIp?.trim() || undefined,
        tipo: modalForm.tipo?.trim() || undefined,
        nvrId: modalForm.nvrId?.trim() || undefined,
      };
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        body.puerto = puertoNum;
      }
      await createCamara(body);
      await recargarCamaras();
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Error al guardar");
    }
  };

  async function recargarCamaras() {
    const cams = await fetchCamarasPorNvr(id);
    setCamaras(Array.isArray(cams) ? cams : []);
  }

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    Promise.all([fetchNvr(id), fetchCamarasPorNvr(id)])
      .then(([n, cams]) => {
        if (cancelled) return;
        setNvr(n);
        setCamaras(Array.isArray(cams) ? cams : []);
        if (!n) setError('NVR no encontrada');
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el detalle');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!importando || camaras.length === 0) return;
    tablaCamarasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [camaras.length, importando]);

  function descargarPlantilla() {
    const blob = new Blob([PLANTILLA_CSV_CAMARAS], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-camaras-nvr.csv';
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onArchivoImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !nvr) return;
    setImportando(true);
    setResultadoImport(null);
    setProgresoImport(null);
    setMsgBorrar(null);
    try {
      const rows = await parseCamaraImportFile(file);
      if (rows.length > 0) {
        setProgresoImport({ fila: 0, total: rows.length, ultimoNombre: null, tipo: null, iniciando: true });
      }
      const res = await importCamarasRowsToNvr(
        rows,
        id,
        {
          fetchCamara,
          createCamara,
          asignarNvrCamara,
          fetchCamaras,
        },
        ev => {
          setCamaras(prev => mergeCamaraDto(prev, ev.camara));
          setProgresoImport({
            fila: ev.filaDatos,
            total: ev.totalFilasDatos,
            ultimoNombre: ev.camara?.nombre ?? ev.camara?.id,
            tipo: ev.tipo,
            iniciando: false,
          });
        },
      );
      setResultadoImport(res);
      await recargarCamaras();
    } catch (err) {
      setResultadoImport({ error: err?.message || String(err) });
    } finally {
      setImportando(false);
      setProgresoImport(null);
    }
  }

  async function eliminarCamaraFila(e, cam) {
    e.stopPropagation();
    if (!cam?.id || borrandoId) return;
    const nombre = (cam.nombre && String(cam.nombre).trim()) ? cam.nombre : cam.id;
    if (
      !window.confirm(
        `¿Borrar la cámara "${nombre}" (${cam.id})? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setBorrandoId(cam.id);
    setMsgBorrar(null);
    try {
      const ok = await deleteCamara(cam.id);
      if (!ok) {
        setMsgBorrar({ tipo: 'err', texto: 'No se encontró la cámara (quizá ya fue borrada).' });
        return;
      }
      setCamaras(prev => prev.filter(c => c.id !== cam.id));
      setMsgBorrar({ tipo: 'ok', texto: 'Cámara eliminada.' });
    } catch {
      setMsgBorrar({ tipo: 'err', texto: 'No se pudo eliminar la cámara.' });
    } finally {
      setBorrandoId(null);
    }
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!nvr) return <p className="estado-msg">NVR no encontrada</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/nvrs')}>
          ← Volver
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenEditNvrModal}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenAddModal}
          >
            Nueva cámara
          </button>
          <Link to="/nvrs/nueva" className="btn btn-secondary btn-sm">
            Crear NVR
          </Link>
        </div>
      </div>

      <h1 style={{ marginTop: '0.75rem' }}>{nvr.nombre}</h1>

      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>ID</dt><dd className="uuid">{nvr.id}</dd>
          <dt>IP</dt><dd className="uuid">{nvr.direccionIp ?? '—'}</dd>
          <dt>Puerto</dt><dd>{nvr.puerto != null ? String(nvr.puerto) : '—'}</dd>
          <dt>Descripción</dt><dd>{nvr.descripcion ?? '—'}</dd>
        </dl>
      </div>

      <div ref={tablaCamarasRef} className="card" style={{ marginTop: '1rem' }}>
        <h2>Cámaras en esta NVR</h2>
        {importando && progresoImport ? (
          <p className="inventory-toolbar-msg" role="status" style={{ marginTop: '0.35rem' }}>
            {progresoImport.iniciando && progresoImport.fila === 0
              ? (
                <>Procesando <strong>{progresoImport.total}</strong> fila{progresoImport.total === 1 ? '' : 's'}…</>
                )
              : (
                <>
                  Fila <strong>{progresoImport.fila}</strong> de <strong>{progresoImport.total}</strong>
                  {progresoImport.ultimoNombre ? (
                    <>
                      {' — '}
                      <span className="muted">
                        última: {progresoImport.ultimoNombre}
                        {progresoImport.tipo === 'creada' ? ' (nueva)' : ' (asignada a esta NVR)'}
                      </span>
                    </>
                  ) : null}
                </>
                )}
          </p>
        ) : null}
        {msgBorrar ? (
          <p
            className={msgBorrar.tipo === 'err' ? 'estado-msg error' : 'inventory-toolbar-msg inventory-toolbar-msg--ok'}
            style={{ marginTop: '0.35rem' }}
            role="status"
          >
            {msgBorrar.texto}
          </p>
        ) : null}
        {camaras.length === 0 && !importando ? (
          <p className="estado-msg">
            Ninguna cámara asignada.{' '}
            <Link to={`/camaras/nueva?nvrId=${encodeURIComponent(id)}`}>Dar de alta una cámara</Link>
            {' '}o importá un archivo abajo.
          </p>
        ) : null}
        {(camaras.length > 0 || importando) ? (
          <div className="table-wrap" style={{ marginTop: camaras.length > 0 ? 0 : '0.5rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Nombre</th>
                  <th>IP</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Fecha alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {camaras.map(cam => (
                  <tr
                    key={cam.id}
                    onClick={() => navigate(`/camaras/${encodeURIComponent(cam.id)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="uuid">{cam.id}</td>
                    <td>{cam.nombre}</td>
                    <td>{cam.direccionIp ?? '—'}</td>
                    <td>{cam.ubicacion ?? '—'}</td>
                    <td>{cam.estado ?? '—'}</td>
                    <td>{fmtFechaAlta(cam.fechaAlta)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={borrandoId === cam.id}
                        onClick={e => eliminarCamaraFila(e, cam)}
                        title="Eliminar cámara del inventario"
                      >
                        {borrandoId === cam.id ? '…' : 'Borrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Importar cámaras (CSV / Excel)</h2>
        <p className="muted" style={{ marginTop: '0.35rem', maxWidth: '42rem' }}>
          Las filas se procesan en esta NVR (<strong>{nvr.nombre}</strong>). Si el <strong>dispositivo</strong> ya existe y{' '}
          <strong>no</strong> está en otra NVR, se le asigna esta. Si ya está asignada a otra NVR, esa fila se omite (no se mueven
          cámaras entre sitios automáticamente). Si no existe el dispositivo, se crea la cámara (nombre y ubicación en archivo;
          si falta ubicación se usa <code>IMPORTACION</code>). Las filas OK aparecen arriba según se procesan.
        </p>
        <p className="muted" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Columnas reconocidas: <strong>dispositivo</strong> (o id, código), <strong>nombre</strong>,{' '}
          <strong>ubicacion</strong>, marca, direccionIp, puerto, tipo, descripcion.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{ display: 'none' }}
            disabled={importando}
            onChange={onArchivoImport}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={importando}
            onClick={() => fileInputRef.current?.click()}
          >
            {importando ? 'Importando…' : 'Elegir archivo…'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={descargarPlantilla} disabled={importando}>
            Descargar plantilla CSV
          </button>
        </div>
        {resultadoImport?.error ? (
          <p className="estado-msg error" style={{ marginTop: '0.75rem' }}>{resultadoImport.error}</p>
        ) : null}
        {resultadoImport && !resultadoImport.error ? (
          <div style={{ marginTop: '0.75rem' }}>
            <p className="inventory-toolbar-msg inventory-toolbar-msg--ok" role="status" style={{ margin: 0 }}>
              Creadas: <strong>{resultadoImport.creadas}</strong>
              {' · '}
              Asignadas a esta NVR: <strong>{resultadoImport.asignadas}</strong>
              {resultadoImport.omitidas > 0 ? (
                <>
                  {' · '}
                  Filas vacías omitidas: <strong>{resultadoImport.omitidas}</strong>
                </>
              ) : null}
              {resultadoImport.enOtraNvr > 0 ? (
                <>
                  {' · '}
                  Ya en otra NVR (sin mover): <strong>{resultadoImport.enOtraNvr}</strong>
                </>
              ) : null}
            </p>
            {resultadoImport.ayuda ? (
              <p className="estado-msg" style={{ marginTop: '0.5rem' }}>{resultadoImport.ayuda}</p>
            ) : null}
            {resultadoImport.errores?.length > 0 ? (
              <div style={{ marginTop: '0.5rem' }}>
                <p className="muted" style={{ margin: '0 0 0.35rem' }}>Errores por fila:</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                  {resultadoImport.errores.map((er, i) => (
                    <li key={i}>Fila {er.linea}: {er.mensaje}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={false}
        title="Cámara de Seguridad"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
          { name: 'dispositivo', label: 'Dispositivo (ID único / Serie)', type: 'text', placeholder: 'Ej. camara-patio-1', required: true },
          { name: 'nombre', label: 'Nombre comercial / descriptivo', type: 'text', placeholder: 'Ej. Domo Entrada Principal', required: true },
          { name: 'nvrId', label: 'NVR (opcional)', type: 'select', options: nvrs.map(n => ({ value: n.id, label: n.nombre ?? n.id })) },
          { name: 'ubicacion', label: 'Ubicación', type: 'select', options: UBICACIONES_CAMARA_SUGERIDAS.map(u => ({ value: u, label: labelUbicacionEnum(u) })), required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text', placeholder: 'Ej. 192.168.1.100' },
          { name: 'puerto', label: 'Puerto', type: 'number', placeholder: 'Ej. 37777' },
          { name: 'tipo', label: 'Tipo de Cámara / Modelo', type: 'text', placeholder: 'Ej. Domo, Bala, PTZ', required: true },
          { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej. Hikvision, Dahua' },
          { name: 'responsable', label: 'Responsable', type: 'text', placeholder: 'Ej. Sistemas / Seguridad' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', placeholder: 'Notas adicionales...', fullWidth: true }
        ]}
      />

      <InfraestructuraModal 
        isOpen={isEditNvrModalOpen}
        onClose={() => setIsEditNvrModalOpen(false)}
        onSubmit={handleEditNvrSubmit}
        isEdit={true}
        title="NVR"
        error={editNvrError}
        formState={editNvrForm}
        onChange={(e) => setEditNvrForm({...editNvrForm, [e.target.name]: e.target.value})}
        fields={[
          { name: 'nombre', label: 'Nombre del NVR', type: 'text', required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text' },
          { name: 'puerto', label: 'Puerto', type: 'number' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', fullWidth: true }
        ]}
      />
    </div>
  );
}

export default NvrDetail;

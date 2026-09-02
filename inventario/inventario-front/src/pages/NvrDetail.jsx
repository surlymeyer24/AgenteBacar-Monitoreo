import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { HardDrive, Plus } from 'lucide-react';
import { fetchNvr, fetchCamarasPorNvr, fetchNvrs, actualizarNvr } from '../api/nvrApi';
import { fetchCamara, createCamara, asignarNvrCamara, fetchCamaras, deleteCamara } from '../api/camaraApi';
import {
  parseCamaraImportFile,
  importCamarasRowsToNvr,
  PLANTILLA_CSV_CAMARAS,
} from '../lib/camarasImport';
import { UBICACIONES_CAMARA_SUGERIDAS, labelUbicacionEnum } from '../constants/ubicaciones';
import { CredentialsDisplay } from '../components/CredentialsField';
import InfraestructuraModal from '../components/InfraestructuraModal';
import DetailOverlayShell, {
  DetailEditButton,
  DetailSection,
} from '../components/DetailOverlayShell';
import { fmtFechaAlta } from '../components/DetailInfraHelpers';
import WriteGate from '../components/WriteGate';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';

function labelEstadoCam(raw) {
  if (raw == null || raw === '') return '—';
  const key = String(raw).trim();
  return ESTADO_OPERATIVO_LABELS[key] ?? key;
}

function badgeEstadoCamClass(raw) {
  const e = String(raw ?? '').toUpperCase().replace(/\s+/g, '_');
  if (e.includes('BAJA') || e.includes('INACTIV')) return 'bg-red-50 text-red-700 border-red-200';
  if (e.includes('MANTEN')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (e.includes('OPERATIV') || e.includes('ACTIV') || e.includes('ASIGNAD')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
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
      descripcion: nvr.descripcion || '',
      usuario: nvr.usuario || '',
      password: nvr.password || '',
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
        usuario: editNvrForm.usuario?.trim() || undefined,
        password: editNvrForm.password?.trim() || undefined,
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

  if (cargando || error || !nvr) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/nvrs')}
        title={cargando ? 'Cargando NVR…' : 'NVR'}
        titleIcon={<HardDrive className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !nvr ? 'NVR no encontrada' : null)}
      />
    );
  }

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/nvrs')}
        title={nvr.nombre}
        titleIcon={<HardDrive className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{nvr.id}</span>
            {nvr.direccionIp ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-mono text-slate-300">{nvr.direccionIp}</span>
                {nvr.puerto != null ? `:${nvr.puerto}` : ''}
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <DetailEditButton onClick={handleOpenEditNvrModal} />
            <WriteGate>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nueva cámara
              </button>
            </WriteGate>
          </>
        }
      >
        <DetailSection title="Datos generales">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID</dt>
              <dd className="font-mono text-slate-800 mt-0.5 break-all">{nvr.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">IP</dt>
              <dd className="font-mono text-slate-800 mt-0.5">{nvr.direccionIp ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puerto</dt>
              <dd className="text-slate-800 mt-0.5 font-semibold">{nvr.puerto != null ? String(nvr.puerto) : '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</dt>
              <dd className="text-slate-800 mt-0.5">{nvr.descripcion ?? '—'}</dd>
            </div>
          </dl>
        </DetailSection>

        <DetailSection title="Credenciales de acceso">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</dt>
              <dd className="text-slate-800 mt-0.5 font-semibold">{nvr.usuario ?? '—'}</dd>
            </div>
            <div>
              <CredentialsDisplay label="Contraseña" value={nvr.password} />
            </div>
          </dl>
        </DetailSection>

        <DetailSection
          title={`Cámaras en esta NVR (${camaras.length})`}
          actions={
            <WriteGate>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="text-xs font-bold text-[#0c66e4] hover:underline cursor-pointer"
              >
                + Agregar
              </button>
            </WriteGate>
          }
        >
          <div ref={tablaCamarasRef}>
            {importando && progresoImport ? (
              <p className="text-sm text-slate-600 mb-3" role="status">
                {progresoImport.iniciando && progresoImport.fila === 0 ? (
                  <>Procesando <strong>{progresoImport.total}</strong> fila{progresoImport.total === 1 ? '' : 's'}…</>
                ) : (
                  <>
                    Fila <strong>{progresoImport.fila}</strong> de <strong>{progresoImport.total}</strong>
                    {progresoImport.ultimoNombre ? (
                      <span className="text-slate-400">
                        {' — '}última: {progresoImport.ultimoNombre}
                        {progresoImport.tipo === 'creada' ? ' (nueva)' : ' (asignada a esta NVR)'}
                      </span>
                    ) : null}
                  </>
                )}
              </p>
            ) : null}
            {msgBorrar ? (
              <p
                className={`text-sm mb-3 font-medium ${msgBorrar.tipo === 'err' ? 'text-red-600' : 'text-emerald-600'}`}
                role="status"
              >
                {msgBorrar.texto}
              </p>
            ) : null}
            {camaras.length === 0 && !importando ? (
              <p className="text-sm text-slate-500">
                Ninguna cámara asignada.{' '}
                <Link to={`/camaras/nueva?nvrId=${encodeURIComponent(id)}`} className="text-[#0c66e4] font-semibold hover:underline">
                  Dar de alta una cámara
                </Link>
                {' '}o importá un archivo abajo.
              </p>
            ) : null}
            {(camaras.length > 0 || importando) ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[42rem]">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200">
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Dispositivo</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Nombre</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">IP</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Ubicación</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Estado</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">Fecha alta</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {camaras.map(cam => (
                        <tr
                          key={cam.id}
                          onClick={() => navigate(`/camaras/${encodeURIComponent(cam.id)}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 align-middle">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                              {cam.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-middle text-sm font-bold text-slate-900">
                            {cam.nombre ?? '—'}
                          </td>
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            {cam.direccionIp ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                                {cam.direccionIp}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-sm font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-sm text-slate-700 font-medium">
                            {cam.ubicacion ? labelUbicacionEnum(cam.ubicacion) : '—'}
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${badgeEstadoCamClass(cam.estado)}`}
                            >
                              {labelEstadoCam(cam.estado)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            {fmtFechaAlta(cam.fechaAlta) !== '—' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                                {fmtFechaAlta(cam.fechaAlta)}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-sm font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-right" onClick={e => e.stopPropagation()}>
                            <WriteGate>
                              <button
                                type="button"
                                className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-700 hover:bg-red-50 rounded-full border border-red-200 cursor-pointer disabled:opacity-50 transition-colors"
                                disabled={borrandoId === cam.id}
                                onClick={e => eliminarCamaraFila(e, cam)}
                                title="Eliminar cámara del inventario"
                              >
                                {borrandoId === cam.id ? '…' : 'Borrar'}
                              </button>
                            </WriteGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </DetailSection>

        <DetailSection title="Importar cámaras (CSV / Excel)">
          <p className="text-sm text-slate-500 mb-2 max-w-3xl">
            Las filas se procesan en esta NVR (<strong className="text-slate-700">{nvr.nombre}</strong>). Si el{' '}
            <strong>dispositivo</strong> ya existe y no está en otra NVR, se le asigna esta. Si ya está en otra NVR, esa fila se omite.
            Si no existe, se crea la cámara.
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Columnas: <strong>dispositivo</strong>, <strong>nombre</strong>, <strong>ubicacion</strong>, marca, direccionIp, puerto, tipo, descripcion.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={importando}
              onChange={onArchivoImport}
            />
            <WriteGate>
              <button
                type="button"
                disabled={importando}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg font-bold text-sm cursor-pointer transition-colors"
              >
                {importando ? 'Importando…' : 'Elegir archivo…'}
              </button>
            </WriteGate>
            <button
              type="button"
              onClick={descargarPlantilla}
              disabled={importando}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              Descargar plantilla CSV
            </button>
          </div>
          {resultadoImport?.error ? (
            <p className="text-sm text-red-600 font-medium mt-3">{resultadoImport.error}</p>
          ) : null}
          {resultadoImport && !resultadoImport.error ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-emerald-700 font-medium" role="status">
                Creadas: <strong>{resultadoImport.creadas}</strong>
                {' · '}
                Asignadas: <strong>{resultadoImport.asignadas}</strong>
                {resultadoImport.omitidas > 0 ? <> · Omitidas: <strong>{resultadoImport.omitidas}</strong></> : null}
                {resultadoImport.enOtraNvr > 0 ? <> · Ya en otra NVR: <strong>{resultadoImport.enOtraNvr}</strong></> : null}
              </p>
              {resultadoImport.ayuda ? (
                <p className="text-sm text-slate-500">{resultadoImport.ayuda}</p>
              ) : null}
              {resultadoImport.errores?.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Errores por fila:</p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-0.5">
                    {resultadoImport.errores.map((er, i) => (
                      <li key={i}>Fila {er.linea}: {er.mensaje}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </DetailSection>
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={false}
        title="Cámara de Seguridad"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({ ...modalForm, [e.target.name]: e.target.value })}
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
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', placeholder: 'Notas adicionales...', fullWidth: true },
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
        onChange={(e) => setEditNvrForm({ ...editNvrForm, [e.target.name]: e.target.value })}
        fields={[
          { name: 'nombre', label: 'Nombre del NVR', type: 'text', required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text' },
          { name: 'puerto', label: 'Puerto', type: 'number' },
          { name: 'usuario', label: 'Usuario', type: 'text', placeholder: 'Admin NVR' },
          { name: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', fullWidth: true },
        ]}
      />
    </>
  );
}

export default NvrDetail;

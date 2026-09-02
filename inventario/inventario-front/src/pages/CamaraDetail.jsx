import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import { fetchCamara, updateEstadoCamara, asignarNvrCamara, deleteCamara, actualizarCamara } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { UBICACIONES_CAMARA_SUGERIDAS, labelUbicacionEnum } from '../constants/ubicaciones';
import { CredentialsDisplay } from '../components/CredentialsField';
import InfraestructuraModal from '../components/InfraestructuraModal';
import DetailOverlayShell, {
  DetailEditButton,
  DetailDangerButton,
  DetailSection,
} from '../components/DetailOverlayShell';
import {
  DetailFieldGrid,
  HistorialEstadosSection,
  CambiarEstadoForm,
  fmtFechaAlta,
} from '../components/DetailInfraHelpers';
import WriteGate from '../components/WriteGate';

function CamaraDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cam, setCam] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [nvrs, setNvrs] = useState([]);
  const [nvrSel, setNvrSel] = useState('');
  const [guardandoNvr, setGuardandoNvr] = useState(false);
  const [msgNvr, setMsgNvr] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  const handleOpenEditModal = () => {
    if (!cam) return;
    setModalForm({
      dispositivo: cam.id || '',
      nombre: cam.nombre || '',
      marca: cam.marca || '',
      descripcion: cam.descripcion || '',
      responsable: cam.responsable || '',
      ubicacion: cam.ubicacion || '',
      direccionIp: cam.direccionIp || '',
      puerto: cam.puerto != null ? String(cam.puerto) : '',
      tipo: cam.tipo || '',
      nvrId: cam.nvrId || '',
      estado: cam.estado || '',
      usuario: cam.usuario || '',
      password: cam.password || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        dispositivo: modalForm.dispositivo.trim(),
        nombre: modalForm.nombre.trim(),
        marca: modalForm.marca?.trim() || undefined,
        descripcion: modalForm.descripcion?.trim() || undefined,
        responsable: modalForm.responsable?.trim() || undefined,
        ubicacion: modalForm.ubicacion,
        direccionIp: modalForm.direccionIp?.trim() || undefined,
        tipo: modalForm.tipo?.trim() || undefined,
        nvrId: modalForm.nvrId?.trim() || undefined,
        usuario: modalForm.usuario?.trim() || undefined,
        password: modalForm.password?.trim() || undefined,
      };
      const puertoNum = modalForm.puerto && String(modalForm.puerto).trim() !== ''
        ? Number.parseInt(String(modalForm.puerto).trim(), 10)
        : undefined;
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        payload.puerto = puertoNum;
      }

      await actualizarCamara(id, payload);

      if (modalForm.estado && modalForm.estado !== cam.estado) {
        await updateEstadoCamara(id, modalForm.estado, 'Edición manual desde detalle');
      }

      const updatedCam = await fetchCamara(id);
      setCam(updatedCam);
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Error al actualizar');
    }
  };

  useEffect(() => {
    fetchNvrs().then(setNvrs).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchCamara(id)
      .then(data => {
        setCam(data);
        if (!data) setError('Cámara no encontrada');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (cam?.nvrId) setNvrSel(cam.nvrId);
    else setNvrSel('');
  }, [cam]);

  function guardarNvr(e) {
    e.preventDefault();
    setGuardandoNvr(true);
    setMsgNvr(null);
    const valor = nvrSel.trim();
    asignarNvrCamara(id, valor || null)
      .then(data => {
        if (data) setCam(data);
        else setMsgNvr('No se encontró la cámara');
      })
      .catch(() => setMsgNvr('No se pudo actualizar la NVR'))
      .finally(() => setGuardandoNvr(false));
  }

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstadoCamara(id, estadoSel, motivoEstado.trim() || '')
      .then(data => {
        if (data) {
          setCam(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró la cámara');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  function solicitarEliminar() {
    const nombre = (cam.nombre && String(cam.nombre).trim()) ? cam.nombre : 'esta cámara';
    if (!window.confirm(`¿Seguro que querés borrar ${nombre} (${id})? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminando(true);
    setMsgEliminar(null);
    deleteCamara(id)
      .then(ok => {
        if (ok) navigate('/camaras');
        else setMsgEliminar('No se encontró la cámara (quizá ya fue borrada).');
      })
      .catch(() => setMsgEliminar('No se pudo eliminar la cámara'))
      .finally(() => setEliminando(false));
  }

  if (cargando || error || !cam) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/camaras')}
        title={cargando ? 'Cargando cámara…' : 'Cámara'}
        titleIcon={<Camera className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !cam ? 'Cámara no encontrada' : null)}
        maxWidthClass="max-w-5xl"
      />
    );
  }

  const nvrInfo = cam.nvrId ? nvrs.find(n => n.id === cam.nvrId) : null;
  const historial = cam.historialEstados ?? [];

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/camaras')}
        title={cam.nombre}
        titleIcon={<Camera className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{cam.id}</span>
            {cam.direccionIp ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-mono text-slate-300">{cam.direccionIp}</span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <DetailEditButton onClick={handleOpenEditModal} />
            <DetailDangerButton onClick={solicitarEliminar} disabled={eliminando}>
              <Trash2 className="w-4 h-4" />
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </DetailDangerButton>
          </>
        }
        maxWidthClass="max-w-5xl"
      >
        {msgEliminar ? (
          <p className="text-sm text-red-600 font-medium">{msgEliminar}</p>
        ) : null}

        <DetailSection title="Datos generales">
          <DetailFieldGrid
            fields={[
              { label: 'Dispositivo (ID)', value: cam.id, mono: true },
              { label: 'IP', value: cam.direccionIp, mono: true },
              { label: 'Puerto', value: cam.puerto != null ? String(cam.puerto) : null },
              { label: 'Tipo', value: cam.tipo },
              { label: 'Marca', value: cam.marca },
              { label: 'Responsable', value: cam.responsable },
              { label: 'Ubicación', value: cam.ubicacion },
              {
                label: 'NVR',
                value: cam.nvrId
                  ? (nvrInfo?.nombre ? `${nvrInfo.nombre} (${cam.nvrId})` : cam.nvrId)
                  : null,
              },
              { label: 'Estado (IT)', value: cam.estado },
              { label: 'Fecha alta', value: fmtFechaAlta(cam.fechaAlta) },
              { label: 'Descripción', value: cam.descripcion, fullWidth: true },
            ]}
          />
        </DetailSection>

        <DetailSection title="Credenciales ONVIF / admin">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</dt>
              <dd className="text-slate-800 mt-0.5 font-semibold">{cam.usuario ?? '—'}</dd>
            </div>
            <div>
              <CredentialsDisplay label="Contraseña" value={cam.password} />
            </div>
          </dl>
        </DetailSection>

        <DetailSection title="Asignar NVR">
          <WriteGate fallback={<p className="text-sm text-slate-500">Sin permiso de escritura.</p>}>
            <form onSubmit={guardarNvr} className="flex flex-wrap items-end gap-3 max-w-xl">
              <div className="flex-1 min-w-[12rem]">
                <label htmlFor="nvr-cam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  NVR
                </label>
                <select
                  id="nvr-cam"
                  value={nvrSel}
                  onChange={e => setNvrSel(e.target.value)}
                  className="inventory-input"
                >
                  <option value="">Sin NVR</option>
                  {nvrs.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={guardandoNvr}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg font-bold text-sm cursor-pointer"
              >
                {guardandoNvr ? 'Guardando…' : 'Guardar NVR'}
              </button>
              {msgNvr ? <p className="text-sm text-red-600 w-full">{msgNvr}</p> : null}
            </form>
          </WriteGate>
        </DetailSection>

        <CambiarEstadoForm
          idPrefix="cam"
          estados={ESTADOS_OPERATIVOS}
          labels={ESTADO_OPERATIVO_LABELS}
          estadoSel={estadoSel}
          setEstadoSel={setEstadoSel}
          motivo={motivoEstado}
          setMotivo={setMotivoEstado}
          onSubmit={guardarEstado}
          guardando={guardandoEstado}
          msg={msgEstado}
          motivoObligatorio={false}
        />

        <HistorialEstadosSection historial={historial} />
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={true}
        title="Cámara de Seguridad"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({ ...modalForm, [e.target.name]: e.target.value })}
        fields={[
          { name: 'nombre', label: 'Nombre comercial / descriptivo', type: 'text', required: true },
          { name: 'nvrId', label: 'NVR (opcional)', type: 'select', options: nvrs.map(n => ({ value: n.id, label: n.nombre ?? n.id })) },
          { name: 'ubicacion', label: 'Ubicación', type: 'select', options: UBICACIONES_CAMARA_SUGERIDAS.map(u => ({ value: u, label: labelUbicacionEnum(u) })), required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text' },
          { name: 'puerto', label: 'Puerto', type: 'number' },
          { name: 'tipo', label: 'Tipo de Cámara / Modelo', type: 'text', required: true },
          { name: 'marca', label: 'Marca', type: 'text' },
          { name: 'responsable', label: 'Responsable', type: 'text' },
          { name: 'usuario', label: 'Usuario ONVIF', type: 'text' },
          { name: 'password', label: 'Contraseña', type: 'password' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', fullWidth: true },
          { name: 'estado', label: 'Estado', type: 'select', options: ESTADOS_OPERATIVOS.map(e => ({ value: e, label: ESTADO_OPERATIVO_LABELS[e] })) },
        ]}
      />
    </>
  );
}

export default CamaraDetail;

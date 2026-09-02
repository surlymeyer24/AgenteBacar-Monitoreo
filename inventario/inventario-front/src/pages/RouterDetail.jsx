import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Router as RouterIcon } from 'lucide-react';
import { fetchRouter, cambiarEstadoRouter, actualizarRouter } from '../api/routerApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import InfraestructuraModal from '../components/InfraestructuraModal';
import FriendlyDatePicker from '../components/FriendlyDatePicker';
import FriendlySelect from '../components/FriendlySelect';
import DetailOverlayShell, { DetailEditButton, DetailSection } from '../components/DetailOverlayShell';
import {
  DetailFieldGrid,
  HistorialEstadosSection,
  CambiarEstadoForm,
  fmtFechaAlta,
  toFechaAltaIso,
} from '../components/DetailInfraHelpers';

function RouterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchRouter(id)
      .then(data => {
        setR(data);
        if (!data) setError('Router no encontrado');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoRouter(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setR(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró el router');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  const routerFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
    { name: 'firmware', label: 'Firmware', type: 'text' },
    { name: 'cantidadPuertosWan', label: 'Puertos WAN', type: 'number' },
    { name: 'cantidadPuertosLan', label: 'Puertos LAN', type: 'number' },
    { name: 'gateway', label: 'Gateway', type: 'text' },
  ];

  const handleOpenEdit = () => {
    setModalForm({ ...r, fechaAlta: toFechaAltaIso(r.fechaAlta) });
    setModalError('');
    setModalAbierto(true);
  };

  const onChangeCampo = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({ ...prev, [name]: value }));
  };

  const enviarEdicion = (e) => {
    e.preventDefault();
    if (!modalForm.nombre?.trim() || !modalForm.ubicacion) {
      setModalError('Nombre y ubicación son obligatorios');
      return;
    }
    setModalError('');
    const body = {
      nombre: modalForm.nombre.trim(),
      marca: modalForm.marca?.trim() || undefined,
      modelo: modalForm.modelo?.trim() || undefined,
      ip: modalForm.ip?.trim() || undefined,
      numeroSerie: modalForm.numeroSerie?.trim() || undefined,
      firmware: modalForm.firmware?.trim() || undefined,
      cantidadPuertosWan: Number(modalForm.cantidadPuertosWan) || 0,
      cantidadPuertosLan: Number(modalForm.cantidadPuertosLan) || 0,
      gateway: modalForm.gateway?.trim() || undefined,
      ubicacion: modalForm.ubicacion,
    };
    if (toFechaAltaIso(modalForm.fechaAlta)) body.fechaAlta = toFechaAltaIso(modalForm.fechaAlta);

    actualizarRouter(id, body).then(data => {
      setR(data);
      setModalAbierto(false);
    }).catch(() => setModalError('No se pudo actualizar el router'));
  };

  if (cargando || error || !r) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/routers')}
        title={cargando ? 'Cargando router…' : 'Router'}
        titleIcon={<RouterIcon className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !r ? 'Router no encontrado' : null)}
        maxWidthClass="max-w-5xl"
      />
    );
  }

  const historial = r.historialEstados ?? [];

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/routers')}
        title={r.nombre}
        titleIcon={<RouterIcon className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{r.id}</span>
            {r.ip ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-mono text-slate-300">{r.ip}</span>
              </>
            ) : null}
          </>
        }
        actions={<DetailEditButton onClick={handleOpenEdit} />}
        maxWidthClass="max-w-5xl"
      >
        <DetailSection title="Datos generales">
          <DetailFieldGrid
            fields={[
              { label: 'ID', value: r.id, mono: true },
              { label: 'Marca', value: r.marca },
              { label: 'Modelo', value: r.modelo },
              { label: 'IP', value: r.ip, mono: true },
              { label: 'Nº serie', value: r.numeroSerie },
              { label: 'Firmware', value: r.firmware },
              { label: 'Puertos WAN', value: r.cantidadPuertosWan },
              { label: 'Puertos LAN', value: r.cantidadPuertosLan },
              { label: 'Gateway', value: r.gateway, mono: true },
              { label: 'Ubicación', value: r.ubicacion ? labelUbicacionEnum(r.ubicacion) : null },
              { label: 'Estado (IT)', value: r.estado },
              { label: 'Fecha alta', value: fmtFechaAlta(r.fechaAlta) },
            ]}
          />
        </DetailSection>

        <CambiarEstadoForm
          idPrefix="router"
          estados={ESTADOS_OPERATIVOS}
          labels={ESTADO_OPERATIVO_LABELS}
          estadoSel={estadoSel}
          setEstadoSel={setEstadoSel}
          motivo={motivoEstado}
          setMotivo={setMotivoEstado}
          onSubmit={guardarEstado}
          guardando={guardandoEstado}
          msg={msgEstado}
        />

        <HistorialEstadosSection historial={historial} />
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={enviarEdicion}
        isEdit={true}
        title="Router"
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={routerFields}
        customFields={
          <>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">
                Ubicación <span className="text-[var(--color-danger)]">*</span>
              </label>
              <FriendlySelect
                name="ubicacion"
                value={modalForm.ubicacion || ''}
                required
                placeholder="Seleccionar…"
                options={[
                  { value: '', label: 'Seleccionar…' },
                  ...UBICACIONES_RED.map((u) => ({ value: u, label: labelUbicacionEnum(u) })),
                ]}
                onChange={(next) => onChangeCampo({ target: { name: 'ubicacion', value: next } })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-xs tracking-wider">Fecha alta</label>
              <FriendlyDatePicker
                name="fechaAlta"
                value={modalForm.fechaAlta || ''}
                onChange={(next) => onChangeCampo({ target: { name: 'fechaAlta', value: next } })}
              />
            </div>
          </>
        }
      />
    </>
  );
}

export default RouterDetail;

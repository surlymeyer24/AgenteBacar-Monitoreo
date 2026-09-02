import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';
import { fetchSwitch, cambiarEstadoSwitch, actualizarSwitch } from '../api/switchApi';
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

function parseVlans(texto) {
  if (!texto || !String(texto).trim()) return undefined;
  const partes = String(texto).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  return partes.length ? partes : undefined;
}

function SwitchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sw, setSw] = useState(null);
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
    fetchSwitch(id)
      .then(data => {
        setSw(data);
        if (!data) setError('Switch no encontrado');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoSwitch(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setSw(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró el switch');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  const switchFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
    { name: 'cantidadPuertos', label: 'Cantidad de puertos', type: 'number' },
    { name: 'tipo', label: 'Tipo (Ej. capa 2)', type: 'text' },
    { name: 'vlansTexto', label: 'VLANs (separadas por coma)', type: 'textarea' },
  ];

  const handleOpenEdit = () => {
    const vlansTxt = Array.isArray(sw.vlans) && sw.vlans.length ? sw.vlans.join(', ') : '';
    setModalForm({ ...sw, vlansTexto: vlansTxt, fechaAlta: toFechaAltaIso(sw.fechaAlta) });
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
    const vlans = parseVlans(modalForm.vlansTexto);
    const body = {
      nombre: modalForm.nombre.trim(),
      marca: modalForm.marca?.trim() || undefined,
      modelo: modalForm.modelo?.trim() || undefined,
      ip: modalForm.ip?.trim() || undefined,
      numeroSerie: modalForm.numeroSerie?.trim() || undefined,
      cantidadPuertos: Number(modalForm.cantidadPuertos) || 0,
      tipo: modalForm.tipo?.trim() || undefined,
      ubicacion: modalForm.ubicacion,
    };
    if (vlans) body.vlans = vlans;
    if (toFechaAltaIso(modalForm.fechaAlta)) body.fechaAlta = toFechaAltaIso(modalForm.fechaAlta);

    actualizarSwitch(id, body).then(data => {
      setSw(data);
      setModalAbierto(false);
    }).catch(() => setModalError('No se pudo actualizar el switch'));
  };

  if (cargando || error || !sw) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/switches')}
        title={cargando ? 'Cargando switch…' : 'Switch'}
        titleIcon={<Network className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !sw ? 'Switch no encontrado' : null)}
        maxWidthClass="max-w-5xl"
      />
    );
  }

  const historial = sw.historialEstados ?? [];
  const vlansTxt = Array.isArray(sw.vlans) && sw.vlans.length ? sw.vlans.join(', ') : null;

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/switches')}
        title={sw.nombre}
        titleIcon={<Network className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{sw.id}</span>
            {sw.ip ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-mono text-slate-300">{sw.ip}</span>
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
              { label: 'ID', value: sw.id, mono: true },
              { label: 'Marca', value: sw.marca },
              { label: 'Modelo', value: sw.modelo },
              { label: 'IP', value: sw.ip, mono: true },
              { label: 'Nº serie', value: sw.numeroSerie },
              { label: 'Cantidad de puertos', value: sw.cantidadPuertos },
              { label: 'Tipo', value: sw.tipo },
              { label: 'VLANs', value: vlansTxt, fullWidth: true },
              { label: 'Ubicación', value: sw.ubicacion ? labelUbicacionEnum(sw.ubicacion) : null },
              { label: 'Estado (IT)', value: sw.estado },
              { label: 'Fecha alta', value: fmtFechaAlta(sw.fechaAlta) },
            ]}
          />
        </DetailSection>

        <CambiarEstadoForm
          idPrefix="switch"
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
        title="Switch"
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={switchFields}
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

export default SwitchDetail;

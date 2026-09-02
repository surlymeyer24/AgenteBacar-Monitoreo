import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { fetchAccessPoint, actualizarAccessPoint } from '../api/accessPointApi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import InfraestructuraModal from '../components/InfraestructuraModal';
import DetailOverlayShell, { DetailEditButton, DetailSection } from '../components/DetailOverlayShell';
import { DetailFieldGrid } from '../components/DetailInfraHelpers';

function AccessPointDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ap, setAp] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchAccessPoint(id)
      .then(data => {
        setAp(data);
        if (!data) setError('Access Point no encontrado');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  const handleOpenEdit = () => {
    setModalForm({
      nombre: ap.nombre || '',
      marca: ap.marca || '',
      modelo: ap.modelo || '',
      ip: ap.ip || '',
      mac: ap.mac || '',
      switchUplink: ap.switchUplink || '',
      ubicacion: ap.ubicacion || '',
      estado: ap.estado || 'OPERATIVO',
    });
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
      mac: modalForm.mac?.trim() || undefined,
      switchUplink: modalForm.switchUplink?.trim() || undefined,
      ubicacion: modalForm.ubicacion,
      estado: modalForm.estado || undefined,
    };
    actualizarAccessPoint(id, body)
      .then(data => {
        setAp(data);
        setModalAbierto(false);
      })
      .catch(err => setModalError(err?.message || 'No se pudo actualizar el Access Point'));
  };

  if (cargando || error || !ap) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/access-points')}
        title={cargando ? 'Cargando Access Point…' : 'Access Point'}
        titleIcon={<Wifi className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !ap ? 'Access Point no encontrado' : null)}
        maxWidthClass="max-w-4xl"
      />
    );
  }

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/access-points')}
        title={ap.nombre}
        titleIcon={<Wifi className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{ap.id}</span>
            {ap.ip ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-mono text-slate-300">{ap.ip}</span>
              </>
            ) : null}
          </>
        }
        actions={<DetailEditButton onClick={handleOpenEdit} />}
        maxWidthClass="max-w-4xl"
      >
        <DetailSection title="Datos generales">
          <DetailFieldGrid
            fields={[
              { label: 'ID', value: ap.id, mono: true },
              { label: 'Marca', value: ap.marca },
              { label: 'Modelo', value: ap.modelo },
              { label: 'IP', value: ap.ip, mono: true },
              { label: 'MAC', value: ap.mac, mono: true },
              { label: 'Switch uplink', value: ap.switchUplink },
              { label: 'Ubicación', value: ap.ubicacion ? labelUbicacionEnum(ap.ubicacion) : null },
              { label: 'Estado', value: ap.estado },
            ]}
          />
        </DetailSection>
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={enviarEdicion}
        isEdit={true}
        title="Access Point"
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={[
          { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          { name: 'marca', label: 'Marca', type: 'text' },
          { name: 'modelo', label: 'Modelo', type: 'text' },
          { name: 'ip', label: 'IP Local', type: 'text' },
          { name: 'mac', label: 'MAC', type: 'text' },
          { name: 'switchUplink', label: 'Switch uplink', type: 'text' },
          {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            options: [
              { value: 'OPERATIVO', label: 'Operativo' },
              { value: 'BAJA', label: 'Baja' },
            ],
          },
          {
            name: 'ubicacion',
            label: 'Ubicación',
            type: 'select',
            required: true,
            options: UBICACIONES_RED.map(u => ({ value: u, label: labelUbicacionEnum(u) })),
          },
        ]}
      />
    </>
  );
}

export default AccessPointDetail;

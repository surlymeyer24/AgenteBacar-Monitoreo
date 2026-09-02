import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Banknote } from 'lucide-react';
import { fetchMaquina, cambiarEstadoMaquina, actualizarMaquina } from '../api/maquinaTesoreriaApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import InfraestructuraModal from '../components/InfraestructuraModal';
import DetailOverlayShell, { DetailEditButton, DetailSection } from '../components/DetailOverlayShell';
import {
  DetailFieldGrid,
  HistorialEstadosSection,
  CambiarEstadoForm,
} from '../components/DetailInfraHelpers';

const TIPO_LABELS = {
  VALIDADORA: 'Validadora',
  BOLSILLOS: 'Bolsillos',
  RECONTADORA: 'Recontadora',
  ENVASADORA: 'Envasadora',
  FAJADORA: 'Fajadora',
};

function MaquinaTesoreriaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  const handleOpenEditModal = () => {
    if (!maquina) return;
    setModalForm({
      tipo: maquina.tipo || '',
      modelo: maquina.modelo || '',
      nroSerie: maquina.nroSerie || '',
      vida: maquina.vida || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        tipo: modalForm.tipo,
        modelo: modalForm.modelo.trim(),
        nroSerie: modalForm.nroSerie.trim(),
        vida: modalForm.vida?.trim() || undefined,
      };
      await actualizarMaquina(id, payload);
      const updatedData = await fetchMaquina(id);
      setMaquina(updatedData);
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Error al actualizar');
    }
  };

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchMaquina(id)
      .then(data => {
        setMaquina(data);
        if (!data) setError('Máquina no encontrada');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoMaquina(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setMaquina(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró la máquina');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  if (cargando || error || !maquina) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/maquinas-tesoreria')}
        title={cargando ? 'Cargando máquina…' : 'Máquina'}
        titleIcon={<Banknote className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !maquina ? 'Máquina no encontrada' : null)}
        maxWidthClass="max-w-4xl"
      />
    );
  }

  const historial = maquina.historialEstados ?? [];
  const titulo = `${TIPO_LABELS[maquina.tipo] ?? maquina.tipo} — ${maquina.modelo}`;

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/maquinas-tesoreria')}
        title={titulo}
        titleIcon={<Banknote className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{maquina.id}</span>
            {maquina.nroSerie ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                Serie: <span className="font-mono text-slate-300">{maquina.nroSerie}</span>
              </>
            ) : null}
          </>
        }
        actions={<DetailEditButton onClick={handleOpenEditModal} />}
        maxWidthClass="max-w-4xl"
      >
        <DetailSection title="Datos generales">
          <DetailFieldGrid
            fields={[
              { label: 'ID', value: maquina.id, mono: true },
              { label: 'Tipo', value: TIPO_LABELS[maquina.tipo] ?? maquina.tipo },
              { label: 'Modelo', value: maquina.modelo },
              { label: 'Nº serie', value: maquina.nroSerie, mono: true },
              { label: 'Vida / Obs.', value: maquina.vida },
              { label: 'Estado (IT)', value: maquina.estado },
            ]}
          />
        </DetailSection>

        <CambiarEstadoForm
          idPrefix="maq"
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={true}
        title="Máquina Tesorería"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({ ...modalForm, [e.target.name]: e.target.value })}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', options: Object.keys(TIPO_LABELS).map(t => ({ value: t, label: TIPO_LABELS[t] })), required: true },
          { name: 'modelo', label: 'Modelo', type: 'text', required: true },
          { name: 'nroSerie', label: 'Nro Serie', type: 'text', required: true },
          { name: 'vida', label: 'Vida Útil / Observación', type: 'text' },
        ]}
      />
    </>
  );
}

export default MaquinaTesoreriaDetail;

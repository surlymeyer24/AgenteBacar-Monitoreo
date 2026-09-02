import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, Trash2 } from 'lucide-react';
import { fetchServidor, actualizarServidor, eliminarServidor } from '../api/servidorApi';
import InfraestructuraModal from '../components/InfraestructuraModal';
import DetailOverlayShell, {
  DetailEditButton,
  DetailDangerButton,
  DetailSection,
} from '../components/DetailOverlayShell';
import { DetailFieldGrid } from '../components/DetailInfraHelpers';

const ESTADOS = ['activo', 'inactivo', 'mantenimiento'];

function ServidorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servidor, setServidor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setCargando(true);
    fetchServidor(id)
      .then(data => {
        if (!data) setError('Servidor no encontrado');
        else setServidor(data);
      })
      .catch(() => setError('No se pudo cargar el servidor'))
      .finally(() => setCargando(false));
  }, [id]);

  function abrirEdicion() {
    setModalForm({
      nombre: servidor.nombre ?? '',
      hostname: servidor.hostname ?? '',
      ip: servidor.ip ?? '',
      sistemaOperativo: servidor.sistemaOperativo ?? '',
      ubicacion: servidor.ubicacion ?? '',
      descripcion: servidor.descripcion ?? '',
      estado: servidor.estado ?? 'activo',
    });
    setModalError(null);
    setModalAbierto(true);
  }

  function guardar(e) {
    e.preventDefault();
    if (!modalForm.nombre?.trim()) {
      setModalError('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    setModalError(null);
    actualizarServidor(id, {
      nombre: modalForm.nombre.trim(),
      hostname: modalForm.hostname?.trim() || null,
      ip: modalForm.ip?.trim() || null,
      sistemaOperativo: modalForm.sistemaOperativo?.trim() || null,
      ubicacion: modalForm.ubicacion?.trim() || null,
      descripcion: modalForm.descripcion?.trim() || null,
      estado: modalForm.estado || null,
    })
      .then(data => {
        setServidor(data);
        setModalAbierto(false);
      })
      .catch(() => setModalError('No se pudo guardar los cambios'))
      .finally(() => setGuardando(false));
  }

  function handleEliminar() {
    if (!window.confirm(`¿Eliminar el servidor "${servidor.nombre}"? Esta acción no se puede deshacer.`)) return;
    eliminarServidor(id)
      .then(ok => {
        if (ok) navigate('/servidores');
      })
      .catch(() => alert('No se pudo eliminar el servidor'));
  }

  if (cargando || error || !servidor) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/servidores')}
        title={cargando ? 'Cargando servidor…' : 'Servidor'}
        titleIcon={<Server className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !servidor ? 'Servidor no encontrado' : null)}
        maxWidthClass="max-w-4xl"
      />
    );
  }

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/servidores')}
        title={servidor.nombre}
        titleIcon={<Server className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            {servidor.hostname ? (
              <span className="font-mono text-slate-300">{servidor.hostname}</span>
            ) : null}
            {servidor.hostname && servidor.ip ? <span className="text-slate-600 mx-1.5">•</span> : null}
            {servidor.ip ? <span className="font-mono text-slate-300">{servidor.ip}</span> : null}
            {!servidor.hostname && !servidor.ip ? 'Servidor' : null}
          </>
        }
        actions={
          <>
            <DetailEditButton onClick={abrirEdicion} />
            <DetailDangerButton onClick={handleEliminar}>
              <Trash2 className="w-4 h-4" />
              Eliminar
            </DetailDangerButton>
          </>
        }
        maxWidthClass="max-w-4xl"
      >
        <DetailSection title="Datos generales">
          <DetailFieldGrid
            fields={[
              { label: 'Nombre', value: servidor.nombre },
              { label: 'Hostname', value: servidor.hostname, mono: true },
              { label: 'IP', value: servidor.ip, mono: true },
              { label: 'Sistema operativo', value: servidor.sistemaOperativo },
              { label: 'Ubicación', value: servidor.ubicacion },
              {
                label: 'Estado',
                value: servidor.estado ? (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    servidor.estado === 'activo' ? 'bg-green-100 text-green-700'
                      : servidor.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {servidor.estado}
                  </span>
                ) : null,
              },
              { label: 'Descripción', value: servidor.descripcion, fullWidth: true },
            ]}
          />
        </DetailSection>
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={guardar}
        isEdit={true}
        title="Servidor"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({ ...modalForm, [e.target.name]: e.target.value })}
        fields={[
          { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          { name: 'hostname', label: 'Hostname', type: 'text' },
          { name: 'ip', label: 'IP', type: 'text' },
          { name: 'sistemaOperativo', label: 'Sistema operativo', type: 'text' },
          { name: 'ubicacion', label: 'Ubicación', type: 'text' },
          {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            options: ESTADOS.map(e => ({ value: e, label: e })),
          },
          { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true },
        ]}
      />
    </>
  );
}

export default ServidorDetalle;

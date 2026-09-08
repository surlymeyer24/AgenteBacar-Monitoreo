import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, Trash2, UserCheck } from 'lucide-react';
import {
  fetchPerifericoM,
  actualizarPerifericoM,
  updateEstadoPerifericoM,
  asignarPerifericoM,
  deletePerifericoM,
} from '../api/perifericoManualApi';
import { fetchComputadoras } from '../api/computadoraApi';
import { labelTipoStock, normalizarTipoStock } from '../constants/tiposStock';
import { useCatalogo, opcionesCatalogo, opcionesEnumCatalogo } from '../hooks/useCatalogo';
import InfraestructuraModal from '../components/InfraestructuraModal';
import FriendlySelect from '../components/FriendlySelect';
import DetailOverlayShell, {
  DetailEditButton,
  DetailDangerButton,
  DetailSection,
} from '../components/DetailOverlayShell';
import {
  DetailFieldGrid,
  HistorialEstadosSection,
  CambiarEstadoForm,
} from '../components/DetailInfraHelpers';
import WriteGate from '../components/WriteGate';
import { descripcionFromItem, etiquetaFromItem, resolveSpecFromItem } from '../utils/stockPcHelpers';
import { filtrarPcsAsignables, opcionesPcAsignable } from '../utils/perifericoPcHelpers';

function formDesdeP(p) {
  return {
    tipo: normalizarTipoStock(p.tipo),
    cantidad: String(p.cantidad ?? 1),
    nombre: p.nombre ?? '',
    fabricante: p.fabricante ?? '',
    conexion: p.conexion ?? '',
    numeroSerie: p.numeroSerie ?? '',
    ubicacion: p.ubicacion ?? '',
    notas: p.notas ?? '',
    fechaAlta: p.fechaAlta ? String(p.fechaAlta) : '',
  };
}

function PerifericoManualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: tiposStockCatalogo } = useCatalogo('tipos_stock');
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: conexionItems } = useCatalogo('conexiones_periferico');
  const asignarRef = useRef(null);
  const [p, setP] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [borrando, setBorrando] = useState(false);

  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);

  const [pcUuidAsignar, setPcUuidAsignar] = useState('');
  const [motivoAsignar, setMotivoAsignar] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [msgAsignar, setMsgAsignar] = useState(null);
  const [pcsAsignables, setPcsAsignables] = useState([]);
  const [cargandoPcs, setCargandoPcs] = useState(true);

  useEffect(() => {
    let cancel = false;
    setCargandoPcs(true);
    fetchComputadoras()
      .then(data => { if (!cancel) setPcsAsignables(filtrarPcsAsignables(data)); })
      .catch(() => { if (!cancel) setPcsAsignables([]); })
      .finally(() => { if (!cancel) setCargandoPcs(false); });
    return () => { cancel = true; };
  }, []);

  const opcionesPc = useMemo(() => opcionesPcAsignable(pcsAsignables), [pcsAsignables]);

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchPerifericoM(id)
      .then(data => {
        if (cancel) return;
        if (!data) setError('Periférico no encontrado.');
        else setP(data);
      })
      .catch(() => { if (!cancel) setError('No se pudo cargar el periférico.'); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, [id]);

  function abrirEdicion() {
    setModalForm(formDesdeP(p));
    setModalError('');
    setModalAbierto(true);
  }

  function onChangeForm(e) {
    const { name, value } = e.target;
    setModalForm(f => ({ ...f, [name]: value }));
  }

  function guardarEdicion(e) {
    e.preventDefault();
    setGuardando(true);
    setModalError('');
    const body = {
      tipo: modalForm.tipo || undefined,
      cantidad: parseInt(modalForm.cantidad, 10) || 1,
      nombre: modalForm.nombre?.trim() || undefined,
      fabricante: modalForm.fabricante?.trim() || undefined,
      conexion: modalForm.conexion || undefined,
      numeroSerie: modalForm.numeroSerie?.trim() || undefined,
      ubicacion: modalForm.ubicacion?.trim() || undefined,
      notas: modalForm.notas?.trim() || undefined,
      fechaAlta: modalForm.fechaAlta || undefined,
    };
    actualizarPerifericoM(id, body)
      .then(data => {
        if (!data) { setModalError('No se encontró el periférico.'); return; }
        setP(data);
        setModalAbierto(false);
      })
      .catch(() => setModalError('No se pudo guardar los cambios.'))
      .finally(() => setGuardando(false));
  }

  function hacerAsignar(e) {
    e?.preventDefault();
    if (!pcUuidAsignar.trim()) return;
    setAsignando(true);
    setMsgAsignar(null);
    asignarPerifericoM(id, pcUuidAsignar.trim(), motivoAsignar.trim() || undefined)
      .then(data => {
        if (!data) { setMsgAsignar('No se encontró el periférico.'); return; }
        setPcUuidAsignar('');
        setMotivoAsignar('');
        if (data.id && data.id !== id) {
          navigate(`/perifericos/stock/${encodeURIComponent(data.id)}`);
        } else {
          setP(data);
        }
      })
      .catch(() => setMsgAsignar('No se pudo asignar el periférico.'))
      .finally(() => setAsignando(false));
  }

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstadoPerifericoM(id, estadoSel, motivoEstado.trim())
      .then(data => {
        if (!data) { setMsgEstado('Periférico no encontrado.'); return; }
        setP(data);
        setEstadoSel('');
        setMotivoEstado('');
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado.'))
      .finally(() => setGuardandoEstado(false));
  }

  function borrarItem() {
    if (!window.confirm('¿Estás seguro de que querés eliminar este periférico? Esta acción no se puede deshacer.')) return;
    setBorrando(true);
    deletePerifericoM(id)
      .then(() => navigate('/perifericos/stock'))
      .catch(() => {
        alert('Error al eliminar el periférico.');
        setBorrando(false);
      });
  }

  function irAAsignar() {
    asignarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (cargando || error || !p) {
    return (
      <DetailOverlayShell
        onClose={() => navigate('/perifericos/stock')}
        title={cargando ? 'Cargando periférico…' : 'Periférico'}
        titleIcon={<Package className="w-5 h-5 text-slate-300 shrink-0" />}
        loading={cargando}
        error={error || (!cargando && !p ? 'Periférico no encontrado.' : null)}
        maxWidthClass="max-w-5xl"
      />
    );
  }

  const titulo = p.nombre
    ? `${labelTipoStock(p.tipo) || p.tipo || 'Periférico'} — ${p.nombre}`
    : (labelTipoStock(p.tipo) || p.tipo || 'Periférico');

  return (
    <>
      <DetailOverlayShell
        onClose={() => navigate('/perifericos/stock')}
        title={titulo}
        titleIcon={<Package className="w-5 h-5 text-slate-300 shrink-0" />}
        subtitle={
          <>
            ID: <span className="font-mono text-slate-300">{p.id}</span>
            {p.estado ? (
              <>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="font-bold text-slate-200">{p.estado}</span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <WriteGate>
              <button
                type="button"
                onClick={irAAsignar}
                className="px-4 py-2 border border-slate-700 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Asignar
              </button>
            </WriteGate>
            <DetailEditButton onClick={abrirEdicion} />
            <DetailDangerButton onClick={borrarItem} disabled={borrando}>
              <Trash2 className="w-4 h-4" />
              {borrando ? 'Eliminando…' : 'Eliminar'}
            </DetailDangerButton>
          </>
        }
        maxWidthClass="max-w-5xl"
      >
        <DetailSection title="Datos del periférico">
          <DetailFieldGrid
            fields={[
              { label: 'Tipo', value: labelTipoStock(p.tipo) || p.tipo },
              { label: 'Unidades', value: p.cantidad ?? 1 },
              ...(normalizarTipoStock(p.tipo) === 'computadora'
                ? [
                    { label: 'Etiqueta', value: etiquetaFromItem(p) || null, fullWidth: true },
                    {
                      label: 'Descripción',
                      value: descripcionFromItem(p) || null,
                      fullWidth: true,
                    },
                  ]
                : [{ label: 'Nombre', value: p.nombre }]),
              { label: 'Fabricante', value: p.fabricante },
              { label: 'Número de serie', value: p.numeroSerie },
              { label: 'Conexión', value: p.conexion },
              {
                label: 'PC vinculada',
                value: p.computadoraUuid ? (
                  <Link
                    to={`/computadoras/${encodeURIComponent(p.computadoraUuid)}`}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    {p.computadoraHostname || p.computadoraUuid}
                  </Link>
                ) : (p.computadoraHostname || 'Sin asignar'),
              },
              { label: 'Ubicación', value: p.ubicacion },
              { label: 'Estado actual', value: p.estado },
              ...(p.comboNombre ? [{ label: 'Combo', value: p.comboNombre }] : []),
              { label: 'Fecha de alta', value: p.fechaAlta ? String(p.fechaAlta) : null },
              ...(p.notas ? [{ label: 'Notas', value: p.notas, fullWidth: true }] : []),
            ]}
          />
        </DetailSection>

        {normalizarTipoStock(p.tipo) === 'computadora' && (() => {
          const spec = resolveSpecFromItem(p);
          const tieneSpec = spec.cpuModelo || spec.ramTotalGb || spec.discoResumen;
          if (!tieneSpec) return null;
          return (
          <DetailSection title="Especificación de hardware">
            <DetailFieldGrid
              fields={[
                { label: 'CPU', value: spec.cpuModelo },
                { label: 'RAM (GB)', value: spec.ramTotalGb },
                { label: 'Disco', value: spec.discoResumen },
                { label: 'Tipo de equipo', value: spec.tipoEquipo },
                { label: 'Condición', value: spec.condicion },
              ]}
            />
          </DetailSection>
          );
        })()}

        <div ref={asignarRef}>
          <DetailSection title="Asignar a PC de stock">
            <p className="text-sm text-slate-500 mb-3">
              Vincula 1 unidad del stock a una PC trazable del inventario (por UUID). Si hay más de 1 en stock, se descuenta automáticamente y se crea un registro separado. No requiere que el agente AgenteBacar haya reportado aún.
            </p>
            <WriteGate fallback={<p className="text-sm text-slate-500">Sin permiso de escritura.</p>}>
              <form onSubmit={hacerAsignar} className="space-y-3 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    PC de stock *
                  </label>
                  {cargandoPcs ? (
                    <p className="text-sm text-slate-500 font-medium">Cargando PCs…</p>
                  ) : pcsAsignables.length === 0 ? (
                    <p className="text-sm text-amber-700 font-medium">No hay PCs trazables de stock. Usá &quot;Sacar 1&quot; en un lote primero.</p>
                  ) : (
                    <FriendlySelect
                      name="pcUuidAsignar"
                      value={pcUuidAsignar}
                      placeholder="Seleccionar PC…"
                      options={opcionesPc}
                      onChange={setPcUuidAsignar}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Motivo (opcional)
                  </label>
                  <input
                    className="inventory-input"
                    placeholder="Motivo de la asignación"
                    value={motivoAsignar}
                    onChange={e => setMotivoAsignar(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={asignando || !pcUuidAsignar.trim() || cargandoPcs || pcsAsignables.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm cursor-pointer transition-colors inline-flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {asignando ? 'Asignando…' : 'Asignar 1 unidad'}
                </button>
                {msgAsignar ? <p className="text-sm text-red-600 font-medium">{msgAsignar}</p> : null}
              </form>
            </WriteGate>
          </DetailSection>
        </div>

        <CambiarEstadoForm
          idPrefix="perif"
          opciones={opcionesEnumCatalogo(estadoItems)}
          estadoSel={estadoSel}
          setEstadoSel={setEstadoSel}
          motivo={motivoEstado}
          setMotivo={setMotivoEstado}
          onSubmit={guardarEstado}
          guardando={guardandoEstado}
          msg={msgEstado}
        />

        <HistorialEstadosSection historial={p.historialEstados ?? []} estadoItems={estadoItems} />
      </DetailOverlayShell>

      <InfraestructuraModal
        isOpen={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={guardarEdicion}
        isEdit={true}
        title="Periférico"
        error={modalError}
        formState={modalForm}
        onChange={onChangeForm}
        fields={[
          {
            name: 'tipo',
            label: 'Tipo',
            type: 'select',
            options: opcionesCatalogo(tiposStockCatalogo, modalForm.tipo).map(t => ({ value: t.codigo, label: t.label })),
          },
          { name: 'cantidad', label: 'Unidades', type: 'number' },
          { name: 'nombre', label: 'Nombre / descripción', type: 'text' },
          { name: 'fabricante', label: 'Fabricante', type: 'text' },
          { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
          {
            name: 'conexion',
            label: 'Conexión',
            type: 'select',
            options: opcionesCatalogo(conexionItems, modalForm.conexion),
          },
          { name: 'ubicacion', label: 'Ubicación', type: 'text' },
          { name: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
          { name: 'notas', label: 'Notas', type: 'textarea', fullWidth: true },
        ]}
      />
    </>
  );
}

export default PerifericoManualDetail;

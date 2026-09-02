import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { fetchCamaras, createCamara, asignarNvrCamara, deleteCamara, updateEstadoCamara, updateUbicacionCamara, actualizarCamara } from '../api/camaraApi';
import ImportModal from '../components/ImportModal';
import { camarasSchema } from '../lib/importSchemas/camarasSchema';
import { fetchNvrs } from '../api/nvrApi';
import {
  UBICACIONES_CAMARA_SUGERIDAS,
  labelUbicacionEnum,
} from '../constants/ubicaciones';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioFilterBar,
  StudioDataTable,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
} from '../components/studio/StudioUi';
import TableFilters from '../components/TableFilters';
import WriteGate from '../components/WriteGate';

function CamaraList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [catalogoCompleto, setCatalogoCompleto] = useState([]);
  const [nvrs, setNvrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroNvr, setFiltroNvr] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [nvrAsignar, setNvrAsignar] = useState('');
  const [aplicandoNvr, setAplicandoNvr] = useState(false);
  const [estadoBulk, setEstadoBulk] = useState('');
  const [motivoEstadoBulk, setMotivoEstadoBulk] = useState('');
  const [aplicandoEstado, setAplicandoEstado] = useState(false);
  const [msgBulk, setMsgBulk] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);
  const headerCbRef = useRef(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const handleOpenAddModal = () => {
    setIsEditModal(false);
    setEditingId(null);
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
      nvrId: '',
      estado: 'OPERATIVO'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({
      dispositivo: item.id || '',
      nombre: item.nombre || '',
      marca: item.marca || '',
      descripcion: item.descripcion || '',
      responsable: item.responsable || '',
      ubicacion: item.ubicacion || '',
      direccionIp: item.direccionIp || '',
      puerto: item.puerto != null ? String(item.puerto) : '',
      tipo: item.tipo || '',
      nvrId: item.nvrId || '',
      estado: item.estado || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    if (!item?.id) return;
    const nombre = (item.nombre && String(item.nombre).trim()) ? item.nombre : item.id;
    if (
      window.confirm(
        `¿Borrar la cámara "${nombre}" (${item.id})? No se puede deshacer.`,
      )
    ) {
      try {
        await deleteCamara(item.id);
        const params = {};
        if (filtroUbicacion) params.ubicacion = filtroUbicacion;
        if (filtroNvr) params.nvrId = filtroNvr;
        const fresh = await fetchCamaras(params);
        setLista(fresh);
        if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
        setSeleccion(prev => {
          const n = new Set(prev);
          n.delete(item.id);
          return n;
        });
      } catch {
        alert('No se pudo eliminar la cámara.');
      }
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
      if (isEditModal) {
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
        };
        if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
          payload.puerto = puertoNum;
        }
        await actualizarCamara(editingId, payload);
        
        const originalItem = lista.find(c => c.id === editingId);
        if (originalItem && modalForm.estado && modalForm.estado !== originalItem.estado) {
          await updateEstadoCamara(editingId, modalForm.estado, "Edición manual desde listado");
        }
        
        // Fetch fresh list to reflect changes
        const params = {};
        if (filtroUbicacion) params.ubicacion = filtroUbicacion;
        if (filtroNvr) params.nvrId = filtroNvr;
        const fresh = await fetchCamaras(params);
        setLista(fresh);
        if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      } else {
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
        
        const params = {};
        if (filtroUbicacion) params.ubicacion = filtroUbicacion;
        if (filtroNvr) params.nvrId = filtroNvr;
        const fresh = await fetchCamaras(params);
        setLista(fresh);
        if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Error al guardar");
    }
  };

  const nvrNombre = useMemo(() => {
    const m = new Map();
    for (const n of nvrs) {
      if (n.id) m.set(n.id, n.nombre ?? n.id);
    }
    return m;
  }, [nvrs]);

  useEffect(() => {
    fetchNvrs()
      .then(setNvrs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    const params = {};
    if (filtroUbicacion) params.ubicacion = filtroUbicacion;
    if (filtroNvr) params.nvrId = filtroNvr;
    fetchCamaras(params)
      .then(data => {
        setLista(data);
        if (!filtroUbicacion && !filtroNvr) {
          setCatalogoCompleto(data);
        }
      })
      .catch(() => setError('No se pudo cargar el listado de cámaras'))
      .finally(() => setCargando(false));
  }, [filtroUbicacion, filtroNvr]);

  const opcionesUbicacion = useMemo(() => {
    const set = new Set(UBICACIONES_CAMARA_SUGERIDAS);
    for (const c of catalogoCompleto) {
      if (c.ubicacion) set.add(c.ubicacion);
    }
    return [...set].sort((a, b) => String(a).localeCompare(String(b), 'es'));
  }, [catalogoCompleto]);

  const camaras = useMemo(() => {
    if (!ordenNombre) return lista;
    const list = [...lista];
    list.sort((a, b) => {
      const na = (a.nombre ?? '').trim();
      const nb = (b.nombre ?? '').trim();
      let cmp = 0;
      if (!na && !nb) cmp = 0;
      else if (!na) cmp = 1;
      else if (!nb) cmp = -1;
      else cmp = na.localeCompare(nb, 'es', { sensitivity: 'base' });
      return ordenNombre === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [lista, ordenNombre]);

  const idsVisibles = useMemo(() => camaras.map(c => c.id).filter(Boolean), [camaras]);

  const seleccionadosEnVista = useMemo(
    () => idsVisibles.filter(id => seleccion.has(id)).length,
    [idsVisibles, seleccion],
  );

  const todasVisiblesSeleccionadas =
    idsVisibles.length > 0 && seleccionadosEnVista === idsVisibles.length;

  useEffect(() => {
    const el = headerCbRef.current;
    if (!el) return;
    el.indeterminate =
      seleccionadosEnVista > 0 && seleccionadosEnVista < idsVisibles.length;
  }, [seleccionadosEnVista, idsVisibles.length]);

  function toggleId(selId) {
    if (!selId) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (n.has(selId)) n.delete(selId);
      else n.add(selId);
      return n;
    });
    setMsgBulk(null);
  }

  function toggleSeleccionarVisibles() {
    if (idsVisibles.length === 0) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (todasVisiblesSeleccionadas) {
        idsVisibles.forEach(id => n.delete(id));
      } else {
        idsVisibles.forEach(id => n.add(id));
      }
      return n;
    });
    setMsgBulk(null);
  }

  async function aplicarNvrMasivo() {
    if (!nvrAsignar || seleccion.size === 0) return;
    setAplicandoNvr(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await asignarNvrCamara(camId, nvrAsignar);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      setNvrAsignar('');
      if (fail > 0) {
        setMsgBulk({ tipo: 'err', texto: `NVR: actualizadas ${ok}, fallidas ${fail}.` });
      } else {
        setMsgBulk({ tipo: 'ok', texto: `NVR asignada en ${ok} cámara(s).` });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setAplicandoNvr(false);
    }
  }

  async function aplicarEstadoMasivo() {
    if (!estadoBulk || seleccion.size === 0) return;
    setAplicandoEstado(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    const motivo = motivoEstadoBulk.trim();
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await updateEstadoCamara(camId, estadoBulk, motivo);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      setEstadoBulk('');
      setMotivoEstadoBulk('');
      if (fail > 0) {
        setMsgBulk({ tipo: 'err', texto: `Estado: actualizadas ${ok}, fallidas ${fail}.` });
      } else {
        setMsgBulk({ tipo: 'ok', texto: `Estado aplicado en ${ok} cámara(s).` });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setAplicandoEstado(false);
    }
  }

  async function eliminarSeleccionMasiva() {
    if (seleccion.size === 0) return;
    const n = seleccion.size;
    if (
      !window.confirm(
        `¿Borrar ${n} cámara${n === 1 ? '' : 's'} seleccionada${n === 1 ? '' : 's'}? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setEliminandoMasivo(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await deleteCamara(camId);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      if (fail > 0) {
        setMsgBulk({
          tipo: 'err',
          texto: `Eliminadas ${ok}, fallidas ${fail}.`,
        });
      } else {
        setMsgBulk({
          tipo: 'ok',
          texto: `${ok} cámara${ok === 1 ? '' : 's'} eliminada${ok === 1 ? '' : 's'}.`,
        });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setEliminandoMasivo(false);
    }
  }

  async function eliminarCamaraFila(e, cam) {
    e.stopPropagation();
    if (!cam?.id || eliminandoMasivo) return;
    const nombre = (cam.nombre && String(cam.nombre).trim()) ? cam.nombre : cam.id;
    if (
      !window.confirm(
        `¿Borrar la cámara "${nombre}" (${cam.id})? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setBorrandoId(cam.id);
    setMsgBulk(null);
    try {
      const ok = await deleteCamara(cam.id);
      if (!ok) {
        setMsgBulk({ tipo: 'err', texto: 'No se encontró la cámara (quizá ya fue borrada).' });
        return;
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(prev => {
        const n = new Set(prev);
        n.delete(cam.id);
        return n;
      });
      setMsgBulk({ tipo: 'ok', texto: 'Cámara eliminada.' });
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo eliminar la cámara.' });
    } finally {
      setBorrandoId(null);
    }
  }

  if (cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }

  const totalInventario = catalogoCompleto.length;
  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.nombre || !String(row.nombre).trim()) continue;
      const dispositivo = row.dispositivo ? String(row.dispositivo).trim() :
        String(row.nombre).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      try {
        await createCamara({
          dispositivo,
          nombre: String(row.nombre).trim(),
          marca: row.marca ? String(row.marca).trim() : undefined,
          tipo: row.tipo ? String(row.tipo).trim() : undefined,
          ubicacion: row.ubicacion ? String(row.ubicacion).trim() : 'IMPORTACION',
          direccionIp: row.direccionIp ? String(row.direccionIp).trim() : undefined,
          puerto: row.puerto ? Number(row.puerto) || undefined : undefined,
          nvrId: row.nvrId ? String(row.nvrId).trim() : undefined,
          responsable: row.responsable ? String(row.responsable).trim() : undefined,
        });
      } catch (err) {
        console.error('Error importando cámara:', row, err);
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    setFiltroUbicacion('');
    setFiltroNvr('');
    if (errores > 0) alert(`Importación finalizada con ${errores} errores.`);
    else alert('Importación completada con éxito.');
  }

  const visibles = camaras.length;
  const hayFiltros = !!(filtroUbicacion || filtroNvr);
  const subt = !hayFiltros
    ? `${visibles} cámara${visibles === 1 ? '' : 's'}`
    : `${visibles} de ${totalInventario} cámara${totalInventario === 1 ? '' : 's'}`;

  return (
    <>
    <StudioPageShell
      title={`Infraestructura: NVR y Cámaras de Seguridad (${totalInventario})`}
      subtitle={`${subt}. Dispositivos y grabadoras digitales conectadas al circuito cerrado local.`}
      actions={
        <>
          <StudioSecondaryButton requiresWrite onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton requiresWrite onClick={handleOpenAddModal}>
            Nueva cámara
          </StudioPrimaryButton>
        </>
      }
    >
      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Select
            id="filtro-ubicacion-cam"
            label="Ubicación"
            value={filtroUbicacion}
            onChange={setFiltroUbicacion}
          >
            <option value="">{`Todas (${totalInventario})`}</option>
            {opcionesUbicacion.map(u => (
              <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
            ))}
          </TableFilters.Select>
          <TableFilters.Select
            id="filtro-nvr-cam"
            label="NVR"
            value={filtroNvr}
            onChange={setFiltroNvr}
          >
            <option value="">Todas</option>
            {nvrs.map(n => (
              <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
            ))}
          </TableFilters.Select>
          <TableFilters.Select
            id="orden-nombre-cam"
            label="Orden por nombre"
            value={ordenNombre}
            onChange={setOrdenNombre}
          >
            <option value="">Sin ordenar</option>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </TableFilters.Select>
        </TableFilters>

        <WriteGate>
        {seleccion.size > 0 ? (
          <div className="inventory-bulk-wrapper">
            <div className="inventory-toolbar-row inventory-toolbar-row--bulk">
              <p className="inventory-bulk-hint">
                <strong>{seleccion.size}</strong> cámara{seleccion.size === 1 ? '' : 's'} seleccionada
                {seleccion.size === 1 ? '' : 's'}
              </p>
              <div className="inventory-field inventory-field--sm" style={{ minWidth: '14rem' }}>
                <label className="inventory-field__label" htmlFor="cam-nvr-asignar">Asignar NVR</label>
                <select
                  id="cam-nvr-asignar"
                  className="inventory-select"
                  value={nvrAsignar}
                  onChange={e => setNvrAsignar(e.target.value)}
                >
                  <option value="">Elegir NVR…</option>
                  {nvrs.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo || !nvrAsignar}
                onClick={aplicarNvrMasivo}
              >
                {aplicandoNvr ? 'Aplicando…' : 'Aplicar NVR'}
              </button>
              <div className="inventory-field inventory-field--sm" style={{ minWidth: '11rem' }}>
                <label className="inventory-field__label" htmlFor="cam-estado-bulk">Estado</label>
                <select
                  id="cam-estado-bulk"
                  className="inventory-select"
                  value={estadoBulk}
                  onChange={e => setEstadoBulk(e.target.value)}
                >
                  <option value="">Elegir…</option>
                  {ESTADOS_OPERATIVOS.map(e => (
                    <option key={e} value={e}>{ESTADO_OPERATIVO_LABELS[e] ?? e}</option>
                  ))}
                </select>
              </div>
              <div className="inventory-field" style={{ minWidth: '10rem', flex: '1 1 10rem' }}>
                <label className="inventory-field__label" htmlFor="cam-motivo-estado-bulk">Motivo (opcional)</label>
                <input
                  id="cam-motivo-estado-bulk"
                  type="text"
                  className="inventory-input"
                  value={motivoEstadoBulk}
                  onChange={e => setMotivoEstadoBulk(e.target.value)}
                  placeholder="Ej. inventario 2026"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo || !estadoBulk}
                onClick={aplicarEstadoMasivo}
              >
                {aplicandoEstado ? 'Aplicando…' : 'Aplicar estado'}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo}
                onClick={eliminarSeleccionMasiva}
              >
                {eliminandoMasivo ? 'Eliminando…' : 'Eliminar seleccionadas'}
              </button>
            </div>
          </div>
        ) : null}
        </WriteGate>

        {msgBulk ? (
          <p
            className={`inventory-toolbar-msg ${msgBulk.tipo === 'ok' ? 'inventory-toolbar-msg--ok' : 'inventory-toolbar-msg--err'}`}
            role="status"
          >
            {msgBulk.texto}
          </p>
        ) : null}
      </StudioFilterBar>

      <div className="pt-2">
        <InfraestructuraGrid 
          items={camaras} 
          type="camara" 
          onItemClick={(c) => navigate(`/camaras/${c.id}`)}
          selectedIds={seleccion}
          onToggleSelection={toggleId}
          onEditItem={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={camarasSchema}
        entityName="Cámaras"
        isImporting={importando}
        existingData={catalogoCompleto}
      />

      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="Cámara de Seguridad"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
          ...(!isEditModal ? [{ name: 'dispositivo', label: 'Dispositivo (ID único / Serie)', type: 'text', placeholder: 'Ej. camara-patio-1', required: true }] : []),
          { name: 'nombre', label: 'Nombre comercial / descriptivo', type: 'text', placeholder: 'Ej. Domo Entrada Principal', required: true },
          { name: 'nvrId', label: 'NVR (opcional)', type: 'select', options: nvrs.map(n => ({ value: n.id, label: n.nombre ?? n.id })) },
          { name: 'ubicacion', label: 'Ubicación', type: 'select', options: UBICACIONES_CAMARA_SUGERIDAS.map(u => ({ value: u, label: labelUbicacionEnum(u) })), required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text', placeholder: 'Ej. 192.168.1.100' },
          { name: 'puerto', label: 'Puerto', type: 'number', placeholder: 'Ej. 37777' },
          { name: 'tipo', label: 'Tipo de Cámara / Modelo', type: 'text', placeholder: 'Ej. Domo, Bala, PTZ', required: true },
          { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej. Hikvision, Dahua' },
          { name: 'responsable', label: 'Responsable', type: 'text', placeholder: 'Ej. Sistemas / Seguridad' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', placeholder: 'Notas adicionales...', fullWidth: true },
          ...(isEditModal ? [{ name: 'estado', label: 'Estado', type: 'select', options: ESTADOS_OPERATIVOS.map(e => ({ value: e, label: ESTADO_OPERATIVO_LABELS[e] })) }] : [])
        ]}
      />
    </StudioPageShell>
    <Outlet />
    </>
  );
}

export default CamaraList;

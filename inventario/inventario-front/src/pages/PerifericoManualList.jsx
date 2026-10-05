import { useState, useEffect, useMemo } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, Laptop, UserCheck, ChevronDown, Layers, Router, ClipboardList, Smartphone,
} from 'lucide-react';
import { fetchComputadora, sacarDePipeline } from '../api/computadoraApi';
import PerifericosTab from '../components/stock/PerifericosTab';
import StockLotesTab from '../components/stock/StockLotesTab';
import StockUnidadesTab from '../components/stock/StockUnidadesTab';
import StockInfraTab from '../components/stock/StockInfraTab';
import StockAsignacionesTab from '../components/stock/StockAsignacionesTab';
import StockCelularesTab from '../components/stock/StockCelularesTab';
import StockManualListModals from '../components/stock/StockManualListModals';
import EditPcStockModal from '../components/EditPcStockModal';
import { editPcStockModalProps, nuevaPcStockModalProps } from '../utils/editPcStockModalProps';
import { normalizarTipoStock, esTipoInfra } from '../constants/tiposStock';
import { useCatalogo, labelsEnumCatalogo } from '../hooks/useCatalogo';
import { usePerifericoManualListData } from '../hooks/usePerifericoManualListData';
import { useCelulares } from '../hooks/useQueries';
import { esCelularEnStock, esCelularAsignadoDesdeStock } from '../constants/celulares';
import { usePerifericoItemForm } from '../hooks/usePerifericoItemForm';
import { useStockComboForm } from '../hooks/useStockComboForm';
import { useStockPcModals } from '../hooks/useStockPcModals';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { resolveSpecFromItem, specSearchText } from '../utils/stockPcHelpers';
import { esPcPipelineStock } from '../utils/pipelinePcHelpers';
import {
  filtrarAsignados,
  filtrarEnBodega,
  filtrarPcsAsignadasDesdeStock,
} from '../utils/asignacionesStockHelpers';

export default function PerifericoManualList() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: tiposStockCatalogo } = useCatalogo('tipos_stock');
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');
  const { items: condicionesItems } = useCatalogo('condiciones_equipo');
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const estadoLabels = useMemo(() => labelsEnumCatalogo(estadoItems), [estadoItems]);

  const vista = searchParams.get('vista') === 'asignaciones' ? 'asignaciones' : 'stock';
  const [activeTab, setActiveTab] = useState('perifericos');
  const [buscar, setBuscar] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sacandoUuid, setSacandoUuid] = useState(null);
  const [celularEnEdicion, setCelularEnEdicion] = useState(null);

  const setVista = (nextVista) => {
    const next = new URLSearchParams(searchParams);
    if (nextVista === 'asignaciones') next.set('vista', 'asignaciones');
    else next.delete('vista');
    setSearchParams(next, { replace: true });
  };

  const {
    lista,
    setLista,
    cargando,
    error,
    pcsStock,
    setPcsStock,
    todasPcs,
    setTodasPcs,
    pcsAsignables,
    cargandoPcs,
    errorPcs,
    refreshLista,
    refreshPcs,
  } = usePerifericoManualListData();

  const {
    data: celularesLista = [],
    isLoading: cargandoCelulares,
    error: errorCelulares,
  } = useCelulares();

  const celularesEnStock = useMemo(
    () => (Array.isArray(celularesLista) ? celularesLista.filter(esCelularEnStock) : []),
    [celularesLista],
  );

  const celularesAsignados = useMemo(
    () => (Array.isArray(celularesLista) ? celularesLista.filter(esCelularAsignadoDesdeStock) : []),
    [celularesLista],
  );

  const itemForm = usePerifericoItemForm({
    lista,
    setLista,
    setActiveTab,
    tiposEquipoItems,
    condicionesItems,
  });

  const comboForm = useStockComboForm({ setLista });

  const pcModals = useStockPcModals({
    setLista,
    setPcsStock,
    setTodasPcs,
    setActiveTab,
    refreshLista,
    refreshPcs,
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
    onAfterAsignarPeriferico: () => setVista('asignaciones'),
    onAfterAsignarUbicacion: () => setVista('asignaciones'),
  });

  useEffect(() => {
    const uuidEditar = searchParams.get('editarPc');
    if (!uuidEditar) return undefined;

    const tab = searchParams.get('tab');
    if (tab === 'perifericos' || tab === 'lotes-pc' || tab === 'unidades') {
      setActiveTab(tab);
    }

    let cancel = false;
    fetchComputadora(uuidEditar)
      .then((pc) => {
        if (cancel || !pc) return;
        pcModals.handleOpenEditPc(pc);
        const next = new URLSearchParams(searchParams);
        next.delete('editarPc');
        next.delete('tab');
        setSearchParams(next, { replace: true });
      })
      .catch(() => {
        if (!cancel) pcModals.setEditPcError('No se pudo abrir la PC para editar.');
      });

    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- abrir solo cuando llega editarPc por URL
  }, [searchParams.get('editarPc')]);

  const pcsNuevasStock = useMemo(
    () => lista.filter(c => normalizarTipoStock(c.tipo) === 'computadora'),
    [lista],
  );

  const listaEnBodega = useMemo(
    () => filtrarEnBodega(lista, estadoLabels),
    [lista, estadoLabels],
  );

  const asignados = useMemo(
    () => filtrarAsignados(lista, estadoLabels),
    [lista, estadoLabels],
  );

  const pcsAsignadas = useMemo(
    () => filtrarPcsAsignadasDesdeStock(todasPcs, estadoLabels),
    [todasPcs, estadoLabels],
  );

  const totalAsignadosUnidades = useMemo(
    () => asignados.reduce((sum, p) => sum + (p.cantidad ?? 1), 0)
      + pcsAsignadas.length
      + celularesAsignados.length,
    [asignados, pcsAsignadas, celularesAsignados],
  );

  const perifericosBodega = useMemo(
    () => listaEnBodega.filter(c => {
      const tipo = normalizarTipoStock(c.tipo);
      return tipo !== 'computadora' && !esTipoInfra(tipo);
    }),
    [listaEnBodega],
  );

  const itemsFiltrados = useMemo(() => {
    return perifericosBodega.filter(c => {
      const tipo = normalizarTipoStock(c.tipo);
      const text = `${c.nombre || ''} ${c.fabricante || ''} ${c.id || ''} ${c.numeroSerie || ''}`.toLowerCase();
      const matchesSearch = text.includes(buscar.toLowerCase());
      const matchesCategory = selectedCategory === 'All'
        || tipo === normalizarTipoStock(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [perifericosBodega, buscar, selectedCategory]);

  const itemsInfra = useMemo(
    () => listaEnBodega.filter(c => esTipoInfra(c.tipo)),
    [listaEnBodega],
  );

  const totalInfraUnidades = useMemo(
    () => itemsInfra.reduce((sum, p) => sum + (p.cantidad ?? 1), 0),
    [itemsInfra],
  );

  const lotesFiltrados = useMemo(() => {
    if (!pcModals.buscarLote) return pcsNuevasStock;
    const q = pcModals.buscarLote.toLowerCase();
    return pcsNuevasStock.filter(p => {
      const text = `${p.nombre || ''} ${p.fabricante || ''} ${p.id || ''} ${p.ubicacion || ''} ${specSearchText(resolveSpecFromItem(p))}`.toLowerCase();
      return text.includes(q);
    });
  }, [pcsNuevasStock, pcModals.buscarLote]);

  const pcsPipeline = useMemo(
    () => todasPcs.filter(esPcPipelineStock),
    [todasPcs],
  );

  const pcsPipelineFiltradas = useMemo(() => {
    if (!pcModals.buscarUnidad) return pcsPipeline;
    const q = pcModals.buscarUnidad.toLowerCase();
    return pcsPipeline.filter(pc => {
      const text = `${pc.hostname || ''} ${pc.uuid || ''} ${pc.sistemaOperativo || ''} ${pc.tipoEquipo || ''} ${pc.ubicacion || ''} ${pc.fabricante || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [pcsPipeline, pcModals.buscarUnidad]);

  function handleSacarDePipeline(pc) {
    const nombre = (pc.hostname && String(pc.hostname).trim()) ? pc.hostname : (pc.uuid || 'esta PC');
    if (!window.confirm(`¿Devolver "${nombre}" al lote de Stock de PCs? Se elimina la unidad de computadoras y suma 1 al lote.`)) return;
    setSacandoUuid(pc.uuid);
    sacarDePipeline(pc.uuid)
      .then((data) => {
        if (!data) {
          alert('No se encontró la computadora');
          return;
        }
        return refreshPcs().then(() => refreshLista()).then(() => {
          queryClient.invalidateQueries({ queryKey: ['computadoras'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
          queryClient.invalidateQueries({ queryKey: ['perifericosM'] });
        });
      })
      .catch((err) => {
        alert(err?.message || 'No se pudo sacar del pipeline');
      })
      .finally(() => setSacandoUuid(null));
  }

  const unidadesFiltradas = useMemo(() => {
    if (!pcModals.buscarUnidad) return pcsStock;
    const q = pcModals.buscarUnidad.toLowerCase();
    return pcsStock.filter(pc => {
      const text = `${pc.hostname || ''} ${pc.uuid || ''} ${pc.sistemaOperativo || ''} ${pc.tipoEquipo || ''} ${pc.ubicacion || ''} ${pc.fabricante || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [pcsStock, pcModals.buscarUnidad]);

  const totalUnidadesLotes = useMemo(
    () => pcsNuevasStock.reduce((sum, p) => sum + (p.cantidad ?? 1), 0),
    [pcsNuevasStock],
  );

  if (vista === 'asignaciones' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (vista === 'asignaciones' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }

  if (activeTab === 'perifericos' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'perifericos' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'lotes-pc' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'lotes-pc' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'infraestructura' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'infraestructura' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'unidades' && cargandoPcs) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'unidades' && errorPcs) {
    return (
      <>
        <StudioError message={errorPcs} />
        <Outlet />
      </>
    );
  }
  if (vista === 'stock' && activeTab === 'celulares' && cargandoCelulares) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (vista === 'stock' && activeTab === 'celulares' && errorCelulares) {
    return (
      <>
        <StudioError message={errorCelulares?.message || 'No se pudieron cargar los celulares en stock.'} />
        <Outlet />
      </>
    );
  }

  const tabDescriptions = {
    stock: {
      perifericos: 'Periféricos disponibles en bodega: teclados, monitores, mouse y otros componentes.',
      'lotes-pc': 'Contás cuántas PCs hay de cada tipo (ej. 3× Ryzen 5600G 8GB). Stock por cantidad — sin hostname ni agente.',
      unidades: 'Pipeline de PCs trazables: arrastrá entre columnas o usá las acciones de cada tarjeta.',
      infraestructura: 'Equipos de red en depósito: routers, switches y access points.',
      celulares: 'Celulares en stock de depósito: marca, modelo, IMEI, cargador y condición. Asigná a un responsable para sacarlos del stock.',
    },
    asignaciones: 'Custodia activa: periféricos e infraestructura, computadoras asignadas desde stock y celulares liberados del depósito. Devolvé periféricos, infraestructura y celulares acá; las PCs se gestionan desde el pipeline.',
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Inventario IT y Control de Suministros</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {vista === 'asignaciones'
              ? tabDescriptions.asignaciones
              : tabDescriptions.stock[activeTab]}
          </p>
        </div>

        {vista === 'stock' && activeTab === 'perifericos' && (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={itemForm.handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              type="button"
              onClick={comboForm.handleOpenCombo}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              Combo
            </button>
          </div>
        )}

        {vista === 'stock' && activeTab === 'lotes-pc' && (
          <button
            type="button"
            onClick={itemForm.handleOpenAddLotePc}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Cargar al stock
          </button>
        )}

        {vista === 'stock' && activeTab === 'infraestructura' && (
          <button
            type="button"
            onClick={() => itemForm.handleOpenAddInfra('router')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo equipo
          </button>
        )}

        {vista === 'stock' && activeTab === 'unidades' && (
          <div className="relative ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => pcModals.setPcMenuOpen(prev => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Asignación
              <ChevronDown className={`w-4 h-4 transition-transform ${pcModals.pcMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {pcModals.pcMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => pcModals.setPcMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { pcModals.setPcMenuOpen(false); pcModals.setNuevaPcOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Laptop className="w-4 h-4 text-blue-600" />
                    Nueva computadora
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { pcModals.setPcMenuOpen(false); pcModals.setAsignarDesdeListaOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Asignar PC existente
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-slate-200/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setVista('stock')}
            className={`px-5 py-2.5 rounded-lg text-sm font-extrabold transition-all flex items-center gap-2 ${
              vista === 'stock'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Stock
          </button>
          <button
            type="button"
            onClick={() => setVista('asignaciones')}
            className={`px-5 py-2.5 rounded-lg text-sm font-extrabold transition-all flex items-center gap-2 ${
              vista === 'asignaciones'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Asignaciones
            {totalAsignadosUnidades > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                {totalAsignadosUnidades}
              </span>
            )}
          </button>
        </div>
      </div>

      {vista === 'stock' && (
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('perifericos')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'perifericos'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Periféricos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lotes-pc')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'lotes-pc'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Stock de PCs
          {totalUnidadesLotes > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-700 rounded-full">{totalUnidadesLotes}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unidades')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'unidades'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Computadoras
          {pcsPipeline.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">{pcsPipeline.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('infraestructura')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'infraestructura'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Router className="w-4 h-4" />
          Infraestructura
          {totalInfraUnidades > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full">{totalInfraUnidades}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('celulares')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'celulares'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Celulares
          {celularesEnStock.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-full">{celularesEnStock.length}</span>
          )}
        </button>
      </div>
      )}

      {vista === 'stock' && activeTab === 'perifericos' && (
        <PerifericosTab
          lista={perifericosBodega}
          itemsFiltrados={itemsFiltrados}
          buscar={buscar}
          onBuscarChange={setBuscar}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          estadoLabels={estadoLabels}
          onUpdateStock={itemForm.handleUpdateStock}
          onOpenEdit={itemForm.handleOpenEdit}
          onAsignarPeriferico={pcModals.openAsignarPeriferico}
        />
      )}

      {vista === 'stock' && activeTab === 'lotes-pc' && (
        <StockLotesTab
          lotesFiltrados={lotesFiltrados}
          buscarLote={pcModals.buscarLote}
          onBuscarLoteChange={pcModals.setBuscarLote}
          totalUnidadesLotes={totalUnidadesLotes}
          lotesCount={pcsNuevasStock.length}
          tiposEquipoItems={tiposEquipoItems}
          condicionesItems={condicionesItems}
          estadoLabels={estadoLabels}
          onOpenSacarUnidad={pcModals.handleOpenSacarUnidad}
          onOpenEdit={itemForm.handleOpenEdit}
          onUpdateStock={itemForm.handleUpdateStock}
        />
      )}

      {vista === 'stock' && activeTab === 'unidades' && (
        <StockUnidadesTab
          pcsPipeline={pcsPipelineFiltradas}
          buscarUnidad={pcModals.buscarUnidad}
          onBuscarUnidadChange={pcModals.setBuscarUnidad}
          estadoLabels={estadoLabels}
          onOpenEditPc={(pc) => pcModals.handleOpenEditPc(pc)}
          onArmarPc={pcModals.setArmarPc}
          onAsignarPc={pcModals.openAsignarPc}
          onSacarDePipeline={handleSacarDePipeline}
          sacandoUuid={sacandoUuid}
        />
      )}

      {vista === 'stock' && activeTab === 'infraestructura' && (
        <StockInfraTab
          items={itemsInfra}
          estadoLabels={estadoLabels}
          onOpenEdit={itemForm.handleOpenEdit}
          onUpdateStock={itemForm.handleUpdateStock}
          onAsignarUbicacion={pcModals.openAsignarUbicacion}
        />
      )}

      {vista === 'stock' && activeTab === 'celulares' && (
        <StockCelularesTab celularesEnStock={celularesEnStock} />
      )}

      {vista === 'asignaciones' && (
        <StockAsignacionesTab
          lista={lista}
          pcsAsignadas={pcsAsignadas}
          celularesAsignados={celularesAsignados}
          estadoLabels={estadoLabels}
          onRefresh={refreshLista}
          onRefreshCelulares={() => queryClient.invalidateQueries({ queryKey: ['celulares'] })}
          cargandoPcs={cargandoPcs}
          cargandoCelulares={cargandoCelulares}
          errorPcs={errorPcs}
          errorCelulares={errorCelulares}
          onEditar={(fila) => {
            if (fila.origen === 'pc') {
              pcModals.handleOpenEditPc(fila.raw);
              return;
            }
            if (fila.origen === 'celular') {
              setCelularEnEdicion(fila.raw);
              return;
            }
            itemForm.handleOpenEdit(fila.raw);
          }}
        />
      )}

      {celularEnEdicion && (
        <StockCelularesTab
          celularesEnStock={[]}
          editarAlMontar={celularEnEdicion}
          onCerrarEdicion={() => setCelularEnEdicion(null)}
          ocultarListado
        />
      )}

      <EditPcStockModal
        {...editPcStockModalProps(pcModals, { tiposEquipoItems, condicionesItems, ubicCompItems })}
      />
      <EditPcStockModal
        {...nuevaPcStockModalProps(pcModals, { tiposEquipoItems, condicionesItems, ubicCompItems })}
      />

      <StockManualListModals
        itemForm={itemForm}
        comboForm={comboForm}
        pcModals={pcModals}
        tiposStockCatalogo={tiposStockCatalogo}
        tiposEquipoItems={tiposEquipoItems}
        condicionesItems={condicionesItems}
        ubicCompItems={ubicCompItems}
        pcsAsignables={pcsAsignables}
        unidadesFiltradas={unidadesFiltradas}
        setPcsStock={setPcsStock}
        setTodasPcs={setTodasPcs}
      />

      <Outlet />
    </div>
  );
}

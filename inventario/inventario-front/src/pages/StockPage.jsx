import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Warehouse, ArrowLeftRight, Archive } from 'lucide-react';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import DepositoTab from '../components/stock/DepositoTab';
import AsignacionesTab from '../components/stock/AsignacionesTab';
import BajasTab from '../components/stock/BajasTab';
import {
  ModalAlta,
  ModalEditar,
  ModalBaja,
  ModalAsignar,
  ModalDevolver,
} from '../components/stock/StockModals';
import EditPcStockModal from '../components/EditPcStockModal';
import { reactivarUnidadStock } from '../api/stockApi';
import { useStockUnidades, useStockAsignaciones } from '../hooks/useQueries';
import { useCatalogo } from '../hooks/useCatalogo';
import { useEditPcStock } from '../hooks/useEditPcStock';
import { useStockInvalidation } from '../hooks/useStockInvalidation';
import { editPcStockModalProps } from '../utils/editPcStockModalProps';
import { ModuleHeader, TabsCard } from '../components/layout';

const TABS = [
  { id: 'deposito', label: 'Depósito', icon: Warehouse },
  { id: 'asignaciones', label: 'Asignaciones', icon: ArrowLeftRight },
  { id: 'bajas', label: 'Bajas', icon: Archive },
];

export default function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const currentTab = ['asignaciones', 'bajas'].includes(rawTab) ? rawTab : 'deposito';

  const setTab = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  const {
    data: unidades = [],
    isLoading: loadingUnidades,
    isError: isErrorUnidades,
    error: errorUnidades,
  } = useStockUnidades();

  const {
    data: asignaciones = [],
    isLoading: loadingAsignaciones,
    isError: isErrorAsignaciones,
    error: errorAsignaciones,
  } = useStockAsignaciones();

  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');
  const { items: condicionesItems } = useCatalogo('condiciones_equipo');

  const editPcStock = useEditPcStock({
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
  });

  const { invalidarTodo } = useStockInvalidation();

  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);

  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  const PC_TIPOS = ['desktop', 'notebook', 'computadora', 'pc'];
  const esComputadora = (u) =>
    u.coleccion === 'computadoras' || PC_TIPOS.includes((u.tipo || '').toLowerCase());

  const handleEditar = (unidad) => {
    if (esComputadora(unidad)) {
      editPcStock.handleOpenEditPc({ uuid: unidad.id || unidad.codigo });
      return;
    }
    setUnidadSeleccionada(unidad);
    setModalEditarOpen(true);
  };

  const handleAsignar = (unidad) => {
    setUnidadSeleccionada(unidad);
    setModalAsignarOpen(true);
  };

  const handleBaja = (unidad) => {
    setUnidadSeleccionada(unidad);
    setModalBajaOpen(true);
  };

  const handleDevolver = (movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setModalDevolverOpen(true);
  };

  const handleReactivar = async (unidad) => {
    if (!window.confirm(`¿Reactivar ${unidad.codigo || unidad.id} y devolverlo al depósito?`)) return;
    try {
      await reactivarUnidadStock(unidad.codigo || unidad.id);
      await invalidarTodo();
    } catch (err) {
      alert(err.message || 'Error al reactivar la unidad');
    }
  };

  const countDeposito = useMemo(() => {
    return unidades.filter((u) => {
      if ((u.cantidad ?? 1) <= 0) return false;
      const e = (u.estadoDeposito || u.estado || '').toUpperCase();
      return e === 'EN_DEPOSITO' || e === 'DISPONIBLE' || e === 'SIN_ASIGNAR' || e === 'EN_STOCK' || e === 'EN DEPOSITO';
    }).length;
  }, [unidades]);

  const countAsignaciones = useMemo(() => {
    return asignaciones.filter((m) => {
      const estado = (m?.estado || '').trim().toLowerCase();
      if (estado !== 'activa' && estado !== 'activo' && estado !== 'pendiente' && estado !== 'asignado') {
        return false;
      }
      const accion = (m?.accion || '').trim().toLowerCase();
      if (
        accion.includes('baja') ||
        accion.includes('reactiv') ||
        accion.includes('devol') ||
        accion === 'alta' ||
        accion.includes('modific')
      ) {
        return false;
      }
      return true;
    }).length;
  }, [asignaciones]);

  const countBajas = useMemo(() => {
    return unidades.filter((u) => {
      const e = (u.estadoDeposito || u.estado || '').toUpperCase();
      return e.includes('BAJA') || e.includes('RETIR');
    }).length;
  }, [unidades]);

  return (
    <div className="flex flex-col space-y-4 pb-6 w-full">
      {/* Encabezado */}
      <ModuleHeader
        title="Depósito y Asignaciones"
        badge={!loadingUnidades ? `${countDeposito} en depósito` : null}
        description="Control de inventario, stock físico y bitácora de custodia."
        actions={
          currentTab === 'deposito' ? (
            <WriteGate>
              <button
                type="button"
                onClick={() => setModalAltaOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva unidad</span>
              </button>
            </WriteGate>
          ) : null
        }
      />

      {/* Card con solapas y contenido */}
      <TabsCard
        tabs={[
          {
            key: 'deposito',
            label: 'Depósito',
            icon: <Warehouse className="w-4 h-4" />,
            count: !loadingUnidades ? countDeposito : undefined,
          },
          {
            key: 'asignaciones',
            label: 'Asignaciones',
            icon: <ArrowLeftRight className="w-4 h-4" />,
            count: !loadingAsignaciones ? countAsignaciones : undefined,
          },
          {
            key: 'bajas',
            label: 'Bajas',
            icon: <Archive className="w-4 h-4" />,
            count: !loadingUnidades ? countBajas : undefined,
          },
        ]}
        activeTab={currentTab}
        onChange={setTab}
      >

        {/* Contenido de la solapa activa */}
        <div className="p-4">
          {currentTab === 'deposito' && (
            <>
              {loadingUnidades && <StudioLoading message="Cargando unidades del depósito…" />}
              {isErrorUnidades && (
                <StudioError message={errorUnidades?.message || 'Error al cargar unidades del depósito'} />
              )}
              {!loadingUnidades && !isErrorUnidades && (
                <DepositoTab
                  unidades={unidades}
                  onEditar={handleEditar}
                  onAsignar={handleAsignar}
                  onBaja={handleBaja}
                />
              )}
            </>
          )}

          {currentTab === 'asignaciones' && (
            <>
              {loadingAsignaciones && <StudioLoading message="Cargando bitácora de asignaciones…" />}
              {isErrorAsignaciones && (
                <StudioError
                  message={errorAsignaciones?.message || 'Error al cargar asignaciones de stock'}
                />
              )}
              {!loadingAsignaciones && !isErrorAsignaciones && (
                <AsignacionesTab
                  asignaciones={asignaciones}
                  onDevolver={handleDevolver}
                />
              )}
            </>
          )}

          {currentTab === 'bajas' && (
            <>
              {loadingUnidades && <StudioLoading message="Cargando registro de bajas…" />}
              {isErrorUnidades && (
                <StudioError message={errorUnidades?.message || 'Error al cargar unidades'} />
              )}
              {!loadingUnidades && (
                <BajasTab unidades={unidades} asignaciones={asignaciones} onReactivar={handleReactivar} />
              )}
            </>
          )}
        </div>
      </TabsCard>

      <ModalAlta
        open={modalAltaOpen}
        onClose={() => setModalAltaOpen(false)}
      />

      <ModalEditar
        open={modalEditarOpen}
        unidad={unidadSeleccionada}
        onClose={() => {
          setModalEditarOpen(false);
          setUnidadSeleccionada(null);
        }}
      />

      <EditPcStockModal
        {...editPcStockModalProps(editPcStock, { tiposEquipoItems, condicionesItems, ubicCompItems })}
      />

      <ModalBaja
        open={modalBajaOpen}
        unidad={unidadSeleccionada}
        onClose={() => {
          setModalBajaOpen(false);
          setUnidadSeleccionada(null);
        }}
      />

      <ModalAsignar
        open={modalAsignarOpen}
        unidad={unidadSeleccionada}
        onClose={() => {
          setModalAsignarOpen(false);
          setUnidadSeleccionada(null);
        }}
      />

      <ModalDevolver
        open={modalDevolverOpen}
        movimientoOUnidad={movimientoSeleccionado}
        onClose={() => {
          setModalDevolverOpen(false);
          setMovimientoSeleccionado(null);
        }}
      />
    </div>
  );
}

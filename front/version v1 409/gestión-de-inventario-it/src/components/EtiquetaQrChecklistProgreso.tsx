import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Tag, Package, MapPin, CheckCheck, RefreshCw,
  Sparkles, MessageSquare, Copy, Check, Filter, Share2, AlertCircle,
  Clock, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';
import { EtiquetaQrDetalle, MonitorItem, PerifericoItem } from '../api/etiquetaQrApi';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { 
  FichaLogisticaProgreso, 
  ItemProgreso, 
  getProgresoFicha, 
  saveProgresoFicha, 
  calcularResumenProgreso 
} from '../utils/logisticaProgreso';

interface EtiquetaQrChecklistProgresoProps {
  ficha: EtiquetaQrDetalle;
}

type FiltroChecklist = 'todos' | 'pend_etiqueta' | 'pend_embalaje' | 'pend_destino' | 'completos';

export function EtiquetaQrChecklistProgreso({ ficha }: EtiquetaQrChecklistProgresoProps) {
  const esNotebook = (ficha?.tipoEquipo ?? '').toLowerCase().includes('notebook');
  const monitores = ficha?.monitores || [];
  const perifericos = ficha?.perifericos || [];

  // Lista plana de todos los componentes físicos de este puesto
  const itemsPlano = useMemo(() => {
    const list = [
      {
        id: `pc-${ficha.uuid}`,
        tipo: esNotebook ? 'Notebook' : 'Gabinete PC',
        nombre: ficha.hostname,
        detalle: `${ficha.tipoEquipo} · ${labelUbicacionEnum(ficha.ubicacion)}`,
        serial: ficha.uuid,
        esPrincipal: true,
      },
    ];

    monitores.forEach((m, idx) => {
      list.push({
        id: `mon-${idx}-${m.nombre}`,
        tipo: 'Monitor',
        nombre: m.nombre,
        detalle: m.detalle || 'Pantalla externa de puesto',
        serial: m.numeroSerie || '',
        esPrincipal: false,
      });
    });

    perifericos.forEach((p, idx) => {
      list.push({
        id: `perif-${idx}-${p.nombre}`,
        tipo: p.tipo || 'Periférico',
        nombre: p.nombre,
        detalle: p.detalle || 'Accesorio / periférico conectado',
        serial: p.numeroSerie || '',
        esPrincipal: false,
      });
    });

    return list;
  }, [ficha, monitores, perifericos, esNotebook]);

  // Estado cargado desde localStorage o inicial
  const [progreso, setProgreso] = useState<FichaLogisticaProgreso>(() => {
    const guardado = getProgresoFicha(ficha.uuid);
    if (guardado) return guardado;

    // Inicializar con los items
    const itemsInit: Record<string, ItemProgreso> = {};
    itemsPlano.forEach(it => {
      itemsInit[it.id] = {
        id: it.id,
        etiquetado: false,
        embalado: false,
        enDestino: false,
      };
    });

    return {
      uuid: ficha.uuid,
      hostname: ficha.hostname,
      ubicacionOrigen: ficha.ubicacion,
      ultimaModificacion: new Date().toISOString(),
      items: itemsInit,
    };
  });

  const [filtro, setFiltro] = useState<FiltroChecklist>('todos');
  const [copiadoResumen, setCopiadoResumen] = useState(false);
  const [notaModalId, setNotaModalId] = useState<string | null>(null);
  const [textoNota, setTextoNota] = useState('');

  // Asegurar que todos los items actuales existan en el estado
  useEffect(() => {
    setProgreso(prev => {
      let modificado = false;
      const nextItems = { ...prev.items };

      itemsPlano.forEach(it => {
        if (!nextItems[it.id]) {
          nextItems[it.id] = {
            id: it.id,
            etiquetado: false,
            embalado: false,
            enDestino: false,
          };
          modificado = true;
        }
      });

      if (!modificado) return prev;
      const updated = { ...prev, items: nextItems };
      saveProgresoFicha(updated);
      return updated;
    });
  }, [itemsPlano]);

  // Resumen calculado del puesto
  const resumen = useMemo(() => {
    return calcularResumenProgreso(progreso, itemsPlano.length);
  }, [progreso, itemsPlano.length]);

  // Actualizar una fase de un item específico
  const toggleFaseItem = (itemId: string, fase: 'etiquetado' | 'embalado' | 'enDestino') => {
    setProgreso(prev => {
      const itemActual = prev.items[itemId] || {
        id: itemId,
        etiquetado: false,
        embalado: false,
        enDestino: false,
      };

      const nuevoValor = !itemActual[fase];
      const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      const itemActualizado: ItemProgreso = {
        ...itemActual,
        [fase]: nuevoValor,
      };

      if (fase === 'etiquetado') {
        itemActualizado.fechaEtiquetado = nuevoValor ? nowStr : undefined;
      } else if (fase === 'embalado') {
        itemActualizado.fechaEmbalado = nuevoValor ? nowStr : undefined;
        // Si se embala, automáticamente se considera etiquetado si no lo estaba
        if (nuevoValor && !itemActualizado.etiquetado) {
          itemActualizado.etiquetado = true;
          itemActualizado.fechaEtiquetado = itemActualizado.fechaEtiquetado || nowStr;
        }
      } else if (fase === 'enDestino') {
        itemActualizado.fechaEnDestino = nuevoValor ? nowStr : undefined;
        // Si ya está en destino, automáticamente se valida como etiquetado y embalado
        if (nuevoValor) {
          if (!itemActualizado.etiquetado) {
            itemActualizado.etiquetado = true;
            itemActualizado.fechaEtiquetado = itemActualizado.fechaEtiquetado || nowStr;
          }
          if (!itemActualizado.embalado) {
            itemActualizado.embalado = true;
            itemActualizado.fechaEmbalado = itemActualizado.fechaEmbalado || nowStr;
          }
        }
      }

      const updated: FichaLogisticaProgreso = {
        ...prev,
        items: {
          ...prev.items,
          [itemId]: itemActualizado,
        },
      };

      saveProgresoFicha(updated);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }

      return updated;
    });
  };

  // Marcar toda la fase para todos los items
  const marcarFaseTodos = (fase: 'etiquetado' | 'embalado' | 'enDestino', valor: boolean) => {
    const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    setProgreso(prev => {
      const nextItems: Record<string, ItemProgreso> = {};

      itemsPlano.forEach(it => {
        const itemActual = prev.items[it.id] || {
          id: it.id,
          etiquetado: false,
          embalado: false,
          enDestino: false,
        };

        const itemUpdated = { ...itemActual };
        itemUpdated[fase] = valor;

        if (fase === 'etiquetado') {
          itemUpdated.fechaEtiquetado = valor ? nowStr : undefined;
        } else if (fase === 'embalado') {
          itemUpdated.fechaEmbalado = valor ? nowStr : undefined;
          if (valor) {
            itemUpdated.etiquetado = true;
            itemUpdated.fechaEtiquetado = itemUpdated.fechaEtiquetado || nowStr;
          }
        } else if (fase === 'enDestino') {
          itemUpdated.fechaEnDestino = valor ? nowStr : undefined;
          if (valor) {
            itemUpdated.etiquetado = true;
            itemUpdated.embalado = true;
            itemUpdated.fechaEtiquetado = itemUpdated.fechaEtiquetado || nowStr;
            itemUpdated.fechaEmbalado = itemUpdated.fechaEmbalado || nowStr;
          }
        }

        nextItems[it.id] = itemUpdated;
      });

      const updated: FichaLogisticaProgreso = {
        ...prev,
        items: nextItems,
      };

      saveProgresoFicha(updated);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }

      return updated;
    });
  };

  // Restablecer todo el checklist
  const handleReiniciarTodo = () => {
    if (!confirm('¿Deseas reiniciar todas las marcas de progreso (Etiquetado, Embalado y Destino) para este puesto?')) {
      return;
    }
    const nextItems: Record<string, ItemProgreso> = {};
    itemsPlano.forEach(it => {
      nextItems[it.id] = {
        id: it.id,
        etiquetado: false,
        embalado: false,
        enDestino: false,
      };
    });

    const updated: FichaLogisticaProgreso = {
      ...progreso,
      items: nextItems,
    };
    saveProgresoFicha(updated);
    setProgreso(updated);
  };

  // Guardar nota en un item
  const guardarNotaItem = (itemId: string, nota: string) => {
    setProgreso(prev => {
      const itemActual = prev.items[itemId] || { id: itemId, etiquetado: false, embalado: false, enDestino: false };
      const updated: FichaLogisticaProgreso = {
        ...prev,
        items: {
          ...prev.items,
          [itemId]: {
            ...itemActual,
            notas: nota.trim() || undefined,
          },
        },
      };
      saveProgresoFicha(updated);
      return updated;
    });
    setNotaModalId(null);
  };

  // Generar reporte de texto para WhatsApp o Clipboard
  const generarTextoResumen = () => {
    const ubicacion = labelUbicacionEnum(ficha.ubicacion);
    let texto = `📋 *CONTROL DE TRASLADO IT - BACAR*\n`;
    texto += `🖥️ *Equipo:* ${ficha.hostname} (${ficha.tipoEquipo})\n`;
    texto += `📍 *Ubicación:* ${ubicacion}\n`;
    texto += `👤 *Usuario:* ${ficha.usuarioActual || 'SYSTEM'}\n\n`;
    texto += `📊 *ESTADO GLOBAL: ${resumen.etiquetaEstado} (${resumen.porcentajeGlobal}%)*\n`;
    texto += `🏷️ Etiquetado: ${resumen.cantEtiquetados}/${resumen.totalItems} (${resumen.porcentajeEtiquetado}%)\n`;
    texto += `📦 Embalado: ${resumen.cantEmbalados}/${resumen.totalItems} (${resumen.porcentajeEmbalado}%)\n`;
    texto += `📍 Listo en Destino: ${resumen.cantEnDestino}/${resumen.totalItems} (${resumen.porcentajeEnDestino}%)\n\n`;
    texto += `*DETALLE POR ELEMENTO:*\n`;

    itemsPlano.forEach(it => {
      const st = progreso.items[it.id] || { etiquetado: false, embalado: false, enDestino: false };
      let estadoTxt = '⏳ Pendiente';
      if (st.enDestino) estadoTxt = '📍 Listo en Destino ✓';
      else if (st.embalado) estadoTxt = '📦 Embalado';
      else if (st.etiquetado) estadoTxt = '🏷️ Etiquetado';

      texto += `• *${it.nombre}* (${it.tipo}): [${estadoTxt}]${st.notas ? ` - Nota: ${st.notas}` : ''}\n`;
    });

    return texto;
  };

  const handleCopiarResumen = () => {
    const texto = generarTextoResumen();
    navigator.clipboard.writeText(texto);
    setCopiadoResumen(true);
    setTimeout(() => setCopiadoResumen(false), 2500);
  };

  const handleCompartirWhatsApp = () => {
    const texto = generarTextoResumen();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Filtrar items según pestaña seleccionada
  const itemsFiltrados = useMemo(() => {
    return itemsPlano.filter(it => {
      const st = progreso.items[it.id] || { etiquetado: false, embalado: false, enDestino: false };
      if (filtro === 'pend_etiqueta') return !st.etiquetado;
      if (filtro === 'pend_embalaje') return !st.embalado;
      if (filtro === 'pend_destino') return !st.enDestino;
      if (filtro === 'completos') return st.enDestino;
      return true;
    });
  }, [itemsPlano, progreso.items, filtro]);

  return (
    <div className="space-y-6">

      {/* 1. DASHBOARD DE PROGRESO DE 3 FASES */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 border border-slate-800">
        
        {/* Encabezado del Puesto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono">
                Logística & Checklist de Traslado
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control en tiempo real de Etiquetado QR, Embalaje protegido y Montaje en destino.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${resumen.colorBadge}`}>
              {resumen.etiquetaEstado}
            </span>
            <span className="font-mono text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {resumen.porcentajeGlobal}% Global
            </span>
          </div>
        </div>

        {/* Las 3 Fases en Cards Interactivas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* FASE 1: ETIQUETADO */}
          <div className={`p-4 rounded-xl border transition-all ${
            resumen.porcentajeEtiquetado === 100
              ? 'bg-blue-950/50 border-blue-600/60 shadow-xs'
              : resumen.porcentajeEtiquetado > 0
              ? 'bg-slate-800/80 border-blue-500/30'
              : 'bg-slate-800/40 border-slate-700/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${resumen.porcentajeEtiquetado === 100 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-blue-400'}`}>
                  <Tag className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">1. Etiquetado QR</span>
              </div>
              <span className="font-mono text-xs font-bold text-blue-400">
                {resumen.cantEtiquetados} / {resumen.totalItems} ({resumen.porcentajeEtiquetado}%)
              </span>
            </div>

            {/* Barra de fase 1 */}
            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${resumen.porcentajeEtiquetado}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {resumen.porcentajeEtiquetado === 100 ? '✓ Stickers pegados' : 'Stickers térmicos'}
              </span>
              <button
                type="button"
                onClick={() => marcarFaseTodos('etiquetado', resumen.porcentajeEtiquetado !== 100)}
                className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
              >
                {resumen.porcentajeEtiquetado === 100 ? 'Desmarcar' : 'Marcar todo'}
              </button>
            </div>
          </div>

          {/* FASE 2: EMBALADO */}
          <div className={`p-4 rounded-xl border transition-all ${
            resumen.porcentajeEmbalado === 100
              ? 'bg-amber-950/50 border-amber-500/60 shadow-xs'
              : resumen.porcentajeEmbalado > 0
              ? 'bg-slate-800/80 border-amber-500/30'
              : 'bg-slate-800/40 border-slate-700/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${resumen.porcentajeEmbalado === 100 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-amber-400'}`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">2. Embalado</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">
                {resumen.cantEmbalados} / {resumen.totalItems} ({resumen.porcentajeEmbalado}%)
              </span>
            </div>

            {/* Barra de fase 2 */}
            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${resumen.porcentajeEmbalado}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {resumen.porcentajeEmbalado === 100 ? '✓ Desconectado y en caja' : 'Cables y protección'}
              </span>
              <button
                type="button"
                onClick={() => marcarFaseTodos('embalado', resumen.porcentajeEmbalado !== 100)}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                {resumen.porcentajeEmbalado === 100 ? 'Desmarcar' : 'Marcar todo'}
              </button>
            </div>
          </div>

          {/* FASE 3: LISTO EN DESTINO */}
          <div className={`p-4 rounded-xl border transition-all ${
            resumen.porcentajeEnDestino === 100
              ? 'bg-emerald-950/50 border-emerald-500/60 shadow-xs'
              : resumen.porcentajeEnDestino > 0
              ? 'bg-slate-800/80 border-emerald-500/30'
              : 'bg-slate-800/40 border-slate-700/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${resumen.porcentajeEnDestino === 100 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-emerald-400'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">3. Listo en Destino</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {resumen.cantEnDestino} / {resumen.totalItems} ({resumen.porcentajeEnDestino}%)
              </span>
            </div>

            {/* Barra de fase 3 */}
            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${resumen.porcentajeEnDestino}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {resumen.porcentajeEnDestino === 100 ? '✓ Montado y verificado' : 'Montaje en destino'}
              </span>
              <button
                type="button"
                onClick={() => marcarFaseTodos('enDestino', resumen.porcentajeEnDestino !== 100)}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                {resumen.porcentajeEnDestino === 100 ? 'Desmarcar' : 'Marcar todo'}
              </button>
            </div>
          </div>

        </div>

        {/* Barra de Acciones Globales y Compartir */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarResumen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all cursor-pointer border border-slate-700"
            >
              {copiadoResumen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiadoResumen ? '¡Copiado!' : 'Copiar Resumen'}</span>
            </button>

            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReiniciarTodo}
            className="text-slate-400 hover:text-rose-400 underline text-[11px] cursor-pointer"
          >
            Restablecer checklist
          </button>
        </div>

      </div>

      {/* 2. FILTROS RÁPIDOS POR ESTADO */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filtro === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({itemsPlano.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltro('pend_etiqueta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filtro === 'pend_etiqueta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            🏷️ Falta Etiquetar ({itemsPlano.length - resumen.cantEtiquetados})
          </button>

          <button
            type="button"
            onClick={() => setFiltro('pend_embalaje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filtro === 'pend_embalaje'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            📦 Falta Embalar ({itemsPlano.length - resumen.cantEmbalados})
          </button>

          <button
            type="button"
            onClick={() => setFiltro('pend_destino')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filtro === 'pend_destino'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            📍 Falta en Destino ({itemsPlano.length - resumen.cantEnDestino})
          </button>

          <button
            type="button"
            onClick={() => setFiltro('completos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filtro === 'completos'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
          >
            ✓ 100% Listos ({resumen.cantEnDestino})
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Mostrando {itemsFiltrados.length} de {itemsPlano.length} elementos
        </span>
      </div>

      {/* 3. LISTA DE ELEMENTOS CON CONTROLES DE LAS 3 FASES */}
      <div className="space-y-3">
        {itemsFiltrados.length === 0 ? (
          <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
            <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No hay elementos en esta vista de filtro.</p>
            <button
              type="button"
              onClick={() => setFiltro('todos')}
              className="text-xs text-blue-600 underline font-medium cursor-pointer"
            >
              Ver todos los elementos
            </button>
          </div>
        ) : (
          itemsFiltrados.map((it) => {
            const st = progreso.items[it.id] || {
              id: it.id,
              etiquetado: false,
              embalado: false,
              enDestino: false,
            };

            const esta100Completo = st.etiquetado && st.embalado && st.enDestino;

            return (
              <div
                key={it.id}
                className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs space-y-3.5 ${
                  esta100Completo
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : st.embalado
                    ? 'border-amber-200 bg-amber-50/20'
                    : st.etiquetado
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Cabecera del Item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
                      esta100Completo
                        ? 'bg-emerald-600 text-white'
                        : st.embalado
                        ? 'bg-amber-500 text-white'
                        : st.etiquetado
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {esta100Completo ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {it.tipo}
                        </span>
                        {it.esPrincipal && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Unidad Central
                          </span>
                        )}
                        {esta100Completo && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> 100% En Destino
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 mt-1 truncate">
                        {it.nombre}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {it.detalle}
                      </p>
                      {it.serial && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          S/N: {it.serial}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón para notas */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {st.notas && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg max-w-[200px] truncate" title={st.notas}>
                        📝 {st.notas}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setNotaModalId(it.id);
                        setTextoNota(st.notas || '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Agregar o editar nota para este elemento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* LOS 3 BOTONES DE ESTADO INTERACTIVOS (TOUCH TARGET 44px+) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                  
                  {/* Botón 1: Etiquetado */}
                  <button
                    type="button"
                    onClick={() => toggleFaseItem(it.id, 'etiquetado')}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer select-none ${
                      st.etiquetado
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${st.etiquetado ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">1. Etiquetado</span>
                        <span className="text-[10px] text-slate-500 block">
                          {st.etiquetado ? (st.fechaEtiquetado ? `✓ Pegado (${st.fechaEtiquetado})` : '✓ Sticker pegado') : 'Pendiente sticker'}
                        </span>
                      </div>
                    </div>
                    {st.etiquetado ? (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </button>

                  {/* Botón 2: Embalado */}
                  <button
                    type="button"
                    onClick={() => toggleFaseItem(it.id, 'embalado')}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer select-none ${
                      st.embalado
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${st.embalado ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">2. Embalado</span>
                        <span className="text-[10px] text-slate-500 block">
                          {st.embalado ? (st.fechaEmbalado ? `✓ Guardado (${st.fechaEmbalado})` : '✓ En caja/film') : 'Pendiente embalar'}
                        </span>
                      </div>
                    </div>
                    {st.embalado ? (
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </button>

                  {/* Botón 3: Listo en Destino */}
                  <button
                    type="button"
                    onClick={() => toggleFaseItem(it.id, 'enDestino')}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer select-none ${
                      st.enDestino
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${st.enDestino ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">3. En Destino</span>
                        <span className="text-[10px] text-slate-500 block">
                          {st.enDestino ? (st.fechaEnDestino ? `✓ Operativo (${st.fechaEnDestino})` : '✓ Montado en puesto') : 'Pendiente recibir'}
                        </span>
                      </div>
                    </div>
                    {st.enDestino ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL / DIALOG PARA AGREGAR NOTAS A UN ITEM */}
      {notaModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              Nota de Logística / Traslado
            </h3>
            <p className="text-xs text-slate-500">
              Registra detalles como número de caja, accesorios faltantes o responsable de entrega.
            </p>
            <input
              type="text"
              value={textoNota}
              onChange={e => setTextoNota(e.target.value)}
              placeholder="Ej: Embalado en Caja N° 4 / Falta cable de alimentación"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') guardarNotaItem(notaModalId, textoNota);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotaModalId(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => guardarNotaItem(notaModalId, textoNota)}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { filasDesdeMapa } from './reporteInventario';

const MARGIN = 14;
const PAGE_W = 210;

function fmtFecha(d) {
  return d.toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function addTitulo(doc, y, texto) {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(texto, MARGIN, y);
  return y + 6;
}

function addTabla(doc, autoTable, startY, head, body) {
  if (!body.length) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Sin datos.', MARGIN, startY + 4);
    return startY + 10;
  }
  autoTable(doc, {
    startY,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [12, 102, 228], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  return doc.lastAutoTable.finalY + 8;
}

function paginarSiNecesario(doc, y, umbral = 250) {
  if (y > umbral) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

/**
 * Genera y descarga el PDF del reporte de inventario.
 * Carga jsPDF bajo demanda para no inflar el bundle inicial.
 * @param {ReturnType<import('./reporteInventario').construirReporteInventario>} reporte
 */
export async function exportarReportePdf(reporte) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Reporte de Inventario IT', MARGIN, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado: ${fmtFecha(reporte.generadoEn)}`, MARGIN, y);
  doc.text('Bacarsa — Inventario IT', PAGE_W - MARGIN, y, { align: 'right' });
  y += 10;

  y = addTitulo(doc, y, 'Resumen — Computadoras');
  y = addTabla(doc, autoTable, y, ['Concepto', 'Cantidad'], [
    ['Total (agente + stock manual)', String(reporte.computadoras.total)],
    ['Registradas por agente', String(reporte.computadoras.registradas)],
    ['Stock manual (tipo computadora)', String(reporte.computadoras.stockManualComputadorasTotal)],
    ['Activas (sync reciente)', String(reporte.computadoras.activas)],
    ['Inactivas (sin sync reciente)', String(reporte.computadoras.inactivas)],
    ['Notebooks', String(reporte.computadoras.notebook)],
    ['PC (escritorio)', String(reporte.computadoras.desktop)],
    ['Asignadas', String(reporte.computadoras.asignadas)],
    ['En stock', String(reporte.computadoras.enStock)],
    ['  — registradas sin asignar', String(reporte.computadoras.enStockRegistradas)],
    ['  — stock manual computadora', String(reporte.computadoras.stockManualComputadoras)],
    ['En mantenimiento', String(reporte.computadoras.enMantenimiento)],
    ['Baja', String(reporte.computadoras.baja)],
  ]);

  y = paginarSiNecesario(doc, y);
  y = addTitulo(doc, y, 'Computadoras por área');
  y = addTabla(doc, autoTable, y, ['Área', 'Cantidad'], filasDesdeMapa(reporte.computadoras.porArea));

  y = paginarSiNecesario(doc, y, 240);
  y = addTitulo(doc, y, 'Computadoras por arquitectura');
  y = addTabla(doc, autoTable, y, ['Arquitectura', 'Cantidad'], filasDesdeMapa(reporte.computadoras.porArquitectura));

  y = paginarSiNecesario(doc, y, 240);
  y = addTitulo(doc, y, 'Computadoras por procesador');
  y = addTabla(doc, autoTable, y, ['Procesador', 'Cantidad'], filasDesdeMapa(reporte.computadoras.porProcesador));

  y = paginarSiNecesario(doc, y, 230);
  y = addTitulo(doc, y, 'Periféricos');
  y = addTabla(doc, autoTable, y, ['Concepto', 'Cantidad'], [
    ['Con PC (detectados por agente)', String(reporte.perifericos.conPcAgente)],
    ['En stock manual', String(reporte.perifericos.stockManual)],
    ['Asignados (stock manual)', String(reporte.perifericos.asignadosManual)],
  ]);

  y = addTitulo(doc, y, 'Periféricos con PC — por tipo');
  y = addTabla(doc, autoTable, y, ['Tipo', 'Cantidad'], filasDesdeMapa(reporte.perifericos.porTipoAgente));

  y = paginarSiNecesario(doc, y, 230);
  y = addTitulo(doc, y, 'Infraestructura');
  y = addTabla(doc, autoTable, y, ['Concepto', 'Cantidad'], [
    ['NVR', String(reporte.infraestructura.totalNvrs)],
    ['Cámaras', String(reporte.infraestructura.totalCamaras)],
    ['Routers', String(reporte.infraestructura.totalRouters)],
    ['Switches', String(reporte.infraestructura.totalSwitches)],
    ['Access Points', String(reporte.infraestructura.totalAccessPoints)],
  ]);

  y = addTitulo(doc, y, 'Cámaras por NVR');
  y = addTabla(doc, autoTable, y, ['NVR', 'Cámaras'], filasDesdeMapa(reporte.infraestructura.camarasPorNvr));

  y = paginarSiNecesario(doc, y, 240);
  y = addTitulo(doc, y, 'Routers y Switches — por cantidad');
  y = addTabla(doc, autoTable, y, ['Tipo', 'Cantidad'], filasDesdeMapa(reporte.infraestructura.routersSwitchesPorTipo));

  if (reporte.tesoreria?.total > 0) {
    y = paginarSiNecesario(doc, y, 230);
    y = addTitulo(doc, y, 'Máquinas de tesorería');
    y = addTabla(doc, autoTable, y, ['Concepto', 'Cantidad'], [
      ['Total', String(reporte.tesoreria.total)],
      ...filasDesdeMapa(reporte.tesoreria.porTipo),
    ]);
  }

  const detalleMaquinas = reporte.tesoreria?.detalle ?? [];
  if (detalleMaquinas.length) {
    y = paginarSiNecesario(doc, y, 240);
    y = addTitulo(doc, y, 'Detalle máquinas de tesorería');
    y = addTabla(
      doc,
      autoTable,
      y,
      ['Tipo', 'Modelo', 'N° serie', 'Estado', 'Vida'],
      detalleMaquinas.map(m => [m.tipo, m.modelo, m.nroSerie, m.estado, String(m.vida)]),
    );
  }

  const detalle = reporte.computadoras.detalle ?? [];
  if (detalle.length) {
    doc.addPage();
    y = MARGIN;
    y = addTitulo(doc, y, 'Detalle de computadoras');
    y = addTabla(
      doc,
      autoTable,
      y,
      ['Hostname', 'Tipo', 'Estado', 'Sync', 'Área', 'Procesador'],
      detalle.map(d => [
        d.hostname,
        d.tipo,
        d.estado,
        d.sync,
        d.area,
        d.procesador.length > 40 ? `${d.procesador.slice(0, 37)}…` : d.procesador,
      ]),
    );
  }

  const stamp = reporte.generadoEn.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
  doc.save(`reporte-inventario-${stamp}.pdf`);
}

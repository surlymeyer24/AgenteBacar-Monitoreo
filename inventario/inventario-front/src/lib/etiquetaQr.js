export function urlFichaEtiqueta(uuid) {
  const origin = window.location.origin;
  return `${origin}/etiquetas-qr/${encodeURIComponent(uuid)}`;
}

/** Rollo típico de 4" para la Xprinter 410B (ancho máximo de impresión ~104 mm). */
export const ETIQUETA_TERMICA = { anchoMm: 100, altoMm: 50 };

export async function generarQrDataUrl(texto) {
  const { default: QRCode } = await import('qrcode');
  return QRCode.toDataURL(texto, {
    margin: 1,
    width: 512,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/**
 * Imprime en un iframe oculto del mismo origen: `window.open` con `noopener`
 * devuelve null y los bloqueadores de popups impiden la ventana aparte.
 */
export function imprimirEtiquetas(etiquetas) {
  if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
    return Promise.reject(new Error('No hay etiquetas para imprimir.'));
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Impresión de etiquetas');
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${ETIQUETA_TERMICA.anchoMm}mm;height:${ETIQUETA_TERMICA.altoMm}mm;border:0;`;

    let terminado = false;
    function limpiar() {
      if (terminado) return;
      terminado = true;
      window.setTimeout(() => iframe.remove(), 500);
    }

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = win?.document;
      if (!doc) {
        limpiar();
        reject(new Error('No se pudo preparar la impresión.'));
        return;
      }
      esperarImagenes(doc)
        .then(() => {
          win.addEventListener('afterprint', limpiar, { once: true });
          win.focus();
          win.print();
          window.setTimeout(limpiar, 60000);
          resolve();
        })
        .catch(err => {
          limpiar();
          reject(err);
        });
    };

    iframe.srcdoc = htmlEtiquetas(etiquetas);
    document.body.appendChild(iframe);
  });
}

function esperarImagenes(doc) {
  const imgs = Array.from(doc.images ?? []);
  return Promise.all(
    imgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise(res => {
            img.addEventListener('load', res, { once: true });
            img.addEventListener('error', res, { once: true });
          }),
    ),
  );
}

function htmlEtiquetas(etiquetas) {
  const { anchoMm, altoMm } = ETIQUETA_TERMICA;
  const filas = etiquetas
    .map(
      e => `
      <article class="label">
        <img src="${e.qrDataUrl}" alt="QR ${escapeHtml(e.hostname || '')}" />
        <div class="meta">
          <p class="host">${escapeHtml(e.hostname || 'Sin hostname')}</p>
          <p class="loc">${escapeHtml(e.ubicacionLabel || 'Sin ubicación')}</p>
        </div>
      </article>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas QR</title>
  <style>
    @page { size: ${anchoMm}mm ${altoMm}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label {
      width: ${anchoMm}mm;
      height: ${altoMm}mm;
      padding: 3mm 4mm;
      display: flex;
      align-items: center;
      gap: 4mm;
      page-break-after: always;
      break-after: page;
    }
    .label:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    img {
      width: 38mm;
      height: 38mm;
      flex-shrink: 0;
    }
    .meta { min-width: 0; flex: 1; }
    .host {
      font-family: Consolas, "Courier New", monospace;
      font-size: 16pt;
      font-weight: 700;
      margin: 0 0 2mm;
      line-height: 1.15;
      word-break: break-all;
    }
    .loc {
      margin: 0;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #000;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${filas}
</body>
</html>`;
}

/**
 * Imprime una etiqueta por cada monitor.
 * @param {{ qrDataUrl: string, hostname: string, ubicacionLabel: string, modelo: string, serial: string }[]} monitores
 */
export function imprimirEtiquetasMonitor(monitores) {
  if (!Array.isArray(monitores) || monitores.length === 0) {
    return Promise.reject(new Error('No hay monitores para imprimir.'));
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Impresión de etiquetas de monitores');
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${ETIQUETA_TERMICA.anchoMm}mm;height:${ETIQUETA_TERMICA.altoMm}mm;border:0;`;

    let terminado = false;
    function limpiar() {
      if (terminado) return;
      terminado = true;
      window.setTimeout(() => iframe.remove(), 500);
    }

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = win?.document;
      if (!doc) {
        limpiar();
        reject(new Error('No se pudo preparar la impresión.'));
        return;
      }
      esperarImagenes(doc)
        .then(() => {
          win.addEventListener('afterprint', limpiar, { once: true });
          win.focus();
          win.print();
          window.setTimeout(limpiar, 60000);
          resolve();
        })
        .catch(err => {
          limpiar();
          reject(err);
        });
    };

    iframe.srcdoc = htmlEtiquetasMonitor(monitores);
    document.body.appendChild(iframe);
  });
}

function htmlEtiquetasMonitor(monitores) {
  const { anchoMm, altoMm } = ETIQUETA_TERMICA;
  const filas = monitores
    .map(
      m => `
      <article class="label">
        <img src="${m.qrDataUrl}" alt="QR ${escapeHtml(m.hostname || '')}" />
        <div class="meta">
          <p class="modelo">${escapeHtml(m.modelo || 'Monitor')}</p>
          ${m.serial ? `<p class="serial">S/N: ${escapeHtml(m.serial)}</p>` : ''}
          <p class="host">${escapeHtml(m.hostname || 'Sin hostname')}</p>
          <p class="loc">${escapeHtml(m.ubicacionLabel || 'Sin ubicación')}</p>
        </div>
      </article>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas de monitores</title>
  <style>
    @page { size: ${anchoMm}mm ${altoMm}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label {
      width: ${anchoMm}mm;
      height: ${altoMm}mm;
      padding: 3mm 4mm;
      display: flex;
      align-items: center;
      gap: 4mm;
      page-break-after: always;
      break-after: page;
    }
    .label:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    img {
      width: 34mm;
      height: 34mm;
      flex-shrink: 0;
    }
    .meta { min-width: 0; flex: 1; }
    .modelo {
      font-family: Consolas, "Courier New", monospace;
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 1mm;
      line-height: 1.15;
      word-break: break-all;
    }
    .serial {
      margin: 0 0 2mm;
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      font-weight: 700;
      color: #333;
    }
    .host {
      margin: 0;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .loc {
      margin: 0.5mm 0 0;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #444;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${filas}
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import QRCode from 'qrcode';

export interface EtiquetaPcData {
  qrDataUrl: string;
  hostname: string;
  usuarioActual?: string;
  ubicacionLabel: string;
}

export interface EtiquetaMonitorData {
  qrDataUrl: string;
  hostname: string;
  ubicacionLabel: string;
  modelo: string;
  serial?: string;
}

/**
 * Genera la URL completa de la ficha que viaja dentro del código QR
 */
export function urlFichaEtiqueta(uuid: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bacarsa.com.ar';
  return `${origin}/etiquetas-qr/${encodeURIComponent(uuid)}`;
}

/**
 * Genera un DataURL del código QR en alta definición (512px) con corrección de error alta
 */
export async function generarQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 512,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Imprime etiquetas usando un iframe invisible con soporte para @page 100mm 50mm
 */
function imprimirHtmlEnIframe(htmlContent: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      let timeoutId: number;

      const limpiarIframe = () => {
        if (timeoutId) clearTimeout(timeoutId);
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 500);
      };

      // Limpieza de respaldo a los 60 segundos
      timeoutId = window.setTimeout(() => {
        limpiarIframe();
        resolve();
      }, 60000);

      iframe.srcdoc = htmlContent;

      iframe.onload = () => {
        const win = iframe.contentWindow;
        if (!win) {
          limpiarIframe();
          reject(new Error('No se pudo acceder al marco de impresión.'));
          return;
        }

        const doc = win.document;
        const images = Array.from(doc.images);
        const imagePromises = images.map(
          img =>
            new Promise<void>(imgResolve => {
              if (img.complete) {
                imgResolve();
              } else {
                img.onload = () => imgResolve();
                img.onerror = () => imgResolve();
              }
            })
        );

        Promise.all(imagePromises).then(() => {
          win.addEventListener('afterprint', () => {
            limpiarIframe();
            resolve();
          });

          setTimeout(() => {
            try {
              win.focus();
              win.print();
            } catch (err) {
              limpiarIframe();
              reject(err);
            }
          }, 300);
        });
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Imprime lote de etiquetas de PC en stickers térmicos de 100x50 mm
 */
export async function imprimirEtiquetas(etiquetas: EtiquetaPcData[]): Promise<void> {
  if (!etiquetas.length) return;

  const etiquetasHtml = etiquetas
    .map(
      e => `
    <div class="label-page">
      <div class="label-container">
        <div class="qr-column">
          <img src="${e.qrDataUrl}" alt="QR" class="qr-image" />
        </div>
        <div class="info-column">
          <div class="brand-tag">BACAR IT · MUDANZA</div>
          <div class="hostname-text">${escapeHtml(e.hostname || 'PC-STATION')}</div>
          <div class="divider"></div>
          <div class="ubicacion-text">${escapeHtml(e.ubicacionLabel || 'SIN UBICACIÓN')}</div>
          ${
            e.usuarioActual
              ? `<div class="user-text">ASIGNADO: ${escapeHtml(e.usuarioActual)}</div>`
              : `<div class="user-text">EQUIPO DE ESTACIÓN</div>`
          }
          <div class="scan-note">Escanear para ver periféricos que viajan</div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Etiquetas QR - Bacar IT</title>
      <style>
        @page {
          size: 100mm 50mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #000000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .label-page {
          width: 100mm;
          height: 50mm;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4mm 6mm;
          overflow: hidden;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .label-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 5mm;
        }
        .qr-column {
          width: 38mm;
          height: 38mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-image {
          width: 38mm;
          height: 38mm;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .info-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .brand-tag {
          font-size: 7.5pt;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #000000;
          margin-bottom: 1.5mm;
        }
        .hostname-text {
          font-family: Consolas, 'Courier New', Courier, monospace;
          font-size: 16pt;
          font-weight: 900;
          line-height: 1.1;
          color: #000000;
          word-break: break-all;
        }
        .divider {
          width: 100%;
          height: 0.5mm;
          background: #000000;
          margin: 1.8mm 0;
        }
        .ubicacion-text {
          font-size: 9pt;
          font-weight: 800;
          text-transform: uppercase;
          line-height: 1.2;
          color: #000000;
        }
        .user-text {
          font-size: 8pt;
          font-weight: 600;
          color: #000000;
          margin-top: 1mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .scan-note {
          font-size: 6.5pt;
          color: #333333;
          margin-top: 1.5mm;
        }
      </style>
    </head>
    <body>
      ${etiquetasHtml}
    </body>
    </html>
  `;

  return imprimirHtmlEnIframe(fullHtml);
}

/**
 * Imprime lote de etiquetas de Monitor en stickers térmicos de 100x50 mm
 */
export async function imprimirEtiquetasMonitor(etiquetas: EtiquetaMonitorData[]): Promise<void> {
  if (!etiquetas.length) return;

  const etiquetasHtml = etiquetas
    .map(
      e => `
    <div class="label-page">
      <div class="label-container">
        <div class="qr-column">
          <img src="${e.qrDataUrl}" alt="QR" class="qr-image" />
        </div>
        <div class="info-column">
          <div class="brand-tag">BACAR IT · MONITOR DE ESTACIÓN</div>
          <div class="modelo-text">${escapeHtml(e.modelo || 'MONITOR')}</div>
          ${
            e.serial
              ? `<div class="serial-text">S/N: ${escapeHtml(e.serial)}</div>`
              : ''
          }
          <div class="divider"></div>
          <div class="station-text">PC: ${escapeHtml(e.hostname || '—')} · ${escapeHtml(e.ubicacionLabel || '')}</div>
          <div class="scan-note">El QR abre la ficha completa de la estación</div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Etiquetas Monitores - Bacar IT</title>
      <style>
        @page {
          size: 100mm 50mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #000000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .label-page {
          width: 100mm;
          height: 50mm;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4mm 6mm;
          overflow: hidden;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .label-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 5mm;
        }
        .qr-column {
          width: 34mm;
          height: 34mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-image {
          width: 34mm;
          height: 34mm;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .info-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .brand-tag {
          font-size: 7pt;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #000000;
          margin-bottom: 1mm;
        }
        .modelo-text {
          font-family: Consolas, 'Courier New', Courier, monospace;
          font-size: 14pt;
          font-weight: 900;
          line-height: 1.1;
          color: #000000;
          word-break: break-word;
        }
        .serial-text {
          font-size: 9pt;
          font-weight: 700;
          font-family: Consolas, monospace;
          color: #000000;
          margin-top: 1mm;
        }
        .divider {
          width: 100%;
          height: 0.5mm;
          background: #000000;
          margin: 1.5mm 0;
        }
        .station-text {
          font-size: 8pt;
          font-weight: 800;
          text-transform: uppercase;
          line-height: 1.2;
          color: #000000;
        }
        .scan-note {
          font-size: 6.5pt;
          color: #333333;
          margin-top: 1mm;
        }
      </style>
    </head>
    <body>
      ${etiquetasHtml}
    </body>
    </html>
  `;

  return imprimirHtmlEnIframe(fullHtml);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/qrcode-CFMkjprk.js","assets/rolldown-runtime-COnpUsM8.js"])))=>i.map(i=>d[i]);
import{a as e}from"./rolldown-runtime-COnpUsM8.js";import{i as t}from"./pdf-BqaHZqUb.js";function n(e){return`${window.location.origin}/etiquetas-qr/${encodeURIComponent(e)}`}var r={anchoMm:100,altoMm:50};async function i(n){let{default:r}=await t(async()=>{let{default:t}=await import(`./qrcode-CFMkjprk.js`).then(t=>e(t.t(),1));return{default:t}},__vite__mapDeps([0,1]));return r.toDataURL(n,{margin:1,width:512,errorCorrectionLevel:`H`,color:{dark:`#000000`,light:`#ffffff`}})}function a(e){return!Array.isArray(e)||e.length===0?Promise.reject(Error(`No hay etiquetas para imprimir.`)):new Promise((t,n)=>{let i=document.createElement(`iframe`);i.setAttribute(`aria-hidden`,`true`),i.setAttribute(`title`,`Impresión de etiquetas`),i.style.cssText=`position:fixed;left:-10000px;top:0;width:${r.anchoMm}mm;height:${r.altoMm}mm;border:0;`;let a=!1;function c(){a||(a=!0,window.setTimeout(()=>i.remove(),500))}i.onload=()=>{let e=i.contentWindow,r=e?.document;if(!r){c(),n(Error(`No se pudo preparar la impresión.`));return}o(r).then(()=>{e.addEventListener(`afterprint`,c,{once:!0}),e.focus(),e.print(),window.setTimeout(c,6e4),t()}).catch(e=>{c(),n(e)})},i.srcdoc=s(e),document.body.appendChild(i)})}function o(e){let t=Array.from(e.images??[]);return Promise.all(t.map(e=>e.complete?Promise.resolve():new Promise(t=>{e.addEventListener(`load`,t,{once:!0}),e.addEventListener(`error`,t,{once:!0})})))}function s(e){let{anchoMm:t,altoMm:n}=r;return`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas QR</title>
  <style>
    @page { size: ${t}mm ${n}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label {
      width: ${t}mm;
      height: ${n}mm;
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
  ${e.map(e=>`
      <article class="label">
        <img src="${e.qrDataUrl}" alt="QR ${u(e.hostname||``)}" />
        <div class="meta">
          <p class="host">${u(e.hostname||`Sin hostname`)}</p>
          <p class="loc">${u(e.ubicacionLabel||`Sin ubicación`)}</p>
        </div>
      </article>`).join(``)}
</body>
</html>`}function c(e){return!Array.isArray(e)||e.length===0?Promise.reject(Error(`No hay monitores para imprimir.`)):new Promise((t,n)=>{let i=document.createElement(`iframe`);i.setAttribute(`aria-hidden`,`true`),i.setAttribute(`title`,`Impresión de etiquetas de monitores`),i.style.cssText=`position:fixed;left:-10000px;top:0;width:${r.anchoMm}mm;height:${r.altoMm}mm;border:0;`;let a=!1;function s(){a||(a=!0,window.setTimeout(()=>i.remove(),500))}i.onload=()=>{let e=i.contentWindow,r=e?.document;if(!r){s(),n(Error(`No se pudo preparar la impresión.`));return}o(r).then(()=>{e.addEventListener(`afterprint`,s,{once:!0}),e.focus(),e.print(),window.setTimeout(s,6e4),t()}).catch(e=>{s(),n(e)})},i.srcdoc=l(e),document.body.appendChild(i)})}function l(e){let{anchoMm:t,altoMm:n}=r;return`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas de monitores</title>
  <style>
    @page { size: ${t}mm ${n}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label {
      width: ${t}mm;
      height: ${n}mm;
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
  ${e.map(e=>`
      <article class="label">
        <img src="${e.qrDataUrl}" alt="QR ${u(e.hostname||``)}" />
        <div class="meta">
          <p class="modelo">${u(e.modelo||`Monitor`)}</p>
          ${e.serial?`<p class="serial">S/N: ${u(e.serial)}</p>`:``}
          <p class="host">${u(e.hostname||`Sin hostname`)}</p>
          <p class="loc">${u(e.ubicacionLabel||`Sin ubicación`)}</p>
        </div>
      </article>`).join(``)}
</body>
</html>`}function u(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}export{r as ETIQUETA_TERMICA,i as generarQrDataUrl,a as imprimirEtiquetas,c as imprimirEtiquetasMonitor,n as urlFichaEtiqueta};
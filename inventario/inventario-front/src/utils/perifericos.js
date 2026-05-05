function norm(s) {
  return (s == null ? '' : String(s)).toLowerCase();
}

export function siNo(v) {
  if (v == null) return '—';
  return v ? 'Sí' : 'No';
}

/** Heurística sobre `DispositivoUsbAgenteDTO` (clase + nombre, case-insensitive). */
export function esTeclado(d) {
  const clase = norm(d?.clase);
  const nombre = norm(d?.nombre);
  return clase.includes('keyboard') || nombre.includes('teclado') || nombre.includes('keyboard');
}

export function esMouse(d) {
  const clase = norm(d?.clase);
  const nombre = norm(d?.nombre);
  return clase.includes('mouse') || nombre.includes('mouse');
}

export function esWebcam(d) {
  const clase = norm(d?.clase);
  const nombre = norm(d?.nombre);
  return (
    clase.includes('camera') ||
    clase.includes('image') ||
    nombre.includes('webcam') ||
    nombre.includes('camera')
  );
}

/**
 * Para listado de webcams: solo clase USB que indica vídeo UVC (`Camera`).
 * Evita duplicados: Windows suele exponer el mismo equipo también como clase `Media`.
 */
export function esWebcamClaseCamera(d) {
  return norm(d?.clase).includes('camera');
}

export function esBluetooth(d) {
  return norm(d?.clase) === 'bluetooth' || norm(d?.categoria).includes('bluetooth');
}

/**
 * Quita filas USB duplicadas cuando ya hay una entrada `Camera` con el mismo nombre y aparece otra como `Media`.
 */
export function filtrarUsbSinDuplicadoWebcamCam(dispositivos) {
  const list = Array.isArray(dispositivos) ? dispositivos : [];
  const nombresConCamera = new Set(
    list.filter(d => norm(d?.clase).includes('camera')).map(d => norm(d?.nombre)),
  );
  return list.filter(d => {
    const n = norm(d?.nombre);
    const c = norm(d?.clase);
    if (nombresConCamera.has(n) && c === 'media') {
      return false;
    }
    return true;
  });
}

/**
 * Entradas genéricas de Windows (p. ej. «Controlador HID», clase HIDClass) sin sustento como periférico físico.
 * Alineado con el filtro del backend en el conteo del dashboard.
 */
export function debeOcultarUsbParaInventario(d) {
  const clase = norm(d?.clase);
  const nombre = norm(d?.nombre || '');
  const cat = norm(d?.categoria || '');

  // Representaciones lógicas del mismo dispositivo físico de almacenamiento
  if (clase === 'volume' || clase === 'wpd' || clase === 'diskdrive') return true;

  // System: interfaces de gestión del SO, no son dispositivos físicos
  if (clase === 'system') return true;

  // Drivers virtuales de Bluetooth que Windows genera sobre el adaptador físico
  if (clase === 'bluetooth' && norm(d?.fabricante) === 'microsoft') return true;
  if (nombre.includes('rfcomm protocol tdi')) return true;
  if (nombre.includes('bluetooth device (personal area network)')) return true;

  if (!clase.includes('hidclass')) {
    return false;
  }
  if (nombre.includes('controlador hid')) {
    return true;
  }
  if (cat.includes('controlador hid')) {
    return true;
  }
  return false;
}

/** USB para listados / totales: sin duplicados webcam/media y sin controladores HID genéricos. */
export function filtrarUsbParaInventario(dispositivos) {
  return filtrarUsbSinDuplicadoWebcamCam(dispositivos).filter(d => !debeOcultarUsbParaInventario(d));
}

function debeOcultarAudioParaInventario(a) {
  const nombre = norm(a?.nombre);
  // Salidas de audio por HDMI/DisplayPort (GPU o placa madre) — no son parlantes físicos
  if (nombre.includes('display audio')) return true;
  if (nombre.includes('nvidia high definition audio')) return true;
  // Nombre genérico del driver HDA de Windows, sin info real del dispositivo
  if (nombre === 'high definition audio device') return true;
  return false;
}

/** Audio para listados: sin dispositivos virtuales/genéricos y sin duplicados. */
export function filtrarAudioParaInventario(lista) {
  if (!Array.isArray(lista)) return [];
  const seen = new Set();
  return lista.filter(a => {
    if (debeOcultarAudioParaInventario(a)) return false;
    const key = norm(a?.nombre) + '|' + norm(a?.fabricante);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

import * as XLSX from 'xlsx';

/** Excel (sobre todo en macOS) puede exportar CSV solo con \\r; split(/\\r?\\n/) no parte esas líneas. */
function normalizeNewlines(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/** Igual que backend {@code FirestoreDocumentId.sanitizar}: sin / ni \\ en el id. */
export function sanitizarFirestoreDocId(raw) {
  if (raw == null) return '';
  let t = String(raw).trim();
  if (!t) return '';
  t = t.replace(/\//g, '-').replace(/\\/g, '-');
  if (t === '.' || t === '..') return '';
  return t;
}

/** Quita acentos y minúsculas para comparar cabeceras. */
function normalizeKey(k) {
  return String(k ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function pickNorm(normObj, aliases) {
  for (const a of aliases) {
    const nk = normalizeKey(a);
    if (normObj[nk] != null && String(normObj[nk]).trim() !== '') {
      return String(normObj[nk]).trim();
    }
  }
  return '';
}

/** Ubicación: muchas variantes en Excel + fallback si la cabecera contiene «ubic». */
function pickUbicacion(norm) {
  const directo = pickNorm(norm, [
    'ubicacion',
    'ubicacin',
    'ubicacionfisica',
    'ubicacion fisica',
    'ubicacioncamara',
    'ubicacion_camara',
    'localizacion',
    'localizacin',
    'lugar',
    'lugarcamara',
    'sector',
    'zona',
    'area',
    'sala',
    'edificio',
    'sitio',
    'domicilio',
    'emplazamiento',
    'instalacion',
    'ubic',
    'location',
    'place',
    'locale',
    'sitioinstalacion',
  ]);
  if (directo) return directo;

  for (const [key, val] of Object.entries(norm)) {
    if (val == null || String(val).trim() === '') continue;
    const k = String(key).toLowerCase();
    if (k.includes('ubic') || k.includes('localiza')) {
      return String(val).trim();
    }
  }
  return '';
}

/** Normaliza fila Excel/CSV: claves sin acentos y valores siempre string (incl. números). */
function buildNorm(raw) {
  const norm = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const nk = normalizeKey(k);
    if (!nk) continue;
    let val = v;
    if (val == null || val === '') {
      norm[nk] = '';
      continue;
    }
    if (typeof val === 'number') {
      norm[nk] = Number.isFinite(val) ? String(val) : '';
      continue;
    }
    norm[nk] = String(val).trim();
  }
  return norm;
}

/**
 * Mapa columnas típicas de Excel (español / export NVR) → modelo de alta.
 * Prioridad: columna Dispositivo → nombre camara (no usar solo número de canal como ID).
 */
export function rowToCamaraFields(raw) {
  const norm = buildNorm(raw);

  let nombre = pickNorm(norm, [
    'nombrecamara',
    'nombre_camara',
    'nombre',
    'name',
    'titulo',
  ]);

  let dispositivo = pickNorm(norm, [
    'dispositivo',
    'id',
    'codigo',
    'codigoequipo',
    'codigo_equipo',
    'serial',
    'serie',
    'device',
    'nombredispositivo',
    'nombre_dispositivo',
    'equipo',
  ]);

  const direccionIp = pickNorm(norm, ['direccionip', 'direcciónip', 'ip', 'ipv4', 'address']);

  if (!dispositivo) {
    const canal = pickNorm(norm, ['canal', 'channel', 'ch']);
    if (canal && !/^\d+$/.test(String(canal).trim())) {
      dispositivo = canal;
    }
  }

  if (!dispositivo && nombre) {
    dispositivo = sanitizarFirestoreDocId(nombre) || nombre.trim();
  }

  if (!dispositivo && direccionIp) {
    dispositivo = sanitizarFirestoreDocId(`cam-${direccionIp.replace(/\./g, '-')}`);
  }

  if (!dispositivo) {
    const canal = pickNorm(norm, ['canal', 'channel', 'ch']);
    if (canal) dispositivo = String(canal).trim();
  }

  if (!nombre && dispositivo) {
    nombre = dispositivo;
  }

  if (!nombre) {
    nombre = pickNorm(norm, ['nombrecamara', 'nombre']);
  }

  const ubicacion = pickUbicacion(norm);
  const marca = pickNorm(norm, ['marca', 'fabricante', 'manufactur', 'manufacturer', 'fabricante', 'marca_equipo']);
  const tipo = pickNorm(norm, ['tipo', 'modelo', 'tipocamara']);
  const descripcionExtra = pickNorm(norm, ['descripcion', 'descripcionlarga', 'notas', 'observaciones']);
  const responsable = pickNorm(norm, ['responsable']);

  const canalInfo = pickNorm(norm, ['canal', 'channel']);
  let descripcion = descripcionExtra || undefined;
  if (canalInfo && !descripcion) {
    descripcion = `Canal: ${canalInfo}`;
  } else if (canalInfo && descripcion && !descripcion.includes('Canal')) {
    descripcion = `${descripcion} · Canal: ${canalInfo}`;
  }

  let puertoStr = pickNorm(norm, ['puerto', 'port', 'puerto_rtsp']);
  if (puertoStr === '' && raw && typeof raw === 'object') {
    const r = raw;
    if (typeof r.puerto === 'number') puertoStr = String(r.puerto);
    if (typeof r.Port === 'number') puertoStr = String(r.Port);
  }

  let puerto;
  if (puertoStr !== '') {
    const n = Number.parseInt(puertoStr, 10);
    if (!Number.isNaN(n)) puerto = n;
  }

  return {
    dispositivo: dispositivo || '',
    nombre: nombre || '',
    ubicacion,
    marca: marca || undefined,
    direccionIp: direccionIp || undefined,
    puerto,
    tipo: tipo || undefined,
    descripcion,
    responsable: responsable || undefined,
  };
}

function detectDelimiter(line) {
  const semi = (line.match(/;/g) || []).length;
  const coma = (line.match(/,/g) || []).length;
  return semi >= coma ? ';' : ',';
}

/** NBSP y espacios raros → espacio normal; trim no quita \u00A0 en todos los motores. */
function normalizeImportCell(s) {
  return String(s ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2000-\u200B\uFEFF]/g, '')
    .trim();
}

/**
 * Quita espacios/tab entre separadores `;` (campos “vacíos” con espacios en export Excel).
 * Ej.: `; ; ;;;` → `;;;;`
 */
function collapseSpacesBetweenSemicolons(text) {
  let s = text;
  let prev;
  do {
    prev = s;
    s = s.replace(/;[ \t]+(?=;)/g, ';');
  } while (s !== prev);
  return s;
}

/** Parser CSV mínimo con comillas RFC4180. */
export function splitCsvLine(line, delim) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQ = !inQ;
      }
    } else if (c === delim && !inQ) {
      out.push(normalizeImportCell(cur));
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(normalizeImportCell(cur));
  return out;
}

/**
 * Excel (Windows) a menudo guarda CSV en windows-1252; leer como UTF-8 produce � (U+FFFD).
 * También detecta UTF-16 con BOM.
 */
export async function readCsvFileText(file) {
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
    return normalizeNewlines(new TextDecoder('utf-16le').decode(u8));
  }
  if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
    return normalizeNewlines(new TextDecoder('utf-16be').decode(u8));
  }
  let offset = 0;
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    offset = 3;
  }
  const slice = u8.subarray(offset);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(slice);
  const bad = (utf8.match(/\uFFFD/g) || []).length;
  if (bad >= 8 && slice.length > 80) {
    try {
      const cp1252 = new TextDecoder('windows-1252')
        .decode(slice)
        .replace(/\u00A0/g, ' ');
      const bad1252 = (cp1252.match(/\uFFFD/g) || []).length;
      if (bad1252 < bad) return normalizeNewlines(cp1252);
    } catch {
      /* ignore */
    }
  }
  return normalizeNewlines(utf8.replace(/\u00A0/g, ' '));
}

export function parseCamaraRowsFromCsv(text) {
  let clean = normalizeNewlines(String(text).replace(/^\uFEFF/, '').replace(/\u00A0/g, ' '));
  const firstLine = clean.split(/\r?\n/).find(l => l.trim().length > 0) || '';
  const delim = detectDelimiter(firstLine);
  if (delim === ';') {
    clean = collapseSpacesBetweenSemicolons(clean);
  }
  const lines = clean
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const rawHeaders = splitCsvLine(lines[0], delim);
  const headers = rawHeaders.map((cell, j) => normalizeKey(cell) || `__col${j}`);
  const rows = [];
  const nCols = headers.length;
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim);
    while (cells.length < nCols) cells.push('');
    const celdaVacia = cells.every(c => (c ?? '').trim() === '');
    if (celdaVacia) continue;
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = cells[j] ?? '';
    });
    rows.push(rowToCamaraFields(obj));
  }
  return rows;
}

function rowLooksLikeHeader(row) {
  const t = row.map(c => String(c ?? '').toLowerCase()).join(' ');
  return /(dispositivo|nombre|direccion|ip\b|port|tipo|marca|canal|codigo|camera|camara|ubic|serial|manufact)/i.test(t);
}

/**
 * Lee la primera hoja como tabla: detecta fila de cabeceras aunque arriba haya un título.
 */
export function parseCamaraRowsFromXlsx(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!aoa?.length) return [];

  let headerIdx = 0;
  if (!rowLooksLikeHeader(aoa[0]) && aoa.length > 1 && rowLooksLikeHeader(aoa[1])) {
    headerIdx = 1;
  }

  const headerTitles = aoa[headerIdx].map((c, j) => {
    const t = String(c ?? '').trim();
    return t || `__col${j}`;
  });

  const rows = [];
  const nHdr = headerTitles.length;
  for (let r = headerIdx + 1; r < aoa.length; r++) {
    let cells = aoa[r] ? [...aoa[r]] : [];
    while (cells.length < nHdr) cells.push('');
    const vacia = cells.every(c => c == null || String(c).trim() === '');
    if (vacia) continue;
    const obj = {};
    headerTitles.forEach((titleKey, j) => {
      let val = cells[j];
      if (val == null) val = '';
      else if (typeof val === 'number') val = val;
      else val = normalizeImportCell(val);
      obj[titleKey] = val;
    });
    rows.push(rowToCamaraFields(obj));
  }
  return rows;
}

/**
 * @param {File} file
 * @returns {Promise<Array<ReturnType<typeof rowToCamaraFields>>>}
 */
export async function parseCamaraImportFile(file) {
  const name = (file.name || '').toLowerCase();
  const looksCsv = name.endsWith('.csv') || name.endsWith('.txt')
    || file.type === 'text/csv'
    || file.type === 'text/plain';
  if (looksCsv) {
    const text = await readCsvFileText(file);
    return parseCamaraRowsFromCsv(text);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    return parseCamaraRowsFromXlsx(buf);
  }
  throw new Error('Formato no soportado. Usá .csv, .xlsx o .xls');
}

/**
 * @param {Array} rows from rowToCamaraFields
 * @param {string} nvrId
 * @param api {{ fetchCamara, createCamara, asignarNvrCamara, fetchCamaras? }}
 * @param {(ev: { tipo: 'creada'|'asignada', camara: object, lineaArchivo: number, filaDatos: number, totalFilasDatos: number }) => void} [onProgress] — tras cada fila OK
 */

export async function importCamarasRowsToNvr(rows, nvrId, api, onProgress) {
  const { fetchCamara, createCamara, asignarNvrCamara, fetchCamaras } = api;
  const nvrDestino = String(nvrId ?? '').trim();
  const resultado = {
    creadas: 0,
    asignadas: 0,
    omitidas: 0,
    /** Filas cuya cámara ya existía y está asignada a otra NVR (no se mueven automáticamente). */
    enOtraNvr: 0,
    errores: [],
  };

  /** Un solo listado evita cientos de GET /cámaras/:id (404 ruidosos en consola). */
  let indicePorDispositivo = null;
  if (typeof fetchCamaras === 'function') {
    try {
      const todas = await fetchCamaras();
      const list = Array.isArray(todas) ? todas : [];
      indicePorDispositivo = new Map(
        list.filter(c => c && c.id).map(c => [String(c.id).trim(), c]),
      );
    } catch {
      indicePorDispositivo = null;
    }
  }

  const totalFilasDatos = rows.length;

  if (totalFilasDatos === 0) {
    resultado.ayuda =
      'No se leyó ninguna fila de datos (solo cabecera o archivo vacío). '
      + 'En Excel exportá como «CSV UTF-8» o «CSV (delimitado por comas)». '
      + 'Si el archivo viene de Mac y no importa, probá abrirlo en el Bloc de notas y guardarlo de nuevo con codificación UTF-8.';
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const numLinea = i + 2;
    const filaDatos = i + 1;
    try {
      const dispositivo = (row.dispositivo || '').trim();
      if (!dispositivo) {
        resultado.omitidas += 1;
        continue;
      }

      const existente = indicePorDispositivo
        ? (indicePorDispositivo.get(dispositivo) ?? null)
        : await fetchCamara(dispositivo);
      if (existente) {
        const nvrPrevio = existente.nvrId != null ? String(existente.nvrId).trim() : '';
        if (nvrPrevio && nvrPrevio !== nvrDestino) {
          resultado.enOtraNvr += 1;
          continue;
        }
        const dto = await asignarNvrCamara(dispositivo, nvrId);
        resultado.asignadas += 1;
        if (dto && indicePorDispositivo && dto.id) {
          indicePorDispositivo.set(String(dto.id).trim(), dto);
        }
        if (dto && onProgress) {
          onProgress({
            tipo: 'asignada',
            camara: dto,
            lineaArchivo: numLinea,
            filaDatos,
            totalFilasDatos,
          });
        }
      } else {
        const nombre = (row.nombre || '').trim() || dispositivo;
        const ubicacion = (row.ubicacion || '').trim() || 'IMPORTACION';
        const body = {
          dispositivo,
          nombre,
          ubicacion,
          nvrId,
          marca: row.marca,
          descripcion: row.descripcion,
          responsable: row.responsable,
          direccionIp: row.direccionIp,
          tipo: row.tipo,
        };
        if (row.puerto != null && !Number.isNaN(row.puerto)) {
          body.puerto = row.puerto;
        }
        const dto = await createCamara(body);
        resultado.creadas += 1;
        if (dto && indicePorDispositivo && dto.id) {
          indicePorDispositivo.set(String(dto.id).trim(), dto);
        }
        if (dto && onProgress) {
          onProgress({
            tipo: 'creada',
            camara: dto,
            lineaArchivo: numLinea,
            filaDatos,
            totalFilasDatos,
          });
        }
      }
    } catch (e) {
      resultado.errores.push({
        linea: numLinea,
        mensaje: e?.message || String(e),
      });
    }
  }

  const sinAltaNiAsignacion = resultado.creadas === 0 && resultado.asignadas === 0;
  if (
    totalFilasDatos > 0
    && sinAltaNiAsignacion
    && resultado.errores.length === 0
    && resultado.enOtraNvr > 0
    && resultado.enOtraNvr + resultado.omitidas === totalFilasDatos
  ) {
    resultado.ayuda =
      'Ninguna fila se importó: las cámaras del archivo ya existen y están asignadas a otra NVR. '
      + 'El inventario no las mueve automáticamente; desasigná esas cámaras desde la otra NVR o usá IDs únicos por sitio.';
  } else if (
    resultado.omitidas > 0
    && resultado.creadas === 0
    && resultado.asignadas === 0
    && totalFilasDatos > 0
  ) {
    resultado.ayuda =
      'No se encontró ningún identificador de cámara en las columnas. '
      + 'El archivo debe tener cabeceras reconocibles (por ejemplo «Nombre Dispositivo», '
      + '«nombre camara», «dispositivo», «id» o «canal») y datos en esas columnas. '
      + 'Si la primera fila es un título, la tabla debería empezar en la fila siguiente.';
  }

  return resultado;
}

export const PLANTILLA_CSV_CAMARAS = `canal,Nombre Dispositivo,nombre camara,Direccion IP,Port,manufactur,tipo,ubicacion
1,cam-lobby-01,Entrada principal,192.168.0.50,37777,Dahua,Dome,TESORERIA
`;

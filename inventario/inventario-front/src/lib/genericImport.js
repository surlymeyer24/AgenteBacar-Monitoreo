/** Excel (sobre todo en macOS) puede exportar CSV solo con \r; split(/\r?\n/) no parte esas líneas. */
export function normalizeNewlines(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/** Quita acentos y minúsculas para comparar cabeceras. */
export function normalizeKey(k) {
  return String(k ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

export function pickNorm(normObj, aliases) {
  for (const a of aliases) {
    const nk = normalizeKey(a);
    if (normObj[nk] != null && String(normObj[nk]).trim() !== '') {
      return String(normObj[nk]).trim();
    }
  }
  return '';
}

/** Normaliza fila Excel/CSV: claves sin acentos y valores siempre string (incl. números). */
export function buildNorm(raw) {
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
 * Convierte una fila raw en un objeto usando un schema.
 * El schema tiene el formato: { propiedadDominio: ['alias1', 'alias2'] }
 */
export function rowToEntityFields(raw, schema) {
  const norm = buildNorm(raw);
  const result = {};
  for (const [propName, aliases] of Object.entries(schema)) {
    result[propName] = pickNorm(norm, aliases);
  }
  return result;
}

export function detectDelimiter(line) {
  const semi = (line.match(/;/g) || []).length;
  const coma = (line.match(/,/g) || []).length;
  return semi >= coma ? ';' : ',';
}

/** NBSP y espacios raros → espacio normal; trim no quita \u00A0 en todos los motores. */
export function normalizeImportCell(s) {
  return String(s ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2000-\u200B\uFEFF]/g, '')
    .trim();
}

/** Quita espacios/tab entre separadores `;` */
export function collapseSpacesBetweenSemicolons(text) {
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

/** Decodificación de texto CSV tolerante a codificaciones de Windows/Excel */
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

export function parseRowsFromCsv(text, schema) {
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
    rows.push(rowToEntityFields(obj, schema));
  }
  return rows;
}

export async function parseRowsFromXlsx(arrayBuffer, schema) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!aoa?.length) return [];

  // Asumimos que la cabecera es la fila 0
  let headerIdx = 0;
  // Si la fila 0 parece título (1 sola celda con datos) y la 1 tiene varias, tomamos la 1
  const count0 = aoa[0].filter(c => String(c||'').trim()).length;
  if (aoa.length > 1) {
    const count1 = aoa[1].filter(c => String(c||'').trim()).length;
    if (count1 > count0 + 1) {
      headerIdx = 1;
    }
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
      else if (typeof val === 'number') val = String(val);
      else val = normalizeImportCell(val);
      obj[titleKey] = val;
    });
    rows.push(rowToEntityFields(obj, schema));
  }
  return rows;
}

/**
 * Función principal a llamar desde la UI.
 * @param {File} file
 * @param {Object} schema 
 */
export async function parseImportFile(file, schema) {
  const name = (file.name || '').toLowerCase();
  
  // Soporte directo para archivos JSON exportados de sistemas
  if (name.endsWith('.json') || file.type === 'application/json') {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('El archivo JSON debe contener un array de objetos.');
    }
    return data.map(obj => rowToEntityFields(obj, schema));
  }

  const looksCsv = name.endsWith('.csv') || name.endsWith('.txt')
    || file.type === 'text/csv'
    || file.type === 'text/plain';
  if (looksCsv) {
    const text = await readCsvFileText(file);
    return parseRowsFromCsv(text, schema);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    return await parseRowsFromXlsx(buf, schema);
  }
  throw new Error('Formato no soportado. Usá .json, .csv, .xlsx o .xls');
}

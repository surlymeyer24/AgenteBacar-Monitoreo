import { useState } from 'react';
import {
  agregarImpresora,
  agregarMonitor,
  agregarDispositivoUsb,
  agregarAudioEntrada,
  agregarAudioSalida,
} from '../api/computadoraApi';

const TIPOS = [
  { id: 'impresora', label: 'Impresora' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'usb', label: 'USB' },
  { id: 'audioEntrada', label: 'Audio entrada' },
  { id: 'audioSalida', label: 'Audio salida' },
];

function numOmit(v) {
  if (v === '' || v == null) return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export default function AgregarPerifericoForms({ uuid, onActualizado }) {
  const [tipo, setTipo] = useState('impresora');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const [imp, setImp] = useState({
    nombre: '',
    driver: '',
    puerto: '',
    tipo: '',
    tipoImpresora: '',
    estado: '',
    compartida: false,
    predeterminada: false,
  });
  const [mon, setMon] = useState({
    nombre: '',
    resolucion: '',
    pulgadas: '',
    anchoCm: '',
    altoCm: '',
  });
  const [usb, setUsb] = useState({
    nombre: '',
    fabricante: '',
    categoria: '',
    clase: '',
    conexion: '',
  });
  const [audIn, setAudIn] = useState({ nombre: '', fabricante: '', estado: '' });
  const [audOut, setAudOut] = useState({ nombre: '', fabricante: '', estado: '' });

  function trimOrUndef(s) {
    const t = (s ?? '').trim();
    return t === '' ? undefined : t;
  }

  async function submitImpresora(e) {
    e.preventDefault();
    const nombre = trimOrUndef(imp.nombre);
    if (!nombre) {
      setError('Indicá al menos el nombre de la impresora.');
      return;
    }
    const body = {
      nombre,
      driver: trimOrUndef(imp.driver),
      puerto: trimOrUndef(imp.puerto),
      tipo: trimOrUndef(imp.tipo),
      tipoImpresora: trimOrUndef(imp.tipoImpresora),
      estado: trimOrUndef(imp.estado),
      compartida: imp.compartida === true ? true : undefined,
      predeterminada: imp.predeterminada === true ? true : undefined,
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    await ejecutar(() => agregarImpresora(uuid, body));
  }

  async function submitMonitor(e) {
    e.preventDefault();
    const nombre = trimOrUndef(mon.nombre);
    if (!nombre) {
      setError('Indicá al menos el nombre del monitor.');
      return;
    }
    const body = {
      nombre,
      resolucion: trimOrUndef(mon.resolucion),
      pulgadas: numOmit(mon.pulgadas),
      anchoCm: numOmit(mon.anchoCm),
      altoCm: numOmit(mon.altoCm),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    await ejecutar(() => agregarMonitor(uuid, body));
  }

  async function submitUsb(e) {
    e.preventDefault();
    const nombre = trimOrUndef(usb.nombre);
    if (!nombre) {
      setError('Indicá al menos el nombre del dispositivo USB.');
      return;
    }
    const body = {
      nombre,
      fabricante: trimOrUndef(usb.fabricante),
      categoria: trimOrUndef(usb.categoria),
      clase: trimOrUndef(usb.clase),
      conexion: trimOrUndef(usb.conexion),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    await ejecutar(() => agregarDispositivoUsb(uuid, body));
  }

  async function submitAudioEntrada(e) {
    e.preventDefault();
    const nombre = trimOrUndef(audIn.nombre);
    if (!nombre) {
      setError('Indicá al menos el nombre del dispositivo de entrada.');
      return;
    }
    const body = {
      nombre,
      fabricante: trimOrUndef(audIn.fabricante),
      estado: trimOrUndef(audIn.estado),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    await ejecutar(() => agregarAudioEntrada(uuid, body));
  }

  async function submitAudioSalida(e) {
    e.preventDefault();
    const nombre = trimOrUndef(audOut.nombre);
    if (!nombre) {
      setError('Indicá al menos el nombre del dispositivo de salida.');
      return;
    }
    const body = {
      nombre,
      fabricante: trimOrUndef(audOut.fabricante),
      estado: trimOrUndef(audOut.estado),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    await ejecutar(() => agregarAudioSalida(uuid, body));
  }

  async function ejecutar(fn) {
    setError(null);
    setOk(null);
    setEnviando(true);
    try {
      const actualizado = await fn();
      if (!actualizado) {
        setError('No se encontró la computadora.');
        return;
      }
      onActualizado(actualizado);
      setOk('Periférico agregado.');
    } catch {
      setError('No se pudo guardar. Revisá la consola del servidor.');
    } finally {
      setEnviando(false);
    }
  }

  const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' };

  return (
    <div className="agregar-periferico-panel">
      <label htmlFor="tipo-perif" style={lbl}>Tipo</label>
      <select
        id="tipo-perif"
        className="inventory-input"
        style={{ maxWidth: '280px', marginBottom: '1rem' }}
        value={tipo}
        onChange={e => {
          setTipo(e.target.value);
          setError(null);
          setOk(null);
        }}
      >
        {TIPOS.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>

      {tipo === 'impresora' && (
        <form className="camara-form" onSubmit={submitImpresora}>
          <label>Nombre *<input value={imp.nombre} onChange={e => setImp(p => ({ ...p, nombre: e.target.value }))} /></label>
          <label>Driver<input value={imp.driver} onChange={e => setImp(p => ({ ...p, driver: e.target.value }))} /></label>
          <label>Puerto<input value={imp.puerto} onChange={e => setImp(p => ({ ...p, puerto: e.target.value }))} /></label>
          <label>Tipo<input value={imp.tipo} onChange={e => setImp(p => ({ ...p, tipo: e.target.value }))} /></label>
          <label>Tipo impresora<input value={imp.tipoImpresora} onChange={e => setImp(p => ({ ...p, tipoImpresora: e.target.value }))} /></label>
          <label>Estado (Windows)<input value={imp.estado} onChange={e => setImp(p => ({ ...p, estado: e.target.value }))} /></label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={imp.compartida} onChange={e => setImp(p => ({ ...p, compartida: e.target.checked }))} />
            Compartida
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={imp.predeterminada} onChange={e => setImp(p => ({ ...p, predeterminada: e.target.checked }))} />
            Predeterminada
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Agregar impresora</button>
        </form>
      )}

      {tipo === 'monitor' && (
        <form className="camara-form" onSubmit={submitMonitor}>
          <label>Nombre *<input value={mon.nombre} onChange={e => setMon(p => ({ ...p, nombre: e.target.value }))} /></label>
          <label>Resolución<input value={mon.resolucion} onChange={e => setMon(p => ({ ...p, resolucion: e.target.value }))} /></label>
          <label>Pulgadas<input type="text" inputMode="decimal" value={mon.pulgadas} onChange={e => setMon(p => ({ ...p, pulgadas: e.target.value }))} /></label>
          <label>Ancho (cm)<input type="text" inputMode="decimal" value={mon.anchoCm} onChange={e => setMon(p => ({ ...p, anchoCm: e.target.value }))} /></label>
          <label>Alto (cm)<input type="text" inputMode="decimal" value={mon.altoCm} onChange={e => setMon(p => ({ ...p, altoCm: e.target.value }))} /></label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Agregar monitor</button>
        </form>
      )}

      {tipo === 'usb' && (
        <form className="camara-form" onSubmit={submitUsb}>
          <label>Nombre *<input value={usb.nombre} onChange={e => setUsb(p => ({ ...p, nombre: e.target.value }))} /></label>
          <label>Fabricante<input value={usb.fabricante} onChange={e => setUsb(p => ({ ...p, fabricante: e.target.value }))} /></label>
          <label>Categoría<input value={usb.categoria} onChange={e => setUsb(p => ({ ...p, categoria: e.target.value }))} /></label>
          <label>Clase<input value={usb.clase} onChange={e => setUsb(p => ({ ...p, clase: e.target.value }))} /></label>
          <label>Conexión<input value={usb.conexion} onChange={e => setUsb(p => ({ ...p, conexion: e.target.value }))} /></label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Agregar USB</button>
        </form>
      )}

      {tipo === 'audioEntrada' && (
        <form className="camara-form" onSubmit={submitAudioEntrada}>
          <label>Nombre *<input value={audIn.nombre} onChange={e => setAudIn(p => ({ ...p, nombre: e.target.value }))} /></label>
          <label>Fabricante<input value={audIn.fabricante} onChange={e => setAudIn(p => ({ ...p, fabricante: e.target.value }))} /></label>
          <label>Estado (Windows)<input value={audIn.estado} onChange={e => setAudIn(p => ({ ...p, estado: e.target.value }))} /></label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Agregar entrada</button>
        </form>
      )}

      {tipo === 'audioSalida' && (
        <form className="camara-form" onSubmit={submitAudioSalida}>
          <label>Nombre *<input value={audOut.nombre} onChange={e => setAudOut(p => ({ ...p, nombre: e.target.value }))} /></label>
          <label>Fabricante<input value={audOut.fabricante} onChange={e => setAudOut(p => ({ ...p, fabricante: e.target.value }))} /></label>
          <label>Estado (Windows)<input value={audOut.estado} onChange={e => setAudOut(p => ({ ...p, estado: e.target.value }))} /></label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Agregar salida</button>
        </form>
      )}

      {error && <p className="page error" style={{ marginTop: '0.75rem' }}>{error}</p>}
      {ok && <p className="estado-msg" style={{ marginTop: '0.75rem', color: 'var(--color-success, #2e7d32)' }}>{ok}</p>}
    </div>
  );
}

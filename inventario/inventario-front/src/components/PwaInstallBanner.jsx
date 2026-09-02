import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';

const STORAGE_KEY = 'pwa-etiquetas-qr-install-dismissed';

function esRutaQr(pathname) {
  return pathname === '/etiquetas-qr' || pathname.startsWith('/etiquetas-qr/');
}

function esStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  );
}

function esIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return ios && safari;
}

export default function PwaInstallBanner() {
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (dismissed || esStandalone() || !esRutaQr(pathname)) return null;

  const ios = esIosSafari();
  if (!ios && !deferred) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  async function instalar() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pointer-events-none sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:p-0">
      <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white shadow-lg p-3 flex gap-3 items-start">
        <div className="mt-0.5 rounded-lg bg-[#0e0f36] text-white p-2 shrink-0">
          {ios ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 leading-tight">Instalar Etiquetas QR</p>
          {ios ? (
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              En Safari: tocá Compartir y después «Agregar a pantalla de inicio».
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              Queda en el teléfono como app. Las fichas siguen pidiendo internet.
            </p>
          )}
          {!ios && (
            <button
              type="button"
              onClick={instalar}
              className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-[#0e0f36] text-white text-xs font-bold"
            >
              Instalar
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

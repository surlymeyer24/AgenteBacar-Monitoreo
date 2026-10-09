import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/** Campo de credencial con máscara y botón mostrar/ocultar. */
export function CredentialsDisplay({ label = 'Contraseña', value }) {
  const [visible, setVisible] = useState(false);
  const hasValue = value != null && String(value).length > 0;

  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-slate-500 text-sm">
        <Lock className="w-3.5 h-3.5" />
        {label}
      </dt>
      <dd className="flex items-center gap-2">
        {hasValue ? (
          <>
            <span className="font-mono text-sm text-slate-800">
              {visible ? value : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
              title={visible ? 'Ocultar' : 'Mostrar'}
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </dd>
    </div>
  );
}

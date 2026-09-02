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

/** Input de credencial para formularios. */
export function CredentialsInput({ id, name, label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-slate-600 uppercase text-xs tracking-wider font-bold">
        <Lock className="w-3 h-3" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full p-2.5 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-slate-800 font-semibold text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

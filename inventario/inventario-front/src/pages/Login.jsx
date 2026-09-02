import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';

export default function Login() {
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const authUser = useFirebaseAuthUser();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const auth = getFirebaseAuth();

  if (authUser === undefined) {
    return (
      <div className="login-page min-h-screen w-full flex items-center justify-center bg-[#02040a]">
        <p className="text-slate-500 text-base font-mono">Cargando…</p>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return <Navigate to="/" replace />;
  }

  if (!auth) {
    return (
      <div className="login-page min-h-screen w-full flex items-center justify-center bg-[#02040a] p-6">
        <p className="text-red-400 text-base">
          Firebase Auth no está disponible (revisá las variables VITE_FIREBASE_*).
        </p>
      </div>
    );
  }

  if (authUser && authUser !== false) {
    return <Navigate to={from} replace />;
  }

  function switchMode(toSignUp) {
    setIsSignUp(toSignUp);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNombre('');
    setApellido('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.');
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fullName = `${nombre.trim()} ${apellido.trim()}`.trim();
        if (fullName) {
          await updateProfile(cred.user, { displayName: fullName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const code = err?.code;
      let msg = err?.message ?? 'No se pudo completar la operación';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Correo no válido.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos. Probá más tarde.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'Ya existe una cuenta con ese correo.';
      } else if (code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 focus:border-accent focus:ring-1 focus:ring-accent/20 text-white rounded-xl pl-12 pr-4 py-4 text-base outline-none transition-all placeholder:text-slate-600 font-mono';
  const inputPasswordClass =
    'w-full bg-slate-950 border border-slate-800 focus:border-accent focus:ring-1 focus:ring-accent/20 text-white rounded-xl pl-12 pr-12 py-4 text-base outline-none transition-all placeholder:text-slate-600 font-mono';
  const labelClass =
    'text-sm font-bold text-slate-400 uppercase tracking-widest font-mono block';

  return (
    <div className="login-page min-h-screen w-full flex flex-col items-center justify-center bg-[#02040a] p-6 md:p-12 relative overflow-hidden select-none">
      <div className="absolute inset-0 opacity-[0.4] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl flex flex-col md:flex-row md:items-center md:justify-center gap-12 md:gap-20 lg:gap-28">

        {/* Branding */}
        <div className="text-center md:text-left space-y-6 md:max-w-xl shrink-0">
          <p className="text-base font-bold tracking-[0.14em] uppercase text-accent font-mono">
            Inventario Bacarsa
          </p>
          <p className="text-accent font-black text-5xl md:text-6xl tracking-tight leading-none">
            Bienvenido
          </p>
          <h1 className="text-white font-extrabold text-5xl md:text-7xl tracking-tight leading-[1.05]">
            Gestión de<br className="hidden md:block" /> Activos<span className="text-accent font-mono">.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-lg mx-auto md:mx-0">
            Sistema centralizado de inventario informático. Registrá y monitoreá equipos, periféricos y activos de la empresa.
          </p>
        </div>

        {/* Access card */}
        <div className="w-full max-w-xl space-y-8 mx-auto md:mx-0">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-wider text-white">
              BACAR<span className="text-accent font-mono">.</span>it
            </h2>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 md:p-12 space-y-8 shadow-xl">
            {error && (
              <div className="p-4 border border-red-500/10 bg-red-950/20 text-red-400 text-base rounded-lg flex items-center gap-2.5 font-medium font-sans">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp ? (
              <>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={labelClass}>Nombre</label>
                      <input
                        type="text"
                        autoComplete="given-name"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-accent focus:ring-1 focus:ring-accent/20 text-white rounded-xl px-4 py-4 text-base outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Apellido</label>
                      <input
                        type="text"
                        autoComplete="family-name"
                        required
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-accent focus:ring-1 focus:ring-accent/20 text-white rounded-xl px-4 py-4 text-base outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Correo corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        autoComplete="username"
                        required
                        placeholder="usuario@bacarsa.com.ar"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Contraseña</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputPasswordClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Confirmar contraseña</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputPasswordClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold text-base uppercase tracking-widest py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 mt-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</span>
                  </button>
                </form>
                <p className="text-center text-base text-slate-500">
                  ¿Ya tenés cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="text-accent hover:text-accent-hover font-semibold cursor-pointer"
                  >
                    Iniciar sesión
                  </button>
                </p>
              </>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className={labelClass}>Correo Electrónico</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="usuario@bacarsa.com.ar"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputPasswordClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-800 bg-slate-950 text-accent focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    <span className="text-base text-slate-400">Recordar sesión</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="text-base text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    ¿Crear cuenta?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold text-base uppercase tracking-widest py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 mt-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{busy ? 'Ingresando…' : 'Ingresar'}</span>
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-slate-600 font-mono tracking-wide">
            Control de Acceso Seguro • Bacar IT 2026
          </p>
        </div>
      </div>
    </div>
  );
}

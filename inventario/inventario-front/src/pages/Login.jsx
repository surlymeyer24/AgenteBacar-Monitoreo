import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
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

  const auth = getFirebaseAuth();

  if (authUser === undefined) {
    return (
      <div className="login-page">
        <p className="estado-msg">Cargando…</p>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return <Navigate to="/" replace />;
  }

  if (!auth) {
    return (
      <div className="login-page">
        <p className="estado-msg error">Firebase Auth no está disponible (revisá las variables VITE_FIREBASE_*).</p>
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

  return (
    <div className="login-page">
      <div className="login-left">
        <p className="login-left-eyebrow">INVENTARIO BACARSA</p>
        <h1 className="login-left-title">
          Gestión de<br />Activos<span className="login-dot">.</span>
        </h1>
        <p className="login-left-desc">
          Sistema centralizado de inventario informático.<br />
          Registrá y monitoreá equipos, periféricos y activos de<br />
          la empresa.
        </p>
      </div>

      <div className="login-right">
        <div className="login-bracket-wrap">
          <span className="login-corner login-corner--tl"></span>
          <span className="login-corner login-corner--tr"></span>
          <span className="login-corner login-corner--bl"></span>
          <span className="login-corner login-corner--br"></span>

          <div className="login-card-header">Bienvenido</div>

          <div className="login-floating-card">
            {isSignUp ? (
              <>
                <p className="login-card-title">Crear cuenta</p>
                <form className="login-form" onSubmit={onSubmit}>
                  <div className="login-name-row">
                    <label className="login-field">
                      <span className="login-label">Nombre</span>
                      <input
                        type="text"
                        autoComplete="given-name"
                        className="inventory-input"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        required
                      />
                    </label>
                    <label className="login-field">
                      <span className="login-label">Apellido</span>
                      <input
                        type="text"
                        autoComplete="family-name"
                        className="inventory-input"
                        value={apellido}
                        onChange={e => setApellido(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <label className="login-field">
                    <span className="login-label">Correo corporativo</span>
                    <input
                      type="email"
                      autoComplete="username"
                      className="inventory-input"
                      placeholder="usuario@bacarsa.com.ar"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="login-field">
                    <span className="login-label">Contraseña</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="inventory-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  <label className="login-field">
                    <span className="login-label">Confirmar contraseña</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="inventory-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </label>
                  {error ? <p className="login-error">{error}</p> : null}
                  <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
                    {busy ? 'Creando cuenta…' : 'Crear cuenta'}
                  </button>
                </form>
                <p className="login-toggle">
                  ¿Ya tenés cuenta?{' '}
                  <button type="button" className="login-toggle-btn" onClick={() => switchMode(false)}>
                    Iniciar sesión
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="login-card-title">Iniciar sesión</p>
                <p className="login-card-subtitle">Ingresá tus credenciales</p>
                <form className="login-form" onSubmit={onSubmit}>
                  <label className="login-field">
                    <span className="login-label">CORREO</span>
                    <input
                      type="email"
                      autoComplete="username"
                      className="inventory-input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="login-field">
                    <span className="login-label">CONTRASEÑA</span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      className="inventory-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  {error ? <p className="login-error">{error}</p> : null}
                  <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
                    {busy ? 'Ingresando…' : 'INGRESAR'}
                  </button>
                </form>
                <p className="login-toggle">
                  ¿No tenés cuenta?{' '}
                  <button type="button" className="login-toggle-btn" onClick={() => switchMode(true)}>
                    Registrarse
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

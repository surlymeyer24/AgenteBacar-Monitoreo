import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';

export default function Login() {
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const authUser = useFirebaseAuthUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const auth = getFirebaseAuth();

  if (authUser === undefined) {
    return (
      <div className="page login-page">
        <p className="estado-msg">Cargando…</p>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return <Navigate to="/" replace />;
  }

  if (!auth) {
    return (
      <div className="page login-page">
        <p className="estado-msg error">Firebase Auth no está disponible (revisá las variables VITE_FIREBASE_*).</p>
      </div>
    );
  }

  if (authUser && authUser !== false) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const code = err?.code;
      let msg = err?.message ?? 'No se pudo iniciar sesión';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Correo no válido.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos. Probá más tarde.';
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card card">
        <h1>Inventario BACARSA</h1>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="login-label">Correo</span>
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
            <span className="login-label">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              className="inventory-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="estado-msg error login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

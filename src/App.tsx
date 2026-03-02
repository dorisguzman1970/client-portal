import { useEffect, useState } from 'react';
import Portal from './pages/Portal';
import { getAuthUser, login, logout, type AuthUser } from './auth/auth';
import type { AuthInfo } from './types';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedOut] = useState(() =>
    new URLSearchParams(window.location.search).get('signedout') === '1'
  );
  useEffect(() => {
    async function init() {
      try {
        const u = await getAuthUser();
        if (!u) { setLoading(false); return; }
        setUser(u);

        const res = await fetch('/api/check-access');
        const data = await res.json();

        if (data.authorized) {
          setAuthInfo({
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            userAdmin: data.userAdmin === true,
          });
        } else {
          setUnauthorized(true);
        }
      } catch {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <div className="center-screen"><p>Loading...</p></div>;

  if (!user) {
    if (signedOut) {
      return (
        <div className="center-screen">
          <div className="login-card">
            <h2>Sesión cerrada</h2>
            <p>Tu sesión ha sido cerrada correctamente.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={login}>
              Iniciar sesión
            </button>
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              ¿Quieres entrar con otra cuenta de GitHub?
            </p>
            <a
              href="https://github.com/logout"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Cerrar sesión en GitHub
            </a>
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              Se abrirá una pestaña nueva. Confirma el logout en GitHub, ciérrala y luego haz clic en "Iniciar sesión".
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="center-screen">
        <div className="login-card">
          <h2>Client Portal</h2>
          <p>Sign in with your corporate Microsoft account to continue.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={login}>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="center-screen">
        <div className="login-card">
          <h2>Access Denied</h2>
          <p>You are not authorized to access this application.</p>
          <p>Please contact your administrator to request access.</p>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!authInfo) return null;

  return <Portal authInfo={authInfo} onLogout={logout} />;
}

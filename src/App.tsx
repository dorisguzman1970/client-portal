import { useEffect, useState } from 'react';
import Portal from './pages/Portal';
import EmailVerification from './components/EmailVerification';
import { getAuthUser, login, logout, type AuthUser } from './auth/auth';
import type { AuthInfo } from './types';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requiresVerification, setRequiresVerification] = useState(false);

  async function fetchAuthInfo() {
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
  }

  useEffect(() => {
    async function init() {
      try {
        const u = await getAuthUser();
        if (!u) { setLoading(false); return; }
        setUser(u);

        const res = await fetch('/api/check-access');
        const data = await res.json();

        if (data.authorized) {
          const email = (u.userDetails || '').toLowerCase();
          const verified = sessionStorage.getItem('emailVerified');
          if (verified === email) {
            setAuthInfo({
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail,
              userAdmin: data.userAdmin === true,
            });
          } else {
            setRequiresVerification(true);
          }
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

  if (requiresVerification) {
    const email = (user.userDetails || '').toLowerCase();
    return (
      <EmailVerification
        userEmail={email}
        onVerified={async () => {
          sessionStorage.setItem('emailVerified', email);
          setRequiresVerification(false);
          await fetchAuthInfo();
        }}
      />
    );
  }

  if (!authInfo) return null;

  return <Portal authInfo={authInfo} onLogout={logout} />;
}

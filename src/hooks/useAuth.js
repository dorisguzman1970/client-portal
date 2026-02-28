import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authInfo, setAuthInfo] = useState(null); // { userId, userName, userEmail, userAdmin }
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const authRes = await fetch('/.auth/me');
        const authData = await authRes.json();

        if (!authData.clientPrincipal) {
          setLoading(false);
          return;
        }

        setUser(authData.clientPrincipal);

        const accessRes = await fetch('/api/check-access');
        const accessData = await accessRes.json();

        if (accessData.authorized) {
          setAuthorized(true);
          setAuthInfo({
            userId: accessData.userId,
            userName: accessData.userName,
            userEmail: accessData.userEmail,
            userAdmin: accessData.userAdmin === true,
          });
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return { user, authInfo, authorized, loading };
}

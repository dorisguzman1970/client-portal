import { useEffect, useState } from "react";
import Portal from "./pages/Portal";
import { getAuthUser, login, logout, type AuthUser } from "./auth/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  // Si no hay usuario, muestra botón para ir a Entra ID
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ width: 360 }}>
          <h2>Client Portal</h2>
          <p>Inicia sesión con tu cuenta corporativa.</p>
          <button style={{ width: "100%", padding: 10 }} onClick={login}>
            Iniciar sesión (Entra ID)
          </button>
        </div>
      </div>
    );
  }

  // user.userDetails suele ser el email/UPN
  return <Portal email={user.userDetails ?? "usuario"} onLogout={logout} />;
}
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import { getEmail } from "./auth/auth";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  if (!email) {
    return <Login onSuccess={(u) => setEmail(u.email)} />;
  }

  return <Portal email={email} onLogout={() => setEmail(null)} />;
}

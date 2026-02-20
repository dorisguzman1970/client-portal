import { useState } from "react";
import Login from "./pages/Login";
import Portal from "./pages/Portal";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);

  if (!email) return <Login onSuccess={(e) => setEmail(e)} />;

  return <Portal email={email} onLogout={() => setEmail(null)} />;
}
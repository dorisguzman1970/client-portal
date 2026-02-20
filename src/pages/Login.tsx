import { useState } from "react";
import { callMe } from "../api/client";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Correo inválido");
      return;
    }

    setLoading(true);
    const r = await callMe(email);
    setLoading(false);

    if (!r.ok) {
      setError(r.message ?? "No autorizado");
      return;
    }

    onSuccess(email);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: 340 }}>
        <h2>Client Portal</h2>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@empresa.com"
          style={{ width: "100%", padding: 10 }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button style={{ width: "100%", marginTop: 10 }} disabled={loading}>
          {loading ? "Validando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
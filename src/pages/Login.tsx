import { useState } from "react";
import { callMe } from "../api/client";
import { saveEmail } from "../auth/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login({ onSuccess }: { onSuccess: (user: { email: string; name?: string }) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("Pon un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const result = await callMe(trimmed);
      if (!result.ok) {
        setError("No autorizado. Verifica tu correo.");
        return;
      }
      saveEmail(trimmed);
      onSuccess({ email: trimmed, name: result.name });
    } catch {
      setError("Error llamando al servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ width: 360, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h1 style={{ margin: 0, marginBottom: 12 }}>Client Portal</h1>

        <label style={{ display: "block", marginBottom: 8 }}>
          Correo
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #ccc" }}
            autoFocus
          />
        </label>

        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          {loading ? "Validando..." : "Entrar"}
        </button>

        <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          *Por ahora esto valida por email (modo “prototipo”, sin magia negra).
        </p>
      </form>
    </div>
  );
}

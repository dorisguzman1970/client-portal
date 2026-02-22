const LOCAL_BYPASS = import.meta.env.VITE_LOCAL_BYPASS === "true";

export async function callMe(email: string): Promise<{ ok: boolean; message?: string }> {
  if (LOCAL_BYPASS) {
    // bypass local: deja pasar correos válidos
    return { ok: true };
  }

  const res = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) return { ok: false, message: data?.message ?? "No autorizado" };
  return { ok: data?.status === "ok", message: data?.message };
}
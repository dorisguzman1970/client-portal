export async function callMe(email: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) return { ok: false, message: data?.message ?? "No autorizado" };
  return { ok: data?.status === "ok", message: data?.message };
}
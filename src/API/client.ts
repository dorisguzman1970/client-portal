export async function callMe(email: string): Promise<{ ok: boolean; name?: string }> {
  const res = await fetch(import.meta.env.VITE_API_BASE_URL + "/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) return { ok: false };

  // asumo que tu function devuelve algo tipo { ok: true, name: "Doris" } o { ok: true }
  const data = await res.json().catch(() => ({}));
  return { ok: true, name: data?.name };
}

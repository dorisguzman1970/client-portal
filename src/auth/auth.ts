export type AuthUser = {
  userId?: string;
  userDetails?: string; // normalmente el email/UPN
  identityProvider?: string;
  userRoles?: string[];
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const res = await fetch("/.auth/me");
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const client = data?.clientPrincipal;
  return client ?? null;
}

export function login() {
  window.location.href = "/.auth/login/aad";
}

export function logout() {
  window.location.href = "/.auth/logout";
}
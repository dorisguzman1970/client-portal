const KEY = "client_portal_email";

export function saveEmail(email: string) {
  localStorage.setItem(KEY, email);
}

export function getEmail(): string | null {
  return localStorage.getItem(KEY);
}

export function clearEmail() {
  localStorage.removeItem(KEY);
}

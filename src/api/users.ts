import type { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load users');
  return res.json();
}

export async function createUser(data: Omit<User, 'id' | 'userId'>): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create user');
  return res.json();
}

export async function updateUser(data: Partial<User> & { id: string }): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update user');
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete user');
}

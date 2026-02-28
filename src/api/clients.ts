import type { Client } from '../types';

export async function getClients(): Promise<Client[]> {
  const res = await fetch('/api/clients');
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load clients');
  return res.json();
}

export async function createClient(data: Omit<Client, 'id' | 'clientId'>): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create client');
  return res.json();
}

export async function updateClient(data: Partial<Client> & { id: string }): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update client');
  return res.json();
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete client');
}

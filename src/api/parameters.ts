import type { Parameters } from '../types';

export async function getParameters(): Promise<Parameters | null> {
  const res = await fetch('/api/parameters');
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load parameters');
  return res.json();
}

export async function createParameters(data: Omit<Parameters, 'id'>): Promise<Parameters> {
  const res = await fetch('/api/parameters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create parameters');
  return res.json();
}

export async function updateParameters(data: Partial<Omit<Parameters, 'id'>>): Promise<Parameters> {
  const res = await fetch('/api/parameters', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update parameters');
  return res.json();
}

export async function deleteParameters(): Promise<void> {
  const res = await fetch('/api/parameters', { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete parameters');
}

import type { Building } from '../types';

export async function getBuildings(): Promise<Building[]> {
  const res = await fetch('/api/buildings');
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load buildings');
  return res.json();
}

export async function createBuilding(data: Omit<Building, 'id' | 'buildingId'>): Promise<Building> {
  const res = await fetch('/api/buildings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create building');
  return res.json();
}

export async function updateBuilding(data: Partial<Building> & { id: string }): Promise<Building> {
  const res = await fetch('/api/buildings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update building');
  return res.json();
}

export async function deleteBuilding(id: string): Promise<void> {
  const res = await fetch(`/api/buildings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete building');
}

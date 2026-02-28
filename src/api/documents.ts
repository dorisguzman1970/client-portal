import type { Document } from '../types';

export async function getDocuments(): Promise<Document[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load documents');
  return res.json();
}

export async function createDocument(data: Omit<Document, 'id' | 'documentId'>): Promise<Document> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create document');
  return res.json();
}

export async function updateDocument(data: Partial<Document> & { id: string }): Promise<Document> {
  const res = await fetch('/api/documents', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update document');
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete document');
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadBase64File(base64: string, fileName: string, mimeType = 'application/octet-stream') {
  const link = globalThis.document.createElement('a');
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = fileName;
  link.click();
}

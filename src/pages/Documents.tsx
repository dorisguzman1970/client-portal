import { useEffect, useState } from 'react';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { getDocuments, createDocument, updateDocument, deleteDocument, fileToBase64 } from '../api/documents';
import { getBuildings } from '../api/buildings';
import type { Document, Building, AuthInfo } from '../types';

interface DocumentsProps {
  authInfo: AuthInfo;
}

const EMPTY_FORM = { documentName: '', buildingId: 0, documentFile: '', documentFileName: '' };

export default function Documents({ authInfo }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [d, b] = await Promise.all([getDocuments(), getBuildings()]);
      setDocuments(d);
      setBuildings(b);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setForm({ documentName: doc.documentName, buildingId: doc.buildingId, documentFile: '', documentFileName: doc.documentFileName });
    setShowModal(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setForm(f => ({ ...f, documentFile: base64, documentFileName: file.name }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const payload: Partial<Document> & { id: string } = { id: editing.id, documentName: form.documentName, buildingId: form.buildingId };
        if (form.documentFile) { payload.documentFile = form.documentFile; payload.documentFileName = form.documentFileName; }
        await updateDocument(payload);
      } else {
        await createDocument(form);
      }
      await load();
      setShowModal(false);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete document "${doc.documentName}"?`)) return;
    try {
      await deleteDocument(doc.id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  function buildingName(buildingId: number) {
    return buildings.find(b => b.buildingId === buildingId)?.buildingName || String(buildingId);
  }

  const columns: Column<Document>[] = [
    { key: 'documentId', label: 'ID' },
    { key: 'documentName', label: 'Name' },
    { key: 'buildingId', label: 'Building', render: (d) => buildingName(d.buildingId) },
    { key: 'documentFileName', label: 'File' },
  ];

  return (
    <div>
      <DataTable
        title="Documents"
        columns={columns}
        rows={documents}
        isAdmin={authInfo.userAdmin}
        onAdd={authInfo.userAdmin ? openAdd : undefined}
        onEdit={authInfo.userAdmin ? openEdit : undefined}
        onDelete={authInfo.userAdmin ? handleDelete : undefined}
        loading={loading}
        error={error}
      />

      {showModal && (
        <Modal title={editing ? 'Edit Document' : 'Add Document'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Document Name *</label>
            <input value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Building *</label>
            <select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: Number(e.target.value) })}>
              <option value={0}>— Select building —</option>
              {buildings.map((b) => <option key={b.id} value={b.buildingId}>{b.buildingName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{editing ? 'Replace file (optional)' : 'Upload file *'}</label>
            <input type="file" onChange={handleFileChange} />
            {form.documentFileName && <small>Selected: {form.documentFileName}</small>}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

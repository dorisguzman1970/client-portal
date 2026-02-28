import { useEffect, useState } from 'react';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { getClients, createClient, updateClient, deleteClient } from '../api/clients';
import { getUsers } from '../api/users';
import type { Client, User, AuthInfo } from '../types';

interface ClientsProps {
  authInfo: AuthInfo;
  prefilledUserId?: number | null;
  onPrefilledHandled?: () => void;
}

const EMPTY_FORM = { clientName: '', userId: 0, clientPhone: '' };

export default function Clients({ authInfo, prefilledUserId, onPrefilledHandled }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [c, u] = await Promise.all([getClients(), authInfo.userAdmin ? getUsers() : Promise.resolve([])]);
      setClients(c);
      setUsers(u);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Auto-open modal when prefilledUserId is set (non-admin user creation flow)
  useEffect(() => {
    if (prefilledUserId != null) {
      setEditing(null);
      setForm({ clientName: '', userId: prefilledUserId, clientPhone: '' });
      setShowModal(true);
    }
  }, [prefilledUserId]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({ clientName: client.clientName, userId: client.userId, clientPhone: client.clientPhone });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateClient({ id: editing.id, ...form });
      } else {
        await createClient(form);
      }
      await load();
      setShowModal(false);
      if (prefilledUserId != null && onPrefilledHandled) onPrefilledHandled();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Delete client "${client.clientName}"?`)) return;
    try {
      await deleteClient(client.id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  function formatPhone(v: string) {
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  const columns: Column<Client>[] = [
    { key: 'clientId', label: 'ID' },
    { key: 'clientName', label: 'Name' },
    { key: 'clientPhone', label: 'Phone' },
    { key: 'userId', label: 'User ID' },
  ];

  return (
    <div>
      <DataTable
        title="Clients"
        columns={columns}
        rows={clients}
        isAdmin={authInfo.userAdmin}
        onAdd={authInfo.userAdmin ? openAdd : undefined}
        onEdit={authInfo.userAdmin ? openEdit : undefined}
        onDelete={authInfo.userAdmin ? handleDelete : undefined}
        loading={loading}
        error={error}
      />

      {showModal && (
        <Modal
          title={editing ? 'Edit Client' : 'Add Client'}
          onClose={() => { setShowModal(false); if (prefilledUserId != null && onPrefilledHandled) onPrefilledHandled(); }}
        >
          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone (US format)</label>
            <input
              placeholder="(555) 555-5555"
              value={form.clientPhone}
              onChange={(e) => setForm({ ...form, clientPhone: formatPhone(e.target.value) })}
              maxLength={14}
            />
          </div>
          <div className="form-group">
            <label>Linked User *</label>
            {authInfo.userAdmin ? (
              <select value={form.userId} onChange={(e) => setForm({ ...form, userId: Number(e.target.value) })}>
                <option value={0}>— Select user —</option>
                {users.map((u) => <option key={u.id} value={u.userId}>{u.userName} ({u.userEmail})</option>)}
              </select>
            ) : (
              <input value={authInfo.userId} readOnly />
            )}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); if (prefilledUserId != null && onPrefilledHandled) onPrefilledHandled(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import type { User, AuthInfo } from '../types';

interface UsersProps {
  authInfo: AuthInfo;
  onUserCreatedNonAdmin?: (userId: number) => void;
}

const EMPTY_FORM = { userName: '', userEmail: '', userAdmin: false };

export default function Users({ authInfo, onUserCreatedNonAdmin }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
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

  function openEdit(user: User) {
    setEditing(user);
    setForm({ userName: user.userName, userEmail: user.userEmail, userAdmin: user.userAdmin });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateUser({ id: editing.id, ...form });
        await load();
        setShowModal(false);
      } else {
        const created = await createUser(form);
        await load();
        setShowModal(false);
        // If non-admin user was created, trigger client creation flow
        if (!form.userAdmin && onUserCreatedNonAdmin) {
          onUserCreatedNonAdmin(created.userId);
        }
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.userName}"?`)) return;
    try {
      await deleteUser(user.id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  const columns: Column<User>[] = [
    { key: 'userId', label: 'ID' },
    { key: 'userName', label: 'Name' },
    { key: 'userEmail', label: 'Email' },
    { key: 'userAdmin', label: 'Admin', render: (u) => u.userAdmin ? 'Yes' : 'No' },
  ];

  if (!authInfo.userAdmin) {
    return <div className="alert alert-error">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <DataTable
        title="Users"
        columns={columns}
        rows={users}
        isAdmin={authInfo.userAdmin}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loading}
        error={error}
      />

      {showModal && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Name *</label>
            <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} />
          </div>
          <div className="form-group form-check">
            <input
              type="checkbox"
              id="userAdmin"
              checked={form.userAdmin}
              onChange={(e) => setForm({ ...form, userAdmin: e.target.checked })}
            />
            <label htmlFor="userAdmin">Administrator</label>
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

import { useEffect, useState } from 'react';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from '../api/buildings';
import { getClients } from '../api/clients';
import type { Building, Client, AuthInfo } from '../types';

interface BuildingsProps {
  authInfo: AuthInfo;
}

const EMPTY_FORM = { buildingName: '', clientId: 0, buildingAddress: '' };

export default function Buildings({ authInfo }: BuildingsProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [b, c] = await Promise.all([getBuildings(), getClients()]);
      setBuildings(b);
      setClients(c);
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

  function openEdit(building: Building) {
    setEditing(building);
    setForm({ buildingName: building.buildingName, clientId: building.clientId, buildingAddress: building.buildingAddress });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateBuilding({ id: editing.id, ...form });
      } else {
        await createBuilding(form);
      }
      await load();
      setShowModal(false);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(building: Building) {
    if (!confirm(`Delete building "${building.buildingName}"?`)) return;
    try {
      await deleteBuilding(building.id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  function clientName(clientId: number) {
    return clients.find(c => c.clientId === clientId)?.clientName || String(clientId);
  }

  const columns: Column<Building>[] = [
    { key: 'buildingId', label: 'ID' },
    { key: 'buildingName', label: 'Name' },
    { key: 'buildingAddress', label: 'Address' },
    { key: 'clientId', label: 'Client', render: (b) => clientName(b.clientId) },
  ];

  return (
    <div>
      <DataTable
        title="Buildings"
        columns={columns}
        rows={buildings}
        isAdmin={authInfo.userAdmin}
        onAdd={authInfo.userAdmin ? openAdd : undefined}
        onEdit={authInfo.userAdmin ? openEdit : undefined}
        onDelete={authInfo.userAdmin ? handleDelete : undefined}
        loading={loading}
        error={error}
      />

      {showModal && (
        <Modal title={editing ? 'Edit Building' : 'Add Building'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Building Name *</label>
            <input value={form.buildingName} onChange={(e) => setForm({ ...form, buildingName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.buildingAddress} onChange={(e) => setForm({ ...form, buildingAddress: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Client *</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: Number(e.target.value) })}>
              <option value={0}>— Select client —</option>
              {clients.map((c) => <option key={c.id} value={c.clientId}>{c.clientName}</option>)}
            </select>
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

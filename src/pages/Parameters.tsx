import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getParameters, createParameters, updateParameters, deleteParameters } from '../api/parameters';
import type { Parameters, AuthInfo } from '../types';

interface ParametersProps {
  authInfo: AuthInfo;
}

const EMPTY_FORM = { empName: '', empLogo: '', empLogoName: '' };

export default function ParametersPage({ authInfo }: ParametersProps) {
  const [params, setParams] = useState<Parameters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setParams(await getParameters());
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit() {
    if (!params) return;
    setForm({ empName: params.empName, empLogo: params.empLogo, empLogoName: params.empLogoName });
    setShowModal(true);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setForm(f => ({ ...f, empLogo: base64, empLogoName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (params) {
        await updateParameters(form);
      } else {
        await createParameters(form);
      }
      await load();
      setShowModal(false);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete company parameters? This will remove the name and logo from the welcome screen.')) return;
    try {
      await deleteParameters();
      setParams(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  if (!authInfo.userAdmin) {
    return <div className="alert alert-error">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <div className="table-toolbar">
        <h2>Company Parameters</h2>
        <div className="table-actions">
          {!params && <button className="btn btn-primary" onClick={openAdd}>+ Add</button>}
          {params && (
            <>
              <button className="btn btn-edit" onClick={openEdit}>Edit</button>
              <button className="btn btn-delete" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-text">Loading...</div>}

      {!loading && !params && (
        <p>No parameters configured. Click <strong>Add</strong> to set up the company name and logo.</p>
      )}

      {!loading && params && (
        <div className="params-card">
          {params.empLogo && (
            <img
              src={`data:image/*;base64,${params.empLogo}`}
              alt="Company logo"
              className="params-logo"
            />
          )}
          <div>
            <div className="params-label">Company Name</div>
            <div className="params-value">{params.empName}</div>
          </div>
          {params.empLogoName && (
            <div>
              <div className="params-label">Logo File</div>
              <div className="params-value">{params.empLogoName}</div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal title={params ? 'Edit Parameters' : 'Add Parameters'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Company Name *</label>
            <input value={form.empName} onChange={(e) => setForm({ ...form, empName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>{params?.empLogo ? 'Replace Logo (optional)' : 'Company Logo'}</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} />
            {form.empLogoName && <small>Selected: {form.empLogoName}</small>}
            {params?.empLogo && !form.empLogo && (
              <img src={`data:image/*;base64,${params.empLogo}`} alt="Current logo" style={{ height: 40, marginTop: 8 }} />
            )}
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

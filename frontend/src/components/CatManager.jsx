import { useState, useEffect } from 'react';
import { useCats } from '../context/CatContext';
import { apiFetch } from '../api';
import { CatAvatar, AVATAR_COLORS, AVATAR_EARS, AVATAR_EYES, AVATAR_PATTERNS, XIcon } from './Icons';

export default function CatManager() {
  const { cats, addCat, updateCat, deleteCat, selectedCatId, setSelectedCatId, refreshCats } = useCats();
  const [form, setForm] = useState({ name: '', breed: '', birth_date: '', weight: '' });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [customizingId, setCustomizingId] = useState(null);
  const [avatarForm, setAvatarForm] = useState({ color: '', ear: '', eye: '', pattern: '' });

  // Custom symptoms state
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [symptomError, setSymptomError] = useState('');

  useEffect(() => {
    apiFetch('/custom-symptoms').then(r => { if (r.ok) setCustomSymptoms(r.data); });
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    } else if (form.name.trim().length > 30) {
      errs.name = 'Name must be 30 characters or less';
    } else if (!/^[a-zA-Z0-9\s\-']+$/.test(form.name.trim())) {
      errs.name = 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    if (form.breed && form.breed.length > 50) {
      errs.breed = 'Breed must be 50 characters or less';
    }
    if (form.weight && (isNaN(form.weight) || Number(form.weight) <= 0 || Number(form.weight) > 50)) {
      errs.weight = 'Weight must be between 0 and 50 lbs';
    }
    if (form.birth_date) {
      const d = new Date(form.birth_date);
      if (d > new Date()) errs.birth_date = 'Birth date cannot be in the future';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSuccessMsg('');
    if (editingId) {
      await updateCat(editingId, form);
      setEditingId(null);
      setSuccessMsg(`${form.name} updated successfully!`);
    } else {
      const newCat = await addCat(form);
      setSuccessMsg(`${newCat.name} added! You can switch to them using the selector above.`);
    }
    setForm({ name: '', breed: '', birth_date: '', weight: '' });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, breed: cat.breed, birth_date: cat.birth_date, weight: cat.weight || '' });
    setErrors({});
    setSuccessMsg('');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name} and all their logs? This cannot be undone.`)) {
      await deleteCat(id);
      setSuccessMsg(`${name} has been removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Avatar customizer
  const startCustomize = (cat) => {
    setCustomizingId(cat.id);
    setAvatarForm({
      color: cat.avatar_color || '',
      ear: cat.avatar_ear || '',
      eye: cat.avatar_eye || '',
      pattern: cat.avatar_pattern || '',
    });
  };

  const saveAvatar = async () => {
    const result = await apiFetch(`/cats/${customizingId}/avatar`, { method: 'PUT', body: avatarForm });
    if (result.ok) {
      await refreshCats();
      setCustomizingId(null);
      setSuccessMsg('Avatar updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Custom symptoms
  const addCustomSymptom = async () => {
    setSymptomError('');
    if (!newSymptom.trim()) return;
    const result = await apiFetch('/custom-symptoms', { method: 'POST', body: { name: newSymptom.trim() } });
    if (result.ok) {
      setCustomSymptoms(prev => [...prev, result.data]);
      setNewSymptom('');
    } else {
      setSymptomError(result.error);
    }
  };

  const deleteCustomSymptom = async (id) => {
    await apiFetch(`/custom-symptoms/${id}`, { method: 'DELETE' });
    setCustomSymptoms(prev => prev.filter(s => s.id !== id));
  };

  const customizingCat = cats.find(c => c.id === customizingId);

  return (
    <div className="cat-manager">
      {/* ── Avatar Customizer Modal ── */}
      {customizingCat && (
        <div className="avatar-customizer-overlay" onClick={() => setCustomizingId(null)}>
          <div className="avatar-customizer" onClick={e => e.stopPropagation()}>
            <div className="avatar-customizer-header">
              <h3>Customize {customizingCat.name}'s Avatar</h3>
              <button className="btn-small" onClick={() => setCustomizingId(null)}><XIcon size={16} /></button>
            </div>

            <div className="avatar-preview">
              <CatAvatar
                name={customizingCat.name}
                size={96}
                avatarColor={avatarForm.color}
                avatarEar={avatarForm.ear}
                avatarEye={avatarForm.eye}
                avatarPattern={avatarForm.pattern}
              />
            </div>

            <div className="avatar-options">
              <div className="avatar-option-group">
                <label className="avatar-option-label">Fur Color</label>
                <div className="avatar-color-grid">
                  {Object.entries(AVATAR_COLORS).map(([key, { label, body }]) => (
                    <button key={key}
                      className={`avatar-color-btn ${avatarForm.color === key ? 'active' : ''}`}
                      style={{ backgroundColor: body }}
                      title={label}
                      onClick={() => setAvatarForm(f => ({ ...f, color: key }))}
                    />
                  ))}
                </div>
              </div>

              <div className="avatar-option-group">
                <label className="avatar-option-label">Ear Shape</label>
                <div className="avatar-chip-row">
                  {Object.entries(AVATAR_EARS).map(([key, label]) => (
                    <button key={key}
                      className={`filter-chip ${avatarForm.ear === key ? 'active' : ''}`}
                      onClick={() => setAvatarForm(f => ({ ...f, ear: key }))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="avatar-option-group">
                <label className="avatar-option-label">Eye Style</label>
                <div className="avatar-chip-row">
                  {Object.entries(AVATAR_EYES).map(([key, label]) => (
                    <button key={key}
                      className={`filter-chip ${avatarForm.eye === key ? 'active' : ''}`}
                      onClick={() => setAvatarForm(f => ({ ...f, eye: key }))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="avatar-option-group">
                <label className="avatar-option-label">Pattern</label>
                <div className="avatar-chip-row">
                  {Object.entries(AVATAR_PATTERNS).map(([key, label]) => (
                    <button key={key}
                      className={`filter-chip ${avatarForm.pattern === key ? 'active' : ''}`}
                      onClick={() => setAvatarForm(f => ({ ...f, pattern: key }))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn-primary" style={{ marginTop: 12 }} onClick={saveAvatar}>Save Avatar</button>
          </div>
        </div>
      )}

      <h2>My Cats</h2>

      {/* ── Cat Form ── */}
      <form className="cat-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Cat' : 'Add New Cat'}</h3>
        <div className="form-row">
          <label>
            Name <span className="required">*</span>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Mochi" className={errors.name ? 'input-error' : ''} maxLength={30} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Breed <span className="optional">optional</span>
            <input type="text" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })}
              placeholder="e.g., Tabby" className={errors.breed ? 'input-error' : ''} maxLength={50} />
            {errors.breed && <span className="field-error">{errors.breed}</span>}
          </label>
        </div>
        <div className="form-row">
          <label>
            Birth Date <span className="optional">optional</span>
            <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]} className={errors.birth_date ? 'input-error' : ''} />
            {errors.birth_date && <span className="field-error">{errors.birth_date}</span>}
          </label>
          <label>
            Weight (lbs) <span className="optional">optional</span>
            <input type="number" step="0.1" min="0" max="50" value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="e.g., 10"
              className={errors.weight ? 'input-error' : ''} />
            {errors.weight && <span className="field-error">{errors.weight}</span>}
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" style={{ margin: 0 }}>
            {editingId ? 'Update Cat' : 'Add Cat'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', breed: '', birth_date: '', weight: '' }); setErrors({}); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {successMsg && <div className="status-message success">{successMsg}</div>}

      {/* ── Cat List ── */}
      <div className="cat-list">
        {cats.length === 0 && <p className="empty-state">No cats added yet. Add your first cat above!</p>}
        {cats.map(cat => (
          <div key={cat.id} className={`cat-card ${cat.id === selectedCatId ? 'cat-card-selected' : ''}`}>
            <div className="cat-card-left">
              <CatAvatar name={cat.name} size={48}
                avatarColor={cat.avatar_color} avatarEar={cat.avatar_ear}
                avatarEye={cat.avatar_eye} avatarPattern={cat.avatar_pattern} />
              <div className="cat-info">
                <h3>{cat.name}</h3>
                <p>{[cat.breed, cat.birth_date, cat.weight ? `${cat.weight} lbs` : ''].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="cat-actions">
              <button onClick={() => startCustomize(cat)}>Avatar</button>
              {cat.id !== selectedCatId && (
                <button onClick={() => setSelectedCatId(cat.id)}>Switch to</button>
              )}
              <button onClick={() => startEdit(cat)}>Edit</button>
              <button className="btn-danger" onClick={() => handleDelete(cat.id, cat.name)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Custom Symptoms ── */}
      <div className="custom-symptoms-section">
        <h3>Custom Symptoms</h3>
        <p className="section-subtitle">Add custom symptoms to track alongside the built-in ones. These apply to all cats. (Max 10)</p>

        <div className="custom-symptom-add">
          <input type="text" value={newSymptom} onChange={e => setNewSymptom(e.target.value)}
            placeholder="e.g., excessive grooming" maxLength={50}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSymptom(); } }} />
          <button type="button" onClick={addCustomSymptom}
            disabled={!newSymptom.trim() || customSymptoms.length >= 10}>
            Add
          </button>
        </div>
        {symptomError && <span className="field-error">{symptomError}</span>}

        <div className="custom-symptom-list">
          {customSymptoms.length === 0 && <p className="empty-state" style={{ padding: '16px 0' }}>No custom symptoms yet.</p>}
          {customSymptoms.map(s => (
            <div key={s.id} className="custom-symptom-item">
              <span>{s.name}</span>
              <button className="btn-small btn-danger" onClick={() => deleteCustomSymptom(s.id)}><XIcon size={14} /></button>
            </div>
          ))}
        </div>
        {customSymptoms.length > 0 && (
          <p className="section-subtitle" style={{ marginTop: 8 }}>
            {customSymptoms.length}/10 custom symptoms used
          </p>
        )}
      </div>
    </div>
  );
}

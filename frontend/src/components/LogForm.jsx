import { useState, useEffect } from 'react';
import { useCats } from '../context/CatContext';
import { apiFetch } from '../api';
import { SYMPTOMS, METRIC_LABELS } from '../constants';

export default function LogForm() {
  const { selectedCat, selectedCatId } = useCats();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    appetite: 3, activity: 3, litter_box: 3, mood: 3, water_intake: 3,
    vomiting: false, sneezing: false, lethargy: false, diarrhea: false,
    notes: '',
  });
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [activeCustomSymptoms, setActiveCustomSymptoms] = useState([]);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Load custom symptoms
  useEffect(() => {
    apiFetch('/custom-symptoms').then(r => { if (r.ok) setCustomSymptoms(r.data); });
  }, []);

  if (!selectedCat) {
    return <div className="empty-state">Please add a cat first from the "My Cats" page.</div>;
  }

  const validate = () => {
    const errs = {};
    if (!form.date) {
      errs.date = 'Date is required';
    } else if (form.date > today) {
      errs.date = 'Cannot log for future dates';
    }
    if (form.notes.length > 500) {
      errs.notes = 'Notes must be 500 characters or less';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSlider = (metric, value) => {
    setForm(prev => ({ ...prev, [metric]: Number(value) }));
  };

  const handleToggle = (symptom) => {
    setForm(prev => ({ ...prev, [symptom]: !prev[symptom] }));
  };

  const toggleCustomSymptom = (id) => {
    setActiveCustomSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus(null);

    const result = await apiFetch(`/cats/${selectedCatId}/logs`, { method: 'POST', body: form });
    if (result.ok) {
      setStatus({ type: 'success', message: 'Log saved! You can add another entry for today if needed.' });
    } else {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    // Save custom symptoms for this log entry using the saved date
    if (activeCustomSymptoms.length > 0 && result.data) {
      await apiFetch(`/cats/${selectedCatId}/logs/${form.date}/custom-symptoms`, {
        method: 'PUT',
        body: { symptomIds: activeCustomSymptoms },
      });
    }
  };

  return (
    <div className="log-form">
      <h2>Daily Log for {selectedCat.name}</h2>

      <form onSubmit={handleSubmit}>
        <label className="date-input">
          Date <span className="required">*</span>
          <input type="date" value={form.date} max={today}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className={errors.date ? 'input-error' : ''} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </label>

        <div className="metrics-section">
          <h3>Behavior Metrics <span className="required">*</span></h3>
          {Object.entries(METRIC_LABELS).map(([metric, labels]) => (
            <div key={metric} className="slider-group">
              <div className="slider-header">
                <span className="metric-name">{metric.replace(/_/g, ' ')}</span>
                <span className="metric-value">{form[metric]}/5 — {labels[form[metric] - 1]}</span>
              </div>
              <input type="range" min="1" max="5" step="1" value={form[metric]}
                onChange={e => handleSlider(metric, e.target.value)}
                className={`slider slider-${form[metric] <= 2 ? 'low' : form[metric] >= 4 ? 'high' : 'mid'}`} />
              <div className="slider-labels">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>
          ))}
        </div>

        <div className="symptoms-section">
          <h3>Symptoms <span className="optional">optional</span></h3>
          <div className="toggle-grid">
            {SYMPTOMS.map(symptom => (
              <button key={symptom} type="button"
                className={`toggle-btn ${form[symptom] ? 'active' : ''}`}
                onClick={() => handleToggle(symptom)}>
                {symptom.charAt(0).toUpperCase() + symptom.slice(1)}
                {form[symptom] && <span className="toggle-check"> ✓</span>}
              </button>
            ))}
            {customSymptoms.map(cs => (
              <button key={`custom-${cs.id}`} type="button"
                className={`toggle-btn ${activeCustomSymptoms.includes(cs.id) ? 'active' : ''}`}
                onClick={() => toggleCustomSymptom(cs.id)}>
                {cs.name}
                {activeCustomSymptoms.includes(cs.id) && <span className="toggle-check"> ✓</span>}
              </button>
            ))}
          </div>
        </div>

        <label className="notes-input">
          Notes <span className="optional">optional</span>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional observations..." rows={3} maxLength={500}
            className={errors.notes ? 'input-error' : ''} />
          <span className="char-count">{form.notes.length}/500</span>
          {errors.notes && <span className="field-error">{errors.notes}</span>}
        </label>

        <button type="submit" className="btn-primary">Save Log</button>

        {status && (
          <div className={`status-message ${status.type}`}>{status.message}</div>
        )}
      </form>
    </div>
  );
}

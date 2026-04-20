import { useState } from 'react';
import { useCats } from '../context/CatContext';
import { CatFaceIcon, ChartIcon, BellIcon } from './Icons';

export default function Onboarding() {
  const { addCat, setSelectedCatId } = useCats();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', breed: '', birth_date: '', weight: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    } else if (form.name.trim().length > 30) {
      errs.name = 'Name must be 30 characters or less';
    } else if (!/^[a-zA-Z0-9\s\-']+$/.test(form.name.trim())) {
      errs.name = 'Only letters, numbers, spaces, hyphens, and apostrophes';
    }
    if (form.weight && (isNaN(form.weight) || Number(form.weight) <= 0 || Number(form.weight) > 50)) {
      errs.weight = 'Weight must be between 0 and 50 lbs';
    }
    if (form.birth_date && new Date(form.birth_date) > new Date()) {
      errs.birth_date = 'Birth date cannot be in the future';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const newCat = await addCat(form);
    setSelectedCatId(newCat.id);
    setSaving(false);
  };

  if (step === 0) {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="onboarding-art">
            <SleepingCatArt />
          </div>
          <h1>Welcome to WhiskerWatch</h1>
          <p className="onboarding-subtitle">
            Track your cat's daily behaviors, spot health trends early, and keep your feline friend happy and healthy.
          </p>
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <div className="feature-icon-wrap"><CatFaceIcon size={22} color="var(--primary)" /></div>
              <div>
                <strong>Daily Logging</strong>
                <p>Quick, easy behavior tracking with sliders and toggles</p>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="feature-icon-wrap"><ChartIcon size={22} color="var(--primary)" /></div>
              <div>
                <strong>Smart Analytics</strong>
                <p>Interactive charts and personalized health scores</p>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="feature-icon-wrap"><BellIcon size={22} color="var(--primary)" /></div>
              <div>
                <strong>Pattern Alerts</strong>
                <p>Automatic warnings when something seems off</p>
              </div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setStep(1)}>
            Get Started — Add Your Cat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-step-label">Step 1 of 1</div>
        <h2>Tell us about your cat</h2>
        <p className="onboarding-subtitle">You can always edit this later or add more cats.</p>

        <div className="onboarding-form">
          <label>
            Name <span className="required">*</span>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Mochi, Luna, Whiskers..."
              autoFocus
              maxLength={30}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Breed <span className="optional">optional</span>
            <input
              type="text"
              value={form.breed}
              onChange={e => setForm({ ...form, breed: e.target.value })}
              placeholder="e.g., Siamese, Tabby, Persian..."
              maxLength={50}
            />
          </label>
          <div className="form-row">
            <label>
              Birth Date <span className="optional">optional</span>
              <input
                type="date"
                value={form.birth_date}
                onChange={e => setForm({ ...form, birth_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className={errors.birth_date ? 'input-error' : ''}
              />
              {errors.birth_date && <span className="field-error">{errors.birth_date}</span>}
            </label>
            <label>
              Weight (lbs) <span className="optional">optional</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                placeholder="e.g., 10"
                className={errors.weight ? 'input-error' : ''}
              />
              {errors.weight && <span className="field-error">{errors.weight}</span>}
            </label>
          </div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
          >
            {saving ? 'Saving...' : 'Add Cat & Start Tracking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SleepingCatArt() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      {/* body curl */}
      <ellipse cx="60" cy="55" rx="40" ry="18" fill="#F4C79E" />
      {/* head */}
      <ellipse cx="30" cy="42" rx="18" ry="16" fill="#F4C79E" />
      {/* ears */}
      <path d="M18 28L22 18L30 28" fill="#F4C79E" stroke="#F4C79E" strokeWidth="1" />
      <path d="M20 28L22 21L27 28" fill="#F8D4BC" />
      <path d="M30 28L38 18L42 28" fill="#F4C79E" stroke="#F4C79E" strokeWidth="1" />
      <path d="M33 28L38 21L40 28" fill="#F8D4BC" />
      {/* closed eyes */}
      <path d="M23 42C24 40 27 40 28 42" stroke="#4A3728" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M33 42C34 40 37 40 38 42" stroke="#4A3728" strokeWidth="1.8" strokeLinecap="round" />
      {/* nose */}
      <path d="M30 45L29 46.5H31L30 45Z" fill="#E8A090" />
      {/* whiskers */}
      <line x1="22" y1="45" x2="10" y2="43" stroke="#D4B4A0" strokeWidth="1" />
      <line x1="22" y1="47" x2="10" y2="48" stroke="#D4B4A0" strokeWidth="1" />
      <line x1="38" y1="45" x2="48" y2="43" stroke="#D4B4A0" strokeWidth="1" />
      <line x1="38" y1="47" x2="48" y2="48" stroke="#D4B4A0" strokeWidth="1" />
      {/* tail */}
      <path d="M100 50C105 45 108 40 105 35" stroke="#F4C79E" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* paws tucked */}
      <ellipse cx="45" cy="65" rx="6" ry="4" fill="#F8D4BC" />
      <ellipse cx="75" cy="65" rx="6" ry="4" fill="#F8D4BC" />
      {/* zzz */}
      <text x="48" y="28" fill="#D4B4A0" fontSize="10" fontFamily="Nunito" fontWeight="700" opacity="0.6">z</text>
      <text x="55" y="22" fill="#D4B4A0" fontSize="12" fontFamily="Nunito" fontWeight="700" opacity="0.4">z</text>
      <text x="63" y="14" fill="#D4B4A0" fontSize="14" fontFamily="Nunito" fontWeight="700" opacity="0.25">z</text>
    </svg>
  );
}

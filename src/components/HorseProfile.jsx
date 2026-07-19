import { useState, useRef } from "react";
import "./HorseProfile.css";

const BREEDS = [
  "Arabian",
  "Thoroughbred",
  "Quarter Horse",
  "Appaloosa",
  "Paint Horse",
  "Morgan",
  "Tennessee Walking Horse",
  "Andalusian",
  "Friesian",
  "Clydesdale",
  "Mustang",
  "Warmblood",
  "Shetland Pony",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  breed: "",
  age: "",
  color: "",
  notes: "",
  photo: null,
  vaccinations: [{ name: "", date: "" }],
};

/**
 * HorseProfile
 *
 * Props:
 *   initialData  – optional pre-populated profile object (shape matches EMPTY_FORM)
 *   onSave(data) – called with the saved profile object
 *   onCancel()   – called when the user dismisses the form
 */
export default function HorseProfile({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialData });
  const [photoPreview, setPhotoPreview] = useState(
    initialData?.photoUrl ?? null
  );
  const [toast, setToast] = useState(false);
  const fileInputRef = useRef(null);

  /* ── field helpers ── */
  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── photo upload ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setField("photo", file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* ── vaccinations ── */
  const setVaccField = (idx, key, value) =>
    setForm((prev) => {
      const updated = prev.vaccinations.map((v, i) =>
        i === idx ? { ...v, [key]: value } : v
      );
      return { ...prev, vaccinations: updated };
    });

  const addVaccination = () =>
    setForm((prev) => ({
      ...prev,
      vaccinations: [...prev.vaccinations, { name: "", date: "" }],
    }));

  const removeVaccination = (idx) =>
    setForm((prev) => ({
      ...prev,
      vaccinations: prev.vaccinations.filter((_, i) => i !== idx),
    }));

  /* ── save ── */
  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      photoUrl: photoPreview,
      savedAt: new Date().toISOString(),
    };
    onSave?.(payload);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="horse-profile-overlay" role="dialog" aria-modal="true">
      <div className="horse-profile-card">
        {/* ── Header ── */}
        <header className="horse-profile-header">
          <span className="horse-icon" aria-hidden="true">🐴</span>
          <h2>Horse Profile</h2>
        </header>

        <form onSubmit={handleSave} noValidate>
          <div className="horse-profile-body">
            {/* ── Photo ── */}
            <div className="photo-upload-section">
              <div className="photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Horse photo preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span className="photo-placeholder-icon" aria-hidden="true">🐎</span>
                    <span>No photo</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="photo-upload-input"
                aria-label="Upload horse photo"
                onChange={handlePhotoChange}
              />
            </div>

            <hr className="section-divider" />

            {/* ── Basic info ── */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="horse-name">Horse Name</label>
                <input
                  id="horse-name"
                  type="text"
                  placeholder="e.g. Shadowfax"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse-age">Age (years)</label>
                <input
                  id="horse-age"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g. 6"
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse-breed">Breed</label>
                <select
                  id="horse-breed"
                  value={form.breed}
                  onChange={(e) => setField("breed", e.target.value)}
                >
                  <option value="">Select a breed…</option>
                  {BREEDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="horse-color">Coat Color</label>
                <input
                  id="horse-color"
                  type="text"
                  placeholder="e.g. Bay, Chestnut"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="horse-notes">Notes</label>
                <textarea
                  id="horse-notes"
                  placeholder="Temperament, special care, diet…"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </div>

            <hr className="section-divider" />

            {/* ── Vaccinations ── */}
            <div className="vaccination-section">
              <h3>
                <span aria-hidden="true">💉</span> Vaccination Records
              </h3>
              <div className="vaccination-list">
                {form.vaccinations.map((vacc, idx) => (
                  <div key={idx} className="vaccination-row">
                    <input
                      type="text"
                      placeholder="Vaccine name"
                      aria-label={`Vaccine ${idx + 1} name`}
                      value={vacc.name}
                      onChange={(e) => setVaccField(idx, "name", e.target.value)}
                    />
                    <input
                      type="date"
                      aria-label={`Vaccine ${idx + 1} date`}
                      value={vacc.date}
                      onChange={(e) => setVaccField(idx, "date", e.target.value)}
                    />
                    {form.vaccinations.length > 1 && (
                      <button
                        type="button"
                        className="remove-vacc-btn"
                        aria-label={`Remove vaccination ${idx + 1}`}
                        onClick={() => removeVaccination(idx)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-vacc-btn"
                onClick={addVaccination}
              >
                + Add Vaccination
              </button>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="horse-profile-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Profile
            </button>
          </footer>
        </form>
      </div>

      {toast && (
        <div className="toast" role="status">
          ✓ Horse profile saved!
        </div>
      )}
    </div>
  );
}

// Components/TrailLog.js
// Component for logging and displaying trail rides

import React, { useState } from "react";

const initialFormState = {
  date: "",
  trailName: "",
  distanceMiles: "",
  durationMinutes: "",
  horse: "",
  terrain: "Mixed",
  weatherConditions: "",
  notes: "",
  photos: [],
};

const TERRAIN_OPTIONS = ["Flat", "Hilly", "Rocky", "Wooded", "Mixed", "Desert", "Beach"];

/**
 * TrailLog component
 * Allows users to add new trail ride entries and view a history of past rides.
 *
 * Props:
 *   entries     {Array}    - list of existing trail log entries
 *   horses      {Array}    - list of horse names available for selection
 *   onAddEntry  {Function} - callback(entry) called when a new entry is submitted
 */
function TrailLog({ entries = [], horses = [], onAddEntry }) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  function validate(data) {
    const errs = {};
    if (!data.date) errs.date = "Date is required.";
    if (!data.trailName.trim()) errs.trailName = "Trail name is required.";
    if (!data.horse.trim()) errs.horse = "Horse is required.";
    if (data.distanceMiles && isNaN(Number(data.distanceMiles))) {
      errs.distanceMiles = "Distance must be a number.";
    }
    if (data.durationMinutes && isNaN(Number(data.durationMinutes))) {
      errs.durationMinutes = "Duration must be a number.";
    }
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const newEntry = {
      ...form,
      id: Date.now(),
      distanceMiles: form.distanceMiles ? Number(form.distanceMiles) : null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      createdAt: new Date().toISOString(),
    };
    if (onAddEntry) onAddEntry(newEntry);
    setForm(initialFormState);
    setErrors({});
    setShowForm(false);
  }

  function formatDuration(minutes) {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="trail-log">
      <div className="trail-log__header">
        <h2>Trail Log</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Ride"}
        </button>
      </div>

      {showForm && (
        <form className="trail-log__form" onSubmit={handleSubmit}>
          <label>
            Date *
            <input type="date" name="date" value={form.date} onChange={handleChange} />
            {errors.date && <span className="error">{errors.date}</span>}
          </label>

          <label>
            Trail Name *
            <input
              type="text"
              name="trailName"
              value={form.trailName}
              placeholder="e.g. Blue Ridge Loop"
              onChange={handleChange}
            />
            {errors.trailName && <span className="error">{errors.trailName}</span>}
          </label>

          <label>
            Horse *
            <select name="horse" value={form.horse} onChange={handleChange}>
              <option value="">Select a horse</option>
              {horses.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            {errors.horse && <span className="error">{errors.horse}</span>}
          </label>

          <label>
            Distance (miles)
            <input
              type="number"
              name="distanceMiles"
              value={form.distanceMiles}
              min="0"
              step="0.1"
              onChange={handleChange}
            />
            {errors.distanceMiles && <span className="error">{errors.distanceMiles}</span>}
          </label>

          <label>
            Duration (minutes)
            <input
              type="number"
              name="durationMinutes"
              value={form.durationMinutes}
              min="0"
              onChange={handleChange}
            />
            {errors.durationMinutes && <span className="error">{errors.durationMinutes}</span>}
          </label>

          <label>
            Terrain
            <select name="terrain" value={form.terrain} onChange={handleChange}>
              {TERRAIN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Weather / Conditions
            <input
              type="text"
              name="weatherConditions"
              value={form.weatherConditions}
              placeholder="e.g. Sunny, 72°F"
              onChange={handleChange}
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              placeholder="How did it go?"
              onChange={handleChange}
            />
          </label>

          <button type="submit">Save Ride</button>
        </form>
      )}

      <div className="trail-log__entries">
        {entries.length === 0 && (
          <p className="trail-log__empty">No trail rides recorded yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="trail-log__entry">
            <div className="trail-log__entry-header">
              <strong>{entry.trailName}</strong>
              <span>{entry.date}</span>
            </div>
            <div className="trail-log__entry-meta">
              <span>🐴 {entry.horse}</span>
              {entry.distanceMiles && <span>📍 {entry.distanceMiles} mi</span>}
              {entry.durationMinutes && (
                <span>⏱ {formatDuration(entry.durationMinutes)}</span>
              )}
              <span>🏔 {entry.terrain}</span>
              {entry.weatherConditions && <span>🌤 {entry.weatherConditions}</span>}
            </div>
            {entry.notes && <p className="trail-log__entry-notes">{entry.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrailLog;

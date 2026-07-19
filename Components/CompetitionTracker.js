// Components/CompetitionTracker.js
// Component for tracking horse competition events and results

import React, { useState } from "react";

const initialFormState = {
  eventName: "",
  date: "",
  location: "",
  discipline: "",
  horse: "",
  rider: "",
  placing: "",
  score: "",
  notes: "",
};

const DISCIPLINE_OPTIONS = [
  "Dressage",
  "Show Jumping",
  "Cross Country",
  "Western Pleasure",
  "Barrel Racing",
  "Reining",
  "Hunter/Jumper",
  "Endurance",
  "Trail",
  "Rodeo",
  "Other",
];

/**
 * CompetitionTracker component
 * Allows users to log competition results and view their competition history.
 *
 * Props:
 *   competitions  {Array}    - list of existing competition entries
 *   horses        {Array}    - list of horse names available for selection
 *   onAddEntry    {Function} - callback(entry) called when a new entry is submitted
 */
function CompetitionTracker({ competitions = [], horses = [], onAddEntry }) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState("All");

  function validate(data) {
    const errs = {};
    if (!data.eventName.trim()) errs.eventName = "Event name is required.";
    if (!data.date) errs.date = "Date is required.";
    if (!data.horse.trim()) errs.horse = "Horse is required.";
    if (!data.discipline) errs.discipline = "Discipline is required.";
    if (data.placing && isNaN(Number(data.placing))) {
      errs.placing = "Placing must be a number.";
    }
    if (data.score && isNaN(Number(data.score))) {
      errs.score = "Score must be a number.";
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
      placing: form.placing ? Number(form.placing) : null,
      score: form.score ? Number(form.score) : null,
      createdAt: new Date().toISOString(),
    };
    if (onAddEntry) onAddEntry(newEntry);
    setForm(initialFormState);
    setErrors({});
    setShowForm(false);
  }

  function placingLabel(placing) {
    if (!placing) return null;
    const suffixes = { 1: "st", 2: "nd", 3: "rd" };
    return `${placing}${suffixes[placing] || "th"}`;
  }

  const disciplineOptions = ["All", ...DISCIPLINE_OPTIONS];

  const filtered =
    filterDiscipline === "All"
      ? competitions
      : competitions.filter((c) => c.discipline === filterDiscipline);

  return (
    <div className="competition-tracker">
      <div className="competition-tracker__header">
        <h2>Competition Tracker</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Competition"}
        </button>
      </div>

      {showForm && (
        <form className="competition-tracker__form" onSubmit={handleSubmit}>
          <label>
            Event Name *
            <input
              type="text"
              name="eventName"
              value={form.eventName}
              placeholder="e.g. Sunrise Classic Show"
              onChange={handleChange}
            />
            {errors.eventName && <span className="error">{errors.eventName}</span>}
          </label>

          <label>
            Date *
            <input type="date" name="date" value={form.date} onChange={handleChange} />
            {errors.date && <span className="error">{errors.date}</span>}
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              value={form.location}
              placeholder="e.g. Riverside Equestrian Center"
              onChange={handleChange}
            />
          </label>

          <label>
            Discipline *
            <select name="discipline" value={form.discipline} onChange={handleChange}>
              <option value="">Select a discipline</option>
              {DISCIPLINE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.discipline && <span className="error">{errors.discipline}</span>}
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
            Rider
            <input
              type="text"
              name="rider"
              value={form.rider}
              placeholder="Rider name"
              onChange={handleChange}
            />
          </label>

          <label>
            Placing
            <input
              type="number"
              name="placing"
              value={form.placing}
              min="1"
              placeholder="e.g. 1"
              onChange={handleChange}
            />
            {errors.placing && <span className="error">{errors.placing}</span>}
          </label>

          <label>
            Score
            <input
              type="number"
              name="score"
              value={form.score}
              step="0.01"
              placeholder="e.g. 68.5"
              onChange={handleChange}
            />
            {errors.score && <span className="error">{errors.score}</span>}
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              placeholder="Any observations or highlights?"
              onChange={handleChange}
            />
          </label>

          <button type="submit">Save Competition</button>
        </form>
      )}

      <div className="competition-tracker__filter">
        <label>
          Filter by Discipline:
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
          >
            {disciplineOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="competition-tracker__list">
        {filtered.length === 0 && (
          <p className="competition-tracker__empty">No competitions recorded yet.</p>
        )}
        {filtered.map((comp) => (
          <div key={comp.id} className="competition-tracker__entry">
            <div className="competition-tracker__entry-header">
              <strong>{comp.eventName}</strong>
              <span>{comp.date}</span>
            </div>
            <div className="competition-tracker__entry-meta">
              <span>🐴 {comp.horse}</span>
              <span>🏇 {comp.discipline}</span>
              {comp.location && <span>📍 {comp.location}</span>}
              {comp.rider && <span>👤 {comp.rider}</span>}
              {comp.placing && (
                <span className="competition-tracker__placing">
                  🥇 {placingLabel(comp.placing)} place
                </span>
              )}
              {comp.score != null && <span>📊 Score: {comp.score}</span>}
            </div>
            {comp.notes && (
              <p className="competition-tracker__entry-notes">{comp.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompetitionTracker;

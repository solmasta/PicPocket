// Components/VetRecords.js
// Component for managing veterinary records for horses

import React, { useState } from "react";

const initialFormState = {
  date: "",
  horse: "",
  vetName: "",
  visitType: "",
  diagnosis: "",
  treatment: "",
  medications: "",
  followUpDate: "",
  cost: "",
  notes: "",
};

const VISIT_TYPE_OPTIONS = [
  "Wellness Check",
  "Vaccination",
  "Deworming",
  "Dental",
  "Farrier",
  "Injury",
  "Illness",
  "Surgery",
  "Chiropractic",
  "Emergency",
  "Lab Work",
  "Other",
];

/**
 * VetRecords component
 * Allows users to log veterinary visits and view a horse's medical history.
 *
 * Props:
 *   records     {Array}    - list of existing vet record entries
 *   horses      {Array}    - list of horse names available for selection
 *   onAddRecord {Function} - callback(record) called when a new record is submitted
 */
function VetRecords({ records = [], horses = [], onAddRecord }) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [filterHorse, setFilterHorse] = useState("All");

  function validate(data) {
    const errs = {};
    if (!data.date) errs.date = "Date is required.";
    if (!data.horse.trim()) errs.horse = "Horse is required.";
    if (!data.visitType) errs.visitType = "Visit type is required.";
    if (data.cost && isNaN(Number(data.cost))) {
      errs.cost = "Cost must be a number.";
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
    const newRecord = {
      ...form,
      id: Date.now(),
      cost: form.cost ? Number(form.cost) : null,
      createdAt: new Date().toISOString(),
    };
    if (onAddRecord) onAddRecord(newRecord);
    setForm(initialFormState);
    setErrors({});
    setShowForm(false);
  }

  const horseOptions = ["All", ...horses];

  const filtered =
    filterHorse === "All"
      ? records
      : records.filter((r) => r.horse === filterHorse);

  const sorted = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));

  function formatCost(cost) {
    if (cost == null) return null;
    return `$${cost.toFixed(2)}`;
  }

  return (
    <div className="vet-records">
      <div className="vet-records__header">
        <h2>Vet Records</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Record"}
        </button>
      </div>

      {showForm && (
        <form className="vet-records__form" onSubmit={handleSubmit}>
          <label>
            Date *
            <input type="date" name="date" value={form.date} onChange={handleChange} />
            {errors.date && <span className="error">{errors.date}</span>}
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
            Visit Type *
            <select name="visitType" value={form.visitType} onChange={handleChange}>
              <option value="">Select visit type</option>
              {VISIT_TYPE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {errors.visitType && <span className="error">{errors.visitType}</span>}
          </label>

          <label>
            Veterinarian
            <input
              type="text"
              name="vetName"
              value={form.vetName}
              placeholder="Vet's name or clinic"
              onChange={handleChange}
            />
          </label>

          <label>
            Diagnosis
            <input
              type="text"
              name="diagnosis"
              value={form.diagnosis}
              placeholder="e.g. Mild lameness in left foreleg"
              onChange={handleChange}
            />
          </label>

          <label>
            Treatment
            <textarea
              name="treatment"
              value={form.treatment}
              placeholder="Describe the treatment given"
              onChange={handleChange}
            />
          </label>

          <label>
            Medications
            <input
              type="text"
              name="medications"
              value={form.medications}
              placeholder="e.g. Bute 1g/day for 5 days"
              onChange={handleChange}
            />
          </label>

          <label>
            Follow-Up Date
            <input
              type="date"
              name="followUpDate"
              value={form.followUpDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Cost ($)
            <input
              type="number"
              name="cost"
              value={form.cost}
              min="0"
              step="0.01"
              placeholder="0.00"
              onChange={handleChange}
            />
            {errors.cost && <span className="error">{errors.cost}</span>}
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              placeholder="Additional observations or instructions"
              onChange={handleChange}
            />
          </label>

          <button type="submit">Save Record</button>
        </form>
      )}

      {horses.length > 1 && (
        <div className="vet-records__filter">
          <label>
            Filter by Horse:
            <select
              value={filterHorse}
              onChange={(e) => setFilterHorse(e.target.value)}
            >
              {horseOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="vet-records__list">
        {sorted.length === 0 && (
          <p className="vet-records__empty">No vet records found.</p>
        )}
        {sorted.map((record) => (
          <div key={record.id} className="vet-records__entry">
            <div className="vet-records__entry-header">
              <strong>{record.visitType}</strong>
              <span>{record.date}</span>
            </div>
            <div className="vet-records__entry-meta">
              <span>🐴 {record.horse}</span>
              {record.vetName && <span>👨‍⚕️ {record.vetName}</span>}
              {record.cost != null && (
                <span>💰 {formatCost(record.cost)}</span>
              )}
              {record.followUpDate && (
                <span>📅 Follow-up: {record.followUpDate}</span>
              )}
            </div>
            {record.diagnosis && (
              <p className="vet-records__diagnosis">
                <strong>Diagnosis:</strong> {record.diagnosis}
              </p>
            )}
            {record.treatment && (
              <p className="vet-records__treatment">
                <strong>Treatment:</strong> {record.treatment}
              </p>
            )}
            {record.medications && (
              <p className="vet-records__medications">
                <strong>Medications:</strong> {record.medications}
              </p>
            )}
            {record.notes && (
              <p className="vet-records__notes">{record.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VetRecords;

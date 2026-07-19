import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import DatePicker from 'react-datepicker';
import type { Horse, RidingDiscipline, TrainingSession } from '../types';

const DISCIPLINES: RidingDiscipline[] = [
  'Dressage',
  'Show Jumping',
  'Cross Country',
  'Trail Riding',
  'Western Pleasure',
  'Barrel Racing',
  'Endurance',
  'Other',
];

interface TrainingLogFormProps {
  horses: Horse[];
  onSave: (session: Omit<TrainingSession, 'id'>) => void;
}

export default function TrainingLogForm({ horses, onSave }: TrainingLogFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [horseId, setHorseId] = useState<string>(horses[0]?.id ?? '');
  const [discipline, setDiscipline] = useState<RidingDiscipline>('Dressage');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [performanceScore, setPerformanceScore] = useState<number>(7);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoDataUrl(result);
      setPhotoPreview(result);
      setPhotoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoDataUrl(undefined);
    setPhotoPreview(undefined);
    setPhotoFileName(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horseId) return;
    onSave({
      date: date.toISOString(),
      horseId,
      discipline,
      durationMinutes,
      notes,
      performanceScore,
      photoDataUrl,
      photoFileName,
    });
    setNotes('');
    setPerformanceScore(7);
    setDurationMinutes(60);
    setPhotoDataUrl(undefined);
    setPhotoPreview(undefined);
    setPhotoFileName(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
    >
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <span className="text-2xl">🐴</span> Log a Training Session
      </h2>

      {/* Date Picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Ride Date
        </label>
        <DatePicker
          selected={date}
          onChange={(d: Date | null) => d && setDate(d)}
          dateFormat="MMMM d, yyyy"
          maxDate={new Date()}
          showPopperArrow={false}
          placeholderText="Select a date"
        />
      </div>

      {/* Horse Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Horse
        </label>
        {horses.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            No horses added yet. Add a horse below.
          </p>
        ) : (
          <select
            value={horseId}
            onChange={(e) => setHorseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
            required
          >
            {horses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.breed})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Discipline */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Discipline
        </label>
        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value as RidingDiscipline)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
        >
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Duration & Performance Score side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={480}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Performance Score (1–10)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={10}
              value={performanceScore}
              onChange={(e) => setPerformanceScore(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-sm font-bold text-indigo-600 w-6 text-center">
              {performanceScore}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Session Photo
        </label>
        {photoPreview ? (
          <div className="relative inline-block">
            <img
              src={photoPreview}
              alt="Session preview"
              className="h-32 w-full object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              ✕
            </button>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
              {photoFileName}
            </p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <span className="text-3xl">📷</span>
            <span className="text-sm text-indigo-600 font-medium mt-1">
              Click to upload a photo
            </span>
            <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Ride Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what you worked on today, how the horse felt, any achievements or challenges..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={horses.length === 0}
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Session
      </button>
    </form>
  );
}

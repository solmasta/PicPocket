import { useState } from 'react';
import type { Horse } from '../types';

interface HorseManagerProps {
  horses: Horse[];
  onAdd: (horse: Omit<Horse, 'id'>) => void;
  onRemove: (id: string) => void;
}

const BREED_OPTIONS = [
  'Thoroughbred', 'Quarter Horse', 'Arabian', 'Warmblood', 'Andalusian',
  'Friesian', 'Appaloosa', 'Paint', 'Morgan', 'Tennessee Walker', 'Other',
];

const COLOR_OPTIONS = [
  'Bay', 'Chestnut', 'Black', 'Gray', 'Palomino', 'Roan', 'Dun',
  'Buckskin', 'Pinto', 'Cremello', 'Other',
];

export default function HorseManager({ horses, onAdd, onRemove }: HorseManagerProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState(BREED_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), breed, color });
    setName('');
    setBreed(BREED_OPTIONS[0]);
    setColor(COLOR_OPTIONS[0]);
    setExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>🐎</span> My Horses
          {horses.length > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              {horses.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          {expanded ? '✕ Cancel' : '+ Add Horse'}
        </button>
      </div>

      {/* Existing horses */}
      {horses.length > 0 && (
        <div className="mt-3 space-y-2">
          {horses.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between py-1.5 px-3 bg-indigo-50 rounded-lg text-sm"
            >
              <div>
                <span className="font-semibold text-gray-800">{h.name}</span>
                <span className="text-gray-500 ml-2 text-xs">
                  {h.breed} · {h.color}
                </span>
              </div>
              <button
                onClick={() => onRemove(h.id)}
                className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                title="Remove horse"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add horse form */}
      {expanded && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Horse Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shadowfax"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Breed
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {BREED_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white font-semibold py-2 rounded-xl hover:bg-indigo-600 transition-colors text-sm"
          >
            Add Horse
          </button>
        </form>
      )}
    </div>
  );
}

import type { Horse, TrainingSession } from '../types';

interface TrainingLogListProps {
  sessions: TrainingSession[];
  horses: Horse[];
  onDelete: (id: string) => void;
}

const DISCIPLINE_EMOJI: Record<string, string> = {
  Dressage: '🎩',
  'Show Jumping': '🚧',
  'Cross Country': '🌿',
  'Trail Riding': '🌲',
  'Western Pleasure': '🤠',
  'Barrel Racing': '🛢️',
  Endurance: '⛰️',
  Other: '🐎',
};

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return 'text-emerald-600 bg-emerald-50';
  if (score >= 5) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

export default function TrainingLogList({
  sessions,
  horses,
  onDelete,
}: TrainingLogListProps) {
  const getHorse = (id: string) => horses.find((h) => h.id === id);

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-5xl mb-3">📋</p>
        <p className="text-gray-500 font-medium">No sessions logged yet.</p>
        <p className="text-sm text-gray-400">Start by filling out the form!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((session) => {
        const horse = getHorse(session.horseId);
        const dateObj = new Date(session.date);
        const dateStr = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const emoji = DISCIPLINE_EMOJI[session.discipline] ?? '🐎';

        return (
          <div
            key={session.id}
            className="bg-white rounded-2xl shadow p-4 flex gap-4 items-start hover:shadow-md transition-shadow"
          >
            {/* Photo or placeholder */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center border border-indigo-100">
              {session.photoDataUrl ? (
                <img
                  src={session.photoDataUrl}
                  alt="Session"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">{emoji}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {horse?.name ?? 'Unknown Horse'}
                  </p>
                  <p className="text-xs text-gray-500">{dateStr}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${SCORE_COLOR(session.performanceScore)}`}
                >
                  {session.performanceScore}/10
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  {emoji} {session.discipline}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  ⏱ {session.durationMinutes} min
                </span>
              </div>

              {session.notes && (
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                  {session.notes}
                </p>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(session.id)}
              className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
              title="Delete session"
            >
              🗑️
            </button>
          </div>
        );
      })}
    </div>
  );
}

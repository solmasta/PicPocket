import { useState, useCallback } from 'react';
import './App.css';
import type { Horse, TrainingSession } from './types';
import TrainingLogForm from './components/TrainingLogForm';
import TrainingLogList from './components/TrainingLogList';
import ProgressChart from './components/ProgressChart';
import HorseManager from './components/HorseManager';
import { exportToPDF } from './utils/exportPDF';

const CHART_CONTAINER_ID = 'progress-chart-container';

type Tab = 'log' | 'history' | 'progress';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEMO_HORSES: Horse[] = [
  { id: 'h1', name: 'Aria', breed: 'Warmblood', color: 'Bay' },
  { id: 'h2', name: 'Thunder', breed: 'Thoroughbred', color: 'Chestnut' },
];

export default function App() {
  const [horses, setHorses] = useState<Horse[]>(DEMO_HORSES);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [exporting, setExporting] = useState(false);

  const addHorse = useCallback((horse: Omit<Horse, 'id'>) => {
    setHorses((prev) => [...prev, { ...horse, id: generateId() }]);
  }, []);

  const removeHorse = useCallback((id: string) => {
    setHorses((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addSession = useCallback((session: Omit<TrainingSession, 'id'>) => {
    setSessions((prev) => [...prev, { ...session, id: generateId() }]);
    setActiveTab('history');
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(sessions, horses, CHART_CONTAINER_ID);
    } finally {
      setExporting(false);
    }
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'log', label: 'Log Session', emoji: '✏️' },
    { id: 'history', label: 'History', emoji: '📋' },
    { id: 'progress', label: 'Progress', emoji: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Top Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐴</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                PicPocket
              </h1>
              <p className="text-xs text-indigo-500 font-medium leading-tight">
                Training Log
              </p>
            </div>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Exporting…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'log' && (
          <>
            <HorseManager horses={horses} onAdd={addHorse} onRemove={removeHorse} />
            <TrainingLogForm horses={horses} onSave={addSession} />
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Session History
              </h2>
              <span className="text-sm text-gray-500">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <TrainingLogList
              sessions={sessions}
              horses={horses}
              onDelete={deleteSession}
            />
          </>
        )}

        {activeTab === 'progress' && (
          <>
            <h2 className="text-lg font-bold text-gray-800">Progress Overview</h2>
            <div id={CHART_CONTAINER_ID}>
              <ProgressChart sessions={sessions} horses={horses} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

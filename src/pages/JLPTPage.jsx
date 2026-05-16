import { useState } from 'react';
// grammar_n2.json will be populated with question objects; empty array for now
import grammarData from '../data/grammar_n2.json';

export default function JLPTPage({ onBack }) {
  const [progress] = useState(() => {
    try {
      const stored = localStorage.getItem('jlpt_n2_progress');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-12">
      <div className="w-full max-w-2xl">

        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          ← Back to Home
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            JLPT N2 Practice
          </h1>
          <p className="text-gray-500 text-lg">
            Grammar and reading comprehension practice for the N2 exam.
          </p>
          <p className="text-sm text-indigo-500 font-medium mt-1">
            Exam date: Sunday, July 5, 2026
          </p>
        </div>

        {/* Progress summary — shown only when jlpt_n2_progress data exists */}
        {progress && (
          <div className="bg-white rounded-xl shadow p-5 mb-6 flex gap-8 justify-center text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{progress.completed ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">{progress.total ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total questions</div>
            </div>
            {progress.lastSession && (
              <div>
                <div className="text-2xl font-bold text-green-600">{progress.lastSession.score ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">Last score</div>
              </div>
            )}
          </div>
        )}

        {/* Placeholder — replace with quiz component once grammar_n2.json is populated */}
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <div className="text-6xl mb-5">🎯</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Coming Soon</h2>
          <p className="text-gray-400 mb-2">
            {grammarData.length === 0
              ? 'No questions yet — populate src/data/grammar_n2.json to begin.'
              : `${grammarData.length} question${grammarData.length !== 1 ? 's' : ''} ready.`}
          </p>
          <p className="text-sm text-gray-400">
            {/* TODO: mount <JLPTQuizComponent grammarData={grammarData} /> here */}
          </p>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

const MODE_LABELS = {
  'kana-to-kanji': 'Kana→Kanji',
  'kanji-to-reading': 'Kanji→Reading',
  'vocabulary-writing': 'Vocab Writing',
  'vocabulary-reading': 'Vocab Reading',
};

function AccuracyBadge({ accuracy }) {
  const color = accuracy >= 80 ? 'bg-green-100 text-green-700' : accuracy >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{accuracy}%</span>;
}

function AccuracyChart({ sessions }) {
  if (sessions.length < 2) return (
    <p className="text-gray-400 text-sm text-center py-4">Complete at least 2 sessions to see the chart.</p>
  );

  const data = [...sessions].reverse().slice(0, 20);
  const W = 300, H = 80, PAD = 8;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const points = data.map((s, i) => ({
    x: PAD + (i / (data.length - 1)) * innerW,
    y: PAD + innerH - (s.accuracy / 100) * innerH,
    accuracy: s.accuracy,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 100 }}>
      {/* Grid lines */}
      {[0, 50, 100].map(pct => {
        const y = PAD + innerH - (pct / 100) * innerH;
        return (
          <line key={pct} x1={PAD} y1={y} x2={W - PAD} y2={y}
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 2" />
        );
      })}
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />
      ))}
    </svg>
  );
}

export default function ProgressScreen({ onBack }) {
  const [history, setHistory] = useState([]);
  const [chapterStats, setChapterStats] = useState({});
  const [weakCards, setWeakCards] = useState([]);

  useEffect(() => {
    setHistory(dataService.getSessionHistory());
    setChapterStats(dataService.getChapterStats());
    setWeakCards(dataService.getWeakCards(15));
  }, []);

  const totalSessions = history.length;
  const allCorrect = history.reduce((s, h) => s + (h.correct || 0), 0);
  const allTotal = history.reduce((s, h) => s + (h.total || 0), 0);
  const allTimeAccuracy = allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : 0;
  const totalCards = allTotal;

  // Day streak
  const streak = (() => {
    if (history.length === 0) return 0;
    const days = new Set(history.map(h => h.timestamp?.slice(0, 10)));
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    let d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const recent = history.slice(0, 10);
  const studiedChapters = Object.entries(chapterStats).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-0.5">Your stats</p>
        <h2 className="text-2xl font-bold text-[#e0e0f0]">Progress</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 text-[#3a3a55]">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-base font-medium text-[#606080]">No sessions yet</p>
          <p className="text-sm mt-1">Complete a quiz to see your progress here.</p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Sessions', value: totalSessions, color: 'text-[#C1392B]' },
              { label: 'All-time Accuracy', value: `${allTimeAccuracy}%`, color: 'text-[#4AA85C]' },
              { label: 'Cards Studied', value: totalCards, color: 'text-[#378ADD]' },
              { label: 'Day Streak', value: `${streak} 🔥`, color: 'text-[#D4861C]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#171720] border border-[#2a2a38] rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-[#606080] mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Accuracy chart */}
          <div className="bg-[#171720] border border-[#2a2a38] rounded-xl p-5 mb-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">Accuracy over time</p>
            <AccuracyChart sessions={history} />
            <div className="flex justify-between text-[10px] text-[#3a3a55] mt-1 px-1">
              <span>Oldest</span><span>Latest</span>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="bg-[#171720] border border-[#2a2a38] rounded-xl p-5 mb-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-4">Recent sessions</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#1e1e2a]">
                    <th className="pb-2 pr-4 text-xs font-medium text-[#3a3a55]">Date</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-[#3a3a55]">Mode</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-[#3a3a55]">Ch.</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-[#3a3a55] text-right">Cards</th>
                    <th className="pb-2 text-xs font-medium text-[#3a3a55] text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-b border-[#1e1e2a] last:border-0">
                      <td className="py-2.5 pr-4 text-xs text-[#606080] whitespace-nowrap">
                        {s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-[#e0e0f0]">{MODE_LABELS[s.mode] || s.mode}</td>
                      <td className="py-2.5 pr-4 text-xs text-[#606080]">
                        {s.chapters?.slice(0, 3).join(', ')}{s.chapters?.length > 3 ? '…' : ''}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-right text-[#606080]">{s.total}</td>
                      <td className="py-2.5 text-right"><AccuracyBadge accuracy={s.accuracy ?? 0} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weak cards */}
          {weakCards.length > 0 && (
            <div className="bg-[#171720] border border-[#2a2a38] rounded-xl p-5 mb-5">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">Cards to review</p>
              <div className="flex flex-wrap gap-2">
                {weakCards.map(({ word, score }) => {
                  const color = score >= 5
                    ? 'border-[#C1392B44] text-[#C1392B] bg-[#C1392B11]'
                    : score >= 3
                    ? 'border-[#D4861C44] text-[#D4861C] bg-[#D4861C11]'
                    : 'border-[#D4861C33] text-[#D4861C] bg-[#D4861C0a]';
                  return (
                    <span key={word} className={`px-3 py-1.5 rounded-full border text-sm font-medium noto ${color}`}>
                      {word} <span className="opacity-50 text-xs">({score})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chapter stats */}
          {studiedChapters.length > 0 && (
            <div className="bg-[#171720] border border-[#2a2a38] rounded-xl p-5">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-4">Chapter progress</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {studiedChapters.map(([ch, stats]) => {
                  const pct = stats.totalCards > 0
                    ? Math.round((stats.totalCorrect / stats.totalCards) * 100) : 0;
                  return (
                    <div key={ch} className="bg-[#0F0F14] border border-[#2a2a38] rounded-xl p-3">
                      <div className="text-sm font-semibold text-[#e0e0f0] mb-1">Chapter {ch}</div>
                      <div className="text-xs text-[#3a3a55] mb-2">
                        {stats.studyCount}× · {pct}%
                      </div>
                      <div className="h-1 bg-[#2a2a38] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C1392B] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

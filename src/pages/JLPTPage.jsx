import { useState, useMemo, useEffect } from 'react';
import kanjiData  from '../data/kanji_master.json';
import vocabData  from '../data/vocab_master.json';
import grammarData from '../data/grammar_n2.json';

const SET_SIZE = 20;
const LS_KEY = 'jlpt_n2_progress';
const LETTERS = ['A', 'B', 'C', 'D'];

// ── Helpers ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool, excludeItem, field, n) {
  const seen = new Set([excludeItem[field]]);
  const candidates = shuffle(pool)
    .map(x => x[field])
    .filter(v => v && !seen.has(v) && seen.add(v));
  return candidates.slice(0, n);
}

// Returns items in deterministic order (NO global shuffle).
// Options within each item are shuffled so A/B/C/D placement is random.
function buildPool(filters) {
  const items = [];

  if (filters.vocab) {
    vocabData.forEach(item => {
      const distractors = pickDistractors(vocabData, item, 'word', 3);
      if (distractors.length < 3) return;
      items.push({
        type: 'vocab',
        question: item.meaning,
        subtext: item.reading,
        options: shuffle([item.word, ...distractors]),
        correctAnswer: item.word,
        explanation: `${item.word}（${item.reading}）→ ${item.meaning}`,
      });
    });
  }

  if (filters.kanji) {
    kanjiData.forEach(item => {
      const distractors = pickDistractors(kanjiData, item, 'reading', 3);
      if (distractors.length < 3) return;
      items.push({
        type: 'kanji',
        question: `「${item.kanji}」の読み方は？`,
        subtext: item.meaning,
        options: shuffle([item.reading, ...distractors]),
        correctAnswer: item.reading,
        explanation: `${item.kanji} → ${item.reading}（${item.meaning}）`,
      });
    });
  }

  if (filters.grammar && grammarData.length > 0) {
    grammarData.forEach(item => {
      const distractors = pickDistractors(grammarData, item, 'pattern', 3);
      if (distractors.length < 3) return;
      items.push({
        type: 'grammar',
        question: item.meaning,
        subtext: item.example || '',
        options: shuffle([item.pattern, ...distractors]),
        correctAnswer: item.pattern,
        explanation: `${item.pattern}: ${item.meaning}${item.example ? `\n例：${item.example}` : ''}`,
      });
    });
  }

  return items;
}

function saveProgress(results) {
  const correct = results.filter(r => r.correct).length;
  const payload = {
    completed: correct,
    total: results.length,
    lastSession: {
      date: new Date().toISOString(),
      score: `${correct}/${results.length}`,
      pct: Math.round((correct / results.length) * 100),
    },
  };
  try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {}
  return payload;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = {
    vocab:   { label: 'Vocabulary', cls: 'bg-orange-100 text-orange-700' },
    kanji:   { label: 'Kanji',      cls: 'bg-blue-100 text-blue-700'     },
    grammar: { label: 'Grammar',    cls: 'bg-rose-100 text-rose-700'     },
  };
  const { label, cls } = cfg[type] ?? cfg.vocab;
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-500 mb-1.5">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OptionButton({ letter, text, isSelected, isChecked, isCorrect, onClick }) {
  let cls = 'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ';
  if (!isChecked) {
    cls += isSelected
      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/60 text-gray-700 cursor-pointer';
  } else if (isCorrect) {
    cls += 'border-green-500 bg-green-50 text-green-800';
  } else if (isSelected) {
    cls += 'border-red-400 bg-red-50 text-red-700';
  } else {
    cls += 'border-gray-100 bg-gray-50 text-gray-400 cursor-default';
  }

  return (
    <button className={cls} onClick={onClick} disabled={isChecked}>
      <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
        {letter}
      </span>
      <span className="flex-1 text-sm font-medium leading-snug">{text}</span>
      {isChecked && isCorrect && <span className="ml-auto text-green-600 font-bold">✓</span>}
      {isChecked && isSelected && !isCorrect && <span className="ml-auto text-red-500 font-bold">✗</span>}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function JLPTPage({ onBack }) {
  const [phase, setPhase]       = useState('setup');
  const [filters, setFilters]   = useState({
    vocab:   true,
    kanji:   true,
    grammar: grammarData.length > 0,
  });
  const [selectedSets, setSelectedSets] = useState(new Set([0]));
  const [session, setSession]   = useState([]);
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked]   = useState(false);
  const [results, setResults]   = useState([]);

  const lastProgress = useMemo(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }, []);

  const poolItems = useMemo(() => buildPool(filters), [filters]);

  const sets = useMemo(() => {
    const result = [];
    for (let i = 0; i < poolItems.length; i += SET_SIZE) {
      result.push(poolItems.slice(i, i + SET_SIZE));
    }
    return result;
  }, [poolItems]);

  // Reset to Set 1 whenever question-type filters change
  const filtersKey = `${filters.vocab}-${filters.kanji}-${filters.grammar}`;
  useEffect(() => { setSelectedSets(new Set([0])); }, [filtersKey]);

  const selectedCount = [...selectedSets].reduce((sum, i) => sum + (sets[i]?.length ?? 0), 0);

  function toggleFilter(key) {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  }

  function toggleSet(i) {
    setSelectedSets(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function selectAllSets() { setSelectedSets(new Set(sets.map((_, i) => i))); }
  function clearSets()     { setSelectedSets(new Set()); }

  function startSession() {
    if (!selectedSets.size) return;
    const items = [...selectedSets].sort((a, b) => a - b).flatMap(i => sets[i] ?? []);
    if (!items.length) return;
    setSession(shuffle(items));
    setIdx(0);
    setSelected(null);
    setChecked(false);
    setResults([]);
    setPhase('quiz');
  }

  function handleCheck() {
    if (!selected || checked) return;
    setChecked(true);
  }

  function handleNext() {
    const q = session[idx];
    const isCorrect = selected === q.correctAnswer;
    const nextResults = [...results, { correct: isCorrect, type: q.type }];
    setResults(nextResults);

    if (idx + 1 >= session.length) {
      saveProgress(nextResults);
      setPhase('complete');
    } else {
      setIdx(i => i + 1);
      setSelected(null);
      setChecked(false);
    }
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const anyActive = Object.values(filters).some(Boolean);
    const filterCfg = [
      { key: 'vocab',   label: 'Vocabulary', activeCls: 'bg-orange-500 text-white ring-2 ring-orange-300 shadow' },
      { key: 'kanji',   label: 'Kanji',      activeCls: 'bg-blue-500 text-white ring-2 ring-blue-300 shadow'    },
      { key: 'grammar', label: 'Grammar',    activeCls: 'bg-rose-500 text-white ring-2 ring-rose-300 shadow',
        disabled: grammarData.length === 0, note: 'no data' },
    ];

    return (
      <div className="flex flex-col items-center min-h-screen py-12">
        <div className="w-full max-w-2xl">
          <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium">
            ← Back to Home
          </button>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">🎌 JLPT N2 Practice</h1>
            <p className="text-gray-500">Multiple-choice · vocab, kanji &amp; grammar</p>
            <p className="text-sm text-rose-500 font-semibold mt-1">Exam: Sunday, July 5, 2026</p>
          </div>

          {lastProgress?.lastSession && (
            <div className="bg-white rounded-xl shadow p-5 mb-6 flex gap-8 justify-center text-center">
              <div>
                <div className="text-2xl font-bold text-rose-500">{lastProgress.lastSession.pct}%</div>
                <div className="text-xs text-gray-500 mt-1">Last score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-700">{lastProgress.lastSession.score}</div>
                <div className="text-xs text-gray-500 mt-1">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-500">{lastProgress.completed}</div>
                <div className="text-xs text-gray-500 mt-1">Lifetime correct</div>
              </div>
            </div>
          )}

          {/* Question type filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Question types</h2>
            <div className="flex gap-3 flex-wrap">
              {filterCfg.map(({ key, label, activeCls, disabled, note }) => (
                <button
                  key={key}
                  onClick={() => !disabled && toggleFilter(key)}
                  disabled={disabled}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : filters[key]
                      ? activeCls
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}{disabled ? ` (${note})` : ''}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">{poolItems.length} questions in pool</p>
          </div>

          {/* Set selector */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sets ({SET_SIZE} questions each)</h2>
              <div className="flex gap-3">
                <button onClick={selectAllSets} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">All</button>
                <span className="text-gray-300">·</span>
                <button onClick={clearSets} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
              </div>
            </div>

            {sets.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {sets.map((set, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSet(i)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                      selectedSets.has(i)
                        ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 shadow'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Enable at least one question type to see sets.</p>
            )}

            <p className="text-xs text-gray-400 mt-4">
              {selectedCount > 0
                ? `${selectedCount} questions selected across ${selectedSets.size} set${selectedSets.size !== 1 ? 's' : ''}`
                : 'Select at least one set to begin.'}
            </p>
          </div>

          <button
            onClick={startSession}
            disabled={!anyActive || selectedCount === 0}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-xl py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-200"
          >
            {selectedCount > 0 ? `Start ${selectedCount} Questions →` : 'Start Session →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const correct = results.filter(r => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '💪' : '📚';
    const scoreColor = pct >= 80 ? 'text-green-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500';
    const byType = results.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = { correct: 0, total: 0 };
      acc[r.type].total++;
      if (r.correct) acc[r.type].correct++;
      return acc;
    }, {});

    return (
      <div className="flex flex-col items-center min-h-screen py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center mb-6">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Session Complete!</h2>
            <div className={`text-6xl font-bold my-4 ${scoreColor}`}>{pct}%</div>
            <p className="text-gray-500 mb-8">{correct} correct out of {results.length} questions</p>

            <div className="space-y-3 text-left">
              {Object.entries(byType).map(([type, { correct, total }]) => (
                <div key={type} className="flex items-center gap-3">
                  <TypeBadge type={type} />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full"
                      style={{ width: `${Math.round((correct / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right font-medium">{correct}/{total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Change Sets
            </button>
            <button
              onClick={startSession}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow hover:shadow-lg hover:scale-105 transform transition-all"
            >
              Try Again
            </button>
          </div>

          <button onClick={onBack} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  const q = session[idx];
  const isCorrectSelected = selected === q.correctAnswer;

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <div className="w-full max-w-2xl">

        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            ← Back
          </button>
          <span className="text-sm text-gray-400 font-medium">JLPT N2 Practice</span>
          <button onClick={() => setPhase('setup')} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
            Quit
          </button>
        </div>

        <div className="mb-6">
          <ProgressBar current={idx + 1} total={session.length} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <TypeBadge type={q.type} />
            {q.subtext && (
              <span className="text-sm text-gray-400 truncate">{q.subtext}</span>
            )}
          </div>

          <p className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">{q.question}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {q.options.map((opt, i) => (
              <OptionButton
                key={i}
                letter={LETTERS[i]}
                text={opt}
                isSelected={selected === opt}
                isChecked={checked}
                isCorrect={opt === q.correctAnswer}
                onClick={() => !checked && setSelected(opt)}
              />
            ))}
          </div>

          {checked && (
            <div className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line border ${
              isCorrectSelected
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span className="font-bold">{isCorrectSelected ? '✓ Correct!  ' : '✗ Incorrect.  '}</span>
              {q.explanation}
            </div>
          )}
        </div>

        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={!selected}
            className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-200"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {idx + 1 >= session.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}

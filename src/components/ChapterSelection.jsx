import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

const MODE_LABELS = {
  'kana-to-kanji': 'Kana → Kanji',
  'kanji-to-reading': 'Kanji → Reading',
  'vocabulary-writing': 'Vocabulary Writing',
  'vocabulary-reading': 'Vocabulary Reading',
};

export default function ChapterSelection({ selectedMode, onChaptersSelect, onBack }) {
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [chapterStats, setChapterStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dataService.refreshData();
    const chapters = dataService.getAvailableChapters();
    setAvailableChapters(chapters);
    setSelectedChapters(chapters);
    setChapterStats(dataService.getChapterStats());
    setIsLoading(false);
  }, []);

  const handleChapterToggle = (chapter) => {
    setSelectedChapters(prev =>
      prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]
    );
  };

  const handleStart = () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter');
      return;
    }
    onChaptersSelect(selectedChapters);
  };

  const getAccuracy = (ch) => {
    const s = chapterStats[String(ch)];
    if (!s || s.totalCards === 0) return null;
    return Math.round((s.totalCorrect / s.totalCards) * 100);
  };

  const accuracyColor = (pct) => {
    if (pct >= 80) return 'text-[#4AA85C]';
    if (pct >= 60) return 'text-[#D4861C]';
    return 'text-[#C1392B]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C1392B]" />
      </div>
    );
  }

  const totalKanji = selectedChapters.reduce((sum, ch) => {
    return sum + dataService.filterKanjiByChapters([ch]).length;
  }, 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 bg-[#171720] border border-[#2a2a38] rounded-lg flex items-center justify-center text-[#606080] hover:text-[#e0e0f0] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-[#e0e0f0]">{MODE_LABELS[selectedMode] || selectedMode}</h2>
          <p className="text-xs text-[#606080]">Select chapters</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'selected', value: selectedChapters.length, color: 'text-[#C1392B]' },
          { label: 'kanji', value: totalKanji, color: 'text-[#3CBFA5]' },
          { label: 'chapters total', value: availableChapters.length, color: 'text-[#D4861C]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#171720] border border-[#2a2a38] rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-[#606080] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Select all / none */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedChapters(availableChapters)}
          className="px-3 py-1.5 text-xs font-medium bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-lg hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors"
        >
          Select all
        </button>
        <button
          onClick={() => setSelectedChapters([])}
          className="px-3 py-1.5 text-xs font-medium bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-lg hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors"
        >
          Deselect all
        </button>
      </div>

      {/* Chapter list */}
      <div className="flex flex-col gap-2 mb-6">
        {availableChapters.map(chapter => {
          const selected = selectedChapters.includes(chapter);
          const accuracy = getAccuracy(chapter);
          return (
            <button
              key={chapter}
              onClick={() => handleChapterToggle(chapter)}
              className={`bg-[#171720] border rounded-xl px-4 py-3 flex items-center justify-between transition-all ${
                selected ? 'border-[#C1392B]' : 'border-[#2a2a38] hover:border-[#3a3a55]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  selected ? 'bg-[#C1392B]' : 'bg-[#2a2a38] border border-[#3a3a55]'
                }`}>
                  {selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[#e0e0f0]">Chapter {chapter}</div>
                  {chapterStats[String(chapter)]?.studyCount > 0 && (
                    <div className="text-xs text-[#3a3a55]">
                      Studied {chapterStats[String(chapter)].studyCount}×
                    </div>
                  )}
                </div>
              </div>
              {accuracy !== null ? (
                <span className={`text-sm font-semibold ${accuracyColor(accuracy)}`}>{accuracy}%</span>
              ) : (
                <span className="text-sm text-[#3a3a55]">—</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={selectedChapters.length === 0}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
          selectedChapters.length === 0
            ? 'bg-[#171720] text-[#3a3a55] border border-[#2a2a38] cursor-not-allowed'
            : 'bg-[#C1392B] text-white hover:bg-[#a62f24]'
        }`}
      >
        Start session →
      </button>
    </div>
  );
}

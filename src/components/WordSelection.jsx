import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export default function WordSelection({ mode, selectedChapters, onBack, onStartQuiz }) {
  const [words, setWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  useEffect(() => { loadWords(); }, [mode, selectedChapters]);

  const loadWords = () => {
    try {
      setIsLoading(true);
      let allWords = [];
      if (mode.includes('vocabulary')) {
        allWords = dataService.filterVocabByChapters(selectedChapters).map(item => ({
          ...item, type: 'vocabulary', word: item.word,
        }));
      } else {
        allWords = dataService.filterKanjiByChapters(selectedChapters).map(item => ({
          ...item, type: 'kanji', word: item.kanji,
        }));
      }
      setWords(allWords);
      setSelectedWords(new Set(allWords.map(getWordId)));
      setExpandedChapters(new Set(selectedChapters));
    } catch (err) {
      console.error('Error loading words:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWordId = (word) => `${word.type}-${word.word}-${word.chapter}`;

  const toggleWord = (wordId) => {
    const next = new Set(selectedWords);
    next.has(wordId) ? next.delete(wordId) : next.add(wordId);
    setSelectedWords(next);
  };

  const toggleChapter = (chapter) => {
    const chapterIds = words.filter(w => w.chapter === chapter).map(getWordId);
    const next = new Set(selectedWords);
    const allSelected = chapterIds.every(id => next.has(id));
    chapterIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
    setSelectedWords(next);
  };

  const toggleExpand = (chapter) => {
    const next = new Set(expandedChapters);
    next.has(chapter) ? next.delete(chapter) : next.add(chapter);
    setExpandedChapters(next);
  };

  const handleStart = () => {
    if (selectedWords.size === 0) { alert('Please select at least one word.'); return; }
    onStartQuiz(words.filter(w => selectedWords.has(getWordId(w))));
  };

  const wordsByChapter = selectedChapters.reduce((acc, ch) => {
    acc[ch] = words.filter(w => w.chapter === ch);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E17] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C1392B]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 bg-[#131A2A] border border-[#232C42] rounded-lg flex items-center justify-center text-[#7681A0] hover:text-[#E8EBF4] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[#E8EBF4]">Select Words</h2>
          <p className="text-xs text-[#7681A0]">
            <span className="text-[#C1392B] font-semibold">{selectedWords.size}</span> / {words.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedWords(new Set(words.map(getWordId)))}
            className="px-3 py-1.5 text-xs bg-[#131A2A] border border-[#232C42] text-[#7681A0] rounded-lg hover:text-[#E8EBF4] transition-colors"
          >
            All
          </button>
          <button
            onClick={() => setSelectedWords(new Set())}
            className="px-3 py-1.5 text-xs bg-[#131A2A] border border-[#232C42] text-[#7681A0] rounded-lg hover:text-[#E8EBF4] transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Chapter groups */}
      <div className="flex flex-col gap-3 mb-6">
        {Object.entries(wordsByChapter).map(([chapter, chapterWords]) => {
          const ids = chapterWords.map(getWordId);
          const selCount = ids.filter(id => selectedWords.has(id)).length;
          const allSel = selCount === chapterWords.length;
          const isExpanded = expandedChapters.has(Number(chapter));

          return (
            <div key={chapter} className="bg-[#131A2A] border border-[#232C42] rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1A2234] transition-colors"
                onClick={() => toggleExpand(Number(chapter))}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#E8EBF4]">Chapter {chapter}</span>
                  <span className="text-xs text-[#35415E]">{selCount}/{chapterWords.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); toggleChapter(Number(chapter)); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      allSel ? 'bg-[#C1392B] text-white' : 'bg-[#232C42] text-[#7681A0] hover:text-[#E8EBF4]'
                    }`}
                  >
                    {allSel ? 'Deselect' : 'Select all'}
                  </button>
                  <span className="text-[#35415E] text-xs">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#1A2234] divide-y divide-[#1A2234]">
                  {chapterWords.map(word => {
                    const id = getWordId(word);
                    const sel = selectedWords.has(id);
                    return (
                      <div
                        key={id}
                        onClick={() => toggleWord(id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          sel ? 'bg-[#C1392B]11' : 'hover:bg-[#1A2234]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          sel ? 'bg-[#C1392B] border-[#C1392B]' : 'border-[#35415E]'
                        }`}>
                          {sel && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[#E8EBF4] noto">{word.word}</span>
                          <span className="text-xs text-[#7681A0] ml-2">{word.reading} · {word.meaning}</span>
                        </div>
                        <span className="text-[10px] text-[#35415E] bg-[#232C42] px-1.5 py-0.5 rounded flex-shrink-0">
                          {word.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={selectedWords.size === 0}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
          selectedWords.size === 0
            ? 'bg-[#131A2A] text-[#35415E] border border-[#232C42] cursor-not-allowed'
            : 'bg-[#C1392B] text-white hover:bg-[#a62f24]'
        }`}
      >
        Start Quiz ({selectedWords.size} words) →
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export default function WordSelection({ mode, selectedChapters, onBack, onStartQuiz }) {
  const [words, setWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  useEffect(() => {
    loadWords();
  }, [mode, selectedChapters]);

  const loadWords = () => {
    try {
      setIsLoading(true);
      let allWords = [];

      if (mode.includes('vocabulary')) {
        // Get vocabulary words
        const vocabData = dataService.filterVocabByChapters(selectedChapters);
        allWords = vocabData.map(item => ({
          ...item,
          type: 'vocabulary',
          word: item.word,
          reading: item.reading,
          meaning: item.meaning,
          chapter: item.chapter
        }));
      } else {
        // Get kanji words
        const kanjiData = dataService.filterKanjiByChapters(selectedChapters);
        allWords = kanjiData.map(item => ({
          ...item,
          type: 'kanji',
          word: item.kanji,
          reading: item.reading,
          meaning: item.meaning,
          chapter: item.chapter
        }));
      }

      setWords(allWords);
      // Select all words by default
      const allWordIds = allWords.map(item => `${item.type}-${item.word}-${item.chapter}`);
      setSelectedWords(new Set(allWordIds));
      
      // Expand all chapters by default
      setExpandedChapters(new Set(selectedChapters));
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWordSelection = (wordId) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWords(newSelected);
  };

  const toggleChapterSelection = (chapter) => {
    const chapterWords = words.filter(word => word.chapter === chapter);
    const newSelected = new Set(selectedWords);
    
    const chapterWordIds = chapterWords.map(item => `${item.type}-${item.word}-${item.chapter}`);
    const allChapterWordsSelected = chapterWordIds.every(id => newSelected.has(id));
    
    if (allChapterWordsSelected) {
      // Deselect all words in this chapter
      chapterWordIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all words in this chapter
      chapterWordIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedWords(newSelected);
  };

  const toggleChapterExpansion = (chapter) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapter)) {
      newExpanded.delete(chapter);
    } else {
      newExpanded.add(chapter);
    }
    setExpandedChapters(newExpanded);
  };

  const selectAllWords = () => {
    const allWordIds = words.map(item => `${item.type}-${item.word}-${item.chapter}`);
    setSelectedWords(new Set(allWordIds));
  };

  const deselectAllWords = () => {
    setSelectedWords(new Set());
  };

  const getWordsByChapter = () => {
    const grouped = {};
    selectedChapters.forEach(chapter => {
      grouped[chapter] = words.filter(word => word.chapter === chapter);
    });
    return grouped;
  };

  const getWordId = (word) => `${word.type}-${word.word}-${word.chapter}`;

  const getSelectedCount = () => {
    return selectedWords.size;
  };

  const getTotalCount = () => {
    return words.length;
  };

  const handleStartQuiz = () => {
    if (selectedWords.size === 0) {
      alert('Please select at least one word to start the quiz.');
      return;
    }

    const selectedWordData = words.filter(word => 
      selectedWords.has(getWordId(word))
    );

    onStartQuiz(selectedWordData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading words...</div>
      </div>
    );
  }

  const wordsByChapter = getWordsByChapter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Select Words</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-600">
                Mode: <span className="font-semibold">{mode.replace('-', ' → ').replace('kana', 'kana').replace('kanji', 'kanji').replace('vocabulary', 'vocabulary')}</span>
              </p>
              <p className="text-gray-600">
                Selected: <span className="font-semibold text-blue-600">{getSelectedCount()}</span> / <span className="font-semibold">{getTotalCount()}</span> words
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllWords}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllWords}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>

        {/* Word Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-4">
            {Object.entries(wordsByChapter).map(([chapter, chapterWords]) => {
              const isExpanded = expandedChapters.has(chapter);
              const chapterWordIds = chapterWords.map(item => getWordId(item));
              const selectedCount = chapterWordIds.filter(id => selectedWords.has(id)).length;
              const isChapterFullySelected = selectedCount === chapterWords.length;

              return (
                <div key={chapter} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Chapter Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleChapterExpansion(chapter)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-gray-800">
                        Chapter {chapter}
                      </div>
                      <div className="text-sm text-gray-600">
                        ({selectedCount} / {chapterWords.length} words)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterSelection(chapter);
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isChapterFullySelected 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isChapterFullySelected ? 'Deselect All' : 'Select All'}
                      </button>
                      <div className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {/* Word List */}
                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      {chapterWords.map((word) => {
                        const wordId = getWordId(word);
                        const isSelected = selectedWords.has(wordId);

                        return (
                          <div
                            key={wordId}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleWordSelection(wordId)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'bg-white border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-800">
                                  {word.word}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {word.reading} - {word.meaning}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {word.type}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Quiz Button */}
        <div className="text-center">
          <button
            onClick={handleStartQuiz}
            disabled={selectedWords.size === 0}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              selectedWords.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            Start Quiz ({getSelectedCount()} words)
          </button>
        </div>
      </div>
    </div>
  );
}

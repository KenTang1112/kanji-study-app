import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export default function ChapterSelection({ selectedMode, onChaptersSelect, onBack }) {
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const chapters = dataService.getAvailableChapters();
    setAvailableChapters(chapters);
    // Default select all chapters
    setSelectedChapters(chapters);
    setIsLoading(false);
  }, []);

  const handleChapterToggle = (chapter) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapter)) {
        return prev.filter(c => c !== chapter);
      } else {
        return [...prev, chapter];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedChapters(availableChapters);
  };

  const handleDeselectAll = () => {
    setSelectedChapters([]);
  };

  const handleStart = () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter');
      return;
    }
    onChaptersSelect(selectedChapters);
  };

  const getModeTitle = (mode) => {
    const titles = {
      'kana-to-kanji': 'Kana → Kanji',
      'kanji-to-reading': 'Kanji → Reading',
      'vocabulary-writing': 'Vocabulary Writing',
      'vocabulary-reading': 'Vocabulary Reading'
    };
    return titles[mode] || mode;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {getModeTitle(selectedMode)}
          </h2>
          <p className="text-gray-600">
            Select chapters to study ({selectedChapters.length} selected)
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Deselect All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableChapters.map(chapter => (
              <button
                key={chapter}
                onClick={() => handleChapterToggle(chapter)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedChapters.includes(chapter)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                Chapter {chapter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedChapters.length} chapter{selectedChapters.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleStart}
            disabled={selectedChapters.length === 0}
            className={`
              px-8 py-3 rounded-lg font-semibold transition-all duration-200
              ${selectedChapters.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
              }
            `}
          >
            Start Study Session
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Session Info:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Cards will be shuffled randomly</p>
          <p>• Wrong answers may reappear</p>
          <p>• Weak cards are prioritized</p>
          <p>• Progress is saved locally</p>
        </div>
      </div>
    </div>
  );
}

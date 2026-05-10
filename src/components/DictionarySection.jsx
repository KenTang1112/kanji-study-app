import { useState } from 'react';

export default function DictionarySection({ word, reading, meaning }) {
  const [showDetails, setShowDetails] = useState(false);

  const getJishoUrl = (searchTerm) => {
    return `https://jisho.org/search/${encodeURIComponent(searchTerm)}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700">Dictionary</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">Word:</span>
          <span className="text-xl font-bold text-gray-800 kanji-text">{word}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">Reading:</span>
          <span className="text-lg text-gray-800 reading-text">{reading}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">Meaning:</span>
          <span className="text-gray-800">{meaning}</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <a
              href={getJishoUrl(word)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Jisho.org
            </a>
            
            <div className="text-xs text-gray-500">
              Click the link above to see detailed definitions, example sentences, and more on Jisho.org
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

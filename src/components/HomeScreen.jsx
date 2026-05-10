import { useState } from 'react';

const studyModes = [
  {
    id: 'kana-to-kanji',
    title: 'Kana → Kanji',
    description: 'Given the reading, write the kanji',
    icon: '📝',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'kanji-to-reading',
    title: 'Kanji → Reading',
    description: 'Given the kanji, write the reading',
    icon: '📖',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'vocabulary-writing',
    title: 'Vocabulary Writing',
    description: 'Given the meaning, write the vocabulary',
    icon: '✍️',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'vocabulary-reading',
    title: 'Vocabulary Reading',
    description: 'Given the vocabulary, show the reading and meaning',
    icon: '📚',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
];

export default function HomeScreen({ onModeSelect }) {
  const [hoveredMode, setHoveredMode] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          漢字勉強
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Kanji Study App
        </p>
        <p className="text-gray-500">
          Master Japanese kanji and vocabulary for university exams
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {studyModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            className={`
              ${mode.color} text-white rounded-xl p-8 
              transform transition-all duration-200 
              ${hoveredMode === mode.id ? 'scale-105 shadow-xl' : 'shadow-lg'}
              focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50
            `}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="text-5xl">{mode.icon}</div>
              <h3 className="text-2xl font-bold">{mode.title}</h3>
              <p className="text-sm opacity-90 text-center">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <h4 className="font-semibold text-gray-700 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 text-left space-y-1">
            <li>1. Choose a study mode</li>
            <li>2. Select chapters to practice</li>
            <li>3. Complete the quiz session</li>
            <li>4. Review your results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

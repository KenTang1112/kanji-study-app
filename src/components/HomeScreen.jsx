import { useState } from 'react';

function IconKanaToKanji() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" stroke="#378ADD" strokeWidth="1.5"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#378ADD" strokeWidth="1.5"/>
      <path d="M15 5l3 3" stroke="#85B7EB" strokeWidth="1"/>
    </svg>
  );
}

function IconKanjiToReading() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="#3CBFA5" strokeWidth="1.5"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="#3CBFA5" strokeWidth="1.5"/>
      <path d="M6 8h2M6 12h2" stroke="#9FE1CB" strokeWidth="1"/>
    </svg>
  );
}

function IconVocabWriting() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#8B82F0" strokeWidth="1.5"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#8B82F0" strokeWidth="1.5"/>
      <path d="M17 4l3 3" stroke="#AFA9EC" strokeWidth="1"/>
    </svg>
  );
}

function IconVocabReading() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#D4861C" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="#D4861C" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1" fill="#EF9F27"/>
    </svg>
  );
}

const studyModes = [
  {
    id: 'kana-to-kanji',
    title: 'Kana → Kanji',
    description: 'Given reading, write kanji',
    Icon: IconKanaToKanji,
    accent: '#378ADD',
    pill: 'Writing',
    bgColor: 'rgba(55,138,221,0.12)',
    borderColor: 'rgba(55,138,221,0.2)',
  },
  {
    id: 'kanji-to-reading',
    title: 'Kanji → Reading',
    description: 'Given kanji, write reading',
    Icon: IconKanjiToReading,
    accent: '#3CBFA5',
    pill: 'Reading',
    bgColor: 'rgba(60,191,165,0.12)',
    borderColor: 'rgba(60,191,165,0.2)',
  },
  {
    id: 'vocabulary-writing',
    title: 'Vocabulary Writing',
    description: 'Given meaning, write vocabulary',
    Icon: IconVocabWriting,
    accent: '#8B82F0',
    pill: 'Vocab',
    bgColor: 'rgba(139,130,240,0.12)',
    borderColor: 'rgba(139,130,240,0.2)',
  },
  {
    id: 'vocabulary-reading',
    title: 'Vocabulary Reading',
    description: 'Given vocabulary, show reading',
    Icon: IconVocabReading,
    accent: '#D4861C',
    pill: 'Vocab',
    bgColor: 'rgba(212,134,28,0.12)',
    borderColor: 'rgba(212,134,28,0.2)',
  },
];

export default function HomeScreen({
  onModeSelect, onManageVocabulary, onManageFlaggedItems, onPracticeTest,
  onProgress, onNavigateToProfile, currentUser,
}) {
  const [hoveredMode, setHoveredMode] = useState(null);
  const initial = (currentUser?.displayName || '?')[0].toUpperCase();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-8">

      {/* Profile button — top right */}
      <button
        onClick={onNavigateToProfile}
        className="absolute top-0 right-0 flex items-center gap-2 bg-[#171720] border border-[#2a2a38] rounded-full px-3 py-2 hover:border-[#3a3a55] transition-colors"
      >
        {currentUser?.avatarUrl ? (
          <img src={currentUser.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#C1392B] flex items-center justify-center text-white text-sm font-bold">
            {initial}
          </div>
        )}
        <span className="text-sm font-medium text-[#606080] hidden sm:block max-w-[80px] truncate">
          {currentUser?.displayName || 'Guest'}
        </span>
      </button>

      {/* Title */}
      <div className="text-center mb-10 mt-8">
        <h1 className="text-5xl font-bold text-[#e0e0f0] mb-4">漢字勉強</h1>
        <p className="text-xl text-[#606080] mb-2">Kanji Study App</p>
        <p className="text-[#3a3a55] text-sm">Master Japanese kanji and vocabulary for university exams</p>
      </div>

      {/* Mode buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
        {studyModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            className={`bg-[#171720] border border-[#2a2a38] rounded-xl p-8 flex flex-col items-center
              transition-all duration-200 focus:outline-none
              ${hoveredMode === mode.id ? 'scale-105 border-[#3a3a55] shadow-xl shadow-black/30' : 'shadow-lg shadow-black/20'}`}
          >
            {/* SVG icon with duotone background */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{ background: mode.bgColor, border: `0.5px solid ${mode.borderColor}` }}
            >
              <mode.Icon />
            </div>
            <h3 className="text-2xl font-bold text-[#e0e0f0] mb-2">{mode.title}</h3>
            <p className="text-sm text-[#606080] text-center mb-4">{mode.description}</p>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                color: mode.accent,
                borderColor: `${mode.accent}44`,
                background: `${mode.accent}18`,
              }}
            >
              {mode.pill}
            </span>
          </button>
        ))}
      </div>

      {/* Utility buttons */}
      <div className="flex gap-3 flex-wrap justify-center mb-8">
        <button
          onClick={onManageVocabulary}
          className="px-6 py-3 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-all font-semibold text-sm"
        >
          📚 Shared Vocab
        </button>
        <button
          onClick={onProgress}
          className="px-6 py-3 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-all font-semibold text-sm"
        >
          📊 Progress
        </button>
        <button
          onClick={onNavigateToProfile}
          className="px-6 py-3 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-all font-semibold text-sm"
        >
          👤 Profile
        </button>
        <button
          onClick={onManageFlaggedItems}
          className="px-6 py-3 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-all font-semibold text-sm"
        >
          🚩 View Flags
        </button>
        <button
          onClick={onPracticeTest}
          className="px-6 py-3 bg-[#C1392B] text-white rounded-xl hover:bg-[#a62f24] transition-all font-semibold text-sm"
        >
          📝 練習テスト
        </button>
      </div>

      {/* How it works */}
      <div className="bg-[#171720] border border-[#2a2a38] rounded-xl p-6 max-w-md w-full">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">How it works</p>
        <ol className="space-y-2">
          {[
            'Choose a study mode above',
            'Select chapters to practice',
            'Complete the quiz session',
            'Review your results',
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[#606080]">
              <span className="w-5 h-5 rounded-full bg-[#C1392B] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

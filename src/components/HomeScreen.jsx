
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

const tools = [
  { key: 'practice', label: '練習テスト', sub: 'Chapter practice tests', path: 'M9 4h6l1 2h3v14H5V6h3zM9 11h6M9 15h4' },
  { key: 'vocab', label: 'Shared vocab', sub: 'Words added by the class', path: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h7' },
  { key: 'progress', label: 'Progress', sub: 'Sessions and weak words', path: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { key: 'flags', label: 'Flags', sub: 'Items you flagged', path: 'M5 21V4h10l-1 4 5 1-2 6H5' },
];

export default function HomeScreen({
  onModeSelect, onManageVocabulary, onManageFlaggedItems, onPracticeTest,
  onProgress, onBackToHub,
}) {
  const actions = { practice: onPracticeTest, vocab: onManageVocabulary, progress: onProgress, flags: onManageFlaggedItems };

  return (
    <div className="py-4">
      {onBackToHub && (
        <button onClick={onBackToHub} className="text-sm text-[#7681A0] hover:text-[#E8EBF4] mb-6">← All classes</button>
      )}

      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E0574A] mb-2">Japanese</p>
        <h1 className="noto text-4xl sm:text-5xl font-bold text-[#E8EBF4]">漢字・語彙</h1>
        <p className="text-base text-[#9AA3BD] mt-2">Pick a drill, then choose the chapters to practise.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {studyModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className="group text-left bg-[#131A2A] border border-[#232C42] rounded-2xl p-4 sm:p-6 hover:border-[#35415E] hover:-translate-y-0.5 transition-all"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: mode.bgColor, border: `0.5px solid ${mode.borderColor}` }}
            >
              <mode.Icon />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-[#E8EBF4] leading-tight">{mode.title}</h3>
            <p className="text-xs sm:text-sm text-[#7681A0] mt-1">{mode.description}</p>
          </button>
        ))}
      </div>

      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#5A6482] mb-3">Tools</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={actions[t.key]}
            className="flex items-center gap-3 text-left bg-[#131A2A] border border-[#232C42] rounded-xl px-4 py-3 hover:border-[#35415E] transition-colors"
          >
            <span className="w-9 h-9 rounded-lg bg-[#1A2234] flex items-center justify-center text-[#E0574A] flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.path} /></svg>
            </span>
            <span className="min-w-0">
              <span className="noto block text-[15px] font-semibold text-[#E8EBF4]">{t.label}</span>
              <span className="block text-xs text-[#7681A0]">{t.sub}</span>
            </span>
            <span className="ml-auto text-[#35415E]" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

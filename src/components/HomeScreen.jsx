const studyModes = [
  {
    id: 'kana-to-kanji',
    title: 'Kana → Kanji',
    description: 'Write from reading',
    icon: '✍️',
    accent: '#378ADD',
    pill: 'Writing',
  },
  {
    id: 'kanji-to-reading',
    title: 'Kanji → Reading',
    description: 'Write the kana',
    icon: '📖',
    accent: '#3CBFA5',
    pill: 'Reading',
  },
  {
    id: 'vocabulary-writing',
    title: 'Vocab Writing',
    description: 'From meaning',
    icon: '🈶',
    accent: '#8B82F0',
    pill: 'Vocab',
  },
  {
    id: 'vocabulary-reading',
    title: 'Vocab Reading',
    description: 'Show meaning',
    icon: '👁️',
    accent: '#D4861C',
    pill: 'Vocab',
  },
];

export default function HomeScreen({
  onModeSelect, onManageVocabulary, onManageFlaggedItems, onPracticeTest,
  currentUser,
}) {
  const initial = (currentUser?.displayName || '?')[0].toUpperCase();

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-medium tracking-widest uppercase text-[#3a3a55] mb-0.5">University exam prep</p>
          <h1 className="text-2xl font-bold text-[#e0e0f0] tracking-tight">
            漢字勉強 <span className="text-[#C1392B]">·</span> Study
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-[#2a2a38]" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#C1392B] flex items-center justify-center text-white text-sm font-bold">
              {initial}
            </div>
          )}
          <span className="text-sm text-[#606080] hidden sm:block max-w-[100px] truncate">
            {currentUser?.displayName || 'Guest'}
          </span>
        </div>
      </div>

      {/* Study modes grid */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">Study modes</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {studyModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className="bg-[#171720] border border-[#2a2a38] rounded-xl p-4 text-left hover:border-[#3a3a55] active:scale-95 transition-all duration-150 focus:outline-none group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xl mb-3"
                style={{ background: `${mode.accent}22` }}
              >
                {mode.icon}
              </div>
              <div className="text-sm font-semibold text-[#e0e0f0] mb-1 leading-tight">{mode.title}</div>
              <div className="text-xs text-[#606080] mb-3">{mode.description}</div>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border"
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
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-5 flex-wrap">
        <button
          onClick={onPracticeTest}
          className="px-4 py-2.5 bg-[#C1392B] text-white text-sm font-semibold rounded-lg hover:bg-[#a62f24] transition-colors"
        >
          練習テスト
        </button>
        <button
          onClick={onManageFlaggedItems}
          className="px-4 py-2.5 bg-[#171720] border border-[#2a2a38] text-[#606080] text-sm rounded-lg hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors"
        >
          🚩 View Flags
        </button>
      </div>

      {/* How it works */}
      <div className="mt-8 bg-[#171720] border border-[#2a2a38] rounded-xl p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">How it works</p>
        <ol className="space-y-2">
          {['Choose a study mode above', 'Select chapters to practice', 'Complete the quiz session', 'Review your results'].map((step, i) => (
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

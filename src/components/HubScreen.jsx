import { APP_NAME, APP_NAME_ROMAJI, APP_TAGLINE } from '../brand';
import { CLASSES, countItems } from '../tests';

export default function HubScreen({ onOpenKanji, onOpenClass, onNavigateToProfile, currentUser }) {
  const initial = (currentUser?.displayName || '?')[0].toUpperCase();

  return (
    <div className="relative flex flex-col items-center py-8">
      <button
        onClick={onNavigateToProfile}
        className="absolute top-0 right-0 flex items-center gap-2 bg-[#171720] border border-[#2a2a38] rounded-full px-3 py-2 hover:border-[#3a3a55] transition-colors"
      >
        {currentUser?.avatarUrl ? (
          <img src={currentUser.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#C1392B] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
        )}
        <span className="text-sm font-medium text-[#606080] hidden sm:block max-w-[80px] truncate">{currentUser?.displayName || 'Guest'}</span>
      </button>

      <div className="text-center mb-10 mt-10">
        <h1 className="text-5xl sm:text-6xl font-bold text-[#e0e0f0] mb-3 tracking-tight" style={{ textWrap: 'balance' }}>{APP_NAME}</h1>
        {APP_NAME_ROMAJI && <p className="text-lg text-[#a0a0c0] mb-1">{APP_NAME_ROMAJI}</p>}
        <p className="text-sm text-[#606080]">{APP_TAGLINE}</p>
      </div>

      <p className="self-start w-full max-w-2xl mx-auto text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">Classes</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        <button
          onClick={onOpenKanji}
          className="text-left bg-[#171720] border border-[#2a2a38] rounded-xl p-6 hover:border-[#3a3a55] transition-colors"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-[#C1392B] mb-2">Japanese</p>
          <h2 className="noto text-2xl font-bold text-[#e0e0f0] mb-1">漢字・語彙</h2>
          <p className="text-sm text-[#606080]">Kanji and vocab drills, chapter practice tests, shared vocab</p>
        </button>

        {CLASSES.map((c) => {
          const items = c.tests.reduce((n, t) => n + countItems(t), 0);
          return (
            <button
              key={c.id}
              onClick={() => onOpenClass(c.id)}
              className="text-left bg-[#171720] border border-[#2a2a38] rounded-xl p-6 hover:border-[#3a3a55] transition-colors"
            >
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: c.accent }}>{c.subtitle}</p>
              <h2 className="noto text-2xl font-bold text-[#e0e0f0] mb-1">{c.name}</h2>
              <p className="text-sm text-[#606080]">{c.tests.length} {c.tests.length === 1 ? 'test' : 'tests'} · {items} questions{c.exam ? ` · ${c.exam}` : ''}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

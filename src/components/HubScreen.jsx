import { APP_NAME, APP_TAGLINE } from '../brand';
import { CLASSES, countItems, nightsUntil, examLabel, buildCombined, picksKey } from '../tests';
import { summarize } from './ClassTest';

function Avatar({ user }) {
  const initial = (user?.displayName || '?')[0].toUpperCase();
  return user?.avatarUrl
    ? <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
    : <div className="w-8 h-8 rounded-full bg-[#232C42] flex items-center justify-center text-[#E8EBF4] text-sm font-bold">{initial}</div>;
}

// How many of a class's tests have been finished (combined test included when drawn).
function classProgress(c, progress) {
  const tests = [...c.tests];
  const picks = c.combined && progress[picksKey(c.combined.id)];
  if (picks?.refs) tests.push(buildCombined(c, picks.refs));
  const done = tests.filter((t) => summarize(t, progress[t.id]).finished).length;
  return { done, total: c.tests.length + (c.combined ? 1 : 0) };
}

export default function HubScreen({ onOpenKanji, onOpenClass, onNavigateToProfile, currentUser, progress = {} }) {
  const upcoming = CLASSES
    .filter((c) => c.exam && nightsUntil(c.exam.date) >= 0)
    .sort((a, b) => nightsUntil(a.exam.date) - nightsUntil(b.exam.date))[0];
  const nights = upcoming ? nightsUntil(upcoming.exam.date) : null;

  return (
    <div className="relative py-4">
      <button
        onClick={onNavigateToProfile}
        className="hidden lg:flex absolute top-2 right-0 items-center gap-2 bg-[#131A2A] border border-[#232C42] rounded-full pl-1.5 pr-3 py-1.5 hover:border-[#35415E] transition-colors"
      >
        <Avatar user={currentUser} />
        <span className="text-sm font-medium text-[#9AA3BD] max-w-[110px] truncate">{currentUser?.displayName || 'Guest'}</span>
      </button>

      <header className="pt-8 pb-8 sm:pt-12">
        <div className="moon mb-6" aria-hidden="true" />
        <h1 className="font-display text-[44px] leading-[1.02] sm:text-7xl font-extrabold text-[#F3F1EA]" style={{ textWrap: 'balance' }}>
          {APP_NAME}
        </h1>
        <p className="text-base sm:text-lg text-[#9AA3BD] mt-3">{APP_TAGLINE}</p>
      </header>

      {upcoming && (
        <button
          onClick={() => onOpenClass(upcoming.id)}
          className="w-full text-left mb-8 rounded-2xl border border-[#5C4A22] bg-gradient-to-br from-[#2A2214] to-[#161A26] px-5 py-4 flex items-center gap-4 hover:border-[#8A6E2F] transition-colors"
        >
          <div className="flex-shrink-0 text-center w-14">
            <div className="font-display text-4xl font-extrabold text-[#F2B544] leading-none tabular-nums">{nights}</div>
            <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#C9A35A] mt-1">{nights === 1 ? 'night' : 'nights'}</div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C9A35A]">Next exam</p>
            <p className="noto text-lg font-bold text-[#F3F1EA] leading-snug">{upcoming.name} · {upcoming.exam.label}</p>
            <p className="text-sm text-[#B7A57C]">
              {nights === 0 ? 'Today. Good luck!' : nights === 1 ? 'Tomorrow. Time for the combined test.' : 'Tap to practise'}
            </p>
          </div>
        </button>
      )}

      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#5A6482] mb-3">Classes</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {CLASSES.map((c) => {
          const items = c.tests.reduce((n, t) => n + countItems(t), 0);
          const p = classProgress(c, progress);
          return (
            <button
              key={c.id}
              onClick={() => onOpenClass(c.id)}
              className="text-left bg-[#131A2A] border border-[#232C42] rounded-2xl p-5 sm:p-6 hover:border-[#35415E] hover:-translate-y-0.5 transition-all"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: c.accent }}>{c.subtitle}</p>
              <h2 className="noto text-2xl font-bold text-[#E8EBF4] mb-1">{c.name}</h2>
              <p className="text-sm text-[#9AA3BD]">{p.total} {p.total === 1 ? 'test' : 'tests'} · {items} questions</p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <div className="flex gap-1" aria-label={`${p.done} of ${p.total} tests finished`}>
                  {Array.from({ length: p.total }).map((_, i) => (
                    <span key={i} className="w-5 h-1.5 rounded-full" style={{ background: i < p.done ? c.accent : '#232C42' }} />
                  ))}
                </div>
                <span className="text-xs text-[#7681A0]">{examLabel(c.exam)}</span>
              </div>
            </button>
          );
        })}

        <button
          onClick={onOpenKanji}
          className="text-left bg-[#131A2A] border border-[#232C42] rounded-2xl p-5 sm:p-6 hover:border-[#35415E] hover:-translate-y-0.5 transition-all"
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#E0574A] mb-2">Japanese</p>
          <h2 className="noto text-2xl font-bold text-[#E8EBF4] mb-1">漢字・語彙</h2>
          <p className="text-sm text-[#9AA3BD]">Kanji and vocab drills, chapter practice tests, shared vocab</p>
        </button>
      </div>
    </div>
  );
}

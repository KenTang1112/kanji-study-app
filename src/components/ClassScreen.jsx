import { countItems, examLabel, buildCombined, picksKey } from '../tests';
import { summarize } from './ClassTest';

function statusOf(test, state) {
  const s = summarize(test, state);
  const pct = s.total ? Math.round((s.first / s.total) * 100) : 0;
  if (s.finished) return { text: `First try ${s.first}/${s.total} · ${pct}%`, done: true, frac: 1 };
  if (s.done > 0) return { text: `${s.done}/${s.total} answered`, done: false, frac: s.done / s.total };
  return { text: `${countItems(test)} questions`, done: false, frac: 0 };
}

function Bar({ frac, color }) {
  return (
    <div className="h-1 rounded-full bg-[#1A2234] overflow-hidden mt-3">
      <div className="h-full rounded-full" style={{ width: `${Math.round(frac * 100)}%`, background: color }} />
    </div>
  );
}

export default function ClassScreen({ classInfo, progress, onOpenTest, onBack }) {
  const cfg = classInfo.combined;
  const picks = cfg && progress[picksKey(cfg.id)];
  const combinedTest = cfg && picks?.refs ? buildCombined(classInfo, picks.refs) : null;
  const combinedStatus = combinedTest
    ? statusOf(combinedTest, progress[cfg.id])
    : cfg && { text: `${cfg.mc + cfg.blank} questions · new random draw`, done: false, frac: 0 };

  return (
    <div className="py-4">
      <button onClick={onBack} className="text-sm text-[#7681A0] hover:text-[#E8EBF4] mb-6">← All classes</button>
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: classInfo.accent }}>{classInfo.subtitle}</p>
      <h1 className="noto text-4xl font-bold text-[#E8EBF4]">{classInfo.name}</h1>
      {classInfo.exam && <p className="text-base text-[#9AA3BD] mt-1 mb-8">{examLabel(classInfo.exam)}</p>}

      {cfg && (
        <button
          onClick={() => onOpenTest(cfg.id)}
          className="w-full text-left mb-6 rounded-2xl p-5 sm:p-6 border transition-colors hover:brightness-110"
          style={{ borderColor: `${classInfo.accent}66`, background: `linear-gradient(135deg, ${classInfo.accent}22, #131A2A 70%)` }}
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-1" style={{ color: classInfo.accent }}>Full midterm · all topics</p>
          <h2 className="noto text-2xl font-bold text-[#F3F1EA]">{cfg.title}</h2>
          <p className="noto text-sm text-[#B4BCD0] mt-1">{cfg.description}</p>
          <p className="text-sm font-semibold mt-3" style={{ color: combinedStatus.done ? classInfo.accent : '#C5CBDB' }}>{combinedStatus.text}</p>
          <Bar frac={combinedStatus.frac} color={classInfo.accent} />
        </button>
      )}

      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#5A6482] mb-3">By topic</p>
      <div className="grid gap-3">
        {classInfo.tests.map((t) => {
          const st = statusOf(t, progress[t.id]);
          return (
            <button
              key={t.id}
              onClick={() => onOpenTest(t.id)}
              className="text-left bg-[#131A2A] border border-[#232C42] rounded-2xl p-5 hover:border-[#35415E] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="noto text-lg sm:text-xl font-bold text-[#E8EBF4]">{t.title}</h2>
                  {t.description && <p className="noto text-sm text-[#9AA3BD] mt-0.5">{t.description}</p>}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap mt-1" style={{ color: st.done ? classInfo.accent : '#7681A0' }}>{st.text}</span>
              </div>
              <Bar frac={st.frac} color={classInfo.accent} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

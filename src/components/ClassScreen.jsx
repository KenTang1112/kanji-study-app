import { countItems } from '../tests';
import { summarize } from './ClassTest';

export default function ClassScreen({ classInfo, progress, onOpenTest, onBack }) {
  return (
    <div className="py-6">
      <button onClick={onBack} className="text-sm text-[#606080] hover:text-[#e0e0f0] mb-6">← All classes</button>
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: classInfo.accent }}>{classInfo.subtitle}</p>
      <h1 className="noto text-3xl font-bold text-[#e0e0f0] mb-1">{classInfo.name}</h1>
      {classInfo.exam && <p className="text-sm text-[#606080] mb-8">{classInfo.exam}</p>}

      <div className="grid gap-3">
        {classInfo.tests.map((t) => {
          const s = summarize(t, progress[t.id]);
          const pct = s.total ? Math.round((s.first / s.total) * 100) : 0;
          let status = `${countItems(t)} questions · not started`;
          if (s.done > 0 && !s.finished) status = `${s.done}/${s.total} answered`;
          if (s.finished) status = `Done · first try ${s.first}/${s.total} (${pct}%)`;
          return (
            <button
              key={t.id}
              onClick={() => onOpenTest(t.id)}
              className="text-left bg-[#171720] border border-[#2a2a38] rounded-xl p-5 hover:border-[#3a3a55] transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <h2 className="noto text-xl font-bold text-[#e0e0f0]">{t.title}</h2>
                {t.description && <p className="noto text-base text-[#808098]">{t.description}</p>}
              </div>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full border flex-shrink-0 self-start sm:self-center"
                style={s.finished
                  ? { color: classInfo.accent, borderColor: `${classInfo.accent}55`, background: `${classInfo.accent}18` }
                  : { color: '#a0a0c0', borderColor: '#2a2a38' }}
              >{status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

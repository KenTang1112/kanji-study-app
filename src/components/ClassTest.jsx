import { useEffect, useMemo, useRef, useState } from 'react';

const LETTERS = ['a', 'b', 'c', 'd', 'e'];

// Loose match for typed answers: ignores width, case, spaces, macrons and punctuation.
export function normalizeAnswer(s) {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ōô]/g, 'o')
    .replace(/[ūû]/g, 'u')
    .replace(/[\s・()（）「」『』\-‐－―/／、,，.。]/g, '');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function freshState(test) {
  const order = {};
  test.sections.forEach((sec, si) => {
    if (sec.type !== 'mc') return;
    // Explanations refer to choices by letter (a = …), so only shuffle tests that opt in.
    sec.items.forEach((it, ii) => {
      const ids = it.choices.map((_, k) => k);
      order[`${si}-${ii}`] = test.shuffle ? shuffle(ids) : ids;
    });
  });
  return { ans: {}, order, onlyMissed: false };
}

export function summarize(test, state) {
  const total = test.sections.reduce((n, s) => n + s.items.length, 0);
  const vals = Object.values(state?.ans || {});
  const done = vals.length;
  const first = vals.filter((v) => v.first).length;
  return { total, done, first, finished: done === total };
}

export default function ClassTest({ test, classInfo, savedState, onSave, onBack, onRedraw }) {
  const [state, setState] = useState(() => {
    const s = savedState && savedState.ans ? savedState : freshState(test);
    // make sure every MC item has a shuffled order (tests can gain questions later)
    const base = freshState(test);
    return { ...s, order: test.shuffle ? { ...base.order, ...(s.order || {}) } : base.order };
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const accent = classInfo.accent;
  const en = test.language === 'en';

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  // Save after each change (not inside the state updater, which React may run during render).
  const changed = useRef(false);
  useEffect(() => {
    if (!changed.current) return;
    changed.current = false;
    onSave(state);
  }, [state, onSave]);

  const update = (fn) => {
    changed.current = true;
    setState(fn);
  };

  const pickMC = (key, choice, correct) => update((prev) => {
    const old = prev.ans[key];
    const ok = choice === correct;
    return { ...prev, ans: { ...prev.ans, [key]: { pick: choice, ok, first: old ? old.first : ok, attempts: (old?.attempts || 0) + 1 } } };
  });

  const checkBlank = (key, text, accept) => update((prev) => {
    const old = prev.ans[key];
    const ok = accept.some((a) => normalizeAnswer(a) === normalizeAnswer(text));
    return { ...prev, ans: { ...prev.ans, [key]: { text, ok, first: old ? old.first : ok, attempts: (old?.attempts || 0) + 1 } } };
  });

  const markCorrect = (key) => update((prev) => {
    const old = prev.ans[key];
    return { ...prev, ans: { ...prev.ans, [key]: { ...old, ok: true, self: true, first: old.attempts === 1 ? true : old.first } } };
  });

  const startRetry = () => {
    update((prev) => {
      // (retry flags let missed questions be answered again; first-try results stay)
      const ans = { ...prev.ans };
      Object.keys(ans).forEach((k) => { if (!ans[k].ok) ans[k] = { ...ans[k], retry: true }; });
      return { ...prev, ans, onlyMissed: true };
    });
    window.scrollTo({ top: 0 });
  };
  const showAll = () => update((prev) => {
    const ans = {};
    Object.entries(prev.ans).forEach(([k, v]) => { const { retry, ...rest } = v; ans[k] = rest; });
    return { ...prev, ans, onlyMissed: false };
  });
  // Combined tests get a brand-new random draw; normal tests just clear their answers.
  const reset = () => { setConfirmReset(false); window.scrollTo({ top: 0 }); if (onRedraw) onRedraw(); else update(() => freshState(test)); };

  const sum = summarize(test, state);
  const nowRight = Object.values(state.ans).filter((v) => v.ok).length;
  const anyWrong = Object.values(state.ans).some((v) => !v.ok);
  const pct = sum.total ? Math.round((sum.first / sum.total) * 100) : 0;

  const missed = useMemo(() => {
    const list = [];
    test.sections.forEach((sec, si) => sec.items.forEach((it, ii) => {
      const a = state.ans[`${si}-${ii}`];
      if (a && !a.first) list.push({ label: `${sec.type === 'mc' ? (en ? 'Q' : '問') : (en ? 'Blank ' : '穴埋め')}${ii + 1}`, answer: sec.type === 'mc' ? it.choices[it.answer] : it.answer, source: it.source });
    }));
    return list;
  }, [state.ans, test, en]);

  return (
    <div className="pb-16">
      {/* Header */}
      <button onClick={onBack} className="text-sm text-[#7681A0] hover:text-[#E8EBF4] mb-4">← {classInfo.name}</button>
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: accent }}>{classInfo.subtitle}</p>
        <h1 className="noto text-3xl sm:text-4xl font-bold text-[#F3F1EA] leading-tight">{test.title}</h1>
        {test.description && <p className="noto text-base text-[#9AA3BD] mt-2">{test.description}</p>}
      </div>

      {/* Sticky score strip */}
      <div className="sticky top-0 z-20 glass -mx-4 px-4 border-b py-3 mb-6 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ borderColor: `${accent}55` }}>
        <span className="text-sm text-[#9AA3BD] tabular-nums">{en ? 'Correct' : '正解'} <b className="text-lg text-[#E8EBF4]">{nowRight}</b> / {sum.done}</span>
        <span className="text-sm text-[#9AA3BD] tabular-nums">{en ? 'Left' : '残り'} <b className="text-lg text-[#E8EBF4]">{sum.total - sum.done}</b></span>
        <div className="flex-1 min-w-[100px] h-1.5 rounded bg-[#1A2234] overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${(sum.done / sum.total) * 100}%`, background: accent }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {!state.onlyMissed && anyWrong && (
            <button onClick={startRetry} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#232C42] text-[#E8EBF4] hover:border-[#35415E]">{en ? 'Retry missed' : '間違えた問題だけ'}</button>
          )}
          {state.onlyMissed && (
            <button onClick={showAll} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#232C42] text-[#E8EBF4] hover:border-[#35415E]">{en ? 'Show all' : '全問表示'}</button>
          )}
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#232C42] text-[#7681A0] hover:text-[#E8EBF4]">{onRedraw ? (en ? 'New draw' : '新しく出題') : (en ? 'Reset' : 'リセット')}</button>
          ) : (
            <span className="flex items-center gap-2 text-xs text-[#E5534B]">
              {onRedraw ? (en ? 'Draw new questions?' : '新しい問題にしますか？') : (en ? 'Clear all answers?' : '全部消しますか？')}
              <button onClick={reset} className="px-2 py-1 rounded bg-[#E5534B] text-white font-semibold">{onRedraw ? (en ? 'Draw' : '出題') : (en ? 'Clear' : '消す')}</button>
              <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded border border-[#232C42] text-[#9AA3BD]">{en ? 'Cancel' : 'やめる'}</button>
            </span>
          )}
        </div>
      </div>

      {test.sections.map((sec, si) => (
        <section key={si} className="mb-8">
          <h2 className="noto text-xl font-bold text-[#E8EBF4]">{sec.title} <span className="text-sm font-normal text-[#7681A0]">· {sec.items.length}</span></h2>
          {sec.instruction && <p className="text-sm text-[#7681A0] mb-3">{sec.instruction}</p>}
          <div className="bg-[#131A2A] border border-[#232C42] rounded-2xl divide-y divide-[#1E2638] overflow-hidden">
            {sec.items.map((it, ii) => {
              const key = `${si}-${ii}`;
              const a = state.ans[key];
              if (state.onlyMissed && !(a && !a.first)) return null;
              const answered = a && !a.retry;
              const num = sec.type === 'mc' ? `${en ? 'Q' : '問'}${ii + 1}` : `${ii + 1}`;
              return (
                <div key={key} className="p-4 sm:p-5">
                  <div className="flex gap-3 items-baseline">
                    <span className="text-sm font-mono flex-shrink-0 w-10" style={{ color: accent }}>{num}</span>
                    <p className="noto text-[17px] sm:text-lg text-[#E8EBF4] leading-relaxed whitespace-pre-line min-w-0">
                      {it.q}
                      {it.reversed && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-[#35415E] text-[#9AA3BD] align-middle">逆</span>}
                      {it.tag && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full align-middle whitespace-nowrap" style={{ color: accent, background: `${accent}1f` }}>{it.tag}</span>}
                    </p>
                  </div>

                  {sec.type === 'mc' ? (
                    <div className="mt-3 grid gap-1.5 sm:pl-[52px]">
                      {(state.order[key] || it.choices.map((_, k) => k)).map((orig, pos) => {
                        const isRight = orig === it.answer;
                        const isPick = answered && a.pick === orig;
                        let cls = 'border-transparent hover:bg-[#1A2234]';
                        if (answered && isRight) cls = 'border-[#2f6b52] bg-[#14271f]';
                        if (isPick && !isRight) cls = 'border-[#7a2e2a] bg-[#2a1616]';
                        return (
                          <button
                            key={orig}
                            disabled={answered}
                            onClick={() => pickMC(key, orig, it.answer)}
                            className={`flex gap-3 items-start text-left w-full px-2.5 py-2 rounded-lg border transition-colors ${cls} ${answered ? 'cursor-default' : ''}`}
                          >
                            <span
                              className="flex-shrink-0 w-8 h-6 mt-0.5 rounded-full border text-xs font-mono flex items-center justify-center"
                              style={isPick
                                ? { background: isRight ? '#34C38F' : '#E5534B', borderColor: 'transparent', color: '#0B0E17' }
                                : answered && isRight
                                  ? { borderColor: '#34C38F', color: '#34C38F', borderWidth: 2 }
                                  : { borderColor: accent, color: accent }}
                            >{LETTERS[pos]}</span>
                            <span className="noto text-base sm:text-[17px] text-[#D5DAE6] leading-relaxed">{it.choices[orig]}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <BlankInput
                      key={answered ? 'done' : 'open'}
                      answered={answered}
                      value={answered ? a.text : ''}
                      onCheck={(text) => checkBlank(key, text, it.accept)}
                      accent={accent}
                      en={en}
                    />
                  )}

                  {answered && (
                    <div className={`mt-3 sm:ml-[52px] border-l-[3px] pl-3 py-1 text-[15px] sm:text-base text-[#B4BCD0] grid gap-1 ${a.ok ? 'border-[#34C38F]' : 'border-[#E5534B]'}`}>
                      <span className={`font-bold ${a.ok ? 'text-[#34C38F]' : 'text-[#E5534B]'}`}>
                        {a.ok
                          ? (a.self ? (en ? 'Correct (self-marked)' : '正解（自己採点）') : (en ? 'Correct' : '正解'))
                          : sec.type === 'mc'
                            ? `${en ? 'Wrong · answer' : '不正解 · 正解は'} ${LETTERS[(state.order[key] || []).indexOf(it.answer)]}`
                            : (en ? 'Wrong' : '不正解')}
                      </span>
                      {sec.type === 'blank' && <span className="noto">{en ? 'Answer: ' : '答え：'}{it.answer}</span>}
                      {it.explanation && <span className="noto">{it.explanation}</span>}
                      {it.source && <span className="font-mono text-xs text-[#7681A0]">{it.source}</span>}
                      {sec.type === 'blank' && !a.ok && (
                        <button onClick={() => markCorrect(key)} className="text-left text-xs underline" style={{ color: accent }}>
                          {en ? 'My answer means the same → mark correct' : '同じ意味の答えだった → 正解にする'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
            {state.onlyMissed && sec.items.every((_, ii) => { const a = state.ans[`${si}-${ii}`]; return !(a && !a.first); }) && (
              <p className="p-4 text-sm text-[#7681A0]">{en ? 'Nothing missed in this part.' : 'このパートは全問正解。'}</p>
            )}
          </div>
        </section>
      ))}

      {sum.finished && (
        <section className="mt-8 p-5 rounded-xl border-2 bg-[#131A2A]" style={{ borderColor: accent }} aria-live="polite">
          <h2 className="noto text-xl font-bold text-[#E8EBF4] mb-2">{en ? 'Result' : '結果'}</h2>
          <p className="font-mono text-4xl text-[#E8EBF4] tabular-nums mb-2">{sum.first} / {sum.total} · {pct}%</p>
          <p className="text-xs text-[#7681A0] mb-1">
            {test.sections.map((sec, si) => {
              const n = sec.items.filter((_, ii) => state.ans[`${si}-${ii}`]?.first).length;
              return `${sec.type === 'mc' ? (en ? 'Multiple choice' : '選択') : (en ? 'Blanks' : '穴埋め')} ${n}/${sec.items.length}`;
            }).join(' · ')}
            {' · '}{en ? 'first-try score; fixed since' : '初回の得点 · 現在'}: {nowRight}/{sum.total}
          </p>
          {missed.length > 0 ? (
            <>
              <p className="text-sm text-[#9AA3BD] mt-3 mb-2">{en ? 'Missed on the first try:' : '初回で間違えた問題：'}</p>
              <ol className="list-decimal pl-5 grid gap-1.5 text-base text-[#D5DAE6] noto">
                {missed.map((m, i) => (
                  <li key={i}>{m.label}: {m.answer} <span className="font-mono text-xs text-[#7681A0]">{m.source}</span></li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-[#34C38F] mt-2">{en ? 'Nothing missed on the first try.' : '初回で全問正解！'}</p>
          )}
        </section>
      )}
    </div>
  );
}

function BlankInput({ answered, value, onCheck, accent, en }) {
  const [text, setText] = useState(value || '');
  return (
    <form
      className="mt-3 sm:pl-[52px] flex flex-wrap gap-2 items-center"
      onSubmit={(e) => { e.preventDefault(); if (!answered && text.trim()) onCheck(text); }}
    >
      <input
        value={text}
        readOnly={answered}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
        className="noto bg-transparent border-0 border-b-2 px-2 py-1.5 text-lg text-[#E8EBF4] w-full max-w-[320px] focus:outline-none"
        style={{ borderColor: answered ? '#232C42' : accent }}
        aria-label={en ? 'Answer' : '答え'}
      />
      {!answered && (
        <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-[#0B0E17]" style={{ background: accent }}>
          {en ? 'Check' : '答え合わせ'}
        </button>
      )}
    </form>
  );
}

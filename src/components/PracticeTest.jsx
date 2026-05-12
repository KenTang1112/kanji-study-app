import { useState, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────
//  PRACTICE TEST DATA  (Chapters 15–19)
//  問題1/2 = kanji→reading (typed hiragana)
//  問題3   = kana→kanji   (handwritten)
// ─────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 15,
    title: '15課 練習',
    color: 'from-pink-400 to-purple-500',
    sections: [
      {
        id: 'q1',
        type: 'reading', // kanji → hiragana
        instruction: '問題1　次の説明を読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
        context: '問診票',
        questions: [
          { num: 1,  display: '症状',  answer: 'しょうじょう' },
          { num: 2,  display: '下痢',  answer: 'げり' },
          { num: 3,  display: '吐き気', answer: 'はきけ' },
          { num: 4,  display: '睡眠',  answer: 'すいみん' },
          { num: 5,  display: '糖尿病', answer: 'とうにょうびょう' },
          { num: 6,  display: '心臓病', answer: 'しんぞうびょう' },
          { num: 7,  display: '腎臓病', answer: 'じんぞうびょう' },
          { num: 8,  display: '肝臓病', answer: 'かんぞうびょう' },
          { num: 9,  display: '疾患',  answer: 'しっかん' },
          { num: 10, display: '脳梗塞', answer: 'のうこうそく' },
          { num: 11, display: '胃潰瘍', answer: 'いかいよう' },
          { num: 12, display: '妊娠',  answer: 'にんしん' },
        ],
      },
      {
        id: 'q2',
        type: 'reading',
        instruction: '問題2　例のように書きなさい。',
        hint: '例：わたしは大学へ行きます。→ 私　だいがく　いきます',
        questions: [
          { num: 1,  display: '視力検査', answer: 'しりょくけんさ' },
          { num: 2,  display: '皮膚',   answer: 'ひふ' },
          { num: 3,  display: '受診',   answer: 'じゅしん' },
          { num: 4,  display: '喉',     answer: 'のど' },
          { num: 5,  display: '過剰',   answer: 'かじょう' },
          { num: 6,  display: '摂取',   answer: 'せっしゅ' },
          { num: 7,  display: '処方箋', answer: 'しょほうせん' },
          { num: 8,  display: '胎児',   answer: 'たいじ' },
          { num: 9,  display: '矯正',   answer: 'きょうせい' },
          { num: 10, display: '乗り物酔い', answer: 'のりものよい' },
        ],
      },
    ],
  },
  {
    id: 16,
    title: '16課 練習',
    color: 'from-blue-400 to-cyan-500',
    sections: [
      {
        id: 'q1',
        type: 'reading',
        instruction: '問題1　次の説明を読んで、①〜⑨の読みをひらがなで書きなさい。',
        context: 'メール・手紙文',
        questions: [
          { num: 1,  display: '拝啓',   answer: 'はいけい' },
          { num: 2,  display: '紅葉',   answer: 'こうよう' },
          { num: 3,  display: '丁寧',   answer: 'ていねい' },
          { num: 4,  display: 'ご無沙汰', answer: 'ごぶさた' },
          { num: 5,  display: 'お陰様',  answer: 'おかげさま' },
          { num: 6,  display: '喪中',   answer: 'もちゅう' },
          { num: 7,  display: '挨拶',   answer: 'あいさつ' },
          { num: 8,  display: '永眠',   answer: 'えいみん' },
          { num: 9,  display: '厚情',   answer: 'こうじょう' },
        ],
      },
      {
        id: 'q2',
        type: 'reading',
        instruction: '問題2　例のように書きなさい。',
        questions: [
          { num: 1,  display: 'おくやみ',  answer: 'お悔やみ' },
          { num: 2,  display: '一周忌',  answer: 'いっしゅうき' },
          { num: 3,  display: '親戚',   answer: 'しんせき' },
          { num: 4,  display: '平均',   answer: 'へいきん' },
          { num: 5,  display: '陰気',   answer: 'いんき' },
          { num: 6,  display: '誠実',   answer: 'せいじつ' },
          { num: 7,  display: '喪失',   answer: 'そうしつ' },
        ],
      },
    ],
  },
  {
    id: 17,
    title: '17課 練習',
    color: 'from-green-400 to-emerald-500',
    sections: [
      {
        id: 'q1',
        type: 'reading',
        instruction: '問題1　次の説明を読んで、下線部①〜⑨の読みをひらがなで書きなさい。',
        context: '防災対策',
        questions: [
          { num: 1,  display: '避難場所', answer: 'ひなんばしょ' },
          { num: 2,  display: '避難経路', answer: 'ひなんけいろ' },
          { num: 3,  display: '貴重品',  answer: 'きちょうひん' },
          { num: 4,  display: '印鑑',   answer: 'いんかん' },
          { num: 5,  display: '懐中電灯', answer: 'かいちゅうでんとう' },
          { num: 6,  display: '日頃',   answer: 'ひごろ' },
          { num: 7,  display: '親戚',   answer: 'しんせき' },
          { num: 8,  display: '安否',   answer: 'あんぴ' },
          { num: 9,  display: '契約',   answer: 'けいやく' },
        ],
      },
      {
        id: 'q2',
        type: 'reading',
        instruction: '問題2　下線部の読みをひらがなで書きなさい。',
        questions: [
          { num: 1,  display: '津波',   answer: 'つなみ' },
          { num: 2,  display: '噴出',   answer: 'ふんしゅつ' },
          { num: 3,  display: '垂直距離', answer: 'すいちょくきょり' },
          { num: 4,  display: '範囲',   answer: 'はんい' },
          { num: 5,  display: '瓦',     answer: 'かわら' },
          { num: 6,  display: '霧',     answer: 'きり' },
          { num: 7,  display: '炎',     answer: 'ほのお' },
          { num: 8,  display: '嵐',     answer: 'あらし' },
        ],
      },
      {
        id: 'q3',
        type: 'writing', // kana → kanji (handwritten)
        instruction: '問題3　送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        questions: [
          { num: 1,  display: 'ちぢんで',  answer: '縮んで' },
          { num: 2,  display: 'かみなり',  answer: '雷' },
          { num: 3,  display: 'なつかしい', answer: '懐かしい' },
          { num: 4,  display: 'かくれる',  answer: '隠れる' },
        ],
      },
    ],
  },
  {
    id: 18,
    title: '18課 練習',
    color: 'from-orange-400 to-red-500',
    sections: [
      {
        id: 'q1',
        type: 'reading',
        instruction: '問題1　次の新聞の見出しを読んで、下線部①〜⑦の読みをひらがなで書きなさい。',
        questions: [
          { num: 1,  display: '怨恨',   answer: 'えんこん' },
          { num: 2,  display: '金品',   answer: 'きんぴん' },
          { num: 3,  display: '箇所',   answer: 'かしょ' },
          { num: 4,  display: '刺し傷',  answer: 'さしきず' },
          { num: 5,  display: '踏切',   answer: 'ふみきり' },
          { num: 6,  display: '砕けた',  answer: 'くだけた' },
          { num: 7,  display: '跡',     answer: 'あと' },
        ],
      },
      {
        id: 'q2',
        type: 'reading',
        instruction: '問題2　下線部の読みをひらがなで書きなさい。',
        questions: [
          { num: 1,  display: '通り魔',  answer: 'とおりま' },
          { num: 2,  display: '拉致',   answer: 'らち' },
          { num: 3,  display: '脅迫',   answer: 'きょうはく' },
          { num: 4,  display: '詐欺',   answer: 'さぎ' },
          { num: 5,  display: '血痕',   answer: 'けっこん' },
          { num: 6,  display: '束縛',   answer: 'そくばく' },
          { num: 7,  display: '不祥事',  answer: 'ふしょうじ' },
          { num: 8,  display: '邦画',   answer: 'ほうが' },
          { num: 9,  display: '邪魔',   answer: 'じゃま' },
          { num: 10, display: '便宜',   answer: 'べんぎ' },
        ],
      },
      {
        id: 'q3',
        type: 'writing',
        instruction: '問題3　送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        questions: [
          { num: 1,  display: 'せまる',  answer: '迫る' },
          { num: 2,  display: 'おどしとる', answer: '脅し取る' },
          { num: 3,  display: 'みじめな', answer: '惨めな' },
          { num: 4,  display: 'ふまえる', answer: '踏まえる' },
          { num: 5,  display: 'まかなう', answer: '賄う' },
          { num: 6,  display: 'ねらう',  answer: '狙う' },
          { num: 7,  display: 'しばる',  answer: '縛る' },
          { num: 8,  display: 'あざむく', answer: '欺く' },
          { num: 9,  display: 'ける',    answer: '蹴る' },
          { num: 10, display: 'なぐる',  answer: '殴る' },
        ],
      },
    ],
  },
  {
    id: 19,
    title: '19課 練習',
    color: 'from-violet-400 to-purple-600',
    sections: [
      {
        id: 'q1',
        type: 'reading',
        instruction: '問題1　次のニュースの見出しを読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
        questions: [
          { num: 1,  display: '無免許運転', answer: 'むめんきょうんてん' },
          { num: 2,  display: '児童',   answer: 'じどう' },
          { num: 3,  display: '突っ込む', answer: 'つっこむ' },
          { num: 4,  display: '渋滞',   answer: 'じゅうたい' },
          { num: 5,  display: '追突事故', answer: 'ついとつじこ' },
          { num: 6,  display: '懲役',   answer: 'ちょうえき' },
          { num: 7,  display: '執行猶予', answer: 'しっこうゆうよ' },
          { num: 8,  display: '死刑囚',  answer: 'しけいしゅう' },
          { num: 9,  display: '死刑制度廃止', answer: 'しけいせいどはいし' },
          { num: 10, display: '訴える',  answer: 'うったえる' },
          { num: 11, display: '運搬業者', answer: 'うんぱんぎょうしゃ' },
          { num: 12, display: '妨害',   answer: 'ぼうがい' },
        ],
      },
      {
        id: 'q2',
        type: 'reading',
        instruction: '問題2　下線部の漢字の読みを書きなさい。',
        questions: [
          { num: 1,  display: '精密検査', answer: 'せいみつけんさ' },
          { num: 2,  display: '扉',     answer: 'とびら' },
          { num: 3,  display: '柵',     answer: 'さく' },
          { num: 4,  display: '法廷',   answer: 'ほうてい' },
          { num: 5,  display: '陪審員',  answer: 'ばいしんいん' },
          { num: 6,  display: '開廷',   answer: 'かいてい' },
          { num: 7,  display: '衝突',   answer: 'しょうとつ' },
          { num: 8,  display: '怠った',  answer: 'おこたった' },
          { num: 9,  display: '隔週',   answer: 'かくしゅう' },
        ],
      },
      {
        id: 'q3',
        type: 'writing',
        instruction: '問題3　送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        questions: [
          { num: 1,  display: 'へだてられていた', answer: '隔てられていた' },
          { num: 2,  display: 'おぼれる',  answer: '溺れる' },
          { num: 3,  display: 'ひかえる',  answer: '控える' },
          { num: 4,  display: 'さばく',    answer: '裁く' },
          { num: 5,  display: 'おちいる',  answer: '陥る' },
          { num: 6,  display: 'くりかえし', answer: '繰り返し' },
          { num: 7,  display: 'さえぎる',  answer: '遮る' },
          { num: 8,  display: 'まぬがれる', answer: '免れる' },
          { num: 9,  display: 'さまたげる', answer: '妨げる' },
          { num: 10, display: 'しぶい',    answer: '渋い' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
//  HANDWRITING CANVAS COMPONENT
// ─────────────────────────────────────────────
function HandwritingCanvas({ onClear, disabled }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
  }, [disabled]);

  const draw = useCallback((e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [disabled]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  }, [onClear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
    return () => {
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair w-full"
        style={{ touchAction: 'none', maxWidth: '200px', height: '100px', display: 'block' }}
      />
      {!disabled && (
        <button
          onClick={clearCanvas}
          className="mt-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          ✕ 消す
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  READING QUESTION ROW  (kanji → hiragana typed)
// ─────────────────────────────────────────────
function ReadingQuestion({ question, submitted, userAnswer, onChange }) {
  const isCorrect = submitted && userAnswer.trim() === question.answer;
  const isWrong = submitted && userAnswer.trim() !== question.answer;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all
      ${submitted ? (isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-white border border-gray-200 hover:border-blue-300'}`}
    >
      <span className="text-gray-500 font-medium min-w-[1.5rem] text-sm mt-2">
        {question.num}
      </span>
      <div className="flex-1">
        {/* The kanji word — tappable/clickable focus */}
        <div className="text-2xl font-medium text-gray-800 mb-2 leading-tight kanji-text">
          {question.display}
        </div>
        {/* Hiragana input */}
        <input
          type="text"
          value={userAnswer}
          onChange={e => onChange(e.target.value)}
          disabled={submitted}
          placeholder="ひらがなで入力"
          className={`w-full px-3 py-2 rounded-lg border text-base outline-none transition-all
            ${submitted
              ? isCorrect
                ? 'bg-green-100 border-green-300 text-green-800'
                : 'bg-red-100 border-red-300 text-red-800'
              : 'bg-gray-50 border-gray-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100'
            }`}
        />
        {/* Answer reveal after submit */}
        {submitted && (
          <div className="mt-2 flex items-center gap-2">
            {isCorrect ? (
              <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <span>✓</span> 正解！
              </span>
            ) : (
              <div className="text-sm">
                <span className="text-red-500 line-through mr-2">{userAnswer || '（未回答）'}</span>
                <span className="text-green-700 font-semibold">→ {question.answer}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  WRITING QUESTION  (hiragana → kanji, handwritten)
// ─────────────────────────────────────────────
function WritingQuestion({ question, submitted }) {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (submitted) setShowAnswer(true);
  }, [submitted]);

  return (
    <div className={`p-3 rounded-xl transition-all border
      ${submitted ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-indigo-300'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-gray-500 font-medium min-w-[1.5rem] text-sm mt-1">
          {question.num}
        </span>
        <div className="flex-1">
          {/* The hiragana prompt */}
          <div className="text-xl text-indigo-700 font-medium mb-3 reading-text">
            {question.display}
          </div>
          {/* Handwriting canvas */}
          <HandwritingCanvas disabled={submitted} />
          {/* Answer shown after submit */}
          {submitted && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">答え：</span>
              <span className="text-2xl font-bold text-gray-800 kanji-text">{question.answer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECTION COMPONENT
// ─────────────────────────────────────────────
function Section({ section, submitted, answers, onAnswerChange }) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 leading-relaxed">
          {section.instruction}
        </p>
        {section.hint && (
          <div className="mt-2 inline-block border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 bg-gray-50">
            {section.hint}
          </div>
        )}
        {section.context && (
          <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 inline-block">
            【{section.context}】
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.questions.map(q => {
          const key = `${section.id}-${q.num}`;
          return section.type === 'reading' ? (
            <ReadingQuestion
              key={key}
              question={q}
              submitted={submitted}
              userAnswer={answers[key] || ''}
              onChange={val => onAnswerChange(key, val)}
            />
          ) : (
            <WritingQuestion
              key={key}
              question={q}
              submitted={submitted}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CHAPTER TAB
// ─────────────────────────────────────────────
function ChapterTab({ chapter, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
        ${active
          ? `bg-gradient-to-r ${chapter.color} text-white shadow-md scale-105`
          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
        }`}
    >
      {chapter.id}課
    </button>
  );
}

// ─────────────────────────────────────────────
//  SCORE SUMMARY BANNER
// ─────────────────────────────────────────────
function ScoreBanner({ chapter, answers, submitted }) {
  if (!submitted) return null;

  let correct = 0;
  let total = 0;

  chapter.sections.forEach(section => {
    if (section.type === 'reading') {
      section.questions.forEach(q => {
        const key = `${section.id}-${q.num}`;
        total++;
        if ((answers[key] || '').trim() === q.answer) correct++;
      });
    }
    // writing questions are self-graded, not auto-scored
  });

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '📖' : '💪';

  return (
    <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-r ${chapter.color} text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">読み問題の結果</p>
          <p className="text-3xl font-bold">{correct} / {total}</p>
          <p className="text-white/90 text-sm mt-1">{pct}% 正解</p>
        </div>
        <div className="text-5xl">{emoji}</div>
      </div>
      {total > 0 && (
        <div className="mt-3 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PRACTICE TEST COMPONENT
// ─────────────────────────────────────────────
export default function PracticeTest({ onBack }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [answers, setAnswers] = useState({});      // { "q1-1": "しょうじょう", ... }
  const [submitted, setSubmitted] = useState({});  // { chapterId: true }

  const chapter = CHAPTERS[activeChapter];
  const isSubmitted = !!submitted[chapter.id];

  const handleAnswerChange = useCallback((key, value) => {
    setAnswers(prev => ({ ...prev, [`${chapter.id}-${key}`]: value }));
  }, [chapter.id]);

  const getAnswer = useCallback((key) => {
    return answers[`${chapter.id}-${key}`] || '';
  }, [answers, chapter.id]);

  const handleSubmit = () => {
    setSubmitted(prev => ({ ...prev, [chapter.id]: true }));
    // scroll to top of chapter
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    // clear this chapter's answers
    setAnswers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${chapter.id}-`)) delete next[k];
      });
      return next;
    });
    setSubmitted(prev => { const n = {...prev}; delete n[chapter.id]; return n; });
  };

  // Count filled answers for this chapter
  const filledCount = chapter.sections
    .filter(s => s.type === 'reading')
    .flatMap(s => s.questions)
    .filter(q => {
      const sec = chapter.sections.find(s => s.questions.includes(q));
      return (answers[`${chapter.id}-${sec.id}-${q.num}`] || '').trim().length > 0;
    }).length;

  const totalReadingQ = chapter.sections
    .filter(s => s.type === 'reading')
    .reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          ← ホームへ
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">練習テスト</h1>
          <p className="text-sm text-gray-500">15〜19課</p>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CHAPTERS.map((ch, idx) => (
          <ChapterTab
            key={ch.id}
            chapter={ch}
            active={activeChapter === idx}
            onClick={() => setActiveChapter(idx)}
          />
        ))}
      </div>

      {/* Chapter Header */}
      <div className={`bg-gradient-to-r ${chapter.color} rounded-2xl p-5 mb-6 text-white shadow-lg`}>
        <h2 className="text-2xl font-bold">{chapter.title}</h2>
        <p className="text-white/80 text-sm mt-1">
          {isSubmitted ? '提出済み' : `読み問題 ${totalReadingQ}問`}
          {chapter.sections.some(s => s.type === 'writing') ? ' ＋ 手書き問題' : ''}
        </p>
      </div>

      {/* Score Banner (after submit) */}
      <ScoreBanner
        chapter={chapter}
        answers={answers}
        submitted={isSubmitted}
      />

      {/* Sections */}
      {chapter.sections.map(section => (
        <Section
          key={section.id}
          section={section}
          submitted={isSubmitted}
          answers={
            // remap answers with chapter prefix stripped for display
            Object.fromEntries(
              Object.entries(answers)
                .filter(([k]) => k.startsWith(`${chapter.id}-`))
                .map(([k, v]) => [k.replace(`${chapter.id}-`, ''), v])
            )
          }
          onAnswerChange={handleAnswerChange}
        />
      ))}

      {/* Submit / Reset Bar */}
      <div className="sticky bottom-4 mt-8">
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-xl p-4 flex items-center gap-4">
          {!isSubmitted ? (
            <>
              <div className="flex-1 text-sm text-gray-500">
                読み問題の入力後、採点ボタンを押してください。
                <span className="ml-2 text-blue-600 font-medium">
                  手書き問題は自己採点です。
                </span>
              </div>
              <button
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md
                  bg-gradient-to-r ${chapter.color} hover:scale-105 active:scale-95`}
              >
                採点する ✓
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-sm text-gray-600">
                採点が完了しました。手書き問題の答えも確認してください。
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                やり直す ↺
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

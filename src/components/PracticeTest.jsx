import { useState, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// HANDWRITING CANVAS
// ─────────────────────────────────────────────────────────────────
function HandwritingCanvas({ width = 130, height = 75, disabled }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, []);

  const start = useCallback((e) => { if (disabled) return; e.preventDefault(); drawing.current = true; last.current = getPos(e); }, [disabled, getPos]);
  const move = useCallback((e) => {
    if (!drawing.current || disabled) return; e.preventDefault();
    const p = getPos(e); const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#e0e0f0'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    last.current = p;
  }, [disabled, getPos]);
  const stop = useCallback(() => { drawing.current = false; }, []);

  const clear = (e) => { e.stopPropagation(); const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };

  useEffect(() => {
    const c = canvasRef.current;
    c.addEventListener('touchstart', start, { passive: false });
    c.addEventListener('touchmove', move, { passive: false });
    c.addEventListener('touchend', stop);
    return () => { c.removeEventListener('touchstart', start); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', stop); };
  }, [start, move, stop]);

  return (
    <span className="inline-flex flex-col items-center" style={{ verticalAlign: 'middle' }}>
      <canvas ref={canvasRef} width={width * 2} height={height * 2}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        style={{ touchAction: 'none', width: `${width}px`, height: `${height}px`, cursor: disabled ? 'default' : 'crosshair' }}
        className="border border-[#2a2a38] rounded bg-[#0F0F14]" />
      {!disabled && <button onClick={clear} className="text-[10px] text-gray-400 hover:text-red-500 mt-0.5 leading-none">消す</button>}
    </span>
  );
}

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];

// ─────────────────────────────────────────────────────────────────
// Splits a sentence string into parts around multiple target words.
// Returns array of { text, isTarget, targetKey } segments.
// targets = [{ word, key }]
// ─────────────────────────────────────────────────────────────────
function splitSentence(sentence, targets) {
  // Build a sorted list of all target positions
  let ranges = [];
  targets.forEach(({ word, key }) => {
    let idx = 0;
    while (true) {
      const pos = sentence.indexOf(word, idx);
      if (pos === -1) break;
      ranges.push({ start: pos, end: pos + word.length, word, key });
      idx = pos + 1;
    }
  });
  ranges.sort((a, b) => a.start - b.start);

  // Remove overlaps (keep first)
  const clean = [];
  let cursor = 0;
  ranges.forEach(r => { if (r.start >= cursor) { clean.push(r); cursor = r.end; } });

  // Build segments
  const segments = [];
  let pos = 0;
  clean.forEach(r => {
    if (r.start > pos) segments.push({ text: sentence.slice(pos, r.start), isTarget: false });
    segments.push({ text: r.word, isTarget: true, key: r.key });
    pos = r.end;
  });
  if (pos < sentence.length) segments.push({ text: sentence.slice(pos), isTarget: false });
  return segments;
}

// ─────────────────────────────────────────────────────────────────
// DATA  — every underlined word captured as a separate target
// type: 'reading_list'       = context box + numbered answer grid
// type: 'reading_headlines'  = headlines box + numbered answer grid
// type: 'reading_sentences'  = full sentences, each with 1–N inputs
// type: 'writing'            = hiragana underlined → handwriting canvas
// type: 'info'               = 覚えておこう info box
// ─────────────────────────────────────────────────────────────────
const CHAPTERS = [

  // ═══ 15課 ═══════════════════════════════════════════════════════
  {
    id: 15, accent: '#9333ea',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: '問題1',
        instruction: '次の説明を読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
        contextTitle: '問　診　票',
        contextLines: [
          '・どんな①症状がありますか　　（　②下痢と③吐き気　）',
          '・いつからですか　　　　　　（　　　　　　　）から',
          '・食欲がありますか　　　　　□はい　☑いいえ',
          '・④睡眠時間はどのぐらいですか（　　）時間',
          '・今までにかかった病気がありますか',
          '　☑はい',
          '　□⑤糖尿病　□⑥心臓病　□⑦腎臓病　□⑧肝臓病　□血液⑨疾患　□高血圧症',
          '　□リウマチ　□ぜんそく　☑アレルギー疾患　□⑩脳梗塞　□その他（⑪胃潰瘍）',
          '　□いいえ',
          '・（女性の方）いま⑫妊娠していますか　□はい（　週）☑いいえ',
        ],
        questions: [
          { num: 1,  target: '症状',   answer: 'しょうじょう' },
          { num: 2,  target: '下痢',   answer: 'げり' },
          { num: 3,  target: '吐き気', answer: 'はきけ' },
          { num: 4,  target: '睡眠',   answer: 'すいみん' },
          { num: 5,  target: '糖尿病', answer: 'とうにょうびょう' },
          { num: 6,  target: '心臓病', answer: 'しんぞうびょう' },
          { num: 7,  target: '腎臓病', answer: 'じんぞうびょう' },
          { num: 8,  target: '肝臓病', answer: 'かんぞうびょう' },
          { num: 9,  target: '疾患',   answer: 'しっかん' },
          { num: 10, target: '脳梗塞', answer: 'のうこうそく' },
          { num: 11, target: '胃潰瘍', answer: 'いかいよう' },
          { num: 12, target: '妊娠',   answer: 'にんしん' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '例のように書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1,  full: '眼科に行くとまず視力検査を受けます。',
            targets: [{ word: '視力検査', answer: 'しりょくけんさ' }] },
          { num: 2,  full: '亀は皮膚と肺の両方で呼吸する。',
            targets: [{ word: '亀', answer: 'かめ' }, { word: '皮膚', answer: 'ひふ' }, { word: '肺', answer: 'はい' }] },
          { num: 3,  full: '鬱病かもしれないと思ったら、何科を受診すればいいですか。',
            targets: [{ word: '受診', answer: 'じゅしん' }] },
          // ④: 喉 = reading, かわく = writing
          { num: 4,  full: 'この薬を飲むと喉がかわくという人が多い。',
            targets: [{ word: '喉', answer: 'のど' }],
            writingTargets: [{ word: 'かわく', answer: '渇く' }] },
          { num: 5,  full: '水に溶けるビタミンは過剰に摂取しても尿と一緒に出て行きます。',
            targets: [{ word: '過剰', answer: 'かじょう' }, { word: '摂取', answer: 'せっしゅ' }] },
          { num: 6,  full: 'えいようが偏らないように食生活に注意しましょう。',
            targets: [{ word: '食生活', answer: 'しょくせいかつ' }],
            writingTargets: [{ word: 'えいよう', answer: '栄養' }] },
          { num: 7,  full: 'この処方箋を薬局に出して、薬をもらってください。',
            targets: [{ word: '処方箋', answer: 'しょほうせん' }] },
          { num: 8,  full: 'エコー（ultrasonography）で胎児の状態を見る。',
            targets: [{ word: '胎児', answer: 'たいじ' }] },
          { num: 9,  full: '歯並びを矯正する。',
            targets: [{ word: '矯正', answer: 'きょうせい' }] },
          // ⑩: 乗り物酔い = reading, きく = writing
          { num: 10, full: '乗り物酔いにきく薬をください。',
            targets: [{ word: '乗り物酔い', answer: 'のりものよい' }],
            writingTargets: [{ word: 'きく', answer: '効く' }] },
        ],
      },
    ],
  },

  // ═══ 16課 ═══════════════════════════════════════════════════════
  {
    id: 16, accent: '#2563eb',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: '問題1',
        instruction: '次の説明を読んで、①〜⑨の読みをひらがなで書きなさい。',
        contextTitle: 'メール・手紙文',
        // Three documents shown side by side in the textbook
        contextDocs: [
          {
            title: '手紙（秋）',
            lines: [
              '①拝啓　秋も深まり②紅葉が美しい季節と',
              'なりました。この度はご③丁寧にお祝いを',
              'お贈り頂きまして、③誠にありがとうご',
              'ざいました。　　　　　　　　敬具',
            ],
          },
          {
            title: 'メール作成',
            lines: [
              '大変④ご無沙汰しておりますが、皆様お',
              'お変わりありませんか。こちらは⑤お陰様',
              'で、皆、元気にしております。実は、ご相',
              '談したいことがあってメールをお送りしました。',
            ],
          },
          {
            title: '喪中はがき',
            lines: [
              '⑥喪中につき年末年始のご⑦挨拶を',
              '失礼させていただきます。',
              '去る○月○日に夫○○が⑧永眠いたしました。',
              '本年中に賜りましたご⑨厚情に感謝申し上げます。',
            ],
          },
        ],
        questions: [
          { num: 1, target: '拝啓',    answer: 'はいけい' },
          { num: 2, target: 'ご丁寧',     answer: 'ごていねい' },
          { num: 3, target: '誠に',       answer: 'まことに' },
          { num: 4, target: 'ご無沙汰', answer: 'ごぶさた' },
          { num: 5, target: 'お陰様',  answer: 'おかげさま' },
          { num: 6, target: '喪中',    answer: 'もちゅう' },
          { num: 7, target: '挨拶',    answer: 'あいさつ' },
          { num: 8, target: '致しました', answer: 'いたしました' },
          { num: 9, target: '賜りました', answer: 'たまわりました' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '例のように書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1, full: 'つつしんでおくやみ申し上げます。',
            targets: [{ word: 'おくやみ', answer: 'お悔やみ' }],
            writingTargets: [{ word: 'おくやみ', answer: 'お悔やみ' }, { word: 'つつしんで', answer: '慎んで' }] },
          { num: 2, full: '祖父の一周忌に親戚が集まった。',
            targets: [{ word: '一周忌', answer: 'いっしゅうき' }, { word: '親戚', answer: 'しんせき' }] },
          { num: 3, full: '日本人女性の平均 じゅみょうは何歳ですか。',
            targets: [{ word: '平均', answer: 'へいきん' }],
            writingTargets: [{ word: 'じゅみょう', answer: '寿命' }] },
          { num: 4, full: '陰気な顔ばかりしていないで、もっと笑顔を見せたほうがいいですよ。',
            targets: [{ word: '陰気', answer: 'いんき' }, { word: '笑顔', answer: 'えがお' }] },
          { num: 5, full: 'あの人が本当に誠実かどうかは疑問だ。',
            targets: [{ word: '誠実', answer: 'せいじつ' }, { word: '疑問', answer: 'ぎもん' }] },
          { num: 6, full: '彼は仕事のしっぱいが続き、すっかり自信を喪失している。',
            targets: [{ word: '喪失', answer: 'そうしつ' }],
            writingTargets: [{ word: 'しっぱい', answer: '失敗' }] },
          { num: 7, full: '子どもが生まれたとき、我が社の慶弔休暇の規定では２日休暇がとれる。',
            targets: [{ word: '慶弔休暇', answer: 'けいちょうきゅうか' }] },
        ],
      },
      {
        id: 's3', type: 'info',
        label: '覚えておこう',
        content: '悪用を目的とした法的な書類の金額の書き換えを防ぐために、次のような漢字を書く場合がある。\n\n一＝壱　十＝拾　二＝弐　百＝佰　三＝参　千＝阡　五＝伍　万＝萬　円＝圓',
      },
    ],
  },

  // ═══ 17課 ═══════════════════════════════════════════════════════
  {
    id: 17, accent: '#16a34a',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: '問題1',
        instruction: '次の説明を読んで、下線部①〜⑨の読みをひらがなで書きなさい。',
        contextTitle: '防災対策',
        contextLines: [
          '【これだけは用意を！】',
          '(1) 飲料水　(2) 食料２〜３日分',
          '(3) ①貴重品類（現金、②印鑑など）',
          '(4) ③懐中電灯、ローソク、マッチ',
          '(5) トランジスターラジオ、電池',
          '(6) 下着、衣類、タオル、ビニール、ふろしき、ひも、手袋、ちり紙',
          '(7) ヘルメットなど　(8) 応急医薬品　(9) 筆記用具',
          '(10) 乳幼児のいる家庭では、母子手帳、ミルク、オムツなど　(11) 運動靴',
          '',
          '【④日頃の備え】',
          '(1) ⑤避難場所や避難経路を確認しておく。',
          '(2) ⑥崖くずれが起きそうな場所を確認しておく。',
          '(3) 消火器や消火用の水を備えておく。',
          '(4) 家具等が倒れないようにしておく。',
          '(5) 非常持ち出し品を準備しておく。',
          '',
          '【災害用伝言ダイヤル　局番なし１７１】',
          '⑦大規模な火災や地震などが発生した際に、⑧親戚や友人などの安否確認に利用できます。事前の⑨契約は不要です。',
        ],
        questions: [
          { num: 1, target: '貴重品',   answer: 'きちょうひん' },
          { num: 2, target: '印鑑',     answer: 'いんかん' },
          { num: 3, target: '懐中電灯', answer: 'かいちゅうでんとう' },
          { num: 4, target: '日頃',     answer: 'ひごろ' },
          { num: 5, target: '避難場所', answer: 'ひなんばしょ' },
          { num: 6, target: '崖',       answer: 'がけ' },
          { num: 7, target: '大規模',   answer: 'だいきぼ' },
          { num: 8, target: '親戚',     answer: 'しんせき' },
          { num: 9, target: '契約',     answer: 'けいやく' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          { num: 1, full: 'この地震による津波の心配はありません。',
            targets: [{ word: '津波', answer: 'つなみ' }] },
          { num: 2, full: '火山からマグマが噴出することを「噴火」という。気象庁では火口から固形物が水平または垂直距離で100〜300メートルの範囲を超えるもの、としている。',
            targets: [{ word: '噴出', answer: 'ふんしゅつ' }, { word: '垂直距離', answer: 'すいちょくきょり' }, { word: '範囲', answer: 'はんい' }] },
          { num: 3, full: '台風で屋根の瓦が飛ばされた。',
            targets: [{ word: '瓦', answer: 'かわら' }] },
          { num: 4, full: '濃い霧のため見通しが悪くなっております。ご注意ください。',
            targets: [{ word: '霧', answer: 'きり' }] },
          { num: 5, full: '山火事で、強風のために炎の竜巻が発生した。',
            targets: [{ word: '炎', answer: 'ほのお' }] },
          { num: 6, full: '国の中枢機能が集中している東京の防災対策に取り組む。',
            targets: [{ word: '中枢', answer: 'ちゅうすう' }] },
          { num: 7, full: '首都圏を襲った豪雨はまさに滝のような雨だった。',
            targets: [{ word: '首都圏', answer: 'しゅとけん' }, { word: '豪雨', answer: 'ごうう' }] },
          { num: 8, full: '発達した低気圧の影響で師走の日本列島に嵐が吹き荒れた。宮崎市では最大瞬間風速25.2メートルを観測した。',
            targets: [{ word: '嵐', answer: 'あらし' }] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        // Each sentence may have multiple writing targets
        sentences: [
          { num: 1, full: 'セーターがちぢんで着られなくなった。',
            writingTargets: [{ word: 'ちぢんで', answer: '縮んで' }] },
          // ② both かみなり AND ひびく are writing targets
          { num: 2, full: 'かみなりの音がひびく。',
            writingTargets: [{ word: 'かみなり', answer: '雷' }, { word: 'ひびく', answer: '響く' }] },
          { num: 3, full: 'なつかしい曲が聞こえてきた。',
            writingTargets: [{ word: 'なつかしい', answer: '懐かしい' }] },
          { num: 4, full: '木のかげにかくれる。',
            writingTargets: [{ word: 'かくれる', answer: '隠れる' }] },
        ],
      },
    ],
  },

  // ═══ 18課 ═══════════════════════════════════════════════════════
  {
    id: 18, accent: '#dc2626',
    sections: [
      {
        id: 's1', type: 'reading_headlines',
        label: '問題1',
        instruction: '次の新聞の見出しを読んで、下線部①〜⑦の読みをひらがなで書きなさい。',
        headlines: [
          { text: '①怨恨か、金品②奪われず十数③箇所に深い④刺し傷', inverted: true },
          { text: 'ＪＲ⑤踏切　置き石か　線路に石の⑥砕けた⑦跡',   inverted: false },
        ],
        questions: [
          { num: 1, target: '怨恨',    answer: 'えんこん' },
          { num: 2, target: '奪われず', answer: 'うばわれず' },
          { num: 3, target: '箇所',    answer: 'かしょ' },
          { num: 4, target: '刺し傷',  answer: 'さしきず' },
          { num: 5, target: '踏切',    answer: 'ふみきり' },
          { num: 6, target: '砕けた',  answer: 'くだけた' },
          { num: 7, target: '跡',      answer: 'あと' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          { num: 1,  full: '悲惨な通り魔事件が発生した。',
            targets: [{ word: '悲惨', answer: 'ひさん' }, { word: '通り魔', answer: 'とおりま' }] },
          { num: 2,  full: '「俺」は、「私」と同じ意味ですが、男性しか使いません。',
            targets: [{ word: '俺', answer: 'おれ' }] },
          { num: 3,  full: 'その少年は15歳のとき犯罪組織に拉致され、脅迫されて詐欺と殺人を犯した。',
            targets: [
              { word: '犯罪組織', answer: 'はんざいそしき' },
              { word: '拉致',     answer: 'らち' },
              { word: '脅迫',     answer: 'きょうはく' },
              { word: '詐欺',     answer: 'さぎ' },
              { word: '犯した',   answer: 'おかした' },
            ] },
          { num: 4,  full: '警察は被害者に恨みをもつ者の犯行とみている。',
            targets: [{ word: '恨み', answer: 'うらみ' }] },
          { num: 5,  full: '現場に残された血痕のDNA鑑定が進められている。',
            targets: [{ word: '血痕', answer: 'けっこん' }, { word: '鑑定', answer: 'かんてい' }] },
          { num: 6,  full: '束縛されるのをきらって、彼は家庭を持たなかった。',
            targets: [{ word: '束縛', answer: 'そくばく' }] },
          { num: 7,  full: '出演者が不祥事を起こしたため、イベントは中止になった。',
            targets: [{ word: '不祥事', answer: 'ふしょうじ' }] },
          { num: 8,  full: '邦人とは日本人、邦画とは日本映画のことです。',
            targets: [{ word: '邦人', answer: 'ほうじん' }, { word: '邦画', answer: 'ほうが' }] },
          { num: 9,  full: 'そこに荷物を置くと通行の邪魔になります。',
            targets: [{ word: '邪魔', answer: 'じゃま' }] },
          { num: 10, full: '彼は賄賂をもらって便宜を図った罪で逮捕された。',
            targets: [
              { word: '賄賂', answer: 'わいろ' },
              { word: '便宜', answer: 'べんぎ' },
              { word: '図った', answer: 'はかった' },
              { word: '逮捕', answer: 'たいほ' },
            ] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        twoCol: true,
        sentences: [
          { num: 1,  full: '締め切りがせまる。',               writingTargets: [{ word: 'せまる',     answer: '迫る' }] },
          { num: 2,  full: '金をおどし取る。',                 writingTargets: [{ word: 'おどし取る', answer: '脅し取る' }] },
          { num: 3,  full: 'みじめな気持ちになる。',           writingTargets: [{ word: 'みじめな',   answer: '惨めな' }] },
          { num: 4,  full: '事実をふまえる。',                 writingTargets: [{ word: 'ふまえる',   answer: '踏まえる' }] },
          { num: 5,  full: 'アルバイト代で生活費をまかなう。', writingTargets: [{ word: 'まかなう',   answer: '賄う' }] },
          { num: 6,  full: '的をねらう。',                     writingTargets: [{ word: 'ねらう',     answer: '狙う' }] },
          { num: 7,  full: '荷物をひもでしばる。',             writingTargets: [{ word: 'しばる',     answer: '縛る' }] },
          { num: 8,  full: '敵をあざむく。',                   writingTargets: [{ word: 'あざむく',   answer: '欺く' }] },
          { num: 9,  full: 'ボールをける。',                   writingTargets: [{ word: 'ける',       answer: '蹴る' }] },
          { num: 10, full: '顔をなぐる。',                     writingTargets: [{ word: 'なぐる',     answer: '殴る' }] },
        ],
      },
    ],
  },

  // ═══ 19課 ═══════════════════════════════════════════════════════
  {
    id: 19, accent: '#7c3aed',
    sections: [
      {
        id: 's1', type: 'reading_headlines',
        label: '問題1',
        instruction: '次のニュースの見出しを読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
        headlines: [
          { text: '・乗用車　①無免許運転で　②児童の列に③突っ込む',           inverted: false },
          { text: '・④渋滞の首都高※で⑤追突事故　　※首都高：首都高速道路',    inverted: false },
          { text: '・運転手に⑥懲役２年⑦執行猶予３年',                        inverted: false },
          { text: '・元⑧死刑囚　⑨死刑制度廃止を⑩訴える',                    inverted: false },
          { text: '・⑪運搬業者　積荷落下で　交通⑫妨害',                      inverted: false },
        ],
        questions: [
          { num: 1,  target: '無免許運転',   answer: 'むめんきょうんてん' },
          { num: 2,  target: '児童',          answer: 'じどう' },
          { num: 3,  target: '突っ込む',      answer: 'つっこむ' },
          { num: 4,  target: '渋滞',          answer: 'じゅうたい' },
          { num: 5,  target: '追突事故',      answer: 'ついとつじこ' },
          { num: 6,  target: '懲役',          answer: 'ちょうえき' },
          { num: 7,  target: '執行猶予',      answer: 'しっこうゆうよ' },
          { num: 8,  target: '死刑囚',        answer: 'しけいしゅう' },
          { num: 9,  target: '死刑制度廃止',  answer: 'しけいせいどはいし' },
          { num: 10, target: '訴える',        answer: 'うったえる' },
          { num: 11, target: '運搬業者',      answer: 'うんぱんぎょうしゃ' },
          { num: 12, target: '妨害',          answer: 'ぼうがい' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '下線部の漢字の読みを書きなさい。',
        sentences: [
          { num: 1, full: '精密検査を受ける。',
            targets: [{ word: '精密検査', answer: 'せいみつけんさ' }] },
          { num: 2, full: '開く扉にご注意ください。',
            targets: [{ word: '扉', answer: 'とびら' }] },
          { num: 3, full: '雷に驚いた牛が柵を壊して逃げ出した。',
            targets: [{ word: '雷', answer: 'かみなり' }, { word: '柵', answer: 'さく' }] },
          { num: 4, full: '法廷で裁判を傍聴する。',
            targets: [{ word: '法廷', answer: 'ほうてい' }, { word: '裁判', answer: 'さいばん' }, { word: '傍聴', answer: 'ぼうちょう' }] },
          { num: 5, full: '米国では陪審員制度を採用している。',
            targets: [{ word: '陪審員', answer: 'ばいしんいん' }] },
          { num: 6, full: '裁判員制度による裁判は連日開廷される。',
            targets: [{ word: '裁判員制度', answer: 'さいばんいんせいど' }, { word: '裁判', answer: 'さいばん' }, { word: '開廷', answer: 'かいてい' }] },
          { num: 7, full: '休憩なしで12時間運転した、衝突したときの記憶はないと運転手は話している。',
            targets: [{ word: '休憩', answer: 'きゅうけい' }, { word: '衝突', answer: 'しょうとつ' }, { word: '記憶', answer: 'きおく' }] },
          { num: 8, full: '工事責任者は安全確認を怠ったことを認めている。',
            targets: [{ word: '怠った', answer: 'おこたった' }] },
          { num: 9, full: 'このテレビ番組は隔週で放送されている。',
            targets: [{ word: '番組', answer: 'ばんぐみ' }, { word: '隔週', answer: 'かくしゅう' }, { word: '放送', answer: 'ほうそう' }] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがながある場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        twoCol: true,
        sentences: [
          { num: 1,  full: 'その部屋はカーテンでへだてられていた。', writingTargets: [{ word: 'へだてられていた', answer: '隔てられていた' }] },
          { num: 2,  full: '海でおぼれる。',                          writingTargets: [{ word: 'おぼれる',         answer: '溺れる' }] },
          { num: 3,  full: '電話番号をひかえる。',                    writingTargets: [{ word: 'ひかえる',         answer: '控える' }] },
          { num: 4,  full: '法で人をさばく。',                        writingTargets: [{ word: 'さばく',           answer: '裁く' }] },
          { num: 5,  full: '人間不信におちいる。',                    writingTargets: [{ word: 'おちいる',         answer: '陥る' }] },
          { num: 6,  full: 'くりかえし練習する。',                    writingTargets: [{ word: 'くりかえし',       answer: '繰り返し' }] },
          { num: 7,  full: '光をさえぎる。',                          writingTargets: [{ word: 'さえぎる',         answer: '遮る' }] },
          { num: 8,  full: '死刑をまぬがれる。',                      writingTargets: [{ word: 'まぬがれる',       answer: '免れる' }] },
          { num: 9,  full: '睡眠をさまたげる。',                      writingTargets: [{ word: 'さまたげる',       answer: '妨げる' }] },
          { num: 10, full: 'このお茶はしぶい。',                      writingTargets: [{ word: 'しぶい',           answer: '渋い' }] },
        ],
      },
    ],
  },

  // ═══ 20課 ═══════════════════════════════════════════════════════
  {
    id: 20, accent: '#0891b2',
    sections: [

      // 問題1a — word box fill-in-blank (語彙選択)
      {
        id: 's1a', type: 'word_box_fill',
        label: '問題1 語彙選択',
        instruction: '（　）に入る言葉を□の中から選んで書きなさい。',
        groups: [
          {
            choices: ['訂正', '是正', '修正'],
            sentences: [
              { num: 1, pre: '先ほどお伝えしたニュースの中で間違いがありましたので、', post: 'してお詫びいたします。', answer: '訂正' },
              { num: 2, pre: '法案を', post: 'する。', answer: '修正' },
              { num: 3, pre: '貿易の不均衡を', post: 'する。', answer: '是正' },
            ],
          },
          {
            choices: ['処置', '措置'],
            sentences: [
              { num: 4, pre: '救急車で応急', post: 'をする。', answer: '処置' },
              { num: 5, pre: 'A国がB国に対し、緊急輸入制限', post: 'をとったことで貿易の摩擦が生じている。', answer: '措置' },
            ],
          },
        ],
      },

      // 問題1b — reading targets ①〜④
      {
        id: 's1', type: 'reading_list',
        label: '問題1 読み',
        instruction: '下線部①〜④の読みをひらがなで書きなさい。',
        contextTitle: '語彙選択',
        contextLines: [
          '┌ 訂正・①是正・修正 ┐',
          '(1) 先ほどお伝えしたニュースの中で間違いがありましたので、（　　）してお詫びいたします。',
          '(2) 法案を（　　）する。',
          '(3) 貿易の②不均衡を（　　）する。',
          '',
          '┌ 処置・③措置 ┐',
          '(4) 救急車で応急（　　）をする。',
          '(5) A国がB国に対し、緊急輸入制限（　　）をとったことで貿易の④摩擦が生じている。',
        ],
        questions: [
          { num: 1, target: '是正',   answer: 'ぜせい' },
          { num: 2, target: '不均衡', answer: 'ふきんこう' },
          { num: 3, target: '措置',   answer: 'そち' },
          { num: 4, target: '摩擦',   answer: 'まさつ' },
        ],
      },

      // 問題2 — reading sentences ①〜⑮
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '次の文を読んで、下線部①〜⑮の読みをひらがなで書きなさい。',
        sentences: [
          {
            num: 1,
            full: '①天皇 ②皇后 両③陛下は今年の文化④勲章の受章者を⑤皇居に招き茶会を⑥催されました。⑦皇太子、同⑧妃両殿下も出席されました。',
            targets: [
              { word: '天皇',   answer: 'てんのう' },
              { word: '皇后',   answer: 'こうごう' },
              { word: '陛下',   answer: 'へいか' },
              { word: '勲章',   answer: 'くんしょう' },
              { word: '皇居',   answer: 'こうきょ' },
              { word: '催され',  answer: 'もよおされ' },
              { word: '皇太子', answer: 'こうたいし' },
              { word: '妃',     answer: 'ひ' },
            ],
          },
          {
            num: 2,
            full: '京都にある桂離宮は江戸初期に造られた天皇家の⑨別荘です。庭園や建物が当時のままの⑩姿で残されています。',
            targets: [
              { word: '別荘', answer: 'べっそう' },
              { word: '姿',   answer: 'すがた' },
            ],
          },
          {
            num: 3,
            full: '日本で⑪唯一の本格的な洋風⑫宮殿である⑬迎賓館赤坂離宮※は和洋⑭折衷の内部⑮装飾が見事である。',
            targets: [
              { word: '唯一',   answer: 'ゆいいつ' },
              { word: '宮殿',   answer: 'きゅうでん' },
              { word: '迎賓館', answer: 'げいひんかん' },
              { word: '折衷',   answer: 'せっちゅう' },
              { word: '装飾',   answer: 'そうしょく' },
            ],
          },
        ],
      },

      // 問題3 — writing (hiragana → kanji)
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        sentences: [
          { num: 1, full: 'この小説はたいしゅう向けだ。',
            writingTargets: [{ word: 'たいしゅう', answer: '大衆' }] },
          { num: 2, full: '臓器移植をした患者にきょぜつ反応が現れた。',
            writingTargets: [{ word: 'きょぜつ', answer: '拒絶' }] },
          { num: 3, full: '今、すれちがった人は会社のどうりょうに似ている。',
            writingTargets: [{ word: 'すれちがった', answer: '擦れ違った' }, { word: 'どうりょう', answer: '同僚' }] },
          { num: 4, full: '兄は世界のしへいや硬貨を集めるのが好きです。',
            writingTargets: [{ word: 'しへい', answer: '紙幣' }] },
          { num: 5, full: 'べっそうでパーティーをします。ぜひ、遊びに来てください。',
            writingTargets: [{ word: 'べっそう', answer: '別荘' }, { word: 'ぜひ', answer: '是非' }] },
        ],
      },

    ],
  },

  // ═══ 21課 ═══════════════════════════════════════════════════════
  {
    id: 21, accent: '#ea580c',
    sections: [

      // 問題1 — reading headlines + article ①〜⑫
      {
        id: 's1', type: 'reading_headlines',
        label: '問題1',
        instruction: '次の見出しや記事を読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
        headlines: [
          { text: '①絶滅の②危機にある③幻の鳥を④保護', inverted: true },
          { text: '⑤横綱 初場所で⑥連覇を⑦狙う',      inverted: true },
          { text: '○○ 初の⑧盗塁に⑨輝く',             inverted: false },
          { text: 'プロ野球パンサーズ　⑩餅つき大会でファンと交流　選手とコーチ、⑪監督も参加してファンと⑫親睦を深めた。', inverted: false },
        ],
        questions: [
          { num: 1,  target: '絶滅', answer: 'ぜつめつ' },
          { num: 2,  target: '危機', answer: 'きき' },
          { num: 3,  target: '幻',   answer: 'まぼろし' },
          { num: 4,  target: '保護', answer: 'ほご' },
          { num: 5,  target: '横綱', answer: 'よこづな' },
          { num: 6,  target: '連覇', answer: 'れんぱ' },
          { num: 7,  target: '狙う', answer: 'ねらう' },
          { num: 8,  target: '盗塁', answer: 'とうるい' },
          { num: 9,  target: '輝く', answer: 'かがやく' },
          { num: 10, target: '餅',   answer: 'もち' },
          { num: 11, target: '監督', answer: 'かんとく' },
          { num: 12, target: '親睦', answer: 'しんぼく' },
        ],
      },

      // 問題2 — reading sentences
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '下線部の漢字の読みを書きなさい。',
        sentences: [
          {
            num: 1,
            full: '三島由紀夫の『お嬢さん』という小説を読んだことがありますか。',
            targets: [
              { word: 'お嬢さん', answer: 'おじょうさん' },
            ],
          },
          {
            num: 2,
            full: '表彰台に立った選手たちは、国歌が流れるなかで国旗を見つめた。',
            targets: [
              { word: '表彰台', answer: 'ひょうしょうだい' },
              { word: '国旗',   answer: 'こっき' },
            ],
          },
          {
            num: 3,
            full: 'あの選手はインタビューを受けるとき、髪の毛を触る癖がある。',
            targets: [
              { word: '髪',  answer: 'かみ' },
              { word: '触る', answer: 'さわる' },
              { word: '癖',  answer: 'くせ' },
            ],
          },
          {
            num: 4,
            full: '彼は与えられた任務を、無事、遂行した。',
            targets: [
              { word: '与えられた', answer: 'あたえられた' },
              { word: '任務',       answer: 'にんむ' },
              { word: '無事',       answer: 'ぶじ' },
              { word: '遂行',       answer: 'すいこう' },
            ],
          },
        ],
      },

      // 問題3 — writing (hiragana → kanji), two columns
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        twoCol: true,
        sentences: [
          { num: 1, full: '取材のため現地におもむく。',
            writingTargets: [{ word: 'おもむく', answer: '赴く' }] },
          { num: 2, full: '日頃から体をきたえる。',
            writingTargets: [{ word: 'きたえる', answer: '鍛える' }] },
          { num: 3, full: '川の水面を魚がはねる。',
            writingTargets: [{ word: 'はねる', answer: '跳ねる' }] },
          { num: 4, full: '今回の作品は前作よりおとる。',
            writingTargets: [{ word: 'おとる', answer: '劣る' }] },
          { num: 5, full: '難しい技にいどむ。',
            writingTargets: [{ word: 'いどむ', answer: '挑む' }] },
          { num: 6, full: '靴下にあなが開く。',
            writingTargets: [{ word: 'あな', answer: '穴' }] },
          { num: 7, full: 'はたを振って応援する。',
            writingTargets: [{ word: 'はた', answer: '旗' }] },
          { num: 8, full: '親の愛情にうえているように見える。',
            writingTargets: [{ word: 'うえて', answer: '飢えて' }] },
        ],
      },

      // 問題4 — kanji multiple choice
      {
        id: 's4', type: 'kanji_choice',
        label: '問題4',
        instruction: '{　} の正しいほうに○をつけなさい。',
        sentences: [
          { num: 1, pre: '選挙をきけん', post: 'する。',           choices: ['危険', '棄権'], answer: '棄権' },
          { num: 2, pre: '人権をようご', post: 'する。',           choices: ['擁護', '養護'], answer: '擁護' },
          { num: 3, pre: 'どう',         post: 'メダルを獲得する。', choices: ['胴', '銅'],    answer: '銅' },
          { num: 4, pre: 'かんせい',     post: 'が上がる。',        choices: ['完成', '歓声'], answer: '歓声' },
          { num: 5, pre: '空をとぶ',     post: '。',               choices: ['飛ぶ', '跳ぶ'], answer: '飛ぶ' },
          { num: 6, pre: '我がチームのけんとう', post: 'を祈る。', choices: ['健闘', '検討'], answer: '健闘' },
        ],
      },

    ],
  },

  // ═══ 22課 ═══════════════════════════════════════════════════════
  {
    id: 22, accent: '#0d9488',
    sections: [

      // 問題1 — reading sentences ①〜⑪
      {
        id: 's1', type: 'reading_sentences',
        label: '問題1',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          {
            num: 1,
            full: '父は輸入業者から仕入れた商品を小売店に卸す仕事をしています。',
            targets: [
              { word: '輸入業者', answer: 'ゆにゅうぎょうしゃ' },
              { word: '仕入れた', answer: 'しいれた' },
              { word: '卸す',     answer: 'おろす' },
            ],
          },
          {
            num: 2,
            full: '自動販売機で飲み物を買う場合、小銭が必要です。',
            targets: [
              { word: '自動販売機', answer: 'じどうはんばいき' },
              { word: '場合',       answer: 'ばあい' },
              { word: '小銭',       answer: 'こぜに' },
            ],
          },
          {
            num: 3,
            full: '浅草の浅草寺は７世紀に勝海という僧によって整備された。',
            targets: [
              { word: '僧',   answer: 'そう' },
              { word: '整備', answer: 'せいび' },
            ],
          },
          {
            num: 4,
            full: '江戸時代の庶民の娯楽について書かれた研究書が出版された。',
            targets: [
              { word: '江戸時代', answer: 'えどじだい' },
              { word: '庶民',     answer: 'しょみん' },
              { word: '娯楽',     answer: 'ごらく' },
              { word: '研究書',   answer: 'けんきゅうしょ' },
              { word: '出版',     answer: 'しゅっぱん' },
            ],
          },
          {
            num: 5,
            full: 'A社とB社が合併して、世界最大の鉄鋼メーカーが誕生した。',
            targets: [
              { word: '合併', answer: 'がっぺい' },
              { word: '鉄鋼', answer: 'てっこう' },
              { word: '誕生', answer: 'たんじょう' },
            ],
          },
          {
            num: 6,
            full: '学生を６つの班に分けて、討論を行った。',
            targets: [
              { word: '班',   answer: 'はん' },
              { word: '討論', answer: 'とうろん' },
            ],
          },
          {
            num: 7,
            full: '私は両親と妻を扶養している。',
            targets: [
              { word: '両親', answer: 'りょうしん' },
              { word: '妻',   answer: 'つま' },
              { word: '扶養', answer: 'ふよう' },
            ],
          },
          {
            num: 8,
            full: '光沢が出るまで、革の靴を磨く。',
            targets: [
              { word: '光沢', answer: 'こうたく' },
              { word: '革',   answer: 'かわ' },
            ],
          },
          {
            num: 9,
            full: '車掌は安全を確認した上でドアを閉めた。',
            targets: [
              { word: '車掌', answer: 'しゃしょう' },
              { word: '安全', answer: 'あんぜん' },
              { word: '確認', answer: 'かくにん' },
            ],
          },
          {
            num: 10,
            full: 'C社は、来月上旬に最新のエンジンを搭載した車を発売する。',
            targets: [
              { word: '上旬', answer: 'じょうじゅん' },
              { word: '搭載', answer: 'とうさい' },
              { word: '発売', answer: 'はつばい' },
            ],
          },
          {
            num: 11,
            full: 'プールで潜水の練習をした。',
            targets: [
              { word: '潜水', answer: 'せんすい' },
              { word: '練習', answer: 'れんしゅう' },
            ],
          },
        ],
      },

      // 問題2 — writing (hiragana → kanji)
      {
        id: 's2', type: 'writing',
        label: '問題2',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        sentences: [
          { num: 1, full: '夏がしゅんのこの魚はあなにもぐっているためアナゴと呼ばれる。',
            writingTargets: [{ word: 'しゅん', answer: '旬' }, { word: 'あな', answer: '穴' }, { word: 'もぐって', answer: '潜って' }] },
          { num: 2, full: 'この古墳は一体だれのはかなのだろう。',
            writingTargets: [{ word: 'だれ', answer: '誰' }, { word: 'はか', answer: '墓' }] },
          { num: 3, full: '大型の船、１せきの値段はいくらぐらいですか。',
            writingTargets: [{ word: 'せき', answer: '隻' }] },
          { num: 4, full: 'クレジットカードでばかり買い物をしているときんせん感覚が鈍くなりそうだ。',
            writingTargets: [{ word: 'きんせん', answer: '金銭' }] },
          { num: 5, full: '忙しいけれど、じゅうじつした毎日を送っています。',
            writingTargets: [{ word: 'じゅうじつした', answer: '充実した' }] },
        ],
      },

      // 問題3 — kanji multiple choice
      {
        id: 's3', type: 'kanji_choice',
        label: '問題3',
        instruction: '{　} の正しいほうに○をつけなさい。',
        sentences: [
          { num: 1, pre: 'しんじゅ',           post: 'の指輪',    choices: ['真珠', '真朱'], answer: '真珠' },
          { num: 2, pre: '昆虫を捕るあみ',     post: '',          choices: ['綱', '網'],    answer: '網' },
          { num: 3, pre: '情報化社会のへいがい', post: '',         choices: ['幣害', '弊害'], answer: '弊害' },
          { num: 4, pre: 'はんけい',           post: '３センチの円', choices: ['半径', '半経'], answer: '半径' },
          { num: 5, pre: 'テレビのごらく',     post: '番組',      choices: ['誤楽', '娯楽'], answer: '娯楽' },
          { num: 6, pre: '国際線のとうじょう', post: 'ゲート',    choices: ['塔乗', '搭乗'], answer: '搭乗' },
        ],
      },

    ],
  },

  // ═══ 23課 ═══════════════════════════════════════════════════════
  {
    id: 23, accent: '#d97706',
    sections: [

      // 問題1 — reading sentences (literature theme)
      {
        id: 's1', type: 'reading_sentences',
        label: '問題1',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          {
            num: 1,
            full: '川柳は俳句と同じ17字の短い詩で、人生や世の中のできごとを滑稽に描写するものです。',
            targets: [
              { word: '川柳', answer: 'せんりゅう' },
              { word: '詩',   answer: 'し' },
              { word: '滑稽', answer: 'こっけい' },
              { word: '描写', answer: 'びょうしゃ' },
            ],
          },
          {
            num: 2,
            full: '『枕草子』は平安時代に書かれた随筆です。',
            targets: [
              { word: '随筆', answer: 'ずいひつ' },
            ],
          },
          {
            num: 3,
            full: 'シェイクスピアは四大悲劇などたくさんの戯曲を書きました。',
            targets: [
              { word: '悲劇', answer: 'ひげき' },
              { word: '戯曲', answer: 'ぎきょく' },
            ],
          },
          {
            num: 4,
            full: '比喩とは、例えば、「月のように丸い」のように、類似したものを借りて表現することです。',
            targets: [
              { word: '比喩', answer: 'ひゆ' },
              { word: '例えば', answer: 'たとえば' },
              { word: '丸い', answer: 'まるい' },
              { word: '類似', answer: 'るいじ' },
              { word: '表現', answer: 'ひょうげん' },
            ],
          },
          {
            num: 5,
            full: '小説などの中で動物などを人間のように扱うことを擬人化といいます。',
            targets: [
              { word: '扱う',   answer: 'あつかう' },
              { word: '擬人化', answer: 'ぎじんか' },
            ],
          },
          {
            num: 6,
            full: '詩において同一または似た音を、ある位置に繰り返し用いることを韻を踏むといいます。',
            targets: [
              { word: '似た',   answer: 'にた' },
              { word: '位置',   answer: 'いち' },
              { word: '繰り返し', answer: 'くりかえし' },
              { word: '用いる', answer: 'もちいる' },
              { word: '韻',     answer: 'いん' },
              { word: '踏む',   answer: 'ふむ' },
            ],
          },
          {
            num: 7,
            full: 'これは吹奏楽のために書かれた曲の楽譜です。',
            targets: [
              { word: '吹奏楽', answer: 'すいそうがく' },
              { word: '曲',     answer: 'きょく' },
              { word: '楽譜',   answer: 'がくふ' },
            ],
          },
          {
            num: 8,
            full: 'イギリスで有名な探偵といえば、シャーロック・ホームズです。',
            targets: [
              { word: '有名', answer: 'ゆうめい' },
              { word: '探偵', answer: 'たんてい' },
            ],
          },
        ],
      },

      // 問題2 — writing (hiragana → kanji)
      {
        id: 's2', type: 'writing',
        label: '問題2',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        twoCol: true,
        sentences: [
          { num: 1, full: '時計がくるう。',              writingTargets: [{ word: 'くるう',    answer: '狂う' }] },
          { num: 2, full: '野生動物が畑をあらす。',       writingTargets: [{ word: 'あらす',    answer: '荒らす' }] },
          { num: 3, full: 'きぬの着物を縫う。',           writingTargets: [{ word: 'きぬ',      answer: '絹' }] },
          { num: 4, full: 'かいこを育てる。',             writingTargets: [{ word: 'かいこ',    answer: '蚕' }] },
          { num: 5, full: '言葉たくみに勧める。',         writingTargets: [{ word: 'たくみに',  answer: '巧みに' }] },
          { num: 6, full: '意志をつらぬく。',             writingTargets: [{ word: 'つらぬく',  answer: '貫く' }] },
          { num: 7, full: '自分の将来を頭に思いえがく。', writingTargets: [{ word: 'えがく',    answer: '描く' }] },
          { num: 8, full: '耳をすます。',                 writingTargets: [{ word: 'すます',    answer: '澄ます' }] },
        ],
      },

      // 問題3 — kanji multiple choice
      {
        id: 's3', type: 'kanji_choice',
        label: '問題3',
        instruction: '{　} の正しいほうに○をつけなさい。',
        sentences: [
          { num: 1, pre: '部屋のすみ',   post: '',         choices: ['隅', '墨'],         answer: '隅' },
          { num: 2, pre: 'もぎ',         post: '試験',     choices: ['模凝', '模擬'],     answer: '模擬' },
          { num: 3, pre: 'せいこう',     post: 'な機械',   choices: ['成功', '精巧'],     answer: '精巧' },
          { num: 4, pre: 'たいくつ',     post: 'な話',     choices: ['退屈', '退堀'],     answer: '退屈' },
          { num: 5, pre: 'かんせい',     post: 'な住宅街', choices: ['感性', '閑静'],     answer: '閑静' },
          { num: 6, pre: 'ぜん',         post: 'の精神',   choices: ['膳', '禅'],         answer: '禅' },
          { num: 7, pre: 'きかがく',     post: '模様',     choices: ['幾何学', '機科学'], answer: '幾何学' },
          { num: 8, pre: '突然のふほう', post: '',         choices: ['訃報', '計報'],     answer: '訃報' },
        ],
      },

    ],
  },

  // ═══ 24課 ═══════════════════════════════════════════════════════
  {
    id: 24, accent: '#15803d',
    sections: [
      {
        id: 's1', type: 'reading_sentences',
        label: '問題1',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          { num: 1,  full: '植物の中には葉や根、茎など体の一部分から繁殖するものがあります。',
            targets: [{ word: '茎', answer: 'くき' }, { word: '繁殖', answer: 'はんしょく' }] },
          { num: 2,  full: '栄養が不足すると、植物は枯れてしまいます。',
            targets: [{ word: '枯れて', answer: 'かれて' }] },
          { num: 3,  full: '植物が育つ際に必要なものは、二酸化炭素、水、日光、窒素などです。',
            targets: [{ word: '二酸化炭素', answer: 'にさんかたんそ' }, { word: '窒素', answer: 'ちっそ' }] },
          { num: 4,  full: '有機栽培では、化学肥料や農薬の使用を避けて、堆肥などを使います。',
            targets: [{ word: '化学肥料', answer: 'かがくひりょう' }, { word: '農薬', answer: 'のうやく' }, { word: '堆肥', answer: 'たいひ' }] },
          { num: 5,  full: '土壌にいる微生物には有機物を分解するはたらきがあります。',
            targets: [{ word: '土壌', answer: 'どじょう' }, { word: '微生物', answer: 'びせいぶつ' }, { word: '分解', answer: 'ぶんかい' }] },
          { num: 6,  full: '有機肥料で育った健康な作物は異常気象に耐える力が大きいです。',
            targets: [{ word: '作物', answer: 'さくもつ' }, { word: '耐える', answer: 'たえる' }] },
          { num: 7,  full: '納豆は大豆を発酵させて作ります。',
            targets: [{ word: '納豆', answer: 'なっとう' }, { word: '大豆', answer: 'だいず' }, { word: '発酵', answer: 'はっこう' }] },
          { num: 8,  full: 'このレポートは少し直したほうがいいですね。この文章は削除して、ここに1行挿入してください。',
            targets: [{ word: '削除', answer: 'さくじょ' }, { word: '挿入', answer: 'そうにゅう' }] },
          { num: 9,  full: '店が繁盛するように神社にお参りをしました。',
            targets: [{ word: '繁盛', answer: 'はんじょう' }, { word: '神社', answer: 'じんじゃ' }, { word: '参り', answer: 'まいり' }] },
          { num: 10, full: '秋祭りは一般に作物の収穫を祝う行事です。',
            targets: [{ word: '収穫', answer: 'しゅうかく' }, { word: '行事', answer: 'ぎょうじ' }] },
          { num: 11, full: '窓の隙間から冷たい風が入ってくる。',
            targets: [{ word: '隙間', answer: 'すきま' }] },
          { num: 12, full: 'お餅が喉に詰まって窒息する。',
            targets: [{ word: '餅', answer: 'もち' }, { word: '喉', answer: 'のど' }, { word: '詰まって', answer: 'つまって' }, { word: '窒息', answer: 'ちっそく' }] },
        ],
      },
      {
        id: 's2', type: 'kanji_choice',
        label: '問題2',
        instruction: '{　} の正しいほうに○をつけなさい。',
        sentences: [
          { num: 1, pre: '今朝は辺り一面にしも',     post: 'が降りている。',    choices: ['霜', '霧'],     answer: '霜' },
          { num: 2, pre: 'じゃがいもからめ',         post: 'が出た。',          choices: ['根', '芽'],     answer: '芽' },
          { num: 3, pre: '私の故郷はぼくちく',       post: 'が盛んです。',      choices: ['牧畜', '牧蓄'], answer: '牧畜' },
          { num: 4, pre: '妹は明るくてすなお',       post: 'です。',            choices: ['正直', '素直'], answer: '素直' },
          { num: 5, pre: 'きょうさく',               post: 'の年が続いた。',    choices: ['区作', '凶作'], answer: '凶作' },
          { num: 6, pre: '花が咲いて実がじゅくす',   post: '。',                choices: ['熟す', '塾す'], answer: '熟す' },
          { num: 7, pre: 'びりょう',                 post: 'の毒が検出された。', choices: ['微量', '徴量'], answer: '微量' },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: '問題3',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        twoCol: true,
        sentences: [
          { num: 1, full: '穴をほる。',   writingTargets: [{ word: 'ほる', answer: '掘る' }] },
          { num: 2, full: '帽子をぬぐ。', writingTargets: [{ word: 'ぬぐ', answer: '脱ぐ' }] },
          { num: 3, full: '芝をかる。',   writingTargets: [{ word: 'かる', answer: '刈る' }] },
          { num: 4, full: 'いもをむす。', writingTargets: [{ word: 'むす', answer: '蒸す' }] },
        ],
      },
    ],
  },

  // ═══ 25課 ═══════════════════════════════════════════════════════
  {
    id: 25, accent: '#2563eb',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: '問題1',
        instruction: '次の説明を読んで、下線部①〜⑬の読みをひらがなで書きなさい。',
        contextTitle: '「手賀①沼プロジェクト開始まで」',
        contextLines: [
          '　1995年、千葉大学園芸学部に民間ボランティア団体から「手賀沼の②浄化に対して水性野菜を',
          '用いることは可能かどうか」について相談が持ち込まれた。1971年の観測以来、連続して水質③汚濁',
          '日本一という、④不名誉な記録を更新していた「手賀沼」の浄化を市民レベルで行おうというものだった。',
          '',
          '　水質が悪化する前の、昔の手賀沼にはウナギがたくさん生息していた。1974年時点でもおよそ',
          '11tの⑤漁獲があったという記録が残っている。1960年代後半から周辺の都市化が進み、⑥急激な',
          '人口増加とそれに⑦伴う大量の生活・⑧排水の流入等により、沼の汚染が急速に進んだ。沼の浄化は',
          '⑨近隣の住民だけでなく広く千葉県民が望むところだった。',
          '',
          '　このプロジェクトは一見無関係に見える「養液栽培」に関係する研究が基礎となる。',
          '',
          '養液栽培システム：',
          '(1) DFT (Deep Flow Technique)：栽培ベッドに培養液を溜めた状態で循環させ、培地*1を使わずに栽培する',
          '(2) NFT (Nutrient Film Technique)：ごく⑩緩やかな⑪傾斜を持つチャンネル（栽培用の⑫溝）に、培養液を薄く流下させて栽培する',
          '(3) RW (Rockwool system)：RW培地に苗を定植*2し、培養液を⑬点滴システム等で少量ずつ適期に与える方式',
          '(4) 砂耕・礫耕 (Gravel Culture)：使用する培地が砂や礫（小石）である栽培方式',
          '',
          '*1 培地：微生物や動植物の組織などを培養するための液状または固形の物質。(culture medium)',
          '*2 定植：苗をポットなどから移して、田や畑などに本式に植えること。(permanent planting)',
        ],
        questions: [
          { num: 1,  target: '沼',     answer: 'ぬま' },
          { num: 2,  target: '浄化',   answer: 'じょうか' },
          { num: 3,  target: '汚濁',   answer: 'おだく' },
          { num: 4,  target: '不名誉', answer: 'ふめいよ' },
          { num: 5,  target: '漁獲',   answer: 'ぎょかく' },
          { num: 6,  target: '急激',   answer: 'きゅうげき' },
          { num: 7,  target: '伴う',   answer: 'ともなう' },
          { num: 8,  target: '排水',   answer: 'はいすい' },
          { num: 9,  target: '近隣',   answer: 'きんりん' },
          { num: 10, target: '緩やか', answer: 'ゆるやか' },
          { num: 11, target: '傾斜',   answer: 'けいしゃ' },
          { num: 12, target: '溝',     answer: 'みぞ' },
          { num: 13, target: '点滴',   answer: 'てんてき' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '例のように書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1,  full: '顕微鏡で植物のさいぼうを見る。',
            targets: [{ word: '顕微鏡', answer: 'けんびきょう' }],
            writingTargets: [{ word: 'さいぼう', answer: '細胞' }] },
          { num: 2,  full: '太陽は東からのぼる。',
            writingTargets: [{ word: 'のぼる', answer: '昇る' }] },
          { num: 3,  full: '道端に咲いている野の花をつむ。',
            targets: [{ word: '道端', answer: 'みちばた' }],
            writingTargets: [{ word: 'つむ', answer: '摘む' }] },
          { num: 4,  full: '判決をくつがえす。',
            writingTargets: [{ word: 'くつがえす', answer: '覆す' }] },
          { num: 5,  full: '隣の家では大きい犬をかっている。',
            targets: [{ word: '隣', answer: 'となり' }],
            writingTargets: [{ word: 'かっている', answer: '飼っている' }] },
          { num: 6,  full: '夕日で空が赤くそまっている。',
            writingTargets: [{ word: 'そまっている', answer: '染まっている' }] },
          { num: 7,  full: 'この検査ははげしい痛みをともなう。',
            writingTargets: [{ word: 'ともなう', answer: '伴う' }] },
          { num: 8,  full: '交差点をななめに横断する。',
            writingTargets: [{ word: 'ななめ', answer: '斜め' }] },
          { num: 9,  full: 'にごっていた水が次第にすきとおってきた。',
            writingTargets: [{ word: 'にごって', answer: '濁って' }, { word: 'すきとおって', answer: '透き通って' }] },
          { num: 10, full: '暖房器具がこわれた。',
            writingTargets: [{ word: 'こわれた', answer: '壊れた' }] },
        ],
      },
    ],
  },

  // ═══ 26課 ═══════════════════════════════════════════════════════
  {
    id: 26, accent: '#ea580c',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: '問題1',
        instruction: '次の説明を読んで、下線部①〜⑰の読みをひらがなで書きなさい。',
        contextLines: [
          'ミツバチ（①蜜蜂）の社会',
          '',
          '・「②昆虫の家畜」といわれる',
          '・群れ（コロニー）をつくって生活する',
          '',
          '１）コロニーを構成するハチの種類とその役割',
          '　・女王バチ（③1匹）　…………　産卵',
          '　・働きバチ（女王の娘、④雌のハチ、数万匹）　⑤巣造り・⑥餌採り・卵や幼虫の世話',
          '　・⑦雄のハチ（全体の1割に満たない）　……　女王バチとの⑧交尾',
          '',
          '２）分業社会を調整するもの：女王バチが分泌する⑨揮発性の化学物質',
          '　・性フェロモン　……　雄を⑩誘引する',
          '　・階級⑪維持フェロモン　……　働きバチの⑫卵巣の発育を⑬抑制する',
          '　・集合フェロモン　……　別のコロニーをつくる際に働きバチを集める',
          '　　　　　　　　　　　　　働きバチも⑭外敵にあうと特別な物質を放出する',
          '',
          '＊働きバチが放出する物質',
          '　・警報フェロモン　……　敵に針を刺したときに⑮臭気を発して他の個体を⑯興奮させ、⑰攻撃性を高める',
        ],
        questions: [
          { num: 1,  target: '蜜蜂',   answer: 'みつばち' },
          { num: 2,  target: '昆虫',   answer: 'こんちゅう' },
          { num: 3,  target: '1匹',    answer: 'いっぴき' },
          { num: 4,  target: '雌',     answer: 'めす' },
          { num: 5,  target: '巣造り', answer: 'すづくり' },
          { num: 6,  target: '餌採り', answer: 'えさとり' },
          { num: 7,  target: '雄',     answer: 'おす' },
          { num: 8,  target: '交尾',   answer: 'こうび' },
          { num: 9,  target: '揮発性', answer: 'きはつせい' },
          { num: 10, target: '誘引',   answer: 'ゆういん' },
          { num: 11, target: '維持',   answer: 'いじ' },
          { num: 12, target: '卵巣',   answer: 'らんそう' },
          { num: 13, target: '抑制',   answer: 'よくせい' },
          { num: 14, target: '外敵',   answer: 'がいてき' },
          { num: 15, target: '臭気',   answer: 'しゅうき' },
          { num: 16, target: '興奮',   answer: 'こうふん' },
          { num: 17, target: '攻撃性', answer: 'こうげきせい' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '例のように書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1,  full: '日本の歴史や文化、しゅうきょうについて書かれた本を読む。',
            writingTargets: [{ word: 'しゅうきょう', answer: '宗教' }] },
          { num: 2,  full: 'すは穀物や果物から作られる。',
            targets: [{ word: '穀物', answer: 'こくもつ' }, { word: '果物', answer: 'くだもの' }],
            writingTargets: [{ word: 'す', answer: '酢' }] },
          { num: 3,  full: '野菜を塩でつけて、保存食にする。',
            writingTargets: [{ word: 'つけて', answer: '漬けて' }] },
          { num: 4,  full: 'とがったものが入っていたので、袋がさけてしまった。',
            writingTargets: [{ word: 'さけて', answer: '裂けて' }] },
          { num: 5,  full: 'この映画は実在した人物の生涯をえがいたものです。',
            targets: [{ word: '生涯', answer: 'しょうがい' }],
            writingTargets: [{ word: 'えがいた', answer: '描いた' }] },
          { num: 6,  full: 'あそこの曲がり角は木の葉がしげって見通しが悪い。',
            writingTargets: [{ word: 'しげって', answer: '茂って' }] },
          { num: 7,  full: '母は貝殻を集めて装飾品を作っています。',
            targets: [{ word: '貝殻', answer: 'かいがら' }, { word: '装飾品', answer: 'そうしょくひん' }] },
          { num: 8,  full: 'たつまきで家の屋根が飛ばされてしまった。',
            writingTargets: [{ word: 'たつまき', answer: '竜巻' }] },
          { num: 9,  full: '冬眠する動物は夏の終わりから秋にかけて体に脂肪をたくわえる。',
            targets: [{ word: '脂肪', answer: 'しぼう' }],
            writingTargets: [{ word: 'たくわえる', answer: '蓄える' }] },
          { num: 10, full: '藍という植物の葉やくきから濃い青色の染料が採れます。',
            targets: [{ word: '藍', answer: 'あい' }],
            writingTargets: [{ word: 'くき', answer: '茎' }] },
          { num: 11, full: '恒温動物は気温や水温に影響されず、一定の体温を保つことができます。',
            targets: [{ word: '恒温', answer: 'こうおん' }, { word: '影響', answer: 'えいきょう' }] },
          { num: 12, full: '蚊のなかにはウイルスを媒介するものもある。',
            targets: [{ word: '蚊', answer: 'か' }, { word: '媒介', answer: 'ばいかい' }] },
        ],
      },
    ],
  },

  // ═══ 27課 ═══════════════════════════════════════════════════════
  {
    id: 27, accent: '#0891b2',
    sections: [
      {
        id: 's1', type: 'reading_sentences',
        label: '問題1',
        instruction: '下線部の読みをひらがなで書きなさい。',
        sentences: [
          { num: 1,  full: 'これが丸く見えるのは、目の錯覚だ。',
            targets: [{ word: '錯覚', answer: 'さっかく' }] },
          { num: 2,  full: '病気の人に付き添う。',
            targets: [{ word: '付き添う', answer: 'つきそう' }] },
          { num: 3,  full: '長い時間、仕事をしたら、肩が凝った。',
            targets: [{ word: '凝った', answer: 'こった' }] },
          { num: 4,  full: '彼女に干渉するのはやめたほうがいい。',
            targets: [{ word: '干渉', answer: 'かんしょう' }] },
          { num: 5,  full: 'この法律には盲点がある。',
            targets: [{ word: '盲点', answer: 'もうてん' }] },
          { num: 6,  full: '事故現場では、懸命な救助が続けられた。',
            targets: [{ word: '懸命', answer: 'けんめい' }] },
          { num: 7,  full: '自己を知るためにはどのようにしたらいいだろうか。',
            targets: [{ word: '自己', answer: 'じこ' }] },
          { num: 8,  full: '彼の話には矛盾している点がたくさんあった。',
            targets: [{ word: '矛盾', answer: 'むじゅん' }] },
          { num: 9,  full: 'この解釈は間違っている。',
            targets: [{ word: '解釈', answer: 'かいしゃく' }] },
          { num: 10, full: '生物の授業で、魚を解剖した。',
            targets: [{ word: '解剖', answer: 'かいぼう' }] },
          { num: 11, full: 'その資料を閲覧したいのですが、どこで申し込めばいいですか。',
            targets: [{ word: '閲覧', answer: 'えつらん' }] },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1,  full: '毎日、いっしょうけんめい勉強する。',
            writingTargets: [{ word: 'いっしょうけんめい', answer: '一生懸命' }] },
          { num: 2,  full: 'もう、この映画をごらんになりましたか。',
            writingTargets: [{ word: 'ごらん', answer: 'ご覧' }] },
          { num: 3,  full: '新しい商品をちんれつする。',
            writingTargets: [{ word: 'ちんれつ', answer: '陳列' }] },
          { num: 4,  full: 'ぼうけんについて書かれた小説を読むのが好きだ。',
            writingTargets: [{ word: 'ぼうけん', answer: '冒険' }] },
          { num: 5,  full: 'この木の中はくうどうになっている。',
            writingTargets: [{ word: 'くうどう', answer: '空洞' }] },
          { num: 6,  full: '手紙をそえて、花束を送った。',
            writingTargets: [{ word: 'そえて', answer: '添えて' }] },
          { num: 7,  full: 'この板はこうばいがある。',
            writingTargets: [{ word: 'こうばい', answer: '勾配' }] },
          { num: 8,  full: 'この計画はせいこうするでしょう。',
            writingTargets: [{ word: 'せいこう', answer: '成功' }] },
          { num: 9,  full: 'じしゃくはプラスチックを引きつけない。',
            writingTargets: [{ word: 'じしゃく', answer: '磁石' }] },
          { num: 10, full: 'このリストはじゅんじょが正しくない。',
            writingTargets: [{ word: 'じゅんじょ', answer: '順序' }] },
          { num: 11, full: '窓のわくを新しくする。',
            writingTargets: [{ word: 'わく', answer: '枠' }] },
          { num: 12, full: '考えたことをじっせんしてみる。',
            writingTargets: [{ word: 'じっせん', answer: '実践' }] },
        ],
      },
      {
        id: 's3', type: 'compound_splitting',
        label: '問題3',
        instruction: '次の漢字はどのような構成になっていますか。例のように分けなさい。',
        example: '例：不/裁切　　自己/紹介',
        compounds: [
          { num: 1, word: '冷蔵庫',       answer: '冷蔵/庫' },
          { num: 2, word: '望遠鏡',       answer: '望遠/鏡' },
          { num: 3, word: '無収入',       answer: '無/収入' },
          { num: 4, word: '交通機関',     answer: '交通/機関' },
          { num: 5, word: '化学調味料',   answer: '化学/調味料' },
          { num: 6, word: '不得意科目',   answer: '不得意/科目' },
          { num: 7, word: '経済援助計画', answer: '経済援助/計画' },
          { num: 8, word: '新和英大辞典', answer: '新/和英大辞典' },
        ],
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────
// READING LIST SECTION  (問題1 with context box)
// ─────────────────────────────────────────────────────────────────
function ReadingListSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />

      {/* Context box — single column */}
      {sec.contextLines && (
        <div className="border border-[#2a2a38] rounded-xl p-4 mb-5 bg-[#0F0F14]">
          {sec.contextTitle && (
            <p className="text-center font-bold text-base tracking-widest kanji-text mb-3 border-b border-[#2a2a38] pb-2 text-[#e0e0f0]">{sec.contextTitle}</p>
          )}
          {sec.contextLines.map((line, i) => (
            <p key={i} className="text-sm leading-7 kanji-text whitespace-pre-wrap text-[#e0e0f0]">{line || '\u00A0'}</p>
          ))}
        </div>
      )}

      {/* Three-document layout for Ch16 */}
      {sec.contextDocs && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {sec.contextDocs.map((doc, di) => (
            <div key={di} className="border border-[#2a2a38] rounded-xl p-3 bg-[#0F0F14] text-xs">
              <p className="font-bold text-[#606080] text-center mb-2 border-b border-[#2a2a38] pb-1">{doc.title}</p>
              {doc.lines.map((line, li) => (
                <p key={li} className="kanji-text leading-6 text-[#e0e0f0]">{line}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Answer grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sec.questions.map(q => {
          const key = `${chId}-${sec.id}-${q.num}`;
          const val = answers[key] || '';
          const correct = submitted && val.trim() === q.answer;
          const wrong = submitted && !correct;
          return (
            <div key={q.num}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${submitted ? (correct ? 'border-[#4AA85C44] bg-[#4AA85C0d]' : 'border-[#D4861C44] bg-[#D4861C0d]') : 'border-[#2a2a38] bg-[#171720] hover:border-[#3a3a55]'}`}
            >
              <span className="text-[#606080] text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-[#e0e0f0] border-b-2 border-[#606080] inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ひらがなで"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-[#4AA85C11] border-[#4AA85C44] text-[#4AA85C]' : 'bg-[#D4861C11] border-[#D4861C44] text-[#D4861C]') : 'bg-[#0F0F14] border-[#2a2a38] text-[#e0e0f0] focus:border-[#C1392B]'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-[#3a3a55] mr-1">{val || '未回答'}</span><span className="text-[#4AA85C] font-bold">→ {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-[#4AA85C] font-bold mt-1">✓ 正解</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// READING HEADLINES SECTION
// ─────────────────────────────────────────────────────────────────
function ReadingHeadlinesSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      <div className="border border-[#2a2a38] rounded-xl p-4 mb-5 bg-[#0F0F14] space-y-3">
        {sec.headlines.map((h, i) => (
          <p key={i}
            className={`kanji-text text-lg leading-relaxed px-3 py-2 rounded font-medium
              ${h.inverted ? 'bg-[#e0e0f0] text-[#0F0F14]' : 'border border-dashed border-[#3a3a55] text-[#e0e0f0]'}`}
          >{h.text}</p>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sec.questions.map(q => {
          const key = `${chId}-${sec.id}-${q.num}`;
          const val = answers[key] || '';
          const correct = submitted && val.trim() === q.answer;
          const wrong = submitted && !correct;
          return (
            <div key={q.num}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${submitted ? (correct ? 'border-[#4AA85C44] bg-[#4AA85C0d]' : 'border-[#D4861C44] bg-[#D4861C0d]') : 'border-[#2a2a38] bg-[#171720] hover:border-[#3a3a55]'}`}
            >
              <span className="text-[#606080] text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-[#e0e0f0] border-b-2 border-[#606080] inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ひらがなで"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-[#4AA85C11] border-[#4AA85C44] text-[#4AA85C]' : 'bg-[#D4861C11] border-[#D4861C44] text-[#D4861C]') : 'bg-[#0F0F14] border-[#2a2a38] text-[#e0e0f0] focus:border-[#C1392B]'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-[#3a3a55] mr-1">{val || '未回答'}</span><span className="text-[#4AA85C] font-bold">→ {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-[#4AA85C] font-bold mt-1">✓ 正解</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// READING SENTENCES SECTION — multi-target per sentence
// ─────────────────────────────────────────────────────────────────
function ReadingSentencesSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      {sec.example && (
        <div className="border border-[#2a2a38] rounded inline-flex items-center px-4 py-1.5 mb-4 bg-[#171720] text-sm kanji-text text-[#606080]">{sec.example}</div>
      )}
      <div className="space-y-6">
        {sec.sentences.map(s => {
          const targets = s.targets || [];
          const writingTargets = s.writingTargets || [];

          // Build segment list: reading targets are underlined + input; writing targets are underlined (indigo)
          const allTargets = [
            ...targets.map(t => ({ ...t, mode: 'reading' })),
            ...writingTargets.map(t => ({ ...t, mode: 'writing' })),
          ];
          const segments = splitSentence(s.full, allTargets.map(t => ({ word: t.word, key: t.word })));

          return (
            <div key={s.num} className="flex items-start gap-3">
              <span className="text-[#606080] font-medium text-base shrink-0 mt-0.5">{CIRCLED[s.num - 1]}</span>
              <div className="flex-1">
                {/* Sentence with underlined targets inline */}
                <p className="text-base kanji-text leading-loose mb-3">
                  {segments.map((seg, si) => {
                    if (!seg.isTarget) return <span key={si}>{seg.text}</span>;
                    const tInfo = allTargets.find(t => t.word === seg.text);
                    if (tInfo?.mode === 'writing') {
                      return <span key={si} className="border-b-2 border-[#8B82F0] text-[#8B82F0] font-medium">{seg.text}</span>;
                    }
                    return <span key={si} className="border-b-2 border-[#606080] text-[#e0e0f0] font-medium">{seg.text}</span>;
                  })}
                </p>

                {/* Reading inputs — one per reading target */}
                {targets.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {targets.map(t => {
                      const key = `${chId}-${sec.id}-${s.num}-${t.word}`;
                      const val = answers[key] || '';
                      const correct = submitted && val.trim() === t.answer;
                      const wrong = submitted && !correct;
                      return (
                        <div key={t.word} className="flex flex-col items-start gap-0.5">
                          <span className="text-xs text-[#606080] kanji-text border-b border-[#3a3a55] inline-block">{t.word}</span>
                          <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                            placeholder="読み"
                            className={`px-2 py-1 rounded border text-sm outline-none transition-all
                              ${submitted ? (correct ? 'bg-[#4AA85C11] border-[#4AA85C44] text-[#4AA85C]' : 'bg-[#D4861C11] border-[#D4861C44] text-[#D4861C]') : 'bg-[#0F0F14] border-[#2a2a38] text-[#e0e0f0] focus:border-[#C1392B]'}`}
                            style={{ width: `${Math.max(90, t.answer.length * 13 + 20)}px` }} />
                          {submitted && correct && <span className="text-[11px] text-[#4AA85C] font-bold">✓</span>}
                          {submitted && wrong && <span className="text-[11px] text-[#4AA85C] font-bold">{t.answer}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Writing canvases — one per writing target */}
                {writingTargets.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {writingTargets.map(t => (
                      <div key={t.word} className="flex flex-col items-start gap-1">
                        <span className="text-xs text-[#8B82F0] font-medium border-b border-[#8B82F044] kanji-text">{t.word} →漢字</span>
                        <div className="flex items-center gap-2">
                          <HandwritingCanvas width={120} height={68} disabled={submitted} />
                          {submitted && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#606080]">答：</span>
                              <span className="text-2xl font-bold text-[#e0e0f0] kanji-text">{t.answer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WRITING SECTION — hiragana→kanji handwriting (問題3)
// ─────────────────────────────────────────────────────────────────
function WritingSection({ sec, submitted }) {
  const twoCol = sec.twoCol && sec.sentences.length >= 4;
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      <div className={twoCol ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6' : 'space-y-6'}>
        {sec.sentences.map(s => {
          const writingTargets = s.writingTargets || [];
          const segments = splitSentence(s.full, writingTargets.map(t => ({ word: t.word, key: t.word })));
          return (
            <div key={s.num} className="flex items-start gap-3">
              <span className="text-[#606080] font-medium text-base shrink-0 mt-0.5">{CIRCLED[s.num - 1]}</span>
              <div className="flex-1">
                <p className="text-base kanji-text leading-loose mb-2">
                  {segments.map((seg, si) =>
                    seg.isTarget
                      ? <span key={si} className="border-b-2 border-[#606080] text-[#8B82F0] font-medium">{seg.text}</span>
                      : <span key={si}>{seg.text}</span>
                  )}
                </p>
                {/* One canvas per writing target */}
                <div className="flex flex-wrap gap-4">
                  {writingTargets.map(t => (
                    <div key={t.word} className="flex flex-col items-start gap-1">
                      {writingTargets.length > 1 && (
                        <span className="text-xs text-[#8B82F0] font-medium kanji-text border-b border-[#8B82F044]">{t.word}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <HandwritingCanvas width={130} height={75} disabled={submitted} />
                        {submitted && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#606080]">答え：</span>
                            <span className="text-2xl font-bold text-[#e0e0f0] kanji-text">{t.answer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// INFO SECTION
// ─────────────────────────────────────────────────────────────────
function InfoSection({ sec }) {
  return (
    <div className="mb-10 border border-[#2a2a38] rounded-xl p-4 bg-[#171720]">
      <p className="font-bold text-[#606080] mb-2">─ {sec.label} ─</p>
      <p className="text-sm text-[#e0e0f0] leading-relaxed kanji-text whitespace-pre-line">{sec.content}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WORD BOX FILL SECTION — word box at top, pick which word fills each blank
// ─────────────────────────────────────────────────────────────────
function WordBoxFillSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      <div className="space-y-6">
        {sec.groups.map((group, gi) => (
          <div key={gi}>
            <div className="mb-3 px-4 py-2 border border-[#2a2a38] rounded-xl bg-[#0F0F14] text-[#e0e0f0] text-sm kanji-text text-center tracking-widest">
              {group.choices.join('・')}
            </div>
            <div className="space-y-3">
              {group.sentences.map(s => {
                const key = `${chId}-${sec.id}-${s.num}`;
                const selected = answers[key] || '';
                return (
                  <div key={s.num} className="flex items-start gap-3">
                    <span className="text-[#606080] font-medium text-base shrink-0 mt-0.5">({s.num})</span>
                    <p className="text-base kanji-text leading-loose">
                      {s.pre}
                      <span className="inline-flex gap-1 mx-1 align-middle flex-wrap">
                        {group.choices.map(choice => {
                          const isSelected = selected === choice;
                          const showCorrect = submitted && choice === s.answer;
                          const showWrong   = submitted && isSelected && choice !== s.answer;
                          return (
                            <button
                              key={choice}
                              onClick={() => !submitted && onChange(key, choice)}
                              disabled={submitted}
                              className={`px-2 py-0.5 rounded border kanji-text text-base transition-all
                                ${isSelected && !submitted ? 'border-[#8B82F0] bg-[#8B82F011] text-[#8B82F0] font-bold' : ''}
                                ${showCorrect ? 'border-[#4AA85C] bg-[#4AA85C11] text-[#4AA85C] font-bold' : ''}
                                ${showWrong   ? 'border-[#D4861C] bg-[#D4861C11] text-[#D4861C] opacity-60' : ''}
                                ${!isSelected && !showCorrect && !showWrong ? 'border-[#2a2a38] bg-[#0F0F14] text-[#e0e0f0] hover:border-[#8B82F0]' : ''}
                              `}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </span>
                      {s.post}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// KANJI CHOICE SECTION — pick the correct kanji from two options
// ─────────────────────────────────────────────────────────────────
function KanjiChoiceSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      <div className="space-y-4">
        {sec.sentences.map(s => {
          const key = `${chId}-${sec.id}-${s.num}`;
          const selected = answers[key] || '';
          return (
            <div key={s.num} className="flex items-start gap-3">
              <span className="text-[#606080] font-medium text-base shrink-0 mt-0.5">{CIRCLED[s.num - 1]}</span>
              <p className="text-base kanji-text leading-loose">
                {s.pre}
                <span className="inline-flex gap-2 mx-1 align-middle">
                  {s.choices.map(choice => {
                    const isSelected = selected === choice;
                    const showCorrect = submitted && choice === s.answer;
                    const showWrong   = submitted && isSelected && choice !== s.answer;
                    return (
                      <button
                        key={choice}
                        onClick={() => !submitted && onChange(key, choice)}
                        disabled={submitted}
                        className={`px-2 py-0.5 rounded border kanji-text text-base transition-all
                          ${isSelected && !submitted ? 'border-[#8B82F0] bg-[#8B82F011] text-[#8B82F0] font-bold' : ''}
                          ${showCorrect ? 'border-[#4AA85C] bg-[#4AA85C11] text-[#4AA85C] font-bold' : ''}
                          ${showWrong ? 'border-[#D4861C] bg-[#D4861C11] text-[#D4861C] opacity-60' : ''}
                          ${!isSelected && !showCorrect && !showWrong ? 'border-[#2a2a38] bg-[#0F0F14] text-[#e0e0f0] hover:border-[#8B82F0]' : ''}
                        `}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </span>
                {s.post}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ label, instruction }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 mb-4">
      <span className="font-bold text-[#e0e0f0] text-base shrink-0">{label}</span>
      <span className="text-sm text-[#606080] leading-relaxed">{instruction}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOUND SPLITTING SECTION (問題3 — type/分 a slash into the compound)
// ─────────────────────────────────────────────────────────────────
function CompoundSplittingSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      {sec.example && (
        <div className="border border-[#2a2a38] rounded inline-flex items-center px-4 py-1.5 mb-4 bg-[#171720] text-sm kanji-text text-[#606080]">{sec.example}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sec.compounds.map(c => {
          const key = `${chId}-${sec.id}-${c.num}`;
          const val = answers[key] || '';
          const correct = submitted && val.trim() === c.answer;
          const wrong = submitted && !correct;
          return (
            <div key={c.num}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${submitted ? (correct ? 'border-[#4AA85C44] bg-[#4AA85C0d]' : 'border-[#D4861C44] bg-[#D4861C0d]') : 'border-[#2a2a38] bg-[#171720] hover:border-[#3a3a55]'}`}
            >
              <span className="text-[#606080] text-sm font-semibold pt-1 shrink-0">{CIRCLED[c.num - 1]}</span>
              <div className="flex-1">
                <p className="text-2xl kanji-text font-medium text-[#e0e0f0] mb-2">{c.word}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="例：冷蔵/庫"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-[#4AA85C11] border-[#4AA85C44] text-[#4AA85C]' : 'bg-[#D4861C11] border-[#D4861C44] text-[#D4861C]') : 'bg-[#0F0F14] border-[#2a2a38] text-[#e0e0f0] focus:border-[#C1392B]'}`} />
                {submitted && wrong && <p className="text-xs mt-1 kanji-text"><span className="line-through text-[#3a3a55] mr-1">{val || '未回答'}</span><span className="text-[#4AA85C] font-bold">→ {c.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-[#4AA85C] font-bold mt-1">✓ 正解</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SCORE BANNER
// ─────────────────────────────────────────────────────────────────
function ScoreBanner({ chapter, answers, submitted }) {
  if (!submitted) return null;
  let correct = 0, total = 0;
  chapter.sections.forEach(sec => {
    if (sec.type === 'writing' || sec.type === 'info') return;
    // compound_splitting — each compound is one answer
    if (sec.type === 'compound_splitting') {
      (sec.compounds || []).forEach(c => {
        total++;
        const key = `${chapter.id}-${sec.id}-${c.num}`;
        if ((answers[key] || '').trim() === c.answer) correct++;
      });
      return;
    }
    // word_box_fill — nested groups → sentences
    if (sec.type === 'word_box_fill') {
      (sec.groups || []).forEach(group => {
        group.sentences.forEach(s => {
          total++;
          const key = `${chapter.id}-${sec.id}-${s.num}`;
          if ((answers[key] || '') === s.answer) correct++;
        });
      });
      return;
    }
    const items = sec.questions || sec.sentences || [];
    items.forEach(item => {
      // questions array (reading_list / reading_headlines)
      if (item.target && item.answer) {
        total++;
        const key = `${chapter.id}-${sec.id}-${item.num}`;
        if ((answers[key] || '').trim() === item.answer) correct++;
      }
      // kanji_choice — single answer per sentence
      if (item.choices && item.answer) {
        total++;
        const key = `${chapter.id}-${sec.id}-${item.num}`;
        if ((answers[key] || '') === item.answer) correct++;
      }
      // sentences array (reading_sentences) — may have multiple targets
      if (item.targets) {
        item.targets.forEach(t => {
          total++;
          const key = `${chapter.id}-${sec.id}-${item.num}-${t.word}`;
          if ((answers[key] || '').trim() === t.answer) correct++;
        });
      }
    });
  });
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="mb-6 p-4 rounded-2xl text-white shadow-lg" style={{ background: chapter.accent }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">読み問題の結果</p>
          <p className="text-3xl font-bold">{correct} <span className="text-lg font-normal">/ {total}</span></p>
          <p className="text-white/90 text-sm">{pct}% 正解</p>
        </div>
        <span className="text-5xl">{pct >= 80 ? '🎉' : pct >= 60 ? '📖' : '💪'}</span>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2">
        <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      {chapter.sections.some(s => s.type === 'writing') && (
        <p className="text-white/80 text-xs mt-2">※ 手書き問題は答えを確認して自己採点してください。</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WRITING DRILL
// ─────────────────────────────────────────────────────────────────
function buildDrillCards(chapterId) {
  const chapters = chapterId === 'all' ? CHAPTERS : CHAPTERS.filter(ch => ch.id === chapterId);
  const cards = [];
  chapters.forEach(ch => {
    ch.sections.forEach(sec => {
      if (sec.type === 'writing' || sec.type === 'reading_sentences') {
        (sec.sentences || []).forEach(s => {
          (s.writingTargets || []).forEach(t => {
            cards.push({ word: t.word, answer: t.answer, sentence: s.full, chapter: ch.id, accent: ch.accent });
          });
        });
      }
    });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function WritingDrillView({ onExit }) {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const startDrill = (chapterId) => {
    setCards(buildDrillCards(chapterId));
    setSelectedChapter(chapterId);
    setIdx(0);
    setRevealed(false);
  };

  const backToPicker = () => {
    setSelectedChapter(null);
    setCards([]);
    setIdx(0);
    setRevealed(false);
  };

  // ── Chapter picker ──
  if (!selectedChapter) {
    return (
      <div className="max-w-3xl mx-auto pb-32">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onExit} className="flex items-center gap-1 px-3 py-2 bg-[#171720] rounded-xl border border-[#2a2a38] text-[#606080] hover:text-[#e0e0f0] text-sm">
            ← 練習テストに戻る
          </button>
          <h2 className="text-xl font-bold text-[#e0e0f0]">書き練習</h2>
        </div>
        <p className="text-sm text-[#606080] mb-4">練習する課を選んでください</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {CHAPTERS.map(ch => {
            const count = buildDrillCards(ch.id).length;
            if (count === 0) return null;
            return (
              <button key={ch.id} onClick={() => startDrill(ch.id)}
                className="flex flex-col items-center gap-1 py-5 rounded-2xl text-white font-bold shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ background: ch.accent }}>
                <span className="text-2xl font-black">{ch.id}</span>
                <span className="text-xs font-semibold opacity-80">課</span>
                <span className="text-xs opacity-70 mt-1">{count}問</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => startDrill('all')}
          className="w-full py-3 rounded-2xl font-bold bg-gray-800 text-white hover:bg-gray-700 text-sm shadow-md transition-all hover:scale-105 active:scale-95">
          全課まとめて練習
        </button>
      </div>
    );
  }

  // ── Drill ──
  const done = idx >= cards.length;
  const card = done ? null : cards[idx];
  const accent = selectedChapter === 'all' ? '#4f46e5' : (CHAPTERS.find(ch => ch.id === selectedChapter)?.accent ?? '#4f46e5');

  const handleNext = () => { setRevealed(false); setIdx(i => i + 1); };
  const handleRestart = () => { setCards(buildDrillCards(selectedChapter)); setIdx(0); setRevealed(false); };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-6">
        <button onClick={backToPicker} className="flex items-center gap-1 px-3 py-2 bg-[#171720] rounded-xl border border-[#2a2a38] text-[#606080] hover:text-[#e0e0f0] text-sm">
          ← 課選択に戻る
        </button>
        {!done && <span className="text-sm text-[#606080] font-medium">{idx + 1} / {cards.length}</span>}
      </div>

      {done ? (
        <div className="text-center py-20">
          <p className="text-2xl font-bold text-[#e0e0f0] mb-2">全問完了！</p>
          <p className="text-[#606080] mb-8">書き練習が終わりました。</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: accent }}>
              もう一度 ↺
            </button>
            <button onClick={backToPicker}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#171720] border border-[#2a2a38] text-[#606080] hover:text-[#e0e0f0] text-sm">
              別の課を選ぶ
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#171720] rounded-2xl border border-[#2a2a38] p-8">
          {/* Progress bar */}
          <div className="mb-6 bg-[#2a2a38] rounded-full h-1.5">
            <div className="rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${(idx / cards.length) * 100}%`, background: accent }} />
          </div>

          {/* Chapter badge */}
          <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
            style={{ background: accent }}>{card.chapter}課</span>

          {/* Sentence context */}
          <p className="text-sm text-[#606080] mt-4 mb-2 kanji-text leading-relaxed">
            {card.sentence.split(card.word).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`border-b-2 font-medium ${revealed ? 'border-[#4AA85C] text-[#4AA85C]' : 'border-[#8B82F0] text-[#8B82F0]'}`}>
                    {revealed ? card.answer : card.word}
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* Prompt */}
          <p className="text-lg font-bold text-[#e0e0f0] mb-6 kanji-text">
            「<span className="text-[#8B82F0]">{card.word}</span>」を漢字で書いてください
          </p>

          {/* Canvas */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <HandwritingCanvas key={`${idx}-${cards.length}`} width={200} height={120} disabled={revealed} />
            {revealed && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-[#606080]">答え：</span>
                <span className="text-4xl font-bold text-[#e0e0f0] kanji-text">{card.answer}</span>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex justify-center">
            {!revealed ? (
              <button onClick={() => setRevealed(true)}
                className="px-8 py-3 rounded-xl font-bold text-white text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ background: accent }}>
                答えを見る
              </button>
            ) : (
              <button onClick={handleNext}
                className="px-8 py-3 rounded-xl font-bold bg-[#4AA85C] text-white hover:bg-[#3d8f4d] text-sm transition-all hover:scale-105 active:scale-95">
                {idx + 1 < cards.length ? '次へ →' : '完了 ✓'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
export default function PracticeTest({ onBack }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [drillMode, setDrillMode] = useState(false);

  const handleChange = useCallback((key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }, []);

  if (drillMode) return <WritingDrillView onExit={() => setDrillMode(false)} />;

  const chapter = CHAPTERS[activeIdx];
  const isSubmitted = !!submitted[chapter.id];

  const handleSubmit = () => {
    setSubmitted(prev => ({ ...prev, [chapter.id]: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnswers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(`${chapter.id}-`)) delete next[k]; });
      return next;
    });
    setSubmitted(prev => { const n = { ...prev }; delete n[chapter.id]; return n; });
  };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 px-3 py-2 bg-[#171720] rounded-xl border border-[#2a2a38] text-[#606080] hover:text-[#e0e0f0] text-sm">
          ← ホーム
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#e0e0f0]">練習テスト</h1>
        </div>
        <button onClick={() => setDrillMode(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#C1392B] text-white rounded-xl text-sm font-bold hover:bg-[#a62f24] transition-all whitespace-nowrap">
          書き練習
        </button>
      </div>

      {/* Chapter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CHAPTERS.map((ch, i) => (
          <button key={ch.id} onClick={() => setActiveIdx(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2
              ${activeIdx === i ? 'text-white' : 'bg-[#171720] text-[#606080] border-[#2a2a38] hover:border-[#3a3a55]'}`}
            style={activeIdx === i ? { background: ch.accent, borderColor: ch.accent } : {}}
          >
            {ch.id}課{submitted[ch.id] ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* Chapter heading */}
      <div className="flex items-center gap-3 mb-8 pb-3 border-b-4" style={{ borderColor: chapter.accent }}>
        <span className="text-white text-3xl font-black px-3 py-1 rounded-lg leading-none" style={{ background: chapter.accent }}>{chapter.id}</span>
        <span className="text-white text-sm font-semibold px-1.5 py-0.5 rounded" style={{ background: chapter.accent }}>課</span>
        <span className="text-2xl font-bold text-[#e0e0f0] tracking-wide">練習</span>
      </div>

      {/* Score banner */}
      <ScoreBanner chapter={chapter} answers={answers} submitted={isSubmitted} />

      {/* Sections */}
      {chapter.sections.map(sec => {
        if (sec.type === 'info')              return <InfoSection               key={sec.id} sec={sec} />;
        if (sec.type === 'reading_list')       return <ReadingListSection       key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'reading_headlines')  return <ReadingHeadlinesSection  key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'reading_sentences')  return <ReadingSentencesSection  key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'writing')             return <WritingSection            key={sec.id} sec={sec} submitted={isSubmitted} />;
        if (sec.type === 'kanji_choice')        return <KanjiChoiceSection        key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'word_box_fill')       return <WordBoxFillSection        key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'compound_splitting')  return <CompoundSplittingSection  key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        return null;
      })}

      {/* Sticky bar */}
      <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
        <div className="max-w-3xl mx-auto bg-[#171720]/95 backdrop-blur rounded-2xl border border-[#2a2a38] shadow-2xl p-4 flex items-center gap-4">
          {!isSubmitted ? (
            <>
              <p className="flex-1 text-xs text-[#606080] leading-relaxed">読み問題を入力後に採点。手書き問題（問題3）は自己採点してください。</p>
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                style={{ background: chapter.accent }}>
                採点する ✓
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-xs text-[#606080]">採点完了！手書き問題の答えを確認してください。</p>
              <button onClick={handleReset}
                className="px-6 py-2.5 rounded-xl font-bold bg-[#0F0F14] border border-[#2a2a38] text-[#606080] hover:text-[#e0e0f0] text-sm transition-all whitespace-nowrap">
                やり直す ↺
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

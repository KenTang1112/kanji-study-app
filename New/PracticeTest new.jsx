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
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
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
        className="border-2 border-gray-400 rounded bg-amber-50" />
      {!disabled && <button onClick={clear} className="text-[10px] text-gray-400 hover:text-red-500 mt-0.5 leading-none">消す</button>}
    </span>
  );
}

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];

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
            targets: [{ word: '皮膚', answer: 'ひふ' }] },
          { num: 3,  full: '鬱病かもしれないと思ったら、何科を受診すればいいですか。',
            targets: [{ word: '受診', answer: 'じゅしん' }] },
          // ④: 喉 = reading, かわく = writing
          { num: 4,  full: 'この薬を飲むと喉がかわくという人が多い。',
            targets: [{ word: '喉', answer: 'のど' }],
            writingTargets: [{ word: 'かわく', answer: '渇く' }] },
          { num: 5,  full: '水に溶けるビタミンは過剰に摂取しても尿と一緒に出て行きます。',
            targets: [{ word: '過剰', answer: 'かじょう' }, { word: '摂取', answer: 'せっしゅ' }] },
          { num: 6,  full: 'えいようが偏らないように食生活に注意しましょう。',
            targets: [{ word: '食生活', answer: 'しょくせいかつ' }] },
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
          { num: 2, target: '紅葉',    answer: 'こうよう' },
          { num: 3, target: '丁寧',    answer: 'ていねい' },
          { num: 4, target: '誠に',    answer: 'まことに' },
          { num: 5, target: 'ご無沙汰', answer: 'ごぶさた' },
          { num: 6, target: 'お陰様',  answer: 'おかげさま' },
          { num: 7, target: '喪中',    answer: 'もちゅう' },
          { num: 8, target: '挨拶',    answer: 'あいさつ' },
          { num: 9, target: '永眠',    answer: 'えいみん' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: '問題2',
        instruction: '例のように書きなさい。',
        example: '例：わたしは大学へ行きます。　→　私　だいがく　いきます',
        sentences: [
          { num: 1, full: 'つつしんでおくやみ申し上げます。',
            targets: [{ word: 'おくやみ', answer: 'お悔やみ' }] },
          { num: 2, full: '祖父の一周忌に親戚が集まった。',
            targets: [{ word: '一周忌', answer: 'いっしゅうき' }, { word: '親戚', answer: 'しんせき' }] },
          { num: 3, full: '日本人女性の平均 じゅみょうは何歳ですか。',
            targets: [{ word: '平均', answer: 'へいきん' }] },
          { num: 4, full: '陰気な顔ばかりしていないで、もっと笑顔を見せたほうがいいですよ。',
            targets: [{ word: '陰気', answer: 'いんき' }, { word: '笑顔', answer: 'えがお' }] },
          { num: 5, full: 'あの人が本当に誠実かどうかは疑問だ。',
            targets: [{ word: '誠実', answer: 'せいじつ' }] },
          { num: 6, full: '彼は仕事のしっぱいが続き、すっかり自信を喪失している。',
            targets: [{ word: '喪失', answer: 'そうしつ' }] },
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
        <div className="border-2 border-gray-500 rounded-lg p-4 mb-5 bg-gray-50">
          {sec.contextTitle && (
            <p className="text-center font-bold text-base tracking-widest kanji-text mb-3 border-b border-gray-300 pb-2">{sec.contextTitle}</p>
          )}
          {sec.contextLines.map((line, i) => (
            <p key={i} className="text-sm leading-7 kanji-text whitespace-pre-wrap">{line || '\u00A0'}</p>
          ))}
        </div>
      )}

      {/* Three-document layout for Ch16 */}
      {sec.contextDocs && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {sec.contextDocs.map((doc, di) => (
            <div key={di} className="border-2 border-gray-400 rounded-lg p-3 bg-gray-50 text-xs">
              <p className="font-bold text-gray-600 text-center mb-2 border-b border-gray-300 pb-1">{doc.title}</p>
              {doc.lines.map((line, li) => (
                <p key={li} className="kanji-text leading-6">{line}</p>
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
                ${submitted ? (correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <span className="text-gray-500 text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-gray-800 border-b-2 border-gray-600 inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ひらがなで"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-700') : 'bg-gray-50 border-gray-300 focus:border-blue-400 focus:bg-white'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-gray-400 mr-1">{val || '未回答'}</span><span className="text-green-700 font-bold">→ {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-green-600 font-bold mt-1">✓ 正解</p>}
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
      <div className="border-2 border-gray-500 rounded-lg p-4 mb-5 bg-gray-50 space-y-3">
        {sec.headlines.map((h, i) => (
          <p key={i}
            className={`kanji-text text-lg leading-relaxed px-3 py-2 rounded font-medium
              ${h.inverted ? 'bg-gray-800 text-white' : 'border border-dashed border-gray-500 bg-white'}`}
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
                ${submitted ? (correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <span className="text-gray-500 text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-gray-800 border-b-2 border-gray-600 inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ひらがなで"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-700') : 'bg-gray-50 border-gray-300 focus:border-blue-400 focus:bg-white'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-gray-400 mr-1">{val || '未回答'}</span><span className="text-green-700 font-bold">→ {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-green-600 font-bold mt-1">✓ 正解</p>}
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
        <div className="border border-gray-400 rounded inline-flex items-center px-4 py-1.5 mb-4 bg-white text-sm kanji-text">{sec.example}</div>
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
              <span className="text-gray-500 font-medium text-base shrink-0 mt-0.5">{CIRCLED[s.num - 1]}</span>
              <div className="flex-1">
                {/* Sentence with underlined targets inline */}
                <p className="text-base kanji-text leading-loose mb-3">
                  {segments.map((seg, si) => {
                    if (!seg.isTarget) return <span key={si}>{seg.text}</span>;
                    const tInfo = allTargets.find(t => t.word === seg.text);
                    if (tInfo?.mode === 'writing') {
                      return <span key={si} className="border-b-2 border-indigo-600 text-indigo-700 font-medium">{seg.text}</span>;
                    }
                    return <span key={si} className="border-b-2 border-gray-700 font-medium">{seg.text}</span>;
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
                          <span className="text-xs text-gray-500 kanji-text border-b border-gray-400 inline-block">{t.word}</span>
                          <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                            placeholder="読み"
                            className={`px-2 py-1 rounded border text-sm outline-none transition-all
                              ${submitted ? (correct ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-700') : 'bg-blue-50 border-blue-300 focus:border-blue-500 focus:bg-white'}`}
                            style={{ width: `${Math.max(90, t.answer.length * 13 + 20)}px` }} />
                          {submitted && correct && <span className="text-[11px] text-green-600 font-bold">✓</span>}
                          {submitted && wrong && <span className="text-[11px] text-green-700 font-bold">{t.answer}</span>}
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
                        <span className="text-xs text-indigo-600 font-medium border-b border-indigo-400 kanji-text">{t.word} →漢字</span>
                        <div className="flex items-center gap-2">
                          <HandwritingCanvas width={120} height={68} disabled={submitted} />
                          {submitted && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">答：</span>
                              <span className="text-2xl font-bold text-gray-800 kanji-text">{t.answer}</span>
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
  const twoCol = sec.twoCol && sec.sentences.length >= 6;
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />
      <div className={twoCol ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6' : 'space-y-6'}>
        {sec.sentences.map(s => {
          const writingTargets = s.writingTargets || [];
          const segments = splitSentence(s.full, writingTargets.map(t => ({ word: t.word, key: t.word })));
          return (
            <div key={s.num} className="flex items-start gap-3">
              <span className="text-gray-500 font-medium text-base shrink-0 mt-0.5">{CIRCLED[s.num - 1]}</span>
              <div className="flex-1">
                <p className="text-base kanji-text leading-loose mb-2">
                  {segments.map((seg, si) =>
                    seg.isTarget
                      ? <span key={si} className="border-b-2 border-gray-700 text-indigo-700 font-medium">{seg.text}</span>
                      : <span key={si}>{seg.text}</span>
                  )}
                </p>
                {/* One canvas per writing target */}
                <div className="flex flex-wrap gap-4">
                  {writingTargets.map(t => (
                    <div key={t.word} className="flex flex-col items-start gap-1">
                      {writingTargets.length > 1 && (
                        <span className="text-xs text-indigo-600 font-medium kanji-text border-b border-indigo-400">{t.word}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <HandwritingCanvas width={130} height={75} disabled={submitted} />
                        {submitted && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">答え：</span>
                            <span className="text-2xl font-bold text-gray-800 kanji-text">{t.answer}</span>
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
    <div className="mb-10 border border-gray-400 rounded-lg p-4 bg-gray-50">
      <p className="font-bold text-gray-700 mb-2">─ {sec.label} ─</p>
      <p className="text-sm text-gray-700 leading-relaxed kanji-text whitespace-pre-line">{sec.content}</p>
    </div>
  );
}

function SectionHeader({ label, instruction }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 mb-4">
      <span className="font-bold text-gray-900 text-base shrink-0">{label}</span>
      <span className="text-sm text-gray-600 leading-relaxed">{instruction}</span>
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
    const items = sec.questions || sec.sentences || [];
    items.forEach(item => {
      // questions array (reading_list / reading_headlines)
      if (item.target && item.answer) {
        total++;
        const key = `${chapter.id}-${sec.id}-${item.num}`;
        if ((answers[key] || '').trim() === item.answer) correct++;
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
// MAIN
// ─────────────────────────────────────────────────────────────────
export default function PracticeTest({ onBack }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});

  const chapter = CHAPTERS[activeIdx];
  const isSubmitted = !!submitted[chapter.id];

  const handleChange = useCallback((key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }, []);

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
        <button onClick={onBack} className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm text-sm">
          ← ホーム
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">練習テスト</h1>
          <p className="text-xs text-gray-500">15〜19課</p>
        </div>
      </div>

      {/* Chapter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CHAPTERS.map((ch, i) => (
          <button key={ch.id} onClick={() => setActiveIdx(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2
              ${activeIdx === i ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
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
        <span className="text-2xl font-bold text-gray-800 tracking-wide">練習</span>
      </div>

      {/* Score banner */}
      <ScoreBanner chapter={chapter} answers={answers} submitted={isSubmitted} />

      {/* Sections */}
      {chapter.sections.map(sec => {
        if (sec.type === 'info')              return <InfoSection               key={sec.id} sec={sec} />;
        if (sec.type === 'reading_list')       return <ReadingListSection       key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'reading_headlines')  return <ReadingHeadlinesSection  key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'reading_sentences')  return <ReadingSentencesSection  key={sec.id} sec={sec} chId={chapter.id} answers={answers} onChange={handleChange} submitted={isSubmitted} />;
        if (sec.type === 'writing')            return <WritingSection           key={sec.id} sec={sec} submitted={isSubmitted} />;
        return null;
      })}

      {/* Sticky bar */}
      <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur rounded-2xl border border-gray-200 shadow-2xl p-4 flex items-center gap-4">
          {!isSubmitted ? (
            <>
              <p className="flex-1 text-xs text-gray-500 leading-relaxed">読み問題を入力後に採点。手書き問題（問題3）は自己採点してください。</p>
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                style={{ background: chapter.accent }}>
                採点する ✓
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-xs text-gray-600">採点完了！手書き問題の答えを確認してください。</p>
              <button onClick={handleReset}
                className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-all whitespace-nowrap">
                やり直す ↺
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

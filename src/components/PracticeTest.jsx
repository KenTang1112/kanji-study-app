import { useState, useRef, useEffect, useCallback } from 'react';

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// HANDWRITING CANVAS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
      {!disabled && <button onClick={clear} className="text-[10px] text-gray-400 hover:text-red-500 mt-0.5 leading-none">æ¶ã</button>}
    </span>
  );
}

const CIRCLED = ['â ','â¡','â¢','â£','â¤','â¥','â¦','â§','â¨','â©','âª','â«'];

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Splits a sentence string into parts around multiple target words.
// Returns array of { text, isTarget, targetKey } segments.
// targets = [{ word, key }]
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// DATA  â every underlined word captured as a separate target
// type: 'reading_list'       = context box + numbered answer grid
// type: 'reading_headlines'  = headlines box + numbered answer grid
// type: 'reading_sentences'  = full sentences, each with 1âN inputs
// type: 'writing'            = hiragana underlined â handwriting canvas
// type: 'info'               = è¦ãã¦ããã info box
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const CHAPTERS = [

  // âââ 15èª² âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  {
    id: 15, accent: '#9333ea',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: 'åé¡1',
        instruction: 'æ¬¡ã®èª¬æãèª­ãã§ãä¸ç·é¨â ãâ«ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        contextTitle: 'åãè¨ºãç¥¨',
        contextLines: [
          'ã»ã©ããªâ çç¶ãããã¾ããããï¼ãâ¡ä¸ç¢ã¨â¢åãæ°ãï¼',
          'ã»ãã¤ããã§ããããããããï¼ãããããããï¼ãã',
          'ã»é£æ¬²ãããã¾ãããããããâ¡ã¯ããâããã',
          'ã»â£ç¡ç æéã¯ã©ã®ãããã§ããï¼ããï¼æé',
          'ã»ä»ã¾ã§ã«ããã£ãçæ°ãããã¾ãã',
          'ãâã¯ã',
          'ãâ¡â¤ç³å°¿çãâ¡â¥å¿èçãâ¡â¦èèçãâ¡â§èèçãâ¡è¡æ¶²â¨ç¾æ£ãâ¡é«è¡å§ç',
          'ãâ¡ãªã¦ãããâ¡ãããããâã¢ã¬ã«ã®ã¼ç¾æ£ãâ¡â©è³æ¢å¡ãâ¡ãã®ä»ï¼âªèæ½°çï¼',
          'ãâ¡ããã',
          'ã»ï¼å¥³æ§ã®æ¹ï¼ãã¾â«å¦å¨ ãã¦ãã¾ãããâ¡ã¯ãï¼ãé±ï¼âããã',
        ],
        questions: [
          { num: 1,  target: 'çç¶',   answer: 'ãããããã' },
          { num: 2,  target: 'ä¸ç¢',   answer: 'ãã' },
          { num: 3,  target: 'åãæ°', answer: 'ã¯ãã' },
          { num: 4,  target: 'ç¡ç ',   answer: 'ããã¿ã' },
          { num: 5,  target: 'ç³å°¿ç', answer: 'ã¨ãã«ããã³ãã' },
          { num: 6,  target: 'å¿èç', answer: 'ããããã³ãã' },
          { num: 7,  target: 'èèç', answer: 'ããããã³ãã' },
          { num: 8,  target: 'èèç', answer: 'ããããã³ãã' },
          { num: 9,  target: 'ç¾æ£',   answer: 'ãã£ãã' },
          { num: 10, target: 'è³æ¢å¡', answer: 'ã®ããããã' },
          { num: 11, target: 'èæ½°ç', answer: 'ããããã' },
          { num: 12, target: 'å¦å¨ ',   answer: 'ã«ããã' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: 'åé¡2',
        instruction: 'ä¾ã®ããã«æ¸ããªããã',
        example: 'ä¾ï¼ãããã¯å¤§å­¦ã¸è¡ãã¾ãããâãç§ãã ããããããã¾ã',
        sentences: [
          { num: 1,  full: 'ç¼ç§ã«è¡ãã¨ã¾ãè¦åæ¤æ»ãåãã¾ãã',
            targets: [{ word: 'è¦åæ¤æ»', answer: 'ããããããã' }] },
          { num: 2,  full: 'äºã¯ç®èã¨èºã®ä¸¡æ¹ã§å¼å¸ããã',
            targets: [{ word: 'äº', answer: 'ãã' }, { word: 'ç®è', answer: 'ã²ãµ' }, { word: 'èº', answer: 'ã¯ã' }] },
          { num: 3,  full: 'é¬±çãããããªãã¨æã£ãããä½ç§ãåè¨ºããã°ããã§ããã',
            targets: [{ word: 'åè¨º', answer: 'ãããã' }] },
          // â£: å = reading, ããã = writing
          { num: 4,  full: 'ãã®è¬ãé£²ãã¨åããããã¨ããäººãå¤ãã',
            targets: [{ word: 'å', answer: 'ã®ã©' }],
            writingTargets: [{ word: 'ããã', answer: 'æ¸ã' }] },
          { num: 5,  full: 'æ°´ã«æº¶ãããã¿ãã³ã¯éå°ã«æåãã¦ãå°¿ã¨ä¸ç·ã«åºã¦è¡ãã¾ãã',
            targets: [{ word: 'éå°', answer: 'ãããã' }, { word: 'æå', answer: 'ãã£ãã' }] },
          { num: 6,  full: 'ãããããåããªãããã«é£çæ´»ã«æ³¨æãã¾ãããã',
            targets: [{ word: 'é£çæ´»', answer: 'ããããããã¤' }],
            writingTargets: [{ word: 'ãããã', answer: 'æ é¤' }] },
          { num: 7,  full: 'ãã®å¦æ¹ç®ãè¬å±ã«åºãã¦ãè¬ãããã£ã¦ãã ããã',
            targets: [{ word: 'å¦æ¹ç®', answer: 'ããã»ããã' }] },
          { num: 8,  full: 'ã¨ã³ã¼ï¼ultrasonographyï¼ã§èåã®ç¶æãè¦ãã',
            targets: [{ word: 'èå', answer: 'ããã' }] },
          { num: 9,  full: 'æ­¯ä¸¦ã³ãç¯æ­£ããã',
            targets: [{ word: 'ç¯æ­£', answer: 'ããããã' }] },
          // â©: ä¹ãç©éã = reading, ãã = writing
          { num: 10, full: 'ä¹ãç©éãã«ããè¬ããã ããã',
            targets: [{ word: 'ä¹ãç©éã', answer: 'ã®ããã®ãã' }],
            writingTargets: [{ word: 'ãã', answer: 'å¹ã' }] },
        ],
      },
    ],
  },

  // âââ 16èª² âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  {
    id: 16, accent: '#2563eb',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: 'åé¡1',
        instruction: 'æ¬¡ã®èª¬æãèª­ãã§ãâ ãâ¨ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        contextTitle: 'ã¡ã¼ã«ã»æç´æ',
        // Three documents shown side by side in the textbook
        contextDocs: [
          {
            title: 'æç´ï¼ç§ï¼',
            lines: [
              'â æåãç§ãæ·±ã¾ãâ¡ç´èãç¾ããå­£ç¯ã¨',
              'ãªãã¾ããããã®åº¦ã¯ãâ¢ä¸å¯§ã«ãç¥ãã',
              'ãè´ãé ãã¾ãã¦ãâ¢èª ã«ãããã¨ãã',
              'ããã¾ãããããããããããæ¬å·',
            ],
          },
          {
            title: 'ã¡ã¼ã«ä½æ',
            lines: [
              'å¤§å¤â£ãç¡æ²æ±°ãã¦ããã¾ãããçæ§ã',
              'ãå¤ããããã¾ãããããã¡ãã¯â¤ãé°æ§',
              'ã§ãçãåæ°ã«ãã¦ããã¾ããå®ã¯ããç¸',
              'è«ããããã¨ããã£ã¦ã¡ã¼ã«ããéããã¾ããã',
            ],
          },
          {
            title: 'åªä¸­ã¯ãã',
            lines: [
              'â¥åªä¸­ã«ã¤ãå¹´æ«å¹´å§ã®ãâ¦æ¨æ¶ã',
              'å¤±ç¤¼ããã¦ããã ãã¾ãã',
              'å»ãâæâæ¥ã«å¤«ââãâ§æ°¸ç ãããã¾ããã',
              'æ¬å¹´ä¸­ã«è³ãã¾ãããâ¨åæã«æè¬ç³ãä¸ãã¾ãã',
            ],
          },
        ],
        questions: [
          { num: 1, target: 'æå',    answer: 'ã¯ããã' },
          { num: 2, target: 'ç´è',    answer: 'ãããã' },
          { num: 3, target: 'ä¸å¯§',    answer: 'ã¦ãã­ã' },
          { num: 4, target: 'èª ã«',    answer: 'ã¾ãã¨ã«' },
          { num: 5, target: 'ãç¡æ²æ±°', answer: 'ãã¶ãã' },
          { num: 6, target: 'ãé°æ§',  answer: 'ããããã¾' },
          { num: 7, target: 'åªä¸­',    answer: 'ãã¡ãã' },
          { num: 8, target: 'æ¨æ¶',    answer: 'ãããã¤' },
          { num: 9, target: 'æ°¸ç ',    answer: 'ããã¿ã' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: 'åé¡2',
        instruction: 'ä¾ã®ããã«æ¸ããªããã',
        example: 'ä¾ï¼ãããã¯å¤§å­¦ã¸è¡ãã¾ãããâãç§ãã ããããããã¾ã',
        sentences: [
          { num: 1, full: 'ã¤ã¤ããã§ãããã¿ç³ãä¸ãã¾ãã',
            targets: [{ word: 'ãããã¿', answer: 'ãæãã¿' }],
            writingTargets: [{ word: 'ãããã¿', answer: 'ãæãã¿' }, { word: 'ã¤ã¤ããã§', answer: 'æãã§' }] },
          { num: 2, full: 'ç¥ç¶ã®ä¸å¨å¿ã«è¦ªæãéã¾ã£ãã',
            targets: [{ word: 'ä¸å¨å¿', answer: 'ãã£ãããã' }, { word: 'è¦ªæ', answer: 'ãããã' }] },
          { num: 3, full: 'æ¥æ¬äººå¥³æ§ã®å¹³å ããã¿ããã¯ä½æ­³ã§ããã',
            targets: [{ word: 'å¹³å', answer: 'ã¸ããã' }],
            writingTargets: [{ word: 'ããã¿ãã', answer: 'å¯¿å½' }] },
          { num: 4, full: 'é°æ°ãªé¡ã°ãããã¦ããªãã§ããã£ã¨ç¬é¡ãè¦ããã»ããããã§ããã',
            targets: [{ word: 'é°æ°', answer: 'ããã' }, { word: 'ç¬é¡', answer: 'ããã' }] },
          { num: 5, full: 'ãã®äººãæ¬å½ã«èª å®ãã©ããã¯çåã ã',
            targets: [{ word: 'èª å®', answer: 'ãããã¤' }, { word: 'çå', answer: 'ããã' }] },
          { num: 6, full: 'å½¼ã¯ä»äºã®ãã£ã±ããç¶ãããã£ããèªä¿¡ãåªå¤±ãã¦ããã',
            targets: [{ word: 'åªå¤±', answer: 'ãããã¤' }],
            writingTargets: [{ word: 'ãã£ã±ã', answer: 'å¤±æ' }] },
          { num: 7, full: 'å­ã©ããçã¾ããã¨ããæãç¤¾ã®æ¶å¼ä¼æã®è¦å®ã§ã¯ï¼æ¥ä¼æãã¨ããã',
            targets: [{ word: 'æ¶å¼ä¼æ', answer: 'ããã¡ãããããã' }] },
        ],
      },
      {
        id: 's3', type: 'info',
        label: 'è¦ãã¦ããã',
        content: 'æªç¨ãç®çã¨ããæ³çãªæ¸é¡ã®éé¡ã®æ¸ãæããé²ãããã«ãæ¬¡ã®ãããªæ¼¢å­ãæ¸ãå ´åãããã\n\nä¸ï¼å£±ãåï¼æ¾ãäºï¼å¼ãç¾ï¼ä½°ãä¸ï¼åãåï¼é¡ãäºï¼ä¼ãä¸ï¼è¬ãåï¼å',
      },
    ],
  },

  // âââ 17èª² âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  {
    id: 17, accent: '#16a34a',
    sections: [
      {
        id: 's1', type: 'reading_list',
        label: 'åé¡1',
        instruction: 'æ¬¡ã®èª¬æãèª­ãã§ãä¸ç·é¨â ãâ¨ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        contextTitle: 'é²ç½å¯¾ç­',
        contextLines: [
          'ãããã ãã¯ç¨æãï¼ã',
          '(1) é£²ææ°´ã(2) é£æï¼ãï¼æ¥å',
          '(3) â è²´éåé¡ï¼ç¾éãâ¡å°éãªã©ï¼',
          '(4) â¢æä¸­é»ç¯ãã­ã¼ã½ã¯ãããã',
          '(5) ãã©ã³ã¸ã¹ã¿ã¼ã©ã¸ãªãé»æ± ',
          '(6) ä¸çãè¡£é¡ãã¿ãªã«ãããã¼ã«ããµããããã²ããæè¢ãã¡ãç´',
          '(7) ãã«ã¡ãããªã©ã(8) å¿æ¥å»è¬åã(9) ç­è¨ç¨å·',
          '(10) ä¹³å¹¼åã®ããå®¶åº­ã§ã¯ãæ¯å­æå¸³ããã«ã¯ããªã ããªã©ã(11) éåé´',
          '',
          'ãâ£æ¥é ã®åãã',
          '(1) â¤é¿é£å ´æãé¿é£çµè·¯ãç¢ºèªãã¦ããã',
          '(2) â¥å´ããããèµ·ããããªå ´æãç¢ºèªãã¦ããã',
          '(3) æ¶ç«å¨ãæ¶ç«ç¨ã®æ°´ãåãã¦ããã',
          '(4) å®¶å·ç­ãåããªãããã«ãã¦ããã',
          '(5) éå¸¸æã¡åºãåãæºåãã¦ããã',
          '',
          'ãç½å®³ç¨ä¼è¨ãã¤ã¤ã«ãå±çªãªãï¼ï¼ï¼ã',
          'â¦å¤§è¦æ¨¡ãªç«ç½ãå°éãªã©ãçºçããéã«ãâ§è¦ªæãåäººãªã©ã®å®å¦ç¢ºèªã«å©ç¨ã§ãã¾ããäºåã®â¨å¥ç´ã¯ä¸è¦ã§ãã',
        ],
        questions: [
          { num: 1, target: 'è²´éå',   answer: 'ãã¡ããã²ã' },
          { num: 2, target: 'å°é',     answer: 'ãããã' },
          { num: 3, target: 'æä¸­é»ç¯', answer: 'ããã¡ããã§ãã¨ã' },
          { num: 4, target: 'æ¥é ',     answer: 'ã²ãã' },
          { num: 5, target: 'é¿é£å ´æ', answer: 'ã²ãªãã°ãã' },
          { num: 6, target: 'å´',       answer: 'ãã' },
          { num: 7, target: 'å¤§è¦æ¨¡',   answer: 'ã ããã¼' },
          { num: 8, target: 'è¦ªæ',     answer: 'ãããã' },
          { num: 9, target: 'å¥ç´',     answer: 'ãããã' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: 'åé¡2',
        instruction: 'ä¸ç·é¨ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        sentences: [
          { num: 1, full: 'ãã®å°éã«ããæ´¥æ³¢ã®å¿éã¯ããã¾ããã',
            targets: [{ word: 'æ´¥æ³¢', answer: 'ã¤ãªã¿' }] },
          { num: 2, full: 'ç«å±±ãããã°ããå´åºãããã¨ããå´ç«ãã¨ãããæ°è±¡åºã§ã¯ç«å£ããåºå½¢ç©ãæ°´å¹³ã¾ãã¯åç´è·é¢ã§100ã300ã¡ã¼ãã«ã®ç¯å²ãè¶ãããã®ãã¨ãã¦ããã',
            targets: [{ word: 'å´åº', answer: 'ãµãããã¤' }, { word: 'åç´è·é¢', answer: 'ããã¡ããããã' }, { word: 'ç¯å²', answer: 'ã¯ãã' }] },
          { num: 3, full: 'å°é¢¨ã§å±æ ¹ã®ç¦ãé£ã°ãããã',
            targets: [{ word: 'ç¦', answer: 'ããã' }] },
          { num: 4, full: 'æ¿ãé§ã®ããè¦éããæªããªã£ã¦ããã¾ãããæ³¨æãã ããã',
            targets: [{ word: 'é§', answer: 'ãã' }] },
          { num: 5, full: 'å±±ç«äºã§ãå¼·é¢¨ã®ããã«çã®ç«å·»ãçºçããã',
            targets: [{ word: 'ç', answer: 'ã»ã®ã' }] },
          { num: 6, full: 'å½ã®ä¸­æ¢æ©è½ãéä¸­ãã¦ããæ±äº¬ã®é²ç½å¯¾ç­ã«åãçµãã',
            targets: [{ word: 'ä¸­æ¢', answer: 'ã¡ãããã' }] },
          { num: 7, full: 'é¦é½åãè¥²ã£ãè±ªé¨ã¯ã¾ãã«æ»ã®ãããªé¨ã ã£ãã',
            targets: [{ word: 'é¦é½å', answer: 'ããã¨ãã' }, { word: 'è±ªé¨', answer: 'ããã' }] },
          { num: 8, full: 'çºéããä½æ°å§ã®å½±é¿ã§å¸«èµ°ã®æ¥æ¬åå³¶ã«åµãå¹ãèãããå®®å´å¸ã§ã¯æå¤§ç¬éé¢¨é25.2ã¡ã¼ãã«ãè¦³æ¸¬ããã',
            targets: [{ word: 'åµ', answer: 'ããã' }] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: 'åé¡3',
        instruction: 'éãããªãããå ´åã¯ããã«æ³¨æãã¦ãä¸ç·é¨ã®è¨èãæ¼¢å­ã§æ¸ããªããã',
        // Each sentence may have multiple writing targets
        sentences: [
          { num: 1, full: 'ã»ã¼ã¿ã¼ãã¡ã¢ãã§çãããªããªã£ãã',
            writingTargets: [{ word: 'ã¡ã¢ãã§', answer: 'ç¸®ãã§' }] },
          // â¡ both ãã¿ãªã AND ã²ã³ã are writing targets
          { num: 2, full: 'ãã¿ãªãã®é³ãã²ã³ãã',
            writingTargets: [{ word: 'ãã¿ãªã', answer: 'é·' }, { word: 'ã²ã³ã', answer: 'é¿ã' }] },
          { num: 3, full: 'ãªã¤ãããæ²ãèããã¦ããã',
            writingTargets: [{ word: 'ãªã¤ããã', answer: 'æããã' }] },
          { num: 4, full: 'æ¨ã®ããã«ããããã',
            writingTargets: [{ word: 'ãããã', answer: 'é ãã' }] },
        ],
      },
    ],
  },

  // âââ 18èª² âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  {
    id: 18, accent: '#dc2626',
    sections: [
      {
        id: 's1', type: 'reading_headlines',
        label: 'åé¡1',
        instruction: 'æ¬¡ã®æ°èã®è¦åºããèª­ãã§ãä¸ç·é¨â ãâ¦ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        headlines: [
          { text: 'â æ¨æ¨ããéåâ¡å¥ªãããåæ°â¢ç®æã«æ·±ãâ£åºãå·', inverted: true },
          { text: 'ï¼ªï¼²â¤è¸åãç½®ãç³ããç·è·¯ã«ç³ã®â¥ç ããâ¦è·¡',   inverted: false },
        ],
        questions: [
          { num: 1, target: 'æ¨æ¨',    answer: 'ãããã' },
          { num: 2, target: 'å¥ªããã', answer: 'ãã°ããã' },
          { num: 3, target: 'ç®æ',    answer: 'ããã' },
          { num: 4, target: 'åºãå·',  answer: 'ãããã' },
          { num: 5, target: 'è¸å',    answer: 'ãµã¿ãã' },
          { num: 6, target: 'ç ãã',  answer: 'ãã ãã' },
          { num: 7, target: 'è·¡',      answer: 'ãã¨' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: 'åé¡2',
        instruction: 'ä¸ç·é¨ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        sentences: [
          { num: 1,  full: 'æ²æ¨ãªéãé­äºä»¶ãçºçããã',
            targets: [{ word: 'æ²æ¨', answer: 'ã²ãã' }, { word: 'éãé­', answer: 'ã¨ããã¾' }] },
          { num: 2,  full: 'ãä¿ºãã¯ããç§ãã¨åãæå³ã§ãããç·æ§ããä½¿ãã¾ããã',
            targets: [{ word: 'ä¿º', answer: 'ãã' }] },
          { num: 3,  full: 'ãã®å°å¹´ã¯15æ­³ã®ã¨ãç¯ç½ªçµç¹ã«æè´ãããèè¿«ããã¦è©æ¬ºã¨æ®ºäººãç¯ããã',
            targets: [
              { word: 'ç¯ç½ªçµç¹', answer: 'ã¯ãããããã' },
              { word: 'æè´',     answer: 'ãã¡' },
              { word: 'èè¿«',     answer: 'ãããã¯ã' },
              { word: 'è©æ¬º',     answer: 'ãã' },
              { word: 'ç¯ãã',   answer: 'ãããã' },
            ] },
          { num: 4,  full: 'è­¦å¯ã¯è¢«å®³èã«æ¨ã¿ããã¤èã®ç¯è¡ã¨ã¿ã¦ããã',
            targets: [{ word: 'æ¨ã¿', answer: 'ããã¿' }] },
          { num: 5,  full: 'ç¾å ´ã«æ®ãããè¡çã®DNAéå®ãé²ãããã¦ããã',
            targets: [{ word: 'è¡ç', answer: 'ãã£ãã' }, { word: 'éå®', answer: 'ããã¦ã' }] },
          { num: 6,  full: 'æç¸ãããã®ãããã£ã¦ãå½¼ã¯å®¶åº­ãæããªãã£ãã',
            targets: [{ word: 'æç¸', answer: 'ããã°ã' }] },
          { num: 7,  full: 'åºæ¼èãä¸ç¥¥äºãèµ·ããããããã¤ãã³ãã¯ä¸­æ­¢ã«ãªã£ãã',
            targets: [{ word: 'ä¸ç¥¥äº', answer: 'ãµãããã' }] },
          { num: 8,  full: 'é¦äººã¨ã¯æ¥æ¬äººãé¦ç»ã¨ã¯æ¥æ¬æ ç»ã®ãã¨ã§ãã',
            targets: [{ word: 'é¦äºº', answer: 'ã»ããã' }, { word: 'é¦ç»', answer: 'ã»ãã' }] },
          { num: 9,  full: 'ããã«è·ç©ãç½®ãã¨éè¡ã®éªé­ã«ãªãã¾ãã',
            targets: [{ word: 'éªé­', answer: 'ããã¾' }] },
          { num: 10, full: 'å½¼ã¯è³è³ãããã£ã¦ä¾¿å®ãå³ã£ãç½ªã§é®æãããã',
            targets: [
              { word: 'è³è³', answer: 'ããã' },
              { word: 'ä¾¿å®', answer: 'ã¹ãã' },
              { word: 'å³ã£ã', answer: 'ã¯ãã£ã' },
              { word: 'é®æ', answer: 'ããã»' },
            ] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: 'åé¡3',
        instruction: 'éãããªãããå ´åã¯ããã«æ³¨æãã¦ãä¸ç·é¨ã®è¨èãæ¼¢å­ã§æ¸ããªããã',
        twoCol: true,
        sentences: [
          { num: 1,  full: 'ç· ãåãããã¾ãã',               writingTargets: [{ word: 'ãã¾ã',     answer: 'è¿«ã' }] },
          { num: 2,  full: 'éããã©ãåãã',                 writingTargets: [{ word: 'ãã©ãåã', answer: 'èãåã' }] },
          { num: 3,  full: 'ã¿ãããªæ°æã¡ã«ãªãã',           writingTargets: [{ word: 'ã¿ãããª',   answer: 'æ¨ããª' }] },
          { num: 4,  full: 'äºå®ããµã¾ããã',                 writingTargets: [{ word: 'ãµã¾ãã',   answer: 'è¸ã¾ãã' }] },
          { num: 5,  full: 'ã¢ã«ãã¤ãä»£ã§çæ´»è²»ãã¾ããªãã', writingTargets: [{ word: 'ã¾ããªã',   answer: 'è³ã' }] },
          { num: 6,  full: 'çãã­ããã',                     writingTargets: [{ word: 'ã­ãã',     answer: 'çã' }] },
          { num: 7,  full: 'è·ç©ãã²ãã§ãã°ãã',             writingTargets: [{ word: 'ãã°ã',     answer: 'ç¸ã' }] },
          { num: 8,  full: 'æµãããããã',                   writingTargets: [{ word: 'ãããã',   answer: 'æ¬ºã' }] },
          { num: 9,  full: 'ãã¼ã«ãããã',                   writingTargets: [{ word: 'ãã',       answer: 'è¹´ã' }] },
          { num: 10, full: 'é¡ããªããã',                     writingTargets: [{ word: 'ãªãã',     answer: 'æ®´ã' }] },
        ],
      },
    ],
  },

  // âââ 19èª² âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  {
    id: 19, accent: '#7c3aed',
    sections: [
      {
        id: 's1', type: 'reading_headlines',
        label: 'åé¡1',
        instruction: 'æ¬¡ã®ãã¥ã¼ã¹ã®è¦åºããèª­ãã§ãä¸ç·é¨â ãâ«ã®èª­ã¿ãã²ãããªã§æ¸ããªããã',
        headlines: [
          { text: 'ã»ä¹ç¨è»ãâ ç¡åè¨±éè»¢ã§ãâ¡åç«¥ã®åã«â¢çªã£è¾¼ã',           inverted: false },
          { text: 'ã»â£æ¸æ»ã®é¦é½é«â»ã§â¤è¿½çªäºæããâ»é¦é½é«ï¼é¦é½é«ééè·¯',    inverted: false },
          { text: 'ã»éè»¢æã«â¥æ²å½¹ï¼å¹´â¦å·è¡ç¶äºï¼å¹´',                        inverted: false },
          { text: 'ã»åâ§æ­»ååãâ¨æ­»åå¶åº¦å»æ­¢ãâ©è¨´ãã',                    inverted: false },
          { text: 'ã»âªéæ¬æ¥­èãç©è·è½ä¸ã§ãäº¤éâ«å¦¨å®³',                      inverted: false },
        ],
        questions: [
          { num: 1,  target: 'ç¡åè¨±éè»¢',   answer: 'ãããããããã¦ã' },
          { num: 2,  target: 'åç«¥',          answer: 'ãã©ã' },
          { num: 3,  target: 'çªã£è¾¼ã',      answer: 'ã¤ã£ãã' },
          { num: 4,  target: 'æ¸æ»',          answer: 'ããããã' },
          { num: 5,  target: 'è¿½çªäºæ',      answer: 'ã¤ãã¨ã¤ãã' },
          { num: 6,  target: 'æ²å½¹',          answer: 'ã¡ãããã' },
          { num: 7,  target: 'å·è¡ç¶äº',      answer: 'ãã£ããããã' },
          { num: 8,  target: 'æ­»åå',        answer: 'ãããããã' },
          { num: 9,  target: 'æ­»åå¶åº¦å»æ­¢',  answer: 'ãããããã©ã¯ãã' },
          { num: 10, target: 'è¨´ãã',        answer: 'ãã£ããã' },
          { num: 11, target: 'éæ¬æ¥­è',      answer: 'ããã±ãããããã' },
          { num: 12, target: 'å¦¨å®³',          answer: 'ã¼ããã' },
        ],
      },
      {
        id: 's2', type: 'reading_sentences',
        label: 'åé¡2',
        instruction: 'ä¸ç·é¨ã®æ¼¢å­ã®èª­ã¿ãæ¸ããªããã',
        sentences: [
          { num: 1, full: 'ç²¾å¯æ¤æ»ãåããã',
            targets: [{ word: 'ç²¾å¯æ¤æ»', answer: 'ããã¿ã¤ããã' }] },
          { num: 2, full: 'éãæã«ãæ³¨æãã ããã',
            targets: [{ word: 'æ', answer: 'ã¨ã³ã' }] },
          { num: 3, full: 'é·ã«é©ããçãæµãå£ãã¦éãåºããã',
            targets: [{ word: 'é·', answer: 'ãã¿ãªã' }, { word: 'æµ', answer: 'ãã' }] },
          { num: 4, full: 'æ³å»·ã§è£å¤ãåè´ããã',
            targets: [{ word: 'æ³å»·', answer: 'ã»ãã¦ã' }, { word: 'è£å¤', answer: 'ããã°ã' }, { word: 'åè´', answer: 'ã¼ãã¡ãã' }] },
          { num: 5, full: 'ç±³å½ã§ã¯éªå¯©å¡å¶åº¦ãæ¡ç¨ãã¦ããã',
            targets: [{ word: 'éªå¯©å¡', answer: 'ã°ããããã' }] },
          { num: 6, full: 'è£å¤å¡å¶åº¦ã«ããè£å¤ã¯é£æ¥éå»·ãããã',
            targets: [{ word: 'è£å¤å¡å¶åº¦', answer: 'ããã°ãããããã©' }, { word: 'è£å¤', answer: 'ããã°ã' }, { word: 'éå»·', answer: 'ããã¦ã' }] },
          { num: 7, full: 'ä¼æ©ãªãã§12æééè»¢ãããè¡çªããã¨ãã®è¨æ¶ã¯ãªãã¨éè»¢æã¯è©±ãã¦ããã',
            targets: [{ word: 'ä¼æ©', answer: 'ããããã' }, { word: 'è¡çª', answer: 'ãããã¨ã¤' }, { word: 'è¨æ¶', answer: 'ããã' }] },
          { num: 8, full: 'å·¥äºè²¬ä»»èã¯å®å¨ç¢ºèªãæ ã£ããã¨ãèªãã¦ããã',
            targets: [{ word: 'æ ã£ã', answer: 'ãããã£ã' }] },
          { num: 9, full: 'ãã®ãã¬ãçªçµã¯éé±ã§æ¾éããã¦ããã',
            targets: [{ word: 'çªçµ', answer: 'ã°ããã¿' }, { word: 'éé±', answer: 'ããããã' }, { word: 'æ¾é', answer: 'ã»ããã' }] },
        ],
      },
      {
        id: 's3', type: 'writing',
        label: 'åé¡3',
        instruction: 'éãããªãããå ´åã¯ããã«æ³¨æãã¦ãä¸ç·é¨ã®è¨èãæ¼¢å­ã§æ¸ããªããã',
        twoCol: true,
        sentences: [
          { num: 1,  full: 'ãã®é¨å±ã¯ã«ã¼ãã³ã§ã¸ã ã¦ããã¦ããã', writingTargets: [{ word: 'ã¸ã ã¦ããã¦ãã', answer: 'éã¦ããã¦ãã' }] },
          { num: 2,  full: 'æµ·ã§ãã¼ããã',                          writingTargets: [{ word: 'ãã¼ãã',         answer: 'æººãã' }] },
          { num: 3,  full: 'é»è©±çªå·ãã²ãããã',                    writingTargets: [{ word: 'ã²ããã',         answer: 'æ§ãã' }] },
          { num: 4,  full: 'æ³ã§äººããã°ãã',                        writingTargets: [{ word: 'ãã°ã',           answer: 'è£ã' }] },
          { num: 5,  full: 'äººéä¸ä¿¡ã«ãã¡ããã',                    writingTargets: [{ word: 'ãã¡ãã',         answer: 'é¥ã' }] },
          { num: 6,  full: 'ãããããç·´ç¿ããã',                    writingTargets: [{ word: 'ããããã',       answer: 'ç¹°ãè¿ã' }] },
          { num: 7,  full: 'åãããããã',                          writingTargets: [{ word: 'ãããã',         answer: 'é®ã' }] },
          { num: 8,  full: 'æ­»åãã¾ã¬ãããã',                      writingTargets: [{ word: 'ã¾ã¬ããã',       answer: 'åãã' }] },
          { num: 9,  full: 'ç¡ç ããã¾ãããã',                      writingTargets: [{ word: 'ãã¾ããã',       answer: 'å¦¨ãã' }] },
          { num: 10, full: 'ãã®ãè¶ã¯ãã¶ãã',                      writingTargets: [{ word: 'ãã¶ã',           answer: 'æ¸ã' }] },
        ],
      },
    ],
  },
];

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// READING LIST SECTION  (åé¡1 with context box)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function ReadingListSection({ sec, chId, answers, onChange, submitted }) {
  return (
    <div className="mb-10">
      <SectionHeader label={sec.label} instruction={sec.instruction} />

      {/* Context box â single column */}
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
                ${submitted ? (correct ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50') : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <span className="text-gray-500 text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-gray-800 border-b-2 border-gray-600 inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ã²ãããªã§"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-green-100 border-green-300 text-green-800' : 'bg-amber-100 border-amber-300 text-amber-700') : 'bg-gray-50 border-gray-300 focus:border-blue-400 focus:bg-white'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-gray-400 mr-1">{val || 'æªåç­'}</span><span className="text-emerald-700 font-bold">â {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-emerald-600 font-bold mt-1">â æ­£è§£</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// READING HEADLINES SECTION
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
                ${submitted ? (correct ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50') : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <span className="text-gray-500 text-sm font-semibold pt-1 shrink-0">{CIRCLED[q.num - 1]}</span>
              <div className="flex-1">
                <p className="text-xl kanji-text font-medium text-gray-800 border-b-2 border-gray-600 inline-block mb-1">{q.target}</p>
                <input type="text" value={val} onChange={e => onChange(key, e.target.value)} disabled={submitted}
                  placeholder="ã²ãããªã§"
                  className={`w-full px-2 py-1 rounded border text-sm outline-none
                    ${submitted ? (correct ? 'bg-green-100 border-green-300 text-green-800' : 'bg-amber-100 border-amber-300 text-amber-700') : 'bg-gray-50 border-gray-300 focus:border-blue-400 focus:bg-white'}`} />
                {submitted && wrong && <p className="text-xs mt-1"><span className="line-through text-gray-400 mr-1">{val || 'æªåç­'}</span><span className="text-emerald-700 font-bold">â {q.answer}</span></p>}
                {submitted && correct && <p className="text-xs text-emerald-600 font-bold mt-1">â æ­£è§£</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// READING SENTENCES SECTION â multi-target per sentence
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

                {/* Reading inputs â one per reading target */}
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
                            placeholder="èª­ã¿"
                            className={`px-2 py-1 rounded border text-sm outline-none transition-all
                              ${submitted ? (correct ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-amber-100 border-amber-400 text-amber-800') : 'bg-white border-gray-300 focus:border-indigo-400 focus:bg-indigo-50'}`}
                            style={{ width: `${Math.max(90, t.answer.length * 13 + 20)}px` }} />
                          {submitted && correct && <span className="text-[11px] text-emerald-600 font-bold">â</span>}
                          {submitted && wrong && <span className="text-[11px] text-emerald-700 font-bold">{t.answer}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Writing canvases â one per writing target */}
                {writingTargets.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {writingTargets.map(t => (
                      <div key={t.word} className="flex flex-col items-start gap-1">
                        <span className="text-xs text-indigo-600 font-medium border-b border-indigo-400 kanji-text">{t.word} âæ¼¢å­</span>
                        <div className="flex items-center gap-2">
                          <HandwritingCanvas width={120} height={68} disabled={submitted} />
                          {submitted && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">ç­ï¼</span>
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

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// WRITING SECTION â hiraganaâkanji handwriting (åé¡3)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
                            <span className="text-xs text-gray-400">ç­ãï¼</span>
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

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// INFO SECTION
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function InfoSection({ sec }) {
  return (
    <div className="mb-10 border border-gray-400 rounded-lg p-4 bg-gray-50">
      <p className="font-bold text-gray-700 mb-2">â {sec.label} â</p>
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

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SCORE BANNER
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
      // sentences array (reading_sentences) â may have multiple targets
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
          <p className="text-white/80 text-sm mb-1">èª­ã¿åé¡ã®çµæ</p>
          <p className="text-3xl font-bold">{correct} <span className="text-lg font-normal">/ {total}</span></p>
          <p className="text-white/90 text-sm">{pct}% æ­£è§£</p>
        </div>
        <span className="text-5xl">{pct >= 80 ? 'ð' : pct >= 60 ? 'ð' : 'ðª'}</span>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2">
        <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      {chapter.sections.some(s => s.type === 'writing') && (
        <p className="text-white/80 text-xs mt-2">â» ææ¸ãåé¡ã¯ç­ããç¢ºèªãã¦èªå·±æ¡ç¹ãã¦ãã ããã</p>
      )}
    </div>
  );
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// MAIN
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
          â ãã¼ã 
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">ç·´ç¿ãã¹ã</h1>
          <p className="text-xs text-gray-500">15ã19èª²</p>
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
            {ch.id}èª²{submitted[ch.id] ? ' â' : ''}
          </button>
        ))}
      </div>

      {/* Chapter heading */}
      <div className="flex items-center gap-3 mb-8 pb-3 border-b-4" style={{ borderColor: chapter.accent }}>
        <span className="text-white text-3xl font-black px-3 py-1 rounded-lg leading-none" style={{ background: chapter.accent }}>{chapter.id}</span>
        <span className="text-white text-sm font-semibold px-1.5 py-0.5 rounded" style={{ background: chapter.accent }}>èª²</span>
        <span className="text-2xl font-bold text-gray-800 tracking-wide">ç·´ç¿</span>
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
              <p className="flex-1 text-xs text-gray-500 leading-relaxed">èª­ã¿åé¡ãå¥åå¾ã«æ¡ç¹ãææ¸ãåé¡ï¼åé¡3ï¼ã¯èªå·±æ¡ç¹ãã¦ãã ããã</p>
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                style={{ background: chapter.accent }}>
                æ¡ç¹ãã â
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-xs text-gray-600">æ¡ç¹å®äºï¼ææ¸ãåé¡ã®ç­ããç¢ºèªãã¦ãã ããã</p>
              <button onClick={handleReset}
                className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-all whitespace-nowrap">
                ããç´ã âº
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

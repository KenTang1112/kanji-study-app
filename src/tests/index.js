// Class tests registry.
// To add a test: drop a JSON file into src/tests/<class>/ (same shape as the others)
// and add it to that class's `tests` list below.
import s3Mock1 from './society3/mock-1.json';
import s3Mock2 from './society3/mock-2.json';
import s3RetestShoshi from './society3/retest-shoshi.json';
import s3RetestKaso from './society3/retest-kaso.json';
import s3RetestGender from './society3/retest-gender.json';
import pe2Practice1 from './polecon2/practice-1.json';

export const CLASSES = [
  {
    id: 'society3',
    name: '日本社会論 III',
    subtitle: 'Japanese Society III · Sasada',
    exam: { label: '中間テスト', date: '2026-11-26' },
    accent: '#3CBFA5',
    tests: [s3Mock1, s3Mock2, s3RetestShoshi, s3RetestKaso, s3RetestGender],
    // Combined midterm: drawn from every test above, in exam proportions.
    combined: {
      id: 'society3-combined',
      title: '中間テスト 総合模試',
      description: '35 multiple choice + 15 blanks drawn from all five tests. 少子高齢化 2 : 過疎化 2 : ジェンダー 1, like the real midterm. Reset for a new draw.',
      mc: 35,
      blank: 15,
      topics: [
        { id: 'shoshi', label: '少子高齢化', weight: 2 },
        { id: 'kaso', label: '過疎化と地域再生', weight: 2 },
        { id: 'gender', label: '政治とジェンダー', weight: 1 },
      ],
      // Week 7 = gender, weeks 4–5 = depopulation, everything else (weeks 2–3, 山田) = birth rate.
      topicOf: (item) => (/\bw7\b/.test(item.source) ? 'gender' : /\bw[45]\b/.test(item.source) ? 'kaso' : 'shoshi'),
    },
  },
  {
    id: 'polecon2',
    name: 'Political Economy II',
    subtitle: 'Japan & East Asia · Sasada',
    exam: { label: 'Midterm', date: '2026-12-08' },
    accent: '#6C8EF5',
    tests: [pe2Practice1],
  },
];

export function countItems(test) {
  return test.sections.reduce((n, s) => n + s.items.length, 0);
}

// Whole nights left before an exam date (YYYY-MM-DD), counted in local time.
export function nightsUntil(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const exam = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam - today) / 86400000);
}

export function examLabel(exam) {
  if (!exam) return '';
  const n = nightsUntil(exam.date);
  const day = new Date(exam.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  if (n < 0) return `${exam.label} · done`;
  if (n === 0) return `${exam.label} · today`;
  if (n === 1) return `${exam.label} · tomorrow (${day})`;
  return `${exam.label} · ${n} nights left (${day})`;
}

// ── Combined test ──────────────────────────────────────────────

function sample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// Split n across topics by weight, giving leftovers to the heaviest topics first.
function quotas(n, topics) {
  const total = topics.reduce((s, t) => s + t.weight, 0);
  const q = topics.map((t) => Math.floor((n * t.weight) / total));
  let left = n - q.reduce((s, x) => s + x, 0);
  const order = topics.map((t, i) => i).sort((a, b) => topics[b].weight - topics[a].weight);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) q[order[k]]++;
  return q;
}

// Returns a list of picks like "mock-1|0|12" (test id | section | item).
export function drawCombined(cls) {
  const cfg = cls.combined;
  const pool = { mc: [], blank: [] };
  const seen = new Set();
  cls.tests.forEach((t) => t.sections.forEach((sec, si) => sec.items.forEach((it, ii) => {
    const key = it.q.replace(/\s/g, '');
    if (seen.has(key)) return; // skip exact duplicates across tests
    seen.add(key);
    pool[sec.type]?.push({ ref: `${t.id}|${si}|${ii}`, topic: cfg.topicOf(it) });
  })));
  const picks = [];
  ['mc', 'blank'].forEach((type) => {
    const q = quotas(cfg[type], cfg.topics);
    cfg.topics.forEach((topic, i) => {
      picks.push(...sample(pool[type].filter((p) => p.topic === topic.id), q[i]).map((p) => p.ref));
    });
  });
  return picks;
}

// Builds a normal test object from saved picks, grouped by topic in exam order.
export function buildCombined(cls, picks) {
  const cfg = cls.combined;
  const byId = Object.fromEntries(cls.tests.map((t) => [t.id, t]));
  const labels = Object.fromEntries(cfg.topics.map((t) => [t.id, t.label]));
  const sections = { mc: [], blank: [] };
  (picks || []).forEach((ref) => {
    const [tid, si, ii] = ref.split('|');
    const t = byId[tid];
    const sec = t?.sections[Number(si)];
    const it = sec?.items[Number(ii)];
    if (!it) return;
    sections[sec.type].push({ ...it, tag: labels[cfg.topicOf(it)], from: t.title });
  });
  return {
    id: cfg.id,
    title: cfg.title,
    description: cfg.description,
    language: 'ja',
    combined: true,
    shuffle: cls.tests.every((t) => t.shuffle),
    sections: [
      { type: 'mc', title: 'Ⅰ. 選択問題', instruction: '最も適切なものを1つ選べ', items: sections.mc },
      { type: 'blank', title: 'Ⅱ. 穴埋め問題', instruction: '空欄に入る語句を書け（漢字・ひらがなどちらでも可）', items: sections.blank },
    ],
  };
}

export const picksKey = (combinedId) => `${combinedId}_picks`;

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
    exam: '中間テスト · Thu Nov 26',
    accent: '#3CBFA5',
    tests: [s3Mock1, s3Mock2, s3RetestShoshi, s3RetestKaso, s3RetestGender],
  },
  {
    id: 'polecon2',
    name: 'Political Economy II',
    subtitle: 'Japan & East Asia · Sasada',
    exam: 'Midterm · Tue Dec 8',
    accent: '#378ADD',
    tests: [pe2Practice1],
  },
];

export function countItems(test) {
  return test.sections.reduce((n, s) => n + s.items.length, 0);
}

// Saves class-test progress to the signed-in user's Firestore doc
// (users/{uid}.testProgress.{testId}), with localStorage as a cache and fallback.
import { db } from '../firebase.js';
import { doc, updateDoc, FieldPath } from 'firebase/firestore';

const LS_KEY = 'classTestProgress';
const timers = {};

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function writeLocal(all) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
}

export const testProgressService = {
  // Merge: the account copy wins when it exists, otherwise use this browser's copy.
  loadAll(user) {
    const local = readLocal();
    const remote = (user && user.testProgress) || {};
    return { ...local, ...remote };
  },

  save(user, testId, state) {
    const all = readLocal();
    all[testId] = state;
    writeLocal(all);
    if (!user || !user.id) return;
    clearTimeout(timers[testId]);
    // Debounced: one write per test after answering stops for a moment.
    // FieldPath keeps ids with hyphens (e.g. "retest-shoshi") as one field name.
    timers[testId] = setTimeout(() => {
      updateDoc(doc(db, 'users', user.id), new FieldPath('testProgress', testId), state)
        .catch((err) => console.warn('Could not sync test progress:', err));
    }, 1200);
  },
};

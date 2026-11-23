import { db, auth } from '../firebase.js';
import {
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged,
} from 'firebase/auth';

// In-app browsers (LINE, Instagram, Facebook, WeChat) are blocked by Google sign-in.
export function inAppBrowser() {
  const ua = navigator.userAgent || '';
  if (/\bLine\//i.test(ua)) return 'LINE';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/MicroMessenger/i.test(ua)) return 'WeChat';
  return null;
}

// Popup errors where a full-page redirect is likely to work instead.
const REDIRECT_FALLBACK = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/cancelled-popup-request',
]);
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

async function ensureUserDocument(firebaseUser, overrides = {}) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const userData = {
      displayName: overrides.displayName || firebaseUser.displayName || 'User',
      isGuest: overrides.isGuest || firebaseUser.isAnonymous || false,
      avatarUrl: firebaseUser.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, userData);
    return { id: firebaseUser.uid, ...userData };
  }
  return { id: firebaseUser.uid, ...snap.data() };
}

export const userService = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return ensureUserDocument(result.user);
    } catch (err) {
      if (REDIRECT_FALLBACK.has(err?.code)) {
        await signInWithRedirect(auth, provider); // leaves the page; finished in finishRedirectSignIn()
        return null;
      }
      throw err;
    }
  },

  // Call once on load: completes a sign-in that went through the redirect fallback.
  async finishRedirectSignIn() {
    const result = await getRedirectResult(auth);
    return result?.user ? ensureUserDocument(result.user) : null;
  },

  async signInAsGuest() {
    const result = await signInAnonymously(auth);
    return ensureUserDocument(result.user, { displayName: 'Guest', isGuest: true });
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async getUser(userId) {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateUser(userId, updates) {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  },

  async getUsersMap(userIds) {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return {};
    const results = await Promise.all(unique.map(id => this.getUser(id)));
    return Object.fromEntries(results.filter(Boolean).map(u => [u.id, u]));
  },
};

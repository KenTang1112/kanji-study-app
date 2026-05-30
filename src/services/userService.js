import { db, auth } from '../firebase.js';
import {
  GoogleAuthProvider, signInWithPopup, signInAnonymously,
  signOut as firebaseSignOut, onAuthStateChanged,
} from 'firebase/auth';
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
    const result = await signInWithPopup(auth, provider);
    return ensureUserDocument(result.user);
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

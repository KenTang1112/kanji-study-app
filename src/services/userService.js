import { db } from '../firebase.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const LS_KEY = 'currentUserId';

function getOrCreateLocalId() {
  let id = localStorage.getItem(LS_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_KEY, id);
  }
  return id;
}

export const userService = {
  getCurrentUserId() {
    return getOrCreateLocalId();
  },

  async getUser(userId) {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async createUser({ userId, displayName, isGuest = false }) {
    const ref = doc(db, 'users', userId);
    const userData = {
      displayName,
      isGuest,
      avatarUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, userData);
    return { id: userId, ...userData, createdAt: new Date(), updatedAt: new Date() };
  },

  async updateUser(userId, updates) {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  },

  async getUsersMap(userIds) {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return {};
    const results = await Promise.all(unique.map(id => this.getUser(id)));
    return Object.fromEntries(
      results.filter(Boolean).map(u => [u.id, u])
    );
  },
};

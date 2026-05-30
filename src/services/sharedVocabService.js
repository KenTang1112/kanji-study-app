import { db } from '../firebase.js';
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const COLLECTION = 'sharedVocab';

export const sharedVocabService = {
  async getAll() {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ docId: d.id, ...d.data() }));
  },

  async add(item, user) {
    const payload = {
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      chapter: Number(item.chapter),
      relatedKanji: item.relatedKanji || [],
      type: item.type || 'vocab',
      addedBy: user.id,
      addedByName: user.displayName,
      addedByAvatar: user.avatarUrl || null,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { docId: ref.id, ...payload, createdAt: new Date() };
  },

  async delete(docId) {
    await deleteDoc(doc(db, COLLECTION, docId));
  },
};

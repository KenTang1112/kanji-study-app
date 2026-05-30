import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import { sharedVocabService } from '../services/sharedVocabService';
import { userService } from '../services/userService';

export default function VocabularyManager({ onBack, currentUser }) {
  const [vocabulary, setVocabulary] = useState([]);
  const [contributors, setContributors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    word: '', reading: '', meaning: '', chapter: '', relatedKanji: [], type: 'vocab',
  });

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      const items = await sharedVocabService.getAll();
      setVocabulary(items);
      const ids = [...new Set(items.map(i => i.addedBy).filter(Boolean))];
      if (ids.length > 0) {
        const map = await userService.getUsersMap(ids);
        setContributors(map);
      }
    } catch (err) {
      console.error('Failed to load shared vocab:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRelatedKanjiChange = (e) => {
    const kanji = e.target.value.split('').filter(c => c.trim());
    setFormData(prev => ({ ...prev, relatedKanji: kanji }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.word || !formData.reading || !formData.meaning || !formData.chapter) {
      alert('Please fill in all required fields');
      return;
    }
    if (!currentUser) {
      alert('You need a profile to add vocabulary. Please set up your profile first.');
      return;
    }
    try {
      const newItem = await sharedVocabService.add(formData, currentUser);
      const updated = [newItem, ...vocabulary];
      setVocabulary(updated);
      dataService.refreshSharedVocab(updated);
      resetForm();
    } catch (err) {
      console.error('Failed to add vocab:', err);
      alert('Failed to save. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ word: '', reading: '', meaning: '', chapter: '', relatedKanji: [], type: 'vocab' });
    setShowAddForm(false);
  };

  const handleDelete = async (item) => {
    if (!currentUser || item.addedBy !== currentUser.id) return;
    if (!confirm('Delete this vocabulary item for everyone?')) return;
    try {
      await sharedVocabService.delete(item.docId);
      const updated = vocabulary.filter(v => v.docId !== item.docId);
      setVocabulary(updated);
      dataService.refreshSharedVocab(updated);
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const getUniqueChapters = () => {
    const chapters = [...new Set(vocabulary.map(item => item.chapter))];
    return chapters.sort((a, b) => a - b);
  };

  const getVocabularyByChapter = () => {
    return getUniqueChapters().map(chapter => ({
      chapter,
      items: vocabulary.filter(item => item.chapter === chapter),
    }));
  };

  const getContributorName = (item) => {
    return contributors[item.addedBy]?.displayName || item.addedByName || 'Unknown';
  };

  const getContributorAvatar = (item) => {
    return contributors[item.addedBy]?.avatarUrl || item.addedByAvatar || null;
  };

  const inputCls = "w-full px-4 py-2.5 bg-[#0F0F14] border border-[#2a2a38] text-[#e0e0f0] rounded-xl focus:border-[#C1392B] focus:outline-none text-sm placeholder-[#3a3a55]";
  const labelCls = "block text-xs font-medium text-[#606080] mb-1.5";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-0.5">Community</p>
        <h2 className="text-2xl font-bold text-[#e0e0f0]">Shared Vocabulary</h2>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="px-5 py-2.5 bg-[#C1392B] text-white rounded-xl text-sm font-semibold hover:bg-[#a62f24] transition-colors"
        >
          ➕ Add Vocabulary
        </button>
        <button
          onClick={loadVocabulary}
          className="px-5 py-2.5 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl text-sm hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#171720] border border-[#2a2a38] rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#e0e0f0] mb-4">Add New Vocabulary</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Entry Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className={inputCls}>
                  <option value="vocab">Vocabulary Word</option>
                  <option value="kanji">Kanji Character</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{formData.type === 'kanji' ? 'Kanji Character *' : 'Word (Kanji) *'}</label>
                <input type="text" name="word" value={formData.word} onChange={handleInputChange} className={inputCls} placeholder="例: 循環" required />
              </div>
              <div>
                <label className={labelCls}>Reading (Hiragana) *</label>
                <input type="text" name="reading" value={formData.reading} onChange={handleInputChange} className={inputCls} placeholder="例: じゅんかん" required />
              </div>
              <div>
                <label className={labelCls}>Meaning (English) *</label>
                <input type="text" name="meaning" value={formData.meaning} onChange={handleInputChange} className={inputCls} placeholder="例: circulation" required />
              </div>
              <div>
                <label className={labelCls}>Chapter Number *</label>
                <input type="number" name="chapter" value={formData.chapter} onChange={handleInputChange} min="1" max="999" className={inputCls} placeholder="例: 15" required />
              </div>
              <div>
                <label className={labelCls}>Related Kanji (optional)</label>
                <input type="text" value={formData.relatedKanji.join('')} onChange={handleRelatedKanjiChange} className={inputCls} placeholder="例: 循環" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="px-5 py-2 bg-[#C1392B] text-white rounded-xl text-sm font-semibold hover:bg-[#a62f24] transition-colors">Add</button>
              <button type="button" onClick={resetForm} className="px-5 py-2 bg-[#0F0F14] border border-[#2a2a38] text-[#606080] rounded-xl text-sm hover:text-[#e0e0f0] transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vocabulary List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C1392B] mx-auto mb-3" />
          <p className="text-[#606080] text-sm">Loading shared vocabulary…</p>
        </div>
      ) : (
        <div className="space-y-5">
          {getVocabularyByChapter().length === 0 ? (
            <div className="text-center py-16 bg-[#171720] border border-[#2a2a38] rounded-2xl">
              <p className="text-[#606080] mb-1">No shared vocabulary yet</p>
              <p className="text-[#3a3a55] text-sm">Click "Add Vocabulary" to contribute</p>
            </div>
          ) : (
            getVocabularyByChapter().map(({ chapter, items }) => (
              <div key={chapter}>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">
                  Chapter {chapter} <span className="normal-case tracking-normal">· {items.length} items</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => {
                    const isOwn = currentUser && item.addedBy === currentUser.id;
                    const contributorName = getContributorName(item);
                    const contributorAvatar = getContributorAvatar(item);
                    const initial = (contributorName[0] || '?').toUpperCase();
                    return (
                      <div key={item.docId} className="bg-[#171720] border border-[#2a2a38] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xl font-bold text-[#e0e0f0] noto">{item.word}</div>
                          {isOwn && (
                            <button onClick={() => handleDelete(item)} className="text-[#3a3a55] hover:text-[#C1392B] transition-colors ml-2 text-sm">🗑️</button>
                          )}
                        </div>
                        <div className="text-sm text-[#606080] reading-text mb-0.5">{item.reading}</div>
                        <div className="text-sm text-[#e0e0f0] mb-2">{item.meaning}</div>
                        {item.relatedKanji?.length > 0 && (
                          <div className="text-xs text-[#3a3a55] mb-2">Kanji: {item.relatedKanji.join(' · ')}</div>
                        )}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#1e1e2a]">
                          {contributorAvatar ? (
                            <img src={contributorAvatar} alt={contributorName} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#C1392B] flex items-center justify-center text-white text-[9px] font-bold">{initial}</div>
                          )}
                          <span className="text-xs text-[#3a3a55]">{contributorName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats */}
      {vocabulary.length > 0 && (
        <div className="mt-6 bg-[#171720] border border-[#2a2a38] rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Items', value: vocabulary.length, color: 'text-[#378ADD]' },
              { label: 'Chapters', value: getUniqueChapters().length, color: 'text-[#3CBFA5]' },
              { label: 'Contributors', value: new Set(vocabulary.map(v => v.addedBy)).size, color: 'text-[#8B82F0]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-[#606080] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

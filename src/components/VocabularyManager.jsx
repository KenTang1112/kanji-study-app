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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Shared Vocabulary</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            ➕ Add Vocabulary
          </button>
          <button
            onClick={loadVocabulary}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Add New Vocabulary</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vocab">Vocabulary Word</option>
                    <option value="kanji">Kanji Character</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'kanji' ? 'Kanji Character *' : 'Word (Kanji) *'}
                  </label>
                  <input
                    type="text" name="word" value={formData.word} onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 循環" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reading (Hiragana) *</label>
                  <input
                    type="text" name="reading" value={formData.reading} onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: じゅんかん" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meaning (English) *</label>
                  <input
                    type="text" name="meaning" value={formData.meaning} onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: circulation" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Number *</label>
                  <input
                    type="number" name="chapter" value={formData.chapter} onChange={handleInputChange}
                    min="1" max="999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 15" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Related Kanji (optional)</label>
                  <input
                    type="text" value={formData.relatedKanji.join('')} onChange={handleRelatedKanjiChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 循環"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
                  Add
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vocabulary List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3" />
            <p className="text-gray-500">Loading shared vocabulary…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {getVocabularyByChapter().length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-lg mb-2">No shared vocabulary yet</div>
                <div className="text-gray-400">Click "Add Vocabulary" to contribute to the shared pool</div>
              </div>
            ) : (
              getVocabularyByChapter().map(({ chapter, items }) => (
                <div key={chapter} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Chapter {chapter} <span className="text-gray-400 font-normal text-sm">({items.length} items)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => {
                      const isOwn = currentUser && item.addedBy === currentUser.id;
                      const contributorName = getContributorName(item);
                      const contributorAvatar = getContributorAvatar(item);
                      const initial = (contributorName[0] || '?').toUpperCase();

                      return (
                        <div key={item.docId} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xl font-bold text-gray-800 kanji-text">{item.word}</div>
                            {isOwn && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-400 hover:text-red-600 text-sm ml-2"
                                title="Delete (only you can delete your own entries)"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 reading-text mb-1">{item.reading}</div>
                          <div className="text-sm text-gray-700 mb-2">{item.meaning}</div>
                          {item.relatedKanji?.length > 0 && (
                            <div className="text-xs text-gray-500 mb-2">Kanji: {item.relatedKanji.join(' • ')}</div>
                          )}
                          {/* Contributor info */}
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                            {contributorAvatar ? (
                              <img src={contributorAvatar} alt={contributorName} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-300 flex items-center justify-center text-white text-xs font-bold">
                                {initial}
                              </div>
                            )}
                            <span className="text-xs text-gray-400">{contributorName}</span>
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
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{vocabulary.length}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{getUniqueChapters().length}</div>
                <div className="text-sm text-gray-600">Chapters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(vocabulary.map(v => v.addedBy)).size}
                </div>
                <div className="text-sm text-gray-600">Contributors</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

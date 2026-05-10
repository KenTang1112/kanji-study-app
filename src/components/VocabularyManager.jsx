import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export default function VocabularyManager({ onBack }) {
  const [vocabulary, setVocabulary] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    meaning: '',
    chapter: '',
    relatedKanji: []
  });

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = () => {
    const stored = localStorage.getItem('userVocabulary');
    const userVocab = stored ? JSON.parse(stored) : [];
    setVocabulary(userVocab);
  };

  const saveVocabulary = (newVocabulary) => {
    localStorage.setItem('userVocabulary', JSON.stringify(newVocabulary));
    setVocabulary(newVocabulary);
    dataService.refreshData(); // Refresh the data service with new vocabulary
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRelatedKanjiChange = (e) => {
    const input = e.target.value;
    // Group kanji characters (remove spaces and group unique kanji)
    const kanji = input.split('').filter(char => char.trim());
    setFormData(prev => ({
      ...prev,
      relatedKanji: kanji
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.word || !formData.reading || !formData.meaning || !formData.chapter) {
      alert('Please fill in all required fields');
      return;
    }

    const newVocab = {
      ...formData,
      chapter: parseInt(formData.chapter),
      id: Date.now() // Simple ID for tracking
    };

    let updatedVocabulary;
    if (editingItem) {
      updatedVocabulary = vocabulary.map(item => 
        item.id === editingItem.id ? newVocab : item
      );
    } else {
      updatedVocabulary = [...vocabulary, newVocab];
    }

    saveVocabulary(updatedVocabulary);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      word: '',
      reading: '',
      meaning: '',
      chapter: '',
      relatedKanji: []
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setFormData({
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      chapter: item.chapter.toString(),
      relatedKanji: item.relatedKanji || []
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this vocabulary item?')) {
      const updatedVocabulary = vocabulary.filter(item => item.id !== id);
      saveVocabulary(updatedVocabulary);
    }
  };

  const exportVocabulary = () => {
    const dataStr = JSON.stringify(vocabulary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_vocabulary.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importVocabulary = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedVocab = JSON.parse(event.target.result);
        const mergedVocabulary = [...vocabulary, ...importedVocab];
        saveVocabulary(mergedVocabulary);
        alert(`Successfully imported ${importedVocab.length} vocabulary items!`);
      } catch (error) {
        alert('Error importing file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const getUniqueChapters = () => {
    const chapters = [...new Set(vocabulary.map(item => item.chapter))];
    return chapters.sort((a, b) => a - b);
  };

  const getVocabularyByChapter = () => {
    const chapters = getUniqueChapters();
    return chapters.map(chapter => ({
      chapter,
      items: vocabulary.filter(item => item.chapter === chapter)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Manage Vocabulary</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            ➕ Add Vocabulary
          </button>
          <button
            onClick={exportVocabulary}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            📤 Export
          </button>
          <label className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold cursor-pointer">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={importVocabulary}
              className="hidden"
            />
          </label>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {editingItem ? 'Edit Vocabulary' : 'Add New Vocabulary'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word (Kanji) *
                  </label>
                  <input
                    type="text"
                    name="word"
                    value={formData.word}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 循環"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reading (Hiragana) *
                  </label>
                  <input
                    type="text"
                    name="reading"
                    value={formData.reading}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: じゅんかん"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meaning (English) *
                  </label>
                  <input
                    type="text"
                    name="meaning"
                    value={formData.meaning}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: circulation"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Number *
                  </label>
                  <input
                    type="number"
                    name="chapter"
                    value={formData.chapter}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 15"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Kanji (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.relatedKanji.join('')}
                    onChange={handleRelatedKanjiChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 循環 (enter kanji characters, will be auto-grouped)"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Enter individual kanji characters - they'll be automatically grouped
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vocabulary List */}
        <div className="space-y-6">
          {getVocabularyByChapter().length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No vocabulary added yet</div>
              <div className="text-gray-400">Click "Add Vocabulary" to get started</div>
            </div>
          ) : (
            getVocabularyByChapter().map(({ chapter, items }) => (
              <div key={chapter} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Chapter {chapter} ({items.length} items)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xl font-bold text-gray-800 kanji-text">
                          {item.word}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 reading-text mb-1">
                        {item.reading}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {item.meaning}
                      </div>
                      {item.relatedKanji && item.relatedKanji.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Kanji: {item.relatedKanji.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}
        {vocabulary.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {vocabulary.filter(item => item.relatedKanji && item.relatedKanji.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">With Kanji</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.max(...getUniqueChapters(), 0)}
                </div>
                <div className="text-sm text-gray-600">Highest Chapter</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

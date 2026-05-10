import { useState, useEffect } from 'react';

export default function FlaggedItemsManager({ onBack }) {
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlaggedItems();
  }, []);

  const loadFlaggedItems = () => {
    const stored = localStorage.getItem('flaggedItems');
    const items = stored ? JSON.parse(stored) : [];
    setFlaggedItems(items);
    setIsLoading(false);
  };

  const filterItems = (items) => {
    if (filter === 'all') return items;
    return items.filter(item => item.reason === filter);
  };

  const clearAllFlags = () => {
    if (confirm('Are you sure you want to clear all flagged items? This cannot be undone.')) {
      localStorage.removeItem('flaggedItems');
      setFlaggedItems([]);
    }
  };

  const exportFlaggedItems = () => {
    const dataStr = JSON.stringify(flaggedItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flagged-items-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteFlag = (id) => {
    if (confirm('Delete this flagged item?')) {
      const updated = flaggedItems.filter(item => item.id !== id);
      setFlaggedItems(updated);
      localStorage.setItem('flaggedItems', JSON.stringify(updated));
    }
  };

  const getReasonStats = () => {
    const stats = {};
    flaggedItems.forEach(item => {
      stats[item.reason] = (stats[item.reason] || 0) + 1;
    });
    return stats;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getReasonLabel = (reason) => {
    const labels = {
      'wrong-reading': 'Incorrect Reading',
      'wrong-meaning': 'Incorrect Meaning',
      'wrong-kanji': 'Incorrect Kanji',
      'typo': 'Typo or Error',
      'outdated': 'Outdated Information',
      'other': 'Other Issue'
    };
    return labels[reason] || reason;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading flagged items...</div>
      </div>
    );
  }

  const filteredItems = filterItems(flaggedItems);
  const stats = getReasonStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Flagged Items Management</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(stats).map(([reason, count]) => (
              <div key={reason} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{getReasonLabel(reason)}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({flaggedItems.length})
              </button>
              {Object.keys(stats).map(reason => (
                <button
                  key={reason}
                  onClick={() => setFilter(reason)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === reason 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getReasonLabel(reason)} ({stats[reason]})
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportFlaggedItems}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                📥 Export
              </button>
              <button
                onClick={clearAllFlags}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Flagged Items List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg">No flagged items found</div>
              <div className="text-gray-400 mt-2">
                {filter === 'all' 
                  ? 'Users have not flagged any items yet.'
                  : `No items with reason: ${getReasonLabel(filter)}`
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-800">
                          {item.word}
                        </span>
                        <span className="text-gray-600">({item.reading})</span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          {getReasonLabel(item.reason)}
                        </span>
                      </div>
                      <div className="text-gray-600 mb-1">{item.meaning}</div>
                      <div className="text-sm text-gray-500">
                        Mode: {item.mode} | Chapter: {item.chapter} | 
                        Flagged: {formatDate(item.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFlag(item.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

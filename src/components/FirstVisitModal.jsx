import { useState } from 'react';
import { userService } from '../services/userService';

export default function FirstVisitModal({ onComplete }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const userId = userService.getCurrentUserId();
    const user = await userService.createUser({ userId, displayName: name.trim(), isGuest: false });
    onComplete(user);
  };

  const handleGuest = async () => {
    setLoading(true);
    const userId = userService.getCurrentUserId();
    const user = await userService.createUser({ userId, displayName: 'Guest', isGuest: true });
    onComplete(user);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">漢字</div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
          <p className="text-gray-500 mt-1 text-sm">Set a nickname so friends know who added what.</p>
        </div>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && handleSave()}
          placeholder="Your nickname"
          maxLength={30}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-center text-lg mb-4"
          autoFocus
        />

        <button
          onClick={handleSave}
          disabled={!name.trim() || loading}
          className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>

        <button
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

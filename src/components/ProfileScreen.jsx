import { useState } from 'react';
import { userService } from '../services/userService';

export default function ProfileScreen({ currentUser, onUserUpdate, onBack }) {
  const [name, setName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUseUrl = () => {
    if (!urlInput.trim()) return;
    setAvatarUrl(urlInput.trim());
    setUrlInput('');
    showMessage('Photo set!');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updates = { displayName: name.trim(), avatarUrl: avatarUrl || null, isGuest: false };
      await userService.updateUser(currentUser.id, updates);
      onUserUpdate({ ...currentUser, ...updates });
      showMessage('Profile saved!');
    } catch {
      showMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (currentUser?.displayName || '?')[0].toUpperCase();

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
        </div>

        {message && (
          <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-indigo-100">
                {initial}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2 w-full max-w-xs">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUseUrl()}
              placeholder="Paste image URL"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none text-sm"
            />
            <button
              onClick={handleUseUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Set
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Upload to imgur.com and paste the link</p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            placeholder="Your name"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

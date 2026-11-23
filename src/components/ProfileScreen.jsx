import { useState } from 'react';
import { userService } from '../services/userService';

export default function ProfileScreen({ currentUser, onUserUpdate, onSignOut, onBack }) {
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

  const handleSignOut = async () => {
    if (!confirm('Sign out?')) return;
    await userService.signOut();
    onSignOut();
  };

  const initial = (currentUser?.displayName || '?')[0].toUpperCase();

  return (
    <div className="max-w-lg mx-auto py-4">
      <div className="bg-[#131A2A] border border-[#232C42] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="flex items-center text-[#C5CBDB] hover:text-[#E8EBF4]">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="font-display text-2xl font-bold text-[#E8EBF4]">Your profile</h2>
        </div>

        {message && (
          <div className="mb-4 px-4 py-2 bg-[#14271f] text-[#34C38F] border border-[#2f6b52] rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[#232C42]" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#232C42] flex items-center justify-center text-white text-3xl font-bold border-4 border-[#232C42]">
                {initial}
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUseUrl()}
              placeholder="Paste image URL"
              className="flex-1 px-3 py-2 border border-[#232C42] rounded-lg bg-[#0B0E17] text-[#E8EBF4] placeholder-[#5A6482] focus:border-[#F2B544] focus:outline-none text-sm"
            />
            <button
              onClick={handleUseUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-2 bg-[#1A2234] text-[#E8EBF4] rounded-lg hover:bg-[#232C42] transition-colors text-sm font-medium disabled:opacity-50"
            >
              Set
            </button>
          </div>
          <p className="text-xs text-[#7681A0] mt-1">Optional: paste a link to any image to use it as your picture</p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#C5CBDB] mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            className="w-full px-4 py-3 border-2 border-[#232C42] rounded-xl bg-[#0B0E17] text-[#E8EBF4] placeholder-[#5A6482] focus:border-[#F2B544] focus:outline-none"
            placeholder="Your name"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 bg-[#F2B544] text-[#0B0E17] rounded-xl font-semibold hover:bg-[#F5C566] transition-colors disabled:opacity-50 mb-4"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-[#1A2234] text-[#C5CBDB] rounded-xl font-semibold hover:bg-[#1E2638] transition-colors"
        >
          Sign out
        </button>

        {currentUser?.isGuest && (
          <p className="text-xs text-center text-[#7681A0] mt-3">
            You're a guest, so progress stays on this device. Sign out, then sign in with Google to keep it on every device.
          </p>
        )}
      </div>
    </div>
  );
}

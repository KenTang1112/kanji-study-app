import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import ChapterSelection from './components/ChapterSelection';
import WordSelection from './components/WordSelection';
import QuizEngine from './components/QuizEngine';
import VocabularyManager from './components/VocabularyManager';
import FlaggedItemsManager from './components/FlaggedItemsManager';
import PracticeTest from './components/PracticeTest';
import ProgressScreen from './components/ProgressScreen';
import ProfileScreen from './components/ProfileScreen';
import FirstVisitModal from './components/FirstVisitModal';
import ErrorBoundary from './components/ErrorBoundary';
import { userService } from './services/userService';
import dataService from './services/dataService';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Load shared vocab once on mount (independent of auth)
    dataService.loadSharedVocab().catch(console.error);

    // Listen for Firebase Auth state — fires immediately on load
    const unsubscribe = userService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await userService.getUser(firebaseUser.uid);
          setCurrentUser(profile || {
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            avatarUrl: firebaseUser.photoURL || null,
            isGuest: firebaseUser.isAnonymous,
          });
          setNeedsProfileSetup(false);
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      } else {
        setCurrentUser(null);
        setNeedsProfileSetup(true);
      }
      setAppReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleProfileSetupComplete = (user) => {
    setCurrentUser(user);
    setNeedsProfileSetup(false);
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setNeedsProfileSetup(true);
    setCurrentScreen('home');
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setCurrentScreen('chapters');
  };

  const handleChaptersSelect = (chapters) => {
    setSelectedChapters(chapters);
    setCurrentScreen('word-selection');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedMode(null);
    setSelectedChapters([]);
  };

  const handleBackToChapters = () => {
    setCurrentScreen('chapters');
  };

  const handleWordSelection = (words) => {
    setSelectedWords(words);
    setCurrentScreen('quiz');
  };

  const handleBackToWordSelection = () => {
    setCurrentScreen('word-selection');
  };

  const handleManageVocabulary = () => {
    setCurrentScreen('vocabulary-manager');
  };

  const handleFlaggedItems = () => {
    setCurrentScreen('flagged-items');
  };

  const handlePracticeTest = () => {
    setCurrentScreen('practice-test');
  };

  const handleProgress = () => {
    setCurrentScreen('progress');
  };

  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const bottomNavScreens = ['home', 'vocabulary-manager', 'progress', 'profile', 'flagged-items'];
  const showBottomNav = bottomNavScreens.includes(currentScreen);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C1392B] mx-auto mb-4" />
          <p className="text-[#606080] text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F14]">
      {needsProfileSetup && (
        <FirstVisitModal onComplete={handleProfileSetupComplete} />
      )}

      <div className={`container mx-auto px-4 max-w-4xl ${showBottomNav ? 'pb-20 lg:pb-6 pt-6' : 'py-6'}`}>
        {currentScreen === 'home' && (
          <HomeScreen
            onModeSelect={handleModeSelect}
            onManageVocabulary={handleManageVocabulary}
            onManageFlaggedItems={handleFlaggedItems}
            onPracticeTest={handlePracticeTest}
            onProgress={handleProgress}
            onNavigateToProfile={handleNavigateToProfile}
            currentUser={currentUser}
          />
        )}

        {currentScreen === 'chapters' && (
          <ChapterSelection
            selectedMode={selectedMode}
            onChaptersSelect={handleChaptersSelect}
            onBack={handleBackToHome}
          />
        )}

        {currentScreen === 'word-selection' && (
          <WordSelection
            mode={selectedMode}
            selectedChapters={selectedChapters}
            onBack={handleBackToChapters}
            onStartQuiz={handleWordSelection}
          />
        )}

        {currentScreen === 'practice-test' && (
          <PracticeTest onBack={handleBackToHome} />
        )}

        {currentScreen === 'quiz' && (
          <ErrorBoundary>
            <QuizEngine
              mode={selectedMode}
              chapters={selectedChapters}
              selectedWords={selectedWords}
              onBackToHome={handleBackToHome}
              onBackToChapters={handleBackToChapters}
              onBackToWordSelection={handleBackToWordSelection}
            />
          </ErrorBoundary>
        )}

        {currentScreen === 'vocabulary-manager' && (
          <VocabularyManager onBack={handleBackToHome} currentUser={currentUser} />
        )}

        {currentScreen === 'flagged-items' && (
          <FlaggedItemsManager onBack={handleBackToHome} />
        )}

        {currentScreen === 'progress' && (
          <ProgressScreen onBack={handleBackToHome} />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            onSignOut={handleSignOut}
            onBack={handleBackToHome}
          />
        )}
      </div>

      {/* Bottom Navigation — phone and tablet only */}
      {showBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F0F14] border-t border-[#1e1e2a] flex z-40 pb-safe">
          {[
            { screen: 'home', icon: '🏠', label: 'Home' },
            { screen: 'vocabulary-manager', icon: '📚', label: 'Vocab' },
            { screen: 'progress', icon: '📊', label: 'Progress' },
            { screen: 'profile', icon: '👤', label: 'Profile' },
          ].map(({ screen, icon, label }) => (
            <button
              key={screen}
              onClick={() => setCurrentScreen(screen)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                currentScreen === screen ? 'text-[#C1392B]' : 'text-[#3a3a55] hover:text-[#606080]'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
              {currentScreen === screen && (
                <span className="w-1 h-1 rounded-full bg-[#C1392B]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

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

  if (!appReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {needsProfileSetup && (
        <FirstVisitModal onComplete={handleProfileSetupComplete} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
    </div>
  );
}

export default App;

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
import HubScreen from './components/HubScreen';
import ClassScreen from './components/ClassScreen';
import ClassTest from './components/ClassTest';
import { CLASSES, drawCombined, buildCombined, picksKey } from './tests';
import { testProgressService } from './services/testProgressService';
import { userService } from './services/userService';
import dataService from './services/dataService';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('hub');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [testProgress, setTestProgress] = useState(() => testProgressService.loadAll(null));
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Load shared vocab once on mount (independent of auth)
    dataService.loadSharedVocab().catch(console.error);

    // Finish a Google sign-in that fell back to a full-page redirect (phones that block popups).
    userService.finishRedirectSignIn().catch((err) => console.error('Redirect sign-in failed:', err));

    // Listen for Firebase Auth state — fires immediately on load
    const unsubscribe = userService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await userService.getUser(firebaseUser.uid);
          setTestProgress(testProgressService.loadAll(profile));
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
    setCurrentScreen('hub');
  };

  const handleOpenClass = (classId) => {
    setSelectedClassId(classId);
    setCurrentScreen('class');
  };

  const handleSaveTest = (testId, state) => {
    setTestProgress((prev) => ({ ...prev, [testId]: state }));
    testProgressService.save(currentUser, testId, state);
  };

  const selectedClass = CLASSES.find((c) => c.id === selectedClassId);
  const combinedCfg = selectedClass?.combined;
  const isCombined = combinedCfg && selectedTestId === combinedCfg.id;
  const combinedPicks = combinedCfg ? testProgress[picksKey(combinedCfg.id)] : null;

  // A fresh random draw for the combined midterm; answers from the old draw are cleared.
  const redrawCombined = (cls) => {
    const picks = { refs: drawCombined(cls), drawnAt: Date.now() };
    handleSaveTest(picksKey(cls.combined.id), picks);
    handleSaveTest(cls.combined.id, null);
  };

  const handleOpenTest = (testId) => {
    if (selectedClass?.combined?.id === testId && !testProgress[picksKey(testId)]?.refs) redrawCombined(selectedClass);
    setSelectedTestId(testId);
    setCurrentScreen('class-test');
  };

  const selectedTest = isCombined
    ? (combinedPicks?.refs ? buildCombined(selectedClass, combinedPicks.refs) : null)
    : selectedClass?.tests.find((t) => t.id === selectedTestId);

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

  const bottomNavScreens = ['hub', 'class', 'home', 'vocabulary-manager', 'progress', 'profile', 'flagged-items'];
  const showBottomNav = bottomNavScreens.includes(currentScreen);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-[#0B0E17] flex items-center justify-center">
        <div className="text-center">
          <div className="moon mx-auto mb-4 animate-pulse" />
          <p className="text-[#7681A0] text-base">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E17]">
      {needsProfileSetup && (
        <FirstVisitModal onComplete={handleProfileSetupComplete} />
      )}

      <div className={`container mx-auto px-4 max-w-4xl ${showBottomNav ? 'pb-20 lg:pb-6 pt-6' : 'py-6'}`}>
        {currentScreen === 'hub' && (
          <HubScreen
            onOpenKanji={() => setCurrentScreen('home')}
            onOpenClass={handleOpenClass}
            onNavigateToProfile={handleNavigateToProfile}
            currentUser={currentUser}
            progress={testProgress}
          />
        )}

        {currentScreen === 'class' && selectedClass && (
          <ClassScreen
            classInfo={selectedClass}
            progress={testProgress}
            onOpenTest={handleOpenTest}
            onBack={() => setCurrentScreen('hub')}
          />
        )}

        {currentScreen === 'class-test' && selectedClass && selectedTest && (
          <ErrorBoundary>
            <ClassTest
              key={`${selectedTest.id}:${isCombined ? combinedPicks?.drawnAt : ''}`}
              test={selectedTest}
              classInfo={selectedClass}
              savedState={testProgress[selectedTest.id]}
              onSave={(state) => handleSaveTest(selectedTest.id, state)}
              onRedraw={isCombined ? () => redrawCombined(selectedClass) : undefined}
              onBack={() => setCurrentScreen('class')}
            />
          </ErrorBoundary>
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onBackToHub={() => setCurrentScreen('hub')}
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
            onBack={() => setCurrentScreen('hub')}
          />
        )}
      </div>

      {/* Bottom Navigation — phone and tablet only */}
      {showBottomNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-[#1A2234] flex z-40 pb-safe">
          {[
            { screen: 'hub', group: ['hub', 'class'], label: 'Classes', path: 'M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
            { screen: 'home', group: ['home', 'vocabulary-manager', 'progress', 'flagged-items', 'chapters', 'word-selection', 'practice-test'], label: 'Kanji', glyph: '漢' },
            { screen: 'profile', group: ['profile'], label: 'Profile', path: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0' },
          ].map(({ screen, group, label, path, glyph }) => {
            const active = group.includes(currentScreen);
            return (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold tracking-wide transition-colors ${
                  active ? 'text-[#F2B544]' : 'text-[#5A6482] hover:text-[#9AA3BD]'
                }`}
              >
                {glyph ? (
                  <span className="noto text-[19px] leading-[22px] font-bold" aria-hidden="true">{glyph}</span>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={path} />
                  </svg>
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default App;

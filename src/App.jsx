import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ChapterSelection from './components/ChapterSelection';
import WordSelection from './components/WordSelection';
import QuizEngine from './components/QuizEngine';
import VocabularyManager from './components/VocabularyManager';
import FlaggedItemsManager from './components/FlaggedItemsManager';
import PracticeTest from './components/PracticeTest';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);

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

  const handlePracticeTest = () => { setCurrentScreen('practice-test'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentScreen === 'home' && (
          <HomeScreen onModeSelect={handleModeSelect} onManageVocabulary={handleManageVocabulary} onManageFlaggedItems={handleFlaggedItems} onPracticeTest={handlePracticeTest} />
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
          <VocabularyManager onBack={handleBackToHome} />
        )}
        
        {currentScreen === 'flagged-items' && (
          <FlaggedItemsManager onBack={handleBackToHome} />
        )}
      </div>
    </div>
  );
}

export default App;

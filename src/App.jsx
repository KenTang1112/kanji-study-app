import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ChapterSelection from './components/ChapterSelection';
import QuizEngine from './components/QuizEngine';
import VocabularyManager from './components/VocabularyManager';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setCurrentScreen('chapters');
  };

  const handleChaptersSelect = (chapters) => {
    setSelectedChapters(chapters);
    setCurrentScreen('quiz');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedMode(null);
    setSelectedChapters([]);
  };

  const handleBackToChapters = () => {
    setCurrentScreen('chapters');
  };

  const handleManageVocabulary = () => {
    setCurrentScreen('vocabulary-manager');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentScreen === 'home' && (
          <HomeScreen onModeSelect={handleModeSelect} onManageVocabulary={handleManageVocabulary} />
        )}
        
        {currentScreen === 'chapters' && (
          <ChapterSelection
            selectedMode={selectedMode}
            onChaptersSelect={handleChaptersSelect}
            onBack={handleBackToHome}
          />
        )}
        
        {currentScreen === 'quiz' && (
          <ErrorBoundary>
            <QuizEngine
              mode={selectedMode}
              chapters={selectedChapters}
              onBackToHome={handleBackToHome}
              onBackToChapters={handleBackToChapters}
            />
          </ErrorBoundary>
        )}
        
        {currentScreen === 'vocabulary-manager' && (
          <VocabularyManager onBack={handleBackToHome} />
        )}
      </div>
    </div>
  );
}

export default App;

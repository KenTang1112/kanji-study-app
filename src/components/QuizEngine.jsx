import { useState, useEffect, useRef } from 'react';
import dataService from '../services/dataService';
import HandwritingCanvas from './HandwritingCanvas';
import DictionarySection from './DictionarySection';

export default function QuizEngine({ mode, chapters, selectedWords, onBackToHome, onBackToChapters, onBackToWordSelection }) {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintType, setHintType] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [handwritingImage, setHandwritingImage] = useState('');
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    easy: 0,
    hard: 0
  });
  const [wrongCards, setWrongCards] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const handwritingRef = useRef(null);

  useEffect(() => {
    initializeSession();
  }, [mode, selectedWords]);

  const initializeSession = () => {
    try {
      // Validate inputs
      if (!mode || !selectedWords || !Array.isArray(selectedWords) || selectedWords.length === 0) {
        console.error('Invalid mode or selectedWords:', { mode, selectedWords });
        return;
      }

      // Convert selectedWords to quiz data format
      const quizData = dataService.convertWordsToQuizData(selectedWords, mode);
      
      // Validate quiz data
      if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
        console.error('No quiz data available for mode:', mode, 'selectedWords:', selectedWords);
        return;
      }

      const shuffledCards = dataService.shuffleArray(quizData);
      
      setCards(shuffledCards);
      setCurrentQuestion(shuffledCards[0]);
      setSessionStats(prev => ({ ...prev, total: shuffledCards.length }));
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const handleShowHint = (type) => {
    setHintType(type);
    setShowHint(true);
  };

  const handleRevealAnswer = () => {
    // Capture handwriting image before disabling canvas
    if (handwritingRef.current && needsHandwriting) {
      const imageData = handwritingRef.current.getImageData();
      setHandwritingImage(imageData);
    }
    
    setShowAnswer(true);
    if (handwritingRef.current) {
      handwritingRef.current.disableCanvas();
    }
  };

  const handleGrade = (grade) => {
    const isCorrect = grade !== 'wrong';
    const word = mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji;

    // Update weak card score
    dataService.updateWeakCardScores(
      isCorrect ? [word] : [],
      !isCorrect ? [word] : []
    );

    // Compute final stats synchronously so we can persist them if session ends
    const finalStats = {
      ...sessionStats,
      correct: isCorrect ? sessionStats.correct + 1 : sessionStats.correct,
      wrong: !isCorrect ? sessionStats.wrong + 1 : sessionStats.wrong,
      easy: grade === 'easy' ? sessionStats.easy + 1 : sessionStats.easy,
      hard: grade === 'hard' ? sessionStats.hard + 1 : sessionStats.hard,
    };
    setSessionStats(finalStats);

    // Handle wrong cards for retry
    if (!isCorrect) {
      setWrongCards(prev => [...prev, currentQuestion]);
    }

    // Move to next card
    moveToNextCard(finalStats);
  };

  const handleFlagItem = () => {
    setShowFlagModal(true);
    setFlagReason('');
  };

  const handleFlagSubmit = () => {
    if (!flagReason.trim()) {
      alert('Please select a reason for flagging this item');
      return;
    }

    const itemToFlag = {
      word: mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji,
      reading: currentQuestion.reading,
      meaning: currentQuestion.meaning,
      chapter: currentQuestion.chapter,
      mode: mode,
      reason: flagReason,
      timestamp: new Date().toISOString(),
      id: `${mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji}-${mode}-${Date.now()}`
    };

    // Get existing flagged items
    const stored = localStorage.getItem('flaggedItems');
    const flaggedItems = stored ? JSON.parse(stored) : [];
    
    // Add new flagged item
    flaggedItems.push(itemToFlag);
    localStorage.setItem('flaggedItems', JSON.stringify(flaggedItems));

    // Close modal and show confirmation
    setShowFlagModal(false);
    setFlagReason('');
    alert('Item has been flagged for review. Thank you for helping improve the quality!');
  };

  const moveToNextCard = (latestStats = sessionStats) => {
    // Reset state for next card
    setShowAnswer(false);
    setShowHint(false);
    setHintType(null);
    setUserAnswer('');
    setHandwritingImage('');
    if (handwritingRef.current) {
      handwritingRef.current.clearCanvas();
      handwritingRef.current.enableCanvas();
    }

    // Check if we need to insert wrong cards
    if (currentCardIndex < cards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setCurrentQuestion(cards[nextIndex]);
    } else if (wrongCards.length > 0) {
      // Start reviewing wrong cards
      const nextWrongCard = wrongCards[0];
      setWrongCards(prev => prev.slice(1));
      setCurrentQuestion(nextWrongCard);
    } else {
      // Session complete — persist result
      dataService.saveSessionResult({
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode,
        chapters,
        total: latestStats.total,
        correct: latestStats.correct,
        wrong: latestStats.wrong,
        easy: latestStats.easy,
        hard: latestStats.hard,
        accuracy: latestStats.total > 0 ? Math.round((latestStats.correct / latestStats.total) * 100) : 0,
      });
      dataService.saveChapterStats(chapters, latestStats);
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    initializeSession();
    setCurrentCardIndex(0);
    setSessionComplete(false);
    setWrongCards([]);
    setShowAnswer(false);
    setShowHint(false);
    setHintType(null);
    setUserAnswer('');
  };

  const getQuestionText = () => {
    if (!currentQuestion) return 'Loading...';
    
    try {
      switch (mode) {
        case 'kana-to-kanji':
          return currentQuestion.question || 'No question available';
        case 'kanji-to-reading':
          return currentQuestion.question || 'No question available';
        case 'vocabulary-writing':
          return currentQuestion.question || 'No question available';
        case 'vocabulary-reading':
          return currentQuestion.question || 'No question available';
        default:
          return currentQuestion.question || 'No question available';
      }
    } catch (error) {
      console.error('Error getting question text:', error);
      return 'Error loading question';
    }
  };

  const getAnswerText = () => {
    if (!currentQuestion) return 'No answer available';
    
    try {
      switch (mode) {
        case 'kana-to-kanji':
          return currentQuestion.answer || 'No answer available';
        case 'kanji-to-reading':
          return currentQuestion.answer || 'No answer available';
        case 'vocabulary-writing':
          return currentQuestion.answer || 'No answer available';
        case 'vocabulary-reading':
          return currentQuestion.answer || 'No answer available';
        default:
          return currentQuestion.answer || 'No answer available';
      }
    } catch (error) {
      console.error('Error getting answer text:', error);
      return 'Error loading answer';
    }
  };

  const getProgressPercentage = () => {
    const total = sessionStats.total;
    const completed = sessionStats.correct + sessionStats.wrong;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // Loading state
  if (!currentQuestion && cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Quiz...</h2>
            <p className="text-gray-600">Preparing your questions</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no data available
  if (cards.length === 0 && currentQuestion === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Quiz Data Available</h2>
            <p className="text-gray-600 mb-4">
              No questions found for the selected mode and chapters.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Mode: {mode}
              </p>
              <p className="text-sm text-gray-500">
                Chapters: {chapters ? chapters.join(', ') : 'None selected'}
              </p>
            </div>
            <button
              onClick={onBackToChapters}
              className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              Back to Chapter Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Session Complete! 🎉
          </h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{sessionStats.wrong}</div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{sessionStats.easy}</div>
                <div className="text-sm text-gray-600">Easy</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{sessionStats.hard}</div>
                <div className="text-sm text-gray-600">Hard</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold text-gray-700">
                Accuracy: {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Study Again
            </button>
            <button
              onClick={onBackToWordSelection}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Change Words
            </button>
            <button
              onClick={onBackToChapters}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Change Chapters
            </button>
            <button
              onClick={onBackToHome}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const needsHandwriting = mode === 'kana-to-kanji' || mode === 'vocabulary-writing';
const showKanji = mode === 'self-uploading';

  // Additional safety check
  if (!currentQuestion || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Quiz Data Error</h2>
            <p className="text-gray-600 mb-4">
              Unable to load quiz questions. Please try again.
            </p>
            <button
              onClick={onBackToChapters}
              className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              Back to Chapter Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {sessionStats.correct + sessionStats.wrong} / {sessionStats.total}</span>
          <span>Accuracy: {sessionStats.total > 0 ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong || 1)) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBackToChapters}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit Session
          </button>
          <div className="text-sm text-gray-500">
            Card {currentCardIndex + 1} of {cards.length}
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <div className="text-lg text-gray-600 mb-4">Question:</div>
          <div className="text-4xl font-bold text-gray-800 kanji-text">
            {getQuestionText()}
            {showKanji && currentQuestion.kanji && (
              <div className="mt-4 text-6xl font-bold text-indigo-600 kanji-text">
                {currentQuestion.kanji}
              </div>
            )}
          </div>
        </div>

        {/* Hint Section */}
        {!showAnswer && (
          <div className="mb-6">
            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={() => handleShowHint('meaning')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Show Meaning
              </button>
              <button
                onClick={() => handleShowHint('kanji')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                {mode === 'kana-to-kanji' ? 'Show Related Vocabularies' : 'Show Related Kanji'}
              </button>
            </div>

            {showHint && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                {hintType === 'meaning' && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Meaning:</div>
                    <div className="text-xl font-semibold text-gray-800">
                      {currentQuestion?.meaning || 'No meaning available'}
                    </div>
                  </div>
                )}
                {hintType === 'kanji' && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      {mode.includes('vocabulary') ? 'Related Vocabulary (Hiragana):' : 
                       mode === 'kana-to-kanji' ? 'Related Vocabulary (Hiragana):' : 'Example Vocabulary:'}
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {mode.includes('vocabulary') 
                        ? (currentQuestion?.relatedKanji || []).join(' • ') || 'No related vocabulary'
                        : mode === 'kana-to-kanji' 
                          ? (currentQuestion?.relatedVocabulary || []).join(' • ') || 'No related vocabulary'
                          : (currentQuestion?.vocabulary || []).join(' • ') || 'No example vocabulary'
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Answer Input Area */}
        <div className="mb-6">
          {!showAnswer ? (
            <div className="text-center">
              {showKanji ? (
                <div>
                  <div className="text-lg text-gray-600 mb-4">This is a self-uploading card</div>
                  <div className="text-2xl text-gray-700 mb-4">Just study the kanji and reading below</div>
                </div>
              ) : needsHandwriting ? (
                <div>
                  <div className="text-lg text-gray-600 mb-4">Write your answer:</div>
                  <HandwritingCanvas ref={handwritingRef} />
                </div>
              ) : (
                <div>
                  <div className="text-lg text-gray-600 mb-4">Type your answer:</div>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full max-w-md mx-auto block px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your answer..."
                    autoFocus
                  />
                </div>
              )}
              
              <button
                onClick={handleRevealAnswer}
                className="mt-6 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold"
              >
                Reveal Answer
              </button>
            </div>
          ) : (
            <div className="text-center">
              {/* User Answer Display */}
              <div className="mb-6">
                <div className="text-lg text-gray-600 mb-2">Your Answer:</div>
                <div className="text-2xl font-semibold text-blue-600 mb-4">
                  {showKanji ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Kanji: </span>
                        <span className="text-2xl font-bold text-indigo-600 kanji-text">
                          {currentQuestion.word}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reading: </span>
                        <span className="text-xl">{currentQuestion.reading}</span>
                      </div>
                    </div>
                  ) : needsHandwriting ? (
                    handwritingImage ? (
                      <img 
                        src={handwritingImage} 
                        alt="Your handwritten answer"
                        className="max-w-xs mx-auto border border-gray-300 rounded-lg shadow-sm"
                        style={{ maxHeight: '150px' }}
                      />
                    ) : '(No drawing)'
                  ) : (userAnswer || '(No answer entered)')}
                </div>
              </div>

              {/* Correct Answer Display */}
              <div className="mb-6">
                <div className="text-lg text-gray-600 mb-2">Correct Answer:</div>
                <div className="text-3xl font-bold text-green-600 kanji-text mb-2">
                  {getAnswerText()}
                </div>
                {mode !== 'vocabulary-reading' && (
                  <div className="text-xl text-gray-700 reading-text">
                    {currentQuestion?.reading || 'No reading available'}
                  </div>
                )}
              </div>

              {/* Dictionary Section */}
              <DictionarySection 
                word={mode.includes('vocabulary') ? currentQuestion?.word || currentQuestion?.answer || 'Unknown' : currentQuestion?.kanji || currentQuestion?.answer || 'Unknown'} 
                reading={currentQuestion?.reading || 'No reading'} 
                meaning={currentQuestion?.meaning || 'No meaning'} 
              />

              {/* Grading Buttons */}
              <div className="mt-8">
                <div className="text-lg text-gray-600 mb-4">How was this card?</div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleGrade('easy')}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => handleGrade('hard')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => handleGrade('wrong')}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    Wrong
                  </button>
                </div>
                
                {/* Flag Button */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => handleFlagItem()}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    🚩 Flag as Incorrect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    {/* Flag Confirmation Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Flag as Incorrect</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Item: {mode.includes('vocabulary') ? currentQuestion?.word : currentQuestion?.kanji}
              </p>
              <p className="text-sm text-gray-600">
                Reading: {currentQuestion?.reading}
              </p>
              <p className="text-sm text-gray-600">
                Meaning: {currentQuestion?.meaning}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for flagging:
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a reason...</option>
                <option value="wrong-reading">Incorrect reading</option>
                <option value="wrong-meaning">Incorrect meaning</option>
                <option value="wrong-kanji">Incorrect kanji</option>
                <option value="typo">Typo or error</option>
                <option value="outdated">Outdated information</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagSubmit}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Flag Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

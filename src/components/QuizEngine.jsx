import { useState, useEffect, useRef } from 'react';
import dataService from '../services/dataService';
import HandwritingCanvas from './HandwritingCanvas';
import DictionarySection from './DictionarySection';

export default function QuizEngine({ mode, chapters, onBackToHome, onBackToChapters }) {
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
  const handwritingRef = useRef(null);

  useEffect(() => {
    initializeSession();
  }, [mode, chapters]);

  const initializeSession = () => {
    const sessionCards = dataService.generateSession(chapters);
    const quizData = dataService.getDataForMode(mode, chapters);
    const shuffledCards = dataService.shuffleArray(quizData).slice(0, sessionCards.length);
    
    setCards(shuffledCards);
    setCurrentQuestion(shuffledCards[0]);
    setSessionStats(prev => ({ ...prev, total: shuffledCards.length }));
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
    const word = currentQuestion.word;
    
    // Update weak card score
    dataService.updateWeakCardScore(word, isCorrect);
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      wrong: !isCorrect ? prev.wrong + 1 : prev.wrong,
      easy: grade === 'easy' ? prev.easy + 1 : prev.easy,
      hard: grade === 'hard' ? prev.hard + 1 : prev.hard
    }));

    // Handle wrong cards for retry
    if (!isCorrect) {
      setWrongCards(prev => [...prev, currentQuestion]);
    }

    // Move to next card
    moveToNextCard();
  };

  const moveToNextCard = () => {
    // Reset state for next card
    setShowAnswer(false);
    setShowHint(false);
    setHintType(null);
    setUserAnswer('');
    setHandwritingImage(''); // Reset handwriting image
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
      // Session complete
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
    if (!currentQuestion) return '';
    
    switch (mode) {
      case 'kana-to-kanji':
        return currentQuestion.question;
      case 'kanji-to-reading':
        return currentQuestion.question;
      case 'vocabulary-writing':
        return currentQuestion.meaning;
      case 'vocabulary-reading':
        return currentQuestion.question;
      default:
        return currentQuestion.question;
    }
  };

  const getAnswerText = () => {
    if (!currentQuestion) return '';
    
    switch (mode) {
      case 'kana-to-kanji':
        return currentQuestion.answer;
      case 'kanji-to-reading':
        return currentQuestion.answer;
      case 'vocabulary-writing':
        return currentQuestion.answer;
      case 'vocabulary-reading':
        return currentQuestion.answer;
      default:
        return currentQuestion.answer;
    }
  };

  const getProgressPercentage = () => {
    const total = sessionStats.total;
    const completed = sessionStats.correct + sessionStats.wrong;
    return total > 0 ? (completed / total) * 100 : 0;
  };

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

  const needsHandwriting = mode === 'kana-to-kanji' || mode === 'vocabulary-writing' || mode === 'vocabulary-full';
const needsBothInputs = mode === 'vocabulary-full';
const showKanji = mode === 'self-uploading';

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
            {showKanji && currentQuestion.word && (
              <div className="mt-4 text-6xl font-bold text-indigo-600 kanji-text">
                {currentQuestion.word}
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
                Show Related Kanji
              </button>
            </div>

            {showHint && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                {hintType === 'meaning' && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Meaning:</div>
                    <div className="text-xl font-semibold text-gray-800">{currentQuestion.meaning}</div>
                  </div>
                )}
                {hintType === 'kanji' && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Related Kanji:</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {currentQuestion.relatedKanji.join(' • ')}
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
                  {needsBothInputs ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-lg text-gray-600 mb-2">Write kanji:</div>
                        <HandwritingCanvas ref={handwritingRef} />
                      </div>
                      <div>
                        <div className="text-lg text-gray-600 mb-2">Type reading:</div>
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full max-w-md mx-auto block px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter reading (ひらがな)..."
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <HandwritingCanvas ref={handwritingRef} />
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-lg text-gray-600 mb-4">Type your answer:</div>
                  {needsBothInputs ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-lg text-gray-600 mb-2">Type kanji:</div>
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full max-w-md mx-auto block px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter kanji (漢字)..."
                          autoFocus
                        />
                      </div>
                      <div>
                        <div className="text-lg text-gray-600 mb-2">Type reading:</div>
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full max-w-md mx-auto block px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter reading (ひらがな)..."
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full max-w-md mx-auto block px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your answer..."
                      autoFocus
                    />
                  )}
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
                  ) : needsBothInputs ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Kanji: </span>
                        {needsHandwriting ? (
                          handwritingImage ? (
                            <img 
                              src={handwritingImage} 
                              alt="Your handwritten kanji"
                              className="max-w-xs mx-auto border border-gray-300 rounded-lg shadow-sm inline-block"
                              style={{ maxHeight: '150px' }}
                            />
                          ) : '(No drawing)'
                        ) : (userAnswer || '(Not entered)')}
                      </div>
                      <div>
                        <span className="text-gray-600">Reading: </span>
                        <span>{userAnswer || '(Not entered)'}</span>
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
                    {currentQuestion.reading}
                  </div>
                )}
              </div>

              {/* Dictionary Section */}
              <DictionarySection word={currentQuestion.word} reading={currentQuestion.reading} meaning={currentQuestion.meaning} />

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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

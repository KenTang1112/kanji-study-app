import { useState, useEffect, useRef } from 'react';
import dataService from '../services/dataService';
import HandwritingCanvas from './HandwritingCanvas';
import DictionarySection from './DictionarySection';

function AccuracyRing({ accuracy }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - accuracy / 100);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="mx-auto">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#2a2a38" strokeWidth="5" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="#C1392B" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 44 44)" />
      <text x="44" y="50" textAnchor="middle" fill="#C1392B" fontSize="17" fontWeight="700" fontFamily="Inter, sans-serif">
        {accuracy}%
      </text>
    </svg>
  );
}

// Normalize for auto-score comparison: trim + collapse whitespace
const normalize = (s) => (s || '').trim().replace(/\s+/g, '');

export default function QuizEngine({ mode, chapters, selectedWords, onBackToHome, onBackToChapters, onBackToWordSelection }) {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintType, setHintType] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [handwritingImage, setHandwritingImage] = useState('');
  const [autoScore, setAutoScore] = useState(null); // 'correct' | 'wrong' | null
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, wrong: 0, easy: 0, hard: 0 });
  const [missedCards, setMissedCards] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const handwritingRef = useRef(null);
  const pendingEnterAction = useRef(null);

  const needsHandwriting = mode === 'kana-to-kanji' || mode === 'vocabulary-writing';
  const isAutoScored = mode === 'kanji-to-reading' || mode === 'vocabulary-reading';

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && pendingEnterAction.current) pendingEnterAction.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => { initializeSession(); }, [mode, selectedWords]);

  const initializeSession = () => {
    try {
      if (!mode || !selectedWords || !Array.isArray(selectedWords) || selectedWords.length === 0) return;
      const quizData = dataService.convertWordsToQuizData(selectedWords, mode);
      if (!quizData || quizData.length === 0) return;
      const shuffled = dataService.shuffleArray(quizData);
      setCards(shuffled);
      setCurrentCardIndex(0);
      setCurrentQuestion(shuffled[0]);
      setSessionStats({ total: shuffled.length, correct: 0, wrong: 0, easy: 0, hard: 0 });
      setMissedCards([]);
    } catch (err) { console.error('Error initializing session:', err); }
  };

  const handleRevealAnswer = () => {
    if (handwritingRef.current && needsHandwriting) {
      setHandwritingImage(handwritingRef.current.getImageData());
    }
    // Auto-score for reading modes
    if (isAutoScored) {
      const result = normalize(userAnswer) === normalize(currentQuestion.answer) ? 'correct' : 'wrong';
      setAutoScore(result);
    }
    setShowAnswer(true);
    if (handwritingRef.current) handwritingRef.current.disableCanvas();
  };

  const handleGrade = (grade) => {
    const isCorrect = grade !== 'wrong';
    const word = mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji;

    dataService.updateWeakCardScores(
      isCorrect ? [word] : [],
      !isCorrect ? [word] : []
    );

    // When wrong, splice the card back in 3-5 positions later so it comes back naturally
    let newCards = cards;
    if (!isCorrect) {
      setMissedCards(prev => [...prev, currentQuestion]);
      const insertPos = Math.min(currentCardIndex + 3 + Math.floor(Math.random() * 3), cards.length);
      newCards = [...cards];
      newCards.splice(insertPos, 0, currentQuestion);
      setCards(newCards);
    }

    const finalStats = {
      ...sessionStats,
      total: isCorrect ? sessionStats.total : sessionStats.total + 1,
      correct: isCorrect ? sessionStats.correct + 1 : sessionStats.correct,
      wrong: !isCorrect ? sessionStats.wrong + 1 : sessionStats.wrong,
      easy: grade === 'easy' ? sessionStats.easy + 1 : sessionStats.easy,
      hard: grade === 'hard' ? sessionStats.hard + 1 : sessionStats.hard,
    };
    setSessionStats(finalStats);

    moveToNextCard(finalStats, newCards);
  };

  const moveToNextCard = (latestStats = sessionStats, latestCards = cards) => {
    setShowAnswer(false);
    setShowHint(false);
    setHintType(null);
    setUserAnswer('');
    setHandwritingImage('');
    setAutoScore(null);
    if (handwritingRef.current) {
      handwritingRef.current.clearCanvas();
      handwritingRef.current.enableCanvas();
    }

    const nextIndex = currentCardIndex + 1;
    if (nextIndex < latestCards.length) {
      setCurrentCardIndex(nextIndex);
      setCurrentQuestion(latestCards[nextIndex]);
    } else {
      dataService.saveSessionResult({
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode, chapters,
        total: latestStats.total, correct: latestStats.correct,
        wrong: latestStats.wrong, easy: latestStats.easy, hard: latestStats.hard,
        accuracy: latestStats.total > 0 ? Math.round((latestStats.correct / latestStats.total) * 100) : 0,
      });
      dataService.saveChapterStats(chapters, latestStats);
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    setSessionComplete(false);
    setShowAnswer(false);
    setShowHint(false);
    setHintType(null);
    setUserAnswer('');
    setAutoScore(null);
    initializeSession();
  };

  const handleFlagSubmit = () => {
    if (!flagReason.trim()) { alert('Please select a reason'); return; }
    const item = {
      word: mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji,
      reading: currentQuestion.reading, meaning: currentQuestion.meaning,
      chapter: currentQuestion.chapter, mode, reason: flagReason,
      timestamp: new Date().toISOString(),
      id: `${mode.includes('vocabulary') ? currentQuestion.word : currentQuestion.kanji}-${mode}-${Date.now()}`,
    };
    const stored = localStorage.getItem('flaggedItems');
    const flags = stored ? JSON.parse(stored) : [];
    flags.push(item);
    localStorage.setItem('flaggedItems', JSON.stringify(flags));
    setShowFlagModal(false);
    setFlagReason('');
  };

  const progress = sessionStats.total > 0 ? ((sessionStats.correct + sessionStats.wrong) / sessionStats.total) * 100 : 0;

  // Keep Enter key action up-to-date without re-registering the listener
  pendingEnterAction.current = (showAnswer && !showFlagModal && !sessionComplete)
    ? () => handleGrade(isAutoScored ? (autoScore === 'correct' ? 'easy' : 'wrong') : 'easy')
    : null;

  // Loading
  if (!currentQuestion && cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C1392B]" />
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    const finalAccuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0;

    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-[#171720] border border-[#2a2a38] rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#e0e0f0] text-center mb-5">Session complete</h2>

          <div className="mb-4">
            <AccuracyRing accuracy={finalAccuracy} />
            <p className="text-xs text-[#606080] text-center mt-1">Accuracy · {sessionStats.total} questions</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'Correct', value: sessionStats.correct, color: 'text-[#4AA85C]' },
              { label: 'Wrong', value: sessionStats.wrong, color: 'text-[#C1392B]' },
              { label: 'Hard', value: sessionStats.hard, color: 'text-[#D4861C]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0F0F14] border border-[#2a2a38] rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-[#606080] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {missedCards.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3a55] mb-3">Missed</p>
              <div className="flex flex-col gap-2">
                {missedCards.slice(0, 5).map((card, i) => (
                  <div key={i} className="bg-[#0F0F14] border border-[#2a2a38] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="noto text-lg font-bold text-[#e0e0f0]">
                        {mode.includes('vocabulary') ? card.word : (card.kanji || card.answer)}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-[#e0e0f0]">{card.reading}</div>
                        <div className="text-xs text-[#606080]">{card.meaning}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#C1392B33] text-[#C1392B] bg-[#C1392B11]">
                      Wrong
                    </span>
                  </div>
                ))}
                {missedCards.length > 5 && (
                  <p className="text-xs text-[#3a3a55] text-center">+{missedCards.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleRestart} className="flex-1 py-3 bg-[#3CBFA5] text-[#0A0A0F] font-semibold rounded-xl text-sm hover:bg-[#33a891] transition-colors">
              Study again
            </button>
            <button onClick={onBackToHome} className="flex-1 py-3 bg-[#0F0F14] border border-[#2a2a38] text-[#606080] font-semibold rounded-xl text-sm hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors">
              Home
            </button>
          </div>
          {/* Fix 1: "Change chapters" now visible */}
          <button
            onClick={onBackToChapters}
            className="w-full mt-3 py-2.5 bg-[#171720] border border-[#2a2a38] text-[#606080] rounded-xl text-sm font-medium hover:text-[#e0e0f0] hover:border-[#3a3a55] transition-colors"
          >
            Change chapters
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBackToChapters}
          className="w-9 h-9 bg-[#171720] border border-[#2a2a38] rounded-lg flex items-center justify-center text-[#606080] hover:text-[#e0e0f0] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 h-2 bg-[#1e1e2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C1392B] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-[#606080] flex-shrink-0">
          {sessionStats.correct + sessionStats.wrong} / {sessionStats.total}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-[#171720] border border-[#2a2a38] rounded-2xl p-6 mb-4 text-center">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#606080] mb-4">
          {mode === 'kana-to-kanji' ? 'Write the kanji for' :
           mode === 'kanji-to-reading' ? 'Write the reading for' :
           mode === 'vocabulary-writing' ? 'Write the word for' :
           'Write the reading for'}
        </p>
        <div className="noto text-4xl font-bold text-[#e0e0f0] mb-2">
          {currentQuestion.question}
        </div>
        {showHint && hintType === 'meaning' && (
          <div className="mt-3 text-sm text-[#3CBFA5]">{currentQuestion.meaning}</div>
        )}
        {showHint && hintType === 'kanji' && (
          <div className="mt-3 text-sm text-[#3CBFA5]">
            {mode.includes('vocabulary')
              ? (currentQuestion.relatedKanji || []).join(' · ') || 'No related vocab'
              : mode === 'kana-to-kanji'
                ? (currentQuestion.relatedVocabulary || []).join(' · ') || 'No related vocab'
                : (currentQuestion.vocabulary || []).join(' · ') || 'No examples'}
          </div>
        )}
      </div>

      {/* Answer area */}
      <div className="bg-[#171720] border border-[#2a2a38] rounded-2xl p-6 mb-4">
        {!showAnswer ? (
          <div className="text-center">
            {needsHandwriting ? (
              <div className="mb-4">
                <HandwritingCanvas ref={handwritingRef} />
              </div>
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRevealAnswer()}
                className="w-full max-w-sm mx-auto block px-4 py-3 text-xl text-center bg-[#0F0F14] border border-[#2a2a38] rounded-xl text-[#e0e0f0] focus:border-[#C1392B] focus:outline-none mb-4"
                placeholder="Your answer…"
                autoFocus
              />
            )}
            <div className="flex gap-3 justify-center mb-4">
              <button
                onClick={() => { setHintType('meaning'); setShowHint(true); }}
                className="px-4 py-2 bg-[#0F0F14] border border-[#2a2a38] text-[#606080] rounded-xl text-sm hover:text-[#e0e0f0] transition-colors"
              >
                Meaning hint
              </button>
              <button
                onClick={() => { setHintType('kanji'); setShowHint(true); }}
                className="px-4 py-2 bg-[#0F0F14] border border-[#2a2a38] text-[#606080] rounded-xl text-sm hover:text-[#e0e0f0] transition-colors"
              >
                Related hint
              </button>
            </div>
            <button
              onClick={handleRevealAnswer}
              className="w-full py-3 bg-[#C1392B] text-white font-semibold rounded-xl text-sm hover:bg-[#a62f24] transition-colors"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          <div>
            {/* Auto-score banner for reading modes */}
            {isAutoScored && autoScore && (
              <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
                autoScore === 'correct'
                  ? 'bg-[#4AA85C11] border border-[#4AA85C44]'
                  : 'bg-[#C1392B11] border border-[#C1392B44]'
              }`}>
                <span className="text-xl">{autoScore === 'correct' ? '✓' : '✗'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${autoScore === 'correct' ? 'text-[#4AA85C]' : 'text-[#C1392B]'}`}>
                    {autoScore === 'correct' ? 'Correct!' : 'Incorrect'}
                  </p>
                  {autoScore === 'wrong' && userAnswer && (
                    <p className="text-xs text-[#606080] mt-0.5 truncate">
                      You wrote: <span className="text-[#e0e0f0]">{userAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Handwriting image (writing modes) */}
            {needsHandwriting && handwritingImage && (
              <div className="mb-4 text-center">
                <p className="text-xs text-[#3a3a55] mb-2">Your answer</p>
                <img src={handwritingImage} alt="Your answer" className="max-w-[200px] mx-auto rounded-lg border border-[#2a2a38] opacity-80" />
              </div>
            )}

            {/* Correct answer */}
            <div className="text-center mb-5">
              <p className="text-xs text-[#3a3a55] mb-2">Correct answer</p>
              <div className="noto text-4xl font-bold text-[#e0e0f0] mb-1">{currentQuestion.answer}</div>
              {mode !== 'vocabulary-reading' && (
                <div className="text-base text-[#606080]">{currentQuestion.reading}</div>
              )}
            </div>

            {/* Dictionary */}
            <DictionarySection
              word={mode.includes('vocabulary') ? currentQuestion?.word || currentQuestion?.answer : currentQuestion?.kanji || currentQuestion?.answer}
              reading={currentQuestion?.reading}
              meaning={currentQuestion?.meaning}
            />

            {/* Grading */}
            <div className="mt-5">
              {isAutoScored ? (
                <button
                  onClick={() => handleGrade(autoScore === 'correct' ? 'easy' : 'wrong')}
                  className={`w-full py-3 font-semibold rounded-xl text-sm transition-colors ${
                    autoScore === 'correct'
                      ? 'bg-[#4AA85C] text-white hover:bg-[#3d8f4d]'
                      : 'bg-[#C1392B] text-white hover:bg-[#a62f24]'
                  }`}
                >
                  Next →
                </button>
              ) : (
                /* Handwriting modes: manual grading */
                <>
                  <p className="text-xs text-[#3a3a55] text-center mb-3">How was this card?</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button onClick={() => handleGrade('easy')} className="py-3 bg-[#4AA85C1a] border border-[#4AA85C44] text-[#4AA85C] font-semibold rounded-xl text-sm hover:bg-[#4AA85C2a] transition-colors">
                      Correct
                    </button>
                    <button onClick={() => handleGrade('hard')} className="py-3 bg-[#171720] border border-[#2a2a38] text-[#606080] font-semibold rounded-xl text-sm hover:text-[#e0e0f0] transition-colors">
                      Hard
                    </button>
                    <button onClick={() => handleGrade('wrong')} className="py-3 bg-[#C1392B1a] border border-[#C1392B44] text-[#C1392B] font-semibold rounded-xl text-sm hover:bg-[#C1392B2a] transition-colors">
                      Wrong
                    </button>
                  </div>
                </>
              )}
              <button onClick={() => setShowFlagModal(true)} className="w-full py-2 text-xs text-[#3a3a55] hover:text-[#606080] transition-colors">
                🚩 Flag as incorrect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Flag modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#171720] border border-[#2a2a38] rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-[#e0e0f0] mb-1">Flag as incorrect</h3>
            <p className="text-xs text-[#606080] mb-4">
              {mode.includes('vocabulary') ? currentQuestion?.word : currentQuestion?.kanji} · {currentQuestion?.reading}
            </p>
            <select
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0F0F14] border border-[#2a2a38] text-[#e0e0f0] rounded-xl text-sm focus:border-[#C1392B] focus:outline-none mb-4"
            >
              <option value="">Select a reason…</option>
              <option value="wrong-reading">Incorrect reading</option>
              <option value="wrong-meaning">Incorrect meaning</option>
              <option value="wrong-kanji">Incorrect kanji</option>
              <option value="typo">Typo or error</option>
              <option value="outdated">Outdated information</option>
              <option value="other">Other issue</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowFlagModal(false)} className="flex-1 py-2.5 bg-[#0F0F14] border border-[#2a2a38] text-[#606080] rounded-xl text-sm hover:text-[#e0e0f0] transition-colors">
                Cancel
              </button>
              <button onClick={handleFlagSubmit} className="flex-1 py-2.5 bg-[#C1392B] text-white rounded-xl text-sm font-semibold hover:bg-[#a62f24] transition-colors">
                Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import kanjiMaster from '../data/kanji_master.json?v=202605130400';
import vocabMaster from '../data/vocab_master.json?v=202605130400';

class DataService {
    constructor() {
          this.kanjiData = kanjiMaster;
          this.vocabData = vocabMaster;
          this.loadUserVocabulary();
          this.loadWeakCards();
    }

  // Load weak cards from localStorage
  loadWeakCards() {
        const stored = localStorage.getItem('weakCards');
        this.weakCards = stored ? JSON.parse(stored) : {};
  }

  // Load user vocabulary from localStorage
  loadUserVocabulary() {
        const stored = localStorage.getItem('userVocabulary');
        const userVocab = stored ? JSON.parse(stored) : [];
        this.userKanjiData = userVocab.filter(item => item.type === 'kanji') || [];
        this.userVocabData = userVocab.filter(item => item.type === 'vocab') || [];
  }

  // Save weak cards to localStorage
  saveWeakCards() {
        localStorage.setItem('weakCards', JSON.stringify(this.weakCards));
  }

  // Refresh data when user vocabulary changes
  refreshData() {
        this.loadUserVocabulary();
  }

  // Get all available chapters
  getAvailableChapters() {
        const kanjiChapters = this.kanjiData.map(item => item.chapter);
        const vocabChapters = this.vocabData.map(item => item.chapter);
        const userKanjiChapters = this.userKanjiData.map(item => item.chapter);
        const userVocabChapters = this.userVocabData.map(item => item.chapter);
        const allChapters = [...kanjiChapters, ...vocabChapters, ...userKanjiChapters, ...userVocabChapters];
        const uniqueChapters = [...new Set(allChapters)];
        return uniqueChapters.sort((a, b) => a - b);
  }

  // Filter kanji data by selected chapters
  filterKanjiByChapters(chapters) {
        const baseKanji = this.kanjiData.filter(item => chapters.includes(item.chapter));
        const userKanji = this.userKanjiData.filter(item => chapters.includes(item.chapter));
        return [...baseKanji, ...userKanji];
  }

  // Filter vocabulary data by selected chapters
  filterVocabByChapters(chapters) {
        const baseVocab = this.vocabData.filter(item => chapters.includes(item.chapter));
        const userVocab = this.userVocabData.filter(item => chapters.includes(item.chapter));
        return [...baseVocab, ...userVocab];
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
  }

  // Get weak card score for a word
  getWeakCardScore(word) {
        return this.weakCards[word] || 0;
  }

  // Update weak card scores
  updateWeakCardScores(correct, wrong) {
        correct.forEach(word => {
                this.weakCards[word] = Math.max(0, (this.weakCards[word] || 0) - 1);
        });
        wrong.forEach(word => {
                this.weakCards[word] = (this.weakCards[word] || 0) + 2;
        });
        this.saveWeakCards();
  }

  // Generate session with wrong cards prioritized
  generateSession(cards, wrongCards) {
        let sessionCards = [...cards];
        if (wrongCards.length > 0) {
                const wrongCardObjects = wrongCards.map(card =>
                          cards.find(c => c.word === card || c.kanji === card)
                                                              ).filter(Boolean);
                sessionCards = sessionCards.filter(card =>
                          !wrongCards.includes(card.word) && !wrongCards.includes(card.kanji)
                                                         );
                sessionCards = [...wrongCardObjects, ...sessionCards];
        }
        return sessionCards;
  }

  // Get data for specific study mode
  getDataForMode(mode, chapters) {
        switch (mode) {
          case 'kana-to-kanji': {
                    const kanjiData = this.filterKanjiByChapters(chapters);
                    return kanjiData.map(item => ({
                                question: item.reading || '',
                                answer: item.kanji,
                                meaning: item.meaning || '',
                                vocabulary: item.vocabulary || [],
                                relatedVocabulary: item.relatedVocabularyHiragana || [],
                                kanji: item.kanji,
                                reading: item.reading || '',
                                onyomi: item.onyomi || '',
                                relatedKanji: []
                    }));
          }
          case 'kanji-to-reading': {
                    const kanjiForReading = this.filterKanjiByChapters(chapters);
                    return kanjiForReading.map(item => ({
                                question: item.kanji,
                                answer: item.reading || '',
                                meaning: item.meaning || '',
                                vocabulary: item.vocabulary || [],
                                kanji: item.kanji,
                                reading: item.reading || '',
                                relatedKanji: []
                    }));
          }
          case 'vocabulary-writing': {
                    const vocabForWriting = this.filterVocabByChapters(chapters);
                    return vocabForWriting.map(item => ({
                                question: item.reading,
                                answer: item.word,
                                reading: item.reading,
                                meaning: item.meaning,
                                relatedKanji: this.getRelatedVocabularyForKanji(item.relatedKanji, item.word),
                                word: item.word
                    }));
          }
          case 'vocabulary-reading': {
                    const vocabForReading = this.filterVocabByChapters(chapters);
                    return vocabForReading.map(item => ({
                                question: item.word,
                                answer: item.reading,
                                meaning: item.meaning,
                                relatedKanji: this.getRelatedVocabularyForKanji(item.relatedKanji, item.word),
                                word: item.word,
                                reading: item.reading
                    }));
          }
          default:
                    return [];
        }
  }

  // Get related vocabulary for kanji (excluding current word)
  getRelatedVocabularyForKanji(relatedKanji, currentWord) {
        if (!relatedKanji || relatedKanji.length === 0) return [];
        const allVocab = this.filterVocabByChapters(Array.from({length: 19}, (_, i) => i + 1));
        const relatedVocab = [];
        relatedKanji.forEach(kanji => {
                const vocabWithKanji = allVocab.filter(vocab =>
                          vocab.word.includes(kanji) &&
                          vocab.word !== currentWord &&
                          !relatedVocab.some(rv => rv.word === vocab.word)
                                                             );
                vocabWithKanji.forEach(vocab => {
                          relatedVocab.push({ word: vocab.word, reading: vocab.reading });
                });
        });
        return relatedVocab.slice(0, 5).map(v => v.reading);
  }

  // Convert selected words to quiz data format
  // FIX: vocabulary modes now correctly compute relatedKanji instead of passing raw array
  convertWordsToQuizData(selectedWords, mode) {
        switch (mode) {
          case 'kana-to-kanji':
                    return selectedWords.map(item => ({
                                question: item.reading || '',
                                answer: item.word || item.kanji,
                                meaning: item.meaning || '',
                                vocabulary: item.vocabulary || [],
                                relatedVocabulary: item.relatedVocabularyHiragana || [],
                                kanji: item.word || item.kanji,
                                reading: item.reading || '',
                                onyomi: item.onyomi || '',
                                relatedKanji: []
                    }));

          case 'kanji-to-reading':
                    return selectedWords.map(item => ({
                                question: item.word || item.kanji,
                                answer: item.reading || '',
                                meaning: item.meaning || '',
                                vocabulary: item.vocabulary || [],
                                kanji: item.word || item.kanji,
                                reading: item.reading || '',
                                onyomi: item.onyomi || '',
                                relatedKanji: []
                    }));

          case 'vocabulary-writing':
                    return selectedWords.map(item => ({
                                question: item.reading || '',
                                answer: item.word,
                                meaning: item.meaning || '',
                                reading: item.reading || '',
                                word: item.word,
                                relatedKanji: this.getRelatedVocabularyForKanji(item.relatedKanji || [], item.word)
                    }));

          case 'vocabulary-reading':
                    return selectedWords.map(item => ({
                                question: item.word,
                                answer: item.reading || '',
                                meaning: item.meaning || '',
                                reading: item.reading || '',
                                word: item.word,
                                relatedKanji: this.getRelatedVocabularyForKanji(item.relatedKanji || [], item.word)
                    }));

          default:
                    return [];
        }
  }

  // Generate Jisho URL for a word
  getJishoUrl(word) {
        return `https://jisho.org/search/${encodeURIComponent(word)}`;
  }
}

export default new DataService();

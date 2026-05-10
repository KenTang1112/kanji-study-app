import kanjiVocabCh15_19 from '../data/kanji_vocab_ch15_19.json';

class DataService {
  constructor() {
    this.baseData = kanjiVocabCh15_19;
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
    this.allData = [...this.baseData, ...userVocab];
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
    const chapters = [...new Set(this.allData.map(item => item.chapter))];
    return chapters.sort((a, b) => a - b);
  }

  // Filter data by selected chapters
  filterByChapters(chapters) {
    return this.allData.filter(item => chapters.includes(item.chapter));
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

  // Update weak card score
  updateWeakCardScore(word, isCorrect) {
    if (!this.weakCards[word]) {
      this.weakCards[word] = 0;
    }
    
    if (isCorrect) {
      this.weakCards[word] = Math.max(0, this.weakCards[word] - 1);
    } else {
      this.weakCards[word] = Math.min(10, this.weakCards[word] + 2);
    }
    
    this.saveWeakCards();
  }

  // Generate quiz session with weak card prioritization
  generateSession(chapters, sessionSize = 20) {
    const filteredData = this.filterByChapters(chapters);
    
    // Sort by weak card score (weaker cards first)
    const sortedByWeakness = filteredData.sort((a, b) => 
      this.getWeakCardScore(b.word) - this.getWeakCardScore(a.word)
    );

    // Take top cards based on weakness, then shuffle
    const sessionCards = sortedByWeakness.slice(0, sessionSize);
    return this.shuffleArray(sessionCards);
  }

  // Get data for specific study mode
  getDataForMode(mode, chapters) {
    const filteredData = this.filterByChapters(chapters);
    
    switch (mode) {
      case 'kana-to-kanji':
        return filteredData.map(item => ({
          question: item.reading,
          answer: item.word,
          meaning: item.meaning,
          relatedKanji: item.relatedKanji,
          word: item.word,
          reading: item.reading
        }));
      
      case 'kanji-to-reading':
        return filteredData.map(item => ({
          question: item.word,
          answer: item.reading,
          meaning: item.meaning,
          relatedKanji: item.relatedKanji,
          word: item.word,
          reading: item.reading
        }));
      
      case 'vocabulary-writing':
        return filteredData.map(item => ({
          question: item.meaning,
          answer: item.word,
          reading: item.reading,
          relatedKanji: item.relatedKanji,
          word: item.word,
          reading: item.reading
        }));
      
      case 'vocabulary-reading':
        return filteredData.map(item => ({
          question: item.word,
          answer: item.reading,
          meaning: item.meaning,
          relatedKanji: item.relatedKanji,
          word: item.word,
          reading: item.reading
        }));
      
      case 'self-uploading':
        return filteredData.map(item => ({
          question: item.meaning,
          answer: item.word,
          reading: item.reading,
          meaning: item.meaning,
          relatedKanji: item.relatedKanji,
          word: item.word,
          reading: item.reading,
          showKanji: true // Flag to display kanji prominently
        }));
      
      default:
        return filteredData;
    }
  }

  // Generate Jisho URL for a word
  getJishoUrl(word) {
    return `https://jisho.org/search/${encodeURIComponent(word)}`;
  }
}

export default new DataService();

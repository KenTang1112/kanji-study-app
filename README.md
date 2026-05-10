# Kanji Study App

A clean, modern React + Vite + Tailwind CSS web application for studying Japanese kanji and vocabulary for university exams.

## Features

### 🎯 Study Modes
- **Kana → Kanji**: Given the reading, write the kanji
- **Kanji → Reading**: Given the kanji, write the reading  
- **Vocabulary Writing**: Given the meaning, write the vocabulary
- **Vocabulary Reading**: Given the vocabulary, show the reading and meaning

### 📚 Learning Features
- **Chapter Selection**: Choose multiple chapters to practice
- **Smart Shuffling**: Cards are randomized for each session
- **Weak Card Tracking**: Wrong answers appear more frequently in future sessions
- **Hint System**: Reveal meaning or related kanji before answering
- **Self-Grading**: Rate cards as Easy, Hard, or Wrong
- **Handwriting Canvas**: Practice writing with mouse or touch input
- **Dictionary Integration**: Click through to Jisho.org for detailed definitions
- **Progress Tracking**: Real-time session statistics and accuracy

### 📱 Responsive Design
- Works perfectly on Windows desktop browsers
- Optimized for iPad and tablet browsers
- Touch-friendly interface for mobile devices

## Technical Stack

- **Frontend**: React 18 with modern hooks
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **Data Storage**: Local JSON files + localStorage for progress
- **Architecture**: Clean component-based structure with service layer

## Project Structure

```
kanji-study-app/
├── src/
│   ├── components/           # React components
│   │   ├── HomeScreen.jsx   # Main mode selection screen
│   │   ├── ChapterSelection.jsx # Chapter picker
│   │   ├── QuizEngine.jsx   # Core quiz functionality
│   │   ├── HandwritingCanvas.jsx # Drawing canvas
│   │   └── DictionarySection.jsx # Word dictionary display
│   ├── services/
│   │   └── dataService.js   # Data loading and manipulation logic
│   ├── data/               # JSON vocabulary data
│   │   ├── kanji_vocab_ch15_16.json
│   │   └── kanji_vocab_ch17_19_master.json
│   ├── App.jsx             # Main app component
│   ├── App.css             # Custom styles
│   ├── main.jsx            # App entry point
│   └── index.css           # Tailwind imports
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173` (or another port if 5173 is busy).

### 3. Build for Production
```bash
npm run build
```

The production build will be in the `dist` folder.

### 4. Preview Production Build
```bash
npm run preview
```

## Data Format

The app uses JSON files with this structure:

```json
{
  "word": "循環",
  "reading": "じゅんかん", 
  "meaning": "circulation",
  "chapter": 15,
  "relatedKanji": ["循", "環"]
}
```

### Adding New Data
1. Create new JSON files in `src/data/`
2. Import them in `src/services/dataService.js`
3. Add them to the `allData` array

## How It Works

### Study Session Flow
1. **Home Screen**: Choose one of 4 study modes
2. **Chapter Selection**: Select which chapters to practice
3. **Quiz Session**: 
   - Answer questions using keyboard or handwriting
   - Use hints if needed
   - Reveal answer and self-grade
   - Wrong cards are queued for retry
4. **Session Summary**: View accuracy and statistics

### Weak Card Algorithm
- Each word has a weakness score (0-10) stored in localStorage
- Correct answers decrease the score
- Wrong answers increase the score
- Cards with higher scores appear more frequently

### Handwriting Canvas
- Supports mouse and touch input
- Works with Apple Pencil on iPad
- Canvas is disabled when answer is revealed
- Auto-clears between cards

## Customization

### Adding New Study Modes
1. Add mode to `studyModes` array in `HomeScreen.jsx`
2. Add case in `getDataForMode()` in `dataService.js`
3. Update question/answer logic in `QuizEngine.jsx`

### Styling
- Main styles use Tailwind CSS classes
- Custom styles in `src/App.css`
- Japanese text uses appropriate font stacks

### Data Service
The `dataService.js` file handles:
- Loading JSON data
- Filtering by chapters
- Shuffling cards
- Weak card tracking
- Session generation

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (including iPad)
- Mobile browsers (iOS Safari, Android Chrome)

## Performance Features

- Lazy loading of components
- Efficient card shuffling algorithm
- Local storage for persistence
- Optimized re-renders with React hooks
- Touch-optimized for mobile devices

## Future Enhancements

- [ ] Handwriting recognition
- [ ] Audio pronunciation
- [ ] More study modes (e.g., multiple choice)
- [ ] Spaced repetition algorithm
- [ ] Export/import progress
- [ ] More detailed statistics

## License

MIT License - feel free to use this for your Japanese studies!

---

**Happy studying! 🎌**

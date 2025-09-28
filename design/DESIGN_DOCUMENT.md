# Word Games Collection - Design Document

## Project Overview

A collection of engaging word games built with SvelteKit 2.x, targeting adult players who enjoy classic word puzzles and challenges. The application will be deployed as a static site on GitHub Pages, providing unlimited play without ads or artificial restrictions.

## Target Audience

- **Primary**: Adults who enjoy word games and puzzles
- **Secondary**: Anyone looking for casual, educational word-based entertainment
- **Accessibility**: Users with visual impairments or preferences for different color schemes

## Core Principles

- **No artificial limits**: Unlimited gameplay without timers, lives, or pay walls
- **Clean experience**: No ads, no social pressure, just pure game enjoyment
- **Accessibility first**: Multiple themes, adjustable text sizes, high contrast options
- **Privacy focused**: All data stored locally, no tracking or analytics
- **Offline capable**: All resources bundled for reliable offline play

## Game Collection (MVP)

### Phase 1 Games (Initial 5)

1. **Guess the Word** - Wordle-style word guessing with colored feedback
2. **Word Search** - Find hidden words in letter grids
3. **Bag of Letters** - Create words from a set of given letters (anagram game)
4. **Typing Challenge** - Speed typing game with word-based challenges
5. **Rhyme Thyme** - Type rhyming words against the clock

## Technical Architecture

### Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5 runes syntax
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Testing**: Vitest with dual browser/Node.js setup
- **Build**: Static adapter for GitHub Pages deployment
- **Storage**: localStorage for user preferences and game state

### Project Structure

```
src/
├── lib/
│   ├── components/          # Shared UI components
│   │   ├── GameLayout.svelte
│   │   ├── ThemeSelector.svelte
│   │   ├── DifficultySelector.svelte
│   │   └── GameCard.svelte
│   ├── stores/             # Svelte stores for global state
│   │   ├── settings.ts     # User preferences
│   │   ├── themes.ts       # Theme management
│   │   └── gameHistory.ts  # Recent/favorite games
│   ├── games/              # Game-specific logic
│   │   ├── wordle/
│   │   ├── wordsearch/
│   │   ├── anagrams/
│   │   ├── typing/
│   │   └── rhyme/
│   ├── utils/              # Shared utilities
│   │   ├── dictionary.ts   # Word list management
│   │   ├── storage.ts      # localStorage wrapper
│   │   └── gameHelpers.ts  # Common game functions
│   └── data/               # Static word lists and definitions
│       ├── words/
│       ├── definitions/
│       └── rhymes/
├── routes/
│   ├── +layout.svelte      # Global layout with theme/settings
│   ├── +page.svelte        # Home page with game selection
│   ├── wordle/
│   │   └── +page.svelte
│   ├── wordsearch/
│   │   └── +page.svelte
│   ├── anagrams/
│   │   └── +page.svelte
│   ├── typing/
│   │   └── +page.svelte
│   └── rhyme/
│       └── +page.svelte
└── app.css                 # Global styles and Tailwind imports
```

## User Experience Design

### Home Page

- **Game Grid**: Visual cards for each game with screenshots/icons
- **Quick Access**: Recently played and favorited games section
- **Settings**: Theme selector, text size, accessibility options in header
- **About**: Brief description of the collection and usage tips

### Game Pages

- **Consistent Layout**: Shared header with home link, settings, theme toggle
- **Game Area**: Centered game interface with appropriate sizing
- **Controls**: Difficulty selector, new game button, instructions toggle
- **Feedback**: Clear win/lose states, helpful hints when appropriate

### Accessibility Features

- **Themes**: Light, Dark, High Contrast options
- **Text Sizing**: Small, Medium, Large, Extra Large options
- **Keyboard Navigation**: Full keyboard support for all games
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Independence**: No information conveyed by color alone

## Data Management

### Word Lists & Dictionaries

**Recommended Sources:**

- **SCOWL (Spell Checker Oriented Word Lists)**: Comprehensive English word lists
- **WordNet**: Princeton's lexical database with definitions and relationships
- **CMU Pronouncing Dictionary**: Phonetic transcriptions for rhyme detection
- **Moby Project**: Public domain word lists and thesaurus

**Data Structure:**

```typescript
interface WordEntry {
	word: string;
	definition?: string;
	phonetic?: string;
	difficulty: 'easy' | 'medium' | 'hard';
	length: number;
	frequency: number; // for word selection algorithms
}

interface RhymeEntry {
	word: string;
	rhymeKey: string; // phonetic ending for matching
	syllables: number;
}
```

### User Preferences

```typescript
interface UserSettings {
	theme: 'light' | 'dark' | 'high-contrast';
	textSize: 'small' | 'medium' | 'large' | 'extra-large';
	defaultDifficulty: 'easy' | 'medium' | 'hard';
	favoriteGames: string[];
	recentGames: { gameId: string; timestamp: number }[];
	gameSpecificSettings: Record<string, any>;
}
```

## Game Specifications

### 1. Guess the Word (Wordle Clone)

**Core Mechanics:**

- 6 attempts to guess a 5-letter word
- Color-coded feedback (correct letter/position, correct letter/wrong position, not in word)
- Virtual keyboard shows letter states
- Hard mode option (must use revealed letters)

**Difficulty Levels:**

- Easy: Common words, 4-6 letters
- Medium: Standard word list, 5 letters
- Hard: Less common words, 5-7 letters

**Variants for Future:**

- Multiple words (Dordle, Quordle style)
- Different word lengths
- Custom word lists by theme

### 2. Word Search

**Core Mechanics:**

- Grid of letters with hidden words
- Words can be horizontal, vertical, diagonal
- Click and drag to select words
- Words highlighted when found
- Timer optional

**Difficulty Levels:**

- Easy: 10x10 grid, 8 words, H/V only
- Medium: 15x15 grid, 12 words, includes diagonals
- Hard: 20x20 grid, 20 words, all directions including reverse

### 3. Bag of Letters (Anagrams)

**Core Mechanics:**

- Given set of letters (6-10)
- Find as many words as possible
- Minimum word length (3-4 letters)
- Score based on word length and rarity
- Time limit optional

**Difficulty Levels:**

- Easy: 6 letters, common letter combinations
- Medium: 8 letters, mixed difficulty
- Hard: 10 letters, challenging combinations

### 4. Typing Challenge

**Core Mechanics:**

- Display words/sentences to type
- Track WPM and accuracy
- Real-time feedback on errors
- Different challenge types

**Game Modes:**

- Word Sprint: Type individual words quickly
- Quote Challenge: Type famous quotes or passages
- Random Words: Continuous stream of random words
- Themed Words: Categories like animals, foods, etc.

### 5. Rhyme Thyme

**Core Mechanics:**

- Given a target word
- Type as many rhyming words as possible
- Time limit (60-90 seconds)
- Score based on word count and rarity
- No duplicates allowed

**Difficulty Levels:**

- Easy: Common words with many rhymes (cat, run, day)
- Medium: Moderate rhyme availability
- Hard: Words with few or difficult rhymes

## Development Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up project structure and shared components
- [ ] Implement theme system and user preferences
- [ ] Create word list processing and management
- [ ] Build home page with game selection
- [ ] Set up GitHub Actions for deployment

### Phase 2: Core Games (Weeks 3-6)

- [ ] Implement Guess the Word game
- [ ] Implement Word Search game
- [ ] Add difficulty selection system
- [ ] Create shared game layout components

### Phase 3: Advanced Games (Weeks 7-10)

- [ ] Implement Bag of Letters game
- [ ] Implement Typing Challenge game
- [ ] Implement Rhyme Thyme game
- [ ] Add comprehensive testing

### Phase 4: Polish & Enhancement (Weeks 11-12)

- [ ] Accessibility audit and improvements
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Documentation and deployment guide

## Future Expansion Ideas

### Additional Games (Phase 2)

- **Crossword Puzzle**: Traditional crossword with clues
- **Word Ladder**: Change one letter at a time to reach target word
- **Boggle**: Find words in a 4x4 letter grid
- **Hangman**: Classic word guessing with visual feedback
- **Word Chain**: Create chains of words where each starts with the last letter
- **Spelling Bee**: Progressive difficulty spelling challenges
- **Palindrome Finder**: Create or find palindromic words/phrases
- **Word Scramble**: Unscramble jumbled words
- **Definition Match**: Match words to their definitions
- **Synonym/Antonym Games**: Word relationship challenges
- **Rhyme Time**: More advanced rhyming word games
- **Speed Reading**: Comprehension-based reading challenges
- **Word Memory**: Remember and recall word sequences
- **Category Games**: Name words in specific categories
- **Alphabet Games**: Words starting with each letter

### Enhanced Features

- **Daily Challenges**: Special puzzles that change daily
- **Theme Packs**: Seasonal or topical word sets
- **Custom Difficulty**: User-defined challenge parameters
- **Game Variants**: Multiple versions of popular games
- **Sound Effects**: Optional audio feedback (toggle-able)
- **Animations**: Smooth transitions and celebrations
- **Export Results**: Share game results as text (no social integration)

## Technical Considerations

### Performance

- **Bundle Size**: Monitor and optimize word list sizes
- **Caching**: Leverage browser caching for static resources
- **Memory Usage**: Efficient data structures for large word lists
- **Rendering**: Optimize for smooth animations and interactions

### Accessibility

- **WCAG 2.1 AA Compliance**: Meet accessibility standards
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Proper semantic markup and ARIA labels
- **Motor Accessibility**: Large click targets, timing alternatives

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **ES2020+ Features**: Use modern JavaScript features
- **CSS Grid/Flexbox**: Modern layout techniques
- **Web APIs**: localStorage, fetch, modern DOM APIs

## Success Metrics

### User Experience

- Games load quickly (< 2 seconds)
- No accessibility barriers
- Intuitive navigation between games
- Preferences persist between sessions

### Technical Quality

- 100% test coverage for game logic
- No console errors or warnings
- Lighthouse scores: Performance 90+, Accessibility 100
- Cross-browser compatibility

### Content Quality

- Comprehensive word lists for all difficulty levels
- Accurate definitions and rhyme detection
- Balanced game difficulty progression
- Engaging and varied gameplay

---

_This design document will evolve as development progresses and user feedback is incorporated._

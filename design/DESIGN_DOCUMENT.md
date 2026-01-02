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

### Implemented Games

1. **Guess the Word** ✅ - Wordle-style word guessing with colored feedback
   - Variable word lengths (4-7 letters)
   - Configuration page with customizable settings
   - Hard mode, Rescue mode, and Easy mode options
   - Common words or full dictionary selection
2. **Word Search** ✅ - Find hidden words in letter grids
   - Configuration page with grid size, density, and direction options
   - Multiple theme-based word lists (Wikipedia, IMDb movies/actors)
   - Click attribution showing word source
3. **Dictionary** ✅ - Interactive word lookup tool (NEW)
   - Search and view word definitions
   - Clickable words within definitions for exploration
   - Webster's dictionary with Wiktionary fallback
   - Word history with expandable entries

### Planned Games

4. **Bag of Letters** - Create words from a set of given letters (anagram game)
5. **Typing Challenge** - Speed typing game with word-based challenges
6. **Rhyme Thyme** - Type rhyming words against the clock

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
│   │   ├── GameCard.svelte
│   │   └── [other shared components]
│   ├── stores/             # Svelte stores for global state
│   │   ├── settings.ts     # User preferences
│   │   ├── themes.ts       # Theme management
│   │   ├── gameHistory.ts  # Recent/favorite games
│   │   ├── guessTheWordSettings.ts  # Guess the Word config
│   │   └── wordSearchSettings.ts    # Word Search config
│   ├── games/              # Game-specific logic
│   │   ├── wordle/         # ✅ Implemented
│   │   │   ├── types.ts
│   │   │   ├── WordleGame.svelte
│   │   │   └── [game logic]
│   │   ├── wordsearch/     # ✅ Implemented
│   │   │   ├── types.ts
│   │   │   ├── gridGenerator.ts
│   │   │   ├── wordListService.ts
│   │   │   ├── WordGrid.svelte
│   │   │   ├── WordList.svelte
│   │   │   └── HighlightCanvas.svelte
│   │   ├── anagrams/
│   │   ├── typing/
│   │   └── rhyme/
│   ├── utils/              # Shared utilities
│   │   ├── gameConfigs.ts  # Game configuration registry
│   │   └── [other utilities]
│   ├── dictionary.ts       # ✅ Dictionary with Wiktionary integration
│   ├── imdb-loader.ts      # ✅ IMDb data loading
│   ├── types/              # TypeScript interfaces
│   │   └── imdb.ts         # IMDb data types
│   └── data/               # Static word lists and definitions
│       ├── common-words-5.ts  # Curated 5-letter words
│       └── [processed data files]
├── routes/
│   ├── +layout.svelte      # Global layout with theme/settings
│   ├── +page.svelte        # Home page with game selection
│   ├── dictionary/         # ✅ Interactive dictionary
│   │   └── +page.svelte
│   ├── guess-the-word/     # ✅ Wordle game
│   │   └── +page.svelte
│   ├── guess-the-word-config/  # ✅ Configuration page
│   │   └── +page.svelte
│   ├── wordsearch/         # ✅ Word search game
│   │   └── +page.svelte
│   ├── wordsearch-config/  # ✅ Configuration page
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

### Game Configuration Registry ✅ Implemented

A centralized configuration system (`gameConfigs.ts`) that defines all available games and their properties:

```typescript
interface GameConfig {
	id: string;
	name: string;
	description: string;
	icon: string;
	route: string; // Path to game (may be config page)
	category: 'word-guessing' | 'puzzle' | 'speed' | 'creative';
	difficulty: Array<'easy' | 'medium' | 'hard'>;
	features: string[];
	estimatedPlayTime: number;
}
```

**Implemented Games**:

- `wordle` → `/guess-the-word-config`
- `wordsearch` → `/wordsearch-config`
- `anagrams` → `/anagrams`
- `typing` → `/typing`
- `rhyme` → `/rhyme`

**Helper Functions**:

- `getAllGames()` - Returns all game configs
- `getGameConfig(gameId)` - Get specific game
- `getGamesByCategory(category)` - Filter by category
- `gameSupportsdifficulty()` - Check difficulty support

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

### Word Lists & Dictionaries ✅ Implemented

**Implemented Sources:**

- **SCOWL (Spell Checker Oriented Word Lists)**: ✅ Comprehensive English word lists processed
- **Webster's English Dictionary**: ✅ Definitions included in static JSON
- **CMU Pronouncing Dictionary**: ✅ Phonetic transcriptions for rhyme detection
- **Wiktionary API**: ✅ Fallback for definitions via live API calls
- **Wikipedia API**: ✅ Random article fetching for themed word searches
- **IMDb Public Datasets**: ✅ Processed movie and actor data (compressed)

**Implemented Data Structure:**

```typescript
interface WordEntry {
	word: string;
	length: number;
	difficulty: 'easy' | 'medium' | 'hard';
	category?: string;
}

interface PhoneticEntry {
	word: string;
	phonetic: string;
	sounds: string[];
}

interface DefinitionSource {
	source: 'websters' | 'wiktionary';
	definitions: string[];
	partOfSpeech?: string;
	pronunciation?: string;
}

interface DefinitionEntry {
	word: string;
	sources: DefinitionSource[];
}

interface RhymeGroups {
	[rhymeKey: string]: string[];
}
```

**Data Files:**

- `static/data/words-by-difficulty.json` - Words categorized by difficulty
- `static/data/words-by-length.json` - Words organized by character length
- `static/data/phonetics.json` - CMU phonetic data
- `static/data/rhyme-groups.json` - Pre-computed rhyme groups
- `static/data/definitions.json` - Webster's dictionary definitions
- `static/data/imdb-data.json.gz` - Compressed IMDb movie/actor data (~2-3 MB)

### External API Integrations ✅

**Wikipedia API:**

- Fetches random articles via `en.wikipedia.org/w/api.php`
- Extracts words from article content
- Provides source attribution with clickable links
- Retry logic for articles with insufficient words

**Wiktionary API:**

- Live definition lookup via `en.wiktionary.org/api/rest_v1`
- Fallback when Webster's dictionary lacks definition
- HTML tag stripping and definition cleaning
- Part of speech extraction

**IMDb Data Processing:**

- Node.js script processes multi-GB IMDb datasets
- Filters for quality movies (≥4.5 rating, ≥1000 votes)
- Extracts actor names and character names
- Creates bidirectional movie-actor references
- Compresses to ~2-3 MB using gzip
- Browser-native decompression on client

### User Preferences ✅ Implemented

```typescript
interface UserSettings {
	theme: 'light' | 'dark' | 'high-contrast';
	textSize: 'small' | 'medium' | 'large' | 'extra-large';
	defaultDifficulty: 'easy' | 'medium' | 'hard';
	favoriteGames: string[];
	recentGames: { gameId: string; timestamp: number }[];
	gameSpecificSettings: Record<string, any>;
}

// Game-specific settings stores
interface GuessTheWordSettings {
	targetWords: 'common' | 'all';
	wordLength: number;
	hardMode: boolean;
	rescueMode: boolean;
	easyMode: boolean;
}

interface WordSearchSettings {
	gridSize: 'small' | 'medium' | 'large' | 'extra-large';
	density: 'sparse' | 'normal' | 'dense';
	wordList: WordListType; // e.g., 'wikipedia-random', 'movies-random-list'
	allowedDirections: Record<Direction, boolean>;
}
```

**Implemented Stores**:

- `settings.ts` - Global user preferences
- `themes.ts` - Theme management
- `gameHistory.ts` - Game results and history
- `guessTheWordSettings.ts` - Persistent Guess the Word config
- `wordSearchSettings.ts` - Persistent Word Search config

## Game Specifications

### 1. Guess the Word (Wordle Clone) ✅ Implemented

**Core Mechanics:**

- 6 attempts to guess a word (4-7 letters, configurable)
- Color-coded feedback (correct letter/position, correct letter/wrong position, not in word)
- Virtual keyboard shows letter states
- Configuration page for pre-game setup

**Implemented Features:**

- **Variable Word Lengths**: Choose 4, 5, 6, or 7-letter words
- **Target Word Selection**:
  - Common Words: Curated list of familiar 5-letter words (recommended)
  - All Words: Full dictionary (fallback for non-5-letter words)
- **Game Modes**:
  - Hard Mode: Must use revealed letters in subsequent guesses
  - Rescue Mode: Provides definition hint after 4 failed attempts
  - Easy Mode: Shows first letter of the target word
- **Configuration Page**: `/guess-the-word-config` route
  - Persistent settings via Svelte store
  - URL parameter passing to game page
- **Game History**: Results saved to localStorage
- **No Auto-Redirect**: Player controls when to exit after completion

**Technical Details:**

- Settings stored in `guessTheWordSettings` store
- Common words list: ~200 curated 5-letter words
- Dictionary fallback for other word lengths
- Configuration validation with user feedback

**Variants for Future:**

- Multiple words (Dordle, Quordle style)
- Custom word lists by theme
- Daily challenge mode

### 2. Word Search ✅ Implemented

**Core Mechanics:**

- Grid of letters with hidden words
- Words can be horizontal, vertical, diagonal, and reverse
- Click and drag to select words
- Words highlighted with multiple colors when found
- Source attribution with clickable links

**Implemented Features:**

- **Grid Sizes**: Small (10×10), Medium (15×15), Large (20×20), Extra Large (25×25)
- **Word Density**: Sparse, Normal, Dense (controls word count)
- **Direction Options**: Eight configurable directions
  - Right, Down, Down-Right, Down-Left
  - Left, Up, Up-Right, Up-Left
- **Theme-Based Word Lists**:
  - **Wikipedia**: Random article words with source link
  - **IMDb Movies**: Random movie titles, specific movie cast, specific movie characters
  - **IMDb Actors**: Random actor names, specific actor's filmography
- **Configuration Page**: `/wordsearch-config` route
  - Visual grid size selector
  - Density options with descriptions
  - Word list categorized by source (Wikipedia, Movies, Books)
  - Direction toggle buttons with visual feedback
  - Persistent settings via Svelte store
- **Click Attribution**: "See source" link to Wikipedia article or IMDb page
- **Word Bank System**: Fetches larger word bank, places subset in grid
- **Give Up Option**: Reveals remaining words with visual distinction
- **Grid Generation**: Smart placement algorithm with retry logic

**Technical Details:**

- Settings stored in `wordSearchSettings` store
- Wikipedia API integration with retry logic
- IMDb data loaded from compressed JSON (~2-3 MB)
- Highlight colors: 8 distinct colors for found words
- Cell-based selection with hover feedback
- Canvas-based highlighting for visual polish

**Word List Service:**

- Supports multiple word sources (Wikipedia, IMDb, static lists)
- Returns word bank (typically 50-100 words)
- Grid generator selects subset to place
- Display value vs. grid value (e.g., "The Dark Knight" vs. "THEDARKKNIGHT")

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

### 6. Dictionary Tool ✅ Implemented

**Core Features:**

- **Interactive Search**: Look up any word from the dictionary
- **Multiple Definition Sources**:
  - Primary: Webster's English Dictionary (static data)
  - Fallback: Wiktionary API (live lookup)
- **Clickable Words**: Click any word in a definition to look it up
- **Search History**: Maintains list of recently searched words
- **Expandable Entries**: Click to expand/collapse definitions
- **Word Validation**: Only searches for valid dictionary words

**Technical Implementation:**

- `GameDictionary` class with `getDefinitionWithFallback()` method
- Webster's definitions pre-loaded from static JSON
- Wiktionary API called when Webster's lacks definition
- HTML tag stripping from Wiktionary responses
- Part of speech and pronunciation data when available
- Persistent word history during session

**Use Cases:**

- Look up unfamiliar words from games
- Explore word relationships by clicking through definitions
- Educational tool for vocabulary building
- Verify word meanings during gameplay

## Configuration System ✅ Implemented

Both main games now feature dedicated configuration pages that allow players to customize their experience before starting a game.

### Configuration Features

**Guess the Word Configuration** (`/guess-the-word-config`):

- Target word source (common/all words)
- Word length selection (4-7 letters)
- Game modes: Hard Mode, Rescue Mode, Easy Mode
- Settings persist via Svelte store
- Validation and user feedback
- URL parameter passing to game

**Word Search Configuration** (`/wordsearch-config`):

- Grid size selector (10×10 to 25×25)
- Word density (sparse, normal, dense)
- Word list theme selection (Wikipedia, IMDb movies/actors)
- Direction toggles (8 directions)
- Visual feedback for selections
- Organized by category (Wikipedia, Movies, Books)

### Configuration Architecture

```typescript
// Svelte stores for persistent settings
guessTheWordSettings; // Guess the Word preferences
wordSearchSettings; // Word Search preferences

// URL parameter encoding
// Settings → Query params → Game page
```

## External Data Integrations ✅

### Wikipedia Integration

**Purpose**: Provide themed word lists from real-world content

**Implementation**:

- Uses Wikipedia's public API (`en.wikipedia.org/w/api.php`)
- Fetches random articles with `generator=random`
- Extracts text content and parses words
- Filters for minimum word length (4 letters)
- Retry logic for articles with insufficient words
- Returns article title and word list
- Provides clickable source link in game

**Word List Service** (`wordListService.ts`):

```typescript
async function fetchWikipediaArticle(): Promise<{
	title: string;
	words: string[];
} | null>;
```

### IMDb Integration

**Purpose**: Movie and actor-themed word search lists

**Data Processing** (`scripts/process-imdb-data.ts`):

- Downloads IMDb public datasets (multi-GB TSV files)
- Filters for quality movies (≥4.5 rating, ≥1000 votes, ≥40 min runtime)
- Extracts top 30 billed actors per movie
- Collects character names with deduplication
- Creates bidirectional movie-actor references
- Compresses output to ~2-3 MB gzipped JSON

**Client-Side Loading** (`imdb-loader.ts`):

- Uses browser's native `DecompressionStream` API
- Automatic gzip decompression by server/browser
- Loads ~2-3 MB compressed data efficiently
- Supports 5 word list types:
  1. Random movie titles
  2. Random actor names
  3. Cast from specific movie
  4. Characters from specific movie
  5. Filmography of specific actor

**Data Structure**:

```typescript
interface IMDbData {
	movies: Record<
		string,
		{
			id: string;
			title: string;
			characters: string[];
			actorIds: string[];
		}
	>;
	actors: Record<
		string,
		{
			id: string;
			name: string;
			movieIds: string[];
		}
	>;
}
```

## Development Phases

### Phase 1: Foundation ✅ Completed

- [x] Set up project structure and shared components
- [x] Implement theme system and user preferences
- [x] Create word list processing and management
- [x] Build home page with game selection
- [x] Set up GitHub Actions for deployment
- [x] Process dictionary data from SCOWL, Webster's, CMU
- [x] Create game configuration system
- [x] Integrate external APIs (Wikipedia, Wiktionary)
- [x] Process and compress IMDb datasets

### Phase 2: Core Games ✅ Completed

- [x] Implement Guess the Word game
- [x] Create Guess the Word configuration page
- [x] Implement Word Search game
- [x] Create Word Search configuration page
- [x] Add difficulty selection system
- [x] Create shared game layout components
- [x] Implement Wikipedia word list integration
- [x] Implement IMDb word list integration
- [x] Build interactive Dictionary tool

### Phase 3: Advanced Games (In Progress)

- [ ] Implement Bag of Letters game
- [ ] Implement Typing Challenge game
- [ ] Implement Rhyme Thyme game
- [ ] Add comprehensive testing

### Phase 4: Polish & Enhancement (Planned)

- [ ] Accessibility audit and improvements
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Documentation and deployment guide

## Future Expansion Ideas

### Completed Enhancements ✅

- **Configuration Pages**: ✅ Pre-game customization for Guess the Word and Word Search
- **Theme Packs**: ✅ Wikipedia and IMDb-based word lists
- **Custom Difficulty**: ✅ User-defined challenge parameters via config pages
- **Game Variants**: ✅ Multiple word lengths, game modes, grid sizes
- **Click Attribution**: ✅ Source links for themed word lists

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
- **More Theme Packs**: Additional seasonal or topical word sets
- **Sound Effects**: Optional audio feedback (toggle-able)
- **Animations**: ✅ Smooth transitions (partially implemented)
- **Statistics Dashboard**: Track performance across all games
- **Achievement System**: Unlock badges for milestones
- **Puzzle Sharing**: Export puzzle configurations to share with friends

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

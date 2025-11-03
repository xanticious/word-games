# Wiktionary Integration & Word History Feature

## Overview

This update adds Wiktionary API integration for fallback definitions and implements a word history feature in the Wordle game's definition panel.

## Changes Made

### 1. Dictionary Library Updates (`src/lib/dictionary.ts`)

#### New Interface: `WiktionaryDefinition`

```typescript
export interface WiktionaryDefinition {
	partOfSpeech: string;
	language: string;
	definitions: Array<{
		definition: string;
		examples?: string[];
		parsedExamples?: Array<{ example: string }>;
	}>;
}
```

#### New Private Method: `fetchFromWiktionary(word: string)`

- Fetches definitions from Wiktionary REST API
- Endpoint: `https://en.wiktionary.org/api/rest_v1/page/definition/{word}`
- Strips HTML tags from definitions
- Returns parsed `DefinitionEntry` or `null`

#### New Public Method: `getDefinitionWithFallback(word: string)`

- First checks local dictionary definitions
- If not found, falls back to Wiktionary API
- Returns a `Promise<DefinitionEntry | null>`

### 2. WordDefinitionPanel Component Updates (`src/lib/games/wordle/WordDefinitionPanel.svelte`)

#### New Props

- `guessedWords?: string[]` - Array of all guessed words from the current game

#### New State Management

```typescript
interface WordHistoryEntry {
	word: string;
	definition: DefinitionEntry | null;
	isLoading: boolean;
	error: string;
	isTarget?: boolean; // Marks the target word with a star
}
```

- `wordHistory` - Array of last 10 words (guesses + target)
- `expandedWordIndex` - Index of currently expanded word (accordion behavior)
- `dictionary` - Singleton dictionary instance

#### Features

1. **Word History Tracking**
   - Shows last 10 words (most recent first)
   - Includes all guessed words + target word
   - Target word marked with ★ badge

2. **Accordion UI**
   - Most recent word expanded by default
   - Click to expand/collapse any word
   - Only one word expanded at a time
   - Smooth animations

3. **Async Definition Loading**
   - Loads definitions asynchronously for each word
   - Uses Wiktionary fallback if local definition not found
   - Shows loading spinner while fetching
   - Graceful error handling

4. **UI Improvements**
   - Numbered badges for guessed words
   - Star badge (★) for target word
   - Scrollable word history
   - Shows up to 3 definitions per word (with count for more)
   - Part of speech badges
   - Pronunciation display

### 3. WordleGame Component Updates (`src/lib/games/wordle/WordleGame.svelte`)

#### Updated Props for WordDefinitionPanel

```svelte
<WordDefinitionPanel
	targetWord={gameState.targetWord}
	gameStatus={gameState.gameStatus}
	isVisible={gameState.isCompleted && !isFullscreen}
	guessedWords={gameState.guesses
		.filter((g: any) => g.isSubmitted)
		.map((g: any) => g.word)}
/>
```

Now passes submitted guessed words to the definition panel.

## Usage Example

When playing Wordle:

1. Make guesses: "ROATE", "VIXEN", "PRISM" (target)
2. Game completes (won/lost)
3. Side panel shows:
   - **PRISM** ★ (expanded by default) - Target word with full definition
   - **VIXEN** #2 (collapsed) - Click to expand
   - **ROATE** #3 (collapsed) - Click to expand

## API Integration

### Wiktionary REST API

- **Base URL**: `https://en.wiktionary.org/api/rest_v1/page/definition/`
- **Example**: `https://en.wiktionary.org/api/rest_v1/page/definition/human`
- **Response**: JSON with language-specific definitions
- **Filtering**: Extracts only English definitions
- **Cleaning**: Strips HTML tags from definition text

### Error Handling

- Returns `null` if word not found
- Logs errors to console
- Shows user-friendly error messages in UI
- Falls back gracefully to local definitions

## Benefits

1. **Comprehensive Coverage**: Falls back to Wiktionary for words not in local dictionary
2. **Educational**: Players can learn definitions of all guessed words
3. **User Experience**: Accordion UI makes it easy to browse word history
4. **Performance**: Async loading prevents UI blocking
5. **Visual Feedback**: Clear indicators for target word vs. guesses

## Future Enhancements

Possible improvements:

- Cache Wiktionary results in browser storage
- Show pronunciation audio from Wiktionary
- Display word etymology
- Add synonyms/antonyms
- Export word history

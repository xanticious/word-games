# Guess the Word - Configuration Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding configurable game modes to the "Guess the Word" (Wordle-style) game. The configuration page (`/guess-the-word-config`) allows users to customize their gameplay experience with 5 key settings.

---

## Configuration Options Overview

| Setting          | Options      | Current Status        | Complexity |
| ---------------- | ------------ | --------------------- | ---------- |
| **Target Words** | Common / All | Not implemented       | Medium     |
| **Word Length**  | 1-7 letters  | Hardcoded to 5        | High       |
| **Hard Mode**    | On / Off     | Partially implemented | Low        |
| **Rescue Mode**  | On / Off     | Not implemented       | Medium     |
| **Easy Mode**    | On / Off     | Not implemented       | High       |

---

## Design Decisions (CONFIRMED)

### ✅ 1. Target Words Definition

**Decision**: Use curated common words list from project dictionaries

**Implementation**:

- **"Common" mode**: Use `dictionaries/common-5-letter-guess-words.txt` for both guesses and targets
- **"All" mode**: Use full dictionary word list (all valid English words)

**Source**: Curated list from `dictionaries/common-5-letter-guess-words.txt` (alphabetically sorted)

**Future**: Create common word lists for other lengths (4-letter, 6-letter, 7-letter) as needed

**Files to create**:

- `src/lib/data/common-words-5.ts` - Common 5-letter words (from common-5-letter-guess-words.txt)
- `src/lib/data/all-words-5.ts` - All valid 5-letter words (from full dictionary)

---

### ✅ 2. Word Length Variability

**Decision**: **DEFERRED TO PHASE 2**

**Rationale**:

- Requires major architectural changes (grid layout, keyboard, mobile UX)
- Phase 1 focuses on configuration features with 5-letter words only
- Phase 2 will be separate epic for variable word length

**Current scope**: Keep word length locked to 5 letters

---

### ✅ 3. Rescue Mode Behavior

**Decision**: **Option A - Auto-submit first guess**

**Rationale**:

- Prevents boring repetition of same opening moves
- Forces players to adapt strategy based on first guess results
- Makes gameplay more interesting and varied

**Implementation**:

```typescript
// 1. First game: Random word from starter list
// 2. Subsequent games: Use previous round's target word
// 3. Auto-submit (no user action required)
```

**Persistence**:

- Store previous target word in game history (already tracking previous rounds)
- Fallback: Random starter word if no history exists

**Hard Mode Compatibility**:

- ✅ COMPATIBLE - No hard mode restrictions apply to first guess (no clues exist yet)

---

### ✅ 4. Easy Mode - Candidate List Display

**Decision**: Left side panel, showing ALL matching words

**Implementation**:

- **Position**: Left side panel (definition panel stays on right)
- **Content**: ALL possible words matching current clues
- **Filtering**: Respects "common/uncommon" setting from targetWords config
- **Update trigger**: Only after submitting a guess (not live typing)
- **Reset**: Clears when starting new round

**Layout**:

```
[Candidate Panel (left)] [Game Grid (center)] [Definition Panel (right)]
```

**Mobile**: Stack panels vertically or use tabs

---

### ✅ 5. Mode Compatibility Matrix

**Decision**: All modes are FULLY COMPATIBLE

| Combination   | Compatible? | Notes                                       |
| ------------- | ----------- | ------------------------------------------- |
| Hard + Easy   | ✅ Yes      | Easy mode makes it easier, but no conflicts |
| Hard + Rescue | ✅ Yes      | First guess has no hard mode restrictions   |
| Easy + Rescue | ✅ Yes      | No conflicts                                |
| All three     | ✅ Yes      | Fully compatible                            |

**UI Note**: No warnings needed - all combinations work together

---

### ✅ 6. Configuration Persistence

**Decision**: Config page + localStorage memory

**Flow**:

1. User visits `/guess-the-word-config`
2. Config page loads previous settings from localStorage (if exists)
3. User modifies settings
4. Click "Play" → Settings saved to localStorage + passed via URL params
5. Game page reads settings from URL params
6. Next visit to config page shows last-used settings

**Fallback**: Direct navigation to `/guess-the-word` without params uses localStorage defaults

```typescript
interface GuessTheWordSettings {
	targetWords: 'common' | 'all';
	wordLength: number; // Always 5 for Phase 1
	hardMode: boolean;
	rescueMode: boolean;
	easyMode: boolean;
}
```

---

## Implementation Plan

### Phase 1: Foundation & Data Setup (3-4 hours)

#### Task 1.1: Create Word List Modules

**Files**:

- `src/lib/data/common-words-5.ts` (NEW)
- `src/lib/data/all-words-5.ts` (NEW)

**Action**: Convert dictionary files to TypeScript modules

**File Structure**:

```typescript
// common-words-5.ts
// Source: dictionaries/common-5-letter-guess-words.txt
export const COMMON_WORDS_5: string[] = [
	'aback',
	'abase',
	'abate',
	// ... common 5-letter words from curated list
	'zonal'
];

// all-words-5.ts
// Source: Generated from full dictionary (words_alpha.txt filtered to 5 letters)
export const ALL_WORDS_5: string[] = [
	'aahed',
	'aalii',
	'aargh',
	// ... all valid 5-letter English words
	'zymes'
];
```

**How to generate**:

1. Read `dictionaries/common-5-letter-guess-words.txt` (already sorted)
2. Convert to TypeScript array format
3. For ALL_WORDS_5, use existing dictionary processing script to extract all 5-letter words
4. Both lists should be lowercase and sorted alphabetically

---

#### Task 1.2: Update Type Definitions

**File**: `src/lib/games/wordle/types.ts`

```typescript
// Add new config options to WordleConfig
export interface WordleConfig {
	wordLength: number;
	maxGuesses: number;
	hardMode: boolean;
	difficulty: 'easy' | 'medium' | 'hard';

	// NEW ADDITIONS
	targetWords: 'common' | 'all'; // Filter word pool
	rescueMode: boolean; // Auto-fill first guess
	easyMode: boolean; // Show candidate list
}

// Update WordleGameProps
export interface WordleGameProps {
	difficulty?: 'easy' | 'medium' | 'hard';
	hardMode?: boolean;

	// NEW ADDITIONS
	targetWords?: 'common' | 'all';
	rescueMode?: boolean;
	easyMode?: boolean;

	onGameComplete?: (result: WordleResult) => void;
	onGameExit?: () => void;
}

// New type for candidate words (Easy Mode)
export interface WordleCandidate {
	word: string;
	matchScore: number; // How well it fits known clues
}
```

#### Task 1.3: Create Settings Store

**File**: `src/lib/stores/guessTheWordSettings.ts` (NEW)

```typescript
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface GuessTheWordSettings {
	targetWords: 'common' | 'all';
	wordLength: number;
	hardMode: boolean;
	rescueMode: boolean;
	easyMode: boolean;
}

const STORAGE_KEY = 'guess-the-word-settings';

const defaultSettings: GuessTheWordSettings = {
	targetWords: 'common',
	wordLength: 5,
	hardMode: false,
	rescueMode: false,
	easyMode: false
};

function createSettingsStore() {
	// Load from localStorage
	const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const initial = stored ? JSON.parse(stored) : defaultSettings;

	const { subscribe, set, update } = writable<GuessTheWordSettings>(initial);

	return {
		subscribe,
		set: (value: GuessTheWordSettings) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update: (updater: (value: GuessTheWordSettings) => GuessTheWordSettings) => {
			update((value) => {
				const updated = updater(value);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultSettings);
		}
	};
}

export const guessTheWordSettings = createSettingsStore();

// No warnings needed - all modes are compatible!
```

#### Task 1.4: Update Configuration Page

**File**: `src/routes/guess-the-word-config/+page.svelte`

**Changes**:

1. Import and use `guessTheWordSettings` store
2. Load settings on mount from store (persisted from previous session)
3. Save settings when "Play" is clicked
4. Pass settings as URL params to game page

```typescript
import { guessTheWordSettings, settingsWarnings } from '$lib/stores/guessTheWordSettings.js';

// Bind to store instead of local state
let settings = $state($guessTheWordSettings);

// Save on play
function handlePlay() {
	guessTheWordSettings.set(settings);

	const params = new URLSearchParams({
		targetWords: settings.targetWords,
		wordLength: settings.wordLength.toString(),
		hardMode: settings.hardMode.toString(),
		rescueMode: settings.rescueMode.toString(),
		easyMode: settings.easyMode.toString()
	});
	goto(`${base}/guess-the-word?${params.toString()}`);
}
```

---

### Phase 2: Game Logic Implementation (5-7 hours)

#### Task 2.1: Update Word Selection & Validation Logic

**File**: `src/lib/games/wordle/game.ts`

**Changes Required**:

1. **Import wordlists**:

```typescript
import { COMMON_WORDS_5 } from '$lib/data/common-words-5.js';
import { ALL_WORDS_5 } from '$lib/data/all-words-5.js';
```

2. **Replace `selectTargetWord()` method**:

```typescript
private async selectTargetWord(): Promise<string> {
  // NEW: Use project wordlists instead of dictionary
  let candidateWords: string[];

  if (this.config.targetWords === 'common') {
    // Use curated list of common words (for both guesses and targets)
    candidateWords = COMMON_WORDS_5;
  } else {
    // Use all valid words from dictionary
    candidateWords = ALL_WORDS_5;
  }

  // Random selection
  const selectedWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
  return selectedWord.toLowerCase();
}
```

3. **Update word validation** (in `submitGuess()` method):

```typescript
// Replace current dictionary validation:
// if (!this.dictionary.isValidWord(this.state.currentGuess)) {

// With wordlist validation:
const validWords = this.config.targetWords === 'common' ? COMMON_WORDS_5 : ALL_WORDS_5;
if (!validWords.includes(this.state.currentGuess)) {
	return { success: false, message: 'Not in word list' };
}
```

**Note**: For "common" mode, use the same list for both validation and targets. For "all" mode, use the full dictionary word list.

#### Task 2.2: Implement Rescue Mode

**File**: `src/lib/games/wordle/game.ts`

**New Method**:

```typescript
private applyRescueMode(): void {
  if (!this.config.rescueMode) return;

  // Get previous round's target word from game results history
  // (gameResults store already tracks previous games)
  const prevWord = this.getPreviousTargetWord();

  let firstGuess: string;

  const validWords = this.config.targetWords === 'common' ? COMMON_WORDS_5 : ALL_WORDS_5;

  if (prevWord && validWords.includes(prevWord)) {
    // Use previous target as first guess
    firstGuess = prevWord;
  } else {
    // First game - pick random word from valid word list
    const randomIndex = Math.floor(Math.random() * validWords.length);
    firstGuess = validWords[randomIndex];
  }

  // Auto-fill letters
  for (const letter of firstGuess) {
    this.addLetter(letter);
  }

  // Auto-submit the first guess
  this.submitGuess();
}

private getPreviousTargetWord(): string | null {
  // Access game results from store
  // This assumes we have access to gameResults store
  // Implementation depends on how we structure the component
  // For now, return null - will be implemented in component integration
  return null;
}
```

**Update `initialize()` method**:

```typescript
async initialize(): Promise<void> {
  if (this.initialized) return;

  try {
    const targetWord = await this.selectTargetWord();
    this.state.targetWord = targetWord;
    this.state.isActive = true;
    this.initialized = true;

    // NEW: Apply rescue mode if enabled (AFTER initialization)
    this.applyRescueMode();
  } catch (error) {
    console.error('Failed to initialize Wordle game:', error);
    throw error;
  }
}
```

**Note**: Previous target word will be retrieved from gameResults store in the component, then passed to game instance.

#### Task 2.3: Implement Easy Mode - Candidate Finder

**File**: `src/lib/games/wordle/game.ts`

**New Method**:

```typescript
/**
 * Get list of valid candidate words based on current clues (for Easy Mode)
 */
getCandidateWords(): WordleCandidate[] {
  if (!this.config.easyMode) return [];

  // NEW: Use project wordlists instead of dictionary
  let allWords: string[];

  if (this.config.targetWords === 'common') {
    // Filter candidates by common words only
    allWords = COMMON_WORDS_5;
  } else {
    // Use all valid words from dictionary
    allWords = ALL_WORDS_5;
  }

  const candidates: WordleCandidate[] = [];

  // Extract constraints from previous guesses
  const mustHaveLetters = new Set<string>();
  const mustNotHaveLetters = new Set<string>();
  const positionConstraints = new Map<number, string>(); // position -> must be this letter
  const positionExclusions = new Map<number, Set<string>>(); // position -> cannot be these letters

  // Analyze submitted guesses
  for (const guess of this.state.guesses) {
    if (!guess.isSubmitted) continue;

    for (let i = 0; i < guess.letters.length; i++) {
      const { letter, state } = guess.letters[i];

      if (state === 'correct') {
        positionConstraints.set(i, letter);
        mustHaveLetters.add(letter);
      } else if (state === 'present') {
        mustHaveLetters.add(letter);
        if (!positionExclusions.has(i)) {
          positionExclusions.set(i, new Set());
        }
        positionExclusions.get(i)!.add(letter);
      } else if (state === 'absent') {
        // Only exclude if letter doesn't appear in correct/present elsewhere
        // (handles duplicate letters correctly)
        if (!mustHaveLetters.has(letter)) {
          mustNotHaveLetters.add(letter);
        }
      }
    }
  }

  // Filter words by constraints
  for (const word of allWords) {
    let isValid = true;
    let matchScore = 0;

    // Check must-have letters
    for (const letter of mustHaveLetters) {
      if (!word.includes(letter)) {
        isValid = false;
        break;
      }
      matchScore += 10;
    }

    if (!isValid) continue;

    // Check must-not-have letters
    for (const letter of mustNotHaveLetters) {
      if (word.includes(letter)) {
        isValid = false;
        break;
      }
    }

    if (!isValid) continue;

    // Check position constraints (green letters)
    for (const [pos, letter] of positionConstraints) {
      if (word[pos] !== letter) {
        isValid = false;
        break;
      }
      matchScore += 20;
    }

    if (!isValid) continue;

    // Check position exclusions (yellow letters - must NOT be in this position)
    for (const [pos, excludedLetters] of positionExclusions) {
      if (excludedLetters.has(word[pos])) {
        isValid = false;
        break;
      }
      matchScore += 5;
    }

    if (isValid) {
      candidates.push({ word, matchScore });
    }
  }

  // Sort by match score (best matches first)
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  // Don't limit - show ALL matching candidates
  return candidates;
}
```

**Update `getState()` method**:

```typescript
getState(): WordleState & { candidates?: WordleCandidate[] } {
  const baseState = { ...this.state };

  if (this.config.easyMode) {
    return {
      ...baseState,
      candidates: this.getCandidateWords()
    };
  }

  return baseState;
}
```

---

### Phase 3: UI Components (3-4 hours)

#### Task 3.1: Create Easy Mode Candidate Panel

**File**: `src/lib/games/wordle/CandidateWordsPanel.svelte` (NEW)

```svelte
<script lang="ts">
	import type { WordleCandidate } from './types.js';

	let {
		candidates = [],
		isVisible = true
	}: {
		candidates: WordleCandidate[];
		isVisible: boolean;
	} = $props();

	let isOpen = $state(true);
	let searchFilter = $state('');

	// Filter candidates by search
	const filteredCandidates = $derived(
		searchFilter
			? candidates.filter((c) => c.word.includes(searchFilter.toLowerCase()))
			: candidates
	);
</script>

{#if isVisible}
	<div class="candidate-panel">
		<div class="panel-header">
			<h3>Valid Words ({candidates.length})</h3>
			<button onclick={() => (isOpen = !isOpen)} class="toggle-btn">
				{isOpen ? '◀' : '▶'}
			</button>
		</div>

		{#if isOpen}
			{#if candidates.length === 0}
				<div class="empty-state">
					<p>Start guessing to see possible words!</p>
				</div>
			{:else}
				<div class="search-box">
					<input
						type="text"
						bind:value={searchFilter}
						placeholder="Filter words..."
						class="search-input"
					/>
				</div>

				<div class="candidate-list">
					{#each filteredCandidates as candidate}
						<div class="candidate-word">
							{candidate.word}
						</div>
					{/each}

					{#if filteredCandidates.length === 0 && searchFilter}
						<div class="no-results">
							No words match "{searchFilter}"
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.candidate-panel {
		position: fixed;
		left: 0; /* LEFT side panel */
		top: 0;
		width: 280px;
		height: 100vh;
		background: var(--background);
		border-right: 1px solid var(--border);
		overflow: hidden;
		z-index: 100;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--background);
	}

	.panel-header h3 {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
	}

	.toggle-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		font-size: 1.2rem;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--muted-foreground);
	}

	.search-box {
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.search-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--background);
		font-size: 0.9rem;
	}

	.candidate-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.candidate-word {
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: var(--muted);
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9rem;
		text-transform: uppercase;
	}

	.no-results {
		padding: 1rem;
		text-align: center;
		color: var(--muted-foreground);
		font-size: 0.9rem;
	}

	@media (max-width: 1024px) {
		.candidate-panel {
			left: 0;
			right: 0;
			width: 100%;
			height: auto;
			max-height: 40vh;
			bottom: 0;
			top: auto;
			border-right: none;
			border-top: 1px solid var(--border);
		}

		.panel-header {
			flex-direction: row-reverse;
		}

		.toggle-btn {
			transform: rotate(90deg);
		}
	}
</style>
```

#### Task 3.2: Update Main Game Component

**File**: `src/lib/games/wordle/WordleGame.svelte`

**Changes**:

1. Accept new config props (including previousTargetWord for rescue mode)
2. Pass to WordleGame constructor
3. Conditionally render CandidateWordsPanel
4. Adjust layout margins for left side panel

```svelte
<script lang="ts">
	import { gameResults } from '$lib/stores/gameHistory.js';
	import CandidateWordsPanel from './CandidateWordsPanel.svelte';

	let {
		difficulty = 'medium',
		hardMode = false,
		targetWords = 'common',
		rescueMode = false,
		easyMode = false,
		onGameComplete,
		onGameExit
	}: WordleGameProps = $props();

	// Get previous target word from game history for rescue mode
	function getPreviousTargetWord(): string | null {
		const history = $gameResults;
		const wordleGames = history.filter((r) => r.gameId === 'wordle');

		if (wordleGames.length === 0) return null;

		// Get most recent game's target word
		const lastGame = wordleGames[wordleGames.length - 1];
		return lastGame.details?.targetWord || null;
	}

	// Initialize game
	onMount(async () => {
		try {
			game = new WordleGame({
				wordLength: 5,
				maxGuesses: 6,
				hardMode,
				difficulty,
				targetWords,
				rescueMode,
				easyMode
			});

			await game.initialize();

			// AFTER initialization, apply rescue mode if enabled
			if (rescueMode) {
				const prevWord = getPreviousTargetWord();
				game.applyRescueModeWithWord(prevWord); // New method to pass previous word
			}

			gameState = game.getState();
			isLoading = false;
		} catch (error) {
			console.error('Failed to initialize Wordle:', error);
			errorMessage = 'Failed to load the game. Please try again.';
			isLoading = false;
		}
	});

	// ... rest of component
</script>

<!-- Add candidate panel -->
{#if easyMode && gameState}
	<CandidateWordsPanel candidates={gameState.candidates || []} isVisible={true} />
{/if}

<style>
	.wordle-game {
		max-width: 100%;
		height: 100%;
		transition: margin 0.3s ease-in-out;
	}

	/* Adjust for candidate panel on LEFT */
	.wordle-game.has-candidate-panel {
		margin-left: 280px;
	}

	/* Definition panel on RIGHT (existing) */
	.wordle-game.has-side-panel {
		margin-right: 320px;
	}

	/* Both panels */
	.wordle-game.has-candidate-panel.has-side-panel {
		margin-left: 280px;
		margin-right: 320px;
	}

	@media (max-width: 1024px) {
		.wordle-game.has-candidate-panel,
		.wordle-game.has-side-panel,
		.wordle-game.has-candidate-panel.has-side-panel {
			margin-left: 0;
			margin-right: 0;
			margin-bottom: 40vh; /* Stack panels at bottom */
		}
	}
</style>
```

**Note**: Need to refactor `applyRescueMode()` to accept previous word as parameter (not access from component)

#### Task 3.3: Update Game Route Page

**File**: `src/routes/guess-the-word/+page.svelte`

**Changes**:

1. Read URL params or localStorage settings
2. Pass all settings to WordleGame component

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { guessTheWordSettings } from '$lib/stores/guessTheWordSettings.js';

	// Read from URL params or fallback to store
	const params = $page.url.searchParams;

	const targetWords =
		(params.get('targetWords') as 'common' | 'all') || $guessTheWordSettings.targetWords;
	const hardMode = params.get('hardMode') === 'true' || $guessTheWordSettings.hardMode;
	const rescueMode = params.get('rescueMode') === 'true' || $guessTheWordSettings.rescueMode;
	const easyMode = params.get('easyMode') === 'true' || $guessTheWordSettings.easyMode;
	const wordLength = parseInt(params.get('wordLength') || '5') || $guessTheWordSettings.wordLength;
</script>

<GameLayout config={gameConfig} onGameExit={handleGameExit}>
	<WordleGame
		difficulty="medium"
		{hardMode}
		{targetWords}
		{rescueMode}
		{easyMode}
		onGameComplete={handleGameComplete}
		onGameExit={handleGameExit}
	/>
</GameLayout>
```

---

### Phase 4: Variable Word Length (DEFERRED - Phase 2)

This is a major architectural change that affects:

- Grid layout (dynamic columns)
- Keyboard scaling
- Dictionary filtering
- Mobile responsiveness
- Guess validation
- Max guesses calculation (longer words = more guesses?)

**Recommendation**: Defer to separate implementation phase after core features are stable.

**Estimated Complexity**: 8-12 hours

---

## Testing Plan

### Unit Tests

#### Test File: `src/lib/games/wordle/game.test.ts`

```typescript
describe('WordleGame Configuration', () => {
	describe('Target Words Setting', () => {
		test('common mode excludes hard difficulty words', async () => {
			const game = new WordleGame({
				targetWords: 'common',
				difficulty: 'medium'
				// ... other config
			});
			await game.initialize();
			const state = game.getState();

			// Verify target word is not in 'hard' difficulty
			// (need to add helper method to check word difficulty)
		});

		test('all mode includes all difficulty words', async () => {
			// Similar test for 'all' mode
		});
	});

	describe('Rescue Mode', () => {
		test('pre-fills first guess on initialization', async () => {
			const game = new WordleGame({
				rescueMode: true
				// ... other config
			});
			await game.initialize();
			const state = game.getState();

			expect(state.currentGuess).toBeTruthy();
			expect(state.currentGuess.length).toBe(5);
		});

		test('uses previous target as first guess', async () => {
			// Set localStorage with previous target
			localStorage.setItem('wordle-prev-target', 'crane');

			const game = new WordleGame({ rescueMode: true });
			await game.initialize();
			const state = game.getState();

			expect(state.currentGuess).toBe('crane');
		});
	});

	describe('Easy Mode', () => {
		test('returns candidate words after guess', async () => {
			const game = new WordleGame({ easyMode: true });
			await game.initialize();

			// Submit a guess
			game.addLetter('a');
			game.addLetter('d');
			game.addLetter('i');
			game.addLetter('e');
			game.addLetter('u');
			game.submitGuess();

			const state = game.getState();
			expect(state.candidates).toBeDefined();
			expect(state.candidates.length).toBeGreaterThan(0);
		});

		test('candidates respect letter constraints', async () => {
			// More complex test verifying constraint logic
		});
	});

	describe('Hard Mode', () => {
		test('enforces using revealed hints', () => {
			// Existing hard mode tests
		});
	});
});
```

### Integration Tests

#### Test File: `src/routes/guess-the-word/page.svelte.spec.ts`

```typescript
describe('Guess the Word Configuration Flow', () => {
	test('navigates from config page to game with settings', async () => {
		// Render config page
		// Select options
		// Click Play
		// Verify game page receives correct settings
	});

	test('displays warnings for incompatible modes', () => {
		// Enable Hard Mode + Easy Mode
		// Verify warning is displayed
	});

	test('persists settings to localStorage', () => {
		// Configure settings
		// Verify localStorage updated
		// Refresh page
		// Verify settings loaded from localStorage
	});
});
```

### Manual Testing Checklist

- [ ] Config page loads default settings
- [ ] Config page saves settings to localStorage
- [ ] Config page displays warnings for incompatible modes
- [ ] Game page reads settings from URL params
- [ ] Game page falls back to localStorage if no URL params
- [ ] Target Words: "common" mode excludes hard words
- [ ] Target Words: "all" mode includes all words
- [ ] Hard Mode enforces clue constraints
- [ ] Rescue Mode pre-fills first guess (not auto-submitted)
- [ ] Rescue Mode uses previous target in subsequent rounds
- [ ] Easy Mode displays candidate words panel
- [ ] Easy Mode candidate list updates after each guess
- [ ] Easy Mode candidate list respects constraints
- [ ] Mobile layout adapts for side panels
- [ ] Fullscreen mode hides side panels appropriately

---

## Rollout Strategy

### Milestone 1: Core Infrastructure (Week 1)

- Phase 1 complete (types, store, config page updates)
- Settings persistence working
- URL param passing working

### Milestone 2: Game Features (Week 2)

- Phase 2 complete (target words, rescue mode, easy mode logic)
- Unit tests passing
- Basic integration tests passing

### Milestone 3: UI/UX Polish (Week 3)

- Phase 3 complete (UI components, panels, layout)
- Mobile responsive
- All manual tests passing

### Milestone 4: Launch (Week 4)

- User acceptance testing
- Performance optimization
- Documentation complete
- Deploy to production

---

## Known Issues & Limitations

### Current Limitations

1. **Word Length**: Locked to 5 letters (requires separate refactor)
2. **Dictionary Coverage**: "Common" vs "All" uses difficulty heuristic (not true frequency)
3. **Mobile UX**: Multiple side panels may be cramped on mobile
4. **Performance**: Candidate word calculation may be slow for large word lists

### Future Enhancements

1. Variable word length support (Phase 2)
2. Improved "common" word detection using actual frequency data
3. Animated panel transitions
4. Candidate word search/filter
5. Game statistics tracking per configuration
6. Shareable game links with embedded config

---

## Success Metrics

### Technical Metrics

- ✅ All unit tests passing (>90% coverage)
- ✅ All integration tests passing
- ✅ No regression in existing functionality
- ✅ Page load time < 2 seconds
- ✅ Candidate word calculation < 100ms

### User Experience Metrics

- 🎯 Configuration completion rate > 80%
- 🎯 Easy Mode adoption rate > 30%
- 🎯 Hard Mode adoption rate > 15%
- 🎯 Rescue Mode adoption rate > 20%
- 🎯 Average game completion rate increase by 10%

---

## Implementation Ready - All Decisions Confirmed ✅

All design decisions have been confirmed and clarified:

1. ✅ **Target Words**: Hardcoded wordlists from official Wordle (VALID_GUESSES + VALID_TARGETS)
2. ✅ **Word Length**: Deferred to Phase 2 - keep 5 letters only for now
3. ✅ **Rescue Mode**: Auto-submit first guess (Option A)
4. ✅ **Easy Mode**: Left side panel showing ALL matching candidates (filtered by common/all setting)
5. ✅ **Compatibility**: All modes fully compatible - no warnings needed
6. ✅ **Persistence**: localStorage + URL params (config page remembers last settings)

---

## Implementation Timeline

| Phase                      | Duration        | Assignee | Status           |
| -------------------------- | --------------- | -------- | ---------------- |
| Phase 1: Foundation & Data | 3-4 hours       | TBD      | � Ready to Start |
| Phase 2: Game Logic        | 5-7 hours       | TBD      | 🔴 Not Started   |
| Phase 3: UI Components     | 3-4 hours       | TBD      | 🔴 Not Started   |
| Testing & QA               | 2-3 hours       | TBD      | 🔴 Not Started   |
| **Total**                  | **13-18 hours** |          |                  |

---

## Appendix

### Related Files

- `src/lib/games/wordle/types.ts` - Type definitions
- `src/lib/games/wordle/game.ts` - Game logic
- `src/lib/games/wordle/WordleGame.svelte` - Main component
- `src/routes/guess-the-word-config/+page.svelte` - Config page
- `src/routes/guess-the-word/+page.svelte` - Game route
- `src/lib/dictionary.ts` - Dictionary utilities

### References

- Wordle Original: https://www.nytimes.com/games/wordle/index.html
- Hard Mode Specification: https://www.gamesradar.com/wordle-hard-mode/
- CMU Pronouncing Dictionary: http://www.speech.cs.cmu.edu/cgi-bin/cmudict

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-02  
**Author**: GitHub Copilot  
**Status**: ⚠️ Awaiting Stakeholder Review

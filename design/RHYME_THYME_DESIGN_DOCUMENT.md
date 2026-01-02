# Rhyme Thyme - Design Document

## Project Overview

Rhyme Thyme is a creative word game designed to help players break through writer's block and develop poetic skills in a safe, fun, and uninhibited environment. Players are given the first line of a couplet (sourced from Wikipedia) and race against time to write as many creative second lines as possible.

## Core Philosophy

- **Safe and encouraging**: No penalties, only rewards
- **Fast-paced**: Prevent overthinking through time pressure
- **Educational**: Unconsciously learn stress patterns, rhyme schemes, and poetic devices
- **Judgment-free**: Silly, nonsense, and serious rhymes are all celebrated
- **Positive reinforcement**: Detailed scoring breakdowns show what you did well

## Game Concept

### The Challenge

Players receive a Wikipedia-sourced prompt (first line of a couplet, 3-6 words) and have **3 minutes** to write up to **10 creative second lines** that complete the couplet.

**Example:**

```
Prompt: "Paterwa is a village..."

Player submissions:
- "Known for its spillage"
- "with poisoned foilage"
- "where I was sadge"
- "punched by Bruce Willace"
```

### Time & Pacing

- **Total time**: 3 minutes per round
- **Goal**: 10 completions
- **Average pace**: ~18 seconds per completion
- **Progress bar**: Overwatch 2-style with multiplier ticks
  - 5x, 4x, 3x, 2x, 1x score multipliers
  - Faster completion = higher multipliers
  - Bar fills up as time passes

### Bonus Word Bank

- **5 bonus words** displayed from the same Wikipedia article
- Words must be 4-10 letters, in rhyming dictionary, not in prompt
- **Scoring**:
  - Points per completion that includes a bonus word
  - Variety bonus for using different bonus words across completions
  - Can reuse words without penalty

## Scoring System

### Philosophy

- **No penalties** - only positive reinforcement
- Players earn points for everything they do well
- Detailed breakdowns educate without shaming

### Scoring Categories (Configurable Constants)

#### 1. End Rhyme (Last word of line 1 vs. last syllables of line 2)

- **Perfect Rhyme**: 20 points
  - Last stressed vowel + all following sounds match
  - Example: "delegates" / "liberates"
- **Slant Rhyme**: 15 points
  - Phonetic similarity score (lenient)
- **Near Rhyme**: 10 points
  - Partial phonetic match
- **No Rhyme**: 5 points
  - Participation credit

**Technical note**: Compare last word of line 1 with last N syllables of line 2 (where N = syllable count of last word in line 1). Can span multiple words.

#### 2. Internal Rhymes (Perfect/Slant only)

- **Triple or more**: +10 points
- **Pair**: +5 points

Example: "Karavan was a hard rock band / that slipped and fell in quicksand"

- Internal rhyme: "Karavan - band - and - quicksand" (quadruple)

#### 3. Syllable Count Match

Linear scale based on difference from prompt:

- **0 difference (exact match)**: +10 points
- **1 syllable off**: +8 points
- **2 syllables off**: +6 points
- **3 syllables off**: +4 points
- **4 syllables off**: +2 points
- **5+ syllables off**: 0 points

#### 4. Stress Pattern Match

- Use Levenshtein distance on stress sequences
- Scale from **+20 (perfect)** to **+5 (poor)**
- Visual display: ●○○ (large=stressed, medium=secondary, small=unstressed)

Example:

```
Line 1: ●○○●○●○●
Line 2: ○●○●○●○○
```

#### 5. Alliteration

Extract all consonant sounds using IPA notation, count matches across lines.

- Points based on frequency (configurable)

Example: Triple "k" sound in "Karavan - rock - quicksand" = +3

#### 6. Consonance

Extract all vowel sounds using IPA notation, count matches across lines.

- Points based on frequency (configurable)

Example: Quintuple "a" sound across couplet = +3

#### 7. Word Bank Bonus

- **Per completion**: Points if completion includes a bonus word
- **Variety bonus**: Points based on how many different bonus words used (e.g., 4/5 used = bonus)

### Score Calculation

```
Completion Score = End Rhyme + Internal Rhymes + Syllables + Stress + Alliteration + Consonance + Word Bank

Round Score = (Sum of all Completion Scores) × Time Multiplier + Variety Bonus
```

### Multiple Pronunciations

When CMU dictionary has multiple pronunciations, always use the one most favorable to the player (results in highest points).

## Technical Implementation

### Phonetic Analysis Engine

#### Data Source

- CMU Pronouncing Dictionary (already integrated)
- IPA phonetic notation for consonant/vowel extraction

#### End Rhyme Detection

```typescript
// Pseudo-algorithm
1. Get last word of line 1 (e.g., "delegates" = 3 syllables)
2. Extract last 3 syllables from line 2 (can span words)
3. Get phonetic representation from CMU dict
4. If multiple pronunciations, try all, use best score
5. Compare:
   - Perfect: Last stressed vowel + all following sounds identical
   - Slant: Calculate phonetic distance/similarity
   - Score accordingly
```

#### Syllable Counting

Count vowel phonemes in CMU phonetic data (phonemes with stress markers 0, 1, or 2).

#### Stress Pattern Extraction

- Extract stress values: 0=unstressed, 1=primary, 2=secondary
- Build sequence for each line
- Use Levenshtein distance to compare
- Normalize to 20-5 point scale

#### Alliteration & Consonance

```typescript
// Convert each line to phonetic counter objects

Example: "Coca Cola"

Consonants: {
  "k": 3,
  "l": 1
}

Vowels: {
  "oʊ": 1,  // open o
  "oː": 1,  // closed o
  "ə": 2    // schwa
}

// Compare counters across lines, award points for matches
```

### Wikipedia Integration

#### Prompt Generation

1. Fetch random Wikipedia article (use existing API integration)
2. Break article into sentences
3. Extract first 3-6 words from each sentence as candidates
4. Validate each candidate:
   - Last word must not be filler (for, the, a, an, of, with, to, in, on, at, by, from)
   - Filter out phrases containing numbers
   - All words must exist in rhyming dictionary
   - Punctuation is acceptable
5. Randomly select from valid candidates
6. If no valid candidates, retry with new articles (try 5-10 articles)
7. If all fail: Show error "Something went wrong, try again later"

#### Bonus Word Selection

1. Extract words from same Wikipedia article as prompt
2. Filter criteria:
   - 4-10 letters long
   - Exists in rhyming dictionary
   - Not in the prompt itself
3. Randomly select 5 words
4. If insufficient words, retry with new article

### Input Validation

#### Character Limit

- **Dynamic**: 2× the prompt character length
- Example: 25-char prompt → 50-char max input
- Validation occurs on submit (Enter key)

#### Validation Rules

When user presses Enter:

1. **Empty input**: "Please enter a line"
2. **Too long**: "Too long"
3. **Invalid word** (not in dictionary): "Sorry, '[word]' is invalid, only well-known English words are allowed"
4. **Exact duplicate**: "You already submitted this line"
5. **Words not in CMU dictionary**: Treat as invalid word error

All errors prevent submission and allow user to edit.

## User Interface Design

### Gameplay Screen

#### Layout Structure

**Top Area:**

- Progress bar with multiplier tick marks (5x, 4x, 3x, 2x, 1x)
- Fills from left to right as time elapses

**Top Right:**

- Skip button (requests new prompt)
- Instructions/Help button (shows rules)

**Center Area:**

- **Prompt**: Large, prominent, friendly font
- **Input box**: Same font, less prominent
  - Border color: Green when end rhyme detected (perfect or slant)
  - Clear after each submission

**Center-Right:**

- **Word Bank**: 5 bonus words displayed as list or badges
- Green checkmark (✓) appears next to words when used

**Hidden During Gameplay:**

- Score (only revealed on results)
- Completion counter

#### Real-time Feedback

**While Typing:**

- Rhyme indicator: Input border turns green when valid end rhyme detected
- Bonus word highlighting: Checkmarks appear in word bank when typed

**On Submit (Enter key):**

- Validation check (errors shown if invalid)
- Particle effect celebration on success
- Clear input box
- Ready for next completion

### Results Screen

#### Overall Structure

1. **Total Round Score** (expandable section)
2. **Podium**: Top 3 completions (gold/silver/bronze outlines)
3. **Honorable Mentions**: Remaining completions
4. **Play Again button**: User-controlled pacing

#### Total Round Score Section

**Collapsed State:**

```
Total Round Score: 37,021 Points
(see details ▼)
```

**Expanded State:**

```
Total Round Score: 37,021 Points

  Sum of Individual Scores: 10,021 pts
  Used Bonus Words: 4/5 (+400 pts)
  Time Multiplier: 4x (×4)
```

#### Completion Cards

**Collapsed State:**

```
[🥇 1st Place]  ← Gold outline for 1st, silver for 2nd, bronze for 3rd

"Karavan was a hard rock band..."
that slipped and fell in quicksand

Completion Score: 69 pts
(Show scoring details ▼)
```

**Expanded State:**

```
[🥇 1st Place]

"Karavan was a hard rock band..."
that slipped and fell in quicksand

End Rhyme: "Perfect Rhyme" (+20)

Internal Rhymes:
  • Quadruple Rhyme - "Karavan - band - and - quicksand" (+10)

Syllables: "Close, 7 instead of 8" (+9)

Alliteration:
  • Triple "k" in "Karavan - rock - quicksand" (+3)

Consonance:
  • Quintuple "a" in "Karavan - band - that - and - quicksand" (+3)

Stress Pattern: "Not Bad" (+2)
  Line 1: ●○○●○●○●
  Line 2: ○●○●○●○○

Word Bank Bonus: None (0)

────────────────────────
Completion Score: 69 pts
```

**Visual Design:**

- Podium cards: Gold/silver/bronze outlines, white backgrounds
- Show both descriptive text and point values
- All collapsed by default, expand individually

## Configuration & Settings

### Game Mode

- **Single mode only** (no difficulty selection)
- Universal scoring formula
- Keeps barrier to entry low

### Accessibility

- Desktop-focused (no mobile optimization)
- Standard keyboard navigation (Tab, Enter, Space)
- No custom shortcuts at this time
- Use global site theme (light/dark/high-contrast)
- No game-specific settings
- No sound effects

### Data Persistence

- **None**: No localStorage
- No high score tracking
- No statistics
- No game history
- Fresh start every session

## User Flow

### Game Start

1. Player navigates to Rhyme Thyme game
2. Loading screen: Fetch Wikipedia articles, generate prompt + bonus words
3. If fetch fails (5-10 retries): Show error, offer retry button
4. When ready: Display gameplay screen

### During Round

1. Progress bar starts filling (3-minute countdown)
2. Player types second line
3. Real-time feedback: Border color, bonus word checkmarks
4. Player presses Enter to submit
5. Validation errors shown if needed, or:
6. Particle effect celebration
7. Input clears
8. Player continues (up to 10 completions)
9. Timer runs out OR player submits 10 completions

### After Round

1. Calculate all scores
2. Display results screen with cards collapsed
3. Player reviews scores at their own pace
4. Click "Play Again" when ready
5. New Wikipedia fetch, return to step 2

### Skip Prompt Flow

1. Player clicks Skip button during gameplay
2. Fetch new Wikipedia article
3. Generate new prompt + bonus words
4. Reset progress bar
5. Clear any in-progress submissions (or keep them?)
   - **Decision needed**: Reset completions or keep them?
   - **Recommendation**: Reset all - treat as fresh round

### Help/Instructions

1. Player clicks Help/Instructions button
2. Modal or overlay shows game rules:
   - Objective: Complete couplets
   - Time limit and multipliers
   - Scoring categories
   - Bonus words
   - How to play
3. Close button or click outside to return

## Configuration Constants

All scoring values should be configurable constants for easy tuning:

```typescript
// Scoring Configuration
const SCORING = {
	endRhyme: {
		perfect: 20,
		slant: 15,
		near: 10,
		none: 5
	},
	internalRhymes: {
		tripleOrMore: 10,
		pair: 5
	},
	syllables: {
		exact: 10,
		oneOff: 8,
		twoOff: 6,
		threeOff: 4,
		fourOff: 2,
		fiveOrMore: 0
	},
	stressPattern: {
		max: 20,
		min: 5
		// Scale between based on Levenshtein distance
	},
	alliteration: {
		perMatch: 1 // Configurable based on frequency
	},
	consonance: {
		perMatch: 1 // Configurable based on frequency
	},
	wordBank: {
		perUse: 5, // Points per completion with bonus word
		varietyBonus: 100 // Bonus for using multiple different words
	}
};

// Time Configuration
const TIMING = {
	roundDuration: 180, // 3 minutes in seconds
	maxCompletions: 10,
	multipliers: [
		{ threshold: 36, multiplier: 5 }, // Complete in < 36s total
		{ threshold: 72, multiplier: 4 }, // < 72s
		{ threshold: 108, multiplier: 3 }, // < 108s
		{ threshold: 144, multiplier: 2 }, // < 144s
		{ threshold: 180, multiplier: 1 } // < 180s (full time)
	]
};

// Wikipedia Configuration
const WIKIPEDIA = {
	articlesToFetch: 10, // Try up to 10 articles
	promptMinWords: 3,
	promptMaxWords: 6,
	bonusWordCount: 5,
	bonusWordMinLength: 4,
	bonusWordMaxLength: 10,
	fillerWords: [
		'for',
		'the',
		'a',
		'an',
		'of',
		'with',
		'to',
		'in',
		'on',
		'at',
		'by',
		'from',
		'is',
		'was'
	]
};

// Input Configuration
const INPUT = {
	characterLimitMultiplier: 2 // 2x prompt length
};
```

## Technical Architecture

### Component Structure

```
src/routes/rhyme/+page.svelte
  ├── GameplayScreen.svelte
  │   ├── ProgressBar.svelte
  │   ├── PromptDisplay.svelte
  │   ├── InputBox.svelte
  │   ├── WordBank.svelte
  │   └── ControlButtons.svelte (Skip, Help)
  ├── ResultsScreen.svelte
  │   ├── TotalScoreCard.svelte
  │   ├── PodiumDisplay.svelte
  │   ├── CompletionCard.svelte
  │   └── PlayAgainButton.svelte
  └── HelpModal.svelte

src/lib/games/rhyme/
  ├── types.ts
  ├── rhymeEngine.ts          // Core scoring logic
  ├── phoneticAnalyzer.ts     // CMU dictionary integration
  ├── wikipediaPrompts.ts     // Prompt generation
  └── scoreCalculator.ts      // Final score computation
```

### Key Algorithms

#### 1. Rhyme Detection

```typescript
function detectRhyme(line1: string, line2: string): RhymeType {
	// Get phonetic data for last word of line 1
	const lastWord1 = getLastWord(line1);
	const syllableCount = getSyllableCount(lastWord1);

	// Get last N syllables of line 2 (can span words)
	const endingPhonemes2 = getLastNSyllables(line2, syllableCount);

	// Try all pronunciation variants, use best
	const pronunciations1 = getPhonetics(lastWord1);
	const bestScore = 0;

	for (const pron1 of pronunciations1) {
		const score = comparePhonetics(pron1, endingPhonemes2);
		bestScore = Math.max(bestScore, score);
	}

	return classifyRhyme(bestScore);
}
```

#### 2. Stress Pattern Comparison

```typescript
function compareStressPatterns(line1: string, line2: string): number {
	const stress1 = extractStressPattern(line1); // [1, 0, 0, 1, 0, 1]
	const stress2 = extractStressPattern(line2); // [0, 1, 0, 1, 0, 1]

	const distance = levenshteinDistance(stress1, stress2);
	const maxDistance = Math.max(stress1.length, stress2.length);

	// Normalize to 0-1, then scale to 5-20 points
	const similarity = 1 - distance / maxDistance;
	return Math.round(5 + similarity * 15);
}
```

#### 3. Alliteration/Consonance Counter

```typescript
function extractPhonemeCounters(line: string) {
	const words = tokenize(line);
	const consonants: Record<string, number> = {};
	const vowels: Record<string, number> = {};

	for (const word of words) {
		const phonemes = getPhonetics(word);

		for (const phoneme of phonemes) {
			if (isConsonant(phoneme)) {
				consonants[phoneme] = (consonants[phoneme] || 0) + 1;
			} else if (isVowel(phoneme)) {
				const base = stripStress(phoneme);
				vowels[base] = (vowels[base] || 0) + 1;
			}
		}
	}

	return { consonants, vowels };
}

function scoreAlliteration(line1: string, line2: string): number {
	const counters1 = extractPhonemeCounters(line1);
	const counters2 = extractPhonemeCounters(line2);

	// Find matches and score them
	let score = 0;
	for (const [phoneme, count1] of Object.entries(counters1.consonants)) {
		const count2 = counters2.consonants[phoneme] || 0;
		const matches = Math.min(count1, count2);
		score += matches * SCORING.alliteration.perMatch;
	}

	return score;
}
```

## Open Questions / Future Enhancements

### Questions Requiring Decisions

1. **Skip button behavior**: Should it reset all completions or preserve them?
   - **Recommendation**: Reset (treat as new round)

2. **Time multiplier thresholds**: Need to tune based on playtesting
   - Current: 36s, 72s, 108s, 144s, 180s for 5x-1x
   - May need adjustment based on actual completion rates

3. **Word bank variety bonus calculation**:
   - Flat bonus for using X/5 words?
   - Scaled bonus (1 word = 20pts, 2 = 50pts, 3 = 100pts, etc.)?
   - **Recommendation**: Scaled based on count

### Future Enhancements

- **Mobile responsive design**: Adapt layout for touch screens
- **Statistics tracking**: High scores, total rounds, favorite prompts
- **Share feature**: Copy best couplets to clipboard
- **Replay prompt**: Try the same prompt again to beat your score
- **Daily challenge**: Fixed prompt that everyone gets
- **Community features**: Share prompts and compare scores (requires backend)
- **Theme packs**: Filter Wikipedia articles by category
- **Custom prompts**: Let users input their own first lines
- **Pronunciation audio**: Play pronunciation of words when clicked
- **Advanced mode**: Weight stress patterns more heavily
- **Tutorial mode**: Guided first round with tooltips

## Success Criteria

### User Experience Goals

- Players feel **safe to experiment** without fear of judgment
- Scoring breakdowns are **educational** not punitive
- Game feels **fast-paced** but not stressful
- Results are **satisfying** and celebrate creativity
- Players learn poetic devices **unconsciously** through play

### Technical Goals

- Phonetic analysis is **accurate** and leverages CMU data
- Wikipedia integration is **reliable** with good error handling
- Performance is **smooth** with no input lag
- Scoring is **transparent** and understandable
- Code is **maintainable** with configurable constants

### Engagement Goals

- Players want to **play multiple rounds** in one session
- Results inspire players to **try different approaches**
- Scoring reveals **interesting linguistic patterns**
- Game serves as a **creative writing warm-up**

---

## Implementation Checklist

### Phase 1: Core Engine

- [ ] Phonetic analysis utilities (rhyme detection, stress patterns)
- [ ] Syllable counting from CMU data
- [ ] Alliteration/consonance extraction
- [ ] Score calculation engine
- [ ] Unit tests for scoring logic

### Phase 2: Wikipedia Integration

- [ ] Prompt generation from articles
- [ ] Candidate validation (filters, dictionary checks)
- [ ] Bonus word selection
- [ ] Error handling and retries
- [ ] Skip prompt functionality

### Phase 3: Gameplay UI

- [ ] Progress bar with multiplier ticks
- [ ] Prompt display
- [ ] Input box with rhyme indicator
- [ ] Word bank with checkmarks
- [ ] Real-time validation
- [ ] Particle effects on submission
- [ ] Skip and Help buttons
- [ ] Help/Instructions modal

### Phase 4: Results UI

- [ ] Total score card (expandable)
- [ ] Completion cards (expandable)
- [ ] Podium styling (gold/silver/bronze)
- [ ] Detailed scoring breakdown display
- [ ] Stress pattern visualization
- [ ] Play Again button

### Phase 5: Polish & Testing

- [ ] Error message UX
- [ ] Keyboard accessibility
- [ ] Visual polish (fonts, spacing, colors)
- [ ] Edge case testing
- [ ] Performance optimization
- [ ] Playtesting and scoring tuning

---

_This design document provides complete specifications for implementing Rhyme Thyme. All decisions are documented to enable confident development._

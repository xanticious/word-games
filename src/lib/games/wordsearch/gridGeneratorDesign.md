# Word Search Grid Generator - Design Document

## Purpose & Goals

### Core Experience

This word search game is designed as a **relaxing, meditative, self-paced activity** for players who enjoy unhurried puzzle-solving. The focus is on providing a sense of accomplishment through thematic word discovery, without competitive pressure or time constraints.

### Key Success Factors

#### Positive Experience Drivers

- **Sense of Achievement**: Players receive congratulations upon completion and can review their finished grid to appreciate their accomplishment
- **Meditative Gameplay**: Relaxed, unhurried scanning and word discovery without stress or time pressure
- **Thematic Coherence**: All words relate to a clear, interesting theme that engages the player
- **Appropriate Challenge**: Fair difficulty that can be adjusted to match player skill level through configurable settings
- **Frictionless Interaction**: Intuitive highlighting controls and easy progression to subsequent puzzles
- **Visual Clarity**: Readable grid and word list with subtle highlighting (pale colors) that doesn't interfere with scanning

#### Experience Detractors to Avoid

**Grid Generation Quality Issues:**

- **Predictable Patterns**: Words placed in obvious groupings, parallel arrangements, or clustered in specific regions
  - _Solution_: Distribute words across allowed directions relatively evenly; position words throughout the grid with varied intersections
- **Ambiguous Placements**: Words sharing multiple letters (e.g., "llamama" from "llama" + "mama") or subset words (e.g., "can" within "cannot")
  - _Solution_: Filter word list to remove containment relationships; prevent words from sharing more than one consecutive letter
- **Over-Crossing**: Words intersecting at more than 50% of their letters, reducing uniqueness (e.g., "cat" crossed at all three letters)
  - _Solution_: Limit intersection density per word during placement algorithm
- **Non-Unique Occurrences**: Target words appearing multiple times in the grid
  - _Solution_: Validate that each word appears exactly once in the specified directions

**Usability Issues:**

- **Readability**: Grid or word list that's difficult to scan visually
  - _Solution_: Ensure appropriate font sizes, spacing, and contrast
- **Viewport Constraints**: Grid and list don't fit on screen simultaneously
  - _Solution_: Implement responsive scaling or validate grid size against viewport dimensions
- **Interaction Friction**: Cumbersome word highlighting mechanisms
  - _Addressed_: Already implemented intuitive controls with pale color highlighting
- **Progress Tracking**: Difficulty identifying found vs. unfound words
  - _Solution_: Clear visual distinction for completed words in the list
- **Getting Stuck**: No assistance mechanism when players can't locate remaining words
  - _Solution_: Implement helper features (word reveal button, letter highlighting by character)

**Difficulty Mismatch:**

- Challenge level inappropriate for player skill
  - _Solution_: Configurable difficulty settings (grid size, directions, word count, density)

### Out of Scope

The following features are explicitly excluded from this implementation:

- Performance tracking (solve times, personal bests)
- Leaderboards or competitive elements
- Time limits or countdown timers
- Multiplayer or social features
- Stress-inducing game mechanics

---

## Grid Generation Requirements

### Input: Word Bank

The input word list serves as a **word bank** rather than a fixed list of words to place. The generator will:

- Randomly sample words (without replacement) from the bank
- Continue placing words until stopping criteria are met
- Not guarantee all bank words will be placed

### Stopping Criteria

Word placement terminates when any of the following conditions are met:

1. **Word bank exhausted**: No more words available in the bank
2. **Constraint violation**: No remaining words can be placed without violating hard constraints
3. **Target capacity reached**: Grid has reached its target word count/letter density based on configuration

### Target Capacity Calculation

Capacity is determined by: `gridSize × gridSize × density × fillFactor`

Example: 10×10 grid, sparse density

- Target: ~40 letters total (~8 five-letter words)
- This prevents overcrowding while maintaining solvability

**Density Settings:**

- **Sparse**: Lower fill factor, more empty space, easier to scan
- **Normal**: Moderate fill factor, balanced challenge
- **Dense**: Higher fill factor, more words, greater difficulty

### Hard Constraints (MUST-HAVE)

These constraints cannot be violated. Placement attempts that violate these rules are rejected:

1. **Unique Occurrence**: Each word appears exactly once in the grid
2. **Complete Placement**: Every word that begins placement must be fully placed (no partial words)
3. **Boundary Compliance**: Words must fit entirely within grid dimensions
4. **No Containment**: Word bank must be filtered to remove words contained within other words
   - Example: Remove "can" if "cannot" exists in the bank
   - Applied during preprocessing, not during placement
5. **First Letter Uniqueness**: The first letter of each word must be placed in an empty cell
   - Creates unique starting positions for each word
   - Helps players progressively narrow search space
6. **Minimum Uniqueness**: At least 30% of each word's letters must not be shared with crossing words
   - Ensures words maintain sufficient visual distinctiveness
   - Example: A 10-letter word must have at least 3 letters that don't intersect with other words
7. **No Consecutive Letter Sharing**: A word cannot share more than one consecutive letter with any single existing word
   - Prevents ambiguous formations like "llamama" from "llama" + "mama"
   - Words may intersect multiple different words, but not consecutively with the same word

### Soft Constraints (NICE-TO-HAVE)

These constraints are optimized but may be relaxed to achieve better overall grid quality:

1. **Preferred Uniqueness**: Target 50%+ unshared letters per word (vs. minimum 30%)
2. **Directional Balance**: Distribute words relatively evenly across allowed directions
   - Not strictly equal (not enforced as exactly 25% per direction for 4 directions)
   - Acceptable range: No single direction should exceed 40% or fall below 10% of total words
   - Prevents monotonous patterns (e.g., all horizontal words)
3. **Spatial Distribution**: Avoid clustering words in specific regions
   - Metric: Calculate average distance between word starting positions
   - Higher average distance indicates better distribution

### Quality Scoring

To optimize grid quality, implement a **Monte Carlo approach**:

- Generate multiple candidate grids (e.g., 5 attempts)
- Score each grid based on:
  - Number of words successfully placed (higher is better)
  - Directional distribution balance (lower variance is better)
  - Spatial distribution (higher average distance is better)
  - Uniqueness percentage (closer to 50% is better)
  - Letter sharing violations (fewer is better)
- Select the highest-scoring grid

---

## Implementation Approach

### Algorithm Overview: Probabilistic Intersection-Aware Placement

The grid generator uses a probabilistic approach that favors word intersections while maintaining randomness and distribution quality.

### Phase 1: Preprocessing

**Step 1: Validate Input**
Check word bank quality:

- Ensure words contain only valid characters (A-Z, case-insensitive)
- If word bank is empty, throw error: "Word bank cannot be empty"

**Step 2: Filter Word Bank**
Remove words that cannot be placed:

- Words longer than the grid size
- Words contained within other words in the bank
  - Example: Remove "can" if "cannot" exists
  - Use containment check: `longerWord.includes(shorterWord)`

**Post-Filter Validation:**

- If filtered word bank is empty, throw error: "No valid words remaining after filtering. All words are either too long for the grid size or contained within other words."
- If 1-2 words remain, proceed (generation will work but grid will be sparse)

**Step 3: Shuffle Word Bank**
Randomize the order of filtered words to ensure different grids on each generation attempt.

### Phase 2: Word Placement Loop

For each word in the shuffled word bank:

**Step 1: Find Valid Placements**
Enumerate all possible placements by iterating over every grid position and allowed direction. For each candidate placement, validate against all constraints and categorize into two lists:

- **List A (Intersecting)**: Placements where the word crosses existing words
  - At least one letter overlaps with a previously placed word
  - Letter must match at the intersection point (e.g., 'C' in "CAT" can intersect 'C' in "CATCH")
  - Must respect the 30% minimum uniqueness constraint (at least 30% of letters don't intersect)
- **List B (Non-Intersecting)**: Placements where the word doesn't cross any existing words
  - All cells along the word path are empty
  - Fully valid but creates no intersections

**Validation Checks (applied to all candidate placements):**

1. **Boundary Check**: Word fits entirely within grid dimensions

2. **Letter Match Check**: At any occupied cell, the word's letter must match the grid's letter

3. **First Letter Uniqueness**: The first letter of the word must be placed in an empty cell
   - Ensures each word has a unique starting position
   - Helps players progressively narrow their search space as they find words
   - Makes the puzzle more engaging by avoiding ambiguous starting points

4. **Minimum Uniqueness Constraint**: At least 30% of word's letters must be in empty cells (unshared)
   - Example: A 10-letter word must have at least 3 empty cells along its path
   - This ensures words maintain sufficient visual distinctiveness

5. **No Consecutive Letter Sharing**: A word cannot share more than one consecutive letter with any single existing word
   - **Hard constraint** - always reject violations
   - Track sequences of consecutive intersections with each unique `wordId`
   - Reject if any sequence length > 1 (e.g., "MA" shared between "llama" and "mama" → REJECTED)
   - Implementation: For each occupied cell, check if the previous cell also intersects the same `wordId`

6. **Multiple Word Intersection Allowed**: A word may intersect with multiple different words
   - Example: "CATCH" can cross both "CAR" (at 'C') and "HAT" (at 'H') - this is valid
   - Only consecutive sharing with a _single_ word is prohibited
   - Combined with constraint #4, ensures overall intersection quality

7. **Duplicate Prevention**: Placing this word at this position doesn't create a duplicate occurrence of any word already in the grid
   - Ensures each word appears exactly once

**Note on wordIds:** Use `Set<string>` instead of `string[]` for efficient unique word tracking per cell

**Step 2: Probabilistic Selection**
Choose a placement from the combined lists with bias toward intersections:

```
if (List A is not empty):
  - Choose from List A with probability P_intersect (e.g., 0.7)
  - Choose from List B with probability (1 - P_intersect) (e.g., 0.3)
else if (List B is not empty):
  - Choose from List B (only option available)
else:
  - Cannot place word; skip to next word
```

**Intersection Bias (`P_intersect`):**

- Default: 0.7 (70% chance to choose intersecting placement)
- Adjustable based on density setting:
  - Sparse: 0.6 (lower intersection preference)
  - Normal: 0.7 (moderate intersection preference)
  - Dense: 0.8 (higher intersection preference)

**Step 3: Place Word**

- Mark grid cells with the word's letters
- Record word metadata (position, direction, length)
- Update letter placement tracking for constraint validation

**Step 4: Check Stopping Criteria**

- If target capacity reached → terminate
- If word bank exhausted → terminate
- If no words can be placed (all remaining words fail validation) → terminate
- Otherwise, continue to next word

### Phase 3: Fill Empty Cells

After word placement completes, fill remaining empty cells with random letters that help hidden words blend naturally:

**Step 1: Create Weighted Letter Pool**
Build a string containing:

- All letters from placed words (e.g., "CAT" + "TOE" = "CATTOE")
- Plus the full alphabet once ("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
- This gives placed word letters higher probability while ensuring all letters are possible

**Step 2: Fill Each Empty Cell**
For each empty cell:

1. Randomly sample a letter from the weighted pool
2. Temporarily place the letter in the cell
3. Validate that this letter doesn't accidentally create any word from the word bank in any allowed direction
   - Check all directions that pass through this cell
   - If any unintended word from the bank is formed, reject the letter
4. If validation fails, sample another letter and repeat (max attempts: 26 letters)
5. Once a valid letter is found, permanently place it
6. **Fallback for deadlock**: If no valid letter found after all attempts, use a Greek letter (Ω, Φ, δ, etc.)
   - This should be extremely rare but prevents generation failure
   - Greek letters are visually distinct and won't accidentally form English words

**Anti-Pattern Prevention:**
This approach prevents players from finding words that weren't intentionally placed, maintaining puzzle integrity.

### Phase 4: Monte Carlo Optimization

Generate multiple grids and select the best:

1. Run the placement algorithm N times (e.g., 5 attempts)
2. Score each grid based on quality metrics
3. Return the highest-scoring grid (even if it has only 1-2 words placed)
   - Include quality metrics in the response for caller awareness
   - Low word counts indicate challenging configuration or insufficient word bank

**Quality Scoring Formula:**

```
score = (wordsPlaced * W1)
      + (directionalBalance * W2)
      + (spatialDistribution * W3)
      + (uniquenessScore * W4)
```

**Scoring Components:**

- `wordsPlaced`: Count of successfully placed words (normalized)
- `directionalBalance`: 1 - (variance of direction distribution)
- `spatialDistribution`: Average distance between word starting positions (normalized)
- `uniquenessScore`: Average percentage of unshared letters across all words

**Weights (W1-W5):** Prioritize word count, then balance other factors

---

## Error Handling & Edge Cases

### Input Validation

- **Empty word bank**: Throw error immediately
- **Invalid characters**: Throw error if words contain non-alphabetic characters
- **Post-filter empty**: Throw error if no words remain after filtering too-long/contained words

### Generation Failures

- **Low word placement**: Return best attempt even with 1-2 words placed
  - Include quality metrics to inform caller of suboptimal result
  - Caller can decide whether to use the grid or request new configuration
- **Random fill deadlock**: Use Greek letter fallback (Ω, Φ, δ) if no valid English letter found after 26 attempts
  - Should be extremely rare
  - Maintains grid completeness without generation failure

### Error Messages

Provide actionable feedback:

```typescript
// Examples:
'Word bank cannot be empty';
'No valid words remaining after filtering. All words are either too long for the grid size (max: {gridSize}) or contained within other words.';
'Word bank contains invalid characters. Only A-Z letters are allowed.';
```

---

## Performance Considerations

### Validation Order (Fail Fast)

When validating candidate placements, perform checks in order of computational cost (cheapest first):

1. **Boundary check** - O(1): Word fits within grid dimensions
2. **First letter uniqueness check** - O(1): Starting cell is empty
3. **Letter match check** - O(n): Iterate through word, verify occupied cells match
4. **Minimum uniqueness check** - O(n): Count empty cells ≥ 30% during same pass
5. **Consecutive sharing check** - O(n): Track sequences while iterating
6. **Duplicate prevention check** - O(1): Lookup in placed words map

### Data Structure Optimizations

**Placed Words Lookup:**

- Maintain `Map<string, PlacedWord>` for O(1) duplicate checking
- Key: word text, Value: placement metadata

**Grid Cell Tracking:**

- Use `Set<string>` for `wordIds` per cell (efficient uniqueness checks)

**Future Optimization Opportunities:**
If performance testing reveals bottlenecks, consider:

- **Word-by-letter index**: `Map<string, string[]>` mapping each letter to words containing it
  - Speeds up accidental word detection during random fill
  - Example: When placing 'X', only check words containing 'X'
- **Spatial indexing**: Divide grid into regions for faster placement candidate generation
- **Memoization**: Cache validation results for repeated placement attempts

### Performance Monitoring

Instrument the generator to track timing for each phase:

1. **Preprocessing time**: Word bank filtering and shuffling
2. **Placement time**: Finding and placing all words (per word and total)
3. **Random fill time**: Filling empty cells with validated random letters
4. **Scoring time**: Calculating quality metrics

Log timing data to identify disproportionate bottlenecks for targeted optimization.

---

## Technical Specifications

### Data Structures

**Grid Representation:**

```typescript
interface GridCell {
	letter: string;
	row: number;
	col: number;
	isSelected: boolean;
	wordIds?: Set<string>; // Track which words use this cell (for intersection validation)
}
```

**Word Metadata:**

```typescript
interface PlacedWord {
	word: string;
	id: string; // Unique identifier
	startRow: number;
	startCol: number;
	direction: Direction;
	cells: { row: number; col: number }[]; // All cells occupied by this word
}
```

**Placement Candidate:**

```typescript
interface PlacementCandidate {
	row: number;
	col: number;
	direction: Direction;
	intersectionCount: number; // How many letters intersect with existing words
}
```

### Key Functions

1. **`filterWordBank(words: string[], gridSize: number): string[]`**
   - Remove words longer than gridSize
   - Remove containment words
2. **`findValidPlacements(word: string, grid: GridCell[][], allowedDirections: Direction[], placedWords: PlacedWord[]): { intersecting: PlacementCandidate[], nonIntersecting: PlacementCandidate[] }`**
   - Returns categorized valid placements

3. **`validatePlacement(word: string, candidate: PlacementCandidate, grid: GridCell[][], placedWords: PlacedWord[]): boolean`**
   - Check all hard constraints

4. **`selectPlacement(intersecting: PlacementCandidate[], nonIntersecting: PlacementCandidate[], intersectionBias: number): PlacementCandidate`**
   - Probabilistic selection with bias

5. **`placeWord(word: string, candidate: PlacementCandidate, grid: GridCell[][]): PlacedWord`**
   - Update grid with word letters

6. **`fillEmptyCells(grid: GridCell[][], placedWords: PlacedWord[], wordBank: string[], allowedDirections: Direction[]): void`**
   - Create weighted letter pool from placed words + alphabet
   - For each empty cell, randomly sample letters and validate
   - Check all directions through the cell to prevent accidental word formation
   - Retry with different letters until valid or max attempts reached

7. **`checkForAccidentalWord(grid: GridCell[][], row: number, col: number, wordBank: string[], allowedDirections: Direction[]): boolean`**
   - Given a cell position, check if any word from the word bank appears through this cell
   - Only check directions that pass through the specified cell
   - Returns true if an accidental word is detected

8. **`scoreGrid(grid: GridCell[][], placedWords: PlacedWord[], allowedDirections: Direction[]): number`**
   - Calculate quality score

9. **`generateGridWithMonteCarlo(wordBank: string[], config: GridConfig, attempts: number): { grid: GridCell[][], words: PlacedWord[], metrics: PerformanceMetrics }`**
   - Main entry point with Monte Carlo wrapper
   - Returns best grid along with performance timing data

### Configuration

```typescript
interface GridConfig {
	gridSize: number;
	allowedDirections: Direction[];
	density: 'sparse' | 'normal' | 'dense';
	intersectionBias?: number; // Optional override
	targetCapacityFactor?: number; // Optional override for capacity calculation
}

interface PerformanceMetrics {
	preprocessingMs: number;
	placementMs: number;
	randomFillMs: number;
	scoringMs: number;
	totalMs: number;
	wordsPlaced: number;
	wordsAttempted: number;
}
```

### Constants

**Note:** These are internal tuning parameters. They are not exposed to end users and may be adjusted based on real-world testing and performance analysis.

```typescript
const INTERSECTION_BIAS = {
	sparse: 0.6, // 60% chance to prefer intersecting placements
	normal: 0.7, // 70% chance to prefer intersecting placements
	dense: 0.8 // 80% chance to prefer intersecting placements
};

const CAPACITY_FACTOR = {
	sparse: 0.4, // Target 40% of grid cells filled with word letters
	normal: 0.6, // Target 60% of grid cells filled with word letters
	dense: 0.8 // Target 80% of grid cells filled with word letters
};

const MIN_UNIQUENESS = 0.3; // 30% of letters must be unshared (hard constraint)
const PREFERRED_UNIQUENESS = 0.5; // 50% target (soft constraint for scoring)

const MONTE_CARLO_ATTEMPTS = 5; // Number of grid generation attempts per request

const QUALITY_WEIGHTS = {
	wordsPlaced: 10, // Highest priority: maximize word count
	directionalBalance: 2, // Moderate priority: even direction distribution
	spatialDistribution: 1, // Lower priority: spread words across grid
	uniquenessScore: 2 // Moderate priority: prefer higher uniqueness %
};

const GREEK_LETTER_FALLBACKS = ['Ω', 'Φ', 'Δ', 'Θ', 'Λ', 'Σ', 'Ψ', 'Ξ'];
const MAX_RANDOM_FILL_ATTEMPTS = 26; // Try each letter once before using Greek fallback
```

---

## Implementation Notes

### Tuning & Iteration

- All constants are subject to adjustment based on empirical testing
- Performance metrics will guide optimization priorities
- Quality weights may be rebalanced after observing generated grids
- These parameters remain internal implementation details, not exposed via public API

### API Changes

**Breaking Change:** The `generateGrid` function signature will change:

**Before:**

```typescript
generateGrid(
  wordList: string[],
  allowedDirections: Direction[],
  gridSize: number,
  density: 'sparse' | 'normal' | 'dense'
): GridCell[][]
```

**After:**

```typescript
generateGrid(
  wordBank: string[],
  allowedDirections: Direction[],
  gridSize: number,
  density: 'sparse' | 'normal' | 'dense'
): {
  grid: GridCell[][];
  wordList: string[];  // Filtered words that were actually placed
  metrics: PerformanceMetrics;
}
```

**Key Changes:**

- **Input parameter renamed**: `wordList` → `wordBank` to clarify it's a pool of candidate words
- **Return type changed**: Now returns an object containing:
  - `grid`: The generated grid (same as before)
  - `wordList`: The actual list of words placed in the grid (filtered and successfully placed subset of the word bank)
  - `metrics`: Performance timing data for monitoring

**Migration Notes:**

- Existing callers must be updated to:
  1. Pass a word bank (can be larger than needed)
  2. Destructure the return value to get `grid` and `wordList`
  3. Use the returned `wordList` for displaying found/unfound words to players
- The returned `wordList` is the authoritative source of what words exist in the grid

### Next Steps

1. Update `generateGrid` function signature and return type
2. Implement core placement algorithm with validation
3. Add performance instrumentation
4. Update all existing callers to use new API
5. Generate test grids with various configurations
6. Analyze metrics and adjust constants as needed
7. Optimize identified bottlenecks

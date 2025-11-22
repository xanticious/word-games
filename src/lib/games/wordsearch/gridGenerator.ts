/**
 * Grid generation logic for Word Search game
 * Implements probabilistic intersection-aware word placement algorithm
 */

import type { GridCell, Direction } from './types.js';

// ============================================================================
// Constants
// ============================================================================

const INTERSECTION_BIAS = {
	sparse: 0.6,
	normal: 0.7,
	dense: 0.8
};

const CAPACITY_FACTOR = {
	sparse: 0.4,
	normal: 0.6,
	dense: 0.8
};

const MIN_UNIQUENESS = 0.3; // 30% of letters must be unshared (hard constraint)
const PREFERRED_UNIQUENESS = 0.5; // 50% target (soft constraint for scoring)
const MONTE_CARLO_ATTEMPTS = 20;

const QUALITY_WEIGHTS = {
	wordsPlaced: 10,
	directionalBalance: 2,
	spatialDistribution: 1,
	uniquenessScore: 2
};

const GREEK_LETTER_FALLBACKS = ['Ω', 'Φ', 'Δ', 'Θ', 'Λ', 'Σ', 'Ψ', 'Ξ'];
const MAX_RANDOM_FILL_ATTEMPTS = 26;

// ============================================================================
// Types & Interfaces
// ============================================================================

interface PlacedWord {
	word: string;
	id: string;
	startRow: number;
	startCol: number;
	direction: Direction;
	cells: { row: number; col: number }[];
}

interface PlacementCandidate {
	row: number;
	col: number;
	direction: Direction;
	intersectionCount: number;
}

interface GridConfig {
	gridSize: number;
	allowedDirections: Direction[];
	density: 'sparse' | 'normal' | 'dense';
	intersectionBias?: number;
	targetCapacityFactor?: number;
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

interface InternalGridCell extends Omit<GridCell, 'wordIds'> {
	wordIds?: Set<string>;
	isFirstLetter?: boolean;
}

// ============================================================================
// Direction Deltas
// ============================================================================

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
	right: { dr: 0, dc: 1 },
	left: { dr: 0, dc: -1 },
	down: { dr: 1, dc: 0 },
	up: { dr: -1, dc: 0 },
	ne: { dr: -1, dc: 1 }, // northeast (up-right)
	se: { dr: 1, dc: 1 }, // southeast (down-right)
	sw: { dr: 1, dc: -1 }, // southwest (down-left)
	nw: { dr: -1, dc: -1 } // northwest (up-left)
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the numeric size based on GridSize string
 */
export function getGridDimensions(gridSize: string): number {
	const sizeMap: Record<string, number> = {
		small: 10,
		medium: 15,
		large: 20,
		'extra-large': 25
	};
	return sizeMap[gridSize] || 15;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * Generates a random letter from a weighted pool
 */
function getRandomLetter(pool: string): string {
	return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================================
// Phase 1: Preprocessing Functions
// ============================================================================

/**
 * Validates and filters the word bank
 * Removes words that are too long or contained within other words
 */
function filterWordBank(words: string[], gridSize: number): string[] {
	// Step 1: Validate input
	if (words.length === 0) {
		throw new Error('Word bank cannot be empty');
	}

	// Normalize all words to uppercase
	const normalizedWords = words.map((w) => w.toUpperCase().trim()).filter((w) => w.length > 0);

	// Check for invalid characters
	for (const word of normalizedWords) {
		if (!/^[A-Z]+$/.test(word)) {
			throw new Error('Word bank contains invalid characters. Only A-Z letters are allowed.');
		}
	}

	// Step 2: Filter out words longer than grid size
	const sizedWords = normalizedWords.filter((w) => w.length <= gridSize);

	// Step 3: Remove contained words
	// Sort by length (descending) to check longer words first
	const sortedWords = [...sizedWords].sort((a, b) => b.length - a.length);
	const filtered: string[] = [];

	for (const word of sortedWords) {
		// Check if this word is contained in any word we've already kept
		const isContained = filtered.some((kept) => kept.includes(word));
		if (!isContained) {
			filtered.push(word);
		}
	}

	// Step 4: Post-filter validation
	if (filtered.length === 0) {
		throw new Error(
			`No valid words remaining after filtering. All words are either too long for the grid size (max: ${gridSize}) or contained within other words.`
		);
	}

	return filtered;
}

// ============================================================================
// Phase 2: Validation Functions
// ============================================================================

/**
 * Gets the cells that a word would occupy at a given position and direction
 */
function getWordCells(
	word: string,
	row: number,
	col: number,
	direction: Direction,
	gridSize: number
): { row: number; col: number }[] | null {
	const delta = DIRECTION_DELTAS[direction];
	const cells: { row: number; col: number }[] = [];

	for (let i = 0; i < word.length; i++) {
		const r = row + delta.dr * i;
		const c = col + delta.dc * i;

		// Boundary check
		if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
			return null;
		}

		cells.push({ row: r, col: c });
	}

	return cells;
}

/**
 * Validates a word placement against all hard constraints
 * Returns true if placement is valid, false otherwise
 */
function validatePlacement(
	word: string,
	candidate: PlacementCandidate,
	grid: InternalGridCell[][],
	placedWords: Map<string, PlacedWord>
): { valid: boolean; intersectionCount: number } {
	const cells = getWordCells(word, candidate.row, candidate.col, candidate.direction, grid.length);

	// 1. Boundary check - already done in getWordCells
	if (!cells) {
		return { valid: false, intersectionCount: 0 };
	}

	// 2. First letter uniqueness check
	const firstCell = grid[cells[0].row][cells[0].col];
	if (firstCell.letter !== '') {
		return { valid: false, intersectionCount: 0 };
	}

	// Track for uniqueness and intersection checks
	let emptyCount = 0;
	let intersectionCount = 0;
	const intersectedWords = new Set<string>(); // Track unique words we're intersecting

	for (let i = 0; i < word.length; i++) {
		const cell = grid[cells[i].row][cells[i].col];
		const letter = word[i];

		if (cell.letter === '') {
			// Empty cell
			emptyCount++;
		} else {
			// 3. Letter match check
			if (cell.letter !== letter) {
				return { valid: false, intersectionCount: 0 };
			}

			// 4. Don't intersect another word's first letter
			if (cell.isFirstLetter) {
				return { valid: false, intersectionCount: 0 };
			}

			intersectionCount++;

			// 5. Track which words we're intersecting with
			// If we intersect the same word twice, it means we're on the same line
			if (cell.wordIds) {
				for (const wordId of cell.wordIds) {
					if (intersectedWords.has(wordId)) {
						// Already intersected this word - invalid placement
						return { valid: false, intersectionCount };
					}
					intersectedWords.add(wordId);
				}
			}
		}
	}

	// 6. Minimum uniqueness constraint (30%)
	const uniquenessRatio = emptyCount / word.length;
	if (uniquenessRatio < MIN_UNIQUENESS) {
		return { valid: false, intersectionCount };
	}

	// 7. Duplicate prevention check
	if (placedWords.has(word)) {
		return { valid: false, intersectionCount };
	}

	return { valid: true, intersectionCount };
}

/**
 * Finds all valid placements for a word and categorizes them
 */
function findValidPlacements(
	word: string,
	grid: InternalGridCell[][],
	allowedDirections: Direction[],
	placedWords: Map<string, PlacedWord>
): { intersecting: PlacementCandidate[]; nonIntersecting: PlacementCandidate[] } {
	const intersecting: PlacementCandidate[] = [];
	const nonIntersecting: PlacementCandidate[] = [];

	// Try every position and direction
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid.length; col++) {
			for (const direction of allowedDirections) {
				const candidate: PlacementCandidate = {
					row,
					col,
					direction,
					intersectionCount: 0
				};

				const result = validatePlacement(word, candidate, grid, placedWords);

				if (result.valid) {
					candidate.intersectionCount = result.intersectionCount;

					if (result.intersectionCount > 0) {
						intersecting.push(candidate);
					} else {
						nonIntersecting.push(candidate);
					}
				}
			}
		}
	}

	return { intersecting, nonIntersecting };
}

// ============================================================================
// Phase 3: Word Placement Functions
// ============================================================================

/**
 * Selects a placement from candidates with probabilistic bias toward intersections
 */
function selectPlacement(
	intersecting: PlacementCandidate[],
	nonIntersecting: PlacementCandidate[],
	intersectionBias: number
): PlacementCandidate | null {
	// If we have intersecting placements, use bias to choose
	if (intersecting.length > 0 && nonIntersecting.length > 0) {
		if (Math.random() < intersectionBias) {
			return intersecting[Math.floor(Math.random() * intersecting.length)];
		} else {
			return nonIntersecting[Math.floor(Math.random() * nonIntersecting.length)];
		}
	}

	// If we only have one type, use it
	if (intersecting.length > 0) {
		return intersecting[Math.floor(Math.random() * intersecting.length)];
	}
	if (nonIntersecting.length > 0) {
		return nonIntersecting[Math.floor(Math.random() * nonIntersecting.length)];
	}

	// No valid placements
	return null;
}

/**
 * Places a word on the grid and returns the PlacedWord metadata
 */
function placeWord(
	word: string,
	candidate: PlacementCandidate,
	grid: InternalGridCell[][],
	wordId: string
): PlacedWord {
	const cells = getWordCells(word, candidate.row, candidate.col, candidate.direction, grid.length)!;

	// Place letters on grid
	for (let i = 0; i < word.length; i++) {
		const cell = grid[cells[i].row][cells[i].col];
		cell.letter = word[i];

		// Mark first letter
		if (i === 0) {
			cell.isFirstLetter = true;
		}

		// Initialize wordIds set if needed
		if (!cell.wordIds) {
			cell.wordIds = new Set();
		}
		cell.wordIds.add(wordId);
	}

	return {
		word,
		id: wordId,
		startRow: candidate.row,
		startCol: candidate.col,
		direction: candidate.direction,
		cells
	};
}

// ============================================================================
// Phase 4: Random Fill Functions
// ============================================================================

/**
 * Checks if a word from the word bank accidentally appears through a cell
 */
function checkForAccidentalWord(
	grid: InternalGridCell[][],
	row: number,
	col: number,
	wordBank: Set<string>,
	allowedDirections: Direction[],
	debugLetter?: string
): boolean {
	// Check each direction that passes through this cell
	for (const direction of allowedDirections) {
		const delta = DIRECTION_DELTAS[direction];

		// We need to check all possible words that could include this cell
		// Try different starting positions that would include this cell
		for (let offset = 0; offset < grid.length; offset++) {
			const startRow = row - delta.dr * offset;
			const startCol = col - delta.dc * offset;

			// Try different word lengths
			for (let length = 4; length <= grid.length; length++) {
				const cells = getWordCells(
					''.padEnd(length, 'X'),
					startRow,
					startCol,
					direction,
					grid.length
				);

				if (!cells) continue;

				// Check if our target cell is included
				const includesCell = cells.some((c) => c.row === row && c.col === col);
				if (!includesCell) continue;

				// Build the word from the grid
				let word = '';
				let hasEmptyCell = false;
				for (const cell of cells) {
					const letter = grid[cell.row][cell.col].letter;
					if (letter === '') {
						hasEmptyCell = true;
						break; // Hit an empty cell - can't form a complete word
					}
					word += letter;
				}

				// Skip if the range includes an empty cell - it can't spell a word from the bank
				if (hasEmptyCell) continue;

				// Check if this word is in the bank
				if (word.length >= 4 && wordBank.has(word)) {
					if (debugLetter) {
						console.log(
							`[ACCIDENTAL WORD] Letter '${debugLetter}' at (${row},${col}) would create '${word}' ` +
								`starting at (${startRow},${startCol}) going ${direction}`
						);
					}
					return true; // Found accidental word
				}
			}
		}
	}

	return false;
}

/**
 * Fills empty cells with random letters that don't create accidental words
 */
function fillEmptyCells(
	grid: InternalGridCell[][],
	placedWords: PlacedWord[],
	wordBank: Set<string>,
	allowedDirections: Direction[]
): void {
	// Create weighted letter pool
	const placedLetters = placedWords.map((pw) => pw.word).join('');
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const letterPool = placedLetters + alphabet;

	// Fill each empty cell
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid.length; col++) {
			if (grid[row][col].letter !== '') continue; // Skip filled cells

			let letterPlaced = false;

			// Make a copy of the letter pool for sampling without replacement
			const poolCopy = letterPool.split('');
			const seenLetters = new Set<string>();

			// Try to find a valid letter by sampling without replacement
			while (!letterPlaced && poolCopy.length > 0) {
				// Pick a random letter from the remaining pool
				const randomIndex = Math.floor(Math.random() * poolCopy.length);
				const letter = poolCopy[randomIndex];

				// Remove it from the pool
				poolCopy.splice(randomIndex, 1);

				// Skip if we've already tried this letter
				if (seenLetters.has(letter)) continue;
				seenLetters.add(letter);

				// Temporarily place the letter
				grid[row][col].letter = letter;

				// Check if it creates an accidental word
				if (!checkForAccidentalWord(grid, row, col, wordBank, allowedDirections, letter)) {
					letterPlaced = true;
				} else {
					// Remove the letter and try again
					grid[row][col].letter = '';
				}
			}

			// If we couldn't find a valid letter, use Greek letter fallback
			if (!letterPlaced) {
				const greekLetter =
					GREEK_LETTER_FALLBACKS[Math.floor(Math.random() * GREEK_LETTER_FALLBACKS.length)];
				grid[row][col].letter = greekLetter;
				console.log(
					`[GREEK LETTER FALLBACK] All 26 letters failed at (${row},${col}). ` +
						`Tried ${seenLetters.size} unique letters. Using '${greekLetter}'.`
				);
			}
		}
	}
}

// ============================================================================
// Phase 5: Scoring Functions
// ============================================================================

/**
 * Calculates a quality score for a generated grid
 */
function scoreGrid(
	grid: InternalGridCell[][],
	placedWords: PlacedWord[],
	allowedDirections: Direction[]
): number {
	if (placedWords.length === 0) return 0;

	// 1. Words placed (normalized)
	const wordsPlacedScore = placedWords.length;

	// 2. Directional balance (lower variance is better)
	const directionCounts = new Map<Direction, number>();
	for (const direction of allowedDirections) {
		directionCounts.set(direction, 0);
	}
	for (const pw of placedWords) {
		directionCounts.set(pw.direction, (directionCounts.get(pw.direction) || 0) + 1);
	}

	const counts = Array.from(directionCounts.values());
	const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
	const variance =
		counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
	const directionalBalanceScore = 1 - Math.min(variance / mean, 1); // Normalize to 0-1

	// 3. Spatial distribution (average distance between starting positions)
	let totalDistance = 0;
	let pairCount = 0;
	for (let i = 0; i < placedWords.length; i++) {
		for (let j = i + 1; j < placedWords.length; j++) {
			const w1 = placedWords[i];
			const w2 = placedWords[j];
			const distance = Math.sqrt(
				Math.pow(w1.startRow - w2.startRow, 2) + Math.pow(w1.startCol - w2.startCol, 2)
			);
			totalDistance += distance;
			pairCount++;
		}
	}
	const avgDistance = pairCount > 0 ? totalDistance / pairCount : 0;
	const maxDistance = grid.length * Math.sqrt(2); // Diagonal of grid
	const spatialDistributionScore = avgDistance / maxDistance; // Normalize to 0-1

	// 4. Uniqueness score (average percentage of unshared letters)
	let totalUniqueness = 0;
	for (const pw of placedWords) {
		let unsharedCount = 0;
		for (const cell of pw.cells) {
			const gridCell = grid[cell.row][cell.col];
			if (gridCell.wordIds && gridCell.wordIds.size === 1) {
				unsharedCount++;
			}
		}
		totalUniqueness += unsharedCount / pw.word.length;
	}
	const uniquenessScore = totalUniqueness / placedWords.length;

	// Calculate weighted score
	const score =
		wordsPlacedScore * QUALITY_WEIGHTS.wordsPlaced +
		directionalBalanceScore * QUALITY_WEIGHTS.directionalBalance +
		spatialDistributionScore * QUALITY_WEIGHTS.spatialDistribution +
		uniquenessScore * QUALITY_WEIGHTS.uniquenessScore;

	return score;
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Creates an empty grid
 */
function createEmptyGrid(gridSize: number): InternalGridCell[][] {
	const grid: InternalGridCell[][] = [];
	for (let row = 0; row < gridSize; row++) {
		const gridRow: InternalGridCell[] = [];
		for (let col = 0; col < gridSize; col++) {
			gridRow.push({
				letter: '',
				row,
				col,
				isSelected: false,
				isFirstLetter: false
			});
		}
		grid.push(gridRow);
	}
	return grid;
}

/**
 * Converts internal grid to external GridCell format
 */
function convertToExternalGrid(grid: InternalGridCell[][]): GridCell[][] {
	return grid.map((row) =>
		row.map((cell) => ({
			letter: cell.letter,
			row: cell.row,
			col: cell.col,
			isSelected: cell.isSelected
		}))
	);
}

/**
 * Generates a single word search grid attempt
 */
function generateSingleGrid(
	wordBank: string[],
	config: GridConfig
): { grid: InternalGridCell[][]; placedWords: PlacedWord[]; wordsAttempted: number } {
	const grid = createEmptyGrid(config.gridSize);
	const placedWords = new Map<string, PlacedWord>();
	const placedWordsList: PlacedWord[] = [];

	// Shuffle word bank
	const shuffledWords = shuffleArray(wordBank);

	// Calculate target capacity
	const targetCapacity =
		config.gridSize *
		config.gridSize *
		(config.targetCapacityFactor ?? CAPACITY_FACTOR[config.density]);

	// Get intersection bias
	const intersectionBias = config.intersectionBias ?? INTERSECTION_BIAS[config.density];

	let currentCapacity = 0;
	let wordsAttempted = 0;

	// Place words
	for (const word of shuffledWords) {
		wordsAttempted++;

		// Check stopping criteria
		if (currentCapacity >= targetCapacity) break;

		// Find valid placements
		const { intersecting, nonIntersecting } = findValidPlacements(
			word,
			grid,
			config.allowedDirections,
			placedWords
		);

		// Select a placement
		const selected = selectPlacement(intersecting, nonIntersecting, intersectionBias);

		if (selected) {
			// Place the word
			const wordId = `${word}-${placedWordsList.length}`;
			const placed = placeWord(word, selected, grid, wordId);
			placedWords.set(word, placed);
			placedWordsList.push(placed);

			// Update capacity
			currentCapacity += word.length;
		}

		// If we can't place any more words, stop
		if (intersecting.length === 0 && nonIntersecting.length === 0) {
			// Check if any remaining words can be placed
			let canPlaceMore = false;
			for (let i = wordsAttempted; i < shuffledWords.length; i++) {
				const testWord = shuffledWords[i];
				const placements = findValidPlacements(
					testWord,
					grid,
					config.allowedDirections,
					placedWords
				);
				if (placements.intersecting.length > 0 || placements.nonIntersecting.length > 0) {
					canPlaceMore = true;
					break;
				}
			}
			if (!canPlaceMore) break;
		}
	}

	return { grid, placedWords: placedWordsList, wordsAttempted };
}

/**
 * Generates a word search grid using Monte Carlo approach
 * Main entry point
 */
export function generateGrid(
	wordBank: string[],
	allowedDirections: Direction[],
	gridSize: number,
	density: 'sparse' | 'normal' | 'dense'
): { grid: GridCell[][]; wordList: string[]; metrics: PerformanceMetrics } {
	const totalStart = performance.now();

	// Phase 1: Preprocessing
	const preprocessingStart = performance.now();
	const filtered = filterWordBank(wordBank, gridSize);
	const wordBankSet = new Set(filtered);
	const preprocessingMs = performance.now() - preprocessingStart;

	const config: GridConfig = {
		gridSize,
		allowedDirections,
		density
	};

	// Phase 2 & 3: Generate multiple grids and select best
	const placementStart = performance.now();
	let bestGrid: InternalGridCell[][] | null = null;
	let bestPlacedWords: PlacedWord[] = [];
	let bestScore = -1;
	let totalWordsAttempted = 0;

	for (let attempt = 0; attempt < MONTE_CARLO_ATTEMPTS; attempt++) {
		const { grid, placedWords, wordsAttempted } = generateSingleGrid(filtered, config);
		totalWordsAttempted += wordsAttempted;

		const score = scoreGrid(grid, placedWords, allowedDirections);

		if (score > bestScore) {
			bestScore = score;
			bestGrid = grid;
			bestPlacedWords = placedWords;
		}
	}

	const placementMs = performance.now() - placementStart;

	// Phase 4: Fill empty cells
	const randomFillStart = performance.now();
	if (bestGrid) {
		fillEmptyCells(bestGrid, bestPlacedWords, wordBankSet, allowedDirections);
	}
	const randomFillMs = performance.now() - randomFillStart;

	// Phase 5: Final scoring
	const scoringStart = performance.now();
	const finalScore = bestGrid ? scoreGrid(bestGrid, bestPlacedWords, allowedDirections) : 0;
	const scoringMs = performance.now() - scoringStart;

	const totalMs = performance.now() - totalStart;

	// Convert to external format
	const externalGrid = bestGrid ? convertToExternalGrid(bestGrid) : createEmptyGrid(gridSize);
	const wordList = bestPlacedWords.map((pw) => pw.word).sort();

	const metrics: PerformanceMetrics = {
		preprocessingMs,
		placementMs,
		randomFillMs,
		scoringMs,
		totalMs,
		wordsPlaced: bestPlacedWords.length,
		wordsAttempted: totalWordsAttempted / MONTE_CARLO_ATTEMPTS
	};

	console.log('Grid generation metrics:', metrics);
	console.log('Final score:', finalScore);
	console.log('Words placed:', wordList);

	return { grid: convertToExternalGrid(externalGrid), wordList, metrics };
}

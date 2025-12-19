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
	uniquenessScore: 2,
	cycleBonus: 5
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
	cycleDetectionMs: number;
	placementMs: number;
	randomFillMs: number;
	scoringMs: number;
	totalMs: number;
	wordsPlaced: number;
	wordsAttempted: number;
	cyclesDetected: number;
	cyclesPlaced: number;
}

interface InternalGridCell extends Omit<GridCell, 'wordIds'> {
	wordIds?: Set<string>;
	isFirstLetter?: boolean;
}

interface CycleWord {
	word: string;
	row: number;
	col: number;
	direction: Direction;
	crossingIndex: number; // index in word where it crosses with next word
}

interface WordCycle {
	words: CycleWord[]; // ordered list of words in the cycle
	usedWords: Set<string>; // for quick lookup
}

interface CyclePlacement {
	cycle: WordCycle;
	anchorRow: number; // where to place the cycle
	anchorCol: number;
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
		large: 20
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

/**
 * Calculates the slope of a direction for cycle detection
 * Returns null for directions with undefined slope (vertical)
 */
function getDirectionSlope(direction: Direction): number | null {
	const delta = DIRECTION_DELTAS[direction];
	if (delta.dc === 0) return null; // Vertical - undefined slope
	return delta.dr / delta.dc;
}

/**
 * Checks if allowed directions can support cycles
 * Returns false if all directions have the same slope (including vertical)
 */
function canSupportCycles(allowedDirections: Direction[]): boolean {
	if (allowedDirections.length < 2) return false;

	const slopes = new Set<number | null>();
	for (const direction of allowedDirections) {
		slopes.add(getDirectionSlope(direction));
	}

	// Need at least 2 different slopes to form a cycle
	// (e.g., horizontal + vertical can form rectangles)
	return slopes.size >= 2;
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
// Phase 1.5: Cycle Detection Functions
// ============================================================================

/**
 * Calculates the bounding box of a cycle in relative coordinates
 */
function calculateCycleBounds(cycleWords: CycleWord[]): {
	minRow: number;
	maxRow: number;
	minCol: number;
	maxCol: number;
	width: number;
	height: number;
} {
	let minRow = 0;
	let maxRow = 0;
	let minCol = 0;
	let maxCol = 0;

	for (const cw of cycleWords) {
		const delta = DIRECTION_DELTAS[cw.direction];
		const endRow = cw.row + delta.dr * (cw.word.length - 1);
		const endCol = cw.col + delta.dc * (cw.word.length - 1);

		minRow = Math.min(minRow, cw.row, endRow);
		maxRow = Math.max(maxRow, cw.row, endRow);
		minCol = Math.min(minCol, cw.col, endCol);
		maxCol = Math.max(maxCol, cw.col, endCol);
	}

	return {
		minRow,
		maxRow,
		minCol,
		maxCol,
		width: maxCol - minCol + 1,
		height: maxRow - minRow + 1
	};
}

/**
 * Recursively searches for word cycles using depth-first search
 */
function addToCycle(
	firstWord: string,
	firstDirection: Direction,
	firstCrossingLetter: string,
	firstCrossingPosition: { row: number; col: number },
	usedWords: Set<string>,
	cycleSoFar: CycleWord[],
	finalCrossingPositions: { row: number; col: number }[],
	wordBank: string[],
	allowedDirections: Direction[],
	excludedWords: Set<string>,
	foundCycles: WordCycle[],
	gridSize: number,
	cyclesForThisWord: { count: number },
	maxCyclesPerWord: number,
	maxDepth: number = 8
): void {
	// Base case: cycle is too deep
	if (cycleSoFar.length >= maxDepth) return;

	// Early exit if we've found enough cycles for this starting word
	if (cyclesForThisWord.count >= maxCyclesPerWord) return;

	// Try each word in the word bank
	for (const word of wordBank) {
		// Skip excluded words
		if (excludedWords.has(word)) continue;

		// Skip already used words
		if (usedWords.has(word)) continue;

		// Find all occurrences of firstCrossingLetter in this word
		for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
			if (word[letterIndex] !== firstCrossingLetter) continue;

			// Skip first letter (can't overlap due to first letter uniqueness constraint)
			if (letterIndex === 0) continue;

			// Shuffle allowed directions for random exploration
			const shuffledDirections = shuffleArray(allowedDirections);

			// Try each allowed direction for this word
			for (const direction of shuffledDirections) {
				const delta = DIRECTION_DELTAS[direction];

				// Calculate where this word would start if placed to cross at firstCrossingPosition
				const wordStartRow = firstCrossingPosition.row - delta.dr * letterIndex;
				const wordStartCol = firstCrossingPosition.col - delta.dc * letterIndex;

				// Create the cycle word entry
				const cycleWord: CycleWord = {
					word,
					row: wordStartRow,
					col: wordStartCol,
					direction,
					crossingIndex: letterIndex
				};

				// Calculate all positions this word would occupy
				const wordPositions: { row: number; col: number }[] = [];
				for (let i = 0; i < word.length; i++) {
					wordPositions.push({
						row: wordStartRow + delta.dr * i,
						col: wordStartCol + delta.dc * i
					});
				}

				// Check if any of these positions (except the crossing point) overlap with existing cycle words
				let hasInvalidOverlap = false;
				for (const pos of wordPositions) {
					// Skip the crossing point - that's expected
					if (pos.row === firstCrossingPosition.row && pos.col === firstCrossingPosition.col)
						continue;

					// Check against all existing words in cycle
					for (const existingWord of cycleSoFar) {
						const existingDelta = DIRECTION_DELTAS[existingWord.direction];
						for (let i = 0; i < existingWord.word.length; i++) {
							const existingPos = {
								row: existingWord.row + existingDelta.dr * i,
								col: existingWord.col + existingDelta.dc * i
							};

							if (pos.row === existingPos.row && pos.col === existingPos.col) {
								// Found an overlap - check if it's valid
								const letterAtPos = word[wordPositions.indexOf(pos)];
								const existingLetterAtPos = existingWord.word[i];

								if (letterAtPos !== existingLetterAtPos) {
									hasInvalidOverlap = true;
									break;
								}

								// Don't allow overlapping first letters
								if (i === 0 || wordPositions.indexOf(pos) === 0) {
									hasInvalidOverlap = true;
									break;
								}
							}
						}
						if (hasInvalidOverlap) break;
					}
					if (hasInvalidOverlap) break;
				}

				if (hasInvalidOverlap) continue;

				// Check bounding box before continuing - prune if cycle would exceed grid size
				const newCycleSoFar = [...cycleSoFar, cycleWord];
				const bounds = calculateCycleBounds(newCycleSoFar);
				if (bounds.width > gridSize || bounds.height > gridSize) {
					// This word would make the cycle too large to fit in the grid
					continue;
				}

				// Check if this word closes the cycle (crosses back with the first word)
				let closingIndex = -1;
				for (let i = 1; i < word.length; i++) {
					// Skip first letter
					const pos = wordPositions[i];
					for (let j = 0; j < finalCrossingPositions.length; j++) {
						const finalPos = finalCrossingPositions[j];
						if (pos.row === finalPos.row && pos.col === finalPos.col) {
							// Check letter match
							if (word[i] === firstWord[j + 1]) {
								// +1 because finalCrossingPositions skips first letter
								closingIndex = i;
								break;
							}
						}
					}
					if (closingIndex !== -1) break;
				}

				if (closingIndex !== -1 && cycleSoFar.length >= 2) {
					// Found a cycle!
					const completeCycle: WordCycle = {
						words: newCycleSoFar,
						usedWords: new Set([...usedWords, word])
					};
					foundCycles.push(completeCycle);
					cyclesForThisWord.count++;

					// Early exit if we've found enough cycles for this starting word
					if (cyclesForThisWord.count >= maxCyclesPerWord) return;

					// Continue searching for more cycles
					continue;
				}

				// Not a closing word - recurse to continue building the cycle
				// Create array of letter positions and shuffle for random exploration
				const recursionPositions = Array.from({ length: word.length - 1 }, (_, i) => i + 1);
				const shuffledRecursionPositions = shuffleArray(recursionPositions);

				// Try to extend the cycle from each crossing position
				for (const i of shuffledRecursionPositions) {
					const nextLetter = word[i];
					const nextPosition = wordPositions[i];

					const newUsedWords = new Set(usedWords);
					newUsedWords.add(word);

					addToCycle(
						firstWord,
						firstDirection,
						nextLetter,
						nextPosition,
						newUsedWords,
						newCycleSoFar,
						finalCrossingPositions,
						wordBank,
						allowedDirections,
						excludedWords,
						foundCycles,
						gridSize,
						cyclesForThisWord,
						maxCyclesPerWord,
						maxDepth
					);
				}
			}
		}
	}
}

/**
 * Finds all word cycles in the word bank
 */
function findWordCycles(
	wordBank: string[],
	allowedDirections: Direction[],
	gridSize: number,
	maxCycles: number = 100,
	maxCyclesPerWord: number = 10
): WordCycle[] {
	const foundCycles: WordCycle[] = [];
	const excludedWords = new Set<string>();

	// Shuffle word bank for randomization
	const shuffledWordBank = shuffleArray(wordBank);

	// Try starting with each word
	for (const firstWord of shuffledWordBank) {
		if (excludedWords.has(firstWord)) continue;

		// Early exit if we've found enough cycles
		if (foundCycles.length >= maxCycles) {
			console.log(`[CYCLE DETECTION] Stopped early after finding ${maxCycles} cycles`);
			break;
		}

		// Track cycles found for this starting word
		const cyclesBeforeThisWord = foundCycles.length;

		// Place the first word at origin going in first allowed direction (relative positioning)
		const firstDirection = allowedDirections[0];
		const delta = DIRECTION_DELTAS[firstDirection];

		// Calculate positions this word occupies (excluding first letter for crossing)
		const finalCrossingPositions: { row: number; col: number }[] = [];
		for (let i = 1; i < firstWord.length; i++) {
			finalCrossingPositions.push({
				row: delta.dr * i,
				col: delta.dc * i
			});
		}

		// Track cycles found for this starting word
		const cyclesForThisWord = { count: 0 };

		// Create array of letter positions and shuffle for random exploration
		const letterPositions = Array.from({ length: firstWord.length - 1 }, (_, i) => i + 1);
		const shuffledPositions = shuffleArray(letterPositions);

		// Try to build cycles starting from each letter of the first word (except first)
		for (const i of shuffledPositions) {
			// Check if we've hit the per-word limit
			if (cyclesForThisWord.count >= maxCyclesPerWord) {
				break;
			}

			const letter = firstWord[i];
			const position = { row: delta.dr * i, col: delta.dc * i };

			const usedWords = new Set([firstWord]);
			const cycleSoFar: CycleWord[] = [
				{
					word: firstWord,
					row: 0,
					col: 0,
					direction: firstDirection,
					crossingIndex: 0 // First word doesn't have a crossing index from previous
				}
			];

			addToCycle(
				firstWord,
				firstDirection,
				letter,
				position,
				usedWords,
				cycleSoFar,
				finalCrossingPositions,
				wordBank,
				allowedDirections,
				excludedWords,
				foundCycles,
				gridSize,
				cyclesForThisWord,
				maxCyclesPerWord
			);
		}

		// Exclude this word and all cycles containing it from future searches
		excludedWords.add(firstWord);

		// Stop if we have fewer than 3 words remaining
		if (wordBank.length - excludedWords.size < 3) break;
	}

	console.log(`[CYCLE DETECTION] Found ${foundCycles.length} cycles`);
	return foundCycles;
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

/**
 * Attempts to place a cycle on the grid at a specific anchor position
 * Returns placed words if successful, null if placement fails
 */
function tryPlaceCycleAt(
	cycle: WordCycle,
	anchorRow: number,
	anchorCol: number,
	grid: InternalGridCell[][],
	placedWords: Map<string, PlacedWord>
): PlacedWord[] | null {
	// Calculate absolute positions for all words in the cycle
	const cycleWordsWithPositions: Array<{
		word: string;
		row: number;
		col: number;
		direction: Direction;
	}> = cycle.words.map((cw) => ({
		word: cw.word,
		row: anchorRow + cw.row,
		col: anchorCol + cw.col,
		direction: cw.direction
	}));

	// Validate all words can be placed
	for (const cw of cycleWordsWithPositions) {
		const candidate: PlacementCandidate = {
			row: cw.row,
			col: cw.col,
			direction: cw.direction,
			intersectionCount: 0
		};

		// Check if this word can be placed
		// For cycle validation, we need a modified check that allows intersections within the cycle
		const cells = getWordCells(cw.word, cw.row, cw.col, cw.direction, grid.length);
		if (!cells) return null; // Out of bounds

		// Check first letter uniqueness
		const firstCell = grid[cells[0].row][cells[0].col];
		if (firstCell.letter !== '') return null;

		// Check letter compatibility
		for (let i = 0; i < cw.word.length; i++) {
			const cell = grid[cells[i].row][cells[i].col];
			const letter = cw.word[i];

			if (cell.letter !== '' && cell.letter !== letter) {
				return null; // Letter mismatch
			}

			if (cell.isFirstLetter && i !== 0) {
				return null; // Would overlap another word's first letter
			}
		}

		// Check for duplicate word
		if (placedWords.has(cw.word)) return null;
	}

	// All words can be placed - do the placement
	const placed: PlacedWord[] = [];
	let wordIndex = 0;

	for (const cw of cycleWordsWithPositions) {
		const cells = getWordCells(cw.word, cw.row, cw.col, cw.direction, grid.length)!;
		const wordId = `${cw.word}-cycle-${wordIndex}`;

		// Place letters on grid
		for (let i = 0; i < cw.word.length; i++) {
			const cell = grid[cells[i].row][cells[i].col];
			cell.letter = cw.word[i];

			if (i === 0) {
				cell.isFirstLetter = true;
			}

			if (!cell.wordIds) {
				cell.wordIds = new Set();
			}
			cell.wordIds.add(wordId);
		}

		placed.push({
			word: cw.word,
			id: wordId,
			startRow: cw.row,
			startCol: cw.col,
			direction: cw.direction,
			cells
		});

		wordIndex++;
	}

	return placed;
}

/**
 * Finds all valid placements for a cycle on the grid
 */
function findValidCyclePlacements(
	cycle: WordCycle,
	grid: InternalGridCell[][],
	placedWords: Map<string, PlacedWord>
): CyclePlacement[] {
	const validPlacements: CyclePlacement[] = [];

	// Calculate the bounding box of the cycle (in relative coordinates)
	let minRow = 0;
	let maxRow = 0;
	let minCol = 0;
	let maxCol = 0;

	for (const cw of cycle.words) {
		const delta = DIRECTION_DELTAS[cw.direction];
		const endRow = cw.row + delta.dr * (cw.word.length - 1);
		const endCol = cw.col + delta.dc * (cw.word.length - 1);

		minRow = Math.min(minRow, cw.row, endRow);
		maxRow = Math.max(maxRow, cw.row, endRow);
		minCol = Math.min(minCol, cw.col, endCol);
		maxCol = Math.max(maxCol, cw.col, endCol);
	}

	const cycleHeight = maxRow - minRow + 1;
	const cycleWidth = maxCol - minCol + 1;

	// Try placing the cycle at each possible position in the grid
	for (let anchorRow = -minRow; anchorRow <= grid.length - cycleHeight - minRow; anchorRow++) {
		for (let anchorCol = -minCol; anchorCol <= grid.length - cycleWidth - minCol; anchorCol++) {
			// Create a temporary grid copy to test placement
			const testGrid = grid.map((row) =>
				row.map((cell) => ({ ...cell, wordIds: new Set(cell.wordIds) }))
			);

			const placed = tryPlaceCycleAt(cycle, anchorRow, anchorCol, testGrid, placedWords);

			if (placed) {
				validPlacements.push({
					cycle,
					anchorRow,
					anchorCol
				});
			}
		}
	}

	return validPlacements;
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
	allowedDirections: Direction[],
	cyclesPlaced: number = 0
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

	// 5. Cycle bonus (reward grids with cycles)
	const cycleScore = cyclesPlaced;

	// Calculate weighted score
	const score =
		wordsPlacedScore * QUALITY_WEIGHTS.wordsPlaced +
		directionalBalanceScore * QUALITY_WEIGHTS.directionalBalance +
		spatialDistributionScore * QUALITY_WEIGHTS.spatialDistribution +
		uniquenessScore * QUALITY_WEIGHTS.uniquenessScore +
		cycleScore * QUALITY_WEIGHTS.cycleBonus;

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
	config: GridConfig,
	cycles: WordCycle[]
): {
	grid: InternalGridCell[][];
	placedWords: PlacedWord[];
	wordsAttempted: number;
	cyclesPlaced: number;
} {
	const grid = createEmptyGrid(config.gridSize);
	const placedWords = new Map<string, PlacedWord>();
	const placedWordsList: PlacedWord[] = [];
	let cyclesPlaced = 0;

	// Phase 1: Try to place cycles first
	const consumedWords = new Set<string>();
	const shuffledCycles = shuffleArray(cycles);

	for (const cycle of shuffledCycles) {
		// Skip if any word in this cycle has already been placed
		let hasConsumedWord = false;
		for (const word of cycle.usedWords) {
			if (consumedWords.has(word)) {
				hasConsumedWord = true;
				break;
			}
		}
		if (hasConsumedWord) continue;

		// Find valid placements for this cycle
		const validPlacements = findValidCyclePlacements(cycle, grid, placedWords);

		if (validPlacements.length > 0) {
			// Pick a random placement
			const placement = validPlacements[Math.floor(Math.random() * validPlacements.length)];

			// Place the cycle
			const placed = tryPlaceCycleAt(
				placement.cycle,
				placement.anchorRow,
				placement.anchorCol,
				grid,
				placedWords
			);

			if (placed) {
				// Add all placed words to our tracking
				for (const pw of placed) {
					placedWords.set(pw.word, pw);
					placedWordsList.push(pw);
					consumedWords.add(pw.word);
				}
				cyclesPlaced++;
				console.log(
					`[CYCLE PLACED] Cycle with ${placed.length} words at (${placement.anchorRow}, ${placement.anchorCol})`
				);
			}
		}
	}

	// Phase 2: Fill remaining space with individual words
	// Shuffle word bank and remove consumed words
	const remainingWords = wordBank.filter((w) => !consumedWords.has(w));
	const shuffledWords = shuffleArray(remainingWords);

	// Calculate target capacity
	const targetCapacity =
		config.gridSize *
		config.gridSize *
		(config.targetCapacityFactor ?? CAPACITY_FACTOR[config.density]);

	// Get intersection bias
	const intersectionBias = config.intersectionBias ?? INTERSECTION_BIAS[config.density];

	let currentCapacity = placedWordsList.reduce((sum, pw) => sum + pw.word.length, 0);
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

	return { grid, placedWords: placedWordsList, wordsAttempted, cyclesPlaced };
}

/**
 * Generates a word search grid using Monte Carlo approach
 * Main entry point
 */
export function generateGrid(
	wordBankEntries: import('./types.js').WordEntry[],
	allowedDirections: Direction[],
	gridSize: number,
	density: 'sparse' | 'normal' | 'dense'
): { grid: GridCell[][]; wordList: import('./types.js').WordEntry[]; metrics: PerformanceMetrics } {
	const totalStart = performance.now();

	// Phase 1: Preprocessing
	const preprocessingStart = performance.now();
	// Extract gridValues for internal processing
	const gridValues = wordBankEntries.map((entry) => entry.gridValue);
	const filtered = filterWordBank(gridValues, gridSize);
	const wordBankSet = new Set(filtered);

	// Create a map from gridValue to WordEntry for later lookup
	const gridValueToEntry = new Map<string, import('./types.js').WordEntry>();
	for (const entry of wordBankEntries) {
		gridValueToEntry.set(entry.gridValue, entry);
	}

	const preprocessingMs = performance.now() - preprocessingStart;

	// Phase 1.5: Cycle Detection
	const cycleDetectionStart = performance.now();
	let cycles: WordCycle[] = [];
	if (canSupportCycles(allowedDirections)) {
		cycles = findWordCycles(filtered, allowedDirections, gridSize);
	} else {
		console.log('[CYCLE DETECTION] Skipped - allowed directions cannot support cycles');
	}
	const cycleDetectionMs = performance.now() - cycleDetectionStart;

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
	let bestCyclesPlaced = 0;
	let totalWordsAttempted = 0;
	let totalCyclesPlaced = 0;

	for (let attempt = 0; attempt < MONTE_CARLO_ATTEMPTS; attempt++) {
		const { grid, placedWords, wordsAttempted, cyclesPlaced } = generateSingleGrid(
			filtered,
			config,
			cycles
		);
		totalWordsAttempted += wordsAttempted;
		totalCyclesPlaced += cyclesPlaced;

		const score = scoreGrid(grid, placedWords, allowedDirections, cyclesPlaced);

		if (score > bestScore) {
			bestScore = score;
			bestGrid = grid;
			bestPlacedWords = placedWords;
			bestCyclesPlaced = cyclesPlaced;
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
	const finalScore = bestGrid
		? scoreGrid(bestGrid, bestPlacedWords, allowedDirections, bestCyclesPlaced)
		: 0;
	const scoringMs = performance.now() - scoringStart;

	const totalMs = performance.now() - totalStart;

	// Convert to external format
	const externalGrid = bestGrid ? convertToExternalGrid(bestGrid) : createEmptyGrid(gridSize);

	// Map back from gridValues to WordEntry objects
	const wordList = bestPlacedWords
		.map((pw) => gridValueToEntry.get(pw.word))
		.filter((entry): entry is import('./types.js').WordEntry => entry !== undefined)
		.sort((a, b) => a.displayValue.localeCompare(b.displayValue));

	const metrics: PerformanceMetrics = {
		preprocessingMs,
		cycleDetectionMs,
		placementMs,
		randomFillMs,
		scoringMs,
		totalMs,
		wordsPlaced: bestPlacedWords.length,
		wordsAttempted: totalWordsAttempted / MONTE_CARLO_ATTEMPTS,
		cyclesDetected: cycles.length,
		cyclesPlaced: bestCyclesPlaced
	};

	console.log('Grid generation metrics:', metrics);
	console.log('Final score:', finalScore);
	console.log(
		'Words placed:',
		wordList.map((w) => w.displayValue)
	);
	if (bestCyclesPlaced > 0) {
		console.log(`🔄 Cycles placed: ${bestCyclesPlaced} out of ${cycles.length} detected`);
	}

	return { grid: convertToExternalGrid(externalGrid), wordList, metrics };
}

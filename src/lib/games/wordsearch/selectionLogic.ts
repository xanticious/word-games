/**
 * Selection logic for Word Search game
 */

import type { GridCell, Direction } from './types.js';

/**
 * Extracts the letters from selected cells to form a word
 */
export function getSelectedWord(grid: GridCell[][]): string {
	const letters: string[] = [];

	for (const row of grid) {
		for (const cell of row) {
			if (cell.isSelected) {
				letters.push(cell.letter);
			}
		}
	}

	return letters.join('');
}

/**
 * Gets all cells between two points (inclusive)
 * Supports horizontal, vertical, and diagonal lines
 */
export function getCellsBetween(
	startRow: number,
	startCol: number,
	endRow: number,
	endCol: number,
	gridSize: number
): { row: number; col: number }[] {
	const cells: { row: number; col: number }[] = [];

	const rowDiff = endRow - startRow;
	const colDiff = endCol - startCol;

	// Calculate direction
	const rowStep = rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1;
	const colStep = colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1;

	// Validate that it's a straight line (horizontal, vertical, or diagonal)
	if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
		// Not a valid line
		return [];
	}

	// Build the path
	let currentRow = startRow;
	let currentCol = startCol;

	while (currentRow >= 0 && currentRow < gridSize && currentCol >= 0 && currentCol < gridSize) {
		cells.push({ row: currentRow, col: currentCol });

		if (currentRow === endRow && currentCol === endCol) {
			break;
		}

		currentRow += rowStep;
		currentCol += colStep;
	}

	return cells;
}

/**
 * Determines the direction from start to end coordinates
 */
export function getDirection(
	startRow: number,
	startCol: number,
	endRow: number,
	endCol: number
): Direction {
	const rowDiff = endRow - startRow;
	const colDiff = endCol - startCol;

	if (rowDiff === 0 && colDiff > 0) return 'right';
	if (rowDiff === 0 && colDiff < 0) return 'left';
	if (colDiff === 0 && rowDiff > 0) return 'down';
	if (colDiff === 0 && rowDiff < 0) return 'up';
	if (rowDiff < 0 && colDiff > 0) return 'ne';
	if (rowDiff > 0 && colDiff > 0) return 'se';
	if (rowDiff > 0 && colDiff < 0) return 'sw';
	if (rowDiff < 0 && colDiff < 0) return 'nw';

	return 'right'; // fallback
}

/**
 * Checks if the selected cells form a valid word from the word list
 */
export function validateSelection(
	selectedCells: { row: number; col: number }[],
	grid: GridCell[][],
	wordList: string[]
): string | null {
	if (selectedCells.length === 0) {
		return null;
	}

	// Build the word from selected cells
	const word = selectedCells.map((cell) => grid[cell.row][cell.col].letter).join('');

	// Check forward
	if (wordList.includes(word)) {
		return word;
	}

	// Check backward
	const reversedWord = word.split('').reverse().join('');
	if (wordList.includes(reversedWord)) {
		return reversedWord;
	}

	return null;
}

/**
 * Grid generation logic for Word Search game
 */

import type { GridCell, Direction } from './types.js';

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
 * Generates a word search grid
 * TODO: Implement actual word placement logic
 * For now, returns a grid filled with 'A'
 */
export function generateGrid(
	wordList: string[],
	allowedDirections: Direction[],
	gridSize: number
): GridCell[][] {
	const grid: GridCell[][] = [];

	// Create empty grid filled with 'A'
	for (let row = 0; row < gridSize; row++) {
		const gridRow: GridCell[] = [];
		for (let col = 0; col < gridSize; col++) {
			gridRow.push({
				letter: 'A',
				row,
				col,
				isSelected: false
			});
		}
		grid.push(gridRow);
	}

	return grid;
}

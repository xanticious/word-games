/**
 * Performance comparison test for cycle detection optimization
 */

import { describe, it, expect } from 'vitest';
import { generateGrid } from './gridGenerator.js';
import type { Direction } from './types.js';

describe('Cycle Detection Performance', () => {
	it('should efficiently prune oversized cycles', () => {
		// Use a larger word bank to generate many potential cycles
		const wordBank = [
			'PROGRAMMING',
			'ALGORITHM',
			'COMPUTER',
			'SOFTWARE',
			'HARDWARE',
			'NETWORK',
			'DATABASE',
			'SECURITY',
			'FUNCTION',
			'VARIABLE',
			'CONSTANT',
			'PROTOCOL'
		];

		// Small grid size - many words won't fit in cycles
		const gridSize = 10;
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up'];
		const density = 'normal' as const;

		const startTime = performance.now();
		const result = generateGrid(wordBank, allowedDirections, gridSize, density);
		const endTime = performance.now();

		console.log('Performance metrics:', {
			totalTime: `${(endTime - startTime).toFixed(2)}ms`,
			cycleDetectionTime: `${result.metrics.cycleDetectionMs.toFixed(2)}ms`,
			cyclesDetected: result.metrics.cyclesDetected,
			cyclesPlaced: result.metrics.cyclesPlaced,
			wordsPlaced: result.wordList.length
		});

		// Cycle detection should complete in reasonable time even with many words
		// With 12 long words on a 10x10 grid, this is a stress test
		expect(result.metrics.cycleDetectionMs).toBeLessThan(5000); // Less than 5 seconds

		// Should successfully generate a grid
		expect(result.grid).toHaveLength(gridSize);
		expect(result.wordList.length).toBeGreaterThan(0);

		// The optimization should limit cycles found
		expect(result.metrics.cyclesDetected).toBeLessThan(10000);
	});

	it('should handle large grids efficiently', () => {
		const wordBank = ['BACK', 'SCAM', 'GROOM', 'CAMO', 'MOAT', 'COAT'];
		const gridSize = 20; // Large
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up', 'ne', 'se', 'sw', 'nw'];
		const density = 'dense' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		console.log('Large grid metrics:', {
			gridSize,
			cycleDetectionTime: `${result.metrics.cycleDetectionMs.toFixed(2)}ms`,
			cyclesDetected: result.metrics.cyclesDetected,
			cyclesPlaced: result.metrics.cyclesPlaced
		});

		// With a larger grid, more cycles should be valid
		expect(result.metrics.cycleDetectionMs).toBeLessThan(2000);
		expect(result.grid).toHaveLength(gridSize);
	});
});

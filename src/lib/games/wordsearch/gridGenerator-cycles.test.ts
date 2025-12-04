/**
 * Tests for cycle detection in word search grid generation
 */

import { describe, it, expect } from 'vitest';
import { generateGrid } from './gridGenerator.js';
import type { Direction } from './types.js';

describe('Word Search Cycle Detection', () => {
	it('should detect and place cycles when directions support it', () => {
		const wordBank = ['BACK', 'SCAM', 'GROOM', 'CAMO'];
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up'];
		const gridSize = 15;
		const density = 'normal' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		// Should have detected cycles
		expect(result.metrics.cyclesDetected).toBeGreaterThan(0);

		// Grid should be generated successfully
		expect(result.grid).toHaveLength(gridSize);
		expect(result.grid[0]).toHaveLength(gridSize);

		// Should have placed some words
		expect(result.wordList.length).toBeGreaterThan(0);

		console.log('Cycle metrics:', {
			detected: result.metrics.cyclesDetected,
			placed: result.metrics.cyclesPlaced,
			wordsPlaced: result.wordList.length
		});
	});

	it('should skip cycle detection when directions all have same slope', () => {
		const wordBank = ['BACK', 'SCAM', 'GROOM', 'CAMO'];
		const allowedDirections: Direction[] = ['ne', 'sw']; // Same slope diagonal
		const gridSize = 15;
		const density = 'normal' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		// Should not have detected cycles (same slope)
		expect(result.metrics.cyclesDetected).toBe(0);
		expect(result.metrics.cyclesPlaced).toBe(0);
	});

	it('should handle word bank with no possible cycles', () => {
		const wordBank = ['ABC', 'DEF', 'GHI']; // No shared letters
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up'];
		const gridSize = 15;
		const density = 'normal' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		// Might detect 0 cycles due to no shared letters
		expect(result.metrics.cyclesDetected).toBe(0);
		expect(result.metrics.cyclesPlaced).toBe(0);

		// But should still place words normally
		expect(result.wordList.length).toBeGreaterThan(0);
	});

	it('should work with 8-directional grid', () => {
		const wordBank = ['HUGS', 'APPLE', 'CAPE', 'EVERY', 'LEAP', 'PACE'];
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up', 'ne', 'se', 'sw', 'nw'];
		const gridSize = 20;
		const density = 'dense' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		// With 8 directions, cycles should be possible
		expect(result.metrics.cyclesDetected).toBeGreaterThanOrEqual(0);

		// Grid should be valid
		expect(result.grid).toHaveLength(gridSize);
		expect(result.wordList.length).toBeGreaterThan(0);

		console.log('8-directional cycle metrics:', {
			detected: result.metrics.cyclesDetected,
			placed: result.metrics.cyclesPlaced,
			wordsPlaced: result.wordList.length
		});
	});

	it('should include cycle time in performance metrics', () => {
		const wordBank = ['BACK', 'SCAM', 'GROOM', 'CAMO'];
		const allowedDirections: Direction[] = ['right', 'down', 'left', 'up'];
		const gridSize = 15;
		const density = 'normal' as const;

		const result = generateGrid(wordBank, allowedDirections, gridSize, density);

		// Cycle detection time should be recorded
		expect(result.metrics.cycleDetectionMs).toBeGreaterThanOrEqual(0);
		expect(result.metrics.cycleDetectionMs).toBeLessThan(result.metrics.totalMs);
	});
});

/**
 * Tests for Wordle game logic, especially hard mode and repeated letter handling
 *
 * Note: These tests bypass initialization to avoid dictionary loading issues.
 * The game state is manually configured to test the constraint logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WordleGame } from './game.js';
import type { WordleConfig } from './types.js';

describe('WordleGame - Hard Mode Validation', () => {
	let game: WordleGame;

	beforeEach(() => {
		const config: WordleConfig = {
			wordLength: 5,
			maxGuesses: 6,
			difficulty: 'medium',
			hardMode: true,
			easyMode: false,
			rescueMode: false,
			targetWords: 'common'
		};
		game = new WordleGame(config);

		// Manually set game as active and initialized to bypass dictionary loading
		const gameState = game.getState() as any;
		gameState.isActive = true;
		gameState.targetWord = 'badge';

		// Simulate initialized state
		(game as any).initialized = true;
	});

	it('should reject guess that does not use green letter', () => {
		const gameState = game.getState() as any;
		gameState.targetWord = 'badge';

		// First guess: BATCH -> B(green), A(green), T(gray), C(gray), H(gray)
		for (const letter of 'batch') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess a word without B in first position (but still valid dictionary word)
		for (const letter of 'water') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		expect(result.message).toContain('1st letter must be B');
	});

	it('should reject guess that includes gray letter', () => {
		const gameState = game.getState() as any;
		gameState.targetWord = 'badge';

		// First guess: BATCH -> B(green), A(green), T(gray), C(gray), H(gray)
		for (const letter of 'batch') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess a word with T (which was gray)
		for (const letter of 'bated') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		// The error message shows position constraint violation for T (position exclusion)
		expect(result.message).toMatch(/cannot be T|Guess cannot contain T/i);
	});

	it('should handle repeated letters correctly - demonstrates letter count constraints', () => {
		const gameState = game.getState() as any;
		// Target: "SAFER" (has S, A, F, E, R - only one R)
		gameState.targetWord = 'safer';

		// Guess: RARER -> R(yellow), A(green), R(yellow), E(yellow), R(yellow)
		// Wait, target only has 1 R, so we'd get: R(yellow), A(green), R(gray), E(yellow), R(gray)
		// This tells us there's exactly 1 R in the word
		// Let's use a simpler scenario

		// Actually, let's test with target "BASAL" and guess "LLAMA"
		gameState.targetWord = 'basal';

		// Guess: LLAMA -> L(yellow), L(gray), A(yellow), M(gray), A(yellow)
		// This means exactly 1 L in the word, and at least 2 A's
		for (const letter of 'llama') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess "LABEL" which has 2 L's - should fail (we know there's only 1 L max)
		for (const letter of 'label') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		// Should reject because of too many L's or position constraints
		expect(result.message).toMatch(/cannot contain more than 1 L|cannot be|must/i);
	});

	it('should handle case where repeated letter has some green and some gray', () => {
		const gameState = game.getState() as any;
		// Target: "REBEL" (has R, E twice, B, L)
		gameState.targetWord = 'rebel';

		// Guess: EERIE -> E(yellow), E(green), R(yellow), I(gray), E(gray)
		// This means: exactly 2 E's in the word
		for (const letter of 'eerie') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess with 3 E's - should fail
		// Note: This would need to be a real dictionary word, so this test may need adjustment
		for (const letter of 'geese') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		expect(result.message).toMatch(/cannot contain more than 2 E/i);
	});

	it('should require minimum number of repeated letters', () => {
		const gameState = game.getState() as any;
		// Target: "SPELL" (has S, P, E, L twice)
		gameState.targetWord = 'spell';

		// Guess: HELLO -> H(gray), E(yellow), L(yellow), L(green), O(gray)
		// This means: at least 2 L's required, one must be in position 3
		for (const letter of 'hello') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess "SPELT" with 2 L's and proper E, but L positions wrong
		// Actually, let's try "SWELL" which has E and L in position 3 but only has 2 L's total
		for (const letter of 'swelt') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		// Could fail on L count or position constraints
		expect(result.message).toMatch(/must contain at least 2 L|letter cannot be/i);
	});

	it('should handle gray letter exclusion for all positions', () => {
		const gameState = game.getState() as any;
		gameState.targetWord = 'badge';

		// First guess: TOUCH -> T(gray), O(gray), U(gray), C(gray), H(gray)
		for (const letter of 'touch') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Try to guess a word with any gray letter (T, O, U, C, or H)
		for (const letter of 'batch') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(false);
		// Should reject because T, C, or H are gray letters
		expect(result.message).toMatch(/cannot (be|contain) [TUCH]/i);
	});

	it('should not accumulate letter counts across multiple guesses - FAIRY example', () => {
		const gameState = game.getState() as any;
		gameState.targetWord = 'fairy';

		// Guess 1: PRISE -> P(gray), R(yellow), I(green), S(gray), E(gray)
		// This tells us: at least 1 R (not in position 1), I is in position 2
		for (const letter of 'prise') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// Guess 2: CAIRD -> C(gray), A(green), I(green), R(green), D(gray)
		// This tells us: A in position 1, I in position 2, R in position 3, at least 1 R
		for (const letter of 'caird') {
			game.addLetter(letter);
		}
		game.submitGuess();

		// At this point, we know:
		// - At least 1 R (from both guesses, but not cumulative)
		// - Position 1 must be A
		// - Position 2 must be I
		// - Position 3 must be R

		// Try to guess FAIRY which has exactly 1 R - should succeed
		for (const letter of 'fairy') {
			game.addLetter(letter);
		}
		const result = game.submitGuess();

		expect(result.success).toBe(true);
		// Should NOT say "must contain at least 2 R's"
	});
});

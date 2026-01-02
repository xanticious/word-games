/**
 * Integration tests for complete stress pattern scoring in couplets
 */

import { describe, it, expect } from 'vitest';
import { calculateCompletionScore } from './scoreCalculator.js';
import type { PhoneticEntry } from '$lib/dictionary.js';

describe('Stress Pattern Scoring Integration', () => {
	const mockPhoneticEntries: PhoneticEntry[] = [
		{
			word: 'paterwa',
			phonetic: 'P AE1 T ER0 W AH0',
			sounds: ['P', 'AE1', 'T', 'ER0', 'W', 'AH0']
		},
		{ word: 'is', phonetic: 'IH1 Z', sounds: ['IH1', 'Z'] },
		{ word: 'a', phonetic: 'AH0', sounds: ['AH0'] },
		{ word: 'village', phonetic: 'V IH1 L IH0 JH', sounds: ['V', 'IH1', 'L', 'IH0', 'JH'] },
		{ word: 'known', phonetic: 'N OW1 N', sounds: ['N', 'OW1', 'N'] },
		{ word: 'for', phonetic: 'F AO1 R', sounds: ['F', 'AO1', 'R'] },
		{ word: 'its', phonetic: 'IH1 T S', sounds: ['IH1', 'T', 'S'] },
		{ word: 'spillage', phonetic: 'S P IH1 L IH0 JH', sounds: ['S', 'P', 'IH1', 'L', 'IH0', 'JH'] },
		{ word: 'with', phonetic: 'W IH1 DH', sounds: ['W', 'IH1', 'DH'] },
		{ word: 'poisoned', phonetic: 'P OY1 Z AH0 N D', sounds: ['P', 'OY1', 'Z', 'AH0', 'N', 'D'] },
		{
			word: 'foliage',
			phonetic: 'F OW1 L IY0 IH0 JH',
			sounds: ['F', 'OW1', 'L', 'IY0', 'IH0', 'JH']
		},
		{ word: 'the', phonetic: 'DH AH0', sounds: ['DH', 'AH0'] },
		{ word: 'cat', phonetic: 'K AE1 T', sounds: ['K', 'AE1', 'T'] },
		{ word: 'in', phonetic: 'IH1 N', sounds: ['IH1', 'N'] },
		{ word: 'hat', phonetic: 'HH AE1 T', sounds: ['HH', 'AE1', 'T'] }
	];

	describe('Example from design doc', () => {
		it('should correctly analyze "Paterwa is a village" / "Known for its spillage"', () => {
			const promptLine = 'paterwa is a village';
			const completionLine = 'known for its spillage';

			const score = calculateCompletionScore(promptLine, completionLine, [], mockPhoneticEntries);

			// Prompt: P AE1 T ER0 W AH0 + IH1 Z + AH0 + V IH1 L IH0 JH
			// Pattern: O.o.o.O.o.O.o
			expect(score.stressPattern.promptPattern).toBe('O.o.o.O.o.O.o');

			// Completion: N OW1 N + F AO1 R + IH1 T S + S P IH1 L IH0 JH
			// Pattern: O.O.O.O.o
			expect(score.stressPattern.completionPattern).toBe('O.O.O.O.o');

			// Patterns are quite different, should get low score
			expect(score.stressPattern.points).toBeGreaterThan(5);
			expect(score.stressPattern.points).toBeLessThan(20);
		});

		it('should correctly analyze matching stress patterns', () => {
			// "the cat" = o.O
			// "in hat" = O.O (close but not perfect)
			const score = calculateCompletionScore('the cat', 'in hat', [], mockPhoneticEntries);

			expect(score.stressPattern.promptPattern).toBe('o.O');
			expect(score.stressPattern.completionPattern).toBe('O.O');

			// One difference in 2 syllables = 50% match
			expect(score.stressPattern.distance).toBe(1);
			expect(score.stressPattern.points).toBeGreaterThan(10);
			expect(score.stressPattern.points).toBeLessThan(20);
		});
	});

	describe('Syllable count integration', () => {
		it('should award points for both syllable and stress matches', () => {
			const score = calculateCompletionScore('the cat', 'the cat', [], mockPhoneticEntries);

			// Identical = perfect syllable match
			expect(score.syllables.points).toBe(10);
			// Identical = perfect stress match
			expect(score.stressPattern.points).toBe(20);
		});

		it('should differentiate between syllable count and stress pattern', () => {
			// Same syllable count, different stress
			const score = calculateCompletionScore('the cat', 'in hat', [], mockPhoneticEntries);

			// 2 syllables each = exact match
			expect(score.syllables.difference).toBe(0);
			expect(score.syllables.points).toBe(10);

			// Different stress = lower points
			expect(score.stressPattern.distance).toBeGreaterThan(0);
			expect(score.stressPattern.points).toBeLessThan(20);
		});
	});

	describe('Visual stress pattern display', () => {
		it('should format stress patterns for display', () => {
			const score = calculateCompletionScore(
				'paterwa is a village',
				'known for its spillage',
				[],
				mockPhoneticEntries
			);

			// Patterns should be dot-separated with O (stressed) and o (unstressed)
			expect(score.stressPattern.promptPattern).toMatch(/^[Oo](\.[Oo])*$/);
			expect(score.stressPattern.completionPattern).toMatch(/^[Oo](\.[Oo])*$/);
		});

		it('should show stress patterns for single-syllable words', () => {
			const score = calculateCompletionScore('cat', 'hat', [], mockPhoneticEntries);

			expect(score.stressPattern.promptPattern).toBe('O');
			expect(score.stressPattern.completionPattern).toBe('O');
			expect(score.stressPattern.points).toBe(20); // Perfect match
		});
	});
});

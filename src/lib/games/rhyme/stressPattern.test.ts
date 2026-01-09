/**
 * Unit tests for stress pattern detection and analysis
 */

import { describe, it, expect } from 'vitest';
import { parsePronunciation, getPhrasePhonetics, parseWordPhonetics } from './phoneticAnalyzer.js';
import { calculateStressPatternScore } from './rhymeEngine.js';
import type { PhoneticEntry } from '$lib/dictionary.js';

describe('Stress Pattern Detection', () => {
	// Mock phonetic data based on actual CMU dictionary format
	const mockPhoneticEntries: PhoneticEntry[] = [
		{
			word: 'cat',
			phonetic: 'K AE1 T',
			sounds: ['K', 'AE1', 'T']
		},
		{
			word: 'house',
			phonetic: 'HH AW1 S',
			sounds: ['HH', 'AW1', 'S']
		},
		{
			word: 'running',
			phonetic: 'R AH1 N IH0 NG',
			sounds: ['R', 'AH1', 'N', 'IH0', 'NG']
		},
		{
			word: 'beautiful',
			phonetic: 'B Y UW1 T AH0 F AH0 L',
			sounds: ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L']
		},
		{
			word: 'computer',
			phonetic: 'K AH0 M P Y UW1 T ER0',
			sounds: ['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER0']
		},
		{
			word: 'baroque',
			phonetic: 'B ER0 OW1 K',
			sounds: ['B', 'ER0', 'OW1', 'K']
		},
		{
			word: 'borrow',
			phonetic: 'B AA1 R OW2',
			sounds: ['B', 'AA1', 'R', 'OW2']
		},
		{
			word: 'the',
			phonetic: 'DH AH0',
			sounds: ['DH', 'AH0']
		},
		{
			word: 'is',
			phonetic: 'IH1 Z',
			sounds: ['IH1', 'Z']
		},
		{
			word: 'a',
			phonetic: 'AH0',
			sounds: ['AH0']
		},
		{
			word: 'village',
			phonetic: 'V IH1 L IH0 JH',
			sounds: ['V', 'IH1', 'L', 'IH0', 'JH']
		}
	];

	describe('parsePronunciation', () => {
		it('should extract stress pattern from single word', () => {
			// "cat" = K AE1 T -> stress pattern "O" (one stressed syllable)
			const result = parsePronunciation(['K', 'AE1', 'T'], 'K AE1 T');

			expect(result.vowels).toEqual(['AE']);
			expect(result.stressPattern).toBe('O'); // 1 = primary stress = 'O'
		});

		it('should handle multiple syllables with different stress levels', () => {
			// "running" = R AH1 N IH0 NG -> "O." (primary, unstressed)
			const result = parsePronunciation(['R', 'AH1', 'N', 'IH0', 'NG'], 'R AH1 N IH0 NG');

			expect(result.vowels).toEqual(['AH', 'IH']);
			expect(result.stressPattern).toBe('O.'); // 1=O, 0=.
		});

		it('should treat primary stress (1) and secondary stress (2) as different', () => {
			// "borrow" = B AA1 R OW2 -> should be "Oo" (primary, secondary)
			const result = parsePronunciation(['B', 'AA1', 'R', 'OW2'], 'B AA1 R OW2');

			expect(result.vowels).toEqual(['AA', 'OW']);
			expect(result.stressPattern).toBe('Oo'); // 1=O, 2=o
		});

		it('should handle unstressed syllables', () => {
			// "the" = DH AH0 -> "." (unstressed)
			const result = parsePronunciation(['DH', 'AH0'], 'DH AH0');

			expect(result.vowels).toEqual(['AH']);
			expect(result.stressPattern).toBe('.');
		});

		it('should handle complex multi-syllable words', () => {
			// "beautiful" = B Y UW1 T AH0 F AH0 L -> "O.."
			const result = parsePronunciation(
				['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'],
				'B Y UW1 T AH0 F AH0 L'
			);

			expect(result.vowels).toEqual(['UW', 'AH', 'AH']);
			expect(result.stressPattern).toBe('O..');
		});

		it('should handle words with unstressed then stressed pattern', () => {
			// "computer" = K AH0 M P Y UW1 T ER0 -> ".O."
			const result = parsePronunciation(
				['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER0'],
				'K AH0 M P Y UW1 T ER0'
			);

			expect(result.vowels).toEqual(['AH', 'UW', 'ER']);
			expect(result.stressPattern).toBe('.O.');
		});

		it('should correctly count consonants', () => {
			const result = parsePronunciation(['K', 'AE1', 'T'], 'K AE1 T');

			expect(result.consonants).toEqual({
				K: 1,
				T: 1
			});
		});
	});

	describe('getPhrasePhonetics', () => {
		it('should combine stress patterns from multiple words', () => {
			// "the cat" = DH AH0 + K AE1 T -> ".O"
			const result = getPhrasePhonetics('the cat', mockPhoneticEntries);

			expect(result).not.toBeNull();
			expect(result?.vowels).toEqual(['AH', 'AE']);
			expect(result?.stressPattern).toBe('.O');
		});

		it('should handle phrases with multiple stressed syllables', () => {
			// "cat house" = K AE1 T + HH AW1 S -> "OO"
			const result = getPhrasePhonetics('cat house', mockPhoneticEntries);

			expect(result).not.toBeNull();
			expect(result?.stressPattern).toBe('OO');
		});

		it('should handle complex multi-word phrases', () => {
			// "the beautiful house" = DH AH0 + B Y UW1 T AH0 F AH0 L + HH AW1 S
			// -> ".O..O"
			const result = getPhrasePhonetics('the beautiful house', mockPhoneticEntries);

			expect(result).not.toBeNull();
			expect(result?.stressPattern).toBe('.O..O');
		});

		it('should return null if word not in dictionary', () => {
			const result = getPhrasePhonetics('nonexistent word', mockPhoneticEntries);

			expect(result).toBeNull();
		});
	});

	describe('calculateStressPatternScore', () => {
		it('should award maximum points for identical patterns', () => {
			const result = calculateStressPatternScore('OO', 'OO');

			expect(result.points).toBe(20); // max points
			expect(result.distance).toBe(0);
			expect(result.description).toBe('Excellent match');
		});

		it('should penalize different patterns appropriately', () => {
			// "O." vs ".O" - completely different stress placement
			const result = calculateStressPatternScore('O.', '.O');

			expect(result.distance).toBeGreaterThan(0);
			expect(result.points).toBeLessThan(20);
		});

		it('should handle patterns of different lengths', () => {
			// "O" vs "O." - different syllable counts
			const result = calculateStressPatternScore('O', 'O.');

			expect(result.distance).toBeGreaterThan(0);
			expect(result.points).toBeGreaterThan(5); // Should still get some points
			expect(result.points).toBeLessThan(20);
		});

		it('should give partial credit for partially matching patterns', () => {
			// "O.O" vs "O.." - two out of three match
			const result = calculateStressPatternScore('O.O', 'O..');

			expect(result.distance).toBe(1); // Only one difference
			// Distance of 1 on 3 syllables = similarity of 2/3 = 0.667
			// Points = 5 + 0.667 * 15 = 5 + 10 = 15
			expect(result.points).toBe(15);
			expect(result.description).toMatch(/Good match|Fair match/);
		});

		it('should handle baroque vs borrow (different stress)', () => {
			// baroque: B ER0 OW1 K -> ".O"
			// borrow: B AA1 R OW2 -> "Oo"
			const baroque = getPhrasePhonetics('baroque', mockPhoneticEntries);
			const borrow = getPhrasePhonetics('borrow', mockPhoneticEntries);

			expect(baroque?.stressPattern).toBe('.O');
			expect(borrow?.stressPattern).toBe('Oo');

			const result = calculateStressPatternScore(baroque!.stressPattern, borrow!.stressPattern);

			expect(result.distance).toBe(2); // Both syllables differ
			expect(result.points).toBeLessThan(20);
			expect(result.points).toBeGreaterThan(0);
		});

		it('should normalize similarity correctly', () => {
			// Empty patterns should handle gracefully
			const result = calculateStressPatternScore('', '');

			expect(result.points).toBe(20); // Both empty = perfect match
		});

		it('should assign correct descriptions', () => {
			const excellent = calculateStressPatternScore('O.O', 'O.O');
			expect(excellent.description).toBe('Excellent match');

			const good = calculateStressPatternScore('O.O', 'O..');
			expect(good.description).toMatch(/Good match|Fair match/);

			const poor = calculateStressPatternScore('OOO', '...');
			expect(poor.description).toMatch(/Weak match|Poor match/);
		});
	});

	describe('Real-world examples', () => {
		it('should correctly analyze "the cat is running"', () => {
			// "the cat is running" = .OOO.
			const result = getPhrasePhonetics('the cat is running', mockPhoneticEntries);

			expect(result).not.toBeNull();
			expect(result?.stressPattern).toBe('.OOO.');
		});

		it('should correctly analyze "a beautiful village"', () => {
			// "a beautiful village" = .O..O.
			const result = getPhrasePhonetics('a beautiful village', mockPhoneticEntries);

			expect(result).not.toBeNull();
			expect(result?.stressPattern).toBe('.O..O.');
		});

		it('should handle stress comparison for similar phrases', () => {
			const phrase1 = getPhrasePhonetics('the cat', mockPhoneticEntries);
			const phrase2 = getPhrasePhonetics('a house', mockPhoneticEntries);

			expect(phrase1?.stressPattern).toBe('.O');
			expect(phrase2?.stressPattern).toBe('.O');

			const score = calculateStressPatternScore(phrase1!.stressPattern, phrase2!.stressPattern);

			expect(score.points).toBe(20); // Perfect match
			expect(score.description).toBe('Excellent match');
		});
	});

	describe('Edge cases', () => {
		it('should handle single syllable words', () => {
			const cat = getPhrasePhonetics('cat', mockPhoneticEntries);

			expect(cat?.stressPattern).toBe('O');
		});

		it('should handle all unstressed syllables', () => {
			const result = parsePronunciation(['DH', 'AH0'], 'DH AH0');

			expect(result.stressPattern).toBe('.');
		});

		it('should correctly identify vowels vs consonants', () => {
			const result = parsePronunciation(['K', 'AE1', 'T'], 'K AE1 T');

			expect(result.vowels.length).toBe(1);
			expect(Object.keys(result.consonants).length).toBe(2);
		});
	});
});

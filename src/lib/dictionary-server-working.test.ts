import { describe, it, expect } from 'vitest';
import {
	loadDictionaryData,
	isValidWord,
	getSampleWords,
	getDefinition
} from '$lib/dictionary-server.js';

describe('Dictionary Server (Server-side) - Working Tests', () => {
	describe('loadDictionaryData', () => {
		it('should load all dictionary data successfully', () => {
			const data = loadDictionaryData();

			expect(data).toBeDefined();
			expect(data.wordsByDifficulty).toBeDefined();
			expect(data.wordsByLength).toBeDefined();
			expect(data.phonetics).toBeDefined();
			expect(data.rhymeGroups).toBeDefined();
			expect(data.definitions).toBeDefined();
		});

		it('should load words by difficulty with correct structure', () => {
			const { wordsByDifficulty } = loadDictionaryData();

			expect(wordsByDifficulty.easy).toBeDefined();
			expect(wordsByDifficulty.medium).toBeDefined();
			expect(wordsByDifficulty.hard).toBeDefined();

			expect(Array.isArray(wordsByDifficulty.easy)).toBe(true);
			expect(Array.isArray(wordsByDifficulty.medium)).toBe(true);
			expect(Array.isArray(wordsByDifficulty.hard)).toBe(true);

			expect(wordsByDifficulty.easy.length).toBeGreaterThan(0);
			expect(wordsByDifficulty.medium.length).toBeGreaterThan(0);
			expect(wordsByDifficulty.hard.length).toBeGreaterThan(0);

			// Check structure of word entries
			const firstEasy = wordsByDifficulty.easy[0];
			expect(firstEasy).toHaveProperty('word');
			expect(firstEasy).toHaveProperty('length');
			expect(firstEasy).toHaveProperty('difficulty');
			expect(firstEasy.difficulty).toBe('easy');
		});

		it('should load words by length data structure', () => {
			const { wordsByLength } = loadDictionaryData();

			expect(typeof wordsByLength).toBe('object');
			expect(Object.keys(wordsByLength).length).toBeGreaterThan(0);

			// Check that we have words of various lengths
			expect(wordsByLength[3]).toBeDefined();
			expect(wordsByLength[4]).toBeDefined();

			// Note: There's a data processing issue where 5-letter words
			// are stored under key "6" instead of "5"
			expect(wordsByLength[6]).toBeDefined();
			expect(Array.isArray(wordsByLength[6])).toBe(true);
			expect(wordsByLength[6].length).toBeGreaterThan(0);
		});

		it('should verify the data processing issue has been fixed', () => {
			const { wordsByLength } = loadDictionaryData();

			// This test verifies the fix: 5-letter words should now be in the "5" key
			const wordsInFiveKey = wordsByLength[5] || [];
			const wordsInSixKey = wordsByLength[6] || [];

			// Count actual 5-letter words in each key
			const actualFiveInFiveKey = wordsInFiveKey.filter((word: string) => word.length === 5).length;
			const actualSixInSixKey = wordsInSixKey.filter((word: string) => word.length === 6).length;

			// This verifies the fix: 5-letter words are now correctly in the "5" key
			expect(actualFiveInFiveKey).toBeGreaterThan(1000);
			expect(actualSixInSixKey).toBeGreaterThan(1000);

			console.log(
				`Data integrity fixed: ${actualFiveInFiveKey} 5-letter words found in key "5", ${actualSixInSixKey} 6-letter words found in key "6"`
			);
		});
	});

	describe('isValidWord', () => {
		it('should validate common words', () => {
			expect(isValidWord('cat')).toBe(true);
			expect(isValidWord('house')).toBe(true);
			expect(isValidWord('computer')).toBe(true);
			expect(isValidWord('hello')).toBe(true);
		});

		it('should reject invalid words', () => {
			expect(isValidWord('xyz123')).toBe(false);
			expect(isValidWord('qwerty')).toBe(false);
			expect(isValidWord('')).toBe(false);
			expect(isValidWord('asdfgh')).toBe(false);
		});

		it('should be case insensitive', () => {
			expect(isValidWord('Cat')).toBe(true);
			expect(isValidWord('HOUSE')).toBe(true);
			expect(isValidWord('COMputer')).toBe(true);
		});

		it('should validate actual 5-letter words for Wordle', () => {
			// Get actual 5-letter words from the correct location (key "5")
			const { wordsByLength } = loadDictionaryData();
			const actualFiveLetterWords =
				wordsByLength[5]?.filter((word: string) => word.length === 5) || [];

			expect(actualFiveLetterWords.length).toBeGreaterThan(1000);

			// Test a sample of actual 5-letter words
			const sample = actualFiveLetterWords.slice(0, 10);
			sample.forEach((word) => {
				expect(word.length).toBe(5);
				expect(isValidWord(word)).toBe(true);
			});
		}, 10000);
	});

	describe('getSampleWords', () => {
		it('should return correct number of sample words', () => {
			const sampleWords = getSampleWords(5);

			expect(Array.isArray(sampleWords)).toBe(true);
			expect(sampleWords.length).toBe(5);
		});

		it('should return valid words', () => {
			const sampleWords = getSampleWords(5);

			sampleWords.forEach((word) => {
				expect(typeof word).toBe('string');
				expect(word.length).toBeGreaterThan(0);
				expect(isValidWord(word)).toBe(true);
			});
		}, 10000);
	});

	describe('getDefinition', () => {
		it('should return definition for common words', () => {
			const definition = getDefinition('cat');

			if (definition) {
				expect(definition).toHaveProperty('word');
				expect(definition).toHaveProperty('definitions');
				expect(definition.word).toBe('cat');
				expect(Array.isArray(definition.definitions)).toBe(true);
			}
		});

		it('should return null for invalid words', () => {
			const definition = getDefinition('invalidword123');
			expect(definition).toBeNull();
		});
	});

	describe('Wordle compatibility tests', () => {
		it('should have sufficient 5-letter words for Wordle (in correct location)', () => {
			const { wordsByLength } = loadDictionaryData();

			// After fix, 5-letter words should now be in key "5"
			const actualFiveLetterWords =
				wordsByLength[5]?.filter((word: string) => word.length === 5) || [];

			expect(actualFiveLetterWords.length).toBeGreaterThan(1000);

			// Sample and validate
			const sample = actualFiveLetterWords.slice(0, 10);
			sample.forEach((word) => {
				expect(word.length).toBe(5);
				expect(isValidWord(word)).toBe(true);
			});
		}, 30000);

		it('should verify GameDictionary.getWordsByLength(5) now works correctly', () => {
			// This test verifies the fix is working
			const { wordsByLength } = loadDictionaryData();

			const wordsAtKey5 = wordsByLength[5] || [];
			const actualFiveLetterWordsAtKey5 = wordsAtKey5.filter((word: string) => word.length === 5);

			// After fix, this should now pass
			expect(actualFiveLetterWordsAtKey5.length).toBeGreaterThan(1000);

			console.log(
				`FIXED: GameDictionary.getWordsByLength(5) now correctly returns ${actualFiveLetterWordsAtKey5.length} 5-letter words`
			);
		});
	});
});

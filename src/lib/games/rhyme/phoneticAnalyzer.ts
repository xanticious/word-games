/**
 * Phonetic analysis utilities for Rhyme Thyme
 * Parses CMU dictionary phonetic data into usable structures
 *
 * Stress Pattern Notation:
 * - 'O' = primary stress (CMU marker 1)
 * - 'o' = secondary stress (CMU marker 2)
 * - '.' = unstressed (CMU marker 0)
 *
 * Example: "the cat" (DH AH0 + K AE1 T) -> stress pattern ".O"
 */

import type { ParsedPhonetics, WordPhonetics } from './types.js';
import type { PhoneticEntry } from '$lib/dictionary.js';

/**
 * Check if a sound is a vowel (has stress marker 0, 1, or 2)
 */
function isVowel(sound: string): boolean {
	return /[012]$/.test(sound);
}

/**
 * Check if a sound is a consonant (no stress marker)
 */
function isConsonant(sound: string): boolean {
	return !isVowel(sound);
}

/**
 * Strip stress marker from vowel sound
 * E.g., "AH0" -> "AH", "EY1" -> "EY"
 */
function stripStress(sound: string): string {
	return sound.replace(/[012]$/, '');
}

/**
 * Get stress level from vowel sound
 * 0 = unstressed, 1 = primary stress, 2 = secondary stress
 */
function getStress(sound: string): number {
	const match = sound.match(/([012])$/);
	if (!match) return 0;
	return parseInt(match[1], 10);
}

/**
 * Convert stress array to pattern string
 * 0 = '.' (unstressed), 1 = 'O' (primary stress), 2 = 'o' (secondary stress)
 * E.g., [1, 0, 0, 1, 0] -> "O...O."
 */
function stressArrayToPattern(stresses: number[]): string {
	return stresses
		.map((s) => {
			if (s === 1) return 'O'; // Primary stress
			if (s === 2) return 'o'; // Secondary stress
			return '.'; // Unstressed
		})
		.join('');
}

/**
 * Parse a single pronunciation from CMU data
 * Extracts vowels, stress pattern, and consonant counts
 */
export function parsePronunciation(sounds: string[], phonetic: string): ParsedPhonetics {
	const vowels: string[] = [];
	const stresses: number[] = [];
	const consonants: Record<string, number> = {};

	for (const sound of sounds) {
		if (isVowel(sound)) {
			// Extract vowel and stress
			vowels.push(stripStress(sound));
			stresses.push(getStress(sound));
		} else if (isConsonant(sound)) {
			// Count consonants
			consonants[sound] = (consonants[sound] || 0) + 1;
		}
	}

	const stressPattern = stressArrayToPattern(stresses);

	return {
		phonetic,
		vowels,
		stressPattern,
		consonants,
		sounds
	};
}

/**
 * Parse all pronunciations for a word
 * Handles multiple pronunciations from CMU dictionary
 */
export function parseWordPhonetics(word: string, phoneticEntries: PhoneticEntry[]): WordPhonetics {
	const pronunciations: ParsedPhonetics[] = [];

	for (const entry of phoneticEntries) {
		if (entry.word.toLowerCase() === word.toLowerCase()) {
			pronunciations.push(parsePronunciation(entry.sounds, entry.phonetic));
		}
	}

	// If no pronunciations found, return empty array
	return {
		word,
		pronunciations
	};
}

/**
 * Get phonetic data for a phrase (multiple words)
 * Concatenates pronunciations from all words
 */
export function getPhrasePhonetics(
	phrase: string,
	phoneticEntries: PhoneticEntry[]
): ParsedPhonetics | null {
	const words = phrase
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	const allVowels: string[] = [];
	const allStresses: number[] = [];
	const allConsonants: Record<string, number> = {};
	const allSounds: string[] = [];
	let allPhonetic = '';

	for (const word of words) {
		const wordPhonetics = parseWordPhonetics(word, phoneticEntries);

		// If any word has no pronunciation, the whole phrase fails
		if (wordPhonetics.pronunciations.length === 0) {
			return null;
		}

		// Use first pronunciation for each word
		const pronunciation = wordPhonetics.pronunciations[0];

		allVowels.push(...pronunciation.vowels);
		allSounds.push(...pronunciation.sounds);
		allPhonetic += (allPhonetic ? ' ' : '') + pronunciation.phonetic;

		// Extract stresses from sounds
		for (const sound of pronunciation.sounds) {
			if (isVowel(sound)) {
				allStresses.push(getStress(sound));
			}
		}

		// Merge consonant counts
		for (const [consonant, count] of Object.entries(pronunciation.consonants)) {
			allConsonants[consonant] = (allConsonants[consonant] || 0) + count;
		}
	}

	const stressPattern = stressArrayToPattern(allStresses);

	return {
		phonetic: allPhonetic,
		vowels: allVowels,
		stressPattern,
		consonants: allConsonants,
		sounds: allSounds
	};
}

/**
 * Get the ending phonemes starting from the last stressed vowel
 * Returns array of sounds (with stress markers) from last stressed vowel onward
 */
export function getEndingFromLastStress(sounds: string[]): string[] {
	// Find the last stressed vowel (stress marker 1 or 2)
	let lastStressIndex = -1;

	for (let i = sounds.length - 1; i >= 0; i--) {
		if (isVowel(sounds[i])) {
			const stress = getStress(sounds[i]);
			if (stress === 1) {
				lastStressIndex = i;
				break;
			}
		}
	}

	// If no stressed vowel found, use the last vowel
	if (lastStressIndex === -1) {
		for (let i = sounds.length - 1; i >= 0; i--) {
			if (isVowel(sounds[i])) {
				lastStressIndex = i;
				break;
			}
		}
	}

	// If still no vowel found, return empty array
	if (lastStressIndex === -1) {
		return [];
	}

	return sounds.slice(lastStressIndex);
}

/**
 * Count syllables in a phrase
 */
export function countSyllables(phonetics: ParsedPhonetics): number {
	return phonetics.vowels.length;
}

/**
 * Find all possible pronunciations for a phrase and return the best one
 * based on a scoring function
 */
export function getBestPronunciation<T>(
	phrase: string,
	phoneticEntries: PhoneticEntry[],
	scoringFn: (pronunciation: ParsedPhonetics) => T,
	compareFn: (a: T, b: T) => number
): { pronunciation: ParsedPhonetics; score: T } | null {
	const words = phrase
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	// Get all pronunciation combinations
	const wordPronunciations: ParsedPhonetics[][] = [];

	for (const word of words) {
		const wordPhonetics = parseWordPhonetics(word, phoneticEntries);
		if (wordPhonetics.pronunciations.length === 0) {
			return null; // Word not in dictionary
		}
		wordPronunciations.push(wordPhonetics.pronunciations);
	}

	// Generate all combinations
	function* combinations(
		arrays: ParsedPhonetics[][],
		index = 0,
		current: ParsedPhonetics[] = []
	): Generator<ParsedPhonetics[]> {
		if (index === arrays.length) {
			yield current;
			return;
		}

		for (const item of arrays[index]) {
			yield* combinations(arrays, index + 1, [...current, item]);
		}
	}

	// Merge pronunciations and score them
	let bestPronunciation: ParsedPhonetics | null = null;
	let bestScore: T | null = null;

	for (const combo of combinations(wordPronunciations)) {
		// Merge this combination
		const merged = mergePronunciations(combo);
		const score = scoringFn(merged);

		if (bestScore === null || compareFn(score, bestScore) > 0) {
			bestScore = score;
			bestPronunciation = merged;
		}
	}

	if (bestPronunciation && bestScore !== null) {
		return { pronunciation: bestPronunciation, score: bestScore };
	}

	return null;
}

/**
 * Merge multiple pronunciations into one
 */
function mergePronunciations(pronunciations: ParsedPhonetics[]): ParsedPhonetics {
	const allVowels: string[] = [];
	const allStresses: number[] = [];
	const allConsonants: Record<string, number> = {};
	const allSounds: string[] = [];
	let allPhonetic = '';

	for (const pronunciation of pronunciations) {
		allVowels.push(...pronunciation.vowels);
		allSounds.push(...pronunciation.sounds);
		allPhonetic += (allPhonetic ? ' ' : '') + pronunciation.phonetic;

		// Extract stresses from sounds
		for (const sound of pronunciation.sounds) {
			if (isVowel(sound)) {
				allStresses.push(getStress(sound));
			}
		}

		// Merge consonant counts
		for (const [consonant, count] of Object.entries(pronunciation.consonants)) {
			allConsonants[consonant] = (allConsonants[consonant] || 0) + count;
		}
	}

	const stressPattern = stressArrayToPattern(allStresses);

	return {
		phonetic: allPhonetic,
		vowels: allVowels,
		stressPattern,
		consonants: allConsonants,
		sounds: allSounds
	};
}

/**
 * Compare consonant counts between two phrases
 * Returns matching consonants with their minimum counts
 */
export function compareConsonants(
	consonants1: Record<string, number>,
	consonants2: Record<string, number>
): Array<{ consonant: string; count: number }> {
	const matches: Array<{ consonant: string; count: number }> = [];

	for (const [consonant, count1] of Object.entries(consonants1)) {
		const count2 = consonants2[consonant] || 0;
		if (count2 > 0) {
			matches.push({ consonant, count: Math.min(count1, count2) });
		}
	}

	return matches;
}

/**
 * Compare vowel sounds between two phrases
 * Returns matching vowels with their minimum counts
 */
export function compareVowels(
	vowels1: string[],
	vowels2: string[]
): Array<{ vowel: string; count: number }> {
	const counts1: Record<string, number> = {};
	const counts2: Record<string, number> = {};

	for (const vowel of vowels1) {
		counts1[vowel] = (counts1[vowel] || 0) + 1;
	}

	for (const vowel of vowels2) {
		counts2[vowel] = (counts2[vowel] || 0) + 1;
	}

	const matches: Array<{ vowel: string; count: number }> = [];

	for (const [vowel, count1] of Object.entries(counts1)) {
		const count2 = counts2[vowel] || 0;
		if (count2 > 0) {
			matches.push({ vowel, count: Math.min(count1, count2) });
		}
	}

	return matches;
}

/**
 * Get consonant counts per word from a phrase
 */
export function getConsonantsPerWord(
	phrase: string,
	phoneticEntries: PhoneticEntry[]
): Record<string, Record<string, number>> {
	const words = phrase
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	const result: Record<string, Record<string, number>> = {};

	for (const word of words) {
		const wordPhonetics = parseWordPhonetics(word, phoneticEntries);
		if (wordPhonetics.pronunciations.length > 0) {
			result[word] = wordPhonetics.pronunciations[0].consonants;
		}
	}

	return result;
}

/**
 * Get vowel counts per word from a phrase
 */
export function getVowelsPerWord(
	phrase: string,
	phoneticEntries: PhoneticEntry[]
): Record<string, string[]> {
	const words = phrase
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	const result: Record<string, string[]> = {};

	for (const word of words) {
		const wordPhonetics = parseWordPhonetics(word, phoneticEntries);
		if (wordPhonetics.pronunciations.length > 0) {
			result[word] = wordPhonetics.pronunciations[0].vowels;
		}
	}

	return result;
}

/**
 * Compare consonants with detailed word-level tracking
 */
export function compareConsonantsDetailed(
	phrase1: string,
	phrase2: string,
	phoneticEntries: PhoneticEntry[]
): Array<{
	consonant: string;
	count: number;
	details: Array<{ word: string; occurrences: number }>;
}> {
	const consonants1 = getConsonantsPerWord(phrase1, phoneticEntries);
	const consonants2 = getConsonantsPerWord(phrase2, phoneticEntries);

	// Aggregate all consonants across both phrases
	const allConsonants = new Set<string>();
	for (const wordConsonants of Object.values(consonants1)) {
		for (const consonant of Object.keys(wordConsonants)) {
			allConsonants.add(consonant);
		}
	}
	for (const wordConsonants of Object.values(consonants2)) {
		for (const consonant of Object.keys(wordConsonants)) {
			allConsonants.add(consonant);
		}
	}

	const matches: Array<{
		consonant: string;
		count: number;
		details: Array<{ word: string; occurrences: number }>;
	}> = [];

	for (const consonant of allConsonants) {
		// Count total occurrences in each phrase
		let count1 = 0;
		let count2 = 0;
		const details: Array<{ word: string; occurrences: number }> = [];

		for (const [word, consonants] of Object.entries(consonants1)) {
			const wordCount = consonants[consonant] || 0;
			if (wordCount > 0) {
				count1 += wordCount;
				details.push({ word, occurrences: wordCount });
			}
		}

		for (const [word, consonants] of Object.entries(consonants2)) {
			const wordCount = consonants[consonant] || 0;
			if (wordCount > 0) {
				count2 += wordCount;
				details.push({ word, occurrences: wordCount });
			}
		}

		// Only include matches (consonant appears in both phrases)
		if (count1 > 0 && count2 > 0) {
			matches.push({
				consonant,
				count: Math.min(count1, count2),
				details
			});
		}
	}

	return matches;
}

/**
 * Compare vowels with detailed word-level tracking
 */
export function compareVowelsDetailed(
	phrase1: string,
	phrase2: string,
	phoneticEntries: PhoneticEntry[]
): Array<{
	vowel: string;
	count: number;
	details: Array<{ word: string; occurrences: number }>;
}> {
	const vowels1 = getVowelsPerWord(phrase1, phoneticEntries);
	const vowels2 = getVowelsPerWord(phrase2, phoneticEntries);

	// Aggregate all vowels across both phrases
	const allVowelCounts1: Record<string, number> = {};
	const allVowelCounts2: Record<string, number> = {};
	const vowelWordMap: Record<string, Array<{ word: string; occurrences: number }>> = {};

	// Count vowels from phrase 1
	for (const [word, vowels] of Object.entries(vowels1)) {
		for (const vowel of vowels) {
			allVowelCounts1[vowel] = (allVowelCounts1[vowel] || 0) + 1;

			if (!vowelWordMap[vowel]) {
				vowelWordMap[vowel] = [];
			}

			const existing = vowelWordMap[vowel].find((item) => item.word === word);
			if (existing) {
				existing.occurrences++;
			} else {
				vowelWordMap[vowel].push({ word, occurrences: 1 });
			}
		}
	}

	// Count vowels from phrase 2
	for (const [word, vowels] of Object.entries(vowels2)) {
		for (const vowel of vowels) {
			allVowelCounts2[vowel] = (allVowelCounts2[vowel] || 0) + 1;

			if (!vowelWordMap[vowel]) {
				vowelWordMap[vowel] = [];
			}

			const existing = vowelWordMap[vowel].find((item) => item.word === word);
			if (existing) {
				existing.occurrences++;
			} else {
				vowelWordMap[vowel].push({ word, occurrences: 1 });
			}
		}
	}

	const matches: Array<{
		vowel: string;
		count: number;
		details: Array<{ word: string; occurrences: number }>;
	}> = [];

	for (const vowel of Object.keys(vowelWordMap)) {
		const count1 = allVowelCounts1[vowel] || 0;
		const count2 = allVowelCounts2[vowel] || 0;

		// Only include matches (vowel appears in both phrases)
		if (count1 > 0 && count2 > 0) {
			matches.push({
				vowel,
				count: Math.min(count1, count2),
				details: vowelWordMap[vowel]
			});
		}
	}

	return matches;
}

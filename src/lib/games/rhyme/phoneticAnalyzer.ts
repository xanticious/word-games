/**
 * Phonetic analysis utilities for Rhyme Thyme
 * Parses CMU dictionary phonetic data into usable structures
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
 * Treat 1 and 2 as equivalent (both stressed)
 */
function getStress(sound: string): number {
	const match = sound.match(/([012])$/);
	if (!match) return 0;
	const stress = parseInt(match[1], 10);
	// Normalize: 1 and 2 both become 1 (stressed), 0 stays 0 (unstressed)
	return stress === 0 ? 0 : 1;
}

/**
 * Convert stress array to pattern string
 * 0 = 'o' (unstressed), 1/2 = 'O' (stressed)
 * E.g., [1, 0, 0, 1, 0] -> "O.o.o.O.o"
 */
function stressArrayToPattern(stresses: number[]): string {
	return stresses.map((s) => (s === 0 ? 'o' : 'O')).join('.');
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

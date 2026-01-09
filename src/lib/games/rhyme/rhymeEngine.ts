/**
 * Rhyme detection engine for Rhyme Thyme
 * Uses Levenshtein distance on phonemes from last stressed vowel
 */

import type { RhymeAnalysis, ParsedPhonetics, InternalRhymeGroup } from './types.js';
import type { PhoneticEntry } from '$lib/dictionary.js';
import {
	getEndingFromLastStress,
	getPhrasePhonetics,
	parseWordPhonetics,
	getBestPronunciation
} from './phoneticAnalyzer.js';
import { SCORING } from './config.js';

/**
 * Calculate Levenshtein distance between two arrays
 * Treats stress markers 1 and 2 as equivalent (both are "stressed")
 */
function levenshteinDistance(arr1: string[], arr2: string[]): number {
	const len1 = arr1.length;
	const len2 = arr2.length;

	// Create 2D array for dynamic programming
	const dp: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

	// Initialize first row and column
	for (let i = 0; i <= len1; i++) {
		dp[i][0] = i;
	}
	for (let j = 0; j <= len2; j++) {
		dp[0][j] = j;
	}

	// Fill the DP table
	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const sound1 = arr1[i - 1];
			const sound2 = arr2[j - 1];

			// Normalize stress: treat 1 and 2 as equivalent
			const normalized1 = sound1.replace(/2$/, '1');
			const normalized2 = sound2.replace(/2$/, '1');

			const cost = normalized1 === normalized2 ? 0 : 1;

			dp[i][j] = Math.min(
				dp[i - 1][j] + 1, // deletion
				dp[i][j - 1] + 1, // insertion
				dp[i - 1][j - 1] + cost // substitution
			);
		}
	}

	return dp[len1][len2];
}

/**
 * Calculate Levenshtein distance between two stress patterns
 * Each character in the pattern represents one syllable
 */
function stressPatternDistance(pattern1: string, pattern2: string): number {
	const len1 = pattern1.length;
	const len2 = pattern2.length;

	const dp: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

	for (let i = 0; i <= len1; i++) {
		dp[i][0] = i;
	}
	for (let j = 0; j <= len2; j++) {
		dp[0][j] = j;
	}

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = pattern1[i - 1] === pattern2[j - 1] ? 0 : 1;

			dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
		}
	}

	return dp[len1][len2];
}

/**
 * Analyze rhyme between two phrases
 * Returns distance and points based on phoneme similarity from last stressed vowel
 */
export function analyzeRhyme(
	phrase1: string,
	phrase2: string,
	phoneticEntries: PhoneticEntry[]
): RhymeAnalysis {
	// Get phonetics for both phrases
	const phonetics1 = getPhrasePhonetics(phrase1, phoneticEntries);
	const phonetics2 = getPhrasePhonetics(phrase2, phoneticEntries);

	if (!phonetics1 || !phonetics2) {
		return {
			distance: 999,
			points: 0,
			description: 'Unable to analyze (word not in dictionary)',
			isRhyme: false
		};
	}

	// Get endings from last stressed vowel
	const ending1 = getEndingFromLastStress(phonetics1.sounds);
	const ending2 = getEndingFromLastStress(phonetics2.sounds);

	if (ending1.length === 0 || ending2.length === 0) {
		return {
			distance: 999,
			points: 0,
			description: 'Unable to find stressed vowel',
			isRhyme: false
		};
	}

	// Check if phrases are identical (no points for same word)
	if (phrase1.toLowerCase().trim() === phrase2.toLowerCase().trim()) {
		return {
			distance: 0,
			points: 0,
			description: 'Identical phrases (no points)',
			isRhyme: false
		};
	}

	// Calculate distance
	const distance = levenshteinDistance(ending1, ending2);

	// Calculate points: max points minus (distance * pointsPerDistance)
	const { maxPoints, pointsPerDistance, maxDistance } = SCORING.endRhyme;
	const points = Math.max(0, maxPoints - distance * pointsPerDistance);

	// Determine if this qualifies as a rhyme
	const isRhyme = distance <= maxDistance;

	// Generate description
	let description: string;
	if (distance === 0) {
		description = 'Perfect match';
	} else if (distance === 1) {
		description = 'Very close rhyme';
	} else if (distance === 2) {
		description = 'Good rhyme';
	} else if (distance === 3) {
		description = 'Acceptable rhyme';
	} else if (distance === 4) {
		description = 'Weak rhyme';
	} else {
		description = 'Not a rhyme';
	}

	return {
		distance,
		points,
		description,
		isRhyme
	};
}

/**
 * Analyze rhyme with best pronunciation selection
 * Tries all pronunciation combinations and returns the one with the highest score
 */
export function analyzeRhymeWithBestPronunciation(
	phrase1: string,
	phrase2: string,
	phoneticEntries: PhoneticEntry[]
): RhymeAnalysis {
	// Get all words in both phrases
	const words1 = phrase1
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);
	const words2 = phrase2
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	// Get pronunciation options for each word
	const pronunciations1 = words1.map((w) => parseWordPhonetics(w, phoneticEntries));
	const pronunciations2 = words2.map((w) => parseWordPhonetics(w, phoneticEntries));

	// Check if all words have pronunciations
	if (
		pronunciations1.some((p) => p.pronunciations.length === 0) ||
		pronunciations2.some((p) => p.pronunciations.length === 0)
	) {
		return {
			distance: 999,
			points: 0,
			description: 'Word not in dictionary',
			isRhyme: false
		};
	}

	// Try all combinations and find the best rhyme score
	let bestAnalysis: RhymeAnalysis = {
		distance: 999,
		points: 0,
		description: 'Unable to analyze',
		isRhyme: false
	};

	// For efficiency, if there are many combinations, just try the first pronunciation
	const maxCombinations = 100;
	const totalCombinations =
		pronunciations1.reduce((acc, p) => acc * p.pronunciations.length, 1) *
		pronunciations2.reduce((acc, p) => acc * p.pronunciations.length, 1);

	if (totalCombinations > maxCombinations) {
		// Just use first pronunciations
		return analyzeRhyme(phrase1, phrase2, phoneticEntries);
	}

	// Generate all combination pairs
	function* generateCombinations1(
		pronunciations: Array<{ word: string; pronunciations: ParsedPhonetics[] }>,
		index = 0,
		current: ParsedPhonetics[] = []
	): Generator<ParsedPhonetics[]> {
		if (index === pronunciations.length) {
			yield current;
			return;
		}

		for (const pron of pronunciations[index].pronunciations) {
			yield* generateCombinations1(pronunciations, index + 1, [...current, pron]);
		}
	}

	function mergePronunciations(prons: ParsedPhonetics[]): ParsedPhonetics {
		const allVowels: string[] = [];
		const allSounds: string[] = [];
		let allPhonetic = '';
		const allConsonants: Record<string, number> = {};

		for (const p of prons) {
			allVowels.push(...p.vowels);
			allSounds.push(...p.sounds);
			allPhonetic += (allPhonetic ? ' ' : '') + p.phonetic;
			for (const [c, count] of Object.entries(p.consonants)) {
				allConsonants[c] = (allConsonants[c] || 0) + count;
			}
		}

		return {
			phonetic: allPhonetic,
			vowels: allVowels,
			stressPattern: '', // Will be computed if needed
			consonants: allConsonants,
			sounds: allSounds
		};
	}

	for (const combo1 of generateCombinations1(pronunciations1)) {
		for (const combo2 of generateCombinations1(pronunciations2)) {
			const merged1 = mergePronunciations(combo1);
			const merged2 = mergePronunciations(combo2);

			const ending1 = getEndingFromLastStress(merged1.sounds);
			const ending2 = getEndingFromLastStress(merged2.sounds);

			if (ending1.length === 0 || ending2.length === 0) continue;

			// Check if identical
			if (phrase1.toLowerCase().trim() === phrase2.toLowerCase().trim()) {
				continue;
			}

			const distance = levenshteinDistance(ending1, ending2);
			const { maxPoints, pointsPerDistance, maxDistance } = SCORING.endRhyme;
			const points = Math.max(0, maxPoints - distance * pointsPerDistance);
			const isRhyme = distance <= maxDistance;

			let description: string;
			if (distance === 0) description = 'Perfect match';
			else if (distance === 1) description = 'Very close rhyme';
			else if (distance === 2) description = 'Good rhyme';
			else if (distance === 3) description = 'Acceptable rhyme';
			else if (distance === 4) description = 'Weak rhyme';
			else description = 'Not a rhyme';

			const analysis: RhymeAnalysis = { distance, points, description, isRhyme };

			if (points > bestAnalysis.points) {
				bestAnalysis = analysis;
			}
		}
	}

	return bestAnalysis;
}

/**
 * Detect internal rhymes within a couplet (both lines combined)
 * Returns groups of rhyming words
 */
export function detectInternalRhymes(
	line1: string,
	line2: string,
	phoneticEntries: PhoneticEntry[]
): InternalRhymeGroup[] {
	// Extract all words from both lines
	const allWords = [
		...line1
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 0),
		...line2
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 0)
	];

	// Remove duplicates but keep count
	const uniqueWords = Array.from(new Set(allWords));

	// Find rhyme groups
	const rhymeGroups: Map<string, string[]> = new Map();

	for (let i = 0; i < uniqueWords.length; i++) {
		for (let j = i + 1; j < uniqueWords.length; j++) {
			const word1 = uniqueWords[i];
			const word2 = uniqueWords[j];

			// Analyze rhyme between these words
			const analysis = analyzeRhymeWithBestPronunciation(word1, word2, phoneticEntries);

			// Calculate acceptable distance threshold based on shorter word's phoneme count
			// Get phonetics to determine ending length
			const phonetics1 = getPhrasePhonetics(word1, phoneticEntries);
			const phonetics2 = getPhrasePhonetics(word2, phoneticEntries);

			if (phonetics1 && phonetics2) {
				const ending1 = getEndingFromLastStress(phonetics1.sounds);
				const ending2 = getEndingFromLastStress(phonetics2.sounds);
				const shorterLength = Math.min(ending1.length, ending2.length);

				// Threshold based on phoneme count:
				// 1 phoneme: distance must be 0 (exact match)
				// 2-3 phonemes: distance can be 1
				// 4+ phonemes: distance can be 2
				let maxDistance: number;
				if (shorterLength === 1) {
					maxDistance = 0;
				} else if (shorterLength <= 3) {
					maxDistance = 1;
				} else {
					maxDistance = 2;
				}

				// Only count as internal rhyme if distance meets the threshold
				if (analysis.isRhyme && analysis.distance <= maxDistance) {
					// Find or create a group for these words
					let groupKey: string | null = null;

					// Check if either word is already in a group
					for (const [key, words] of rhymeGroups.entries()) {
						if (words.includes(word1) || words.includes(word2)) {
							groupKey = key;
							break;
						}
					}

					if (groupKey) {
						// Add to existing group
						const group = rhymeGroups.get(groupKey)!;
						if (!group.includes(word1)) group.push(word1);
						if (!group.includes(word2)) group.push(word2);
					} else {
						// Create new group
						rhymeGroups.set(`${word1}-${word2}`, [word1, word2]);
					}
				}
			}
		}
	}

	// Convert to InternalRhymeGroup array
	const groups: InternalRhymeGroup[] = [];

	for (const words of rhymeGroups.values()) {
		if (words.length >= 3) {
			groups.push({ words, type: 'triple+' });
		} else if (words.length === 2) {
			groups.push({ words, type: 'pair' });
		}
	}

	return groups;
}

/**
 * Calculate stress pattern match score
 * Uses Levenshtein distance on stress patterns, scaled to min-max range
 */
export function calculateStressPatternScore(
	pattern1: string,
	pattern2: string
): { points: number; distance: number; description: string } {
	const distance = stressPatternDistance(pattern1, pattern2);

	// Calculate max possible distance (each character is one syllable)
	const len1 = pattern1.length;
	const len2 = pattern2.length;
	const maxDistance = Math.max(len1, len2);

	// Normalize to 0-1 similarity
	const similarity = maxDistance === 0 ? 1 : 1 - distance / maxDistance;

	// Scale to min-max points
	const { min, max } = SCORING.stressPattern;
	const points = Math.round(min + similarity * (max - min));

	// Generate description
	let description: string;
	if (similarity >= 0.9) description = 'Excellent match';
	else if (similarity >= 0.7) description = 'Good match';
	else if (similarity >= 0.5) description = 'Fair match';
	else if (similarity >= 0.3) description = 'Weak match';
	else description = 'Poor match';

	return { points, distance, description };
}

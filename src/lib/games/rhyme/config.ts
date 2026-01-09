/**
 * Configuration constants for Rhyme Thyme game
 */

import type { ScoringConfig, TimingConfig, WikipediaConfig, InputConfig } from './types.js';

/**
 * Scoring configuration
 */
export const SCORING: ScoringConfig = {
	endRhyme: {
		maxPoints: 20,
		pointsPerDistance: 5,
		maxDistance: 4 // More than 4 distance = 0 points
	},
	internalRhymes: {
		tripleOrMore: 10,
		pair: 5
	},
	syllables: {
		exact: 10,
		oneOff: 8,
		twoOff: 6,
		threeOff: 4,
		fourOff: 2,
		fiveOrMore: 0
	},
	stressPattern: {
		max: 20,
		min: 5
	},
	alliteration: {
		perMatch: 1
	},
	consonance: {
		perMatch: 1
	},
	wordBank: {
		perUse: 5,
		varietyBonus: [10, 25, 50, 100] // Points for using 1, 2, 3, 4, 5 different words
	}
};

/**
 * Time configuration
 */
export const TIMING: TimingConfig = {
	roundDuration: 240, // 4 minutes in seconds
	maxCompletions: 10,
	multipliers: [
		{ threshold: 120, multiplier: 5 }, // ≤ 2 minutes
		{ threshold: 150, multiplier: 4 }, // ≤ 2.5 minutes
		{ threshold: 180, multiplier: 3 }, // ≤ 3 minutes
		{ threshold: 210, multiplier: 2 }, // ≤ 3.5 minutes
		{ threshold: 240, multiplier: 1 } // ≤ 4 minutes
	]
};

/**
 * Wikipedia configuration
 */
export const WIKIPEDIA: WikipediaConfig = {
	articlesToFetch: 10,
	promptMinWords: 4,
	promptMaxWords: 6,
	promptMinSyllables: 8,
	promptMaxSyllables: 12,
	bonusWordCount: 4,
	bonusWordMinLength: 4,
	bonusWordMaxLength: 10,
	fillerWords: [
		'for',
		'the',
		'a',
		'an',
		'of',
		'with',
		'to',
		'in',
		'on',
		'at',
		'by',
		'from',
		'is',
		'was',
		'are',
		'were',
		'been',
		'be',
		'have',
		'has',
		'had',
		'do',
		'does',
		'did',
		'will',
		'would',
		'could',
		'should',
		'may',
		'might',
		'must',
		'can'
	]
};

/**
 * Input validation configuration
 */
export const INPUT: InputConfig = {
	characterLimitMultiplier: 2
};

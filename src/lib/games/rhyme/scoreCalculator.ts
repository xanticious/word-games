/**
 * Score calculator for Rhyme Thyme
 * Combines all scoring categories to generate complete score breakdown
 */

import type { CompletionScore, GamePrompt, Completion, RoundResults } from './types.js';
import type { PhoneticEntry } from '$lib/dictionary.js';
import {
	getPhrasePhonetics,
	countSyllables,
	compareConsonants,
	compareVowels,
	compareConsonantsDetailed,
	compareVowelsDetailed
} from './phoneticAnalyzer.js';
import {
	analyzeRhymeWithBestPronunciation,
	detectInternalRhymes,
	calculateStressPatternScore
} from './rhymeEngine.js';
import { SCORING, TIMING } from './config.js';

/**
 * Calculate complete score for a single completion
 */
export function calculateCompletionScore(
	promptLine: string,
	completionLine: string,
	bonusWords: string[],
	phoneticEntries: PhoneticEntry[]
): CompletionScore {
	// Get phonetics for both lines
	const promptPhonetics = getPhrasePhonetics(promptLine, phoneticEntries);
	const completionPhonetics = getPhrasePhonetics(completionLine, phoneticEntries);

	// Initialize score object
	const score: CompletionScore = {
		endRhyme: { points: 0, description: '', distance: 0 },
		internalRhymes: { points: 0, rhymes: [] },
		syllables: { points: 0, promptCount: 0, completionCount: 0, difference: 0 },
		stressPattern: {
			points: 0,
			description: '',
			promptPattern: '',
			completionPattern: '',
			distance: 0
		},
		alliteration: { points: 0, matches: [] },
		consonance: { points: 0, matches: [] },
		wordBankBonus: { points: 0, usedWords: [] },
		total: 0
	};

	// 1. End Rhyme Analysis
	const rhymeAnalysis = analyzeRhymeWithBestPronunciation(
		promptLine,
		completionLine,
		phoneticEntries
	);
	score.endRhyme = {
		points: rhymeAnalysis.points,
		description: rhymeAnalysis.description,
		distance: rhymeAnalysis.distance
	};

	// 2. Internal Rhymes
	const internalRhymeGroups = detectInternalRhymes(promptLine, completionLine, phoneticEntries);
	for (const group of internalRhymeGroups) {
		if (group.type === 'triple+') {
			score.internalRhymes.points += SCORING.internalRhymes.tripleOrMore;
			score.internalRhymes.rhymes.push(group);
		} else if (group.type === 'pair') {
			score.internalRhymes.points += SCORING.internalRhymes.pair;
			score.internalRhymes.rhymes.push(group);
		}
	}

	// 3. Syllable Count Match
	if (promptPhonetics && completionPhonetics) {
		const promptSyllables = countSyllables(promptPhonetics);
		const completionSyllables = countSyllables(completionPhonetics);
		const difference = Math.abs(promptSyllables - completionSyllables);

		score.syllables.promptCount = promptSyllables;
		score.syllables.completionCount = completionSyllables;
		score.syllables.difference = difference;

		if (difference === 0) {
			score.syllables.points = SCORING.syllables.exact;
		} else if (difference === 1) {
			score.syllables.points = SCORING.syllables.oneOff;
		} else if (difference === 2) {
			score.syllables.points = SCORING.syllables.twoOff;
		} else if (difference === 3) {
			score.syllables.points = SCORING.syllables.threeOff;
		} else if (difference === 4) {
			score.syllables.points = SCORING.syllables.fourOff;
		} else {
			score.syllables.points = SCORING.syllables.fiveOrMore;
		}
	}

	// 4. Stress Pattern Match
	if (promptPhonetics && completionPhonetics) {
		const stressResult = calculateStressPatternScore(
			promptPhonetics.stressPattern,
			completionPhonetics.stressPattern
		);

		score.stressPattern = {
			points: stressResult.points,
			description: stressResult.description,
			promptPattern: promptPhonetics.stressPattern,
			completionPattern: completionPhonetics.stressPattern,
			distance: stressResult.distance
		};
	}

	// 5. Alliteration (consonant matches)
	if (promptPhonetics && completionPhonetics) {
		const consonantMatches = compareConsonantsDetailed(promptLine, completionLine, phoneticEntries);

		score.alliteration.matches = consonantMatches;
		score.alliteration.points = consonantMatches.reduce((sum, match) => {
			return sum + match.count * SCORING.alliteration.perMatch;
		}, 0);
	}

	// 6. Consonance (vowel matches)
	if (promptPhonetics && completionPhonetics) {
		const vowelMatches = compareVowelsDetailed(promptLine, completionLine, phoneticEntries);

		score.consonance.matches = vowelMatches;
		score.consonance.points = vowelMatches.reduce((sum, match) => {
			return sum + match.count * SCORING.consonance.perMatch;
		}, 0);
	}

	// 7. Word Bank Bonus
	const completionWords = completionLine
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);

	const usedBonusWords: string[] = [];
	for (const bonusWord of bonusWords) {
		if (completionWords.some((w) => w === bonusWord.toLowerCase())) {
			usedBonusWords.push(bonusWord);
		}
	}

	if (usedBonusWords.length > 0) {
		score.wordBankBonus.usedWords = usedBonusWords;
		score.wordBankBonus.points = usedBonusWords.length * SCORING.wordBank.perUse;
	}

	// Calculate total
	score.total =
		score.endRhyme.points +
		score.internalRhymes.points +
		score.syllables.points +
		score.stressPattern.points +
		score.alliteration.points +
		score.consonance.points +
		score.wordBankBonus.points;

	return score;
}

/**
 * Calculate final round results with multipliers and bonuses
 */
export function calculateRoundResults(
	prompt: GamePrompt,
	completions: Completion[],
	elapsedTime: number
): RoundResults {
	// Calculate sum of all completion scores
	const sumOfScores = completions.reduce((sum, completion) => sum + completion.score.total, 0);

	// Determine time multiplier
	let timeMultiplier = 1;
	for (const tier of TIMING.multipliers) {
		if (elapsedTime <= tier.threshold) {
			timeMultiplier = tier.multiplier;
			break;
		}
	}

	// Calculate word bank variety bonus
	const allUsedBonusWords = new Set<string>();
	for (const completion of completions) {
		for (const word of completion.score.wordBankBonus.usedWords) {
			allUsedBonusWords.add(word.toLowerCase());
		}
	}

	const uniqueWordsUsed = allUsedBonusWords.size;
	let wordBankVarietyBonus = 0;

	if (uniqueWordsUsed > 0 && uniqueWordsUsed <= 5) {
		wordBankVarietyBonus = SCORING.wordBank.varietyBonus[uniqueWordsUsed - 1];
	}

	// Calculate total score
	const totalScore = sumOfScores * timeMultiplier + wordBankVarietyBonus;

	return {
		completions,
		elapsedTime,
		timeMultiplier,
		sumOfScores,
		wordBankVarietyBonus: {
			points: wordBankVarietyBonus,
			uniqueWordsUsed,
			totalWords: prompt.bonusWords.length
		},
		totalScore,
		prompt
	};
}

/**
 * Check if a line would rhyme with the prompt (for real-time feedback)
 * Returns true if rhyme distance <= maxDistance
 */
export function checkRhyme(
	promptLine: string,
	inputLine: string,
	phoneticEntries: PhoneticEntry[]
): boolean {
	if (!inputLine.trim()) return false;

	const analysis = analyzeRhymeWithBestPronunciation(promptLine, inputLine, phoneticEntries);
	return analysis.isRhyme;
}

/**
 * Get the top N completions by score
 */
export function getTopCompletions(completions: Completion[], n: number): Completion[] {
	return [...completions].sort((a, b) => b.score.total - a.score.total).slice(0, n);
}

/**
 * Format time in MM:SS
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format score with thousand separators
 */
export function formatScore(score: number): string {
	return score.toLocaleString();
}

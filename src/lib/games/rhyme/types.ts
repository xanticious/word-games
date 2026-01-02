/**
 * Type definitions for Rhyme Thyme game
 */

// ============================================================================
// Phonetic Data Structures
// ============================================================================

/**
 * Parsed phonetic data for a single pronunciation
 */
export interface ParsedPhonetics {
	/** Original phonetic string from CMU dict */
	phonetic: string;
	/** Vowel sounds for each syllable (without stress markers) */
	vowels: string[];
	/** Stress pattern as string (e.g., "O.o.O" for unstressed, unstressed, stressed) */
	stressPattern: string;
	/** Consonant counts for alliteration detection */
	consonants: Record<string, number>;
	/** All sounds including stress markers */
	sounds: string[];
}

/**
 * Word with all possible pronunciations parsed
 */
export interface WordPhonetics {
	word: string;
	/** Multiple pronunciations (if available) */
	pronunciations: ParsedPhonetics[];
}

// ============================================================================
// Game Configuration
// ============================================================================

/**
 * Scoring configuration constants
 */
export interface ScoringConfig {
	endRhyme: {
		/** Maximum points for perfect rhyme */
		maxPoints: number;
		/** Points deducted per Levenshtein distance unit */
		pointsPerDistance: number;
		/** Minimum distance threshold for 0 points */
		maxDistance: number;
	};
	internalRhymes: {
		/** Points for 3 or more internal rhymes */
		tripleOrMore: number;
		/** Points for a pair of internal rhymes */
		pair: number;
	};
	syllables: {
		/** Points per syllable count difference from prompt */
		exact: number;
		oneOff: number;
		twoOff: number;
		threeOff: number;
		fourOff: number;
		fiveOrMore: number;
	};
	stressPattern: {
		/** Maximum points for perfect stress match */
		max: number;
		/** Minimum points for poor stress match */
		min: number;
	};
	alliteration: {
		/** Points per consonant match */
		perMatch: number;
	};
	consonance: {
		/** Points per vowel match */
		perMatch: number;
	};
	wordBank: {
		/** Points per completion using a bonus word */
		perUse: number;
		/** Bonus points based on variety (1-5 words used) */
		varietyBonus: [number, number, number, number, number]; // [1 word, 2 words, 3 words, 4 words, 5 words]
	};
}

/**
 * Time configuration
 */
export interface TimingConfig {
	/** Round duration in seconds */
	roundDuration: number;
	/** Maximum number of completions */
	maxCompletions: number;
	/** Time thresholds and their multipliers */
	multipliers: Array<{ threshold: number; multiplier: number }>;
}

/**
 * Wikipedia configuration
 */
export interface WikipediaConfig {
	/** Number of articles to try fetching */
	articlesToFetch: number;
	/** Minimum words in prompt */
	promptMinWords: number;
	/** Maximum words in prompt */
	promptMaxWords: number;
	/** Number of bonus words */
	bonusWordCount: number;
	/** Minimum length for bonus words */
	bonusWordMinLength: number;
	/** Maximum length for bonus words */
	bonusWordMaxLength: number;
	/** Filler words to avoid at end of prompt */
	fillerWords: string[];
}

/**
 * Input validation configuration
 */
export interface InputConfig {
	/** Character limit multiplier (prompt length * multiplier) */
	characterLimitMultiplier: number;
}

// ============================================================================
// Game State
// ============================================================================

/**
 * Wikipedia prompt with bonus words
 */
export interface GamePrompt {
	/** The prompt text (3-6 words from Wikipedia article) */
	prompt: string;
	/** Source article title */
	sourceTitle: string;
	/** Source article URL */
	sourceUrl: string;
	/** 5 bonus words from the same article */
	bonusWords: string[];
}

/**
 * Player completion (one submitted line)
 */
export interface Completion {
	/** The line submitted by the player */
	line: string;
	/** Timestamp when submitted (ms from round start) */
	timestamp: number;
	/** Score for this completion */
	score: CompletionScore;
}

/**
 * Detailed scoring breakdown for a single completion
 */
export interface CompletionScore {
	/** End rhyme score and details */
	endRhyme: {
		points: number;
		description: string;
		distance: number;
	};
	/** Internal rhymes found */
	internalRhymes: {
		points: number;
		rhymes: Array<{ words: string[]; type: 'triple+' | 'pair' }>;
	};
	/** Syllable count match */
	syllables: {
		points: number;
		promptCount: number;
		completionCount: number;
		difference: number;
	};
	/** Stress pattern match */
	stressPattern: {
		points: number;
		description: string;
		promptPattern: string;
		completionPattern: string;
		distance: number;
	};
	/** Alliteration (consonant matches) */
	alliteration: {
		points: number;
		matches: Array<{ consonant: string; count: number }>;
	};
	/** Consonance (vowel matches) */
	consonance: {
		points: number;
		matches: Array<{ vowel: string; count: number }>;
	};
	/** Word bank bonus */
	wordBankBonus: {
		points: number;
		usedWords: string[];
	};
	/** Total points for this completion */
	total: number;
}

/**
 * Round results after time expires or 10 completions
 */
export interface RoundResults {
	/** All completions made during the round */
	completions: Completion[];
	/** Total elapsed time in seconds */
	elapsedTime: number;
	/** Time multiplier applied */
	timeMultiplier: number;
	/** Sum of all completion scores */
	sumOfScores: number;
	/** Word bank variety bonus */
	wordBankVarietyBonus: {
		points: number;
		uniqueWordsUsed: number;
		totalWords: number;
	};
	/** Final total score */
	totalScore: number;
	/** The prompt used for this round */
	prompt: GamePrompt;
}

/**
 * Game phase
 */
export type GamePhase = 'loading' | 'gameplay' | 'results' | 'error';

/**
 * Complete game state
 */
export interface GameState {
	/** Current game phase */
	phase: GamePhase;
	/** Current prompt and bonus words */
	prompt: GamePrompt | null;
	/** Player completions */
	completions: Completion[];
	/** Current input being typed */
	currentInput: string;
	/** Round start timestamp */
	startTime: number | null;
	/** Elapsed time in seconds */
	elapsedTime: number;
	/** Timer interval ID */
	timerInterval: number | null;
	/** Error message (if in error phase) */
	errorMessage: string | null;
	/** Round results (when phase is 'results') */
	results: RoundResults | null;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Input validation result
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
	invalidWord?: string;
}

// ============================================================================
// Rhyme Detection
// ============================================================================

/**
 * Rhyme analysis result between two words/phrases
 */
export interface RhymeAnalysis {
	/** Levenshtein distance between phonemes from last stressed vowel */
	distance: number;
	/** Points awarded (max 20, -5 per distance) */
	points: number;
	/** Human-readable description */
	description: string;
	/** Whether this qualifies as a rhyme (distance <= maxDistance) */
	isRhyme: boolean;
}

/**
 * Internal rhyme detection result
 */
export interface InternalRhymeGroup {
	/** Words that rhyme internally */
	words: string[];
	/** Type of rhyme group */
	type: 'triple+' | 'pair';
}

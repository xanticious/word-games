/**
 * Text processing utilities for extracting and filtering words
 */

// Common filler words to filter out
const COMMON_WORDS = new Set([
	'the',
	'be',
	'to',
	'of',
	'and',
	'a',
	'in',
	'that',
	'have',
	'i',
	'it',
	'for',
	'not',
	'on',
	'with',
	'he',
	'as',
	'you',
	'do',
	'at',
	'this',
	'but',
	'his',
	'by',
	'from',
	'they',
	'we',
	'say',
	'her',
	'she',
	'or',
	'an',
	'will',
	'my',
	'one',
	'all',
	'would',
	'there',
	'their',
	'what',
	'so',
	'up',
	'out',
	'if',
	'about',
	'who',
	'get',
	'which',
	'go',
	'me',
	'when',
	'make',
	'can',
	'like',
	'time',
	'no',
	'just',
	'him',
	'know',
	'take',
	'people',
	'into',
	'year',
	'your',
	'good',
	'some',
	'could',
	'them',
	'see',
	'other',
	'than',
	'then',
	'now',
	'look',
	'only',
	'come',
	'its',
	'over',
	'think',
	'also',
	'back',
	'after',
	'use',
	'two',
	'how',
	'our',
	'work',
	'first',
	'well',
	'way',
	'even',
	'new',
	'want',
	'because',
	'any',
	'these',
	'give',
	'day',
	'most',
	'us',
	'is',
	'was',
	'are',
	'been',
	'has',
	'had',
	'were',
	'said',
	'did',
	'having',
	'may',
	'should',
	'each',
	'such',
	'through',
	'between',
	'during',
	'before',
	'after',
	'above',
	'below',
	'since',
	'until',
	'while',
	'where',
	'why',
	'both',
	'few',
	'more',
	'most',
	'other',
	'some',
	'such',
	'own',
	'same',
	'than',
	'too',
	'very',
	'can',
	'will',
	'just',
	'should',
	'now'
]);

const MIN_WORD_LENGTH = 4;

/**
 * Extracts and filters words from text content
 * @param text - The text to extract words from
 * @param minLength - Minimum word length (default: 4)
 * @returns Array of filtered, deduplicated words in uppercase
 */
export function extractWords(text: string, minLength: number = MIN_WORD_LENGTH): string[] {
	// Extract words (letters only, case insensitive)
	const wordMatches = text.match(/[a-zA-Z]+/g) || [];

	// Filter and deduplicate
	const wordSet = new Set<string>();
	for (const word of wordMatches) {
		const normalized = word.toLowerCase();
		// Filter out short words and common filler words
		if (normalized.length >= minLength && !COMMON_WORDS.has(normalized)) {
			wordSet.add(normalized.toUpperCase());
		}
	}

	return Array.from(wordSet);
}

/**
 * Checks if a word is a common filler word
 */
export function isCommonWord(word: string): boolean {
	return COMMON_WORDS.has(word.toLowerCase());
}

/**
 * Gets the minimum word length for filtering
 */
export function getMinWordLength(): number {
	return MIN_WORD_LENGTH;
}

/**
 * Dictionary word entry
 */
export interface WordEntry {
	word: string;
	definition?: string;
	phonetic?: string;
	difficulty: 'easy' | 'medium' | 'hard';
	length: number;
	frequency: number;
}

/**
 * Rhyme entry for rhyme detection
 */
export interface RhymeEntry {
	word: string;
	rhymeKey: string; // phonetic ending for matching
	syllables: number;
}

/**
 * Dictionary query options
 */
export interface DictionaryQuery {
	difficulty?: 'easy' | 'medium' | 'hard';
	minLength?: number;
	maxLength?: number;
	count?: number;
	excludeWords?: string[];
}

/**
 * Anagram query for Bag of Letters game
 */
export interface AnagramQuery {
	letters: string;
	minWordLength?: number;
	maxWords?: number;
}

/**
 * Word search query
 */
export interface WordSearchQuery {
	difficulty: 'easy' | 'medium' | 'hard';
	wordCount: number;
	maxWordLength?: number;
	theme?: string;
}

/**
 * Rhyme query for Rhyme Thyme game
 */
export interface RhymeQuery {
	targetWord: string;
	minRhymes?: number;
	difficulty?: 'easy' | 'medium' | 'hard';
}

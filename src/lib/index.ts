/**
 * Word Games Dictionary System
 *
 * This module provides comprehensive dictionary functionality for word games including:
 * - Word validation and categorization by difficulty
 * - Phonetic analysis and rhyme detection
 * - Anagram generation and letter-based word finding
 * - Word search puzzle generation
 *
 * The dictionary system is built from multiple sources:
 * - 370,000+ words from SCOWL (Spell Checker Oriented Word Lists)
 * - 134,000+ phonetic entries from CMU Pronouncing Dictionary
 * - 1,200+ rhyme groups for rhyme-based games
 */

// Export main dictionary class and types
export {
	GameDictionary,
	gameDictionary,
	type WordEntry,
	type PhoneticEntry,
	type DefinitionEntry,
	type DifficultyWordLists,
	type WordsByLength,
	type RhymeGroups
} from './dictionary.js';

// Export server-side utilities for development
export { loadDictionaryData, isValidWord, getSampleWords } from './dictionary-server.js';

/**
 * Dictionary Statistics (based on processed data):
 *
 * Word Count by Difficulty:
 * - Easy (1-4 letters): 2,583 words
 * - Medium (5-7 letters): 52,981 words
 * - Hard (8+ letters): 314,541 words
 *
 * Phonetic Data:
 * - 134,306 pronunciation entries
 * - 1,239 rhyme groups with 3+ words each
 *
 * Data Files Generated:
 * - words-by-difficulty.json (31.6 MB)
 * - words-by-length.json (missing file size)
 * - phonetics.json (21.8 MB)
 * - rhyme-groups.json (1.9 MB)
 */

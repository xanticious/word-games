/**
 * Word Games Collection - Main Library Export
 *
 * This module provides the complete foundation for the word games collection including:
 * - Dictionary system with 370K+ words and rhyme detection
 * - Type definitions for games, settings, and UI components
 * - Shared Svelte components with accessibility features
 * - Global state management with localStorage persistence
 * - Utility functions for common game operations
 */

// Export dictionary system
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

// Export all type definitions
export * from './types/index.js';

// Export shared components
export * from './components/index.js';

// Export global stores
export * from './stores/index.js';

// Export utility functions
export * from './utils/index.js';

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
 * Definition Data:
 * - 108,134 definitions from Webster's English Dictionary
 * - Multiple definitions per word supported
 * - Part of speech and pronunciation information included
 *
 * Data Files Generated:
 * - words-by-difficulty.json (31.6 MB)
 * - words-by-length.json
 * - phonetics.json (21.8 MB)
 * - rhyme-groups.json (1.9 MB)
 * - definitions.json (comprehensive definitions)
 */

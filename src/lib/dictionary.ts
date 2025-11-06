/**
 * Dictionary utilities for word games
 *
 * This module provides functions for accessing processed dictionary data
 * including word validation, rhyme detection, and categorization.
 */

import { base } from '$app/paths';
import { COMMON_WORDS_5 } from './data/common-words-5.js';

export interface WordEntry {
	word: string;
	length: number;
	difficulty: 'easy' | 'medium' | 'hard';
	category?: string;
}

export interface PhoneticEntry {
	word: string;
	phonetic: string;
	sounds: string[];
}

export interface DefinitionSource {
	source: 'websters' | 'wiktionary';
	definitions: string[];
	partOfSpeech?: string;
	pronunciation?: string;
}

export interface DefinitionEntry {
	word: string;
	sources: DefinitionSource[]; // Multiple sources (Webster's, Wiktionary, etc.)
	// Legacy support - will be deprecated
	definitions?: string[];
	partOfSpeech?: string;
	pronunciation?: string;
}

export interface WiktionaryDefinition {
	partOfSpeech: string;
	language: string;
	definitions: Array<{
		definition: string;
		examples?: string[];
		parsedExamples?: Array<{ example: string }>;
	}>;
}
export interface DifficultyWordLists {
	easy: WordEntry[];
	medium: WordEntry[];
	hard: WordEntry[];
}

export interface WordsByLength {
	[length: number]: string[];
}

export interface RhymeGroups {
	[rhymeKey: string]: string[];
}

/**
 * Dictionary class for managing word game data
 */
export class GameDictionary {
	private wordsByDifficulty: DifficultyWordLists | null = null;
	private wordsByLength: WordsByLength | null = null;
	private phonetics: PhoneticEntry[] | null = null;
	private rhymeGroups: RhymeGroups | null = null;
	private definitions: DefinitionEntry[] | null = null;
	private validWords: Set<string> | null = null; /**
	 * Load dictionary data (call this once at app startup)
	 */
	async loadDictionaries(): Promise<void> {
		try {
			// Load all dictionary files
			const [
				wordsByDifficultyResponse,
				wordsByLengthResponse,
				phoneticsResponse,
				rhymeGroupsResponse,
				definitionsResponse
			] = await Promise.all([
				fetch(`${base}/data/words-by-difficulty.json`),
				fetch(`${base}/data/words-by-length.json`),
				fetch(`${base}/data/phonetics.json`),
				fetch(`${base}/data/rhyme-groups.json`),
				fetch(`${base}/data/definitions.json`)
			]);

			this.wordsByDifficulty = await wordsByDifficultyResponse.json();
			this.wordsByLength = await wordsByLengthResponse.json();
			this.phonetics = await phoneticsResponse.json();
			this.rhymeGroups = await rhymeGroupsResponse.json();
			this.definitions = await definitionsResponse.json(); // Create a fast lookup set for word validation
			this.createValidWordsSet();

			console.log('Dictionary loaded successfully');
		} catch (error) {
			console.error('Failed to load dictionary:', error);
			throw new Error('Dictionary loading failed');
		}
	}

	/**
	 * Create a set of all valid words for fast lookup
	 */
	private createValidWordsSet(): void {
		if (!this.wordsByDifficulty) return;

		this.validWords = new Set<string>();

		// Add all words from difficulty categories
		Object.values(this.wordsByDifficulty).forEach((wordList: WordEntry[]) => {
			wordList.forEach((entry: WordEntry) => {
				this.validWords!.add(entry.word.toLowerCase());
			});
		});
	}

	/**
	 * Check if a word is valid
	 */
	isValidWord(word: string): boolean {
		if (!this.validWords) {
			console.warn('Dictionary not loaded yet');
			return false;
		}
		return this.validWords.has(word.toLowerCase());
	}

	/**
	 * Get words by difficulty level
	 */
	getWordsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): WordEntry[] {
		if (!this.wordsByDifficulty) {
			throw new Error('Dictionary not loaded');
		}
		return this.wordsByDifficulty[difficulty];
	}

	/**
	 * Get words by specific length
	 */
	getWordsByLength(length: number): string[] {
		if (!this.wordsByLength) {
			throw new Error('Dictionary not loaded');
		}
		return this.wordsByLength[length] || [];
	}

	/**
	 * Get common words by specific length (curated lists for game targets)
	 * Currently only supports length 5, falls back to all words for other lengths
	 */
	getCommonWords(length: number): string[] {
		if (length === 5) {
			return COMMON_WORDS_5;
		}
		// For other lengths, fall back to all words of that length
		return this.getWordsByLength(length);
	}

	/**
	 * Check if common words are available for a specific length
	 */
	hasCommonWords(length: number): boolean {
		return length === 5;
	}

	/**
	 * Get words by length range
	 */
	getWordsByLengthRange(minLength: number, maxLength: number): string[] {
		const words: string[] = [];
		for (let length = minLength; length <= maxLength; length++) {
			words.push(...this.getWordsByLength(length));
		}
		return words;
	}

	/**
	 * Get random words by difficulty
	 */
	getRandomWords(difficulty: 'easy' | 'medium' | 'hard', count: number): string[] {
		const words = this.getWordsByDifficulty(difficulty);
		const shuffled = [...words].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count).map((entry) => entry.word);
	}

	/**
	 * Get random words by length
	 */
	getRandomWordsByLength(length: number, count: number): string[] {
		const words = this.getWordsByLength(length);
		const shuffled = [...words].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	/**
	 * Get rhyming words for a given word
	 */
	getRhymingWords(word: string): string[] {
		if (!this.phonetics || !this.rhymeGroups) {
			throw new Error('Dictionary not loaded');
		}

		// Find the phonetic entry for the word
		const phoneticEntry = this.phonetics.find((entry) => entry.word === word.toLowerCase());
		if (!phoneticEntry) {
			return [];
		}

		// Get the rhyme key (last 2 sounds)
		const sounds = phoneticEntry.sounds;
		if (sounds.length < 2) {
			return [];
		}

		const rhymeKey = sounds.slice(-2).join(' ');
		const rhymeGroup = this.rhymeGroups[rhymeKey];

		if (!rhymeGroup) {
			return [];
		}

		// Return all words in the rhyme group except the input word
		return rhymeGroup.filter((rhymeWord) => rhymeWord !== word.toLowerCase());
	}

	/**
	 * Get all rhyme groups (for rhyme games)
	 */
	getAllRhymeGroups(): RhymeGroups {
		if (!this.rhymeGroups) {
			throw new Error('Dictionary not loaded');
		}
		return this.rhymeGroups;
	}

	/**
	 * Get random rhyme group with at least minWords words
	 */
	getRandomRhymeGroup(minWords: number = 3): { rhymeKey: string; words: string[] } | null {
		if (!this.rhymeGroups) {
			throw new Error('Dictionary not loaded');
		}

		const validGroups = Object.entries(this.rhymeGroups).filter(
			([, words]) => words.length >= minWords
		);

		if (validGroups.length === 0) {
			return null;
		}

		const randomIndex = Math.floor(Math.random() * validGroups.length);
		const [rhymeKey, words] = validGroups[randomIndex];

		return { rhymeKey, words };
	}

	/**
	 * Get phonetic information for a word
	 */
	getPhonetic(word: string): PhoneticEntry | null {
		if (!this.phonetics) {
			throw new Error('Dictionary not loaded');
		}

		return this.phonetics.find((entry) => entry.word === word.toLowerCase()) || null;
	}

	/**
	 * Fetch definition from Wiktionary API
	 */
	private async fetchFromWiktionary(word: string): Promise<DefinitionEntry | null> {
		try {
			const response = await fetch(
				`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`
			);

			if (!response.ok) {
				return null;
			}

			const data: Record<string, WiktionaryDefinition[]> = await response.json();

			// Extract English definitions
			const englishDefs = data.en;
			if (!englishDefs || englishDefs.length === 0) {
				return null;
			}

			// Parse and clean definitions
			const definitions: string[] = [];
			let primaryPartOfSpeech = '';

			for (const section of englishDefs) {
				if (!primaryPartOfSpeech && section.partOfSpeech) {
					primaryPartOfSpeech = section.partOfSpeech;
				}

				for (const def of section.definitions) {
					if (def.definition) {
						// Strip HTML tags from definition
						const cleanDef = def.definition.replace(/<[^>]*>/g, '').trim();
						if (cleanDef) {
							definitions.push(cleanDef);
						}
					}
				}
			}

			if (definitions.length === 0) {
				return null;
			}

			return {
				word: word.toLowerCase(),
				sources: [
					{
						source: 'wiktionary',
						definitions,
						partOfSpeech: primaryPartOfSpeech
					}
				]
			};
		} catch (error) {
			console.error('Failed to fetch from Wiktionary:', error);
			return null;
		}
	}

	/**
	 * Get definition for a word (checks local dictionary first)
	 */
	getDefinition(word: string): DefinitionEntry | null {
		if (!this.definitions) {
			throw new Error('Dictionary not loaded');
		}

		const entry = this.definitions.find((entry) => entry.word === word.toLowerCase());
		if (!entry) return null;

		// Convert old format to new format if needed
		if (!entry.sources && entry.definitions) {
			return {
				word: entry.word,
				sources: [
					{
						source: 'websters',
						definitions: entry.definitions,
						partOfSpeech: entry.partOfSpeech,
						pronunciation: entry.pronunciation
					}
				]
			};
		}

		return entry;
	}

	/**
	 * Get definition for a word from all available sources (Webster's + Wiktionary)
	 */
	async getDefinitionWithFallback(word: string): Promise<DefinitionEntry | null> {
		const sources: DefinitionSource[] = [];

		// Try local dictionary first (Webster's)
		const localDef = this.getDefinition(word);
		if (localDef && localDef.sources) {
			sources.push(...localDef.sources);
		}

		// Also try Wiktionary
		try {
			const wiktionaryDef = await this.fetchFromWiktionary(word);
			if (wiktionaryDef && wiktionaryDef.sources) {
				sources.push(...wiktionaryDef.sources);
			}
		} catch (error) {
			console.error('Error fetching from Wiktionary:', error);
		}

		if (sources.length === 0) {
			return null;
		}

		return {
			word: word.toLowerCase(),
			sources
		};
	}

	/**
	 * Get all definitions for a word (there might be multiple entries for the same word)
	 */
	getAllDefinitions(word: string): DefinitionEntry[] {
		if (!this.definitions) {
			throw new Error('Dictionary not loaded');
		}

		return this.definitions.filter((entry) => entry.word === word.toLowerCase());
	}

	/**
	 * Generate anagram candidates from letters
	 */
	findWordsFromLetters(availableLetters: string, minLength: number = 3): string[] {
		if (!this.validWords) {
			throw new Error('Dictionary not loaded');
		}

		const letterCounts = this.countLetters(availableLetters.toLowerCase());
		const results: string[] = [];

		// Check each valid word to see if it can be formed from available letters
		for (const word of this.validWords) {
			if (word.length < minLength || word.length > availableLetters.length) {
				continue;
			}

			if (this.canFormWord(word, letterCounts)) {
				results.push(word);
			}
		}

		return results;
	}

	/**
	 * Count occurrences of each letter in a string
	 */
	private countLetters(str: string): Record<string, number> {
		const counts: Record<string, number> = {};
		for (const char of str) {
			counts[char] = (counts[char] || 0) + 1;
		}
		return counts;
	}

	/**
	 * Check if a word can be formed from available letters
	 */
	private canFormWord(word: string, availableLetters: Record<string, number>): boolean {
		const wordLetters = this.countLetters(word);

		for (const [letter, needed] of Object.entries(wordLetters)) {
			if ((availableLetters[letter] || 0) < needed) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Generate word search puzzle words
	 */
	getWordsForWordSearch(
		difficulty: 'easy' | 'medium' | 'hard',
		count: number,
		maxLength: number = 10
	): string[] {
		const words = this.getWordsByDifficulty(difficulty)
			.filter((entry) => entry.word.length <= maxLength)
			.map((entry) => entry.word);

		const shuffled = [...words].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	/**
	 * Get statistics about loaded dictionary
	 */
	getStats(): {
		totalWords: number;
		wordsByDifficulty: Record<string, number>;
		phoneticsCount: number;
		rhymeGroupsCount: number;
		definitionsCount: number;
	} {
		if (!this.wordsByDifficulty || !this.phonetics || !this.rhymeGroups || !this.definitions) {
			throw new Error('Dictionary not loaded');
		}

		return {
			totalWords: this.validWords?.size || 0,
			wordsByDifficulty: {
				easy: this.wordsByDifficulty.easy.length,
				medium: this.wordsByDifficulty.medium.length,
				hard: this.wordsByDifficulty.hard.length
			},
			phoneticsCount: this.phonetics.length,
			rhymeGroupsCount: Object.keys(this.rhymeGroups).length,
			definitionsCount: this.definitions.length
		};
	}
}

// Export a singleton instance
export const gameDictionary = new GameDictionary();

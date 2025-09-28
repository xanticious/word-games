/**
 * Dictionary data loader for development
 *
 * This module provides server-side access to dictionary files for development and testing
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type {
	DifficultyWordLists,
	WordsByLength,
	PhoneticEntry,
	RhymeGroups
} from './dictionary.js';

const dataPath = join(process.cwd(), 'src', 'lib', 'data');

/**
 * Load dictionary data synchronously (for server-side use)
 */
export function loadDictionaryData() {
	try {
		const wordsByDifficulty: DifficultyWordLists = JSON.parse(
			readFileSync(join(dataPath, 'words-by-difficulty.json'), 'utf-8')
		);

		const wordsByLength: WordsByLength = JSON.parse(
			readFileSync(join(dataPath, 'words-by-length.json'), 'utf-8')
		);

		const phonetics: PhoneticEntry[] = JSON.parse(
			readFileSync(join(dataPath, 'phonetics.json'), 'utf-8')
		);

		const rhymeGroups: RhymeGroups = JSON.parse(
			readFileSync(join(dataPath, 'rhyme-groups.json'), 'utf-8')
		);

		return {
			wordsByDifficulty,
			wordsByLength,
			phonetics,
			rhymeGroups
		};
	} catch (error) {
		console.error('Failed to load dictionary data:', error);
		throw new Error('Dictionary data loading failed');
	}
}

/**
 * Quick word validation function
 */
export function isValidWord(word: string): boolean {
	try {
		const { wordsByDifficulty } = loadDictionaryData();
		const allWords = new Set<string>();

		Object.values(wordsByDifficulty).forEach((wordList: any[]) => {
			wordList.forEach((entry: any) => {
				allWords.add(entry.word.toLowerCase());
			});
		});

		return allWords.has(word.toLowerCase());
	} catch {
		return false;
	}
}

/**
 * Get sample words for testing
 */
export function getSampleWords(count: number = 10): string[] {
	try {
		const { wordsByDifficulty } = loadDictionaryData();
		const easyWords = wordsByDifficulty.easy.slice(0, count).map((entry) => entry.word);
		return easyWords;
	} catch {
		return ['cat', 'dog', 'house', 'tree', 'book', 'car', 'sun', 'moon', 'star', 'fish'];
	}
}

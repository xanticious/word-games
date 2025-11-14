/**
 * Service for retrieving word lists for the Word Search game
 */

import type { WordListType } from './types.js';

/**
 * Fetches a word list based on the specified type
 * TODO: Implement actual word list fetching logic
 * For now, returns mock data
 */
export async function getWordList(wordListType: WordListType, gridSize: number): Promise<string[]> {
	// Simulate async operation
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Mock data for initial implementation
	return ['AAA', 'AAAAA'];
}

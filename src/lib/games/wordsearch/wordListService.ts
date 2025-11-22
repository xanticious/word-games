/**
 * Service for retrieving word lists for the Word Search game
 * Handles fetching word lists from various sources (Wikipedia, etc.)
 */

import type { WordListType } from './types.js';
import { extractWords } from './textProcessor.js';

export interface WordListResult {
	words: string[];
	sourceName: string;
	sourceUrl?: string;
}

const MIN_WORDS_NEEDED = 8;

/**
 * Fetches a random Wikipedia article and extracts words
 */
async function fetchWikipediaArticle(): Promise<{ title: string; words: string[] } | null> {
	try {
		const url =
			'https://en.wikipedia.org/w/api.php?' +
			new URLSearchParams({
				action: 'query',
				format: 'json',
				generator: 'random',
				grnnamespace: '0', // Main namespace only (articles)
				prop: 'extracts',
				explaintext: 'true',
				origin: '*' // CORS
			});

		const response = await fetch(url);
		if (!response.ok) return null;

		const data = await response.json();
		const pages = data.query?.pages;
		if (!pages) return null;

		// Get the first (and only) page
		const pageId = Object.keys(pages)[0];
		const page = pages[pageId];
		const title = page.title;
		const content = page.extract;

		if (!title || !content) return null;

		// Extract words from content
		const words = extractWords(content);

		return { title, words };
	} catch (error) {
		console.error('Error fetching Wikipedia article:', error);
		return null;
	}
}

/**
 * Fetches a word list based on the specified type
 */
export async function getWordList(
	wordListType: WordListType,
	gridSize: number
): Promise<WordListResult> {
	if (wordListType === 'wikipedia') {
		// Try to fetch Wikipedia article, retry if needed
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts) {
			attempts++;
			const article = await fetchWikipediaArticle();

			if (article && article.words.length >= MIN_WORDS_NEEDED) {
				// Success! Return the words as a word bank (sorted alphabetically)
				// Return more words than needed - the grid generator will select which ones fit
				const sortedWords = article.words.slice(0, 150).sort();
				// Create Wikipedia URL from title (encode and replace spaces with underscores)
				const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
				return {
					words: sortedWords,
					sourceName: article.title,
					sourceUrl: wikipediaUrl
				};
			}

			// Not enough words, try again
			console.log(
				`Article ${article?.title || 'unknown'} had only ${article?.words.length || 0} words, retrying...`
			);
		}

		// Failed to get good article after max attempts, fall back to mock
		console.warn('Failed to fetch Wikipedia article with enough words, using mock data');
		return {
			words: ['AAA', 'AAAAA'],
			sourceName: 'Mock Data'
		};
	}

	// For other word list types, return mock data for now
	return {
		words: ['AAA', 'AAAAA'],
		sourceName: 'Mock Data'
	};
}

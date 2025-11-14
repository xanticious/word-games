/**
 * Service for retrieving word lists for the Word Search game
 */

import type { WordListType } from './types.js';

export interface WordListResult {
	words: string[];
	sourceName: string;
	sourceUrl?: string;
}

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
				exintro: 'false', // Get full article, not just intro
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
 * Extracts and filters words from text content
 */
function extractWords(text: string): string[] {
	// Extract words (letters only, case insensitive)
	const wordMatches = text.match(/[a-zA-Z]+/g) || [];

	// Filter and deduplicate
	const wordSet = new Set<string>();
	for (const word of wordMatches) {
		const normalized = word.toLowerCase();
		// Filter out short words and common filler words
		if (normalized.length >= MIN_WORD_LENGTH && !COMMON_WORDS.has(normalized)) {
			wordSet.add(normalized.toUpperCase());
		}
	}

	return Array.from(wordSet);
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
				// Success! Return the words (sorted alphabetically)
				const sortedWords = article.words.slice(0, 20).sort();
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

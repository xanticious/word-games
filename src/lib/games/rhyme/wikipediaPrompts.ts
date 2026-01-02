/**
 * Wikipedia prompt generator for Rhyme Thyme
 * Fetches random articles and extracts valid prompts and bonus words
 */

import type { GamePrompt } from './types.js';
import type { GameDictionary } from '$lib/dictionary.js';
import { WIKIPEDIA } from './config.js';

/**
 * Fetch a random Wikipedia article
 * Returns title, URL, and text content
 */
async function fetchWikipediaArticle(): Promise<{
	title: string;
	url: string;
	content: string;
} | null> {
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

		const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

		return { title, url: articleUrl, content };
	} catch (error) {
		console.error('Error fetching Wikipedia article:', error);
		return null;
	}
}

/**
 * Extract words from text content
 * Returns array of words (4+ characters, no numbers)
 */
function extractWords(text: string): string[] {
	// Split by whitespace and punctuation
	const words = text
		.toLowerCase()
		.split(/[\s\.,;:!?()[\]{}""''`\-—–]+/)
		.filter((word) => {
			// Filter: at least 4 characters, no numbers
			if (word.length < 4) return false;
			if (/\d/.test(word)) return false;
			// Only letters (and maybe hyphens/apostrophes within)
			if (!/^[a-z'-]+$/.test(word)) return false;
			return true;
		})
		.map((word) => word.replace(/^['-]+|['-]+$/g, '')); // Trim leading/trailing punctuation

	// Remove duplicates
	return Array.from(new Set(words));
}

/**
 * Extract candidate prompts from text
 * Returns array of 3-6 word phrases from sentence beginnings
 */
function extractPromptCandidates(text: string): string[] {
	const candidates: string[] = [];

	// Split into sentences
	const sentences = text.split(/[.!?]+/);

	for (const sentence of sentences) {
		const words = sentence.trim().split(/\s+/);

		// Generate candidates of different lengths
		for (let len = WIKIPEDIA.promptMinWords; len <= WIKIPEDIA.promptMaxWords; len++) {
			if (words.length >= len) {
				const candidate = words.slice(0, len).join(' ').trim();
				if (candidate.length > 0) {
					candidates.push(candidate);
				}
			}
		}
	}

	return candidates;
}

/**
 * Validate a prompt candidate
 * Returns true if valid (last word not filler, all words in dictionary)
 */
function isValidPrompt(prompt: string, dictionary: GameDictionary): boolean {
	const words = prompt.toLowerCase().split(/\s+/);

	if (words.length === 0) return false;

	// Check last word is not a filler word
	const lastWord = words[words.length - 1];
	if (WIKIPEDIA.fillerWords.includes(lastWord)) {
		return false;
	}

	// Check all words exist in dictionary
	for (const word of words) {
		if (!dictionary.isValidWord(word)) {
			return false;
		}
	}

	return true;
}

/**
 * Generate bonus words from article
 * Returns array of 5 words (4-10 letters, exist in dictionary)
 */
function generateBonusWords(
	articleWords: string[],
	promptWords: string[],
	dictionary: GameDictionary
): string[] {
	const bonusWords: string[] = [];
	const promptWordsSet = new Set(promptWords.map((w) => w.toLowerCase()));

	// Filter candidate words
	const candidates = articleWords.filter((word) => {
		// Length check
		if (word.length < WIKIPEDIA.bonusWordMinLength) return false;
		if (word.length > WIKIPEDIA.bonusWordMaxLength) return false;

		// Not in prompt
		if (promptWordsSet.has(word.toLowerCase())) return false;

		// Exists in dictionary
		if (!dictionary.isValidWord(word)) return false;

		return true;
	});

	// Shuffle and select first 5
	const shuffled = [...candidates].sort(() => Math.random() - 0.5);
	bonusWords.push(...shuffled.slice(0, WIKIPEDIA.bonusWordCount));

	return bonusWords;
}

/**
 * Generate a game prompt from Wikipedia
 * Tries multiple articles until valid prompt found
 */
export async function generatePrompt(dictionary: GameDictionary): Promise<GamePrompt | null> {
	let attempts = 0;

	while (attempts < WIKIPEDIA.articlesToFetch) {
		attempts++;

		// Fetch random article
		const article = await fetchWikipediaArticle();
		if (!article) continue;

		// Extract words and candidates
		const articleWords = extractWords(article.content);
		const promptCandidates = extractPromptCandidates(article.content);

		if (promptCandidates.length === 0) continue;

		// Find a valid prompt
		let validPrompt: string | null = null;

		for (const candidate of promptCandidates) {
			if (isValidPrompt(candidate, dictionary)) {
				validPrompt = candidate;
				break;
			}
		}

		if (!validPrompt) continue;

		// Generate bonus words
		const promptWords = validPrompt.toLowerCase().split(/\s+/);
		const bonusWords = generateBonusWords(articleWords, promptWords, dictionary);

		// Check if we have enough bonus words
		if (bonusWords.length < WIKIPEDIA.bonusWordCount) {
			continue;
		}

		// Success!
		return {
			prompt: validPrompt,
			sourceTitle: article.title,
			sourceUrl: article.url,
			bonusWords
		};
	}

	// Failed to generate prompt after max attempts
	return null;
}

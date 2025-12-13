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
	// Wikipedia themes
	if (wordListType === 'wikipedia-random') {
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

	// Movies themes
	if (wordListType === 'movies-random-list') {
		// TODO: Implement random movie titles fetching
		return {
			words: ['INCEPTION', 'AVATAR', 'TITANIC', 'GLADIATOR', 'MATRIX', 'INTERSTELLAR'],
			sourceName: 'Random Movies (Mock)'
		};
	}

	if (wordListType === 'movies-actors-list') {
		// TODO: Implement random actors fetching
		return {
			words: ['DICAPRIO', 'HANKS', 'STREEP', 'DENIRO', 'CRUISE', 'DOWNEY'],
			sourceName: 'Random Actors (Mock)'
		};
	}

	if (wordListType === 'movies-random-blurb') {
		// TODO: Implement random movie blurb fetching and word extraction
		return {
			words: ['DREAM', 'REALITY', 'SUBCONSCIOUS', 'HEIST', 'LAYER', 'ARCHITECT'],
			sourceName: 'Inception (Mock)',
			sourceUrl: 'https://www.imdb.com/title/tt1375666/'
		};
	}

	if (wordListType === 'movies-random-cast') {
		// TODO: Implement random movie cast fetching
		return {
			words: ['DICAPRIO', 'COTILLARD', 'PAGE', 'HARDY', 'WATANABE', 'MURPHY'],
			sourceName: 'Inception Cast (Mock)',
			sourceUrl: 'https://www.imdb.com/title/tt1375666/'
		};
	}

	if (wordListType === 'movies-random-characters') {
		// TODO: Implement random movie characters fetching
		return {
			words: ['COBB', 'MAL', 'ARIADNE', 'EAMES', 'ARTHUR', 'SAITO'],
			sourceName: 'Inception Characters (Mock)',
			sourceUrl: 'https://www.imdb.com/title/tt1375666/'
		};
	}

	if (wordListType === 'movies-actor-blurb') {
		// TODO: Implement random actor biography word extraction
		return {
			words: ['ACTOR', 'HOLLYWOOD', 'OSCAR', 'PERFORMANCE', 'CAREER', 'DIRECTOR'],
			sourceName: 'Leonardo DiCaprio Bio (Mock)',
			sourceUrl: 'https://www.imdb.com/name/nm0000138/'
		};
	}

	if (wordListType === 'movies-actor-filmography') {
		// TODO: Implement random actor filmography fetching
		return {
			words: ['INCEPTION', 'TITANIC', 'REVENANT', 'DJANGO', 'DEPARTED', 'GATSBY'],
			sourceName: 'Leonardo DiCaprio Filmography (Mock)',
			sourceUrl: 'https://www.imdb.com/name/nm0000138/'
		};
	}

	// Books themes
	if (wordListType === 'books-random-list') {
		// TODO: Implement random book titles fetching
		return {
			words: ['GATSBY', 'MOCKINGBIRD', 'CATCHER', 'PRIDE', 'PREJUDICE', 'ODYSSEY'],
			sourceName: 'Random Books (Mock)'
		};
	}

	if (wordListType === 'books-authors-list') {
		// TODO: Implement random authors fetching
		return {
			words: ['FITZGERALD', 'AUSTEN', 'HEMINGWAY', 'SHAKESPEARE', 'ORWELL', 'TOLKIEN'],
			sourceName: 'Random Authors (Mock)'
		};
	}

	if (wordListType === 'books-goodreads-blurb') {
		// TODO: Implement random GoodReads book blurb word extraction
		return {
			words: ['GATSBY', 'JAZZ', 'AGE', 'WEALTH', 'LOVE', 'DREAM', 'AMERICA'],
			sourceName: 'The Great Gatsby (Mock)',
			sourceUrl: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby'
		};
	}

	if (wordListType === 'books-random-characters') {
		// TODO: Implement random book characters fetching
		return {
			words: ['GATSBY', 'DAISY', 'NICK', 'BUCHANAN', 'JORDAN', 'WILSON'],
			sourceName: 'The Great Gatsby Characters (Mock)',
			sourceUrl: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby'
		};
	}

	if (wordListType === 'books-author-works') {
		// TODO: Implement random author works fetching
		return {
			words: ['GATSBY', 'PARADISE', 'BEAUTIFUL', 'DAMNED', 'TENDER', 'NIGHT'],
			sourceName: 'F. Scott Fitzgerald Works (Mock)',
			sourceUrl: 'https://www.goodreads.com/author/show/3190.F_Scott_Fitzgerald'
		};
	}

	// Fallback for unknown types
	return {
		words: ['AAA', 'AAAAA'],
		sourceName: 'Unknown Type (Mock)'
	};
}

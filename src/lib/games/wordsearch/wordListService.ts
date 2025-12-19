/**
 * Service for retrieving word lists for the Word Search game
 * Handles fetching word lists from various sources (Wikipedia, IMDb, etc.)
 */

import type { WordListType, WordEntry } from './types.js';
import { extractWords } from './textProcessor.js';
import {
	loadIMDbData,
	getRandomMovies,
	getRandomActors,
	getRandomMovie,
	getRandomActor,
	getMovieCast,
	getMovieCharacters,
	getActorFilmography
} from '$lib/imdb-loader.js';
import type { IMDbData } from '$lib/types/imdb.js';

export interface WordListResult {
	words: WordEntry[];
	sourceName: string;
	sourceUrl?: string;
}

const MIN_WORDS_NEEDED = 8;

// Cache IMDb data to avoid reloading
let imdbDataCache: IMDbData | null = null;

/**
 * Gets IMDb data, loading and caching it on first request
 */
async function getIMDbData(): Promise<IMDbData> {
	if (!imdbDataCache) {
		imdbDataCache = await loadIMDbData();
	}
	return imdbDataCache;
}

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
				// For Wikipedia, display and grid values are the same (already sanitized)
				const wordEntries: WordEntry[] = sortedWords.map((word) => ({
					displayValue: word,
					gridValue: word
				}));
				// Create Wikipedia URL from title (encode and replace spaces with underscores)
				const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
				return {
					words: wordEntries,
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
			words: [
				{ displayValue: 'AAA', gridValue: 'AAA' },
				{ displayValue: 'AAAAA', gridValue: 'AAAAA' }
			],
			sourceName: 'Mock Data'
		};
	}

	// Movies themes
	if (wordListType === 'movies-random-list') {
		const data = await getIMDbData();
		const movieTitles = getRandomMovies(data, 150);
		return {
			words: movieTitles,
			sourceName: 'Random Movies'
		};
	}

	if (wordListType === 'movies-actors-list') {
		const data = await getIMDbData();
		const actorNames = getRandomActors(data, 150);
		return {
			words: actorNames,
			sourceName: 'Random Actors/Actresses'
		};
	}

	if (wordListType === 'movies-random-cast') {
		const data = await getIMDbData();
		const movie = getRandomMovie(data);
		const cast = getMovieCast(data, movie.id);
		const imdbUrl = `https://www.imdb.com/title/${movie.id}/`;
		return {
			words: cast,
			sourceName: `Cast from ${movie.title}`,
			sourceUrl: imdbUrl
		};
	}

	if (wordListType === 'movies-random-characters') {
		const data = await getIMDbData();
		const movie = getRandomMovie(data);
		const characters = getMovieCharacters(data, movie.id);
		const imdbUrl = `https://www.imdb.com/title/${movie.id}/`;
		return {
			words: characters,
			sourceName: `Characters from ${movie.title}`,
			sourceUrl: imdbUrl
		};
	}

	if (wordListType === 'movies-actor-filmography') {
		const data = await getIMDbData();
		const actor = getRandomActor(data);
		const movies = getActorFilmography(data, actor.id);
		const imdbUrl = `https://www.imdb.com/name/${actor.id}/`;
		return {
			words: movies,
			sourceName: `Movies featuring ${actor.name}`,
			sourceUrl: imdbUrl
		};
	}

	// Books themes
	if (wordListType === 'books-random-list') {
		// TODO: Implement random book titles fetching
		const mockWords = ['GATSBY', 'MOCKINGBIRD', 'CATCHER', 'PRIDE', 'PREJUDICE', 'ODYSSEY'];
		return {
			words: mockWords.map((w) => ({ displayValue: w, gridValue: w })),
			sourceName: 'Random Books (Mock)'
		};
	}

	if (wordListType === 'books-authors-list') {
		// TODO: Implement random authors fetching
		const mockWords = ['FITZGERALD', 'AUSTEN', 'HEMINGWAY', 'SHAKESPEARE', 'ORWELL', 'TOLKIEN'];
		return {
			words: mockWords.map((w) => ({ displayValue: w, gridValue: w })),
			sourceName: 'Random Authors (Mock)'
		};
	}

	if (wordListType === 'books-goodreads-blurb') {
		// TODO: Implement random GoodReads book blurb word extraction
		const mockWords = ['GATSBY', 'JAZZ', 'AGE', 'WEALTH', 'LOVE', 'DREAM', 'AMERICA'];
		return {
			words: mockWords.map((w) => ({ displayValue: w, gridValue: w })),
			sourceName: 'The Great Gatsby (Mock)',
			sourceUrl: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby'
		};
	}

	if (wordListType === 'books-random-characters') {
		// TODO: Implement random book characters fetching
		const mockWords = ['GATSBY', 'DAISY', 'NICK', 'BUCHANAN', 'JORDAN', 'WILSON'];
		return {
			words: mockWords.map((w) => ({ displayValue: w, gridValue: w })),
			sourceName: 'The Great Gatsby Characters (Mock)',
			sourceUrl: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby'
		};
	}

	if (wordListType === 'books-author-works') {
		// TODO: Implement random author works fetching
		const mockWords = ['GATSBY', 'PARADISE', 'BEAUTIFUL', 'DAMNED', 'TENDER', 'NIGHT'];
		return {
			words: mockWords.map((w) => ({ displayValue: w, gridValue: w })),
			sourceName: 'F. Scott Fitzgerald Works (Mock)',
			sourceUrl: 'https://www.goodreads.com/author/show/3190.F_Scott_Fitzgerald'
		};
	}

	// Fallback for unknown types
	return {
		words: [
			{ displayValue: 'AAA', gridValue: 'AAA' },
			{ displayValue: 'AAAAA', gridValue: 'AAAAA' }
		],
		sourceName: 'Unknown Type (Mock)'
	};
}

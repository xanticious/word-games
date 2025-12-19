/**
 * IMDb data loader for client-side usage
 *
 * Provides functions to fetch and decompress IMDb data from the server
 * using native browser Compression Streams API.
 */

import type { IMDbData } from './types/imdb';
import type { WordEntry } from './games/wordsearch/types';
import { base } from '$app/paths';

const MIN_WORD_LENGTH = 4;

/**
 * Creates a WordEntry from a text string
 * Sanitizes the text for grid placement while preserving the original for display
 *
 * @param text The original text (e.g., "The Dark Knight")
 * @returns WordEntry with display and grid values, or null if grid value is too short
 */
function createWordEntry(text: string): WordEntry | null {
	// Create display value: trim and convert to uppercase
	const displayValue = text.trim().toUpperCase();

	// Create grid value: extract only A-Z letters
	const gridValue = text.replace(/[^a-zA-Z]/g, '').toUpperCase();

	// Filter out if grid value is too short
	if (gridValue.length < MIN_WORD_LENGTH) {
		return null;
	}

	return { displayValue, gridValue };
}

/**
 * Loads IMDb data from the server
 *
 * Fetches the compressed data file and decompresses it using the browser's
 * native DecompressionStream API.
 *
 * @returns Promise resolving to the decompressed IMDb data
 * @throws Error if the fetch fails or decompression is not supported
 */
export async function loadIMDbData(): Promise<IMDbData> {
	// Check if DecompressionStream is supported
	if (typeof DecompressionStream === 'undefined') {
		throw new Error('DecompressionStream is not supported in this browser');
	}

	try {
		const url = `${base}/data/imdb-data.json.gz`;
		console.log('[IMDb Loader] Fetching from URL:', url);

		const response = await fetch(url);
		console.log('[IMDb Loader] Fetch response:', {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries())
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch IMDb data: ${response.status} ${response.statusText}`);
		}

		console.log('[IMDb Loader] Parsing JSON (server already decompressed)...');
		// Note: The server automatically decompresses .gz files and sets content-encoding: gzip
		// The browser's fetch API handles this automatically, so we just parse JSON directly
		const data = await response.json();
		console.log('[IMDb Loader] Successfully loaded IMDb data:', {
			movieCount: Object.keys(data.movies || {}).length,
			actorCount: Object.keys(data.actors || {}).length
		});

		return data;
	} catch (error) {
		console.error('[IMDb Loader] Error occurred:', error);
		if (error instanceof Error) {
			throw new Error(`Failed to load IMDb data: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Gets a random movie from the IMDb data
 *
 * @param data The IMDb data object
 * @returns A random movie object
 */
export function getRandomMovie(data: IMDbData) {
	const movieIds = Object.keys(data.movies);
	const randomId = movieIds[Math.floor(Math.random() * movieIds.length)];
	return data.movies[randomId];
}

/**
 * Gets a random actor from the IMDb data
 *
 * @param data The IMDb data object
 * @returns A random actor object
 */
export function getRandomActor(data: IMDbData) {
	const actorIds = Object.keys(data.actors);
	const randomId = actorIds[Math.floor(Math.random() * actorIds.length)];
	return data.actors[randomId];
}

/**
 * Gets actor names for a movie
 *
 * @param data The IMDb data object
 * @param movieId The movie ID
 * @returns Array of WordEntry objects with actor names
 */
export function getMovieCast(data: IMDbData, movieId: string): WordEntry[] {
	const movie = data.movies[movieId];
	if (!movie) return [];
	return movie.actorIds
		.map((actorId) => data.actors[actorId]?.name)
		.filter(Boolean)
		.map((name) => createWordEntry(name))
		.filter((entry): entry is WordEntry => entry !== null);
}

/**
 * Gets character names for a movie
 *
 * @param data The IMDb data object
 * @param movieId The movie ID
 * @returns Array of WordEntry objects with character names
 */
export function getMovieCharacters(data: IMDbData, movieId: string): WordEntry[] {
	const movie = data.movies[movieId];
	const characters = movie?.characters || [];
	return characters
		.map((name) => createWordEntry(name))
		.filter((entry): entry is WordEntry => entry !== null);
}

/**
 * Gets movie titles for an actor
 *
 * @param data The IMDb data object
 * @param actorId The actor ID
 * @returns Array of WordEntry objects with movie titles
 */
export function getActorFilmography(data: IMDbData, actorId: string): WordEntry[] {
	const actor = data.actors[actorId];
	if (!actor) return [];
	return actor.movieIds
		.map((movieId) => data.movies[movieId]?.title)
		.filter(Boolean)
		.map((title) => createWordEntry(title))
		.filter((entry): entry is WordEntry => entry !== null);
}

/**
 * Gets a random list of movie titles
 *
 * @param data The IMDb data object
 * @param count Number of movies to return
 * @returns Array of WordEntry objects with movie titles
 */
export function getRandomMovies(data: IMDbData, count: number): WordEntry[] {
	const movieIds = Object.keys(data.movies);
	const shuffled = movieIds.sort(() => Math.random() - 0.5);

	// Keep trying until we have enough valid words
	const result: WordEntry[] = [];
	for (const id of shuffled) {
		const entry = createWordEntry(data.movies[id].title);
		if (entry) {
			result.push(entry);
			if (result.length >= count) break;
		}
	}

	return result;
} /**
 * Gets a random list of actor names
 *
 * @param data The IMDb data object
 * @param count Number of actors to return
 * @returns Array of WordEntry objects with actor names
 */
export function getRandomActors(data: IMDbData, count: number): WordEntry[] {
	const actorIds = Object.keys(data.actors);
	const shuffled = actorIds.sort(() => Math.random() - 0.5);

	// Keep trying until we have enough valid words
	const result: WordEntry[] = [];
	for (const id of shuffled) {
		const entry = createWordEntry(data.actors[id].name);
		if (entry) {
			result.push(entry);
			if (result.length >= count) break;
		}
	}

	return result;
}

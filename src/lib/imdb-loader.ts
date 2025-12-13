/**
 * IMDb data loader for client-side usage
 *
 * Provides functions to fetch and decompress IMDb data from the server
 * using native browser Compression Streams API.
 */

import type { IMDbData } from './types/imdb';

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
		const response = await fetch('/data/imdb-data.json.gz');

		if (!response.ok) {
			throw new Error(`Failed to fetch IMDb data: ${response.status} ${response.statusText}`);
		}

		// Decompress using native browser API
		const decompressedStream = response.body!.pipeThrough(new DecompressionStream('gzip'));
		const decompressedResponse = new Response(decompressedStream);

		return await decompressedResponse.json();
	} catch (error) {
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
 * @returns Array of actor names
 */
export function getMovieCast(data: IMDbData, movieId: string): string[] {
	const movie = data.movies[movieId];
	if (!movie) return [];
	return movie.actorIds.map((actorId) => data.actors[actorId]?.name).filter(Boolean);
}

/**
 * Gets character names for a movie
 *
 * @param data The IMDb data object
 * @param movieId The movie ID
 * @returns Array of character names
 */
export function getMovieCharacters(data: IMDbData, movieId: string): string[] {
	const movie = data.movies[movieId];
	return movie?.characters || [];
}

/**
 * Gets movie titles for an actor
 *
 * @param data The IMDb data object
 * @param actorId The actor ID
 * @returns Array of movie titles
 */
export function getActorFilmography(data: IMDbData, actorId: string): string[] {
	const actor = data.actors[actorId];
	if (!actor) return [];
	return actor.movieIds.map((movieId) => data.movies[movieId]?.title).filter(Boolean);
}

/**
 * Gets a random list of movie titles
 *
 * @param data The IMDb data object
 * @param count Number of movies to return
 * @returns Array of movie titles
 */
export function getRandomMovies(data: IMDbData, count: number): string[] {
	const movieIds = Object.keys(data.movies);
	const shuffled = movieIds.sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, count);
	return selected.map((id) => data.movies[id].title);
}

/**
 * Gets a random list of actor names
 *
 * @param data The IMDb data object
 * @param count Number of actors to return
 * @returns Array of actor names
 */
export function getRandomActors(data: IMDbData, count: number): string[] {
	const actorIds = Object.keys(data.actors);
	const shuffled = actorIds.sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, count);
	return selected.map((id) => data.actors[id].name);
}

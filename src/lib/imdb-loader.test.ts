/**
 * Tests for IMDb data loader functions
 */

import { describe, it, expect } from 'vitest';
import type { IMDbData } from './types/imdb';
import {
	getRandomMovie,
	getRandomActor,
	getMovieCast,
	getMovieCharacters,
	getActorFilmography,
	getRandomMovies,
	getRandomActors
} from './imdb-loader';

// Mock IMDb data for testing
const mockData: IMDbData = {
	movies: {
		tt0111161: {
			id: 'tt0111161',
			title: 'The Shawshank Redemption',
			characters: ['Andy Dufresne', 'Ellis Boyd Redding', 'Warden Norton'],
			actorIds: ['nm0000209', 'nm0000151', 'nm0324231']
		},
		tt0068646: {
			id: 'tt0068646',
			title: 'The Godfather',
			characters: ['Vito Corleone', 'Michael Corleone', 'Tom Hagen'],
			actorIds: ['nm0000008', 'nm0000199', 'nm0000380']
		},
		tt0468569: {
			id: 'tt0468569',
			title: 'The Dark Knight',
			characters: ['Bruce Wayne', 'Joker', 'Harvey Dent'],
			actorIds: ['nm0000288', 'nm0005132', 'nm0001173']
		}
	},
	actors: {
		nm0000209: {
			id: 'nm0000209',
			name: 'Tim Robbins',
			movieIds: ['tt0111161']
		},
		nm0000151: {
			id: 'nm0000151',
			name: 'Morgan Freeman',
			movieIds: ['tt0111161', 'tt0468569']
		},
		nm0324231: {
			id: 'nm0324231',
			name: 'Bob Gunton',
			movieIds: ['tt0111161']
		},
		nm0000008: {
			id: 'nm0000008',
			name: 'Marlon Brando',
			movieIds: ['tt0068646']
		},
		nm0000199: {
			id: 'nm0000199',
			name: 'Al Pacino',
			movieIds: ['tt0068646']
		},
		nm0000380: {
			id: 'nm0000380',
			name: 'Robert Duvall',
			movieIds: ['tt0068646']
		},
		nm0000288: {
			id: 'nm0000288',
			name: 'Christian Bale',
			movieIds: ['tt0468569']
		},
		nm0005132: {
			id: 'nm0005132',
			name: 'Heath Ledger',
			movieIds: ['tt0468569']
		},
		nm0001173: {
			id: 'nm0001173',
			name: 'Aaron Eckhart',
			movieIds: ['tt0468569']
		}
	}
};

describe('IMDb Loader', () => {
	describe('getRandomMovie', () => {
		it('returns a movie from the dataset', () => {
			const movie = getRandomMovie(mockData);
			expect(movie).toBeDefined();
			expect(movie.id).toBeTruthy();
			expect(movie.title).toBeTruthy();
			expect(mockData.movies[movie.id]).toBe(movie);
		});
	});

	describe('getRandomActor', () => {
		it('returns an actor from the dataset', () => {
			const actor = getRandomActor(mockData);
			expect(actor).toBeDefined();
			expect(actor.id).toBeTruthy();
			expect(actor.name).toBeTruthy();
			expect(mockData.actors[actor.id]).toBe(actor);
		});
	});

	describe('getMovieCast', () => {
		it('returns WordEntry objects with actor names', () => {
			const cast = getMovieCast(mockData, 'tt0111161');
			expect(cast).toEqual([
				{ displayValue: 'TIM ROBBINS', gridValue: 'TIMROBBINS' },
				{ displayValue: 'MORGAN FREEMAN', gridValue: 'MORGANFREEMAN' },
				{ displayValue: 'BOB GUNTON', gridValue: 'BOBGUNTON' }
			]);
		});

		it('returns empty array for non-existent movie', () => {
			const cast = getMovieCast(mockData, 'tt9999999');
			expect(cast).toEqual([]);
		});

		it('filters out missing actors', () => {
			const dataWithMissingActor: IMDbData = {
				movies: {
					tt0111161: {
						id: 'tt0111161',
						title: 'The Shawshank Redemption',
						characters: [],
						actorIds: ['nm0000209', 'nm9999999'] // Second actor doesn't exist
					}
				},
				actors: {
					nm0000209: {
						id: 'nm0000209',
						name: 'Tim Robbins',
						movieIds: ['tt0111161']
					}
				}
			};

			const cast = getMovieCast(dataWithMissingActor, 'tt0111161');
			expect(cast).toEqual([{ displayValue: 'TIM ROBBINS', gridValue: 'TIMROBBINS' }]);
		});
	});

	describe('getMovieCharacters', () => {
		it('returns WordEntry objects with character names', () => {
			const characters = getMovieCharacters(mockData, 'tt0111161');
			expect(characters).toEqual([
				{ displayValue: 'ANDY DUFRESNE', gridValue: 'ANDYDUFRESNE' },
				{ displayValue: 'ELLIS BOYD REDDING', gridValue: 'ELLISBOYDREDDING' },
				{ displayValue: 'WARDEN NORTON', gridValue: 'WARDENNORTON' }
			]);
		});

		it('returns empty array for non-existent movie', () => {
			const characters = getMovieCharacters(mockData, 'tt9999999');
			expect(characters).toEqual([]);
		});
	});

	describe('getActorFilmography', () => {
		it('returns WordEntry objects with movie titles', () => {
			const movies = getActorFilmography(mockData, 'nm0000151');
			expect(movies).toEqual([
				{ displayValue: 'THE SHAWSHANK REDEMPTION', gridValue: 'THESHAWSHANKREDEMPTION' },
				{ displayValue: 'THE DARK KNIGHT', gridValue: 'THEDARKKNIGHT' }
			]);
		});

		it('returns empty array for non-existent actor', () => {
			const movies = getActorFilmography(mockData, 'nm9999999');
			expect(movies).toEqual([]);
		});

		it('filters out missing movies', () => {
			const dataWithMissingMovie: IMDbData = {
				movies: {
					tt0111161: {
						id: 'tt0111161',
						title: 'The Shawshank Redemption',
						characters: [],
						actorIds: ['nm0000151']
					}
				},
				actors: {
					nm0000151: {
						id: 'nm0000151',
						name: 'Morgan Freeman',
						movieIds: ['tt0111161', 'tt9999999'] // Second movie doesn't exist
					}
				}
			};

			const movies = getActorFilmography(dataWithMissingMovie, 'nm0000151');
			expect(movies).toEqual([
				{ displayValue: 'THE SHAWSHANK REDEMPTION', gridValue: 'THESHAWSHANKREDEMPTION' }
			]);
		});
	});

	describe('getRandomMovies', () => {
		it('returns requested number of WordEntry objects', () => {
			const movies = getRandomMovies(mockData, 2);
			expect(movies).toHaveLength(2);
			expect(movies.every((entry) => 'displayValue' in entry && 'gridValue' in entry)).toBe(true);
			expect(
				movies.every(
					(entry) => typeof entry.displayValue === 'string' && typeof entry.gridValue === 'string'
				)
			).toBe(true);
		});

		it('returns all movies if count exceeds available', () => {
			const movies = getRandomMovies(mockData, 100);
			expect(movies).toHaveLength(3); // Only 3 movies in mock data
		});

		it('returns different movies on repeated calls', () => {
			// This test might occasionally fail due to randomness
			// Run multiple times to increase confidence
			const results = new Set<string>();
			for (let i = 0; i < 10; i++) {
				const movies = getRandomMovies(mockData, 2);
				results.add(movies.map((m) => m.gridValue).join(','));
			}
			// With 10 runs, we should get at least 2 different combinations
			expect(results.size).toBeGreaterThan(1);
		});
	});

	describe('getRandomActors', () => {
		it('returns requested number of WordEntry objects', () => {
			const actors = getRandomActors(mockData, 3);
			expect(actors).toHaveLength(3);
			expect(actors.every((entry) => 'displayValue' in entry && 'gridValue' in entry)).toBe(true);
			expect(
				actors.every(
					(entry) => typeof entry.displayValue === 'string' && typeof entry.gridValue === 'string'
				)
			).toBe(true);
		});

		it('returns all actors if count exceeds available', () => {
			const actors = getRandomActors(mockData, 100);
			expect(actors).toHaveLength(9); // 9 actors in mock data
		});

		it('returns different actors on repeated calls', () => {
			// This test might occasionally fail due to randomness
			// Run multiple times to increase confidence
			const results = new Set<string>();
			for (let i = 0; i < 10; i++) {
				const actors = getRandomActors(mockData, 3);
				results.add(actors.map((a) => a.gridValue).join(','));
			}
			// With 10 runs, we should get at least 2 different combinations
			expect(results.size).toBeGreaterThan(1);
		});
	});
});

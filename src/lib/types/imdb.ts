/**
 * IMDb data types for movie and actor information
 */

export interface Movie {
	/** IMDb title ID (tconst) */
	id: string;
	/** Primary movie title */
	title: string;
	/** Unique character names from the movie (deduplicated) */
	characters: string[];
	/** Actor IDs (nconst) - references to Actors (top 30 billing) */
	actorIds: string[];
}

export interface Actor {
	/** IMDb name ID (nconst) */
	id: string;
	/** Primary actor name */
	name: string;
	/** Movie IDs (tconst) - references to Movies */
	movieIds: string[];
}

export interface IMDbData {
	/** Movies keyed by movie ID (tconst) */
	movies: Record<string, Movie>;
	/** Actors keyed by actor ID (nconst) */
	actors: Record<string, Actor>;
}

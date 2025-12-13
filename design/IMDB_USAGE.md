# IMDb Integration Usage

This document describes how to use the IMDb integration in your application.

## Overview

The IMDb integration provides access to a curated database of movies and actors that can be used to generate word lists for word search puzzles.

## Data Processing

### 1. Download IMDb Datasets

Download the following files from [IMDb Datasets](https://datasets.imdbws.com/) into the `./imdb` folder:

- `name.basics.tsv.gz`
- `title.basics.tsv.gz`
- `title.principals.tsv.gz`
- `title.ratings.tsv.gz`

### 2. Process the Data

Run the processing script:

```bash
npm run process-imdb
```

This will:

- Parse and filter the IMDb datasets
- Apply quality filters (rating ≥ 4.5, votes ≥ 1000, runtime ≥ 40 min)
- Extract top 30 actors per movie
- Generate `static/data/imdb-data.json.gz` (~2-3 MB)

The process may take several minutes depending on your system.

## Client-Side Usage

### Loading Data

```typescript
import { loadIMDbData } from '$lib/imdb-loader';

// Load the data (only do this once, cache the result)
const imdbData = await loadIMDbData();
```

### Available Functions

#### 1. Random Movie Titles

```typescript
import { getRandomMovies } from '$lib/imdb-loader';

const movieTitles = getRandomMovies(imdbData, 15);
// Returns: ["The Shawshank Redemption", "The Godfather", ...]
```

#### 2. Random Actor Names

```typescript
import { getRandomActors } from '$lib/imdb-loader';

const actorNames = getRandomActors(imdbData, 15);
// Returns: ["Morgan Freeman", "Tom Hanks", ...]
```

#### 3. Movie Cast (Actor Names)

```typescript
import { getRandomMovie, getMovieCast } from '$lib/imdb-loader';

const movie = getRandomMovie(imdbData);
const cast = getMovieCast(imdbData, movie.id);
// Returns: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", ...]
```

#### 4. Movie Characters

```typescript
import { getRandomMovie, getMovieCharacters } from '$lib/imdb-loader';

const movie = getRandomMovie(imdbData);
const characters = getMovieCharacters(imdbData, movie.id);
// Returns: ["Andy Dufresne", "Ellis Boyd Redding", ...]
```

#### 5. Actor Filmography

```typescript
import { getRandomActor, getActorFilmography } from '$lib/imdb-loader';

const actor = getRandomActor(imdbData);
const movies = getActorFilmography(imdbData, actor.id);
// Returns: ["The Shawshank Redemption", "Se7en", "The Dark Knight", ...]
```

## Integration with Word Search

Example integration with the word search service:

```typescript
import { loadIMDbData, getRandomMovies, getRandomActors } from '$lib/imdb-loader';
import type { IMDbData } from '$lib/types/imdb';

// Cache the data
let imdbDataCache: IMDbData | null = null;

async function getIMDbData(): Promise<IMDbData> {
	if (!imdbDataCache) {
		imdbDataCache = await loadIMDbData();
	}
	return imdbDataCache;
}

// Word list generator
async function generateMovieWordList(type: string, count: number): Promise<string[]> {
	const data = await getIMDbData();

	switch (type) {
		case 'movies-random-list':
			return getRandomMovies(data, count);

		case 'actors-random-list':
			return getRandomActors(data, count);

		case 'movie-cast': {
			const movie = getRandomMovie(data);
			return getMovieCast(data, movie.id);
		}

		case 'movie-characters': {
			const movie = getRandomMovie(data);
			return getMovieCharacters(data, movie.id);
		}

		case 'actor-filmography': {
			const actor = getRandomActor(data);
			return getActorFilmography(data, actor.id);
		}

		default:
			throw new Error(`Unknown word list type: ${type}`);
	}
}
```

## Data Structure

### Movie Object

```typescript
interface Movie {
	id: string; // IMDb ID (e.g., "tt0111161")
	title: string; // Movie title
	characters: string[]; // Character names
	actorIds: string[]; // References to actors
}
```

### Actor Object

```typescript
interface Actor {
	id: string; // IMDb ID (e.g., "nm0000209")
	name: string; // Actor name
	movieIds: string[]; // References to movies
}
```

### IMDbData Object

```typescript
interface IMDbData {
	movies: Record<string, Movie>; // Keyed by movie ID
	actors: Record<string, Actor>; // Keyed by actor ID
}
```

## Performance Notes

- **Initial Load**: The first data load will decompress ~2-3 MB and may take 1-2 seconds
- **Memory Usage**: The decompressed data in memory is approximately 10-15 MB
- **Caching**: Cache the loaded data to avoid repeated decompression
- **Browser Support**: Requires `DecompressionStream` API (Chrome 80+, Firefox 103+, Safari 16.4+)

## License and Attribution

IMDb datasets are available for personal and non-commercial use only. See the [IMDb Non-Commercial Licensing](https://www.imdb.com/interfaces/) page for details.

When using this data in your application, consider adding an attribution like:

> Movie and actor data courtesy of IMDb (https://www.imdb.com). Used with permission for personal, non-commercial use.

## Troubleshooting

### "Failed to fetch IMDb data: 404 Not Found"

The data file hasn't been generated yet. Run `npm run process-imdb` first.

### "DecompressionStream is not supported in this browser"

Your browser doesn't support the Compression Streams API. Consider using a polyfill or serving uncompressed JSON for older browsers.

### Processing script fails with file not found

Make sure you've downloaded all four required TSV files into the `./imdb` folder.

### Processing takes too long

The processing script handles several GB of data. On slower systems, it may take 10-15 minutes. This is normal and only needs to be run once.

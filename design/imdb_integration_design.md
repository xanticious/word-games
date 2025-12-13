# IMDb Integration Design Document

## Overview

Integration of IMDb datasets to provide movie and actor-related word lists for the word search game.

## Summary

This design outlines a Node.js script (`scripts/process-imdb-data.ts`) that processes IMDb's public datasets to create a compressed JSON file containing curated movie and actor information. The script filters for high-quality movies (≥4.5 rating, ≥1000 votes, ≥40 minutes, non-adult) and prominent actors (≥3 movie appearances), then creates a bidirectional reference structure enabling five word search list types: random movies, random actors, movie cast, movie characters, and actor filmography.

**Key Features:**

- Streaming processing of multi-GB files
- Quality filtering (rating, votes, runtime)
- Top 30 billing actors per movie
- Character name extraction and deduplication
- Compressed output (~2-3 MB estimated)
- Native browser decompression support
- Comprehensive validation and progress reporting

## Data Sources

IMDb provides public datasets in gzipped TSV format. We'll use three primary datasets:

### 1. title.basics.tsv.gz

- **tconst** (string) - alphanumeric unique identifier of the title
- **titleType** (string) – type/format (e.g. movie, short, tvseries, tvepisode, video, etc)
- **primaryTitle** (string) – the more popular title / the title used by filmmakers on promotional materials
- **originalTitle** (string) - original title, in the original language
- **isAdult** (boolean) - 0: non-adult title; 1: adult title
- **startYear** (YYYY) – release year of a title
- **endYear** (YYYY) – TV Series end year. '\N' for all other title types
- **runtimeMinutes** – primary runtime of the title, in minutes
- **genres** (string array) – includes up to three genres associated with the title

### 2. title.ratings.tsv.gz

- **tconst** (string) - alphanumeric unique identifier of the title
- **averageRating** – weighted average of all the individual user ratings
- **numVotes** - number of votes the title has received

### 3. title.principals.tsv.gz

- **tconst** (string) - alphanumeric unique identifier of the title
- **ordering** (integer) – a number to uniquely identify rows for a given titleId
- **nconst** (string) - alphanumeric unique identifier of the name/person
- **category** (string) - the category of job that person was in
- **job** (string) - the specific job title if applicable, else '\N'
- **characters** (string) - the name of the character played if applicable, else '\N'

### 4. name.basics.tsv.gz

- **nconst** (string) - alphanumeric unique identifier of the name/person
- **primaryName** (string)– name by which the person is most often credited
- **birthYear** – in YYYY format
- **deathYear** – in YYYY format if applicable, else '\N'
- **primaryProfession** (array of strings)– the top-3 professions of the person
- **knownForTitles** (array of tconsts) – titles the person is known for

## Filtering Criteria

### Title Filtering

- **Title Type**: Movies only (exclude TV series, episodes, shorts, videos, etc.)
- **Adult Content**: Exclude adult titles (isAdult = 0)
- **Runtime**: Minimum 40 minutes
- **Year Range**: No restrictions (all years included)
- **Genres**: All genres included
- **Minimum Votes**: 1,000 votes
- **Minimum Rating**: 4.5 average rating

### Name/Actor Filtering

- **Primary Profession**: Must include "actor" or "actress" in primaryProfession array
- **Self Appearances**: No filtering (documentaries included)
- **Minimum Movies**: Must appear in at least 3 qualifying movies
- **Billing Limit**: Top 30 actors per movie (based on ordering field in title.principals)

## Target Use Cases

The processed data will support five word search list types:

1. **Random List of Movies** - Random collection of movie titles
2. **Random List of Actors** - Random collection of actor names
3. **Random Movie Cast** - Actor names from a random movie
4. **Random Movie Characters** - Character names from a random movie
5. **Random Actor Filmography** - Movies featuring a random actor

## Output Data Structure

### TypeScript Interfaces

```typescript
interface Movie {
	id: string; // tconst
	title: string; // primaryTitle
	characters: string[]; // unique character names from the movie (deduplicated)
	actorIds: string[]; // nconst array - references to Actors (top 30 billing)
}

interface Actor {
	id: string; // nconst
	name: string; // primaryName
	movieIds: string[]; // array of tconst - references to Movies
}

interface IMDbData {
	movies: Record<string, Movie>; // keyed by movie id (tconst)
	actors: Record<string, Actor>; // keyed by actor id (nconst)
}
```

### Data Structure Rationale

- **Dictionary/Map structure**: O(1) lookups by ID for efficient queries
- **Bidirectional references**: Movies reference actors, actors reference movies
- **Minimal duplication**: Actor/movie names stored once, referenced by ID
- **Separate character list**: Characters and actors stored independently (not linked)
- **Character deduplication**: Use Set during processing to ensure unique character names
- **Supports all use cases**:
  1. Random movies: `Object.values(data.movies).map(m => m.title)`
  2. Random actors: `Object.values(data.actors).map(a => a.name)`
  3. Movie cast (actors): `data.movies[movieId].actorIds.map(aid => data.actors[aid].name)`
  4. Movie characters: `data.movies[movieId].characters`
  5. Actor filmography: `data.actors[actorId].movieIds.map(mid => data.movies[mid].title)`

## Processing Script

### Location

`./scripts/process-imdb-data.ts`

### Input Files (from ./imdb folder)

- `name.basics.tsv.gz`
- `title.basics.tsv.gz`
- `title.principals.tsv.gz`
- `title.ratings.tsv.gz`

The script will read and decompress .gz files directly using streaming decompression.

### Processing Steps

**Phase 1: Filter Movies**

1. Load and parse `title.ratings.tsv` into a Map<tconst, rating info>
2. Load and parse `title.basics.tsv`
3. For each title, check:
   - `if (isAdult === 1)` → skip
   - `if (titleType !== 'movie')` → skip
   - `if (runtimeMinutes < 40)` → skip
   - `if (rating < 4.5 || votes < 1000)` → skip
   - Otherwise: Add to qualifying movies Set

**Phase 2: Extract Principals** 4. Load and parse `title.principals.tsv` 5. For each qualifying movie:

- Filter principals with category "actor" or "actress"
- Sort by ordering field, take top 30
- Parse characters field (JSON array), collect all character names
- Store actor IDs and deduplicated character names per movie

**Phase 3: Filter Actors** 6. Load and parse `name.basics.tsv` 7. For each person:

- `if (!primaryProfession.includes('actor') && !primaryProfession.includes('actress'))` → skip
- Count appearances in qualifying movies (from Phase 2)
- `if (appearanceCount < 3)` → skip
- Otherwise: Add to qualifying actors with their movie list

**Phase 4: Clean Up & Build Output** 8. Iterate through qualifying movies 9. Remove any actor IDs from movie.actorIds that aren't in qualifying actors Set 10. Build final data structure with bidirectional references 11. Serialize to JSON and compress with gzip

### Output Files (to ./static/data)

- `imdb-data.json.gz` - Single combined file with movies and actors

Format:

- Plain JSON structure
- Pre-compressed with gzip
- Browser fetches .json.gz, decompresses using native Compression Streams API, and deserializes to TypeScript objects

## Implementation Details

### Client-side Decompression

Use the native Compression Streams API (DecompressionStream) to decompress gzip files:

```typescript
async function loadIMDbData(): Promise<IMDbData> {
	const response = await fetch('/data/imdb-data.json.gz');
	const decompressedStream = response.body!.pipeThrough(new DecompressionStream('gzip'));
	const decompressedResponse = new Response(decompressedStream);
	return await decompressedResponse.json();
}
```

### Server-side Compression

Use Node.js built-in `zlib` module to compress the output:

```typescript
import { createGzip } from 'zlib';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const gzip = createGzip();
const output = createWriteStream('./static/data/imdb-data.json.gz');
await pipeline(Readable.from(JSON.stringify(data)), gzip, output);
```

## Script Execution

**Manual execution only** - This will be run once (or very rarely) to generate the processed data file.

```bash
npm run process-imdb
# or
npx tsx scripts/process-imdb-data.ts
```

The generated `imdb-data.json.gz` file will be committed to the repository in `./static/data/`.

## Error Handling & Logging

**Error Strategy**: Continue with warnings

- Skip malformed/unparseable entries
- Log warnings to console with line numbers
- Continue processing remaining data
- Fail only on critical errors (missing required files, unable to write output)

**Progress Reporting**: Detailed progress indicators

- Show current phase (e.g., "Loading ratings...", "Filtering movies...")
- Display row counts periodically (every 100k rows)
- Show phase completion stats (e.g., "Filtered 12,543 movies from 500,000 titles")
- Report final output statistics (total movies, actors, file size)

Example output:

```
[1/4] Loading ratings... 100k... 200k... Done. (11,500,000 ratings loaded)
[2/4] Filtering movies... 100k... 200k... Done. (12,543 qualifying movies)
[3/4] Processing principals... 100k... 200k... Done. (450,231 actor appearances)
[4/4] Building output... Done.

Final Statistics:
- Movies: 12,543
- Actors: 45,231
- Total characters: 89,432
- Output file: ./static/data/imdb-data.json.gz (2.3 MB)
```

## TSV Parsing Strategy

**Custom parsing with streaming**

- Use Node.js `readline` or streams to read files line-by-line
- Parse each line with `line.split('\t')`
- Process incrementally to handle 3-4 GB decompressed files
- Avoid loading entire files into memory

Example streaming approach:

```typescript
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';

async function* readTSV(filePath: string) {
	const fileStream = createReadStream(filePath);
	const gunzip = createGunzip();
	const rl = createInterface({
		input: filePath.endsWith('.gz') ? fileStream.pipe(gunzip) : fileStream,
		crlfDelay: Infinity
	});

	let isFirstLine = true;
	let headers: string[] = [];

	for await (const line of rl) {
		if (isFirstLine) {
			headers = line.split('\t');
			isFirstLine = false;
			continue;
		}

		const values = line.split('\t');
		const record = Object.fromEntries(
			headers.map((h, i) => [h, values[i] === '\\N' ? null : values[i]])
		);
		yield record;
	}
}
```

## Data Validation

After processing, validate the output before writing to disk:

**Minimum Thresholds**

- Movies: Must have at least 1,000 qualifying movies
- Actors: Must have at least 5,000 qualifying actors
- Fail if thresholds not met (indicates processing error)

**Data Integrity Checks**

- No movies with empty `actorIds` arrays (should have at least 1 actor)
- No actors with empty `movieIds` arrays (should have at least 3 movies per filtering rules)
- All movie `title` fields are non-empty strings
- All actor `name` fields are non-empty strings

**Reference Validation**

- All actor IDs in `movie.actorIds` exist in the actors map
- All movie IDs in `actor.movieIds` exist in the movies map
- Report any orphaned references as errors

**Validation Output**

```
Validating output data...
✓ Movies count: 12,543 (threshold: 1,000)
✓ Actors count: 45,231 (threshold: 5,000)
✓ All movies have actors
✓ All actors have minimum movies
✓ All references valid
✓ No empty strings found
Validation passed!
```

## Additional Considerations

### Memory Management

- Streaming input keeps memory usage low during file reading
- Main memory usage comes from storing the final Maps (movies/actors)
- Estimated memory: ~500MB-1GB for final data structures
- If memory becomes an issue, can implement batched processing or garbage collection hints

### Package.json Script

Add to `package.json`:

```json
{
	"scripts": {
		"process-imdb": "tsx scripts/process-imdb-data.ts"
	}
}
```

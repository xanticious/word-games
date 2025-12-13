/**
 * IMDb Data Processing Script
 *
 * Processes IMDb public datasets to create a compressed JSON file with curated
 * movie and actor information for the word search game.
 *
 * Input files (from ./imdb folder):
 * - name.basics.tsv.gz
 * - title.basics.tsv.gz
 * - title.principals.tsv.gz
 * - title.ratings.tsv.gz
 *
 * Output file (to ./static/data):
 * - imdb-data.json.gz
 *
 * Usage: npm run process-imdb
 */

import { createReadStream, createWriteStream, existsSync } from 'fs';
import { createGunzip, createGzip } from 'zlib';
import { createInterface } from 'readline';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { join } from 'path';
import type { Movie, Actor, IMDbData } from '../src/lib/types/imdb.js';

// Configuration
const IMDB_FOLDER = './imdb';
const OUTPUT_FOLDER = './static/data';
const OUTPUT_FILE = 'imdb-data.json.gz';

// Filtering criteria
const MIN_RATING = 4.5;
const MIN_VOTES = 1000;
const MIN_RUNTIME = 40;
const MAX_ACTORS_PER_MOVIE = 30;
const MIN_ACTOR_APPEARANCES = 3;

// Validation thresholds
const MIN_MOVIES_THRESHOLD = 1000;
const MIN_ACTORS_THRESHOLD = 5000;

// Progress reporting interval
const PROGRESS_INTERVAL = 100000;

interface RatingInfo {
	averageRating: number;
	numVotes: number;
}

interface TitleBasic {
	tconst: string;
	titleType: string;
	primaryTitle: string;
	isAdult: string;
	startYear: string;
	runtimeMinutes: string;
}

interface Principal {
	tconst: string;
	ordering: number;
	nconst: string;
	category: string;
	characters: string;
}

interface NameBasic {
	nconst: string;
	primaryName: string;
	primaryProfession: string;
}

/**
 * Streams and parses a TSV file (optionally gzipped)
 */
async function* readTSV(filePath: string): AsyncGenerator<Record<string, string | null>> {
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
		const record: Record<string, string | null> = {};
		for (let i = 0; i < headers.length; i++) {
			record[headers[i]] = values[i] === '\\N' ? null : values[i];
		}
		yield record;
	}
}

/**
 * Phase 1: Load ratings and filter qualifying movies
 */
async function loadRatingsAndFilterMovies(): Promise<{
	qualifyingMovies: Map<string, TitleBasic>;
	ratingsMap: Map<string, RatingInfo>;
}> {
	console.log('[1/4] Loading ratings and filtering movies...');

	// Load ratings
	const ratingsMap = new Map<string, RatingInfo>();
	let ratingsCount = 0;

	for await (const record of readTSV(join(IMDB_FOLDER, 'title.ratings.tsv.gz'))) {
		const { tconst, averageRating, numVotes } = record;
		if (tconst && averageRating && numVotes) {
			ratingsMap.set(tconst, {
				averageRating: parseFloat(averageRating),
				numVotes: parseInt(numVotes, 10)
			});
			ratingsCount++;
			if (ratingsCount % PROGRESS_INTERVAL === 0) {
				process.stdout.write(`\r  Ratings loaded: ${(ratingsCount / 1000).toFixed(0)}k`);
			}
		}
	}
	console.log(`\r  Ratings loaded: ${ratingsCount.toLocaleString()}`);

	// Filter movies
	const qualifyingMovies = new Map<string, TitleBasic>();
	let titlesProcessed = 0;

	for await (const record of readTSV(join(IMDB_FOLDER, 'title.basics.tsv.gz'))) {
		titlesProcessed++;
		if (titlesProcessed % PROGRESS_INTERVAL === 0) {
			process.stdout.write(
				`\r  Titles processed: ${(titlesProcessed / 1000).toFixed(0)}k | Movies found: ${qualifyingMovies.size.toLocaleString()}`
			);
		}

		const { tconst, titleType, primaryTitle, isAdult, runtimeMinutes } = record;

		// Skip if not a movie or is adult content
		if (titleType !== 'movie' || isAdult === '1') continue;

		// Skip if missing required fields
		if (!tconst || !primaryTitle || !runtimeMinutes) continue;

		// Check runtime
		const runtime = parseInt(runtimeMinutes, 10);
		if (isNaN(runtime) || runtime < MIN_RUNTIME) continue;

		// Check rating
		const rating = ratingsMap.get(tconst);
		if (!rating || rating.averageRating < MIN_RATING || rating.numVotes < MIN_VOTES) continue;

		// Qualifying movie
		qualifyingMovies.set(tconst, {
			tconst,
			titleType: titleType || '',
			primaryTitle: primaryTitle || '',
			isAdult: isAdult || '0',
			startYear: record.startYear || '',
			runtimeMinutes: runtimeMinutes || ''
		});
	}

	console.log(
		`\r  Titles processed: ${titlesProcessed.toLocaleString()} | Movies found: ${qualifyingMovies.size.toLocaleString()}`
	);
	return { qualifyingMovies, ratingsMap };
}

/**
 * Phase 2: Extract principals (actors and characters) for qualifying movies
 */
async function extractPrincipals(qualifyingMovies: Map<string, TitleBasic>): Promise<{
	movieActors: Map<string, string[]>;
	movieCharacters: Map<string, Set<string>>;
	actorMovies: Map<string, Set<string>>;
}> {
	console.log('[2/4] Processing principals (actors and characters)...');

	const movieActors = new Map<string, string[]>();
	const movieCharacters = new Map<string, Set<string>>();
	const actorMovies = new Map<string, Set<string>>();

	let principalsProcessed = 0;
	let actorAppearances = 0;

	for await (const record of readTSV(join(IMDB_FOLDER, 'title.principals.tsv.gz'))) {
		principalsProcessed++;
		if (principalsProcessed % PROGRESS_INTERVAL === 0) {
			process.stdout.write(
				`\r  Principals processed: ${(principalsProcessed / 1000).toFixed(0)}k | Actor appearances: ${actorAppearances.toLocaleString()}`
			);
		}

		const { tconst, ordering, nconst, category, characters } = record;

		// Skip if not for a qualifying movie
		if (!tconst || !qualifyingMovies.has(tconst)) continue;

		// Skip if not an actor/actress
		if (category !== 'actor' && category !== 'actress') continue;

		// Skip if missing required fields
		if (!nconst || !ordering) continue;

		const orderingNum = parseInt(ordering, 10);
		if (isNaN(orderingNum)) continue;

		// Track actor appearances per movie
		if (!movieActors.has(tconst)) {
			movieActors.set(tconst, []);
		}
		const actors = movieActors.get(tconst)!;
		actors.push(`${orderingNum}:${nconst}`);

		// Track movies per actor
		if (!actorMovies.has(nconst)) {
			actorMovies.set(nconst, new Set());
		}
		actorMovies.get(nconst)!.add(tconst);

		actorAppearances++;

		// Extract character names
		if (characters) {
			if (!movieCharacters.has(tconst)) {
				movieCharacters.set(tconst, new Set());
			}
			const characterSet = movieCharacters.get(tconst)!;

			try {
				// Characters field is a JSON array like: ["Character Name","Another Name"]
				const charArray = JSON.parse(characters);
				if (Array.isArray(charArray)) {
					for (const char of charArray) {
						if (char && typeof char === 'string') {
							characterSet.add(char.trim());
						}
					}
				}
			} catch (e) {
				// Skip malformed character data
			}
		}
	}

	console.log(
		`\r  Principals processed: ${principalsProcessed.toLocaleString()} | Actor appearances: ${actorAppearances.toLocaleString()}`
	);

	// Sort and limit actors per movie to top 30 by billing order
	for (const [movieId, actors] of movieActors.entries()) {
		actors.sort((a, b) => {
			const [orderA] = a.split(':');
			const [orderB] = b.split(':');
			return parseInt(orderA, 10) - parseInt(orderB, 10);
		});

		const topActors = actors.slice(0, MAX_ACTORS_PER_MOVIE).map((a) => a.split(':')[1]);
		movieActors.set(movieId, topActors);
	}

	return { movieActors, movieCharacters, actorMovies };
}

/**
 * Phase 3: Filter actors based on profession and minimum appearances
 */
async function filterActors(
	actorMovies: Map<string, Set<string>>
): Promise<Map<string, NameBasic>> {
	console.log('[3/4] Filtering actors...');

	const qualifyingActors = new Map<string, NameBasic>();
	let namesProcessed = 0;

	for await (const record of readTSV(join(IMDB_FOLDER, 'name.basics.tsv.gz'))) {
		namesProcessed++;
		if (namesProcessed % PROGRESS_INTERVAL === 0) {
			process.stdout.write(
				`\r  Names processed: ${(namesProcessed / 1000).toFixed(0)}k | Actors found: ${qualifyingActors.size.toLocaleString()}`
			);
		}

		const { nconst, primaryName, primaryProfession } = record;

		// Skip if not an actor/actress
		if (!primaryProfession) continue;
		const professions = primaryProfession.split(',');
		if (!professions.includes('actor') && !professions.includes('actress')) continue;

		// Skip if doesn't appear in qualifying movies
		const movies = actorMovies.get(nconst || '');
		if (!movies || movies.size < MIN_ACTOR_APPEARANCES) continue;

		// Skip if missing required fields
		if (!nconst || !primaryName) continue;

		qualifyingActors.set(nconst, {
			nconst,
			primaryName,
			primaryProfession
		});
	}

	console.log(
		`\r  Names processed: ${namesProcessed.toLocaleString()} | Actors found: ${qualifyingActors.size.toLocaleString()}`
	);
	return qualifyingActors;
}

/**
 * Phase 4: Build final data structure with bidirectional references
 */
function buildOutput(
	qualifyingMovies: Map<string, TitleBasic>,
	movieActors: Map<string, string[]>,
	movieCharacters: Map<string, Set<string>>,
	actorMovies: Map<string, Set<string>>,
	qualifyingActors: Map<string, NameBasic>
): IMDbData {
	console.log('[4/4] Building output data structure...');

	const movies: Record<string, Movie> = {};
	const actors: Record<string, Actor> = {};

	// Build movies
	for (const [movieId, movieInfo] of qualifyingMovies.entries()) {
		const actorIds = movieActors.get(movieId) || [];

		// Filter out actors that didn't make the qualifying cut
		const validActorIds = actorIds.filter((actorId) => qualifyingActors.has(actorId));

		// Skip movies with no qualifying actors
		if (validActorIds.length === 0) continue;

		const characters = Array.from(movieCharacters.get(movieId) || []);

		movies[movieId] = {
			id: movieId,
			title: movieInfo.primaryTitle,
			characters,
			actorIds: validActorIds
		};
	}

	// Build actors
	for (const [actorId, actorInfo] of qualifyingActors.entries()) {
		const movieIds = Array.from(actorMovies.get(actorId) || []);

		// Filter out movies that didn't make the final cut
		const validMovieIds = movieIds.filter((movieId) => movies[movieId]);

		// Skip actors with no qualifying movies (shouldn't happen but defensive)
		if (validMovieIds.length === 0) continue;

		actors[actorId] = {
			id: actorId,
			name: actorInfo.primaryName,
			movieIds: validMovieIds
		};
	}

	console.log(`  Movies: ${Object.keys(movies).length.toLocaleString()}`);
	console.log(`  Actors: ${Object.keys(actors).length.toLocaleString()}`);
	console.log(
		`  Total characters: ${Object.values(movies)
			.reduce((sum, m) => sum + m.characters.length, 0)
			.toLocaleString()}`
	);

	return { movies, actors };
}

/**
 * Validate the output data structure
 */
function validateOutput(data: IMDbData): boolean {
	console.log('\nValidating output data...');

	const movieCount = Object.keys(data.movies).length;
	const actorCount = Object.keys(data.actors).length;

	// Check minimum thresholds
	if (movieCount < MIN_MOVIES_THRESHOLD) {
		console.error(`✗ Movies count too low: ${movieCount} (threshold: ${MIN_MOVIES_THRESHOLD})`);
		return false;
	}
	console.log(
		`✓ Movies count: ${movieCount.toLocaleString()} (threshold: ${MIN_MOVIES_THRESHOLD})`
	);

	if (actorCount < MIN_ACTORS_THRESHOLD) {
		console.error(`✗ Actors count too low: ${actorCount} (threshold: ${MIN_ACTORS_THRESHOLD})`);
		return false;
	}
	console.log(
		`✓ Actors count: ${actorCount.toLocaleString()} (threshold: ${MIN_ACTORS_THRESHOLD})`
	);

	// Check data integrity
	let moviesWithoutActors = 0;
	let actorsWithoutMovies = 0;
	let emptyTitles = 0;
	let emptyNames = 0;
	let invalidActorRefs = 0;
	let invalidMovieRefs = 0;

	for (const movie of Object.values(data.movies)) {
		if (!movie.title || movie.title.trim() === '') emptyTitles++;
		if (movie.actorIds.length === 0) moviesWithoutActors++;

		for (const actorId of movie.actorIds) {
			if (!data.actors[actorId]) invalidActorRefs++;
		}
	}

	for (const actor of Object.values(data.actors)) {
		if (!actor.name || actor.name.trim() === '') emptyNames++;
		if (actor.movieIds.length < MIN_ACTOR_APPEARANCES) actorsWithoutMovies++;

		for (const movieId of actor.movieIds) {
			if (!data.movies[movieId]) invalidMovieRefs++;
		}
	}

	if (moviesWithoutActors > 0) {
		console.error(`✗ Found ${moviesWithoutActors} movies without actors`);
		return false;
	}
	console.log('✓ All movies have actors');

	if (actorsWithoutMovies > 0) {
		console.error(`✗ Found ${actorsWithoutMovies} actors without minimum movies`);
		return false;
	}
	console.log('✓ All actors have minimum movies');

	if (invalidActorRefs > 0) {
		console.error(`✗ Found ${invalidActorRefs} invalid actor references`);
		return false;
	}
	if (invalidMovieRefs > 0) {
		console.error(`✗ Found ${invalidMovieRefs} invalid movie references`);
		return false;
	}
	console.log('✓ All references valid');

	if (emptyTitles > 0 || emptyNames > 0) {
		console.error(`✗ Found empty strings (titles: ${emptyTitles}, names: ${emptyNames})`);
		return false;
	}
	console.log('✓ No empty strings found');

	console.log('Validation passed!\n');
	return true;
}

/**
 * Write compressed output file
 */
async function writeOutput(data: IMDbData, outputPath: string): Promise<number> {
	const json = JSON.stringify(data);
	const jsonSize = Buffer.byteLength(json);

	const gzip = createGzip();
	const output = createWriteStream(outputPath);

	await pipeline(Readable.from(json), gzip, output);

	return jsonSize;
}

/**
 * Main execution
 */
async function main() {
	console.log('IMDb Data Processing Script\n');
	console.log('Configuration:');
	console.log(`  Min Rating: ${MIN_RATING}`);
	console.log(`  Min Votes: ${MIN_VOTES.toLocaleString()}`);
	console.log(`  Min Runtime: ${MIN_RUNTIME} minutes`);
	console.log(`  Max Actors per Movie: ${MAX_ACTORS_PER_MOVIE}`);
	console.log(`  Min Actor Appearances: ${MIN_ACTOR_APPEARANCES}`);
	console.log('');

	// Check input files exist
	const requiredFiles = [
		'title.ratings.tsv.gz',
		'title.basics.tsv.gz',
		'title.principals.tsv.gz',
		'name.basics.tsv.gz'
	];

	for (const file of requiredFiles) {
		const filePath = join(IMDB_FOLDER, file);
		if (!existsSync(filePath)) {
			console.error(`Error: Required file not found: ${filePath}`);
			console.error('\nPlease download IMDb datasets from:');
			console.error('https://datasets.imdbws.com/');
			process.exit(1);
		}
	}

	const startTime = Date.now();

	try {
		// Phase 1: Load ratings and filter movies
		const { qualifyingMovies, ratingsMap } = await loadRatingsAndFilterMovies();

		// Phase 2: Extract principals
		const { movieActors, movieCharacters, actorMovies } = await extractPrincipals(qualifyingMovies);

		// Phase 3: Filter actors
		const qualifyingActors = await filterActors(actorMovies);

		// Phase 4: Build output
		const data = buildOutput(
			qualifyingMovies,
			movieActors,
			movieCharacters,
			actorMovies,
			qualifyingActors
		);

		// Validate
		if (!validateOutput(data)) {
			console.error('Validation failed. Aborting.');
			process.exit(1);
		}

		// Write output
		const outputPath = join(OUTPUT_FOLDER, OUTPUT_FILE);
		console.log(`Writing output to ${outputPath}...`);
		const jsonSize = await writeOutput(data, outputPath);

		// Get compressed file size
		const fs = await import('fs/promises');
		const stats = await fs.stat(outputPath);
		const compressedSize = stats.size;

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

		console.log('\nFinal Statistics:');
		console.log(`  Movies: ${Object.keys(data.movies).length.toLocaleString()}`);
		console.log(`  Actors: ${Object.keys(data.actors).length.toLocaleString()}`);
		console.log(
			`  Total characters: ${Object.values(data.movies)
				.reduce((sum, m) => sum + m.characters.length, 0)
				.toLocaleString()}`
		);
		console.log(`  JSON size: ${(jsonSize / 1024 / 1024).toFixed(2)} MB`);
		console.log(`  Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
		console.log(`  Compression ratio: ${((1 - compressedSize / jsonSize) * 100).toFixed(1)}%`);
		console.log(`  Processing time: ${elapsed}s`);
		console.log('\nDone!');
	} catch (error) {
		console.error('\nError:', error);
		process.exit(1);
	}
}

// Run the main function
main();

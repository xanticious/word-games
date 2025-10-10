import { readFileSync } from 'fs';
import { join } from 'path';

const dataPath = join(process.cwd(), 'src', 'lib', 'data');

console.log("Testing Webster's dictionary definitions...");

try {
	const definitions = JSON.parse(readFileSync(join(dataPath, 'definitions.json'), 'utf-8'));

	console.log(`Total definitions loaded: ${definitions.length}`);

	// Test some common words
	const testWords = ['cat', 'dog', 'house', 'run', 'love', 'water', 'fire'];

	testWords.forEach((testWord) => {
		const entry = definitions.find((def: any) => def.word === testWord);
		if (entry) {
			console.log(`\n"${testWord}":${entry.partOfSpeech ? ` (${entry.partOfSpeech})` : ''}`);
			entry.definitions.forEach((def: string, index: number) => {
				const shortDef = def.length > 100 ? def.substring(0, 100) + '...' : def;
				console.log(`  ${index + 1}. ${shortDef}`);
			});
		} else {
			console.log(`\n"${testWord}": No definition found`);
		}
	});

	// Show some statistics
	const wordsWithMultipleDefinitions = definitions.filter(
		(entry: any) => entry.definitions.length > 1
	);
	const wordsWithPartOfSpeech = definitions.filter((entry: any) => entry.partOfSpeech);

	console.log(`\nStatistics:`);
	console.log(`- Words with multiple definitions: ${wordsWithMultipleDefinitions.length}`);
	console.log(`- Words with part of speech: ${wordsWithPartOfSpeech.length}`);
	console.log(
		`- Average definitions per word: ${(definitions.reduce((sum: number, entry: any) => sum + entry.definitions.length, 0) / definitions.length).toFixed(2)}`
	);
} catch (error) {
	console.error('Failed to test definitions:', error);
}

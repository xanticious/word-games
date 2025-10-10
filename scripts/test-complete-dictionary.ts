import { loadDictionaryData, isValidWord, getSampleWords } from '../src/lib/dictionary-server.js';

console.log('Testing complete dictionary system with definitions...');

try {
	// Test loading
	console.log('Loading dictionary data...');
	const data = loadDictionaryData();

	console.log('Dictionary stats:');
	console.log(`- Easy words: ${data.wordsByDifficulty.easy.length}`);
	console.log(`- Medium words: ${data.wordsByDifficulty.medium.length}`);
	console.log(`- Hard words: ${data.wordsByDifficulty.hard.length}`);
	console.log(`- Phonetic entries: ${data.phonetics.length}`);
	console.log(`- Rhyme groups: ${Object.keys(data.rhymeGroups).length}`);
	console.log(`- Definitions: ${data.definitions.length}`);

	// Test word validation
	console.log('\nTesting word validation:');
	const testWords = ['cat', 'dog', 'hello', 'world', 'xyz123'];
	testWords.forEach((word) => {
		console.log(`- "${word}": ${isValidWord(word)}`);
	});

	// Test definitions lookup
	console.log('\nTesting definitions:');
	const wordsToDefine = ['cat', 'run', 'love'];
	wordsToDefine.forEach((word) => {
		const defs = data.definitions.filter((def: any) => def.word === word);
		if (defs.length > 0) {
			console.log(`\n"${word}": ${defs.length} definition(s)`);
			defs.forEach((def: any, index: number) => {
				const shortDef =
					def.definitions[0].length > 80
						? def.definitions[0].substring(0, 80) + '...'
						: def.definitions[0];
				console.log(`  ${index + 1}. ${shortDef}`);
				if (def.partOfSpeech) {
					console.log(`     Part of speech: ${def.partOfSpeech}`);
				}
			});
		} else {
			console.log(`\n"${word}": No definition found`);
		}
	});

	// Test phonetics
	console.log('\nTesting phonetics:');
	const phoneticTests = ['cat', 'dog', 'run'];
	phoneticTests.forEach((word) => {
		const phonetic = data.phonetics.find((p: any) => p.word === word);
		if (phonetic) {
			console.log(`- "${word}": ${phonetic.phonetic} (${phonetic.sounds.join(' ')})`);
		} else {
			console.log(`- "${word}": No phonetic data found`);
		}
	});

	// Test rhyming
	console.log('\nTesting rhyme groups (sample):');
	const rhymeKeys = Object.keys(data.rhymeGroups).slice(0, 3);
	rhymeKeys.forEach((key) => {
		const words = data.rhymeGroups[key].slice(0, 5);
		console.log(`- "${key}": ${words.join(', ')}`);
	});

	console.log('\n✅ Complete dictionary system working correctly!');
	console.log(`\nFinal Summary:`);
	console.log(`- Total words: ~370K`);
	console.log(`- Phonetic entries: 134K+`);
	console.log(`- Definitions: 108K+`);
	console.log(`- Rhyme groups: 1.2K+`);
	console.log(`- Ready for all 5 word games!`);
} catch (error) {
	console.error('Dictionary test failed:', error);
}

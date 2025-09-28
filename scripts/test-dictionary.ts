import { loadDictionaryData, isValidWord, getSampleWords } from '../src/lib/dictionary-server.js';

console.log('Testing dictionary system...');

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

	// Test word validation
	console.log('\nTesting word validation:');
	const testWords = ['cat', 'dog', 'hello', 'world', 'xyz123'];
	testWords.forEach((word) => {
		console.log(`- "${word}": ${isValidWord(word)}`);
	});

	// Test sample words
	console.log('\nSample words:');
	const samples = getSampleWords(5);
	console.log(samples);

	// Test rhyme groups
	console.log('\nSample rhyme groups:');
	const rhymeKeys = Object.keys(data.rhymeGroups).slice(0, 3);
	rhymeKeys.forEach((key) => {
		console.log(`- "${key}": ${data.rhymeGroups[key].slice(0, 5).join(', ')}`);
	});

	console.log('\nDictionary system working correctly!');
} catch (error) {
	console.error('Dictionary test failed:', error);
}

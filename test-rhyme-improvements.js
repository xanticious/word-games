/**
 * Quick test to verify the internal rhyme and detailed phoneme tracking improvements
 */

import { detectInternalRhymes } from './src/lib/games/rhyme/rhymeEngine';
import {
	compareConsonantsDetailed,
	compareVowelsDetailed
} from './src/lib/games/rhyme/phoneticAnalyzer';
import { loadPhoneticData } from './src/lib/dictionary';

console.log('Loading phonetic data...\n');
const phoneticEntries = await loadPhoneticData();

console.log('=== Testing Internal Rhyme Detection ===\n');

// Test 1: "by" should NOT rhyme with "it", "is", "with" (different endings)
console.log('Test 1: Should NOT find rhymes between short words with different sounds');
const line1a = 'by the way';
const line1b = 'it is with';
const rhymes1 = detectInternalRhymes(line1a, line1b, phoneticEntries);
console.log(`Line 1: "${line1a}"`);
console.log(`Line 2: "${line1b}"`);
console.log('Internal rhymes found:', rhymes1);
console.log('Expected: [] (empty array)\n');

// Test 2: "prepared", "yellow", "gold" should NOT rhyme
console.log('Test 2: Should NOT find rhymes between unrelated words');
const line2a = 'I was prepared yesterday';
const line2b = 'with yellow and gold';
const rhymes2 = detectInternalRhymes(line2a, line2b, phoneticEntries);
console.log(`Line 1: "${line2a}"`);
console.log(`Line 2: "${line2b}"`);
console.log('Internal rhymes found:', rhymes2);
console.log('Expected: [] (empty array)\n');

// Test 3: "cat", "bat", "mat" SHOULD rhyme (good rhymes)
console.log('Test 3: Should find rhymes between similar words');
const line3a = 'the cat and bat';
const line3b = 'sat on a mat';
const rhymes3 = detectInternalRhymes(line3a, line3b, phoneticEntries);
console.log(`Line 1: "${line3a}"`);
console.log(`Line 2: "${line3b}"`);
console.log('Internal rhymes found:', rhymes3);
console.log('Expected: Should find rhyme group with cat, bat, mat, sat\n');

console.log('\n=== Testing Detailed Alliteration Tracking ===\n');

// Test 4: "red bed wedded" - detailed consonant tracking
console.log('Test 4: Alliteration detail for "red bed wedded"');
const line4a = 'red bed';
const line4b = 'wedded';
const consonants = compareConsonantsDetailed(line4a, line4b, phoneticEntries);
console.log(`Line 1: "${line4a}"`);
console.log(`Line 2: "${line4b}"`);
console.log('Alliteration matches:\n');
for (const match of consonants) {
	console.log(
		`  ${match.count} occurrence${match.count !== 1 ? 's' : ''} of "${match.consonant}" = +${match.count}`
	);
	for (const detail of match.details) {
		console.log(`    ${detail.word} (${detail.occurrences})`);
	}
}

console.log('\n=== Testing Detailed Consonance Tracking ===\n');

// Test 5: "red bed wedded" - detailed vowel tracking
console.log('Test 5: Consonance detail for "red bed wedded"');
const vowels = compareVowelsDetailed(line4a, line4b, phoneticEntries);
console.log(`Line 1: "${line4a}"`);
console.log(`Line 2: "${line4b}"`);
console.log('Consonance matches:\n');
for (const match of vowels) {
	console.log(
		`  ${match.count} occurrence${match.count !== 1 ? 's' : ''} of "${match.vowel}" = +${match.count}`
	);
	for (const detail of match.details) {
		console.log(`    ${detail.word} (${detail.occurrences})`);
	}
}

console.log('\n✅ Test complete! Check the results above.\n');

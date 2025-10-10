/**
 * Dictionary Processing Script
 *
 * This script processes various dictionary files and creates optimized JSON files
 * for use in the word games application.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Types for our processed data
export interface WordEntry {
	word: string;
	length: number;
	difficulty: 'easy' | 'medium' | 'hard';
	category?: string;
}

export interface PhoneticEntry {
	word: string;
	phonetic: string;
	sounds: string[];
}

export interface DefinitionEntry {
	word: string;
	definitions: string[];
	partOfSpeech?: string;
	pronunciation?: string;
}
export interface ProcessedDictionaries {
	words: WordEntry[];
	phonetics: PhoneticEntry[];
	definitions: DefinitionEntry[];
}

class DictionaryProcessor {
	private dictionariesPath: string;
	private outputPath: string;

	constructor() {
		this.dictionariesPath = join(process.cwd(), 'dictionaries');
		this.outputPath = join(process.cwd(), 'src', 'lib', 'data');
	}

	/**
	 * Process the words_alpha.txt file to create basic word list
	 */
	processBasicWordList(): WordEntry[] {
		const filePath = join(this.dictionariesPath, 'words_alpha.txt');

		if (!existsSync(filePath)) {
			throw new Error('words_alpha.txt not found');
		}

		const content = readFileSync(filePath, 'utf-8');
		const words = content.split('\n').filter((word) => word.trim().length > 0);

		return words.map((word) => ({
			word: word.toLowerCase().trim(),
			length: word.length,
			difficulty: this.calculateDifficulty(word)
		}));
	}

	/**
	 * Process CMU dictionary for phonetic data
	 */
	processPhoneticData(): PhoneticEntry[] {
		const filePath = join(this.dictionariesPath, 'cmudict-0.7b');

		if (!existsSync(filePath)) {
			throw new Error('cmudict-0.7b not found');
		}

		const content = readFileSync(filePath, 'utf-8');
		const lines = content.split('\n');
		const phoneticEntries: PhoneticEntry[] = [];

		console.log(`Total lines in CMU dict: ${lines.length}`);
		let processedCount = 0;
		let skippedCount = 0;

		for (const line of lines) {
			// Skip comments and empty lines
			if (line.startsWith(';;;') || line.trim().length === 0) {
				skippedCount++;
				continue;
			}

			// Parse line format: WORD  P H O N E T I C  S O U N D S
			// Split on multiple spaces to separate word from phonetic
			const parts = line.split(/\s{2,}/);
			if (parts.length >= 2) {
				const wordPart = parts[0].trim();
				const phoneticPart = parts.slice(1).join(' ').trim();

				// Handle word variants like WORD(1), WORD(2) and clean word
				let word = wordPart.replace(/\([0-9]+\)$/, '').toLowerCase();

				// Remove special characters but keep letters and common punctuation
				word = word.replace(/[^a-z'-]/g, '');

				// Skip words that are too short or contain only punctuation
				if (word.length < 2 || !word.match(/[a-z]/)) {
					continue;
				}

				const sounds = phoneticPart.trim().split(/\s+/);

				phoneticEntries.push({
					word,
					phonetic: phoneticPart.trim(),
					sounds
				});
				processedCount++;

				if (processedCount <= 5) {
					console.log(`Processed: ${word} -> ${phoneticPart.trim()}`);
				}
			} else {
				if (skippedCount <= 5) {
					console.log(`Skipped line (no match): ${line.substring(0, 50)}...`);
				}
			}
		}

		console.log(`Processed ${processedCount} phonetic entries, skipped ${skippedCount} lines`);
		return phoneticEntries;
	}

	/**
	 * Calculate word difficulty based on length and common patterns
	 */
	private calculateDifficulty(word: string): 'easy' | 'medium' | 'hard' {
		const length = word.length;

		// Basic difficulty based on length
		if (length <= 4) return 'easy';
		if (length <= 7) return 'medium';
		return 'hard';
	}

	/**
	 * Process Webster's English Dictionary for definitions
	 */
	processWebsterDictionary(): DefinitionEntry[] {
		const filePath = join(this.dictionariesPath, 'WebstersEnglishDictionary.txt');

		if (!existsSync(filePath)) {
			console.warn('WebstersEnglishDictionary.txt not found, skipping definitions');
			return [];
		}

		const content = readFileSync(filePath, 'utf-8');
		const lines = content.split('\n');
		const definitions: DefinitionEntry[] = [];

		// Skip the first 27 lines (introduction)
		let currentIndex = 27;

		while (currentIndex < lines.length) {
			const entry = this.parseWebsterEntry(lines, currentIndex);
			if (entry.entry) {
				definitions.push(entry.entry);
			}
			currentIndex = entry.nextIndex;
		}

		console.log(`Processed ${definitions.length} definitions from Webster's dictionary`);
		return definitions;
	}

	/**
	 * Parse a single Webster's dictionary entry
	 */
	private parseWebsterEntry(
		lines: string[],
		startIndex: number
	): {
		entry: DefinitionEntry | null;
		nextIndex: number;
	} {
		let currentIndex = startIndex;

		// Find the next word entry (line in all caps)
		while (currentIndex < lines.length) {
			const line = lines[currentIndex].trim();

			// Check if this is a word entry (all caps, letters only)
			if (line.length > 0 && line === line.toUpperCase() && /^[A-Z\s'-]+$/.test(line)) {
				break;
			}
			currentIndex++;
		}

		if (currentIndex >= lines.length) {
			return { entry: null, nextIndex: lines.length };
		}

		const word = lines[currentIndex].trim().toLowerCase();
		currentIndex++;

		// Parse pronunciation and part of speech line (optional)
		let pronunciation = '';
		let partOfSpeech = '';

		if (currentIndex < lines.length) {
			const nextLine = lines[currentIndex].trim();
			if (nextLine.length > 0 && !nextLine.startsWith('Defn:') && !/^\d+\./.test(nextLine)) {
				// This might be pronunciation/part of speech
				const match = nextLine.match(/([^,]+),\s*([^.]+)\./);
				if (match) {
					pronunciation = match[1].trim();
					partOfSpeech = match[2].trim();
				}
				currentIndex++;
			}
		}

		// Skip blank lines
		while (currentIndex < lines.length && lines[currentIndex].trim() === '') {
			currentIndex++;
		}

		// Collect definitions
		const definitionTexts: string[] = [];

		while (currentIndex < lines.length) {
			const line = lines[currentIndex].trim();

			// Stop if we hit the next word entry
			if (line.length > 0 && line === line.toUpperCase() && /^[A-Z\s'-]+$/.test(line)) {
				break;
			}

			// Check if this starts a definition or numbered meaning
			if (line.startsWith('Defn:') || /^\d+\./.test(line)) {
				const definition = this.parseDefinitionParagraph(lines, currentIndex);
				if (definition.text.trim()) {
					definitionTexts.push(definition.text.trim());
				}
				currentIndex = definition.nextIndex;
			} else {
				currentIndex++;
			}
		}

		if (definitionTexts.length === 0) {
			return { entry: null, nextIndex: currentIndex };
		}

		return {
			entry: {
				word,
				definitions: definitionTexts,
				pronunciation: pronunciation || undefined,
				partOfSpeech: partOfSpeech || undefined
			},
			nextIndex: currentIndex
		};
	}

	/**
	 * Parse a definition paragraph (starting with "Defn:" or a number)
	 */
	private parseDefinitionParagraph(
		lines: string[],
		startIndex: number
	): {
		text: string;
		nextIndex: number;
	} {
		let currentIndex = startIndex;
		const definitionLines: string[] = [];

		if (currentIndex < lines.length) {
			let firstLine = lines[currentIndex].trim();

			// Remove "Defn:" prefix or number prefix
			if (firstLine.startsWith('Defn:')) {
				firstLine = firstLine.substring(5).trim();
			} else if (/^\d+\./.test(firstLine)) {
				firstLine = firstLine.replace(/^\d+\.\s*/, '').trim();
			}

			if (firstLine) {
				definitionLines.push(firstLine);
			}
			currentIndex++;
		}

		// Continue reading until we hit a blank line or next entry
		while (currentIndex < lines.length) {
			const line = lines[currentIndex].trim();

			// Stop at blank line
			if (line === '') {
				currentIndex++;
				break;
			}

			// Stop at next definition or word entry
			if (
				line.startsWith('Defn:') ||
				/^\d+\./.test(line) ||
				(line === line.toUpperCase() && /^[A-Z\s'-]+$/.test(line))
			) {
				break;
			}

			definitionLines.push(line);
			currentIndex++;
		}

		// Clean up the definition text
		let text = definitionLines.join(' ').trim();

		// Remove common formatting artifacts
		text = text.replace(/\s+/g, ' '); // Normalize whitespace
		text = text.replace(/\[Obs\.\]/g, '(Obsolete)'); // Replace [Obs.] with (Obsolete)
		text = text.replace(/\[.*?\]/g, ''); // Remove other bracketed content
		text = text.trim();

		return { text, nextIndex: currentIndex };
	}

	/**
	 * Create rhyming groups from phonetic data
	 */
	createRhymeGroups(phoneticEntries: PhoneticEntry[]): Map<string, string[]> {
		const rhymeGroups = new Map<string, string[]>();

		for (const entry of phoneticEntries) {
			// Get the last 2-3 sounds for rhyming
			const sounds = entry.sounds;
			if (sounds.length >= 2) {
				const rhymeKey = sounds.slice(-2).join(' ');

				if (!rhymeGroups.has(rhymeKey)) {
					rhymeGroups.set(rhymeKey, []);
				}

				rhymeGroups.get(rhymeKey)!.push(entry.word);
			}
		}

		// Filter groups with at least 3 words for better game experience
		const filteredGroups = new Map<string, string[]>();
		for (const [key, words] of rhymeGroups) {
			if (words.length >= 3) {
				filteredGroups.set(key, [...new Set(words)]); // Remove duplicates
			}
		}

		return filteredGroups;
	}

	/**
	 * Process all dictionaries and create JSON files
	 */
	async processAll(): Promise<void> {
		console.log('Starting dictionary processing...');

		try {
			// Process basic word list
			console.log('Processing basic word list...');
			const words = this.processBasicWordList();
			console.log(`Processed ${words.length} words`);

			// Process phonetic data
			console.log('Processing phonetic data...');
			const phonetics = this.processPhoneticData();
			console.log(`Processed ${phonetics.length} phonetic entries`);

			// Process Webster's dictionary for definitions
			console.log("Processing Webster's dictionary...");
			const definitions = this.processWebsterDictionary();
			console.log(`Processed ${definitions.length} definitions`);

			// Create rhyme groups
			console.log('Creating rhyme groups...');
			const rhymeGroups = this.createRhymeGroups(phonetics);
			console.log(`Created ${rhymeGroups.size} rhyme groups`);

			// Ensure output directory exists
			const fs = await import('fs/promises');
			await fs.mkdir(this.outputPath, { recursive: true });

			// Write processed data to JSON files
			console.log('Writing output files...');

			// Word list by difficulty and length
			const wordsByDifficulty = {
				easy: words.filter((w) => w.difficulty === 'easy'),
				medium: words.filter((w) => w.difficulty === 'medium'),
				hard: words.filter((w) => w.difficulty === 'hard')
			};

			writeFileSync(
				join(this.outputPath, 'words-by-difficulty.json'),
				JSON.stringify(wordsByDifficulty, null, 2)
			);

			// Words by length for different games
			const wordsByLength: Record<number, string[]> = {};
			for (const wordEntry of words) {
				if (!wordsByLength[wordEntry.length]) {
					wordsByLength[wordEntry.length] = [];
				}
				wordsByLength[wordEntry.length].push(wordEntry.word);
			}

			writeFileSync(
				join(this.outputPath, 'words-by-length.json'),
				JSON.stringify(wordsByLength, null, 2)
			);

			// Phonetic data
			writeFileSync(join(this.outputPath, 'phonetics.json'), JSON.stringify(phonetics, null, 2));

			// Rhyme groups
			const rhymeGroupsObj = Object.fromEntries(rhymeGroups);
			writeFileSync(
				join(this.outputPath, 'rhyme-groups.json'),
				JSON.stringify(rhymeGroupsObj, null, 2)
			);

			// Definitions
			writeFileSync(
				join(this.outputPath, 'definitions.json'),
				JSON.stringify(definitions, null, 2)
			);

			console.log('Dictionary processing completed successfully!');
			console.log(`Output files created in: ${this.outputPath}`);
		} catch (error) {
			console.error('Error processing dictionaries:', error);
			throw error;
		}
	}
}

// CLI execution
if (import.meta.url.includes(process.argv[1]) || process.argv[1].includes('process-dictionaries')) {
	console.log('Starting CLI execution...');
	const processor = new DictionaryProcessor();
	processor.processAll().catch((error) => {
		console.error('Error during processing:', error);
		process.exit(1);
	});
}

export default DictionaryProcessor;

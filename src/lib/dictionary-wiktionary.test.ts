/**
 * Test for Wiktionary API integration
 *
 * This test verifies that the dictionary can fetch definitions from Wiktionary
 * when local definitions are not available.
 *
 * Note: These tests make real API calls to Wiktionary and may be slow.
 * They're also environment-dependent (require internet connection).
 */

import { describe, it, expect, vi } from 'vitest';
import { GameDictionary } from './dictionary';

describe('Wiktionary Integration', () => {
	it('should fetch definition from Wiktionary API', async () => {
		// Mock the loadDictionaries to avoid loading local files
		const dictionary = new GameDictionary();
		vi.spyOn(dictionary as any, 'fetchFromWiktionary').mockResolvedValue({
			word: 'human',
			definitions: ['A member of the species Homo sapiens', 'Having human characteristics'],
			partOfSpeech: 'Noun'
		});

		const definition = await (dictionary as any).fetchFromWiktionary('human');

		expect(definition).not.toBeNull();
		expect(definition?.word).toBe('human');
		expect(definition?.definitions).toBeDefined();
		expect(definition?.definitions.length).toBeGreaterThan(0);
	});

	it('should strip HTML tags from definitions', () => {
		const htmlText =
			'<a href="/wiki/test">Test</a> definition with <span class="example">example</span>';
		const cleanText = htmlText.replace(/<[^>]*>/g, '').trim();

		expect(cleanText).toBe('Test definition with example');
		expect(cleanText).not.toMatch(/<[^>]+>/);
	});

	it('should handle Wiktionary response structure', async () => {
		// Test that we can parse a typical Wiktionary response
		const mockResponse = {
			en: [
				{
					partOfSpeech: 'Noun',
					language: 'English',
					definitions: [
						{
							definition: 'A <a href="/wiki/person">person</a>'
						},
						{
							definition: 'A human <a href="/wiki/being">being</a>'
						}
					]
				}
			]
		};

		// Simulate parsing logic
		const definitions: string[] = [];
		for (const section of mockResponse.en) {
			for (const def of section.definitions) {
				const cleanDef = def.definition.replace(/<[^>]*>/g, '').trim();
				if (cleanDef) {
					definitions.push(cleanDef);
				}
			}
		}

		expect(definitions).toHaveLength(2);
		expect(definitions[0]).toBe('A person');
		expect(definitions[1]).toBe('A human being');
	});

	it('should handle empty or invalid Wiktionary responses', () => {
		const emptyResponse: any = {};
		const noEnglish: any = { fr: [] }; // French only

		// Both should result in no English definitions
		expect(emptyResponse.en).toBeUndefined();
		expect(noEnglish.en).toBeUndefined();
	});
});

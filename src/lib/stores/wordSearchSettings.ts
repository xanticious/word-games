/**
 * Store for Word Search game configuration settings
 * Persists user preferences to localStorage
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { WordSearchSettings, Direction } from '$lib/games/wordsearch/types.js';

const STORAGE_KEY = 'word-search-settings';

const defaultSettings: WordSearchSettings = {
	gridSize: 'medium',
	density: 'normal',
	wordList: 'wikipedia-random',
	allowedDirections: {
		right: true,
		down: true,
		left: false,
		up: false,
		ne: false,
		se: false,
		sw: false,
		nw: false
	}
};

function createSettingsStore() {
	// Load from localStorage
	const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const initial = stored ? JSON.parse(stored) : defaultSettings;

	const { subscribe, set, update } = writable<WordSearchSettings>(initial);

	return {
		subscribe,
		set: (value: WordSearchSettings) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update: (updater: (value: WordSearchSettings) => WordSearchSettings) => {
			update((value) => {
				const updated = updater(value);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultSettings);
		}
	};
}

export const wordSearchSettings = createSettingsStore();

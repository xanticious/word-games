/**
 * Store for Guess the Word game configuration settings
 * Persists user preferences to localStorage
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface GuessTheWordSettings {
	targetWords: 'common' | 'all';
	wordLength: number;
	hardMode: boolean;
	rescueMode: boolean;
	easyMode: boolean;
}

const STORAGE_KEY = 'guess-the-word-settings';
const RESCUE_MODE_STORAGE_KEY = 'guess-the-word-previous-target';

const defaultSettings: GuessTheWordSettings = {
	targetWords: 'common',
	wordLength: 5,
	hardMode: false,
	rescueMode: false,
	easyMode: false
};

function createSettingsStore() {
	// Load from localStorage
	const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const initial = stored ? JSON.parse(stored) : defaultSettings;

	const { subscribe, set, update } = writable<GuessTheWordSettings>(initial);

	return {
		subscribe,
		set: (value: GuessTheWordSettings) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update: (updater: (value: GuessTheWordSettings) => GuessTheWordSettings) => {
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

export const guessTheWordSettings = createSettingsStore();

/**
 * Store and retrieve the previous target word for Rescue Mode
 * Storage is per word length to avoid confusion
 */
export const rescueMode = {
	getPreviousTarget(wordLength: number): string | null {
		if (!browser) return null;
		const key = `${RESCUE_MODE_STORAGE_KEY}-${wordLength}`;
		return localStorage.getItem(key);
	},
	setPreviousTarget(word: string, wordLength: number): void {
		if (!browser) return;
		const key = `${RESCUE_MODE_STORAGE_KEY}-${wordLength}`;
		localStorage.setItem(key, word);
	},
	clear(wordLength?: number): void {
		if (!browser) return;
		if (wordLength !== undefined) {
			// Clear specific word length
			const key = `${RESCUE_MODE_STORAGE_KEY}-${wordLength}`;
			localStorage.removeItem(key);
		} else {
			// Clear all word lengths (3-7)
			for (let length = 3; length <= 7; length++) {
				const key = `${RESCUE_MODE_STORAGE_KEY}-${length}`;
				localStorage.removeItem(key);
			}
		}
	}
};

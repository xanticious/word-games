import { writable } from 'svelte/store';
import type { UserSettings } from '$lib/types';

// Default settings
const defaultSettings: UserSettings = {
	theme: 'light',
	textSize: 'medium',
	defaultDifficulty: 'medium',
	favoriteGames: [],
	recentGames: [],
	gameSpecificSettings: {}
};

// Load settings from localStorage
function loadSettings(): UserSettings {
	if (typeof window === 'undefined') return defaultSettings;

	try {
		const stored = localStorage.getItem('word-games-settings');
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaultSettings, ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}

	return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings: UserSettings) {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem('word-games-settings', JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
}

// Create the writable store
export const settings = writable<UserSettings>(loadSettings());

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
	settings.subscribe(saveSettings);
}

// Helper functions for common operations
export const settingsActions = {
	// Theme management
	setTheme(theme: UserSettings['theme']) {
		settings.update((s) => ({ ...s, theme }));
	},

	// Text size management
	setTextSize(textSize: UserSettings['textSize']) {
		settings.update((s) => ({ ...s, textSize }));
	},

	// Difficulty management
	setDefaultDifficulty(defaultDifficulty: UserSettings['defaultDifficulty']) {
		settings.update((s) => ({ ...s, defaultDifficulty }));
	},

	// Favorite games management
	addFavoriteGame(gameId: string) {
		settings.update((s) => ({
			...s,
			favoriteGames: s.favoriteGames.includes(gameId)
				? s.favoriteGames
				: [...s.favoriteGames, gameId]
		}));
	},

	removeFavoriteGame(gameId: string) {
		settings.update((s) => ({
			...s,
			favoriteGames: s.favoriteGames.filter((id) => id !== gameId)
		}));
	},

	toggleFavoriteGame(gameId: string) {
		settings.update((s) => ({
			...s,
			favoriteGames: s.favoriteGames.includes(gameId)
				? s.favoriteGames.filter((id) => id !== gameId)
				: [...s.favoriteGames, gameId]
		}));
	},

	// Recent games management
	addRecentGame(gameId: string) {
		settings.update((s) => {
			const filtered = s.recentGames.filter((g) => g.gameId !== gameId);
			const updated = [{ gameId, timestamp: Date.now() }, ...filtered];
			return {
				...s,
				recentGames: updated.slice(0, 10) // Keep only last 10
			};
		});
	},

	clearRecentGames() {
		settings.update((s) => ({ ...s, recentGames: [] }));
	},

	// Game-specific settings
	setGameSetting(gameId: string, key: string, value: any) {
		settings.update((s) => ({
			...s,
			gameSpecificSettings: {
				...s.gameSpecificSettings,
				[gameId]: {
					...s.gameSpecificSettings[gameId],
					[key]: value
				}
			}
		}));
	},

	getGameSetting(gameId: string, key: string, defaultValue: any = null) {
		return new Promise<any>((resolve) => {
			settings.subscribe((s) => {
				const gameSettings = s.gameSpecificSettings[gameId];
				resolve(gameSettings?.[key] ?? defaultValue);
			})();
		});
	},

	// Reset all settings
	reset() {
		settings.set(defaultSettings);
	}
};

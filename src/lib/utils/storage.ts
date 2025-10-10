/**
 * Storage utilities for localStorage operations
 */

// Generic localStorage wrapper with error handling
export const storage = {
	/**
	 * Get item from localStorage with JSON parsing
	 */
	get<T>(key: string, defaultValue: T): T {
		if (typeof window === 'undefined') return defaultValue;

		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue;
		} catch (error) {
			console.warn(`Failed to get item from localStorage: ${key}`, error);
			return defaultValue;
		}
	},

	/**
	 * Set item in localStorage with JSON stringification
	 */
	set<T>(key: string, value: T): boolean {
		if (typeof window === 'undefined') return false;

		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (error) {
			console.warn(`Failed to set item in localStorage: ${key}`, error);
			return false;
		}
	},

	/**
	 * Remove item from localStorage
	 */
	remove(key: string): boolean {
		if (typeof window === 'undefined') return false;

		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.warn(`Failed to remove item from localStorage: ${key}`, error);
			return false;
		}
	},

	/**
	 * Clear all localStorage
	 */
	clear(): boolean {
		if (typeof window === 'undefined') return false;

		try {
			localStorage.clear();
			return true;
		} catch (error) {
			console.warn('Failed to clear localStorage', error);
			return false;
		}
	},

	/**
	 * Check if key exists in localStorage
	 */
	has(key: string): boolean {
		if (typeof window === 'undefined') return false;

		try {
			return localStorage.getItem(key) !== null;
		} catch (error) {
			console.warn(`Failed to check item in localStorage: ${key}`, error);
			return false;
		}
	},

	/**
	 * Get all keys from localStorage
	 */
	keys(): string[] {
		if (typeof window === 'undefined') return [];

		try {
			return Object.keys(localStorage);
		} catch (error) {
			console.warn('Failed to get localStorage keys', error);
			return [];
		}
	}
};

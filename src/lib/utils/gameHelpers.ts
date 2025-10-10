import type { GameResult, GameState } from '$lib/types';

/**
 * Common game helper functions
 */

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Pick random elements from an array
 */
export function randomChoice<T>(array: T[], count: number = 1): T[] {
	if (count >= array.length) return shuffle(array);

	const shuffled = shuffle(array);
	return shuffled.slice(0, count);
}

/**
 * Format time duration in seconds to human readable format
 */
export function formatTime(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	} else {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
}

/**
 * Format score with thousands separator
 */
export function formatScore(score: number): string {
	return new Intl.NumberFormat('en-US').format(score);
}

/**
 * Calculate score based on time and difficulty
 */
export function calculateScore(
	baseScore: number,
	timeElapsed: number,
	difficulty: 'easy' | 'medium' | 'hard',
	maxTime: number = 300
): number {
	// Difficulty multipliers
	const difficultyMultiplier = {
		easy: 1.0,
		medium: 1.5,
		hard: 2.0
	};

	// Time bonus (more points for faster completion)
	const timeBonus = Math.max(0, (maxTime - timeElapsed) / maxTime);

	// Calculate final score
	const finalScore = Math.round(
		baseScore * difficultyMultiplier[difficulty] * (1 + timeBonus * 0.5) // Up to 50% bonus for speed
	);

	return Math.max(0, finalScore);
}

/**
 * Generate a game state ID
 */
export function generateGameId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate game result data
 */
export function validateGameResult(result: Partial<GameResult>): result is GameResult {
	return !!(
		result.gameId &&
		result.difficulty &&
		typeof result.score === 'number' &&
		typeof result.timeElapsed === 'number' &&
		typeof result.completed === 'boolean' &&
		typeof result.timestamp === 'number'
	);
}

/**
 * Create initial game state
 */
export function createInitialGameState(
	gameId: string,
	difficulty: 'easy' | 'medium' | 'hard'
): GameState {
	return {
		gameId,
		isActive: false,
		isPaused: false,
		isCompleted: false,
		startTime: Date.now(),
		difficulty,
		currentData: {}
	};
}

/**
 * Check if two arrays contain the same elements (order doesn't matter)
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;

	const sortedA = [...a].sort();
	const sortedB = [...b].sort();

	return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Debounce function to limit frequent calls
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, factor: number): number {
	return start + (end - start) * clamp(factor, 0, 1);
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
	return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Generate a hash from a string (simple djb2 algorithm)
 */
export function hashString(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i);
	}
	return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Check if a string contains only alphabetic characters
 */
export function isAlphabetic(str: string): boolean {
	return /^[a-zA-Z]+$/.test(str);
}

/**
 * Remove accents from characters
 */
export function removeAccents(str: string): string {
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calculate percentage with optional decimal places
 */
export function percentage(value: number, total: number, decimals: number = 1): number {
	if (total === 0) return 0;
	return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

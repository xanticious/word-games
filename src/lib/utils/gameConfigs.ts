import type { GameConfig, DifficultyConfig } from '$lib/types';

/**
 * Game configurations for the word games collection
 */
export const GAME_CONFIGS: Record<string, GameConfig> = {
	wordle: {
		id: 'wordle',
		name: 'Guess the Word',
		description: 'Wordle-style word guessing with colored feedback',
		icon: '🎯',
		route: '/wordle',
		category: 'word-guessing',
		difficulty: ['easy', 'medium', 'hard'],
		features: ['Color Feedback', 'Virtual Keyboard', 'Hard Mode'],
		estimatedPlayTime: 5
	},
	wordsearch: {
		id: 'wordsearch',
		name: 'Word Search',
		description: 'Find hidden words in letter grids',
		icon: '🔍',
		route: '/wordsearch',
		category: 'puzzle',
		difficulty: ['easy', 'medium', 'hard'],
		features: ['Multiple Directions', 'Theme Categories', 'Timer Optional'],
		estimatedPlayTime: 10
	},
	anagrams: {
		id: 'anagrams',
		name: 'Bag of Letters',
		description: 'Create words from a set of given letters',
		icon: '🎒',
		route: '/anagrams',
		category: 'puzzle',
		difficulty: ['easy', 'medium', 'hard'],
		features: ['Score System', 'Word Length Bonus', 'Time Challenge'],
		estimatedPlayTime: 8
	},
	typing: {
		id: 'typing',
		name: 'Typing Challenge',
		description: 'Speed typing game with word-based challenges',
		icon: '⌨️',
		route: '/typing',
		category: 'speed',
		difficulty: ['easy', 'medium', 'hard'],
		features: ['WPM Tracking', 'Accuracy Stats', 'Multiple Modes'],
		estimatedPlayTime: 3
	},
	rhyme: {
		id: 'rhyme',
		name: 'Rhyme Thyme',
		description: 'Type rhyming words against the clock',
		icon: '🎵',
		route: '/rhyme',
		category: 'creative',
		difficulty: ['easy', 'medium', 'hard'],
		features: ['Rhyme Detection', 'Time Pressure', 'Rarity Scoring'],
		estimatedPlayTime: 2
	}
};

/**
 * Difficulty level configurations
 */
export const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
	easy: {
		name: 'easy',
		id: 'easy',
		displayName: 'Easy',
		description: 'Relaxed pace with common words',
		color: 'green-500'
	},
	medium: {
		name: 'medium',
		id: 'medium',
		displayName: 'Medium',
		description: 'Balanced challenge for most players',
		color: 'yellow-500'
	},
	hard: {
		name: 'hard',
		id: 'hard',
		displayName: 'Hard',
		description: 'Advanced difficulty with complex words',
		color: 'red-500'
	}
};

/**
 * Get all available games
 */
export function getAllGames(): GameConfig[] {
	return Object.values(GAME_CONFIGS);
}

/**
 * Get game configuration by ID
 */
export function getGameConfig(gameId: string): GameConfig | undefined {
	return GAME_CONFIGS[gameId];
}

/**
 * Get games by category
 */
export function getGamesByCategory(category: GameConfig['category']): GameConfig[] {
	return Object.values(GAME_CONFIGS).filter((game) => game.category === category);
}

/**
 * Get all available difficulty levels
 */
export function getAllDifficulties(): DifficultyConfig[] {
	return Object.values(DIFFICULTY_CONFIGS);
}

/**
 * Get difficulty configuration by ID
 */
export function getDifficultyConfig(difficultyId: string): DifficultyConfig | undefined {
	return DIFFICULTY_CONFIGS[difficultyId];
}

/**
 * Check if a game supports a specific difficulty
 */
export function gameSupportsdifficulty(
	gameId: string,
	difficulty: 'easy' | 'medium' | 'hard'
): boolean {
	const game = GAME_CONFIGS[gameId];
	return game ? game.difficulty.includes(difficulty) : false;
}

/**
 * Get recommended games for a player based on preferences
 */
export function getRecommendedGames(
	favoriteCategories: GameConfig['category'][] = [],
	preferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
	maxPlayTime?: number
): GameConfig[] {
	let games = Object.values(GAME_CONFIGS);

	// Filter by category if specified
	if (favoriteCategories.length > 0) {
		games = games.filter((game) => favoriteCategories.includes(game.category));
	}

	// Filter by difficulty support
	games = games.filter((game) => game.difficulty.includes(preferredDifficulty));

	// Filter by play time if specified
	if (maxPlayTime) {
		games = games.filter((game) => game.estimatedPlayTime <= maxPlayTime);
	}

	return games;
}

/**
 * Game categories with descriptions
 */
export const GAME_CATEGORIES = {
	'word-guessing': {
		name: 'Word Guessing',
		description: 'Deductive word games with clues and feedback',
		icon: '🎯'
	},
	puzzle: {
		name: 'Puzzles',
		description: 'Logic and pattern-based word challenges',
		icon: '🧩'
	},
	speed: {
		name: 'Speed Games',
		description: 'Fast-paced challenges against the clock',
		icon: '⚡'
	},
	creative: {
		name: 'Creative',
		description: 'Open-ended word creation and exploration',
		icon: '🎨'
	}
} as const;

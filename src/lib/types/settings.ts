/**
 * Core settings and user preferences
 */
export interface UserSettings {
	theme: 'light' | 'dark' | 'high-contrast';
	textSize: 'small' | 'medium' | 'large' | 'extra-large';
	defaultDifficulty: 'easy' | 'medium' | 'hard';
	favoriteGames: string[];
	recentGames: Array<{ gameId: string; timestamp: number }>;
	gameSpecificSettings: Record<string, any>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
	name: string;
	id: 'light' | 'dark' | 'high-contrast';
	displayName: string;
	description: string;
	cssClass: string;
}

/**
 * Text size configuration
 */
export interface TextSizeConfig {
	name: string;
	id: 'small' | 'medium' | 'large' | 'extra-large';
	displayName: string;
	cssClass: string;
	scaleFactor: number;
}

/**
 * Difficulty level configuration
 */
export interface DifficultyConfig {
	name: string;
	id: 'easy' | 'medium' | 'hard';
	displayName: string;
	description: string;
	color: string;
}

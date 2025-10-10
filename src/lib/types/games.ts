/**
 * Base game configuration interface
 */
export interface GameConfig {
	id: string;
	name: string;
	description: string;
	icon: string;
	route: string;
	category: 'word-guessing' | 'puzzle' | 'speed' | 'creative';
	difficulty: Array<'easy' | 'medium' | 'hard'>;
	features: string[];
	estimatedPlayTime: number; // minutes
}

/**
 * Game state management
 */
export interface GameState {
	gameId: string;
	isActive: boolean;
	isPaused: boolean;
	isCompleted: boolean;
	startTime: number;
	endTime?: number;
	score?: number;
	difficulty: 'easy' | 'medium' | 'hard';
	currentData: any; // Game-specific state data
}

/**
 * Game result/statistics
 */
export interface GameResult {
	gameId: string;
	difficulty: 'easy' | 'medium' | 'hard';
	score: number;
	timeElapsed: number; // seconds
	completed: boolean;
	timestamp: number;
	details: Record<string, any>; // Game-specific result data
}

/**
 * Game history entry
 */
export interface GameHistoryEntry {
	gameId: string;
	gameName: string;
	timestamp: number;
	result?: GameResult;
}

/**
 * Common game props interface
 */
export interface GameProps {
	difficulty?: 'easy' | 'medium' | 'hard';
	onGameComplete?: (result: GameResult) => void;
	onGameExit?: () => void;
}

/**
 * Word-based game specific interfaces
 */
export interface WordGameState extends GameState {
	currentWord?: string;
	guessedWords?: string[];
	remainingAttempts?: number;
	hints?: string[];
}

/**
 * Timed game specific interfaces
 */
export interface TimedGameState extends GameState {
	timeLimit: number; // seconds
	timeRemaining: number;
	timerActive: boolean;
}

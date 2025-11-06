/**
 * Wordle game specific types and interfaces
 */

import type { GameState, GameResult } from '$lib/types/games.js';

export type LetterState = 'correct' | 'present' | 'absent' | 'unused';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface WordleLetter {
	letter: string;
	state: LetterState;
}

export interface WordleGuess {
	word: string;
	letters: WordleLetter[];
	isSubmitted: boolean;
}

export interface WordleState extends GameState {
	targetWord: string;
	currentGuess: string;
	guesses: WordleGuess[];
	currentRow: number;
	gameStatus: GameStatus;
	letterStates: Record<string, LetterState>;
	hardMode: boolean;
	maxGuesses: number;
}

export interface WordleResult extends GameResult {
	details: {
		targetWord: string;
		guessCount: number;
		pattern: string; // Visual pattern for sharing (🟩🟨⬜)
		hardMode: boolean;
		solvedIn: number; // Number of guesses to solve, or 0 if not solved
	};
}

export interface WordleConfig {
	wordLength: number;
	maxGuesses: number;
	hardMode: boolean;
	difficulty: 'easy' | 'medium' | 'hard';
	targetWords: 'common' | 'all'; // Filter word pool
	rescueMode: boolean; // Auto-fill and submit first guess
	easyMode: boolean; // Show candidate list
}

export interface WordleGameProps {
	difficulty?: 'easy' | 'medium' | 'hard';
	wordLength?: number;
	hardMode?: boolean;
	targetWords?: 'common' | 'all';
	rescueMode?: boolean;
	easyMode?: boolean;
	onGameComplete?: (result: WordleResult) => void;
	onGameExit?: () => void;
}

export interface WordleCandidate {
	word: string;
	matchScore: number; // How well it fits known clues
}

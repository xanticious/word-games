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
}

export interface WordleGameProps {
	difficulty?: 'easy' | 'medium' | 'hard';
	hardMode?: boolean;
	onGameComplete?: (result: WordleResult) => void;
	onGameExit?: () => void;
}

/**
 * Wordle game logic and state management
 */

import type {
	WordleState,
	WordleGuess,
	WordleLetter,
	LetterState,
	GameStatus,
	WordleResult,
	WordleConfig
} from './types.js';
import { GameDictionary } from '$lib/dictionary.js';

export class WordleGame {
	private state: WordleState;
	private dictionary: GameDictionary;
	private config: WordleConfig;
	private initialized: boolean = false;

	constructor(config: WordleConfig) {
		// Ensure Wordle is always 5 letters
		this.config = { ...config, wordLength: 5 };
		this.dictionary = new GameDictionary();
		this.state = this.createInitialState();
	}

	private createInitialState(): WordleState {
		return {
			gameId: 'wordle',
			isActive: false, // Will be set to true after initialization
			isPaused: false,
			isCompleted: false,
			startTime: Date.now(),
			difficulty: this.config.difficulty,
			currentData: {},

			// Wordle-specific state
			targetWord: '', // Will be set during initialization
			currentGuess: '',
			guesses: Array(this.config.maxGuesses)
				.fill(null)
				.map(() => ({
					word: '',
					letters: Array(this.config.wordLength)
						.fill(null)
						.map(() => ({
							letter: '',
							state: 'unused' as LetterState
						})),
					isSubmitted: false
				})),
			currentRow: 0,
			gameStatus: 'playing' as GameStatus,
			letterStates: {},
			hardMode: this.config.hardMode,
			maxGuesses: this.config.maxGuesses
		};
	}

	/**
	 * Initialize the game with a target word (must be called before playing)
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			const targetWord = await this.selectTargetWord();
			this.state.targetWord = targetWord;
			this.state.isActive = true;
			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize Wordle game:', error);
			throw error;
		}
	}

	private async selectTargetWord(): Promise<string> {
		// Load dictionary if needed
		await this.dictionary.loadDictionaries();

		// Get words by difficulty and length - ensure exactly 5 letters
		const allWordsOfLength = this.dictionary.getWordsByLength(5); // Force 5 letters

		const words = allWordsOfLength.filter((word) => {
			// Filter by difficulty based on word commonality
			const difficulty = this.getWordDifficulty(word);
			return difficulty === this.config.difficulty && word.length === 5; // Double-check length
		});

		if (words.length === 0) {
			// Fallback to any 5-letter word
			const fallbackWords = this.dictionary.getWordsByLength(5);
			const selectedWord =
				fallbackWords[Math.floor(Math.random() * fallbackWords.length)].toLowerCase();
			return selectedWord;
		}

		const selectedWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
		return selectedWord;
	}

	private getWordDifficulty(word: string): 'easy' | 'medium' | 'hard' {
		// Simple heuristic based on word length and common letters
		const commonLetters = new Set(['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'l', 'n']);
		const commonCount = word.split('').filter((letter) => commonLetters.has(letter)).length;
		const ratio = commonCount / word.length;

		if (ratio > 0.6) return 'easy';
		if (ratio > 0.4) return 'medium';
		return 'hard';
	}

	/**
	 * Add a letter to the current guess
	 */
	addLetter(letter: string): boolean {
		if (this.state.gameStatus !== 'playing') return false;
		if (this.state.currentGuess.length >= this.config.wordLength) return false;

		this.state.currentGuess += letter.toLowerCase();
		this.updateCurrentGuessDisplay();
		return true;
	}

	/**
	 * Remove the last letter from the current guess
	 */
	deleteLetter(): boolean {
		if (this.state.gameStatus !== 'playing') return false;
		if (this.state.currentGuess.length === 0) return false;

		this.state.currentGuess = this.state.currentGuess.slice(0, -1);
		this.updateCurrentGuessDisplay();
		return true;
	}

	/**
	 * Submit the current guess
	 */
	submitGuess(): { success: boolean; message?: string } {
		if (this.state.gameStatus !== 'playing') {
			return { success: false, message: 'Game is not active' };
		}

		if (this.state.currentGuess.length !== this.config.wordLength) {
			return { success: false, message: 'Word must be 5 letters long' };
		}

		if (!this.dictionary.isValidWord(this.state.currentGuess)) {
			return { success: false, message: 'Not a valid word' };
		}

		// Check hard mode constraints
		if (this.config.hardMode && this.state.currentRow > 0) {
			const violation = this.checkHardModeViolation(this.state.currentGuess);
			if (violation) {
				return { success: false, message: violation };
			}
		}

		// Process the guess
		this.processGuess(this.state.currentGuess);

		// Check game completion
		this.checkGameCompletion();

		return { success: true };
	}

	private updateCurrentGuessDisplay(): void {
		const currentGuess = this.state.guesses[this.state.currentRow];
		for (let i = 0; i < this.config.wordLength; i++) {
			currentGuess.letters[i].letter = this.state.currentGuess[i] || '';
		}
	}

	private processGuess(guess: string): void {
		const currentGuess = this.state.guesses[this.state.currentRow];
		const targetLetters = this.state.targetWord.split('');
		const guessLetters = guess.split('');

		// First pass: mark correct letters
		const letterCounts = new Map<string, number>();
		targetLetters.forEach((letter) => {
			letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
		});

		// Mark correct positions first
		for (let i = 0; i < this.config.wordLength; i++) {
			if (guessLetters[i] === targetLetters[i]) {
				currentGuess.letters[i].state = 'correct';
				this.state.letterStates[guessLetters[i]] = 'correct';
				letterCounts.set(guessLetters[i], letterCounts.get(guessLetters[i])! - 1);
			}
		}

		// Second pass: mark present letters
		for (let i = 0; i < this.config.wordLength; i++) {
			if (currentGuess.letters[i].state === 'correct') continue;

			const letter = guessLetters[i];
			if (letterCounts.get(letter)! > 0) {
				currentGuess.letters[i].state = 'present';
				letterCounts.set(letter, letterCounts.get(letter)! - 1);

				// Only update keyboard state if not already correct
				if (this.state.letterStates[letter] !== 'correct') {
					this.state.letterStates[letter] = 'present';
				}
			} else {
				currentGuess.letters[i].state = 'absent';

				// Only mark as absent if not already marked as correct or present
				if (!this.state.letterStates[letter]) {
					this.state.letterStates[letter] = 'absent';
				}
			}
		}

		currentGuess.word = guess;
		currentGuess.isSubmitted = true;
		this.state.currentRow++;
		this.state.currentGuess = '';
	}

	private checkHardModeViolation(guess: string): string | null {
		// In hard mode, any revealed hints must be used in subsequent guesses
		const previousGuesses = this.state.guesses.slice(0, this.state.currentRow);

		for (const prevGuess of previousGuesses) {
			if (!prevGuess.isSubmitted) continue;

			for (let i = 0; i < prevGuess.letters.length; i++) {
				const letter = prevGuess.letters[i];

				if (letter.state === 'correct') {
					if (guess[i] !== letter.letter) {
						return `${i + 1} letter must be ${letter.letter.toUpperCase()}`;
					}
				} else if (letter.state === 'present') {
					if (!guess.includes(letter.letter)) {
						return `Guess must contain ${letter.letter.toUpperCase()}`;
					}
				}
			}
		}

		return null;
	}

	private checkGameCompletion(): void {
		const lastGuess = this.state.guesses[this.state.currentRow - 1];

		if (lastGuess.word === this.state.targetWord) {
			this.state.gameStatus = 'won';
			this.state.isCompleted = true;
			this.state.endTime = Date.now();
		} else if (this.state.currentRow >= this.config.maxGuesses) {
			this.state.gameStatus = 'lost';
			this.state.isCompleted = true;
			this.state.endTime = Date.now();
		}
	}

	/**
	 * Generate a shareable pattern for the game result
	 */
	generateSharePattern(): string {
		const rows: string[] = [];

		for (let i = 0; i < this.state.currentRow; i++) {
			const guess = this.state.guesses[i];
			if (!guess.isSubmitted) continue;

			const row = guess.letters
				.map((letter) => {
					switch (letter.state) {
						case 'correct':
							return '🟩';
						case 'present':
							return '🟨';
						case 'absent':
							return '⬜';
						default:
							return '⬜';
					}
				})
				.join('');

			rows.push(row);
		}

		return rows.join('\n');
	}

	/**
	 * Get the current game result
	 */
	getResult(): WordleResult {
		const timeElapsed = this.state.endTime
			? Math.floor((this.state.endTime - this.state.startTime) / 1000)
			: 0;

		const score =
			this.state.gameStatus === 'won'
				? Math.max(0, 1000 - this.state.currentRow * 100 - timeElapsed * 2)
				: 0;

		return {
			gameId: 'wordle',
			difficulty: this.state.difficulty,
			score,
			timeElapsed,
			completed: this.state.isCompleted,
			timestamp: Date.now(),
			details: {
				targetWord: this.state.targetWord,
				guessCount: this.state.currentRow,
				pattern: this.generateSharePattern(),
				hardMode: this.state.hardMode,
				solvedIn: this.state.gameStatus === 'won' ? this.state.currentRow : 0
			}
		};
	}

	/**
	 * Get the current game state (read-only)
	 */
	getState(): Readonly<WordleState> {
		return this.state;
	}

	/**
	 * Reset the game with a new word
	 */
	async restart(): Promise<void> {
		this.initialized = false;
		this.state = this.createInitialState();
		await this.initialize();
	}
}

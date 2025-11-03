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

/**
 * Constraint structure for tracking letter placement and occurrence rules
 */
interface WordConstraints {
	// Position constraints: which letter MUST be at each position (null = no constraint)
	posMustContain: { [position: number]: string | null };
	// Position exclusions: which letters MUST NOT be at each position
	posMustNotContain: { [position: number]: string[] };
	// Letter occurrence constraints: min/max count for each letter
	allowedOccurrences: { [letter: string]: { min: number; max: number } };
}

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

	/**
	 * Apply rescue mode - auto-fill and submit first guess
	 * @param previousTarget Previous round's target word (optional)
	 */
	applyRescueMode(previousTarget: string | null = null): void {
		if (!this.config.rescueMode) return;
		if (this.state.currentRow !== 0) return; // Only apply on first guess
		if (!this.initialized) return;

		let firstGuess: string;

		// Get valid words for validation
		let validWords: string[];
		if (this.config.targetWords === 'common') {
			validWords = this.dictionary.getCommonWords(this.config.wordLength);
		} else {
			validWords = this.dictionary.getWordsByLength(this.config.wordLength);
		}

		// Use previous target if available and valid
		if (previousTarget && validWords.includes(previousTarget.toLowerCase())) {
			firstGuess = previousTarget.toLowerCase();
		} else {
			// Pick a random word from valid words
			const randomIndex = Math.floor(Math.random() * validWords.length);
			firstGuess = validWords[randomIndex];
		}

		// Auto-fill letters
		for (const letter of firstGuess) {
			this.addLetter(letter);
		}

		// Auto-submit the first guess
		this.submitGuess();
	}

	private async selectTargetWord(): Promise<string> {
		// Load dictionary if needed
		await this.dictionary.loadDictionaries();

		let candidateWords: string[];

		if (this.config.targetWords === 'common') {
			// Use curated list of common words
			candidateWords = this.dictionary.getCommonWords(this.config.wordLength);
			if (candidateWords.length === 0) {
				throw new Error(`No common words available for length ${this.config.wordLength}`);
			}
		} else {
			// Use all valid words from dictionary
			candidateWords = this.dictionary.getWordsByLength(this.config.wordLength);
			if (candidateWords.length === 0) {
				throw new Error(`No words available for length ${this.config.wordLength}`);
			}
		}

		// Random selection
		const selectedWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
		return selectedWord.toLowerCase();
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
			return { success: false, message: `Word must be ${this.config.wordLength} letters long` };
		}

		// Validate word using appropriate word list
		let validWords: string[];
		if (this.config.targetWords === 'common') {
			validWords = this.dictionary.getCommonWords(this.config.wordLength);
		} else {
			validWords = this.dictionary.getWordsByLength(this.config.wordLength);
		}

		if (!validWords.includes(this.state.currentGuess.toLowerCase())) {
			return { success: false, message: 'Not in word list' };
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

	/**
	 * Build constraint structure from all submitted guesses
	 */
	private buildConstraints(): WordConstraints {
		const constraints: WordConstraints = {
			posMustContain: {},
			posMustNotContain: {},
			allowedOccurrences: {}
		};

		// Initialize position arrays
		for (let i = 0; i < this.config.wordLength; i++) {
			constraints.posMustContain[i] = null;
			constraints.posMustNotContain[i] = [];
		}

		// Initialize all letters with default range (0 to wordLength)
		const alphabet = 'abcdefghijklmnopqrstuvwxyz';
		for (const letter of alphabet) {
			constraints.allowedOccurrences[letter] = { min: 0, max: this.config.wordLength };
		}

		// Track letter constraints - we'll refine these as we process guesses
		const letterConstraints = new Map<string, { min: number; max: number }>();

		// Process each guess individually to determine what it tells us
		for (const guess of this.state.guesses) {
			if (!guess.isSubmitted) continue;

			// Count occurrences of each letter in THIS guess by state
			const letterStatesInGuess = new Map<
				string,
				{ greenCount: number; yellowCount: number; grayCount: number }
			>();

			for (let i = 0; i < guess.letters.length; i++) {
				const { letter, state } = guess.letters[i];

				if (!letterStatesInGuess.has(letter)) {
					letterStatesInGuess.set(letter, { greenCount: 0, yellowCount: 0, grayCount: 0 });
				}

				const letterState = letterStatesInGuess.get(letter)!;
				if (state === 'correct') {
					letterState.greenCount++;
					// Green letter must be at this position
					constraints.posMustContain[i] = letter;
				} else if (state === 'present') {
					letterState.yellowCount++;
					// Yellow letter must NOT be at this position
					if (!constraints.posMustNotContain[i].includes(letter)) {
						constraints.posMustNotContain[i].push(letter);
					}
				} else if (state === 'absent') {
					letterState.grayCount++;
				}
			}

			// For each letter in this guess, update the occurrence constraints
			for (const [letter, states] of letterStatesInGuess) {
				const greenYellowCount = states.greenCount + states.yellowCount;

				if (!letterConstraints.has(letter)) {
					letterConstraints.set(letter, { min: 0, max: this.config.wordLength });
				}

				const currentConstraint = letterConstraints.get(letter)!;

				if (greenYellowCount > 0) {
					// This guess tells us there are AT LEAST greenYellowCount instances
					currentConstraint.min = Math.max(currentConstraint.min, greenYellowCount);

					// If we ALSO saw gray instances in this guess, it means we found ALL instances
					if (states.grayCount > 0) {
						// The exact count is the number of green + yellow
						currentConstraint.max = Math.min(currentConstraint.max, greenYellowCount);
					}
				} else if (states.grayCount > 0) {
					// All instances in this guess were gray - letter doesn't appear in target
					currentConstraint.min = 0;
					currentConstraint.max = 0;

					// Exclude from all positions
					for (let i = 0; i < this.config.wordLength; i++) {
						if (!constraints.posMustNotContain[i].includes(letter)) {
							constraints.posMustNotContain[i].push(letter);
						}
					}
				}
			}
		}

		// Copy the refined constraints to the result
		for (const [letter, constraint] of letterConstraints) {
			constraints.allowedOccurrences[letter] = constraint;
		}

		// Set default for letters we haven't seen
		for (const letter of alphabet) {
			if (!letterConstraints.has(letter)) {
				constraints.allowedOccurrences[letter] = { min: 0, max: this.config.wordLength };
			}
		}

		return constraints;
	}

	private checkHardModeViolation(guess: string): string | null {
		// In hard mode, any revealed hints must be used in subsequent guesses
		const constraints = this.buildConstraints();

		// Check position constraints (green letters)
		for (let i = 0; i < this.config.wordLength; i++) {
			const mustBe = constraints.posMustContain[i];
			if (mustBe !== null && guess[i] !== mustBe) {
				return `${this.getOrdinal(i + 1)} letter must be ${mustBe.toUpperCase()}`;
			}
		}

		// Check position exclusions (yellow and gray letters)
		for (let i = 0; i < this.config.wordLength; i++) {
			const mustNotBe = constraints.posMustNotContain[i];
			if (mustNotBe.includes(guess[i])) {
				return `${this.getOrdinal(i + 1)} letter cannot be ${guess[i].toUpperCase()}`;
			}
		}

		// Check letter occurrence constraints (handles repeated letters and gray letters)
		const guessCounts = new Map<string, number>();
		for (const letter of guess) {
			guessCounts.set(letter, (guessCounts.get(letter) || 0) + 1);
		}

		for (const [letter, count] of guessCounts) {
			const { min, max } = constraints.allowedOccurrences[letter];

			if (count < min) {
				return `Guess must contain at least ${min} ${letter.toUpperCase()}${min > 1 ? "'s" : ''}`;
			}

			if (count > max) {
				if (max === 0) {
					return `Guess cannot contain ${letter.toUpperCase()}`;
				} else {
					return `Guess cannot contain more than ${max} ${letter.toUpperCase()}${max > 1 ? "'s" : ''}`;
				}
			}
		}

		// Check for letters that must appear but don't
		for (const [letter, { min }] of Object.entries(constraints.allowedOccurrences)) {
			if (min > 0 && !guessCounts.has(letter)) {
				return `Guess must contain ${letter.toUpperCase()}`;
			}
		}

		return null;
	}

	private getOrdinal(n: number): string {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
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
	 * Get list of valid candidate words based on current clues (for Easy Mode)
	 */
	getCandidateWords(): Array<{ word: string; matchScore: number }> {
		if (!this.config.easyMode) return [];

		// Get all valid words based on targetWords setting
		let allWords: string[];
		if (this.config.targetWords === 'common') {
			allWords = this.dictionary.getCommonWords(this.config.wordLength);
		} else {
			allWords = this.dictionary.getWordsByLength(this.config.wordLength);
		}

		const candidates: Array<{ word: string; matchScore: number }> = [];

		// Build constraints from submitted guesses
		const constraints = this.buildConstraints();

		// Filter words by constraints
		for (const word of allWords) {
			let isValid = true;
			let matchScore = 0;

			// Check position constraints (green letters)
			for (let i = 0; i < this.config.wordLength; i++) {
				const mustBe = constraints.posMustContain[i];
				if (mustBe !== null && word[i] !== mustBe) {
					isValid = false;
					break;
				}
				if (mustBe !== null) {
					matchScore += 20;
				}
			}

			if (!isValid) continue;

			// Check position exclusions (yellow and gray letters)
			for (let i = 0; i < this.config.wordLength; i++) {
				const mustNotBe = constraints.posMustNotContain[i];
				if (mustNotBe.includes(word[i])) {
					isValid = false;
					break;
				}
				if (mustNotBe.length > 0) {
					matchScore += 5;
				}
			}

			if (!isValid) continue;

			// Check letter occurrence constraints (handles repeated letters)
			const wordCounts = new Map<string, number>();
			for (const letter of word) {
				wordCounts.set(letter, (wordCounts.get(letter) || 0) + 1);
			}

			for (const [letter, count] of wordCounts) {
				const { min, max } = constraints.allowedOccurrences[letter];

				if (count < min || count > max) {
					isValid = false;
					break;
				}

				if (min > 0) {
					matchScore += 10 * min;
				}
			}

			if (!isValid) continue;

			// Verify all required letters are present
			for (const [letter, { min }] of Object.entries(constraints.allowedOccurrences)) {
				if (min > 0 && (!wordCounts.has(letter) || wordCounts.get(letter)! < min)) {
					isValid = false;
					break;
				}
			}

			if (isValid) {
				candidates.push({ word, matchScore });
			}
		}

		// Sort by match score (best matches first)
		candidates.sort((a, b) => b.matchScore - a.matchScore);

		return candidates;
	}

	/**
	 * Get the current game state (read-only)
	 */
	getState(): Readonly<WordleState> {
		return this.state;
	}

	/**
	 * Get the current game state with candidates (for Easy Mode)
	 */
	getStateWithCandidates(): Readonly<WordleState> & {
		candidates?: Array<{ word: string; matchScore: number }>;
	} {
		if (this.config.easyMode) {
			return {
				...this.state,
				candidates: this.getCandidateWords()
			};
		}
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

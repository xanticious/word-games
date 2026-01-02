<script lang="ts">
	import { onMount } from 'svelte';
	import { GameLayout } from '$lib/components/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';
	import { GameDictionary } from '$lib/dictionary.js';
	import type {
		GameState,
		GamePrompt,
		Completion,
		ValidationResult
	} from '$lib/games/rhyme/types.js';
	import { generatePrompt } from '$lib/games/rhyme/wikipediaPrompts.js';
	import {
		calculateCompletionScore,
		calculateRoundResults
	} from '$lib/games/rhyme/scoreCalculator.js';
	import { TIMING } from '$lib/games/rhyme/config.js';
	import GameplayScreen from '$lib/games/rhyme/components/GameplayScreen.svelte';
	import ResultsScreen from '$lib/games/rhyme/components/ResultsScreen.svelte';
	import HelpModal from '$lib/games/rhyme/components/HelpModal.svelte';

	const gameConfig = getGameConfig('rhyme')!;
	const dictionary = new GameDictionary();

	// Game state
	let gameState = $state<GameState>({
		phase: 'loading',
		prompt: null,
		completions: [],
		currentInput: '',
		startTime: null,
		elapsedTime: 0,
		timerInterval: null,
		errorMessage: null,
		results: null
	});

	let showHelp = $state(false);

	async function initializeGame() {
		try {
			gameState.phase = 'loading';
			gameState.errorMessage = null;

			// Load dictionary if not already loaded
			await dictionary.loadDictionaries();

			// Generate prompt
			const prompt = await generatePrompt(dictionary);

			if (!prompt) {
				gameState.phase = 'error';
				gameState.errorMessage = 'Unable to generate prompt. Please try again.';
				return;
			}

			// Initialize game
			gameState.prompt = prompt;
			gameState.completions = [];
			gameState.currentInput = '';
			gameState.elapsedTime = 0;
			gameState.startTime = Date.now();
			gameState.results = null;
			gameState.phase = 'gameplay';

			// Start timer
			startTimer();
		} catch (error) {
			console.error('Failed to initialize game:', error);
			gameState.phase = 'error';
			gameState.errorMessage = 'Failed to load game. Please try again.';
		}
	}

	function startTimer() {
		// Clear any existing timer
		if (gameState.timerInterval) {
			clearInterval(gameState.timerInterval);
		}

		gameState.timerInterval = setInterval(() => {
			if (!gameState.startTime) return;

			const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
			gameState.elapsedTime = elapsed;

			// Check if time's up
			if (elapsed >= TIMING.roundDuration) {
				endRound();
			}
		}, 100) as unknown as number; // Update more frequently for smooth progress bar
	}

	function stopTimer() {
		if (gameState.timerInterval) {
			clearInterval(gameState.timerInterval);
			gameState.timerInterval = null;
		}
	}

	function validateCompletion(line: string): ValidationResult {
		// Empty input
		if (!line.trim()) {
			return { valid: false, error: 'Please enter a line' };
		}

		// Too long
		const maxLength = (gameState.prompt?.prompt.length || 0) * 2;
		if (line.length > maxLength) {
			return { valid: false, error: 'Too long' };
		}

		// Exact duplicate
		if (gameState.completions.some((c) => c.line.toLowerCase() === line.toLowerCase())) {
			return { valid: false, error: 'You already submitted this line' };
		}

		// Check all words exist in dictionary
		const words = line
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 0);

		for (const word of words) {
			if (!dictionary.isValidWord(word)) {
				return {
					valid: false,
					error: `Sorry, "${word}" is invalid, only well-known English words are allowed`,
					invalidWord: word
				};
			}
		}

		return { valid: true };
	}

	function handleSubmit(line: string) {
		if (!gameState.prompt) return;

		// Validate
		const validation = validateCompletion(line);
		if (!validation.valid) {
			alert(validation.error);
			return;
		}

		// Calculate score
		const score = calculateCompletionScore(
			gameState.prompt.prompt,
			line,
			gameState.prompt.bonusWords,
			dictionary.getPhoneticEntries()
		);

		// Add completion
		const completion: Completion = {
			line,
			timestamp: gameState.elapsedTime,
			score
		};

		gameState.completions.push(completion);

		// Check if we've reached max completions
		if (gameState.completions.length >= TIMING.maxCompletions) {
			endRound();
		}
	}

	function endRound() {
		stopTimer();

		if (!gameState.prompt) return;

		// Calculate results
		const results = calculateRoundResults(
			gameState.prompt,
			gameState.completions,
			gameState.elapsedTime
		);

		gameState.results = results;
		gameState.phase = 'results';
	}

	async function handleSkip() {
		// Confirm skip
		if (
			gameState.completions.length > 0 &&
			!confirm('Skip to a new prompt? All current completions will be lost.')
		) {
			return;
		}

		stopTimer();
		await initializeGame();
	}

	function handleGameExit() {
		stopTimer();
		goto('/');
	}

	function handleGameComplete(result: any) {
		console.log('Game completed:', result);
	}

	function handlePlayAgain() {
		initializeGame();
	}

	onMount(() => {
		initializeGame();

		return () => {
			stopTimer();
		};
	});
</script>

<svelte:head>
	<title>Rhyme Thyme - Word Games Collection</title>
</svelte:head>

<GameLayout config={gameConfig} onGameExit={handleGameExit} onGameComplete={handleGameComplete}>
	{#if gameState.phase === 'loading'}
		<div class="flex min-h-[60vh] flex-col items-center justify-center">
			<div class="mb-4 text-6xl">🎵</div>
			<h2 class="mb-4 text-2xl font-bold">Loading Rhyme Thyme...</h2>
			<p class="text-muted-foreground">Fetching Wikipedia article...</p>
		</div>
	{:else if gameState.phase === 'error'}
		<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
			<div class="mb-4 text-6xl">⚠️</div>
			<h2 class="mb-4 text-2xl font-bold">Error</h2>
			<p class="text-muted-foreground mb-8 max-w-md">{gameState.errorMessage}</p>
			<button
				onclick={initializeGame}
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-semibold transition-colors"
			>
				Try Again
			</button>
		</div>
	{:else if gameState.phase === 'gameplay' && gameState.prompt}
		<GameplayScreen
			prompt={gameState.prompt}
			bind:elapsedTime={gameState.elapsedTime}
			completionCount={gameState.completions.length}
			phoneticEntries={dictionary.getPhoneticEntries()}
			onSubmit={handleSubmit}
			onSkip={handleSkip}
			onShowHelp={() => (showHelp = true)}
		/>
	{:else if gameState.phase === 'results' && gameState.results}
		<ResultsScreen results={gameState.results} onPlayAgain={handlePlayAgain} />
	{/if}

	{#if showHelp}
		<HelpModal onClose={() => (showHelp = false)} />
	{/if}
</GameLayout>

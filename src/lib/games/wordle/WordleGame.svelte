<!--
	WordleGame.svelte - Main Wordle game component
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import WordleGrid from './WordleGrid.svelte';
	import WordleKeyboard from './WordleKeyboard.svelte';
	import { FullscreenButton } from '$lib/components/index.js';
	import { WordleGame } from './game.js';
	import type { WordleGameProps, WordleResult } from './types.js';

	let {
		difficulty = 'medium',
		hardMode = false,
		onGameComplete,
		onGameExit
	}: WordleGameProps = $props();

	// Game instance
	let game: WordleGame;
	let gameState = $state<any>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let message = $state('');
	let messageType = $state<'success' | 'error' | 'info'>('info');
	let isFullscreen = $state(false);

	// Handle fullscreen changes
	function handleFullscreenChange(fullscreen: boolean) {
		isFullscreen = fullscreen;

		// Hide/show navbar and other UI elements
		const header = document.querySelector('header');
		const footer = document.querySelector('footer');

		if (fullscreen) {
			header?.classList.add('hidden');
			footer?.classList.add('hidden');
			document.body.classList.add('overflow-hidden');
		} else {
			header?.classList.remove('hidden');
			footer?.classList.remove('hidden');
			document.body.classList.remove('overflow-hidden');
		}
	}

	// Initialize game
	onMount(async () => {
		try {
			game = new WordleGame({
				wordLength: 5,
				maxGuesses: 6,
				hardMode,
				difficulty
			});

			await game.initialize();
			gameState = game.getState();
			isLoading = false;
		} catch (error) {
			console.error('Failed to initialize Wordle:', error);
			errorMessage = 'Failed to load the game. Please try again.';
			isLoading = false;
		}
	});

	// Handle key presses
	function handleKeyPress(key: string) {
		if (!game || gameState?.gameStatus !== 'playing') return;

		const success = game.addLetter(key);
		if (success) {
			gameState = game.getState();
			clearMessage();
		}
	}

	function handleBackspace() {
		if (!game || gameState?.gameStatus !== 'playing') return;

		const success = game.deleteLetter();
		if (success) {
			gameState = game.getState();
			clearMessage();
		}
	}

	function handleEnter() {
		if (!game || gameState?.gameStatus !== 'playing') return;

		const result = game.submitGuess();
		gameState = game.getState();

		if (!result.success) {
			showMessage(result.message || 'Invalid guess', 'error');
		} else {
			clearMessage();

			// Check if game is complete
			if (gameState.isCompleted) {
				handleGameFinish();
			}
		}
	}

	function handleGameFinish() {
		const result = game.getResult();

		if (gameState.gameStatus === 'won') {
			showMessage(
				`Congratulations! You guessed "${gameState.targetWord}" in ${gameState.currentRow} tries!`,
				'success'
			);
		} else {
			showMessage(`Game over! The word was "${gameState.targetWord}".`, 'info');
		}

		// Save the result immediately but don't auto-redirect
		onGameComplete?.(result);
	}

	function showMessage(msg: string, type: 'success' | 'error' | 'info') {
		message = msg;
		messageType = type;

		// Auto-clear after 3 seconds for error messages
		if (type === 'error') {
			setTimeout(clearMessage, 3000);
		}
	}

	function clearMessage() {
		message = '';
	}

	async function handleRestart() {
		if (!game) return;

		isLoading = true;
		clearMessage();

		try {
			await game.restart();
			gameState = game.getState();
		} catch (error) {
			console.error('Failed to restart game:', error);
			errorMessage = 'Failed to restart the game. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleShare() {
		if (!gameState || !gameState.isCompleted) return;

		const result = game.getResult();
		const pattern = result.details.pattern;
		const solvedText = gameState.gameStatus === 'won' ? `${result.details.solvedIn}/6` : 'X/6';

		const shareText = `Wordle ${solvedText}\n\n${pattern}\n\nPlay at: ${window.location.origin}`;

		if (navigator.share) {
			navigator.share({
				title: 'Wordle Result',
				text: shareText
			});
		} else {
			navigator.clipboard.writeText(shareText);
			showMessage('Result copied to clipboard!', 'success');
		}
	}

	// Message styling
	const messageClasses = {
		success: 'text-green-600 bg-green-50 border-green-200',
		error: 'text-red-600 bg-red-50 border-red-200',
		info: 'text-blue-600 bg-blue-50 border-blue-200'
	};
</script>

<div class="wordle-game flex min-h-full flex-col" class:fullscreen={isFullscreen}>
	{#if isLoading}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<div class="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
				<p class="text-muted-foreground">Loading game...</p>
			</div>
		</div>
	{:else if errorMessage}
		<div class="flex flex-1 items-center justify-center">
			<div class="max-w-md text-center">
				<div class="mb-4 text-4xl">⚠️</div>
				<h2 class="mb-2 text-xl font-semibold">Game Error</h2>
				<p class="text-muted-foreground mb-4">{errorMessage}</p>
				<button
					onclick={handleRestart}
					class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if gameState}
		<!-- Game Header -->
		<div class="border-b py-4 text-center">
			<h1 class="text-2xl font-bold">Wordle</h1>
			<div class="text-muted-foreground mt-1 text-sm">
				Guess {gameState.currentRow + 1} of {gameState.maxGuesses}
				{#if hardMode}
					<span class="ml-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">HARD MODE</span
					>
				{/if}
			</div>
		</div>

		<!-- Message Display -->
		{#if message}
			<div class={`mx-4 mt-4 rounded-md border p-3 ${messageClasses[messageType]}`}>
				{message}
			</div>
		{/if}

		<!-- Game Grid -->
		<div class="flex flex-1 flex-col justify-center">
			<WordleGrid guesses={gameState.guesses} currentRow={gameState.currentRow} wordLength={5} />
		</div>

		<!-- Game Controls -->
		{#if gameState.isCompleted}
			<div class="space-y-4 py-6 text-center">
				<div class="space-y-3">
					<!-- Primary Actions -->
					<div class="space-x-3">
						<button
							onclick={handleRestart}
							class="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-6 py-3 font-semibold"
						>
							Try Another Word
						</button>
						<button
							onclick={handleShare}
							class="rounded-md bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600"
						>
							Share Result
						</button>
					</div>

					<!-- Secondary Action -->
					<div>
						<button
							onclick={onGameExit}
							class="text-muted-foreground hover:text-foreground rounded-md px-4 py-2 text-sm underline"
						>
							Back to Games
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Virtual Keyboard -->
		<WordleKeyboard
			letterStates={gameState.letterStates}
			onKeyPress={handleKeyPress}
			onEnter={handleEnter}
			onBackspace={handleBackspace}
			disabled={gameState.gameStatus !== 'playing'}
		/>
	{/if}

	<!-- Fullscreen Button -->
	<FullscreenButton onFullscreenChange={handleFullscreenChange} />
</div>

<style>
	.wordle-game {
		max-width: 100%;
		height: 100%;
	}

	/* Fullscreen mode styling */
	.wordle-game.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		background: var(--background);
		padding: 1rem;
		min-height: 100vh;
	}

	/* Better spacing in fullscreen */
	.wordle-game.fullscreen .flex-1 {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>

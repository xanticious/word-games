<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { WordleGame } from '$lib/games/wordle/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { gameResults } from '$lib/stores/gameHistory.js';
	import { guessTheWordSettings } from '$lib/stores/guessTheWordSettings.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { WordleResult } from '$lib/games/wordle/types.js';

	const gameConfig = getGameConfig('wordle')!;

	// Read from URL params or fallback to store (derived to handle SSR)
	const targetWords = $derived(
		($page.url.searchParams.get('targetWords') as 'common' | 'all') ||
			$guessTheWordSettings.targetWords
	);
	const hardMode = $derived(
		$page.url.searchParams.get('hardMode') === 'true' || $guessTheWordSettings.hardMode
	);
	const rescueMode = $derived(
		$page.url.searchParams.get('rescueMode') === 'true' || $guessTheWordSettings.rescueMode
	);
	const easyMode = $derived(
		$page.url.searchParams.get('easyMode') === 'true' || $guessTheWordSettings.easyMode
	);
	const wordLength = $derived(
		parseInt($page.url.searchParams.get('wordLength') || '5') || $guessTheWordSettings.wordLength
	);

	function handleGameExit() {
		goto('/');
	}

	function handleGameComplete(result: WordleResult) {
		console.log('Wordle game completed:', result);

		// Save result to game history
		gameResults.addResult(result);

		// No longer auto-redirect - let the user decide when to leave
	}
</script>

<svelte:head>
	<title>Guess the Word - Word Games Collection</title>
</svelte:head>

<GameLayout config={gameConfig} onGameExit={handleGameExit}>
	<WordleGame
		difficulty="medium"
		{wordLength}
		{hardMode}
		{targetWords}
		{rescueMode}
		{easyMode}
		onGameComplete={handleGameComplete}
		onGameExit={handleGameExit}
	/>
</GameLayout>

<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { WordleGame } from '$lib/games/wordle/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { settingsActions } from '$lib/stores/settings.js';
	import { gameResults } from '$lib/stores/gameHistory.js';
	import { guessTheWordSettings } from '$lib/stores/guessTheWordSettings.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { WordleResult } from '$lib/games/wordle/types.js';

	const gameConfig = getGameConfig('wordle')!;

	// Read from URL params or fallback to store
	const params = $page.url.searchParams;

	const targetWords =
		(params.get('targetWords') as 'common' | 'all') || $guessTheWordSettings.targetWords;
	const hardMode = params.get('hardMode') === 'true' || $guessTheWordSettings.hardMode;
	const rescueMode = params.get('rescueMode') === 'true' || $guessTheWordSettings.rescueMode;
	const easyMode = params.get('easyMode') === 'true' || $guessTheWordSettings.easyMode;
	const wordLength = parseInt(params.get('wordLength') || '5') || $guessTheWordSettings.wordLength;

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
		{hardMode}
		{targetWords}
		{rescueMode}
		{easyMode}
		onGameComplete={handleGameComplete}
		onGameExit={handleGameExit}
	/>
</GameLayout>

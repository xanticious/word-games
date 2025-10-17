<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { WordleGame } from '$lib/games/wordle/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { settingsActions } from '$lib/stores/settings.js';
	import { gameResults } from '$lib/stores/gameHistory.js';
	import { goto } from '$app/navigation';
	import type { WordleResult } from '$lib/games/wordle/types.js';

	const gameConfig = getGameConfig('wordle')!;

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
		hardMode={false}
		onGameComplete={handleGameComplete}
		onGameExit={handleGameExit}
	/>
</GameLayout>

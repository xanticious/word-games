<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';

	const gameConfig = getGameConfig('anagrams')!;

	function handleGameExit() {
		goto('/');
	}

	function handleGameComplete(result: any) {
		console.log('Game completed:', result);
	}
</script>

<svelte:head>
	<title>Bag of Letters - Word Games Collection</title>
</svelte:head>

<GameLayout config={gameConfig} onGameExit={handleGameExit} onGameComplete={handleGameComplete}>
	<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
		<div class="mb-8 text-6xl">🎒</div>
		<h1 class="text-foreground mb-4 text-3xl font-bold">Bag of Letters</h1>
		<p class="text-muted-foreground mb-8 max-w-md text-lg">
			Create words from a set of given letters. Coming soon!
		</p>
		<div class="space-y-4">
			<div class="bg-muted/50 max-w-md rounded-lg p-6">
				<h3 class="mb-2 font-semibold">Game Features:</h3>
				<ul class="text-muted-foreground space-y-1 text-sm">
					<li>• Find as many words as possible</li>
					<li>• Score based on length and rarity</li>
					<li>• Multiple difficulty levels</li>
					<li>• Hint system available</li>
					<li>• Optional time limit</li>
				</ul>
			</div>
			<button
				onclick={handleGameExit}
				class="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			>
				Back to Games
			</button>
		</div>
	</div>
</GameLayout>

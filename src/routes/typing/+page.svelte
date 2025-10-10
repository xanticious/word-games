<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';

	const gameConfig = getGameConfig('typing')!;

	function handleGameExit() {
		goto('/');
	}

	function handleGameComplete(result: any) {
		console.log('Game completed:', result);
	}
</script>

<svelte:head>
	<title>Typing Challenge - Word Games Collection</title>
</svelte:head>

<GameLayout config={gameConfig} onGameExit={handleGameExit} onGameComplete={handleGameComplete}>
	<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
		<div class="mb-8 text-6xl">⌨️</div>
		<h1 class="text-foreground mb-4 text-3xl font-bold">Typing Challenge</h1>
		<p class="text-muted-foreground mb-8 max-w-md text-lg">
			Speed typing game with word-based challenges. Coming soon!
		</p>
		<div class="space-y-4">
			<div class="bg-muted/50 max-w-md rounded-lg p-6">
				<h3 class="mb-2 font-semibold">Game Features:</h3>
				<ul class="text-muted-foreground space-y-1 text-sm">
					<li>• WPM and accuracy tracking</li>
					<li>• Multiple challenge modes</li>
					<li>• Real-time feedback</li>
					<li>• Word sprint and quotes</li>
					<li>• Themed word categories</li>
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

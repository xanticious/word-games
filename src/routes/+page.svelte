<script lang="ts">
	import { GameCard } from '$lib/components/index.js';
	import { getAllGames } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	// Get all available games and sort alphabetically by name
	const games = getAllGames().sort((a, b) => a.name.localeCompare(b.name));

	// Handle game selection
	function handleGameClick(gameId: string) {
		// Find the game configuration and use its route
		const game = games.find((g) => g.id === gameId);
		const route = game?.route || `/${gameId}`;

		// Navigate to game using base path for GitHub Pages
		goto(`${base}${route}`);
	}
</script>

<svelte:head>
	<title>Word Games Collection - Home</title>
</svelte:head>

<div class="container py-8">
	<!-- Hero section -->
	<section class="py-8 text-center">
		<h1 class="text-foreground mb-3 text-4xl font-bold md:text-5xl">Word Games Collection</h1>
		<p class="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
			A collection of engaging word games built for unlimited play.
		</p>
	</section>

	<!-- All games section -->
	<section id="games">
		<div class="game-grid">
			{#each games as config}
				<GameCard {config} onclick={() => handleGameClick(config.id)} />
			{/each}
		</div>
	</section>
</div>

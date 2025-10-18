<script lang="ts">
	import { GameCard } from '$lib/components/index.js';
	import { settings, settingsActions } from '$lib/stores/settings.js';
	import { gameHistory } from '$lib/stores/gameHistory.js';
	import { getAllGames } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	// Get all available games
	const games = getAllGames();

	// Get current settings and game history
	let currentSettings = $state($settings);
	let recentGames = $state($gameHistory);

	// Subscribe to store changes
	settings.subscribe((s) => (currentSettings = s));
	gameHistory.subscribe((h) => (recentGames = h));

	// Handle game selection
	function handleGameClick(gameId: string) {
		// Add to recent games
		settingsActions.addRecentGame(gameId);

		// Navigate to game using base path for GitHub Pages
		goto(`${base}/${gameId}`);
	}

	// Handle favorite toggle
	function handleToggleFavorite(gameId: string) {
		settingsActions.toggleFavoriteGame(gameId);
	}

	// Get recent games with game configs
	let recentGamesWithConfig = $derived(
		recentGames
			.map((entry) => {
				const game = games.find((g) => g.id === entry.gameId);
				return game ? { ...entry, config: game } : null;
			})
			.filter((item): item is NonNullable<typeof item> => item !== null)
			.slice(0, 3)
	);

	// Get favorite games with configs
	let favoriteGamesWithConfig = $derived(
		currentSettings.favoriteGames
			.map((gameId) => games.find((g) => g.id === gameId))
			.filter((game): game is NonNullable<typeof game> => game !== undefined)
			.slice(0, 3)
	);
</script>

<svelte:head>
	<title>Word Games Collection - Home</title>
</svelte:head>

<div class="container py-8">
	<!-- Hero section -->
	<section class="py-12 text-center">
		<h1 class="text-foreground mb-4 text-4xl font-bold md:text-6xl">Word Games Collection</h1>
		<p class="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
			A collection of engaging word games built for unlimited play. No ads, no timers, no artificial
			limits - just pure word game enjoyment.
		</p>
		<div class="text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-sm">
			<span class="inline-flex items-center gap-2">
				<span class="text-green-500">✓</span>
				No Ads
			</span>
			<span class="inline-flex items-center gap-2">
				<span class="text-green-500">✓</span>
				Unlimited Play
			</span>
			<span class="inline-flex items-center gap-2">
				<span class="text-green-500">✓</span>
				Accessibility First
			</span>
			<span class="inline-flex items-center gap-2">
				<span class="text-green-500">✓</span>
				Privacy Focused
			</span>
		</div>
	</section>

	<!-- Recent games section -->
	{#if recentGamesWithConfig.length > 0}
		<section class="mb-12">
			<h2 class="text-foreground mb-6 text-2xl font-semibold">Continue Playing</h2>
			<div class="game-grid">
				{#each recentGamesWithConfig as { config }}
					<GameCard
						{config}
						isRecent={true}
						isFavorite={currentSettings.favoriteGames.includes(config.id)}
						onclick={() => handleGameClick(config.id)}
						onToggleFavorite={handleToggleFavorite}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Favorite games section -->
	{#if favoriteGamesWithConfig.length > 0}
		<section class="mb-12">
			<h2 class="text-foreground mb-6 text-2xl font-semibold">Your Favorites</h2>
			<div class="game-grid">
				{#each favoriteGamesWithConfig as config}
					<GameCard
						{config}
						isFavorite={true}
						isRecent={recentGames.some((r) => r.gameId === config.id)}
						onclick={() => handleGameClick(config.id)}
						onToggleFavorite={handleToggleFavorite}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- All games section -->
	<section id="games">
		<h2 class="text-foreground mb-6 text-2xl font-semibold">All Games</h2>
		<div class="game-grid">
			{#each games as config}
				<GameCard
					{config}
					isFavorite={currentSettings.favoriteGames.includes(config.id)}
					isRecent={recentGames.some((r) => r.gameId === config.id)}
					onclick={() => handleGameClick(config.id)}
					onToggleFavorite={handleToggleFavorite}
				/>
			{/each}
		</div>
	</section>

	<!-- Features section -->
	<section class="border-border mt-16 border-t py-16">
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
			<div class="text-center">
				<div class="mb-4 text-3xl">🎯</div>
				<h3 class="text-foreground mb-2 font-semibold">5 Classic Games</h3>
				<p class="text-muted-foreground text-sm">
					Wordle, Word Search, Anagrams, Typing Challenge, and Rhyme games
				</p>
			</div>
			<div class="text-center">
				<div class="mb-4 text-3xl">🎨</div>
				<h3 class="text-foreground mb-2 font-semibold">Accessibility First</h3>
				<p class="text-muted-foreground text-sm">
					Light, dark, and high contrast themes with adjustable text sizes
				</p>
			</div>
			<div class="text-center">
				<div class="mb-4 text-3xl">📱</div>
				<h3 class="text-foreground mb-2 font-semibold">Responsive Design</h3>
				<p class="text-muted-foreground text-sm">
					Optimized for desktop, tablet, and mobile devices
				</p>
			</div>
			<div class="text-center">
				<div class="mb-4 text-3xl">🔒</div>
				<h3 class="text-foreground mb-2 font-semibold">Privacy Focused</h3>
				<p class="text-muted-foreground text-sm">
					All data stored locally, no tracking or analytics
				</p>
			</div>
		</div>
	</section>
</div>

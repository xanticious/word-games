<script lang="ts">
	import type { GameConfig, GameResult } from '$lib/types';

	interface Props {
		config: GameConfig;
		difficulty?: 'easy' | 'medium' | 'hard';
		onGameComplete?: (result: GameResult) => void;
		onGameExit?: () => void;
		children: any;
	}

	let { config, difficulty = 'medium', onGameComplete, onGameExit, children }: Props = $props();

	let gameStartTime = $state(Date.now());
	let isGameActive = $state(true);

	function handleExit() {
		isGameActive = false;
		onGameExit?.();
	}

	function handleComplete(result: Partial<GameResult>) {
		const fullResult: GameResult = {
			gameId: config.id,
			difficulty,
			score: result.score || 0,
			timeElapsed: Math.floor((Date.now() - gameStartTime) / 1000),
			completed: result.completed || false,
			timestamp: Date.now(),
			details: result.details || {}
		};

		isGameActive = false;
		onGameComplete?.(fullResult);
	}
</script>

<div class="game-layout bg-background text-foreground min-h-screen">
	<!-- Game Header -->
	<header
		class="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur"
	>
		<div class="container flex h-14 items-center justify-between">
			<div class="flex items-center gap-4">
				<button
					onclick={handleExit}
					class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
					aria-label="Exit game"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					Back
				</button>
				<div>
					<h1 class="text-lg font-semibold">{config.name}</h1>
					<p class="text-muted-foreground text-sm capitalize">{difficulty} difficulty</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm">
					{config.estimatedPlayTime}min play
				</span>
			</div>
		</div>
	</header>

	<!-- Game Content -->
	<main class="container flex-1 py-6">
		{@render children()}
	</main>

	<!-- Game Footer -->
	<footer class="border-border bg-muted/50 border-t py-4">
		<div class="text-muted-foreground container flex items-center justify-between text-sm">
			<div class="flex items-center gap-4">
				<span>{config.category.replace('-', ' ')}</span>
				<span>•</span>
				<span>{config.description}</span>
			</div>

			{#if config.features.length > 0}
				<div class="flex items-center gap-2">
					{#each config.features.slice(0, 3) as feature}
						<span
							class="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
						>
							{feature}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</footer>
</div>

<style>
	.game-layout {
		display: flex;
		flex-direction: column;
	}
</style>

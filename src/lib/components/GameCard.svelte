<script lang="ts">
	import type { GameConfig } from '$lib/types';

	interface Props {
		config: GameConfig;
		isFavorite?: boolean;
		isRecent?: boolean;
		onclick?: () => void;
		onToggleFavorite?: (gameId: string) => void;
		compact?: boolean;
	}

	let {
		config,
		isFavorite = false,
		isRecent = false,
		onclick,
		onToggleFavorite,
		compact = false
	}: Props = $props();

	function handleCardClick() {
		onclick?.();
	}

	function handleFavoriteClick(event: MouseEvent) {
		event.stopPropagation();
		onToggleFavorite?.(config.id);
	}

	function getCategoryIcon(category: string) {
		switch (category) {
			case 'word-guessing':
				return '🎯';
			case 'puzzle':
				return '🧩';
			case 'speed':
				return '⚡';
			case 'creative':
				return '🎨';
			default:
				return '🎮';
		}
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return 'text-green-600 bg-green-50 border-green-200';
			case 'medium':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'hard':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	}
</script>

<div
	class="game-card border-border bg-card text-card-foreground group relative cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md {compact
		? 'p-3'
		: 'p-4'}"
	onclick={handleCardClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
	aria-label="Play {config.name}"
>
	<!-- Favorite button -->
	{#if onToggleFavorite}
		<button
			onclick={handleFavoriteClick}
			class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium opacity-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-hover:opacity-100"
			aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		>
			{#if isFavorite}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="currentColor"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-yellow-500"
				>
					<polygon
						points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
					/>
				</svg>
			{:else}
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
					<polygon
						points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
					/>
				</svg>
			{/if}
		</button>
	{/if}

	<!-- Status indicators -->
	<div class="absolute left-2 top-2 flex gap-1">
		{#if isRecent}
			<span
				class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
			>
				Recent
			</span>
		{/if}
		{#if isFavorite}
			<span
				class="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700"
			>
				⭐
			</span>
		{/if}
	</div>

	<!-- Game Icon -->
	<div class="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl">
		{config.icon || getCategoryIcon(config.category)}
	</div>

	<!-- Game Info -->
	<div class="space-y-2">
		<div>
			<h3 class="font-semibold leading-none tracking-tight {compact ? 'text-base' : 'text-lg'}">
				{config.name}
			</h3>
			{#if !compact}
				<p class="text-muted-foreground mt-1 text-sm">{config.description}</p>
			{/if}
		</div>

		<!-- Game metadata -->
		<div class="text-muted-foreground flex items-center justify-between text-xs">
			<div class="flex items-center gap-2">
				<span class="capitalize">{config.category.replace('-', ' ')}</span>
				<span>•</span>
				<span>{config.estimatedPlayTime}min</span>
			</div>
		</div>

		<!-- Difficulty levels -->
		{#if !compact && config.difficulty.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each config.difficulty as difficulty}
					<span
						class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium {getDifficultyColor(
							difficulty
						)}"
					>
						{difficulty}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Features -->
		{#if !compact && config.features.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each config.features.slice(0, 3) as feature}
					<span
						class="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
					>
						{feature}
					</span>
				{/each}
				{#if config.features.length > 3}
					<span
						class="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
					>
						+{config.features.length - 3}
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Hover effect -->
	<div
		class="bg-primary/5 absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
	></div>
</div>

<style>
	.game-card {
		min-height: 180px;
	}

	.game-card.compact {
		min-height: 120px;
	}
</style>

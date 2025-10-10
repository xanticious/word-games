<script lang="ts">
	import type { DifficultyConfig } from '$lib/types';

	interface Props {
		currentDifficulty: 'easy' | 'medium' | 'hard';
		difficulties: DifficultyConfig[];
		onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void;
		disabled?: boolean;
		showDescription?: boolean;
	}

	let {
		currentDifficulty,
		difficulties,
		onDifficultyChange,
		disabled = false,
		showDescription = false
	}: Props = $props();

	function handleDifficultySelect(difficulty: 'easy' | 'medium' | 'hard') {
		if (!disabled) {
			onDifficultyChange?.(difficulty);
		}
	}
</script>

<div class="difficulty-selector space-y-2">
	{#if showDescription}
		<div
			class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Difficulty Level
		</div>
	{/if}

	<div class="flex gap-2" role="radiogroup" aria-label="Difficulty selection">
		{#each difficulties as difficulty}
			<button
				onclick={() => handleDifficultySelect(difficulty.id)}
				class="ring-offset-background focus-visible:ring-ring inline-flex min-h-[36px] flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 {currentDifficulty ===
				difficulty.id
					? `bg-${difficulty.color} border-${difficulty.color} text-${difficulty.color}-foreground shadow hover:bg-${difficulty.color}/80`
					: 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}"
				role="radio"
				aria-checked={currentDifficulty === difficulty.id}
				{disabled}
				title={difficulty.description}
			>
				<div class="flex flex-col items-center gap-1">
					<span class="font-medium">{difficulty.displayName}</span>
					{#if showDescription}
						<span class="text-muted-foreground text-center text-xs">
							{difficulty.description}
						</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	{#if !showDescription}
		<!-- Show description for current difficulty as helper text -->
		<p class="text-muted-foreground text-center text-xs">
			{difficulties.find((d) => d.id === currentDifficulty)?.description || ''}
		</p>
	{/if}
</div>

<style>
	/* Custom styles for difficulty colors */
	.difficulty-selector :global(.bg-green-500) {
		background-color: rgb(34 197 94);
	}
	.difficulty-selector :global(.border-green-500) {
		border-color: rgb(34 197 94);
	}
	.difficulty-selector :global(.text-green-500-foreground) {
		color: white;
	}
	.difficulty-selector :global(.hover\:bg-green-500\/80:hover) {
		background-color: rgb(34 197 94 / 0.8);
	}

	.difficulty-selector :global(.bg-yellow-500) {
		background-color: rgb(234 179 8);
	}
	.difficulty-selector :global(.border-yellow-500) {
		border-color: rgb(234 179 8);
	}
	.difficulty-selector :global(.text-yellow-500-foreground) {
		color: white;
	}
	.difficulty-selector :global(.hover\:bg-yellow-500\/80:hover) {
		background-color: rgb(234 179 8 / 0.8);
	}

	.difficulty-selector :global(.bg-red-500) {
		background-color: rgb(239 68 68);
	}
	.difficulty-selector :global(.border-red-500) {
		border-color: rgb(239 68 68);
	}
	.difficulty-selector :global(.text-red-500-foreground) {
		color: white;
	}
	.difficulty-selector :global(.hover\:bg-red-500\/80:hover) {
		background-color: rgb(239 68 68 / 0.8);
	}
</style>

<script lang="ts">
	import type { WordEntry } from './types.js';

	interface Props {
		words: WordEntry[];
		foundWords: string[]; // Array of gridValues that have been found
	}

	let { words, foundWords }: Props = $props();

	// Check if a word has been found (compare against gridValue)
	function isFound(word: WordEntry): boolean {
		return foundWords.includes(word.gridValue);
	}

	// Determine if we should use two columns
	const useTwoColumns = $derived(words.length > 10);
</script>

<div class="word-list">
	<h3 class="word-list-title text-center">Words to Find</h3>
	<ul class="words" class:two-columns={useTwoColumns} style:--word-count={words.length}>
		{#each words as word}
			<li class="word-item" class:found={isFound(word)}>
				{word.displayValue}
			</li>
		{/each}
	</ul>
	<div class="progress">
		{foundWords.length} / {words.length} found
	</div>
</div>

<style>
	.word-list {
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
		padding: 1.5rem;
		min-width: 12rem;
	}

	.word-list-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.words {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.words.two-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-auto-flow: column;
		grid-template-rows: repeat(auto-fill, auto);
		gap: 0.1rem 2rem;
	}

	.words.two-columns {
		/* Calculate the number of rows needed */
		grid-template-rows: repeat(calc((var(--word-count) + 1) / 2), auto);
	}

	.word-item {
		padding: 0.5rem;
		background: hsl(var(--background));
		border-radius: 0.25rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.word-item.found {
		text-decoration: line-through;
		color: hsl(var(--muted-foreground) / 0.5);
		background: hsl(var(--muted) / 0.5);
		opacity: 0.6;
	}

	.progress {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-align: center;
	}
</style>

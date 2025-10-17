<!--
	WordleGrid.svelte - The main letter grid for Wordle
-->

<script lang="ts">
	import WordleRow from './WordleRow.svelte';
	import type { WordleGuess } from './types.js';

	interface Props {
		guesses: WordleGuess[];
		currentRow: number;
		wordLength?: number;
	}

	let { guesses, currentRow, wordLength = 5 }: Props = $props();
</script>

<div class="wordle-grid flex flex-col gap-1 p-4" role="grid" aria-label="Wordle game grid">
	{#each guesses as guess, index}
		<WordleRow {guess} isActive={index === currentRow} animate={guess.isSubmitted} {wordLength} />
	{/each}
</div>

<style>
	.wordle-grid {
		max-width: fit-content;
		margin: 0 auto;
	}

	/* Responsive padding */
	@media (max-width: 640px) {
		.wordle-grid {
			padding: 1rem;
		}
	}
</style>

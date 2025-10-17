<!--
	WordleRow.svelte - A single guess row in the Wordle grid
-->

<script lang="ts">
	import WordleCell from './WordleCell.svelte';
	import type { WordleGuess } from './types.js';

	interface Props {
		guess: WordleGuess;
		isActive?: boolean;
		animate?: boolean;
		wordLength?: number;
	}

	let { guess, isActive = false, animate = false, wordLength = 5 }: Props = $props();
</script>

<div
	class="wordle-row flex justify-center gap-1"
	role="row"
	aria-label={isActive
		? 'Current guess row'
		: guess.isSubmitted
			? `Submitted guess: ${guess.word}`
			: 'Empty guess row'}
>
	{#each guess.letters as letter, index}
		<WordleCell
			letter={letter.letter}
			cellState={letter.state}
			isActive={isActive && index === guess.word.length}
			{animate}
		/>
	{/each}
</div>

<style>
	.wordle-row {
		/* Ensure consistent spacing */
		min-height: 4rem;
		align-items: center;
	}

	/* Responsive gap */
	@media (max-width: 640px) {
		.wordle-row {
			gap: 0.25rem;
		}
	}
</style>

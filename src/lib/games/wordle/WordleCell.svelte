<!--
	WordleCell.svelte - Individual letter cell in the Wordle grid
-->

<script lang="ts">
	import type { LetterState } from './types.js';

	interface Props {
		letter: string;
		cellState: LetterState;
		isActive?: boolean;
		animate?: boolean;
	}

	let { letter = '', cellState = 'unused', isActive = false, animate = false }: Props = $props();

	// CSS classes for different states
	const stateClasses = {
		unused: 'border-gray-600 bg-background',
		correct: 'border-green-500 bg-green-500 text-white',
		present: 'border-yellow-500 bg-yellow-500 text-white',
		absent: 'border-gray-400 bg-gray-400 text-white'
	};

	// Animation class
	let animationClass = $state('');

	// Trigger animation only when explicitly requested and cell has a state
	$effect(() => {
		if (animate && cellState !== 'unused') {
			animationClass = 'animate-flip';
			setTimeout(() => {
				animationClass = '';
			}, 600);
		}
	});
</script>

<div
	class={`
		wordle-cell
		${stateClasses[cellState]}
		${isActive ? 'border-foreground border-2' : 'border'}
		${animationClass}
		relative flex h-14 w-14 items-center justify-center
		text-xl font-bold uppercase transition-all duration-200
		select-none
	`}
	role="gridcell"
	aria-label={letter ? `Letter ${letter}, ${cellState}` : 'Empty cell'}
>
	{letter}
</div>

<style>
	.wordle-cell {
		/* Ensure consistent sizing */
		min-width: 3.5rem;
		min-height: 3.5rem;
	}

	@keyframes flip {
		0% {
			transform: rotateX(0);
		}
		50% {
			transform: rotateX(-90deg);
		}
		100% {
			transform: rotateX(0);
		}
	}

	.animate-flip {
		animation: flip 0.6s ease-in-out;
	}

	/* Responsive sizing */
	@media (max-width: 640px) {
		.wordle-cell {
			min-width: 2.5rem;
			min-height: 2.5rem;
			font-size: 1rem;
		}
	}
</style>

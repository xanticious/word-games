<!--
	WordleKeyboard.svelte - Virtual keyboard for Wordle
-->

<script lang="ts">
	import type { LetterState } from './types.js';

	interface Props {
		letterStates: Record<string, LetterState>;
		onKeyPress: (key: string) => void;
		onEnter: () => void;
		onBackspace: () => void;
		disabled?: boolean;
	}

	let { letterStates, onKeyPress, onEnter, onBackspace, disabled = false }: Props = $props();

	// Keyboard layout
	const keyboardRows = [
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
	];

	// Key styling based on state
	function getKeyClass(key: string): string {
		if (key === 'ENTER' || key === 'BACKSPACE') {
			return 'bg-gray-300 hover:bg-gray-400 text-black px-2 text-sm';
		}

		const letterState = letterStates[key.toLowerCase()];
		const baseClass = 'px-3 py-2 text-sm font-semibold';

		switch (letterState) {
			case 'correct':
				return `${baseClass} bg-green-500 text-white`;
			case 'present':
				return `${baseClass} bg-yellow-500 text-white`;
			case 'absent':
				return `${baseClass} bg-gray-400 text-white`;
			default:
				return `${baseClass} bg-gray-200 hover:bg-gray-300 text-black`;
		}
	}

	function handleKeyClick(key: string) {
		if (disabled) return;

		if (key === 'ENTER') {
			onEnter();
		} else if (key === 'BACKSPACE') {
			onBackspace();
		} else {
			onKeyPress(key);
		}
	}

	// Keyboard event handling
	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;

		const key = event.key.toUpperCase();

		if (key === 'ENTER') {
			event.preventDefault();
			onEnter();
		} else if (key === 'BACKSPACE') {
			event.preventDefault();
			onBackspace();
		} else if (/^[A-Z]$/.test(key)) {
			event.preventDefault();
			onKeyPress(key);
		}
	}
</script>

<!-- Keyboard event listener -->
<svelte:window on:keydown={handleKeyDown} />

<div
	class="wordle-keyboard mx-auto flex max-w-lg flex-col gap-2 p-4"
	role="group"
	aria-label="Virtual keyboard"
>
	{#each keyboardRows as row}
		<div class="flex justify-center gap-1">
			{#each row as key}
				<button
					class={`
						${getKeyClass(key)}
						min-h-[40px] min-w-[32px] rounded
						border border-gray-300
						transition-colors duration-150
						focus:ring-2 focus:ring-blue-500
						focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
					`}
					onclick={() => handleKeyClick(key)}
					{disabled}
					aria-label={key === 'BACKSPACE'
						? 'Backspace'
						: key === 'ENTER'
							? 'Enter'
							: `Letter ${key}`}
				>
					{#if key === 'BACKSPACE'}
						⌫
					{:else if key === 'ENTER'}
						ENTER
					{:else}
						{key}
					{/if}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.wordle-keyboard {
		user-select: none;
	}

	/* Responsive keyboard */
	@media (max-width: 640px) {
		.wordle-keyboard {
			padding: 1rem 0.5rem;
		}

		.wordle-keyboard button {
			min-width: 28px;
			min-height: 36px;
			font-size: 0.75rem;
		}

		.wordle-keyboard .gap-1 {
			gap: 0.125rem;
		}
	}
</style>

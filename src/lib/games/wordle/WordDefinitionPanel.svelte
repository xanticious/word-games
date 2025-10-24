<!--
	WordDefinitionPanel.svelte - Side panel showing word definition after game completion
-->

<script lang="ts">
	import { GameDictionary } from '$lib/dictionary.js';
	import type { DefinitionEntry } from '$lib/dictionary.js';

	interface Props {
		targetWord: string;
		gameStatus: 'won' | 'lost';
		isVisible: boolean;
	}

	let { targetWord, gameStatus, isVisible }: Props = $props();

	let definition = $state<DefinitionEntry | null>(null);
	let isLoading = $state(false);
	let error = $state('');

	// Load definition when the panel becomes visible
	$effect(() => {
		if (isVisible && targetWord) {
			loadDefinition();
		}
	});

	async function loadDefinition() {
		isLoading = true;
		error = '';

		try {
			const dictionary = new GameDictionary();
			await dictionary.loadDictionaries();
			definition = dictionary.getDefinition(targetWord);

			if (!definition) {
				error = 'Definition not found';
			}
		} catch (err) {
			console.error('Error loading definition:', err);
			error = 'Failed to load definition';
		} finally {
			isLoading = false;
		}
	}
</script>

{#if isVisible}
	<div
		class="word-definition-panel bg-background border-border fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] w-80 border-l bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out"
	>
		<!-- Panel Header -->
		<div class="mb-6">
			<div class="mb-2 flex items-center gap-2">
				{#if gameStatus === 'won'}
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600"
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
							<path d="M9 12l2 2 4-4" />
							<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64" />
						</svg>
					</div>
					<h2 class="text-lg font-semibold text-green-600">Correct!</h2>
				{:else}
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600"
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
							<circle cx="12" cy="12" r="10" />
							<path d="m15 9-6 6" />
							<path d="m9 9 6 6" />
						</svg>
					</div>
					<h2 class="text-lg font-semibold text-red-600">The word was:</h2>
				{/if}
			</div>

			<div class="text-3xl font-bold tracking-wider text-gray-800 uppercase">
				{targetWord}
			</div>
		</div>

		<!-- Definition Content -->
		<div class="flex-1">
			{#if isLoading}
				<div class="flex items-center justify-center py-8">
					<div class="border-primary mx-auto h-6 w-6 animate-spin rounded-full border-b-2"></div>
				</div>
			{:else if error}
				<div class="py-8 text-center">
					<div class="text-muted-foreground text-sm">{error}</div>
				</div>
			{:else if definition}
				<div class="space-y-4">
					{#if definition.pronunciation}
						<div class="text-muted-foreground text-sm">
							<span class="font-medium">Pronunciation:</span>
							<span class="ml-1 font-mono">{definition.pronunciation}</span>
						</div>
					{/if}

					{#if definition.partOfSpeech}
						<div class="text-muted-foreground text-sm">
							<span
								class="bg-secondary text-secondary-foreground inline-block rounded-full px-2 py-1 text-xs font-medium"
							>
								{definition.partOfSpeech}
							</span>
						</div>
					{/if}

					<div class="space-y-3">
						<h3 class="font-semibold">Definition{definition.definitions.length > 1 ? 's' : ''}:</h3>
						<div class="space-y-2">
							{#each definition.definitions as def, index}
								<div class="text-muted-foreground text-sm leading-relaxed">
									{#if definition.definitions.length > 1}
										<span class="font-medium">{index + 1}.</span>
									{/if}
									{def}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="py-8 text-center">
					<div class="text-muted-foreground text-sm">No definition available</div>
				</div>
			{/if}
		</div>

		<!-- Panel Footer -->
		<div class="border-border mt-6 border-t pt-4">
			<div class="text-muted-foreground text-center text-xs">Learn new words with every game!</div>
		</div>
	</div>
{/if}

<style>
	.word-definition-panel {
		/* Ensure panel appears above other content */
		transform: translateX(0);
	}

	/* Mobile responsive adjustments */
	@media (max-width: 768px) {
		.word-definition-panel {
			width: 100vw;
			right: 0;
			left: 0;
			height: 50vh;
			top: auto;
			bottom: 0;
			border-left: none;
			border-top: 1px solid var(--border);
		}
	}
</style>

<script lang="ts">
	import { GameDictionary } from '$lib/dictionary.js';
	import type { DefinitionEntry } from '$lib/dictionary.js';

	interface WordHistoryEntry {
		word: string;
		definition: DefinitionEntry | null;
		isLoading: boolean;
		error: string;
	}

	let searchInput = $state<string>('');
	let wordHistory = $state<WordHistoryEntry[]>([]);
	let expandedWordIndex = $state<number>(-1); // Index of currently expanded word
	let dictionary: GameDictionary | null = null;

	// Initialize dictionary once on mount
	$effect(() => {
		if (!dictionary) {
			initializeDictionary();
		}
	});

	async function initializeDictionary() {
		try {
			dictionary = new GameDictionary();
			await dictionary.loadDictionaries();
		} catch (err) {
			console.error('Error loading dictionary:', err);
		}
	}

	async function handleSearch() {
		if (!dictionary || !searchInput.trim()) return;

		const normalizedWord = searchInput
			.toLowerCase()
			.trim()
			.replace(/[^a-z]/g, '');
		if (!normalizedWord || normalizedWord.length < 2) return;

		// Don't add duplicates if already at the top
		if (wordHistory.length > 0 && wordHistory[0].word === normalizedWord) {
			expandedWordIndex = 0; // Just expand it
			return;
		}

		// Create a new entry for this word
		const newEntry: WordHistoryEntry = {
			word: normalizedWord,
			definition: null,
			isLoading: true,
			error: ''
		};

		// Add to the beginning of history
		wordHistory = [newEntry, ...wordHistory];
		expandedWordIndex = 0; // Expand the newly added word
		searchInput = ''; // Clear the search input

		// Load its definition
		try {
			const def = await dictionary.getDefinitionWithFallback(normalizedWord);

			// Update the entry
			wordHistory[0] = {
				...wordHistory[0],
				definition: def,
				isLoading: false,
				error: def ? '' : 'Definition not found'
			};
		} catch (err) {
			console.error(`Error loading definition for ${normalizedWord}:`, err);
			wordHistory[0] = {
				...wordHistory[0],
				isLoading: false,
				error: 'Failed to load definition'
			};
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	function toggleWordExpansion(index: number) {
		expandedWordIndex = expandedWordIndex === index ? -1 : index;
	}

	/**
	 * Handle clicking on a word within a definition
	 */
	async function handleWordClick(word: string, event: MouseEvent) {
		event.stopPropagation();

		if (!dictionary) return;

		// Normalize the word
		const normalizedWord = word.toLowerCase().replace(/[^a-z]/g, '');
		if (!normalizedWord || normalizedWord.length < 2) return;

		// Don't add duplicates if already at the top
		if (wordHistory.length > 0 && wordHistory[0].word === normalizedWord) {
			expandedWordIndex = 0; // Just expand it
			return;
		}

		// Create a new entry for this word
		const newEntry: WordHistoryEntry = {
			word: normalizedWord,
			definition: null,
			isLoading: true,
			error: ''
		};

		// Add to the beginning of history
		wordHistory = [newEntry, ...wordHistory];
		expandedWordIndex = 0; // Expand the newly added word

		// Load its definition
		try {
			const def = await dictionary.getDefinitionWithFallback(normalizedWord);

			// Update the entry
			wordHistory[0] = {
				...wordHistory[0],
				definition: def,
				isLoading: false,
				error: def ? '' : 'Definition not found'
			};
		} catch (err) {
			console.error(`Error loading definition for ${normalizedWord}:`, err);
			wordHistory[0] = {
				...wordHistory[0],
				isLoading: false,
				error: 'Failed to load definition'
			};
		}
	}

	/**
	 * Convert definition text to clickable words
	 */
	function makeDefinitionClickable(text: string): { word: string; isClickable: boolean }[] {
		// Split by spaces and punctuation but keep the separators
		const parts = text.split(/(\s+|[,;.!?()"])/);

		return parts.map((part) => {
			const cleanWord = part.replace(/[^a-zA-Z]/g, '').toLowerCase();
			// Make it clickable if it's a word (not punctuation/whitespace) and not too short
			const isClickable = cleanWord.length >= 3 && /^[a-z]+$/.test(cleanWord);
			return { word: part, isClickable };
		});
	}
</script>

<svelte:head>
	<title>Dictionary - Word Games Collection</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<section class="mb-8">
		<h1 class="text-foreground mt-4 mb-4 text-4xl font-bold">Dictionary</h1>
		<p class="text-muted-foreground mb-6 text-xl">
			Look up word definitions, pronunciations, and more.
		</p>

		<!-- Search Box -->
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchInput}
				onkeydown={handleKeydown}
				placeholder="Enter a word to look up..."
				class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
			/>
			<button
				onclick={handleSearch}
				disabled={!searchInput.trim()}
				class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				Look Up
			</button>
		</div>
	</section>

	<!-- Word History -->
	<section>
		{#if wordHistory.length === 0}
			<div class="bg-card border-border rounded-lg border p-8 text-center">
				<p class="text-muted-foreground text-lg">
					Start by searching for a word above. Click on words in definitions to explore related
					terms.
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each wordHistory as entry, index}
					<div class="bg-card border-border rounded-lg border shadow-sm">
						<!-- Word Header - Always Visible -->
						<button
							class="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
							onclick={() => toggleWordExpansion(index)}
						>
							<div class="flex items-center gap-3">
								<span class="text-2xl font-bold tracking-wide text-gray-800 uppercase">
									{entry.word}
								</span>
							</div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="transition-transform duration-200 {expandedWordIndex === index
									? 'rotate-180'
									: ''}"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</button>

						<!-- Definition Content - Expandable -->
						{#if expandedWordIndex === index}
							<div class="border-t border-gray-200 px-6 pt-4 pb-6">
								{#if entry.isLoading}
									<div class="flex items-center justify-center py-8">
										<div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
									</div>
								{:else if entry.error}
									<div class="py-8 text-center">
										<div class="text-lg text-gray-500">{entry.error}</div>
									</div>
								{:else if entry.definition && entry.definition.sources}
									<div class="space-y-6">
										{#each entry.definition.sources as source}
											<div class="space-y-3 border-b border-gray-100 pb-4 last:border-b-0">
												<!-- Source Header -->
												<h4 class="text-sm font-bold tracking-wide text-gray-500 uppercase">
													{source.source === 'websters'
														? "Webster's Unabridged Dictionary (~1913)"
														: 'Wiktionary'}
												</h4>

												<!-- Pronunciation -->
												{#if source.pronunciation}
													<div class="text-base text-gray-600">
														<span class="font-medium">Pronunciation:</span>
														<span class="ml-2 font-mono">{source.pronunciation}</span>
													</div>
												{/if}

												<!-- Part of Speech -->
												{#if source.partOfSpeech}
													<div>
														<span
															class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
														>
															{source.partOfSpeech}
														</span>
													</div>
												{/if}

												<!-- Definitions with clickable words -->
												<div class="space-y-3">
													<h5 class="text-sm font-semibold text-gray-700">
														Definition{source.definitions.length > 1 ? 's' : ''}:
													</h5>
													<div class="space-y-3">
														{#each source.definitions as def, defIndex}
															<div class="text-base leading-relaxed text-gray-700">
																{#if source.definitions.length > 1}
																	<span class="font-medium">{defIndex + 1}.</span>
																{/if}
																{#each makeDefinitionClickable(def) as part}
																	{#if part.isClickable}
																		<button
																			class="clickable-word rounded px-0.5 transition-colors hover:bg-blue-100 hover:underline"
																			onclick={(e) => handleWordClick(part.word, e)}
																		>
																			{part.word}
																		</button>
																	{:else}
																		{part.word}
																	{/if}
																{/each}
															</div>
														{/each}
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="py-8 text-center">
										<div class="text-lg text-gray-500">No definition available</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.clickable-word {
		cursor: pointer;
		color: inherit;
		text-decoration: none;
		display: inline;
		padding: 0 2px;
		border-radius: 2px;
	}

	.clickable-word:hover {
		background-color: rgb(219 234 254); /* bg-blue-100 */
		text-decoration: underline;
	}
</style>

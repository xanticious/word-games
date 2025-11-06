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
		guessedWords?: string[]; // All guessed words from the current game
	}

	interface WordHistoryEntry {
		word: string;
		definition: DefinitionEntry | null;
		isLoading: boolean;
		error: string;
		isTarget?: boolean; // Is this the target word?
	}

	let { targetWord, gameStatus, isVisible, guessedWords = [] }: Props = $props();

	let wordHistory = $state<WordHistoryEntry[]>([]);
	let expandedWordIndex = $state<number>(0); // Index of currently expanded word
	let dictionary: GameDictionary | null = null;
	let lastProcessedKey = $state<string>(''); // Track what we've already processed
	let clickedWords = $state<Set<string>>(new Set()); // Track words user has clicked on

	// Initialize dictionary once
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

	// Build word history when panel becomes visible or guessed words change
	// Use a key to prevent infinite loops
	$effect(() => {
		if (isVisible && targetWord && dictionary) {
			// Create a unique key based on the current state
			const currentKey = `${targetWord}-${gameStatus}-${guessedWords.join(',')}`;

			// Only rebuild if something actually changed
			if (currentKey !== lastProcessedKey) {
				lastProcessedKey = currentKey;
				clickedWords = new Set(); // Reset clicked words when rebuilding
				buildWordHistory();
			}
		}
	});

	async function buildWordHistory() {
		if (!dictionary) return;

		// Combine guessed words + target word (only show target if game is complete)
		const allWords: Array<{ word: string; isTarget: boolean }> = [];

		// Add all guessed words (in reverse order - most recent first)
		for (let i = guessedWords.length - 1; i >= 0; i--) {
			allWords.push({ word: guessedWords[i], isTarget: false });
		}

		// Add target word at the end if game is complete
		if (gameStatus === 'won' || gameStatus === 'lost') {
			allWords.push({ word: targetWord, isTarget: true });
		}

		// Keep only last 10 words
		const wordsToShow = allWords.slice(0, 10);

		// Create history entries
		const newHistory: WordHistoryEntry[] = wordsToShow.map(({ word, isTarget }) => ({
			word,
			definition: null,
			isLoading: true,
			error: '',
			isTarget
		}));

		wordHistory = newHistory;

		// Load definitions asynchronously
		for (let i = 0; i < wordHistory.length; i++) {
			loadDefinitionForWord(i);
		}
	}

	async function loadDefinitionForWord(index: number) {
		if (!dictionary) return;

		const entry = wordHistory[index];
		if (!entry) return;

		try {
			// Use the new fallback method that tries Wiktionary if local fails
			const def = await dictionary.getDefinitionWithFallback(entry.word);

			// Use array mutation instead of reassignment to avoid triggering effects
			const updatedEntry = {
				...entry,
				definition: def,
				isLoading: false,
				error: def ? '' : 'Definition not found'
			};

			// Update the specific entry
			wordHistory[index] = updatedEntry;
		} catch (err) {
			console.error(`Error loading definition for ${entry.word}:`, err);
			wordHistory[index] = {
				...entry,
				isLoading: false,
				error: 'Failed to load definition'
			};
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
			return;
		}

		// Mark this word as clicked
		clickedWords.add(normalizedWord);

		// Create a new entry for this word
		const newEntry: WordHistoryEntry = {
			word: normalizedWord,
			definition: null,
			isLoading: true,
			error: '',
			isTarget: false
		};

		// Add to the beginning of history
		wordHistory = [newEntry, ...wordHistory.slice(0, 9)]; // Keep max 10 words
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

{#if isVisible}
	<div
		class="word-definition-panel bg-background border-border fixed top-16 right-0 z-40 flex h-[calc(100vh-4rem)] w-80 flex-col overflow-hidden border-l bg-white shadow-lg transition-transform duration-300 ease-in-out"
	>
		<!-- Panel Header -->
		<div class="border-b border-gray-200 p-6 pb-4">
			{#if gameStatus === 'won' || gameStatus === 'lost'}
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
								<path
									d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"
								/>
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
						<h2 class="text-lg font-semibold text-red-600">Game Over</h2>
					{/if}
				</div>
			{/if}
			<h3 class="text-sm font-medium text-gray-600">Word History</h3>
		</div>

		<!-- Word History - Scrollable -->
		<div class="flex-1 overflow-y-auto">
			{#if wordHistory.length === 0}
				<div class="p-6 text-center text-sm text-gray-500">No words to display yet</div>
			{:else}
				<div class="divide-y divide-gray-200">
					{#each wordHistory as entry, index}
						<div class="word-history-entry">
							<!-- Word Header - Always Visible -->
							<button
								class="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
								onclick={() => toggleWordExpansion(index)}
							>
								<div class="flex items-center gap-3">
									{#if entry.isTarget}
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600"
										>
											★
										</div>
									{:else}
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600"
										>
											{wordHistory.length - index}
										</div>
									{/if}
									<span class="text-lg font-semibold tracking-wide text-gray-800 uppercase">
										{entry.word}
									</span>
								</div>
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
									class="transition-transform duration-200 {expandedWordIndex === index
										? 'rotate-180'
										: ''}"
								>
									<path d="m6 9 6 6 6-6" />
								</svg>
							</button>

							<!-- Definition Content - Expandable -->
							{#if expandedWordIndex === index}
								<div class="px-6 pb-4">
									{#if entry.isLoading}
										<div class="flex items-center justify-center py-4">
											<div
												class="border-primary h-5 w-5 animate-spin rounded-full border-b-2"
											></div>
										</div>
									{:else if entry.error}
										<div class="py-4 text-center">
											<div class="text-sm text-gray-500">{entry.error}</div>
										</div>
									{:else if entry.definition && entry.definition.sources}
										<div class="space-y-4">
											{#each entry.definition.sources as source}
												<div class="space-y-2 border-b border-gray-100 pb-3 last:border-b-0">
													<!-- Source Header -->
													<h4 class="text-xs font-bold tracking-wide text-gray-500 uppercase">
														{source.source === 'websters'
															? "Webster's Unabridged Dictionary (~1913)"
															: 'Wiktionary'}
													</h4>

													<!-- Pronunciation -->
													{#if source.pronunciation}
														<div class="text-sm text-gray-600">
															<span class="font-medium">Pronunciation:</span>
															<span class="ml-1 font-mono">{source.pronunciation}</span>
														</div>
													{/if}

													<!-- Part of Speech -->
													{#if source.partOfSpeech}
														<div>
															<span
																class="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
															>
																{source.partOfSpeech}
															</span>
														</div>
													{/if}

													<!-- Definitions with clickable words -->
													<div class="space-y-2">
														<h5 class="text-xs font-semibold text-gray-700">
															Definition{source.definitions.length > 1 ? 's' : ''}:
														</h5>
														<div class="space-y-2">
															{#each source.definitions as def, defIndex}
																<div class="text-sm leading-relaxed text-gray-700">
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
										<div class="py-4 text-center">
											<div class="text-sm text-gray-500">No definition available</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Panel Footer -->
		<div class="border-t border-gray-200 p-4">
			<div class="text-center text-xs text-gray-500">Learn new words with every game!</div>
		</div>
	</div>
{/if}

<style>
	.word-definition-panel {
		/* Ensure panel appears above other content */
		transform: translateX(0);
	}

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

<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { wordSearchSettings } from '$lib/stores/wordSearchSettings.js';
	import {
		GRID_SIZES,
		DENSITIES,
		WORD_LISTS,
		DIRECTIONS,
		type Direction
	} from '$lib/games/wordsearch/types.js';

	// Load settings from store
	let settings = $state($wordSearchSettings);

	// Configuration options state - initialize from store
	let gridSize = $state(settings.gridSize);
	let density = $state(settings.density);
	let wordList = $state(settings.wordList);
	let allowedDirections = $state({ ...settings.allowedDirections });

	// Group word lists by category
	const wikipediaLists = WORD_LISTS.filter((w) => w.value.startsWith('wikipedia-'));
	const moviesLists = WORD_LISTS.filter((w) => w.value.startsWith('movies-'));
	const booksLists = WORD_LISTS.filter((w) => w.value.startsWith('books-'));

	// Handle navigation back
	function handleBack() {
		goto(`${base}/`);
	}

	// Handle play button - navigate to wordsearch with query parameters
	function handlePlay() {
		// Save settings to store
		wordSearchSettings.set({
			gridSize,
			density,
			wordList,
			allowedDirections
		});

		// Serialize allowed directions for URL
		const directionsParam = Object.entries(allowedDirections)
			.filter(([_, enabled]) => enabled)
			.map(([dir]) => dir)
			.join(',');

		const params = new URLSearchParams({
			gridSize,
			density,
			wordList,
			directions: directionsParam
		});
		goto(`${base}/wordsearch?${params.toString()}`);
	}

	// Toggle a direction
	function toggleDirection(dir: Direction) {
		allowedDirections[dir] = !allowedDirections[dir];
	}

	// Get count of enabled directions
	let enabledDirectionsCount = $derived(Object.values(allowedDirections).filter(Boolean).length);

	// Get selected grid size info
	let selectedGridSize = $derived(GRID_SIZES.find((g) => g.value === gridSize));
	let selectedDensity = $derived(DENSITIES.find((d) => d.value === density));
	let selectedWordList = $derived(WORD_LISTS.find((w) => w.value === wordList));
</script>

<svelte:head>
	<title>Word Search Configuration - Word Games Collection</title>
</svelte:head>

<div class="container max-w-3xl py-8">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-foreground mb-2 text-3xl font-bold">Configure Your Word Search Game</h1>
		<p class="text-muted-foreground">Customize your word search experience with these options.</p>
	</header>

	<!-- Configuration Form -->
	<div class="bg-card border-border rounded-lg border p-6 shadow-sm">
		<!-- Grid Size -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Grid Size</h3>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each GRID_SIZES as size}
					<label class="flex cursor-pointer">
						<input
							type="radio"
							name="gridSize"
							value={size.value}
							bind:group={gridSize}
							class="sr-only"
						/>
						<div
							class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors"
							data-checked={gridSize === size.value ? '' : undefined}
						>
							<div class="text-foreground mb-1 font-semibold">{size.label}</div>
							<div class="text-muted-foreground text-sm">{size.dimensions}</div>
						</div>
					</label>
				{/each}
			</div>
			<p class="text-muted-foreground mt-2 text-sm">
				Larger grids provide more challenge and more words to find
			</p>
		</div>

		<!-- Density -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Word Density</h3>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each DENSITIES as dens}
					<label class="flex cursor-pointer">
						<input
							type="radio"
							name="density"
							value={dens.value}
							bind:group={density}
							class="sr-only"
						/>
						<div
							class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors"
							data-checked={density === dens.value ? '' : undefined}
						>
							<div class="text-foreground mb-1 font-semibold">{dens.label}</div>
							<div class="text-muted-foreground text-center text-sm">{dens.description}</div>
						</div>
					</label>
				{/each}
			</div>
			<p class="text-muted-foreground mt-2 text-sm">
				Controls how many words are hidden in the grid
			</p>
		</div>

		<!-- Word List -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Word List Theme</h3>

			<!-- Wikipedia Category -->
			<div class="mb-4">
				<h4 class="text-foreground mb-2 text-center font-medium">Wikipedia</h4>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each wikipediaLists as list}
						<label class="flex cursor-pointer">
							<input
								type="radio"
								name="wordList"
								value={list.value}
								bind:group={wordList}
								class="sr-only"
							/>
							<div
								class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-start justify-center rounded-lg border-2 p-4 transition-colors"
								data-checked={wordList === list.value ? '' : undefined}
							>
								<div class="text-foreground mb-1 font-semibold">{list.label}</div>
								<div class="text-muted-foreground text-sm">{list.description}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Movies Category -->
			<div class="mb-4">
				<h4 class="text-foreground mb-2 text-center font-medium">Movies</h4>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each moviesLists as list}
						<label class="flex cursor-pointer">
							<input
								type="radio"
								name="wordList"
								value={list.value}
								bind:group={wordList}
								class="sr-only"
							/>
							<div
								class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-start justify-center rounded-lg border-2 p-4 transition-colors"
								data-checked={wordList === list.value ? '' : undefined}
							>
								<div class="text-foreground mb-1 font-semibold">{list.label}</div>
								<div class="text-muted-foreground text-sm">{list.description}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Books Category -->
			<div class="mb-4">
				<h4 class="text-foreground mb-2 text-center font-medium">Books</h4>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each booksLists as list}
						<label class="flex cursor-pointer">
							<input
								type="radio"
								name="wordList"
								value={list.value}
								bind:group={wordList}
								class="sr-only"
							/>
							<div
								class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-start justify-center rounded-lg border-2 p-4 transition-colors"
								data-checked={wordList === list.value ? '' : undefined}
							>
								<div class="text-foreground mb-1 font-semibold">{list.label}</div>
								<div class="text-muted-foreground text-sm">{list.description}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<p class="text-muted-foreground mt-2 text-sm">Choose the theme for words to find</p>
		</div>

		<!-- Allowed Directions -->
		<div class="mb-8">
			<h3 class="text-foreground mb-3 text-lg font-semibold">
				Allowed Word Directions ({enabledDirectionsCount} selected)
			</h3>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each Object.entries(DIRECTIONS) as [dir, config]}
					<label class="flex cursor-pointer">
						<input
							type="checkbox"
							checked={allowedDirections[dir as Direction]}
							onchange={() => toggleDirection(dir as Direction)}
							class="sr-only"
						/>
						<div
							class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary/10 flex w-full flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors"
							data-checked={allowedDirections[dir as Direction] ? '' : undefined}
						>
							<div class="mb-1 text-2xl">{config.description}</div>
							<div class="text-foreground text-sm font-medium">{config.label}</div>
						</div>
					</label>
				{/each}
			</div>
			<p class="text-muted-foreground mt-2 text-sm">
				Select which directions words can be placed in the grid. More directions = harder!
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<button
				type="button"
				onclick={handleBack}
				class="border-border text-foreground hover:bg-accent flex items-center justify-center rounded-md border px-6 py-2 transition-colors"
			>
				Back
			</button>
			<button
				type="button"
				onclick={handlePlay}
				class="bg-primary hover:bg-primary/90 flex items-center justify-center rounded-md px-6 py-2 text-white transition-colors"
			>
				Play Word Search
			</button>
		</div>
	</div>

	<!-- Game Preview -->
	<div class="bg-muted/50 mt-6 rounded-lg p-4">
		<h4 class="text-foreground mb-2 font-semibold">Game Settings Preview:</h4>
		<ul class="text-muted-foreground space-y-1 text-sm">
			<li>
				<strong>Grid Size:</strong>
				{selectedGridSize?.label} ({selectedGridSize?.dimensions})
			</li>
			<li>
				<strong>Density:</strong>
				{selectedDensity?.label} - {selectedDensity?.description}
			</li>
			<li>
				<strong>Word List:</strong>
				{selectedWordList?.label} - {selectedWordList?.description}
			</li>
			<li>
				<strong>Directions:</strong>
				{enabledDirectionsCount > 0
					? Object.entries(allowedDirections)
							.filter(([_, enabled]) => enabled)
							.map(([dir]) => DIRECTIONS[dir as Direction].label)
							.join(', ')
					: 'None selected'}
			</li>
		</ul>
	</div>
</div>

<style>
	/* Custom styling for radio/checkbox buttons to work with Tailwind */
	[data-checked] {
		border-color: hsl(var(--primary));
		background-color: hsl(var(--primary) / 0.1);
	}
</style>

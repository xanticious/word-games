<script lang="ts">
	import { GameLayout } from '$lib/components/index.js';
	import { getGameConfig } from '$lib/utils/gameConfigs.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type {
		GridSize,
		Density,
		WordListType,
		Direction,
		GridCell,
		Highlight,
		HIGHLIGHT_COLORS,
		WordEntry
	} from '$lib/games/wordsearch/types.js';
	import { WORD_LISTS } from '$lib/games/wordsearch/types.js';
	import { getWordList } from '$lib/games/wordsearch/wordListService.js';
	import { generateGrid, getGridDimensions } from '$lib/games/wordsearch/gridGenerator.js';
	import {
		getCellsBetween,
		validateSelection,
		getDirection
	} from '$lib/games/wordsearch/selectionLogic.js';
	import WordGrid from '$lib/games/wordsearch/WordGrid.svelte';
	import WordList from '$lib/games/wordsearch/WordList.svelte';
	import HighlightCanvas from '$lib/games/wordsearch/HighlightCanvas.svelte';

	// Import highlight colors
	const COLORS = [
		'palegreen',
		'paleturquoise',
		'palegoldenrod',
		'lightpink',
		'lightsalmon',
		'lightblue',
		'plum',
		'khaki'
	];

	// Cell size in pixels
	const CELL_SIZE = 40;

	const gameConfig = getGameConfig('wordsearch')!;

	// Read settings from URL parameters
	let gridSize = $derived(($page.url.searchParams.get('gridSize') as GridSize) || 'medium');
	let density = $derived(($page.url.searchParams.get('density') as Density) || 'normal');
	let wordList = $derived(
		($page.url.searchParams.get('wordList') as WordListType) || 'movies-random-list'
	);
	let directions = $derived($page.url.searchParams.get('directions') || 'right,down');

	// Parse directions string into array
	let allowedDirections = $derived(directions.split(',').filter(Boolean) as Direction[]);

	// Game state
	let grid = $state<GridCell[][]>([]);
	let words = $state<WordEntry[]>([]);
	let sourceName = $state<string>('');
	let sourceUrl = $state<string | undefined>(undefined);
	let highlights = $state<Highlight[]>([]);
	let isLoading = $state(true);
	let isComplete = $state(false);
	let hasGivenUp = $state(false);
	let highlightLetter = $state('');
	let wordsFoundBeforeGivingUp = $state(0);

	// Selection state
	let isDragging = $state(false);
	let startCell = $state<{ row: number; col: number } | null>(null);
	let currentSelection = $state<{ row: number; col: number }[]>([]);
	let hoverCell = $state<{ row: number; col: number } | null>(null);
	let mouseDownCell = $state<{ row: number; col: number } | null>(null);

	// Initialize the game
	onMount(async () => {
		await initializeGame();
	});

	async function initializeGame() {
		isLoading = true;

		// Get grid dimensions
		const dimensions = getGridDimensions(gridSize);

		// Fetch word bank (now returns larger list as word bank)
		const result = await getWordList(wordList, dimensions);
		sourceName = result.sourceName;
		sourceUrl = result.sourceUrl;

		// Generate grid (takes word bank, returns grid + actual word list + metrics)
		const generated = generateGrid(result.words, allowedDirections, dimensions, density);
		grid = generated.grid;
		words = generated.wordList; // Use the actual words that were placed

		isLoading = false;
	}

	function handleCellClick(row: number, col: number) {
		// If we were dragging, don't process as click
		if (isDragging) {
			isDragging = false;
			return;
		}

		// Two-click selection mode
		if (startCell === null) {
			// First click - set start cell
			startCell = { row, col };
			hoverCell = { row, col };
			updateSelection([{ row, col }]);
		} else {
			// Second click - complete selection
			const cells = getCellsBetween(startCell.row, startCell.col, row, col, grid.length);
			completeSelection(cells);
			startCell = null;
			hoverCell = null;
		}
	}

	function handleCellMouseDown(row: number, col: number) {
		// Record where mouse down occurred
		mouseDownCell = { row, col };
	}

	function handleCellMouseEnter(row: number, col: number) {
		// If mouse is down and we've moved to a different cell, start dragging
		if (mouseDownCell !== null && (mouseDownCell.row !== row || mouseDownCell.col !== col)) {
			if (!isDragging) {
				// Start drag mode
				isDragging = true;
				startCell = { row: mouseDownCell.row, col: mouseDownCell.col };
			}
		}

		// Update hover cell for two-click mode (when not dragging and mouse is up)
		if (startCell !== null && !isDragging && mouseDownCell === null) {
			hoverCell = { row, col };
			const cells = getCellsBetween(startCell.row, startCell.col, row, col, grid.length);
			updateSelection(cells);
			return;
		}

		// Update selection as we drag
		if (isDragging && startCell !== null) {
			const cells = getCellsBetween(startCell.row, startCell.col, row, col, grid.length);
			updateSelection(cells);
		}
	}

	function handleCellMouseUp(row: number, col: number) {
		// Clear mouse down tracking
		mouseDownCell = null;

		if (!isDragging || startCell === null) return;

		// Complete drag selection
		const cells = getCellsBetween(startCell.row, startCell.col, row, col, grid.length);
		completeSelection(cells);

		isDragging = false;
		startCell = null;
		hoverCell = null;
	}

	function updateSelection(cells: { row: number; col: number }[]) {
		// Clear previous selection
		for (const row of grid) {
			for (const cell of row) {
				cell.isSelected = false;
			}
		}

		// Set new selection
		for (const cell of cells) {
			grid[cell.row][cell.col].isSelected = true;
		}

		currentSelection = cells;
	}

	function completeSelection(cells: { row: number; col: number }[]) {
		if (cells.length === 0) {
			updateSelection([]);
			return;
		}

		// Validate the selection
		const foundWord = validateSelection(cells, grid, words);

		if (foundWord && !highlights.some((h) => h.word === foundWord)) {
			// Get the next color
			const color = COLORS[highlights.length % COLORS.length];

			// Determine the direction
			const direction = getDirection(
				cells[0].row,
				cells[0].col,
				cells[cells.length - 1].row,
				cells[cells.length - 1].col
			);

			// Add highlight
			highlights.push({
				word: foundWord,
				startRow: cells[0].row,
				startCol: cells[0].col,
				endRow: cells[cells.length - 1].row,
				endCol: cells[cells.length - 1].col,
				direction,
				color
			});

			// Check if game is complete
			if (highlights.length === words.length) {
				isComplete = true;
			}
		}

		// Clear selection
		updateSelection([]);
		currentSelection = [];
	}

	function handleGameExit() {
		goto('/');
	}

	function handleGameComplete(result: any) {
		console.log('Game completed:', result);
	}

	function handlePlayAgain() {
		// Reset state and reinitialize
		highlights = [];
		isComplete = false;
		hasGivenUp = false;
		highlightLetter = '';
		wordsFoundBeforeGivingUp = 0;
		initializeGame();
	}

	function handleClickOutside() {
		// If in two-click mode and we have a start cell, complete the selection
		if (startCell !== null && !isDragging && hoverCell !== null) {
			const cells = getCellsBetween(
				startCell.row,
				startCell.col,
				hoverCell.row,
				hoverCell.col,
				grid.length
			);
			completeSelection(cells);
			startCell = null;
			hoverCell = null;
		}
	}

	// Direction deltas for searching
	const DIRECTION_DELTAS: Record<Direction, { row: number; col: number }> = {
		right: { row: 0, col: 1 },
		down: { row: 1, col: 0 },
		left: { row: 0, col: -1 },
		up: { row: -1, col: 0 },
		ne: { row: -1, col: 1 },
		se: { row: 1, col: 1 },
		sw: { row: 1, col: -1 },
		nw: { row: -1, col: -1 }
	};

	function findWordInGrid(word: string): Highlight | null {
		const wordUpper = word.toUpperCase();
		const gridSize = grid.length;

		// Search each starting position
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				// Try each allowed direction
				for (const direction of allowedDirections) {
					const delta = DIRECTION_DELTAS[direction];
					let found = true;
					let endRow = row;
					let endCol = col;

					// Check if word matches in this direction
					for (let i = 0; i < wordUpper.length; i++) {
						const currentRow = row + delta.row * i;
						const currentCol = col + delta.col * i;

						// Check bounds
						if (
							currentRow < 0 ||
							currentRow >= gridSize ||
							currentCol < 0 ||
							currentCol >= gridSize
						) {
							found = false;
							break;
						}

						// Check letter match
						if (grid[currentRow][currentCol].letter !== wordUpper[i]) {
							found = false;
							break;
						}

						if (i === wordUpper.length - 1) {
							endRow = currentRow;
							endCol = currentCol;
						}
					}

					if (found) {
						return {
							word,
							startRow: row,
							startCol: col,
							endRow,
							endCol,
							direction,
							color: '' // Will be assigned later
						};
					}
				}
			}
		}

		return null;
	}

	function handleGiveUp() {
		// Track how many words were found before giving up
		wordsFoundBeforeGivingUp = highlights.length;

		// Find all words that haven't been found yet (use gridValue for matching)
		const foundWords = new Set(highlights.map((h) => h.word));
		const remainingWords = words.filter((w) => !foundWords.has(w.gridValue));

		// Find and highlight all remaining words
		for (const wordEntry of remainingWords) {
			const placement = findWordInGrid(wordEntry.gridValue);
			if (placement) {
				// Assign a color
				const color = COLORS[highlights.length % COLORS.length];
				highlights.push({ ...placement, color });
			}
		}

		// Mark as given up and complete
		hasGivenUp = true;
		isComplete = true;
	}

	function handleLetterHighlight(event: Event) {
		const input = event.target as HTMLInputElement;
		const letter = input.value.toUpperCase().slice(0, 1); // Only take first character
		highlightLetter = letter;

		// Update grid cells
		for (const row of grid) {
			for (const cell of row) {
				cell.isLetterHighlighted = letter !== '' && cell.letter === letter;
			}
		}
	}
</script>

<svelte:head>
	<title>Word Search - Word Games Collection</title>
</svelte:head>

<GameLayout config={gameConfig} onGameExit={handleGameExit} onGameComplete={handleGameComplete}>
	{#if isLoading}
		<div class="flex min-h-[60vh] flex-col items-center justify-center">
			<div class="mb-4 text-6xl">⏳</div>
			<p class="text-muted-foreground">Loading game...</p>
		</div>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="game-container" onclick={handleClickOutside}>
			{#if isComplete}
				<div class="congratulations-banner">
					<div class="banner-content">
						<div class="banner-icon">{hasGivenUp ? '😔' : '🎉'}</div>
						<div class="banner-text">
							<h2 class="banner-title">
								{hasGivenUp ? 'Better luck next time!' : 'Congratulations!'}
							</h2>
							<p class="banner-message">
								{#if hasGivenUp}
									You found {wordsFoundBeforeGivingUp} of {words.length} words.
								{:else}
									You found all {words.length} words!
								{/if}
							</p>
						</div>
						<div class="banner-actions">
							<button
								onclick={handlePlayAgain}
								class="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								Play Again
							</button>
							<button
								onclick={handleGameExit}
								class="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								Back to Games
							</button>
						</div>
					</div>
				</div>
			{/if}
			<div class="game-content">
				<div class="word-list-container">
					<WordList {words} foundWords={highlights.map((h) => h.word)} />
				</div>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="grid-container">
					{#if sourceName}
						<h2 class="grid-heading">
							{WORD_LISTS.find((wl) => wl.value === wordList)?.label || 'Word Search'}:
							{#if sourceUrl}
								<a href={sourceUrl} target="_blank" rel="noopener noreferrer" class="source-link">
									"{sourceName}"
								</a>
							{:else}
								"{sourceName}"
							{/if}
						</h2>
					{/if}
					<div class="grid-wrapper" onclick={(e) => e.stopPropagation()}>
						<HighlightCanvas
							gridSize={grid.length}
							cellSize={CELL_SIZE}
							{highlights}
							currentSelection={currentSelection.length > 0 ? currentSelection : null}
						/>
						<WordGrid
							{grid}
							cellSize={CELL_SIZE}
							onCellClick={handleCellClick}
							onCellMouseDown={handleCellMouseDown}
							onCellMouseEnter={handleCellMouseEnter}
							onCellMouseUp={handleCellMouseUp}
						/>
					</div>
					{#if !isComplete}
						<div class="help-section">
							<h3 class="help-title">Help Me</h3>
							<div class="game-controls">
								<div class="control-group">
									<label for="letter-highlight" class="control-label"> Highlight letter: </label>
									<input
										id="letter-highlight"
										type="text"
										class="letter-input"
										value={highlightLetter}
										oninput={handleLetterHighlight}
										placeholder="A"
										maxlength="1"
									/>
								</div>
								<button
									onclick={handleGiveUp}
									class="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									I Give Up
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</GameLayout>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		min-height: 60vh;
		gap: 1.5rem;
	}

	.congratulations-banner {
		width: 100%;
		max-width: 1200px;
		background: linear-gradient(
			135deg,
			hsl(var(--primary) / 0.1) 0%,
			hsl(var(--primary) / 0.05) 100%
		);
		border: 2px solid hsl(var(--primary) / 0.3);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		animation: slideDown 0.5s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.banner-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.banner-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.banner-text {
		flex: 1;
		min-width: 200px;
	}

	.banner-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.25rem 0;
	}

	.banner-message {
		font-size: 1rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.banner-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.game-content {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
		flex-wrap: wrap;
		justify-content: center;
	}

	.grid-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.grid-heading {
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.source-link {
		color: hsl(var(--primary));
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
		transition: color 0.2s;
	}

	.source-link:hover {
		color: hsl(var(--primary) / 0.8);
		text-decoration-style: solid;
	}

	.grid-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.word-list-container {
		flex-shrink: 0;
	}

	.help-section {
		margin-top: 1.5rem;
		width: 100%;
		max-width: 600px;
	}

	.help-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 0.75rem 0;
		text-align: center;
	}

	.game-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.letter-input {
		width: 3rem;
		height: 2.5rem;
		text-align: center;
		font-size: 1.125rem;
		font-weight: 600;
		text-transform: uppercase;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		transition: all 0.2s;
	}

	.letter-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
	}

	.letter-input::placeholder {
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		.game-container {
			padding: 1rem;
		}

		.game-content {
			gap: 1rem;
		}

		.congratulations-banner {
			padding: 1rem;
		}

		.banner-content {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.banner-icon {
			font-size: 2rem;
		}

		.banner-title {
			font-size: 1.25rem;
		}

		.banner-actions {
			justify-content: center;
			width: 100%;
		}

		.banner-actions button {
			flex: 1;
			min-width: 120px;
		}
	}
</style>

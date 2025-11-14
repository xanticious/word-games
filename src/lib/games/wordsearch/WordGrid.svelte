<script lang="ts">
	import type { GridCell } from '$lib/games/wordsearch/types.js';

	interface Props {
		grid: GridCell[][];
		cellSize: number;
		onCellClick: (row: number, col: number) => void;
		onCellMouseDown: (row: number, col: number) => void;
		onCellMouseEnter: (row: number, col: number) => void;
		onCellMouseUp: (row: number, col: number) => void;
	}

	let { grid, cellSize, onCellClick, onCellMouseDown, onCellMouseEnter, onCellMouseUp }: Props =
		$props();
</script>

<div class="word-grid">
	{#each grid as row}
		<div class="grid-row">
			{#each row as cell}
				<button
					class="grid-cell"
					class:selected={cell.isSelected}
					style:width="{cellSize}px"
					style:height="{cellSize}px"
					onclick={() => onCellClick(cell.row, cell.col)}
					onmousedown={() => onCellMouseDown(cell.row, cell.col)}
					onmouseenter={() => onCellMouseEnter(cell.row, cell.col)}
					onmouseup={() => onCellMouseUp(cell.row, cell.col)}
				>
					{cell.letter}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.word-grid {
		display: inline-block;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	.grid-row {
		display: flex;
	}

	.grid-cell {
		/* Size is set via inline styles based on cellSize prop */
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--foreground));
		font-family: monospace;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		position: relative;
		padding: 0;
		z-index: 1;
	}

	.grid-cell:hover {
		background: hsl(var(--muted) / 0.3);
	}

	.grid-cell.selected {
		background: hsl(var(--primary) / 0.2);
		border-color: hsl(var(--primary));
	}
</style>

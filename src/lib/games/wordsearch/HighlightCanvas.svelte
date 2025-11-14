<script lang="ts">
	import { onMount } from 'svelte';
	import type { Highlight } from '$lib/games/wordsearch/types.js';

	interface Props {
		gridSize: number;
		cellSize: number;
		highlights: Highlight[];
		currentSelection: { row: number; col: number }[] | null;
	}

	let { gridSize, cellSize, highlights, currentSelection = null }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	onMount(() => {
		ctx = canvas.getContext('2d');
		draw();
	});

	// Redraw whenever highlights or selection changes
	$effect(() => {
		if (ctx) {
			// Touch the reactive variables
			highlights;
			currentSelection;
			draw();
		}
	});

	function draw() {
		if (!ctx) return;

		const totalSize = gridSize * cellSize;
		const dpr = window.devicePixelRatio || 1;

		// Set canvas size accounting for device pixel ratio
		canvas.width = totalSize * dpr;
		canvas.height = totalSize * dpr;
		canvas.style.width = `${totalSize}px`;
		canvas.style.height = `${totalSize}px`;

		// Scale context for high DPI displays
		ctx.scale(dpr, dpr);

		// Clear canvas
		ctx.clearRect(0, 0, totalSize, totalSize);

		// Draw permanent highlights
		for (const highlight of highlights) {
			drawHighlight(
				highlight.startRow,
				highlight.startCol,
				highlight.endRow,
				highlight.endCol,
				highlight.color,
				false
			);
		}

		// Draw temporary selection highlight
		if (currentSelection && currentSelection.length > 0) {
			const start = currentSelection[0];
			const end = currentSelection[currentSelection.length - 1];
			drawHighlight(start.row, start.col, end.row, end.col, 'rgba(59, 130, 246, 0.3)', true);
		}
	}

	function drawHighlight(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
		color: string,
		isTemporary: boolean
	) {
		if (!ctx) return;

		// Calculate center points of start and end cells
		const startX = startCol * cellSize + cellSize / 2;
		const startY = startRow * cellSize + cellSize / 2;
		const endX = endCol * cellSize + cellSize / 2;
		const endY = endRow * cellSize + cellSize / 2;

		// Draw a thick line with rounded caps (pill shape)
		ctx.save();

		ctx.strokeStyle = color;
		ctx.lineWidth = cellSize * 0.85; // Slightly smaller than cell to leave border visible
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// For temporary selection, use dashed line
		if (isTemporary) {
			ctx.setLineDash([5, 3]);
		}

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		ctx.restore();
	}
</script>

<canvas bind:this={canvas} class="highlight-canvas"></canvas>

<style>
	.highlight-canvas {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 0;
	}
</style>

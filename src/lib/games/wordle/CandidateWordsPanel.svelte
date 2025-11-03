<script lang="ts">
	import type { WordleCandidate } from './types.js';

	let {
		candidates = [],
		isVisible = true,
		onWordClick
	}: {
		candidates: WordleCandidate[];
		isVisible: boolean;
		onWordClick?: (word: string) => void;
	} = $props();

	let isOpen = $state(true);

	function handleWordClick(word: string) {
		onWordClick?.(word);
	}
</script>

{#if isVisible}
	<div class="candidate-panel">
		<div class="panel-header">
			<h3>Valid Words ({candidates.length})</h3>
			<button onclick={() => (isOpen = !isOpen)} class="toggle-btn" aria-label="Toggle panel">
				{isOpen ? '◀' : '▶'}
			</button>
		</div>

		{#if isOpen}
			{#if candidates.length === 0}
				<div class="empty-state">
					<p>Start guessing to see possible words!</p>
				</div>
			{:else}
				<div class="candidate-list">
					{#each candidates as candidate}
						<button
							class="candidate-word"
							onclick={() => handleWordClick(candidate.word)}
							type="button"
						>
							{candidate.word}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.candidate-panel {
		position: fixed;
		left: 0;
		top: 0;
		margin-top: 54px;
		width: 280px;
		height: calc(100vh - 54px);
		background: hsl(var(--background));
		border-right: 1px solid hsl(var(--border));
		overflow: hidden;
		z-index: 10000;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--background));
	}

	.panel-header h3 {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.toggle-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		font-size: 1.2rem;
		color: hsl(var(--foreground));
		transition: opacity 0.2s;
	}

	.toggle-btn:hover {
		opacity: 0.7;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
	}

	.candidate-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.candidate-word {
		width: 100%;
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: hsl(var(--muted));
		border: 1px solid transparent;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9rem;
		text-transform: uppercase;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.candidate-word:hover {
		background: hsl(var(--primary) / 0.1);
		border-color: hsl(var(--primary));
	}

	.candidate-word:active {
		background: hsl(var(--primary) / 0.2);
		transform: scale(0.98);
	}

	@media (max-width: 1024px) {
		.candidate-panel {
			left: 0;
			right: 0;
			width: 100%;
			height: auto;
			max-height: 40vh;
			bottom: 0;
			top: auto;
			margin-top: 0;
			border-right: none;
			border-top: 1px solid hsl(var(--border));
		}

		.panel-header {
			flex-direction: row-reverse;
		}

		.toggle-btn {
			transform: rotate(90deg);
		}
	}
</style>

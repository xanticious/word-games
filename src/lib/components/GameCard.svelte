<script lang="ts">
	import type { GameConfig } from '$lib/types';

	interface Props {
		config: GameConfig;
		onclick?: () => void;
	}

	let { config, onclick }: Props = $props();

	function handleCardClick() {
		onclick?.();
	}

	// Get color based on category for visual interest
	function getCategoryColor(category: string): string {
		const colors: Record<string, string> = {
			'word-guessing': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
			puzzle: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
			speed: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
			creative: 'bg-green-50 border-green-200 hover:bg-green-100'
		};
		return colors[category] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
	}
</script>

<div
	class="game-card cursor-pointer overflow-hidden rounded-lg border p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md {getCategoryColor(
		config.category
	)}"
	onclick={handleCardClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
	aria-label="Play {config.name}"
>
	<!-- Game Info -->
	<div class="space-y-2">
		<div>
			<h3 class="text-foreground text-lg leading-tight font-semibold tracking-tight">
				{config.name}
			</h3>
			<p class="text-muted-foreground mt-1.5 text-sm">{config.description}</p>
		</div>

		<!-- Category -->
		<div class="text-muted-foreground text-xs">
			<span class="capitalize">{config.category.replace('-', ' ')}</span>
		</div>
	</div>
</div>

<style>
	.game-card {
		min-height: 110px;
	}
</style>

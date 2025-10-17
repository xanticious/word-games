<!--
	FullscreenButton.svelte - Toggle fullscreen mode for games
-->

<script lang="ts">
	interface Props {
		onFullscreenChange?: (isFullscreen: boolean) => void;
	}

	let { onFullscreenChange }: Props = $props();

	let isFullscreen = $state(false);
	let isSupported = $state(false);

	// Check if fullscreen is supported
	$effect(() => {
		if (typeof document !== 'undefined') {
			isSupported = !!document.fullscreenEnabled;

			// Listen for fullscreen changes
			const handleFullscreenChange = () => {
				const newIsFullscreen = !!document.fullscreenElement;
				isFullscreen = newIsFullscreen;
				onFullscreenChange?.(newIsFullscreen);
			};

			document.addEventListener('fullscreenchange', handleFullscreenChange);

			return () => {
				document.removeEventListener('fullscreenchange', handleFullscreenChange);
			};
		}
	});

	async function toggleFullscreen() {
		if (!isSupported) return;

		try {
			if (isFullscreen) {
				// Exit fullscreen
				await document.exitFullscreen();
			} else {
				// Enter fullscreen
				await document.documentElement.requestFullscreen();
			}
		} catch (error) {
			console.warn('Failed to toggle fullscreen:', error);
		}
	}
</script>

{#if isSupported}
	<button
		onclick={toggleFullscreen}
		class="
			fixed right-4 bottom-4 z-50
			rounded-lg border border-white/20
			bg-black/20 p-2 text-white
			backdrop-blur-sm transition-all duration-200
			hover:bg-black/30 hover:text-white
			focus:ring-2 focus:ring-white/50 focus:outline-none
		"
		title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
		aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
	>
		{#if isFullscreen}
			<!-- Exit fullscreen icon -->
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
				/>
			</svg>
		{:else}
			<!-- Enter fullscreen icon -->
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
				/>
			</svg>
		{/if}
	</button>
{/if}

<style>
	/* Ensure button stays visible in fullscreen */
	button {
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	/* Hide button when printing */
	@media print {
		button {
			display: none;
		}
	}
</style>

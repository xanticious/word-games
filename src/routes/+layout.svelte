<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Header } from '$lib/components/index.js';
	import { onMount } from 'svelte';
	import { currentTheme, currentTextSize } from '$lib/stores/themes.js';

	let { children } = $props();

	// Initialize theme and text size on mount
	onMount(() => {
		// Theme and text size are automatically applied by the stores
		// This ensures they're applied on initial load
		currentTheme.subscribe(() => {});
		currentTextSize.subscribe(() => {});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Word Games Collection</title>
	<meta
		name="description"
		content="A collection of engaging word games including Wordle, Word Search, Anagrams, Typing Challenge, and Rhyme games."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
	<Header />

	<main class="flex-1">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="border-border bg-muted/50 mt-12 border-t py-8">
		<div class="container">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="text-muted-foreground flex items-center gap-2 text-sm">
					<span>Word Games Collection</span>
					<span>•</span>
					<span>No ads, no limits, just fun!</span>
				</div>

				<div class="text-muted-foreground flex items-center gap-4 text-sm">
					<span>Made with SvelteKit</span>
					<span>•</span>
					<a
						href="https://github.com/xanticious/word-games"
						class="hover:text-foreground transition-colors"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>

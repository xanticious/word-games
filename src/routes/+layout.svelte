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

<div class="bg-background text-foreground min-h-screen w-full">
	<Header />

	<main class="w-full flex-1">
		{@render children?.()}
	</main>
</div>

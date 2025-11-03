<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { guessTheWordSettings } from '$lib/stores/guessTheWordSettings.js';
	import { gameDictionary } from '$lib/dictionary.js';
	import { onMount } from 'svelte';

	// Load settings from store
	let settings = $state($guessTheWordSettings);

	// Configuration options state - initialize from store
	let targetWords = $state<'common' | 'all'>(settings.targetWords);
	let wordLength = $state(settings.wordLength.toString());
	let hardMode = $state(settings.hardMode);
	let rescueMode = $state(settings.rescueMode);
	let easyMode = $state(settings.easyMode);

	// Error message for unsupported configurations
	let errorMessage = $state('');

	// Validate configuration
	function validateConfig(): boolean {
		errorMessage = '';

		// Check if common words are available for the selected length
		const length = parseInt(wordLength);
		if (targetWords === 'common' && !gameDictionary.hasCommonWords(length)) {
			errorMessage = `Common words are not yet available for ${length}-letter words. Please choose "All Words" or select 5 letters.`;
			return false;
		}

		return true;
	}

	// Handle navigation back
	function handleBack() {
		goto(`${base}/`);
	}

	// Handle play button - navigate to guess-the-word with query parameters
	function handlePlay() {
		if (!validateConfig()) {
			return;
		}

		// Save settings to store
		guessTheWordSettings.set({
			targetWords,
			wordLength: parseInt(wordLength),
			hardMode,
			rescueMode,
			easyMode
		});

		const params = new URLSearchParams({
			targetWords,
			wordLength,
			hardMode: hardMode.toString(),
			rescueMode: rescueMode.toString(),
			easyMode: easyMode.toString()
		});
		goto(`${base}/guess-the-word?${params.toString()}`);
	}

	// Validate when settings change
	$effect(() => {
		// Clear error when settings change
		if (errorMessage) {
			validateConfig();
		}
	});
</script>

<svelte:head>
	<title>Guess the Word Configuration - Word Games Collection</title>
</svelte:head>

<div class="container max-w-2xl py-8">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-foreground mb-2 text-3xl font-bold">Configure Your Guess the Word Game</h1>
		<p class="text-muted-foreground">Customize your word guessing experience with these options.</p>
	</header>

	<!-- Configuration Form -->
	<div class="bg-card border-border rounded-lg border p-6 shadow-sm">
		<!-- Target Words -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Target Words</h3>
			<div class="space-y-2">
				<label class="flex cursor-pointer items-center space-x-3">
					<input
						type="radio"
						name="targetWords"
						value="common"
						bind:group={targetWords}
						class="text-primary focus:ring-primary h-4 w-4 focus:ring-2"
					/>
					<span class="text-foreground">Just Common Words</span>
					<span class="text-muted-foreground text-sm">(recommended)</span>
				</label>
				<label class="flex cursor-pointer items-center space-x-3">
					<input
						type="radio"
						name="targetWords"
						value="all"
						bind:group={targetWords}
						class="text-primary focus:ring-primary h-4 w-4 focus:ring-2"
					/>
					<span class="text-foreground">All Words (even unusual words)</span>
				</label>
			</div>
		</div>

		<!-- Word Length -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Word Length</h3>
			<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
				{#each ['1', '2', '3', '4', '5', '6', '7'] as length}
					<label class="flex cursor-pointer items-center justify-center">
						<input
							type="radio"
							name="wordLength"
							value={length}
							bind:group={wordLength}
							class="sr-only"
						/>
						<div
							class="border-border hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary flex h-12 w-12 items-center justify-center rounded-md border-2 transition-colors data-[checked]:text-white"
							data-checked={wordLength === length ? '' : undefined}
						>
							{length}
						</div>
					</label>
				{/each}
			</div>
			<p class="text-muted-foreground mt-2 text-sm">
				Choose how many letters the target word should have
			</p>
		</div>

		<!-- Hard Mode -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Hard Mode</h3>
			<label class="flex cursor-pointer items-start space-x-3">
				<input
					type="checkbox"
					bind:checked={hardMode}
					class="text-primary focus:ring-primary mt-0.5 h-4 w-4 rounded focus:ring-2"
				/>
				<div>
					<span class="text-foreground block">Enable Hard Mode</span>
					<span class="text-muted-foreground text-sm">
						Guesses must satisfy all clues that you have been given
					</span>
				</div>
			</label>
		</div>

		<!-- Rescue Mode -->
		<div class="mb-6">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Rescue Mode</h3>
			<label class="flex cursor-pointer items-start space-x-3">
				<input
					type="checkbox"
					bind:checked={rescueMode}
					class="text-primary focus:ring-primary mt-0.5 h-4 w-4 rounded focus:ring-2"
				/>
				<div>
					<span class="text-foreground block">Enable Rescue Mode</span>
					<span class="text-muted-foreground text-sm">
						1st round starts with a random guess. Subsequent rounds start by guessing the target
						word from the previous round
					</span>
				</div>
			</label>
		</div>

		<!-- Easy Mode -->
		<div class="mb-8">
			<h3 class="text-foreground mb-3 text-lg font-semibold">Easy Mode</h3>
			<label class="flex cursor-pointer items-start space-x-3">
				<input
					type="checkbox"
					bind:checked={easyMode}
					class="text-primary focus:ring-primary mt-0.5 h-4 w-4 rounded focus:ring-2"
				/>
				<div>
					<span class="text-foreground block">Enable Easy Mode</span>
					<span class="text-muted-foreground text-sm"> Shows a list of valid candidate words </span>
				</div>
			</label>
		</div>

		<!-- Error Message -->
		{#if errorMessage}
			<div
				class="mb-6 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"
			>
				<p class="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
			</div>
		{/if}

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
				Play Guess the Word
			</button>
		</div>
	</div>

	<!-- Game Preview -->
	<div class="bg-muted/50 mt-6 rounded-lg p-4">
		<h4 class="text-foreground mb-2 font-semibold">Game Settings Preview:</h4>
		<ul class="text-muted-foreground space-y-1 text-sm">
			<li>
				<strong>Target Words:</strong>
				{targetWords === 'common' ? 'Just Common Words' : 'All Words (even unusual words)'}
			</li>
			<li><strong>Word Length:</strong> {wordLength} letters</li>
			<li><strong>Hard Mode:</strong> {hardMode ? 'Enabled' : 'Disabled'}</li>
			<li><strong>Rescue Mode:</strong> {rescueMode ? 'Enabled' : 'Disabled'}</li>
			<li><strong>Easy Mode:</strong> {easyMode ? 'Enabled' : 'Disabled'}</li>
		</ul>
	</div>
</div>

<style>
	/* Custom styling for radio buttons to work with Tailwind */
	input[type='radio']:checked + div {
		--tw-border-opacity: 1;
		border-color: hsl(var(--primary));
		--tw-bg-opacity: 1;
		background-color: hsl(var(--primary));
		--tw-text-opacity: 1;
		color: hsl(var(--primary-foreground));
	}
</style>

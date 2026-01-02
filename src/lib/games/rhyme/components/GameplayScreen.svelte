<script lang="ts">
	import type { GamePrompt } from '../types.js';
	import type { PhoneticEntry } from '$lib/dictionary.js';
	import { checkRhyme, formatTime } from '../scoreCalculator.js';
	import { TIMING, INPUT } from '../config.js';

	interface Props {
		prompt: GamePrompt;
		elapsedTime: number;
		completionCount: number;
		phoneticEntries: PhoneticEntry[];
		onSubmit: (line: string) => void;
		onSkip: () => void;
		onShowHelp: () => void;
	}

	let {
		prompt,
		elapsedTime = $bindable(),
		completionCount,
		phoneticEntries,
		onSubmit,
		onSkip,
		onShowHelp
	}: Props = $props();

	let inputValue = $state('');
	let hasRhyme = $state(false);

	// Character limit based on prompt length
	const characterLimit = $derived(prompt.prompt.length * INPUT.characterLimitMultiplier);

	// Track which bonus words have been used across all completions
	let usedBonusWords = $state(new Set<string>());

	// Check rhyme in real-time
	$effect(() => {
		if (inputValue.trim().length > 0) {
			hasRhyme = checkRhyme(prompt.prompt, inputValue, phoneticEntries);
		} else {
			hasRhyme = false;
		}
	});

	// Check which bonus words are in current input
	const bonusWordsInInput = $derived(() => {
		const words = inputValue
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 0);
		return prompt.bonusWords.filter((bonusWord) =>
			words.some((w) => w === bonusWord.toLowerCase())
		);
	});

	function handleSubmit() {
		if (inputValue.trim().length > 0) {
			// Track used bonus words
			for (const word of bonusWordsInInput()) {
				usedBonusWords.add(word.toLowerCase());
			}

			onSubmit(inputValue.trim());
			inputValue = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		}
	}

	// Progress bar percentage (0-100)
	const progressPercent = $derived((elapsedTime / TIMING.roundDuration) * 100);

	// Current multiplier based on elapsed time
	const currentMultiplier = $derived(() => {
		for (const tier of TIMING.multipliers) {
			if (elapsedTime <= tier.threshold) {
				return tier.multiplier;
			}
		}
		return 1;
	});

	// Multiplier threshold positions (percentage along progress bar)
	const multiplierPositions = $derived(
		TIMING.multipliers.map((tier) => ({
			multiplier: tier.multiplier,
			position: (tier.threshold / TIMING.roundDuration) * 100
		}))
	);
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6 p-4">
	<!-- Progress Bar with Multipliers -->
	<div class="relative">
		<div class="text-muted-foreground mb-2 flex items-center justify-between text-sm">
			<span>{formatTime(elapsedTime)} / {formatTime(TIMING.roundDuration)}</span>
			<span class="font-semibold">{currentMultiplier()}x Multiplier</span>
		</div>

		<!-- Progress bar container -->
		<div class="bg-muted relative h-6 overflow-hidden rounded-full">
			<!-- Filled progress -->
			<div
				class="bg-primary h-full transition-all duration-1000"
				style="width: {Math.min(progressPercent, 100)}%"
			></div>

			<!-- Multiplier tick marks -->
			{#each multiplierPositions as tier}
				<div class="bg-background absolute top-0 h-full w-0.5" style="left: {tier.position}%">
					<div
						class="text-primary-foreground absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold"
					>
						{tier.multiplier}x
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Top Controls -->
	<div class="flex items-center justify-end gap-2">
		<button
			onclick={onShowHelp}
			class="hover:bg-muted/80 rounded-lg px-3 py-2 text-sm transition-colors"
			aria-label="Show instructions"
		>
			❓ Help
		</button>
		<button
			onclick={onSkip}
			class="hover:bg-muted/80 rounded-lg px-3 py-2 text-sm transition-colors"
			aria-label="Skip to new prompt"
		>
			⏭️ Skip
		</button>
	</div>

	<!-- Main Game Area -->
	<div class="flex flex-col gap-8">
		<!-- Prompt Display -->
		<div class="text-center">
			<div class="text-muted-foreground mb-2 text-sm">Complete the couplet:</div>
			<div class="font-serif text-3xl leading-relaxed">
				"{prompt.prompt}..."
			</div>
			<a
				href={prompt.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary mt-2 inline-block text-xs hover:underline"
			>
				Source: {prompt.sourceTitle}
			</a>
		</div>

		<!-- Input Box -->
		<div class="mx-auto w-full max-w-2xl">
			<input
				type="text"
				bind:value={inputValue}
				onkeydown={handleKeydown}
				maxlength={characterLimit}
				placeholder="Type your second line here..."
				class="focus:ring-primary w-full rounded-lg border-2 px-4 py-3 font-serif text-2xl transition-colors focus:ring-2 focus:outline-none"
				class:border-green-500={hasRhyme}
				class:border-border={!hasRhyme}
				aria-label="Completion input"
			/>
			<div class="text-muted-foreground mt-1 flex items-center justify-between text-xs">
				<span>
					{#if hasRhyme}
						<span class="text-green-600">✓ Rhyme detected!</span>
					{:else}
						<span>Press Enter to submit</span>
					{/if}
				</span>
				<span>
					{inputValue.length} / {characterLimit}
				</span>
			</div>
		</div>

		<!-- Word Bank -->
		<div class="mx-auto w-full max-w-2xl">
			<div class="bg-muted/50 rounded-lg p-4">
				<div class="text-muted-foreground mb-2 text-sm font-semibold">Bonus Words:</div>
				<div class="flex flex-wrap gap-2">
					{#each prompt.bonusWords as bonusWord}
						{@const isUsed = usedBonusWords.has(bonusWord.toLowerCase())}
						{@const isInInput = bonusWordsInInput().includes(bonusWord)}
						<div
							class="flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors"
							class:bg-green-200={isUsed || isInInput}
							class:text-green-800={isUsed || isInInput}
							class:bg-background={!isUsed && !isInInput}
						>
							<span>{bonusWord}</span>
							{#if isUsed || isInInput}
								<span class="text-green-600">✓</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Hidden completion counter (revealed in results) -->
		<div class="text-muted-foreground text-center text-sm">
			{completionCount} / {TIMING.maxCompletions} completed
		</div>
	</div>
</div>

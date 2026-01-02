<script lang="ts">
	import type { RoundResults, Completion } from '../types.js';
	import { formatScore } from '../scoreCalculator.js';

	interface Props {
		results: RoundResults;
		onPlayAgain: () => void;
	}

	let { results, onPlayAgain }: Props = $props();

	// State for expandable sections
	let totalScoreExpanded = $state(false);
	let expandedCompletions = $state(new Set<number>());

	// Get top 3 completions for podium
	const topThree = $derived(
		[...results.completions]
			.sort((a, b) => b.score.total - a.score.total)
			.slice(0, 3)
			.map((completion, index) => ({
				completion,
				rank: index + 1
			}))
	);

	// Get remaining completions (honorable mentions)
	const remainingCompletions = $derived(
		[...results.completions].sort((a, b) => b.score.total - a.score.total).slice(3)
	);

	function toggleCompletion(index: number) {
		if (expandedCompletions.has(index)) {
			expandedCompletions.delete(index);
		} else {
			expandedCompletions.add(index);
		}
		expandedCompletions = new Set(expandedCompletions);
	}

	function getRankEmoji(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return '•';
	}

	function getRankClass(rank: number): string {
		if (rank === 1) return 'ring-4 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
		if (rank === 2) return 'ring-4 ring-gray-400 bg-gray-50 dark:bg-gray-900/20';
		if (rank === 3) return 'ring-4 ring-orange-400 bg-orange-50 dark:bg-orange-900/20';
		return 'bg-background';
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 p-4">
	<!-- Header -->
	<div class="text-center">
		<h1 class="mb-2 text-4xl font-bold">Round Complete!</h1>
		<p class="text-muted-foreground">You completed {results.completions.length} couplets</p>
	</div>

	<!-- Total Score Card (Expandable) -->
	<div
		class="border-primary bg-card cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-lg"
		onclick={() => (totalScoreExpanded = !totalScoreExpanded)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && (totalScoreExpanded = !totalScoreExpanded)}
	>
		<div class="flex items-center justify-between">
			<div>
				<div class="text-muted-foreground text-sm">Total Round Score</div>
				<div class="text-5xl font-bold">{formatScore(results.totalScore)} Points</div>
			</div>
			<div class="text-3xl">{totalScoreExpanded ? '▼' : '▶'}</div>
		</div>

		{#if totalScoreExpanded}
			<div class="border-t-border mt-4 space-y-2 border-t pt-4">
				<div class="flex justify-between">
					<span>Sum of Individual Scores:</span>
					<span class="font-semibold">{formatScore(results.sumOfScores)} pts</span>
				</div>
				<div class="flex justify-between">
					<span>
						Used Bonus Words: {results.wordBankVarietyBonus.uniqueWordsUsed}/{results
							.wordBankVarietyBonus.totalWords}
					</span>
					<span class="font-semibold">+{formatScore(results.wordBankVarietyBonus.points)} pts</span>
				</div>
				<div class="flex justify-between text-lg font-bold">
					<span>Time Multiplier:</span>
					<span>×{results.timeMultiplier}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Podium (Top 3) -->
	{#if topThree.length > 0}
		<div>
			<h2 class="mb-4 text-2xl font-bold">Top Completions</h2>
			<div class="space-y-4">
				{#each topThree as { completion, rank }, index}
					{@const isExpanded = expandedCompletions.has(index)}
					<div
						class="rounded-lg p-6 transition-all {getRankClass(rank)}"
						onclick={() => toggleCompletion(index)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && toggleCompletion(index)}
					>
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-2 text-lg font-semibold">
								<span class="text-2xl">{getRankEmoji(rank)}</span>
								<span>{rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place</span>
							</div>
							<div class="text-2xl">{isExpanded ? '▼' : '▶'}</div>
						</div>

						<div class="mb-2 font-serif text-lg">
							<div class="text-muted-foreground">"{results.prompt.prompt}..."</div>
							<div>{completion.line}</div>
						</div>

						<div class="text-sm font-semibold">
							Completion Score: {formatScore(completion.score.total)} pts
						</div>

						{#if isExpanded}
							<div class="border-t-border mt-4 space-y-3 border-t pt-4 text-sm">
								<!-- End Rhyme -->
								<div class="flex justify-between">
									<span>End Rhyme: "{completion.score.endRhyme.description}"</span>
									<span class="font-semibold">+{completion.score.endRhyme.points}</span>
								</div>

								<!-- Internal Rhymes -->
								{#if completion.score.internalRhymes.rhymes.length > 0}
									<div>
										<div class="mb-1 font-semibold">Internal Rhymes:</div>
										{#each completion.score.internalRhymes.rhymes as rhyme}
											<div class="text-muted-foreground ml-4 flex justify-between">
												<span>
													• {rhyme.type === 'triple+' ? 'Triple+' : 'Pair'} Rhyme - "{rhyme.words.join(
														' - '
													)}"
												</span>
												<span class="font-semibold">
													+{rhyme.type === 'triple+' ? '10' : '5'}
												</span>
											</div>
										{/each}
										<div class="ml-4 flex justify-between font-semibold">
											<span>Total:</span>
											<span>+{completion.score.internalRhymes.points}</span>
										</div>
									</div>
								{/if}

								<!-- Syllables -->
								<div class="flex justify-between">
									<span>
										Syllables: {completion.score.syllables.difference === 0
											? 'Exact match'
											: `${completion.score.syllables.completionCount} (${completion.score.syllables.difference} ${completion.score.syllables.difference === 1 ? 'syllable' : 'syllables'} off)`}
									</span>
									<span class="font-semibold">+{completion.score.syllables.points}</span>
								</div>

								<!-- Stress Pattern -->
								<div>
									<div class="mb-1 flex justify-between">
										<span>Stress Pattern: "{completion.score.stressPattern.description}"</span>
										<span class="font-semibold">+{completion.score.stressPattern.points}</span>
									</div>
									<div class="text-muted-foreground ml-4 font-mono text-xs">
										<div>Line 1: {completion.score.stressPattern.promptPattern}</div>
										<div>Line 2: {completion.score.stressPattern.completionPattern}</div>
									</div>
								</div>

								<!-- Alliteration -->
								{#if completion.score.alliteration.matches.length > 0}
									<div class="flex justify-between">
										<span>
											Alliteration: {completion.score.alliteration.matches
												.map((m) => `${m.count}× "${m.consonant}"`)
												.join(', ')}
										</span>
										<span class="font-semibold">+{completion.score.alliteration.points}</span>
									</div>
								{/if}

								<!-- Consonance -->
								{#if completion.score.consonance.matches.length > 0}
									<div class="flex justify-between">
										<span>
											Consonance: {completion.score.consonance.matches
												.map((m) => `${m.count}× "${m.vowel}"`)
												.join(', ')}
										</span>
										<span class="font-semibold">+{completion.score.consonance.points}</span>
									</div>
								{/if}

								<!-- Word Bank Bonus -->
								{#if completion.score.wordBankBonus.usedWords.length > 0}
									<div class="flex justify-between">
										<span>
											Word Bank Bonus: Used "{completion.score.wordBankBonus.usedWords.join(
												'", "'
											)}"
										</span>
										<span class="font-semibold">+{completion.score.wordBankBonus.points}</span>
									</div>
								{/if}

								<div class="border-t-border border-t pt-2"></div>
								<div class="flex justify-between text-base font-bold">
									<span>Completion Score:</span>
									<span>{formatScore(completion.score.total)} pts</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Honorable Mentions -->
	{#if remainingCompletions.length > 0}
		<div>
			<h2 class="mb-4 text-2xl font-bold">Honorable Mentions</h2>
			<div class="space-y-3">
				{#each remainingCompletions as completion, index}
					{@const completionIndex = index + 3}
					{@const isExpanded = expandedCompletions.has(completionIndex)}
					<div
						class="bg-card rounded-lg p-4 transition-all hover:shadow-md"
						onclick={() => toggleCompletion(completionIndex)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && toggleCompletion(completionIndex)}
					>
						<div class="mb-2 flex items-center justify-between">
							<div class="font-serif">
								<span class="text-muted-foreground">"{results.prompt.prompt}..." </span>
								{completion.line}
							</div>
							<div class="ml-4 flex items-center gap-2">
								<span class="text-sm font-semibold">{formatScore(completion.score.total)} pts</span>
								<span class="text-xl">{isExpanded ? '▼' : '▶'}</span>
							</div>
						</div>

						{#if isExpanded}
							<div class="border-t-border mt-3 space-y-2 border-t pt-3 text-sm">
								<!-- Same detailed breakdown as podium -->
								<div class="flex justify-between">
									<span>End Rhyme: "{completion.score.endRhyme.description}"</span>
									<span class="font-semibold">+{completion.score.endRhyme.points}</span>
								</div>

								{#if completion.score.internalRhymes.rhymes.length > 0}
									<div>
										<div class="mb-1 font-semibold">Internal Rhymes:</div>
										{#each completion.score.internalRhymes.rhymes as rhyme}
											<div class="text-muted-foreground ml-4 flex justify-between">
												<span>
													• {rhyme.type === 'triple+' ? 'Triple+' : 'Pair'} Rhyme - "{rhyme.words.join(
														' - '
													)}"
												</span>
												<span>+{rhyme.type === 'triple+' ? '10' : '5'}</span>
											</div>
										{/each}
										<div class="ml-4 flex justify-between font-semibold">
											<span>Total:</span>
											<span>+{completion.score.internalRhymes.points}</span>
										</div>
									</div>
								{/if}

								<div class="flex justify-between">
									<span>
										Syllables: {completion.score.syllables.difference === 0
											? 'Exact match'
											: `${completion.score.syllables.completionCount} (${completion.score.syllables.difference} ${completion.score.syllables.difference === 1 ? 'syllable' : 'syllables'} off)`}
									</span>
									<span class="font-semibold">+{completion.score.syllables.points}</span>
								</div>

								<div>
									<div class="mb-1 flex justify-between">
										<span>Stress Pattern: "{completion.score.stressPattern.description}"</span>
										<span class="font-semibold">+{completion.score.stressPattern.points}</span>
									</div>
									<div class="text-muted-foreground ml-4 font-mono text-xs">
										<div>Line 1: {completion.score.stressPattern.promptPattern}</div>
										<div>Line 2: {completion.score.stressPattern.completionPattern}</div>
									</div>
								</div>

								{#if completion.score.alliteration.matches.length > 0}
									<div class="flex justify-between">
										<span>
											Alliteration: {completion.score.alliteration.matches
												.map((m) => `${m.count}× "${m.consonant}"`)
												.join(', ')}
										</span>
										<span class="font-semibold">+{completion.score.alliteration.points}</span>
									</div>
								{/if}

								{#if completion.score.consonance.matches.length > 0}
									<div class="flex justify-between">
										<span>
											Consonance: {completion.score.consonance.matches
												.map((m) => `${m.count}× "${m.vowel}"`)
												.join(', ')}
										</span>
										<span class="font-semibold">+{completion.score.consonance.points}</span>
									</div>
								{/if}

								{#if completion.score.wordBankBonus.usedWords.length > 0}
									<div class="flex justify-between">
										<span>
											Word Bank Bonus: Used "{completion.score.wordBankBonus.usedWords.join(
												'", "'
											)}"
										</span>
										<span class="font-semibold">+{completion.score.wordBankBonus.points}</span>
									</div>
								{/if}

								<div class="border-t-border border-t pt-2"></div>
								<div class="flex justify-between text-base font-bold">
									<span>Completion Score:</span>
									<span>{formatScore(completion.score.total)} pts</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Play Again Button -->
	<div class="text-center">
		<button
			onclick={onPlayAgain}
			class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 text-lg font-semibold shadow-lg transition-colors"
		>
			Play Again
		</button>
	</div>
</div>

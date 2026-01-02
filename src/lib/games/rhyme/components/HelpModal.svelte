<script lang="ts">
	import { TIMING } from '../config.js';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	aria-labelledby="help-title"
	tabindex="-1"
>
	<!-- Modal Content -->
	<div class="bg-background max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 id="help-title" class="text-2xl font-bold">How to Play Rhyme Thyme</h2>
			<button
				onclick={onClose}
				class="hover:bg-muted rounded-lg p-2 transition-colors"
				aria-label="Close help"
			>
				✕
			</button>
		</div>

		<div class="space-y-4 text-sm">
			<section>
				<h3 class="mb-2 font-semibold">Objective</h3>
				<p class="text-muted-foreground">
					Complete as many creative couplets as possible! You'll receive the first line from a
					Wikipedia article. Your job is to write second lines that complete the couplet.
				</p>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">Time Limit & Multipliers</h3>
				<ul class="text-muted-foreground list-disc space-y-1 pl-5">
					<li>
						You have {TIMING.roundDuration / 60} minutes to write up to {TIMING.maxCompletions} completions
					</li>
					<li>Faster completion = higher score multiplier!</li>
					<li>
						≤1 min = 5× multiplier, ≤1.25 min = 4×, ≤1.5 min = 3×, ≤1.75 min = 2×, ≤2 min = 1×
					</li>
				</ul>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">Scoring Categories</h3>
				<ul class="text-muted-foreground list-disc space-y-1 pl-5">
					<li>
						<strong>End Rhyme:</strong> Points based on how well your line rhymes with the prompt (max
						20 pts)
					</li>
					<li>
						<strong>Internal Rhymes:</strong> Bonus for rhyming words within the couplet (+5-10 pts)
					</li>
					<li>
						<strong>Syllable Match:</strong> Points for matching the syllable count (max 10 pts)
					</li>
					<li>
						<strong>Stress Pattern:</strong> Points for matching the rhythm/stress (max 20 pts)
					</li>
					<li>
						<strong>Alliteration:</strong> Bonus for repeating consonant sounds (+1 pt per match)
					</li>
					<li><strong>Consonance:</strong> Bonus for repeating vowel sounds (+1 pt per match)</li>
					<li><strong>Word Bank Bonus:</strong> Use the bonus words for extra points!</li>
				</ul>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">Bonus Words</h3>
				<p class="text-muted-foreground mb-2">
					Five bonus words are displayed from the same Wikipedia article. Including them in your
					completions earns extra points:
				</p>
				<ul class="text-muted-foreground list-disc space-y-1 pl-5">
					<li>+5 pts per completion that uses a bonus word</li>
					<li>Variety bonus: 10/25/50/100/200 pts for using 1/2/3/4/5 different words</li>
					<li>Words turn green with a checkmark when used</li>
				</ul>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">Real-time Feedback</h3>
				<ul class="text-muted-foreground list-disc space-y-1 pl-5">
					<li>Input border turns green when a rhyme is detected</li>
					<li>Bonus words show checkmarks when typed</li>
					<li>Press Enter to submit your completion</li>
				</ul>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">Tips</h3>
				<ul class="text-muted-foreground list-disc space-y-1 pl-5">
					<li>Don't overthink it! Silly rhymes are just as valid as serious ones</li>
					<li>There are no penalties, only rewards for what you do well</li>
					<li>Use the Skip button if you're stuck on a prompt</li>
					<li>Focus on speed to get higher multipliers</li>
					<li>Try to incorporate bonus words for extra points</li>
				</ul>
			</section>

			<section>
				<h3 class="mb-2 font-semibold">After the Round</h3>
				<p class="text-muted-foreground">
					View detailed scoring breakdowns for each completion. Your top 3 completions will be
					highlighted on the podium with gold, silver, and bronze outlines!
				</p>
			</section>
		</div>

		<div class="mt-6 text-center">
			<button
				onclick={onClose}
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-semibold transition-colors"
			>
				Got It!
			</button>
		</div>
	</div>
</div>

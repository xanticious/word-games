<script lang="ts">
	import { settings, settingsActions } from '$lib/stores/settings.js';
	import { themes, textSizes, themeUtils } from '$lib/stores/themes.js';
	import { ThemeSelector, DifficultySelector } from '$lib/components/index.js';
	import { getAllDifficulties } from '$lib/utils/gameConfigs.js';
	import type { ModalProps } from '$lib/types/ui.js';

	interface Props {
		open: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	// Get current settings
	let currentSettings = $state($settings);

	// Subscribe to settings changes
	settings.subscribe((s) => (currentSettings = s));

	function handleClose() {
		onclose?.();
	}

	function handleThemeChange(themeId: string) {
		settingsActions.setTheme(themeId as any);
	}

	function handleTextSizeChange(sizeId: string) {
		settingsActions.setTextSize(sizeId as any);
	}

	function handleDifficultyChange(difficulty: 'easy' | 'medium' | 'hard') {
		settingsActions.setDefaultDifficulty(difficulty);
	}

	function handleResetSettings() {
		if (confirm('Are you sure you want to reset all settings to defaults?')) {
			settingsActions.reset();
		}
	}

	function clearRecentGames() {
		if (confirm('Are you sure you want to clear your recent games history?')) {
			settingsActions.clearRecentGames();
		}
	}

	// Close modal on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleClose();
		}
	}

	// Close modal when clicking backdrop
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if open}
	<!-- Modal backdrop -->
	<div
		class="animate-fade-in fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-title"
		tabindex="0"
	>
		<!-- Modal content -->
		<div
			class="animate-slide-up fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
		>
			<div class="border-border bg-background mx-4 rounded-lg border p-6 shadow-lg">
				<!-- Header -->
				<div class="border-border flex items-center justify-between border-b pb-4">
					<h2 id="settings-title" class="text-foreground text-lg font-semibold">Settings</h2>
					<button
						onclick={handleClose}
						class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
						aria-label="Close settings"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m6 6 12 12" />
							<path d="m18 6-12 12" />
						</svg>
					</button>
				</div>

				<!-- Settings content -->
				<div class="space-y-6 py-4">
					<!-- Theme selection -->
					<div class="space-y-3">
						<h3 class="text-foreground text-sm font-medium">Appearance</h3>
						<div class="space-y-2">
							<div class="text-muted-foreground text-sm">Theme</div>
							<ThemeSelector
								currentTheme={currentSettings.theme}
								{themes}
								onThemeChange={handleThemeChange}
								compact={false}
							/>
						</div>
					</div>

					<!-- Text size selection -->
					<div class="space-y-3">
						<div class="space-y-2">
							<div class="text-muted-foreground text-sm">Text Size</div>
							<div class="flex gap-2">
								{#each textSizes as textSize}
									<button
										onclick={() => handleTextSizeChange(textSize.id)}
										class="ring-offset-background focus-visible:ring-ring inline-flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 {currentSettings.textSize ===
										textSize.id
											? 'bg-primary border-primary text-primary-foreground hover:bg-primary/80 shadow'
											: 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}"
										title={textSize.displayName}
									>
										{textSize.displayName}
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Default difficulty -->
					<div class="space-y-3">
						<div class="space-y-2">
							<div class="text-muted-foreground text-sm">Default Difficulty</div>
							<DifficultySelector
								currentDifficulty={currentSettings.defaultDifficulty}
								difficulties={getAllDifficulties()}
								onDifficultyChange={handleDifficultyChange}
								showDescription={false}
							/>
						</div>
					</div>

					<!-- Game statistics -->
					<div class="space-y-3">
						<h3 class="text-foreground text-sm font-medium">Game Data</h3>
						<div class="text-muted-foreground space-y-2 text-sm">
							<div class="flex justify-between">
								<span>Favorite Games:</span>
								<span>{currentSettings.favoriteGames.length}</span>
							</div>
							<div class="flex justify-between">
								<span>Recent Games:</span>
								<span>{currentSettings.recentGames.length}</span>
							</div>
						</div>
						<div class="flex gap-2">
							<button
								onclick={clearRecentGames}
								class="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 flex-1 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
								disabled={currentSettings.recentGames.length === 0}
							>
								Clear Recent
							</button>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-border flex items-center justify-between border-t pt-4">
					<button
						onclick={handleResetSettings}
						class="ring-offset-background focus-visible:ring-ring border-destructive bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
					>
						Reset All
					</button>
					<button
						onclick={handleClose}
						class="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import type { ThemeConfig } from '$lib/types';

	interface Props {
		currentTheme: string;
		themes: ThemeConfig[];
		onThemeChange?: (themeId: string) => void;
		compact?: boolean;
	}

	let { currentTheme, themes, onThemeChange, compact = false }: Props = $props();

	let isOpen = $state(false);

	function handleThemeSelect(themeId: string) {
		onThemeChange?.(themeId);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.theme-selector')) {
			isOpen = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="theme-selector relative">
	{#if compact}
		<!-- Compact icon-only button -->
		<button
			onclick={toggleDropdown}
			class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			aria-label="Change theme"
			aria-expanded={isOpen}
		>
			{#if currentTheme === 'light'}
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
					<circle cx="12" cy="12" r="4" />
					<path d="m12 2 0 2" />
					<path d="m12 20 0 2" />
					<path d="m4.93 4.93 1.41 1.41" />
					<path d="m17.66 17.66 1.41 1.41" />
					<path d="m2 12 2 0" />
					<path d="m20 12 2 0" />
					<path d="m6.34 17.66-1.41 1.41" />
					<path d="m19.07 4.93-1.41 1.41" />
				</svg>
			{:else if currentTheme === 'dark'}
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
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
				</svg>
			{:else}
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
					<circle cx="12" cy="12" r="3" />
					<path d="M12 1v6m0 6v6" />
					<path d="m1 12 6 0m6 0 6 0" />
					<path d="M5.6 5.6l4.24 4.24m4.32 4.32L18.4 18.4" />
					<path d="M18.4 5.6l-4.24 4.24m-4.32 4.32L5.6 18.4" />
				</svg>
			{/if}
		</button>
	{:else}
		<!-- Full button with text -->
		<button
			onclick={toggleDropdown}
			class="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			aria-expanded={isOpen}
		>
			{themes.find((t) => t.id === currentTheme)?.displayName || 'Theme'}
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
				class="transition-transform {isOpen ? 'rotate-180' : ''}"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</button>
	{/if}

	{#if isOpen}
		<div
			class="border-border bg-popover text-popover-foreground absolute right-0 top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg"
		>
			{#each themes as theme}
				<button
					onclick={() => handleThemeSelect(theme.id)}
					class="hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 {currentTheme ===
					theme.id
						? 'bg-accent text-accent-foreground'
						: ''}"
					role="menuitem"
				>
					<div class="flex items-center gap-2">
						<div
							class="border-border h-4 w-4 rounded-full border-2 {theme.cssClass} bg-background"
						></div>
						<span>{theme.displayName}</span>
					</div>
					{#if currentTheme === theme.id}
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
							class="ml-auto"
						>
							<polyline points="20,6 9,17 4,12" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

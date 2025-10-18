<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { settings } from '$lib/stores/settings.js';
	import { currentTheme } from '$lib/stores/themes.js';
	import { ThemeSelector } from '$lib/components/index.js';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { themes } from '$lib/stores/themes.js';

	let showSettingsModal = $state(false);
	let currentSettings = $state($settings);
	let theme = $state($currentTheme);

	// Subscribe to stores
	settings.subscribe((s) => (currentSettings = s));
	currentTheme.subscribe((t) => (theme = t));

	function toggleSettingsModal() {
		showSettingsModal = !showSettingsModal;
	}

	function handleThemeChange(themeId: string) {
		// Theme change is handled by the ThemeSelector component
	}

	// Check if we're on the home page
	let isHomePage = $derived($page.url.pathname === base || $page.url.pathname === `${base}/`);

	// Navigation items
	const navItems = [
		{ label: 'Home', href: base || '/', icon: '🏠' },
		{ label: 'Games', href: `${base || ''}/#games`, icon: '🎮' }
	];
</script>

<SettingsModal bind:open={showSettingsModal} onclose={() => (showSettingsModal = false)} />

<header
	class="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur"
>
	<div class="container flex h-16 items-center justify-between">
		<!-- Logo and title -->
		<div class="flex items-center gap-4">
			<a href={base || '/'} class="flex items-center gap-2 transition-opacity hover:opacity-80">
				<div class="text-2xl">🎯</div>
				<div class="text-foreground text-lg font-bold">Word Games</div>
			</a>

			{#if !isHomePage}
				<!-- Breadcrumb navigation for game pages -->
				<nav class="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
					<span>/</span>
					<span class="capitalize">{$page.url.pathname.slice(1) || 'Home'}</span>
				</nav>
			{/if}
		</div>

		<!-- Navigation items (desktop) -->
		<nav class="hidden items-center gap-6 md:flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors {$page
						.url.pathname === item.href
						? 'text-foreground'
						: ''}"
				>
					<span class="text-base">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Right side controls -->
		<div class="flex items-center gap-2">
			<!-- Theme selector (compact) -->
			<ThemeSelector
				currentTheme={currentSettings.theme}
				{themes}
				onThemeChange={handleThemeChange}
				compact={true}
			/>

			<!-- Settings button -->
			<button
				onclick={toggleSettingsModal}
				class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
				aria-label="Open settings"
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
					<path
						d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
					/>
					<circle cx="12" cy="12" r="3" />
				</svg>
			</button>

			<!-- Mobile menu button -->
			<button
				class="ring-offset-background focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:hidden"
				aria-label="Open mobile menu"
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
					<line x1="4" x2="20" y1="12" y2="12" />
					<line x1="4" x2="20" y1="6" y2="6" />
					<line x1="4" x2="20" y1="18" y2="18" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile navigation (hidden by default, can be toggled) -->
	<nav class="border-border bg-background hidden border-t md:hidden">
		<div class="container py-4">
			<div class="flex flex-col gap-3">
				{#each navItems as item}
					<a
						href={item.href}
						class="text-muted-foreground hover:text-foreground flex items-center gap-3 py-2 text-sm font-medium transition-colors {$page
							.url.pathname === item.href
							? 'text-foreground'
							: ''}"
					>
						<span class="text-lg">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>
</header>

<style>
	/* Ensure header is always above other content */
	header {
		position: sticky;
		top: 0;
		z-index: 40;
	}
</style>

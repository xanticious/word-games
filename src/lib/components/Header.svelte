<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	// Check if we're on the home page
	let isHomePage = $derived($page.url.pathname === base || $page.url.pathname === `${base}/`);

	// Navigation items
	const navItems = [
		{ label: 'Home', href: base || '/' },
		{ label: 'Games', href: `${base || ''}/#games` },
		{ label: 'Dictionary', href: `${base || ''}/dictionary` }
	];
</script>

<header
	class="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur"
>
	<div class="container flex h-16 items-center justify-between">
		<!-- Logo and title -->
		<div class="flex items-center gap-4">
			<a href={base || '/'} class="flex items-center gap-2 transition-opacity hover:opacity-80">
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
					{item.label}
				</a>
			{/each}
		</nav>
	</div>
</header>

<style>
	/* Ensure header is always above other content */
	header {
		position: sticky;
		top: 0;
		z-index: 40;
	}
</style>

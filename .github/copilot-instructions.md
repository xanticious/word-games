# Copilot Instructions for word-games

## Project Overview

This is a SvelteKit 2.x application built with TypeScript, using Tailwind CSS 4.x and Vitest for testing. The project uses Svelte 5's new syntax with runes (`$props()`, `$state()`, etc.).

## Architecture & Key Files

- **SvelteKit app structure**: Routes in `src/routes/` with `+page.svelte` and `+layout.svelte` patterns
- **Static adapter**: Configured for static site generation (`@sveltejs/adapter-static`)
- **Tailwind CSS 4.x**: Uses new `@import 'tailwindcss'` and `@plugin` syntax in `src/app.css`
- **Library code**: Place reusable components in `src/lib/` (accessible via `$lib` alias)

## Development Workflow

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run all tests once
npm run test:unit    # Run tests in watch mode
npm run check        # TypeScript + Svelte check
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format with Prettier
```

## Testing Strategy

- **Dual test setup**: Separate configurations for client-side (browser) and server-side (Node.js) tests
- **Client tests**: Use Vitest browser mode with Playwright (`*.svelte.{test,spec}.{js,ts}`)
- **Server tests**: Regular Vitest with Node.js environment (`*.{test,spec}.{js,ts}`)
- **Svelte component testing**: Use `vitest-browser-svelte` with `render()` function
- **Test patterns**: Use `page.getByRole()` for accessibility-focused element selection

## Code Conventions

- **Svelte 5 runes**: Use `let { children } = $props()` instead of `export let` for props
- **TypeScript**: Strict mode enabled, use `.ts` for logic, `.svelte` for components
- **Imports**: Use `$lib` alias for library imports (e.g., `import favicon from '$lib/assets/favicon.svg'`)
- **Styling**: Tailwind utilities with forms and typography plugins available

## Key Configuration Details

- **ESLint**: Custom config with TypeScript, Svelte, and Prettier integration
- **Vite plugins**: Includes devtools-json for development debugging
- **Static generation**: All routes pre-rendered at build time
- **Browser targets**: Modern ES modules with bundler module resolution

## Testing Examples

```typescript
// Svelte component test
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';

render(Component);
await expect.element(page.getByRole('heading')).toBeInTheDocument();
```

When working on this project, prioritize Svelte 5 syntax, maintain the dual testing setup, and follow the established TypeScript + Tailwind patterns.

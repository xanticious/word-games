import { derived } from 'svelte/store';
import { settings } from './settings.js';
import type { ThemeConfig, TextSizeConfig } from '$lib/types';

// Theme configurations
export const themes: ThemeConfig[] = [
	{
		name: 'light',
		id: 'light',
		displayName: 'Light',
		description: 'Clean and bright interface',
		cssClass: 'theme-light'
	},
	{
		name: 'dark',
		id: 'dark',
		displayName: 'Dark',
		description: 'Easy on the eyes in low light',
		cssClass: 'theme-dark'
	},
	{
		name: 'high-contrast',
		id: 'high-contrast',
		displayName: 'High Contrast',
		description: 'Maximum accessibility and readability',
		cssClass: 'theme-high-contrast'
	}
];

// Text size configurations
export const textSizes: TextSizeConfig[] = [
	{
		name: 'small',
		id: 'small',
		displayName: 'Small',
		cssClass: 'text-size-small',
		scaleFactor: 0.875
	},
	{
		name: 'medium',
		id: 'medium',
		displayName: 'Medium',
		cssClass: 'text-size-medium',
		scaleFactor: 1.0
	},
	{
		name: 'large',
		id: 'large',
		displayName: 'Large',
		cssClass: 'text-size-large',
		scaleFactor: 1.125
	},
	{
		name: 'extra-large',
		id: 'extra-large',
		displayName: 'Extra Large',
		cssClass: 'text-size-xl',
		scaleFactor: 1.25
	}
];

// Derived stores for current theme and text size
export const currentTheme = derived(
	settings,
	($settings) => themes.find((t) => t.id === $settings.theme) || themes[0]
);

export const currentTextSize = derived(
	settings,
	($settings) => textSizes.find((t) => t.id === $settings.textSize) || textSizes[1]
);

// Combined CSS classes for easy application
export const themeClasses = derived(
	[currentTheme, currentTextSize],
	([$theme, $textSize]) => `${$theme.cssClass} ${$textSize.cssClass}`
);

// Theme utilities
export const themeUtils = {
	// Apply theme to document root
	applyTheme(theme: ThemeConfig) {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;

		// Remove all theme classes
		themes.forEach((t) => root.classList.remove(t.cssClass));

		// Add current theme class
		root.classList.add(theme.cssClass);

		// Set CSS custom properties based on theme
		switch (theme.id) {
			case 'light':
				root.style.setProperty('--color-scheme', 'light');
				break;
			case 'dark':
				root.style.setProperty('--color-scheme', 'dark');
				break;
			case 'high-contrast':
				root.style.setProperty('--color-scheme', 'light');
				break;
		}
	},

	// Apply text size to document root
	applyTextSize(textSize: TextSizeConfig) {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;

		// Remove all text size classes
		textSizes.forEach((t) => root.classList.remove(t.cssClass));

		// Add current text size class
		root.classList.add(textSize.cssClass);

		// Set CSS custom property for scale factor
		root.style.setProperty('--text-scale-factor', textSize.scaleFactor.toString());
	},

	// Get theme by ID
	getTheme(id: string): ThemeConfig | undefined {
		return themes.find((t) => t.id === id);
	},

	// Get text size by ID
	getTextSize(id: string): TextSizeConfig | undefined {
		return textSizes.find((t) => t.id === id);
	},

	// Check if current theme is dark
	isDarkTheme(theme: ThemeConfig): boolean {
		return theme.id === 'dark';
	},

	// Check if current theme is high contrast
	isHighContrastTheme(theme: ThemeConfig): boolean {
		return theme.id === 'high-contrast';
	}
};

// Auto-apply theme changes to document
if (typeof window !== 'undefined') {
	currentTheme.subscribe((theme) => {
		themeUtils.applyTheme(theme);
	});

	currentTextSize.subscribe((textSize) => {
		themeUtils.applyTextSize(textSize);
	});
}

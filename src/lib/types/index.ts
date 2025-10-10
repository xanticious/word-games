// Re-export all types for easy importing
export * from './settings.js';
export * from './games.js';
export * from './dictionary.js';
export * from './ui.js';

// Common utility types
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Theme = 'light' | 'dark' | 'high-contrast';
export type TextSize = 'small' | 'medium' | 'large' | 'extra-large';
export type GameCategory = 'word-guessing' | 'puzzle' | 'speed' | 'creative';

// Utility type for making all properties optional
export type Partial<T> = {
	[P in keyof T]?: T[P];
};

// Utility type for making all properties required
export type Required<T> = {
	[P in keyof T]-?: T[P];
};

// Event handler types for Svelte
export type ClickHandler = (event: MouseEvent) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;
export type InputHandler = (event: Event) => void;
export type ChangeHandler = (event: Event) => void;

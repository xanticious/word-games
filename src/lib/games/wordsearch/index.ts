/**
 * Word Search game exports
 */

export { default as WordGrid } from './WordGrid.svelte';
export { default as WordList } from './WordList.svelte';
export { default as HighlightCanvas } from './HighlightCanvas.svelte';
export * from './types.js';
export * from './wordListService.js';
export * from './textProcessor.js';
export * from './gridGenerator.js';
export * from './selectionLogic.js';

// Re-export commonly used types
export type { GridCell, Highlight, FoundWord, Direction } from './types.js';

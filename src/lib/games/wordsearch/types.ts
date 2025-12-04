/**
 * Type definitions for Word Search game
 */

export type GridSize = 'small' | 'medium' | 'large';
export type Density = 'sparse' | 'normal' | 'dense';
export type WordListType =
	| 'characters'
	| 'movies'
	| 'books'
	| 'wikipedia'
	| 'imdb-movie'
	| 'imdb-actor'
	| 'goodreads';

export type Direction = 'right' | 'down' | 'left' | 'up' | 'ne' | 'se' | 'sw' | 'nw';

export interface DirectionConfig {
	enabled: boolean;
	label: string;
	description: string;
}

export interface WordSearchSettings {
	gridSize: GridSize;
	density: Density;
	wordList: WordListType;
	allowedDirections: Record<Direction, boolean>;
}

export interface GridSizeInfo {
	value: GridSize;
	label: string;
	description: string;
	dimensions: string;
}

export interface DensityInfo {
	value: Density;
	label: string;
	description: string;
}

export interface WordListInfo {
	value: WordListType;
	label: string;
	description: string;
}

export const GRID_SIZES: GridSizeInfo[] = [
	{
		value: 'small',
		label: 'Small',
		description: '10x10 grid',
		dimensions: '10x10'
	},
	{
		value: 'medium',
		label: 'Medium',
		description: '15x15 grid',
		dimensions: '15x15'
	},
	{
		value: 'large',
		label: 'Large',
		description: '20x20 grid',
		dimensions: '20x20'
	}
];

export const DENSITIES: DensityInfo[] = [
	{
		value: 'sparse',
		label: 'Sparse',
		description: 'Fewer words, easier to spot'
	},
	{
		value: 'normal',
		label: 'Normal',
		description: 'Balanced word count'
	},
	{
		value: 'dense',
		label: 'Dense',
		description: 'More words, harder challenge'
	}
];

export const WORD_LISTS: WordListInfo[] = [
	{
		value: 'characters',
		label: 'Characters',
		description: 'Characters from a random book or movie'
	},
	{
		value: 'movies',
		label: 'Movies',
		description: 'Names of popular movies'
	},
	{
		value: 'books',
		label: 'Books',
		description: 'Names of popular books'
	},
	{
		value: 'wikipedia',
		label: 'Wikipedia',
		description: 'Topics from a random Wikipedia page'
	},
	{
		value: 'imdb-movie',
		label: 'IMDB (Movie)',
		description: 'Random movie from IMDB'
	},
	{
		value: 'imdb-actor',
		label: 'IMDB (Actor)',
		description: 'Random actor from IMDB'
	},
	{
		value: 'goodreads',
		label: 'GoodReads',
		description: 'Random book review from GoodReads'
	}
];

export const DIRECTIONS: Record<Direction, DirectionConfig> = {
	right: {
		enabled: true,
		label: 'Right',
		description: '→'
	},
	down: {
		enabled: true,
		label: 'Down',
		description: '↓'
	},
	left: {
		enabled: false,
		label: 'Left',
		description: '←'
	},
	up: {
		enabled: false,
		label: 'Up',
		description: '↑'
	},
	ne: {
		enabled: false,
		label: 'Diagonal (NE)',
		description: '↗︎'
	},
	se: {
		enabled: false,
		label: 'Diagonal (SE)',
		description: '↘︎'
	},
	sw: {
		enabled: false,
		label: 'Diagonal (SW)',
		description: '↙︎'
	},
	nw: {
		enabled: false,
		label: 'Diagonal (NW)',
		description: '↖︎'
	}
};

// Game state types
export interface GridCell {
	letter: string;
	row: number;
	col: number;
	isSelected: boolean;
	isLetterHighlighted?: boolean;
}

export interface Highlight {
	word: string;
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
	direction: Direction;
	color: string;
}

export interface FoundWord {
	word: string;
	cells: { row: number; col: number }[];
}

export interface WordSearchGame {
	grid: GridCell[][];
	wordList: string[];
	foundWords: FoundWord[];
	isComplete: boolean;
}

// Available highlight colors
export const HIGHLIGHT_COLORS = [
	'palegreen',
	'paleturquoise',
	'palegoldenrod',
	'lightpink',
	'lightsalmon',
	'lightblue',
	'plum',
	'khaki'
];

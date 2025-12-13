/**
 * Type definitions for Word Search game
 */

export type GridSize = 'small' | 'medium' | 'large';
export type Density = 'sparse' | 'normal' | 'dense';
export type WordListType =
	// Wikipedia
	| 'wikipedia-random'
	// Movies
	| 'movies-random-list'
	| 'movies-actors-list'
	| 'movies-random-cast'
	| 'movies-actor-filmography'
	// Books
	| 'books-random-list'
	| 'books-authors-list'
	| 'books-goodreads-blurb'
	| 'books-random-characters'
	| 'books-author-works';

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
	// Wikipedia
	{
		value: 'wikipedia-random',
		label: 'Random Page',
		description: 'Words from a random Wikipedia article'
	},
	// Movies
	{
		value: 'movies-random-list',
		label: 'Random List of Movies',
		description: 'Random collection of movie titles'
	},
	{
		value: 'movies-actors-list',
		label: 'Random List of Actors',
		description: 'Random collection of actor names'
	},
	{
		value: 'movies-random-cast',
		label: 'Random Movie Cast',
		description: 'Actor names from a random movie'
	},
	{
		value: 'movies-actor-filmography',
		label: 'Random Actor Filmography',
		description: 'Movies and shows featuring a random actor'
	},
	// Books
	{
		value: 'books-random-list',
		label: 'Random List of Books',
		description: 'Random collection of book titles'
	},
	{
		value: 'books-authors-list',
		label: 'Random List of Authors',
		description: 'Random collection of author names'
	},
	{
		value: 'books-goodreads-blurb',
		label: 'Random GoodReads Book Blurb',
		description: 'Words from a random book description'
	},
	{
		value: 'books-random-characters',
		label: 'Random Book Characters',
		description: 'Character names from a random book'
	},
	{
		value: 'books-author-works',
		label: "Random Author's Works",
		description: 'Book titles from a random author'
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

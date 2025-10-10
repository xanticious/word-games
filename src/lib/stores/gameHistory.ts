import { writable, derived } from 'svelte/store';
import type { GameResult, GameHistoryEntry } from '$lib/types';

// Game results storage (for statistics)
const createGameResultsStore = () => {
	const defaultResults: GameResult[] = [];

	// Load from localStorage
	function loadResults(): GameResult[] {
		if (typeof window === 'undefined') return defaultResults;

		try {
			const stored = localStorage.getItem('word-games-results');
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.warn('Failed to load game results from localStorage:', error);
		}

		return defaultResults;
	}

	// Save to localStorage
	function saveResults(results: GameResult[]) {
		if (typeof window === 'undefined') return;

		try {
			localStorage.setItem('word-games-results', JSON.stringify(results));
		} catch (error) {
			console.warn('Failed to save game results to localStorage:', error);
		}
	}

	const { subscribe, update, set } = writable<GameResult[]>(loadResults());

	// Auto-save on changes
	if (typeof window !== 'undefined') {
		subscribe(saveResults);
	}

	return {
		subscribe,

		// Add a new game result
		addResult(result: GameResult) {
			update((results) => {
				const updated = [result, ...results];
				// Keep only last 1000 results to prevent storage bloat
				return updated.slice(0, 1000);
			});
		},

		// Clear all results
		clear() {
			set([]);
		},

		// Get results for a specific game
		getGameResults(gameId: string) {
			return derived({ subscribe }, ($results) => $results.filter((r) => r.gameId === gameId));
		}
	};
};

export const gameResults = createGameResultsStore();

// Game history for recent games (derived from settings store)
export const gameHistory = derived([gameResults], ([$results]) => {
	// Get unique games from recent results
	const recentGames = new Map<string, GameHistoryEntry>();

	$results
		.sort((a, b) => b.timestamp - a.timestamp)
		.forEach((result) => {
			if (!recentGames.has(result.gameId)) {
				recentGames.set(result.gameId, {
					gameId: result.gameId,
					gameName: result.gameId, // Will be resolved by game config
					timestamp: result.timestamp,
					result
				});
			}
		});

	return Array.from(recentGames.values()).slice(0, 10);
});

// Game statistics derived stores
export const gameStats = {
	// Overall statistics
	overallStats: derived(gameResults, ($results) => {
		if ($results.length === 0) {
			return {
				totalGames: 0,
				totalScore: 0,
				averageScore: 0,
				totalTime: 0,
				averageTime: 0,
				completionRate: 0,
				bestScore: 0,
				bestTime: 0
			};
		}

		const completed = $results.filter((r) => r.completed);
		const totalScore = $results.reduce((sum, r) => sum + r.score, 0);
		const totalTime = $results.reduce((sum, r) => sum + r.timeElapsed, 0);
		const bestScore = Math.max(...$results.map((r) => r.score));
		const bestTime = Math.min(...completed.map((r) => r.timeElapsed));

		return {
			totalGames: $results.length,
			totalScore,
			averageScore: totalScore / $results.length,
			totalTime,
			averageTime: totalTime / $results.length,
			completionRate: (completed.length / $results.length) * 100,
			bestScore: bestScore || 0,
			bestTime: bestTime === Infinity ? 0 : bestTime
		};
	}),

	// Stats by game
	getGameStats: (gameId: string) =>
		derived(gameResults, ($results) => {
			const gameResults = $results.filter((r) => r.gameId === gameId);

			if (gameResults.length === 0) {
				return {
					gamesPlayed: 0,
					averageScore: 0,
					bestScore: 0,
					averageTime: 0,
					bestTime: 0,
					completionRate: 0,
					recentScore: 0,
					scoreImprovement: 0
				};
			}

			const completed = gameResults.filter((r) => r.completed);
			const totalScore = gameResults.reduce((sum, r) => sum + r.score, 0);
			const totalTime = gameResults.reduce((sum, r) => sum + r.timeElapsed, 0);
			const bestScore = Math.max(...gameResults.map((r) => r.score));
			const bestTime = Math.min(...completed.map((r) => r.timeElapsed));
			const recentScore = gameResults[0]?.score || 0;

			// Calculate score improvement (last 5 vs previous 5)
			const recent5 = gameResults.slice(0, 5);
			const previous5 = gameResults.slice(5, 10);
			const recentAvg =
				recent5.length > 0 ? recent5.reduce((sum, r) => sum + r.score, 0) / recent5.length : 0;
			const previousAvg =
				previous5.length > 0
					? previous5.reduce((sum, r) => sum + r.score, 0) / previous5.length
					: 0;
			const scoreImprovement =
				previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

			return {
				gamesPlayed: gameResults.length,
				averageScore: totalScore / gameResults.length,
				bestScore: bestScore || 0,
				averageTime: totalTime / gameResults.length,
				bestTime: bestTime === Infinity ? 0 : bestTime,
				completionRate: (completed.length / gameResults.length) * 100,
				recentScore,
				scoreImprovement
			};
		}),

	// Stats by difficulty
	getDifficultyStats: (difficulty: 'easy' | 'medium' | 'hard') =>
		derived(gameResults, ($results) => {
			const difficultyResults = $results.filter((r) => r.difficulty === difficulty);

			if (difficultyResults.length === 0) {
				return {
					gamesPlayed: 0,
					averageScore: 0,
					bestScore: 0,
					completionRate: 0
				};
			}

			const completed = difficultyResults.filter((r) => r.completed);
			const totalScore = difficultyResults.reduce((sum, r) => sum + r.score, 0);
			const bestScore = Math.max(...difficultyResults.map((r) => r.score));

			return {
				gamesPlayed: difficultyResults.length,
				averageScore: totalScore / difficultyResults.length,
				bestScore: bestScore || 0,
				completionRate: (completed.length / difficultyResults.length) * 100
			};
		})
};

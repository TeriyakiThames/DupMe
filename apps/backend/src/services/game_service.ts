import { User } from "../types/user";

interface GameState {
	roomId: string;
	players: User[];
	currentPattern: string[];
	patternIndex: number;
	firstPlayer?: User;
	scores: Record<string, number>;
	turnHistory: Array<{
		turnId: string;
		role: "creator" | "follower";
		timestamp: Date;
	}>;
}

const gameStates: Map<string, GameState> = new Map();
// Map of username -> points for current match only
const playerPoints: Map<string, number> = new Map();

// Generate a random pattern of 10 keys from C, D, E, F, G, A
function randomPattern(): string[] {
	const keys = ["C", "D", "E", "F", "G", "A"];
	const pattern: string[] = [];
	for (let i = 0; i < 10; i++) {
		const randomKey = keys[Math.floor(Math.random() * keys.length)];
		pattern.push(randomKey);
	}
	return pattern;
}

export const gameService = {
	/** PATCH /increasePoint */
	async increasePoint(username: string, points: number) {
		const currentPoints = playerPoints.get(username) || 0;
		const newPoints = currentPoints + points;
		playerPoints.set(username, newPoints);

		console.log(
			`✅ increasePoint: ${username} +${points} (total: ${newPoints})`
		);

		return {
			success: true,
			username,
			previousPoints: currentPoints,
			addedPoints: points,
			newPoints,
		};
	},

	/** PATCH /decreasePoint */
	async decreasePoint(username: string, points: number) {
		const currentPoints = playerPoints.get(username) || 0;
		const newPoints = Math.max(0, currentPoints - points); // Prevent negative points
		playerPoints.set(username, newPoints);

		console.log(
			`✅ decreasePoint: ${username} -${points} (total: ${newPoints})`
		);

		return {
			success: true,
			username,
			previousPoints: currentPoints,
			deductedPoints: points,
			newPoints,
		};
	},

	/** POST /startGame */
	async startGame(roomId: string, players: User[]) {
		// Initialize player points if not exists (start at 0 for this match)
		players.forEach((player) => {
			playerPoints.set(player.username, 0); // Always reset to 0
		});

		// Randomize first player
		const firstPlayer = players[Math.floor(Math.random() * players.length)];

		// Initialize game state
		const gameState: GameState = {
			roomId,
			players,
			currentPattern: [],
			patternIndex: 0,
			firstPlayer,
			scores: {},
			turnHistory: [],
		};

		players.forEach((p) => {
			gameState.scores[p.username] = 0;
		});

		gameStates.set(roomId, gameState);

		console.log(
			`🎮 Game started in room ${roomId}. First player: ${firstPlayer.username}`
		);

		return {
			success: true,
			roomId,
			firstPlayer,
			message: `Game started! ${firstPlayer.username} goes first.`,
			players: players.map((p) => ({
				username: p.username,
				points: playerPoints.get(p.username) || 0,
			})),
		};
	},

	/** POST /startTurn */
	async startTurn(turnId: string, role: "creator" | "follower") {
		const duration = role === "creator" ? 10 : 20;

		console.log(`⏱️ Turn started: ${turnId} (${role}, ${duration}s)`);

		return {
			success: true,
			turnId,
			role,
			duration,
			message: `It's now ${role}'s turn.`,
			timestamp: new Date().toISOString(),
		};
	},

	/** POST /savePattern */
	async savePattern(roomId: string, turnId: string, seq: string[]) {
		const gameState = gameStates.get(roomId);

		if (!gameState) {
			throw new Error(`Game state not found for room ${roomId}`);
		}

		// Save the pattern and reset index
		gameState.currentPattern = seq;
		gameState.patternIndex = 0;

		console.log(`💾 Pattern saved for room ${roomId}: [${seq.join(", ")}]`);

		return {
			success: true,
			roomId,
			turnId,
			length: seq.length,
			pattern: seq,
			message: `Pattern of ${seq.length} keys saved.`,
		};
	},

	/** POST /checkPattern */
	async checkPattern(
		roomId: string,
		turnId: string,
		keyOrSequence: string | string[]
	) {
		const gameState = gameStates.get(roomId);

		if (!gameState) {
			throw new Error(`Game state not found for room ${roomId}`);
		}

		// Handle both single key and sequence input
		const inputSequence = Array.isArray(keyOrSequence)
			? keyOrSequence
			: [keyOrSequence];

		// Check if the input sequence matches the expected pattern starting from patternIndex
		let allCorrect = true;
		let lastCheckedIndex = gameState.patternIndex;

		for (let i = 0; i < inputSequence.length; i++) {
			const expectedIndex = gameState.patternIndex + i;

			// Check if we're exceeding the pattern length
			if (expectedIndex >= gameState.currentPattern.length) {
				allCorrect = false;
				break;
			}

			const expected = gameState.currentPattern[expectedIndex];
			const inputKey = inputSequence[i];

			if (inputKey !== expected) {
				allCorrect = false;
				break;
			}

			lastCheckedIndex = expectedIndex + 1;
		}

		// Update pattern index only if all keys were correct
		if (allCorrect) {
			gameState.patternIndex = lastCheckedIndex;
		}

		const done = gameState.patternIndex === gameState.currentPattern.length;
		const expectedNext = gameState.currentPattern[gameState.patternIndex];

		console.log(
			`🔍 Pattern check: ${Array.isArray(keyOrSequence) ? `[${keyOrSequence.join(", ")}]` : keyOrSequence} ${allCorrect ? "✅" : "❌"} (progress: ${gameState.patternIndex}/${gameState.currentPattern.length})`
		);

		return {
			success: true,
			correct: allCorrect,
			nextIndex: gameState.patternIndex,
			done,
			totalLength: gameState.currentPattern.length,
			expectedKey: expectedNext,
			message: allCorrect
				? done
					? "Pattern completed!"
					: "Correct key(s)!"
				: "Incorrect key(s)!",
		};
	},

	/** GET /randomPattern */
	async getRandomPattern() {
		const pattern = randomPattern();

		console.log(`🎲 Generated random pattern: [${pattern.join(", ")}]`);

		return {
			success: true,
			pattern,
			length: pattern.length,
			message: `Random pattern of ${pattern.length} keys generated.`,
		};
	},

	/** POST /saveMatchResult */
	async saveMatchResult(
		roomId: string,
		p1: string,
		p2: string,
		p1Score: number,
		p2Score: number,
		winner: string
	) {
		const gameState = gameStates.get(roomId);

		if (gameState) {
			gameState.scores[p1] = (gameState.scores[p1] || 0) + p1Score;
			gameState.scores[p2] = (gameState.scores[p2] || 0) + p2Score;
		}

		console.log(
			`📊 Match result saved for room ${roomId}: ${p1}(${p1Score}) vs ${p2}(${p2Score}) - Winner: ${winner}`
		);

		return {
			success: true,
			roomId,
			match: {
				player1: { name: p1, score: p1Score },
				player2: { name: p2, score: p2Score },
				winner,
			},
			message: `Match result recorded. Winner: ${winner}`,
		};
	},

	/** POST /endGame */
	async endGame(
		roomId: string,
		scores: Record<string, number>,
		winner: string
	) {
		const gameState = gameStates.get(roomId);

		// Update final scores
		if (gameState) {
			gameState.scores = scores;
		}

		// Create leaderboard
		const leaderboard = Object.entries(scores)
			.map(([user, pts]) => ({ user, pts }))
			.sort((a, b) => b.pts - a.pts);

		console.log(`🏁 Game ended in room ${roomId}. Winner: ${winner}`);
		console.log("📈 Final leaderboard:", leaderboard);

		return {
			success: true,
			roomId,
			winner,
			leaderboard,
			message: `Game ended. Winner: ${winner}`,
			timestamp: new Date().toISOString(),
		};
	},

	/** POST /resetGame */
	async resetGame(roomId: string) {
		const gameState = gameStates.get(roomId);

		if (gameState) {
			gameState.currentPattern = [];
			gameState.patternIndex = 0;
			gameState.turnHistory = [];
			// Reset match scores to 0
			Object.keys(gameState.scores).forEach((key) => {
				gameState.scores[key] = 0;
			});
			// Reset match points to 0
			gameState.players.forEach((player) => {
				playerPoints.set(player.username, 0);
			});
		}

		console.log(`🔄 Game reset for room ${roomId}`);

		return {
			success: true,
			roomId,
			message: `Game state reset for room ${roomId}`,
		};
	},

	// Helper method to get game state (useful for debugging)
	async getGameState(roomId: string) {
		const gameState = gameStates.get(roomId);
		return gameState || null;
	},

	// Helper method to get player points for current match
	async getPlayerPoints(username: string) {
		return playerPoints.get(username) || 0;
	},

	// Return all game states as a plain object/array suitable for JSON serialization.
	async getAllGameStates() {
		const arr = Array.from(gameStates.values()).map((gs) => ({
			...gs,
			// convert Date objects inside turnHistory to ISO strings
			turnHistory: gs.turnHistory.map((t) => ({
				...t,
				timestamp:
					t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
			})),
		}));
		return arr;
	},
};

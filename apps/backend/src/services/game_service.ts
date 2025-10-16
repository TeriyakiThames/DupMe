// In-memory implementation for DupMe Game Service
// Replace with database calls (MongoDB, PostgreSQL, etc.) for production

type Player = { userName: string; points: number };

interface GameState {
	roomId: string;
	players: Player[];
	currentPattern: string[];
	patternIndex: number;
	firstPlayer?: Player;
	scores: Record<string, number>;
	turnHistory: Array<{
		turnId: string;
		role: "creator" | "follower";
		timestamp: Date;
	}>;
}

// In-memory storage (replace with database in production)
const gameStates: Map<string, GameState> = new Map();
const playerPoints: Map<string, number> = new Map();

export const gameService = {
	/** PATCH /increasePoint */
	async increasePoint(userName: string, points: number) {
		const currentPoints = playerPoints.get(userName) || 0;
		const newPoints = currentPoints + points;
		playerPoints.set(userName, newPoints);

		console.log(
			`✅ increasePoint: ${userName} +${points} (total: ${newPoints})`
		);

		return {
			success: true,
			userName,
			previousPoints: currentPoints,
			addedPoints: points,
			newPoints,
		};
	},

	/** PATCH /decreasePoint */
	async decreasePoint(userName: string, points: number) {
		const currentPoints = playerPoints.get(userName) || 0;
		const newPoints = Math.max(0, currentPoints - points); // Prevent negative points
		playerPoints.set(userName, newPoints);

		console.log(
			`✅ decreasePoint: ${userName} -${points} (total: ${newPoints})`
		);

		return {
			success: true,
			userName,
			previousPoints: currentPoints,
			deductedPoints: points,
			newPoints,
		};
	},

	/** POST /startGame */
	async startGame(roomId: string, players: Player[]) {
		// Initialize player points if not exists
		players.forEach((player) => {
			if (!playerPoints.has(player.userName)) {
				playerPoints.set(player.userName, player.points);
			}
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
			gameState.scores[p.userName] = 0;
		});

		gameStates.set(roomId, gameState);

		console.log(
			`🎮 Game started in room ${roomId}. First player: ${firstPlayer.userName}`
		);

		return {
			success: true,
			roomId,
			firstPlayer,
			message: `Game started! ${firstPlayer.userName} goes first.`,
			players: players.map((p) => ({
				userName: p.userName,
				points: playerPoints.get(p.userName) || 0,
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
	async checkPattern(roomId: string, turnId: string, key: string) {
		const gameState = gameStates.get(roomId);

		if (!gameState) {
			throw new Error(`Game state not found for room ${roomId}`);
		}

		const expected = gameState.currentPattern[gameState.patternIndex];
		const correct = key === expected;

		if (correct) {
			gameState.patternIndex++;
		}

		const done = gameState.patternIndex === gameState.currentPattern.length;

		console.log(
			`🔍 Pattern check: ${key} ${correct ? "✅" : "❌"} (expected: ${expected}, progress: ${gameState.patternIndex}/${gameState.currentPattern.length})`
		);

		return {
			success: true,
			correct,
			nextIndex: gameState.patternIndex,
			done,
			totalLength: gameState.currentPattern.length,
			expectedKey: expected,
			message: correct
				? done
					? "Pattern completed!"
					: "Correct key!"
				: "Incorrect key!",
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
			// Optionally reset scores
			Object.keys(gameState.scores).forEach((key) => {
				gameState.scores[key] = 0;
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

	// Helper method to get player points
	async getPlayerPoints(userName: string) {
		return playerPoints.get(userName) || 0;
	},

	/**
	 * NEW: Return all game states as a plain object/array suitable for JSON serialization.
	 */
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

	/**
	 * NEW: Return all player points as an object.
	 */
	async getAllPlayerPoints() {
		const obj: Record<string, number> = {};
		for (const [k, v] of playerPoints.entries()) {
			obj[k] = v;
		}
		return obj;
	},
};

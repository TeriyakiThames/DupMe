// In-memory implementation for DupMe Game Service
// Replace with database calls (MongoDB, PostgreSQL, etc.) for production

import { UserProfile as Player } from "../types/user";
import { GameState } from "../types/game";
import { UserService } from "../services/userService";

export class RoomManager {
	private gameState: GameState | null = null;
	private playerPoints: Map<number, number> = new Map();
	private roomId: string;
    readonly players: Player[];

	constructor(roomId: string, players: Player[]) {    
		this.roomId = roomId;
        this.players = players;
        this.playerPoints = new Map(players.map(player => [player.id, 0]));
		console.log(`🎮 RoomManager created for room ${roomId}`);
	}

	async increasePoint(id: number, points: number) {
		const currentPoints = this.playerPoints.get(id) || 0;
		const newPoints = currentPoints + points;
		this.playerPoints.set(id, newPoints);

		console.log(
			`✅ increasePoint: ${id} +${points} (total: ${newPoints}) in room ${this.roomId}`
		);

		return {
			success: true,
			id: id,
			previousPoints: currentPoints,
			addedPoints: points,
			newPoints,
		};
	}

	async decreasePoint(id: number, points: number) {
		const currentPoints = this.playerPoints.get(id) || 0;
		const newPoints = Math.max(0, currentPoints - points); // Prevent negative points
		this.playerPoints.set(id, newPoints);

		console.log(
			`✅ decreasePoint: ${id} -${points} (total: ${newPoints}) in room ${this.roomId}`
		);

		return {
			success: true,
			id: id,
			previousPoints: currentPoints,
			deductedPoints: points,
			newPoints,
		};
	}

	async startGame() {
		// Randomize first player
		const firstPlayer = this.players[Math.floor(Math.random() * this.players.length)];
		const secondPlayer = this.players.find(p => p.id !== firstPlayer.id);

        // Initialize game state
        this.gameState = {
            currentPattern: [],
            questionPlayer: firstPlayer,
			answerPlayer: secondPlayer,
            turnCounts: 0,
			roundNumber: 1,
			isGameActive: true,
        };

		console.log(
			`🎮 Game started in room ${this.roomId}. Question player: ${firstPlayer.id}, Answer player: ${secondPlayer?.id}`
		);

		return {
			success: true,
			roomId: this.roomId,
			questionPlayer: firstPlayer,
			answerPlayer: secondPlayer,
			message: `Game started! ${this.players.find(player => player.id === firstPlayer.id)?.username} creates the pattern first.`,
		};
	}

	/**
	 * Save sequence from questionPlayer - called by IO when 'saveSequence' event received
	 * Returns data to send to answerPlayer via IO
	 */
	async saveSequence(playerId: number, sequence: string[]) {
        if (!this.gameState || !this.gameState.isGameActive) {
			throw new Error(`Game not active in room ${this.roomId}`);
		}

		if (this.gameState.questionPlayer?.id !== playerId) {
			throw new Error(`Player ${playerId} is not the current question player`);
		}

		// Save the sequence
		this.gameState.currentPattern = sequence;
		this.gameState.lastSequenceTime = new Date();

		console.log(`💾 Sequence saved for room ${this.roomId}: [${sequence.join(", ")}] by ${playerId}`);

		// Return data for IO to send to answerPlayer
		return {
			success: true,
			roomId: this.roomId,
			sequence,
			answerPlayerId: this.gameState.answerPlayer?.id,
			roundNumber: this.gameState.roundNumber,
			message: `Sequence ready for ${this.gameState.answerPlayer?.username}`,
		};
	}

	/**
	 * Update points from frontend after sequence checking - called by IO
	 * Returns whether to continue game or switch turns
	 */
	async updateRoundResult(playerId: number, pointsEarned: number, success: boolean) {
		if (!this.gameState || !this.gameState.isGameActive) {
			throw new Error(`Game not active in room ${this.roomId}`);
		}

		if (this.gameState.answerPlayer?.id !== playerId) {
			throw new Error(`Player ${playerId} is not the current answer player`);
		}

		// Update points
		const currentPoints = this.playerPoints.get(playerId) || 0;
		this.playerPoints.set(playerId, currentPoints + pointsEarned);

		// Increment turn count
		this.gameState.turnCounts++;

		console.log(
			`🎯 Round ${this.gameState.roundNumber} result: ${playerId} earned ${pointsEarned} points (success: ${success})`
		);

		// Determine if game should continue or switch turns
		const shouldSwitchTurns = true; // Switch every round
		const gameEnded = this.gameState.turnCounts >= 10; // End after 10 turns

		if (gameEnded) {
			this.gameState.isGameActive = false;
			return {
				success: true,
				gameEnded: true,
				roomId: this.roomId,
				finalScores: Object.fromEntries(this.playerPoints),
				message: "Game completed!",
			};
		}

		if (shouldSwitchTurns) {
			// Switch roles
			const temp = this.gameState.questionPlayer;
			this.gameState.questionPlayer = this.gameState.answerPlayer;
			this.gameState.answerPlayer = temp;
			this.gameState.roundNumber++;
			this.gameState.currentPattern = [];
		}

		return {
			success: true,
			gameEnded: false,
			switchedTurns: shouldSwitchTurns,
			roomId: this.roomId,
			currentQuestionPlayer: this.gameState.questionPlayer,
			currentAnswerPlayer: this.gameState.answerPlayer,
			roundNumber: this.gameState.roundNumber,
			currentScores: Object.fromEntries(this.playerPoints),
			message: shouldSwitchTurns ? "Roles switched!" : "Continue round",
		};
	}

	/**
	 * Get final game data for API persistence - called by IO or ServerManager
	 * Returns complete game summary for database storage
	 */
	getFinalGameData() {
		if (!this.gameState) {
			throw new Error(`No game state available in room ${this.roomId}`);
		}

		const finalScores = Object.fromEntries(this.playerPoints);
		const winner = [...this.playerPoints.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];

		return {
			roomId: this.roomId,
			players: this.players.map(p => ({
				id: p.id,
				username: p.username,
				finalScore: this.playerPoints.get(p.id) || 0
			})),
			winnerId: winner,
			totalTurns: this.gameState.turnCounts,
			totalRounds: this.gameState.roundNumber,
			gameEndTime: new Date(),
			finalScores,
		};
	}


	async saveMatchResult() {
        let bestScore = 0;
        let bestId: number | undefined;
        for (const [id, score] of this.playerPoints.entries()) {
            if (score > bestScore) {
                bestScore = score;
                bestId = id;
            }
        }

		console.log(
			`📊 Match result saved for room ${this.roomId}: ${bestId}(${bestScore})`
		);

		return {
			success: true,
			roomId: this.roomId,
			match: {
				player1: { name: this.players[0].id, score: this.playerPoints.get(this.players[0].id) || 0 },
				player2: { name: this.players[1].id, score: this.playerPoints.get(this.players[1].id) || 0 },
				bestId,
			},
			message: `Match result recorded. Winner: ${bestId}`,
		};
	}

	async endGame() {

		const leaderboard = Object.entries(this.playerPoints)
			.map(([user, pts]) => ({ user, pts }))
			.sort((a, b) => b.pts - a.pts);

		console.log(`🏁 Game ended in room ${this.roomId}. Winner: ${leaderboard[0]?.user}`);
		console.log("📈 Final leaderboard:", leaderboard);

		return {
			success: true,
			roomId: this.roomId,
			winner: leaderboard[0]?.user,
			leaderboard,
			message: `Game ended. Winner: ${leaderboard[0]?.user}`,
			timestamp: new Date().toISOString(),
		};
	}

	async resetGame() {
        // Find the other player (switch turns)
        const newQuestionPlayer = this.players.find(player => player.id !== this.gameState?.questionPlayer?.id);
		const newAnswerPlayer = this.players.find(player => player.id !== newQuestionPlayer?.id);

	    // Initialize game state
        this.gameState = {
            currentPattern: [],
            questionPlayer: newQuestionPlayer || this.players[0],
			answerPlayer: newAnswerPlayer || this.players[1],
            turnCounts: 0,
			roundNumber: 1,
			isGameActive: true,
        };

		console.log(`🔄 Game reset for room ${this.roomId} - New question player: ${newQuestionPlayer?.id}`);

		return {
			success: true,
			roomId: this.roomId,
			questionPlayer: newQuestionPlayer,
			answerPlayer: newAnswerPlayer,
			message: `Game reset! ${newQuestionPlayer?.username} creates the pattern first.`,
		};
	}

	// Helper method to get game state (useful for debugging)
	async getGameState() {
		return this.gameState || null;
	}

	// Helper method to get player points
	async getPlayerPoints(id: number) {
		return this.playerPoints.get(id) || 0;
	}

	/**
	 * Persist game results to API and update player statistics
	 */
	async persistGameResults(): Promise<any> {
		try {
			const gameData = this.getFinalGameData();
			
			console.log(`💾 Persisting game data for room ${this.roomId}:`, gameData);
			
			// Update player statistics based on game results
			const updateResults = [];
			
			// Determine game outcome and update player stats
			for (const player of gameData.players) {
				try {
					let result;
					
					if (player.id === gameData.winnerId) {
						// Winner gets a win increment
						result = await UserService.incrementWin(player.id);
						console.log(`✅ Incremented win for player ${player.id}`);
					} else if (gameData.players.length === 2) {
						// In a 2-player game, non-winner gets a loss
						result = await UserService.incrementLoss(player.id);
						console.log(`❌ Incremented loss for player ${player.id}`);
					} else {
						// For future multi-player support or tie scenarios
						result = await UserService.incrementDraw(player.id);
						console.log(`🤝 Incremented draw for player ${player.id}`);
					}
					
					updateResults.push({
						playerId: player.id,
						username: player.username,
						success: result.success,
						message: result.message,
						isWinner: player.id === gameData.winnerId
					});
					
				} catch (error) {
					console.error(`Failed to update stats for player ${player.id}:`, error);
					updateResults.push({
						playerId: player.id,
						username: player.username,
						success: false,
						error: error,
						isWinner: player.id === gameData.winnerId
					});
				}
			}
			return {
				success: true,
				message: 'Game statistics updated successfully',
				gameData,
				playerUpdates: updateResults,
				timestamp: new Date().toISOString()
			};
			
		} catch (error) {
			console.error(`Failed to persist game in room ${this.roomId}:`, error);
			return {
				success: false,
				message: 'Failed to persist game data',
				error: error
			};
		}
	}

	/**
	 * Cleanup method to clear all data when room is destroyed
	 */
	destroy() {
		this.gameState = null;
		this.playerPoints.clear();
		console.log(`🗑️ RoomManager destroyed for room ${this.roomId}`);
	}
}

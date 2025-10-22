// In-memory implementation for DupMe Game Service
// Replace with database calls (MongoDB, PostgreSQL, etc.) for production

import { UserProfile } from "../types/auth";
import { GameState } from "../types/socketGame";
import { UserService } from "../services/userService";

export class RoomManager {
	private gameState: GameState | null = null;
	private playerPoints: Map<number, number> = new Map(); 
	private roomId: string;
    readonly players: UserProfile[];

	
	constructor(roomId: string, players: UserProfile[]) {    
		this.roomId = roomId;
        this.players = players;
		console.log(`🎮 RoomManager created for room ${roomId}`);
	}

	async increasePoint(id: number, points: number) {
        if (!this.gameState) {
            throw new Error(`Game ended in room ${this.roomId}`);
        }
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
        if (!this.gameState) {
            throw new Error(`Game ended in room ${this.roomId}`);
        }
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
		const firstIndex = Math.floor(Math.random() * this.players.length);
		const questionPlayer = this.players[firstIndex];
		// All other players are answer players
		const answerPlayers = this.players.filter(p => p.id !== questionPlayer.id);
		this.playerPoints = new Map(this.players.map(player => [player.id, 0]));

		// Store the index of the current question player for turn rotation
		this.gameState = {
			currentPattern: [],
			questionPlayer,
			answerPlayers,
			turnCount: 0,
			roundNumber: 1,
			questionPlayerIndex: firstIndex,

		};

		console.log(
			`🎮 Game started in room ${this.roomId}. Question player: ${questionPlayer.id}, Answer players: [${answerPlayers.map(p => p.id).join(', ')}]`
		);

		return {
			success: true,
			roomId: this.roomId,
			gameState: this.gameState,
			message: `Game started! ${questionPlayer.username} creates the pattern first.`,
		};
	}

	/**
	 * Save sequence from questionPlayer - called by IO when 'saveSequence' event received
	 * Returns data to send to answerPlayer via IO
	 */
	async saveSequence(playerId: number, sequence: string[]) {
		if (!this.gameState) {
			throw new Error(`Game ended in room ${this.roomId}`);
		}

		if (this.gameState.questionPlayer?.id !== playerId) {
			throw new Error(`Player ${playerId} is not the current question player`);
		}

		// Save the sequence
		this.gameState.currentPattern = sequence;
		this.gameState.lastSequenceTime = new Date();

		console.log(`💾 Sequence saved for room ${this.roomId}: [${sequence.join(", ")}] by ${playerId}`);

		// Return data for IO to send to answerPlayers
		return {
			success: true,
			roomId: this.roomId,
			sequence,
			answerPlayerIds: this.gameState.answerPlayers?.map(p => p.id) || [],
			roundNumber: this.gameState.roundNumber,
			message: `Sequence ready for ${this.gameState.answerPlayers?.map(p => p.username).join(', ')}`,
		};
	}

	/**
	 * Update points from frontend after sequence checking - called by IO
	 * Returns whether to continue game or switch turns
	 */
	async updateRoundResult(playerId: number, pointsEarned: number) {
		if (!this.gameState) {
			throw new Error(`Game ended in room ${this.roomId}`);
		}

		// All answer players must submit results; for now, only allow if player is an answer player
		if (!this.gameState.answerPlayers?.some(p => p.id === playerId)) {
			throw new Error(`Player ${playerId} is not a current answer player`);
		}

		// Update points 
		const currentPoints = this.playerPoints.get(playerId) || 0;
		this.playerPoints.set(playerId, currentPoints + pointsEarned);
		const playerPoints = Object.fromEntries([...(this.playerPoints ?? [])]
													.sort((a, b) => b[1] - a[1])
													.map(([id, points]) => [id, points]));
		const usernameDelta: [string, number] = [
			this.players.find(p => p.id === playerId)?.username || 'Unknown', 
			pointsEarned
		];

		// Increment turn count
		this.gameState.turnCount++;

		console.log(
			`🎯 Round ${this.gameState.roundNumber} result: ${playerId} earned ${pointsEarned} points`
		);

		// Determine if game should continue or switch turns
		const gameEnded = this.gameState.turnCount >= 10; // End after 10 turns
		
		
												
		if (gameEnded) {
			return {
				success: true,
				gameEnded: true,
				roomId: this.roomId,
				playerPoints,
				usernameDelta,
				message: "Game completed!",
			};
		} else {
			// Rotate question player index
			const totalPlayers = this.players.length;
			let currentIndex = this.gameState.questionPlayerIndex ?? this.players.findIndex(p => p.id === this.gameState?.questionPlayer?.id);
			currentIndex = (currentIndex + 1) % totalPlayers;
			this.gameState.questionPlayerIndex = currentIndex;
			this.gameState.questionPlayer = this.players[currentIndex];
			// All other players are answer players
			this.gameState.answerPlayers = this.players.filter((p, idx) => idx !== currentIndex);
			this.gameState.roundNumber++;
			this.gameState.currentPattern = [];
		}

		return {
			success: true,
			gameEnded: false,
			roomId: this.roomId,
			gameState: this.gameState,
			playerPoints,
			usernameDelta,
			message: "Continue",
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
			totalTurns: this.gameState.turnCount,
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
			.map(([user, score]) => ({ user, score }))
			.sort((a, b) => b.score - a.score);

		console.log(`🏁 Game ended in room ${this.roomId}. Winner: ${leaderboard[0]?.user}`);
		console.log("📈 Final leaderboard:", leaderboard);

		return {
			success: true,
			roomId: this.roomId,
			winner: leaderboard[0]?.user,
			leaderboard,
			message: `Game ended. Winner: ${leaderboard[0]?.user}`,
			
		};
	}

	async resetGame() {
		// Rotate to the next question player after the current one, or start at 0 if no gameState
		let nextQuestionIndex = 0;
		if (this.gameState && typeof this.gameState.questionPlayerIndex === 'number') {
			nextQuestionIndex = (this.gameState.questionPlayerIndex + 1) % this.players.length;
		}
		const questionPlayer = this.players[nextQuestionIndex];
		const answerPlayers = this.players.filter((p, idx) => idx !== nextQuestionIndex);

		// Initialize game state
		this.gameState = {
			currentPattern: [],
			questionPlayer,
			answerPlayers,
			turnCount: 0,
			roundNumber: 1,
			questionPlayerIndex: nextQuestionIndex,
		};

		console.log(`🔄 Game reset for room ${this.roomId} - New question player: ${questionPlayer?.id}`);

		return {
			success: true,
			roomId: this.roomId,
			questionPlayer,
			answerPlayers,
			message: `Game reset! ${questionPlayer?.username} creates the pattern first.`,
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

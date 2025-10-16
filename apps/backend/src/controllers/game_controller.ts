import { Request, Response } from "express";
import { gameService } from "../services/game_service";

export const gameController = {
	/**
	 * PATCH /api/game/increasePoint
	 * Body: { userName: string, points: number }
	 */
	async increasePoint(req: Request, res: Response) {
		try {
			const { userName, points } = req.body;

			if (!userName || typeof points !== "number") {
				return res.status(400).json({
					success: false,
					error: "userName and points are required",
				});
			}

			const result = await gameService.increasePoint(userName, points);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in increasePoint:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * PATCH /api/game/decreasePoint
	 * Body: { userName: string, points: number }
	 */
	async decreasePoint(req: Request, res: Response) {
		try {
			const { userName, points } = req.body;

			if (!userName || typeof points !== "number") {
				return res.status(400).json({
					success: false,
					error: "userName and points are required",
				});
			}

			const result = await gameService.decreasePoint(userName, points);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in decreasePoint:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/startGame
	 * Body: { roomId: string, players: Player[] }
	 */
	async startGame(req: Request, res: Response) {
		try {
			const { roomId, players } = req.body;

			if (!roomId || !Array.isArray(players) || players.length === 0) {
				return res.status(400).json({
					success: false,
					error: "roomId and players array are required",
				});
			}

			const result = await gameService.startGame(roomId, players);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in startGame:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/startTurn
	 * Body: { turnId: string, role: "creator" | "follower" }
	 */
	async startTurn(req: Request, res: Response) {
		try {
			const { turnId, role } = req.body;

			if (!turnId || !role || !["creator", "follower"].includes(role)) {
				return res.status(400).json({
					success: false,
					error: "turnId and valid role (creator/follower) are required",
				});
			}

			const result = await gameService.startTurn(turnId, role);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in startTurn:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/savePattern
	 * Body: { roomId: string, turnId: string, seq: string[] }
	 */
	async savePattern(req: Request, res: Response) {
		try {
			const { roomId, turnId, seq } = req.body;

			if (!roomId || !turnId || !Array.isArray(seq)) {
				return res.status(400).json({
					success: false,
					error: "roomId, turnId, and seq array are required",
				});
			}

			const result = await gameService.savePattern(roomId, turnId, seq);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in savePattern:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/checkPattern
	 * Body: { roomId: string, turnId: string, key: string }
	 */
	async checkPattern(req: Request, res: Response) {
		try {
			const { roomId, turnId, key } = req.body;

			if (!roomId || !turnId || !key) {
				return res.status(400).json({
					success: false,
					error: "roomId, turnId, and key are required",
				});
			}

			const result = await gameService.checkPattern(roomId, turnId, key);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in checkPattern:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * GET /api/game/getGameState/:roomId
	 * Path param: roomId
	 */
	async getGameState(req: Request, res: Response) {
		try {
			const { roomId } = req.params;

			if (!roomId) {
				return res.status(400).json({
					success: false,
					error: "roomId is required",
				});
			}

			const state = await gameService.getGameState(roomId);
			if (!state) {
				return res.status(404).json({
					success: false,
					error: `Game state not found for room ${roomId}`,
				});
			}

			return res.status(200).json({ success: true, gameState: state });
		} catch (error) {
			console.error("Error in getGameState:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * GET /api/game/getPlayerPoints/:username
	 * Path param: username
	 */
	async getPlayerPoints(req: Request, res: Response) {
		try {
			const { username } = req.params;

			if (!username) {
				return res.status(400).json({
					success: false,
					error: "username is required",
				});
			}

			const points = await gameService.getPlayerPoints(username);
			return res.status(200).json({ success: true, username, points });
		} catch (error) {
			console.error("Error in getPlayerPoints:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * GET /api/game/getAllGameStates
	 */
	async getAllGameStates(req: Request, res: Response) {
		try {
			const states = await gameService.getAllGameStates();
			return res.status(200).json({ success: true, gameStates: states });
		} catch (error) {
			console.error("Error in getAllGameStates:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * GET /api/game/randomPattern
	 */
	async getRandomPattern(req: Request, res: Response) {
		try {
			const result = await gameService.getRandomPattern();
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in getRandomPattern:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/saveMatchResult
	 * Body: { roomId: string, p1: string, p2: string, p1Score: number, p2Score: number, winner: string }
	 */
	async saveMatchResult(req: Request, res: Response) {
		try {
			const { roomId, p1, p2, p1Score, p2Score, winner } = req.body;

			if (
				!roomId ||
				!p1 ||
				!p2 ||
				typeof p1Score !== "number" ||
				typeof p2Score !== "number" ||
				!winner
			) {
				return res.status(400).json({
					success: false,
					error: "All match result fields are required",
				});
			}

			const result = await gameService.saveMatchResult(
				roomId,
				p1,
				p2,
				p1Score,
				p2Score,
				winner
			);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in saveMatchResult:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/endGame
	 * Body: { roomId: string, scores: Record<string, number>, winner: string }
	 */
	async endGame(req: Request, res: Response) {
		try {
			const { roomId, scores, winner } = req.body;

			if (!roomId || !scores || !winner) {
				return res.status(400).json({
					success: false,
					error: "roomId, scores, and winner are required",
				});
			}

			const result = await gameService.endGame(roomId, scores, winner);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in endGame:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},

	/**
	 * POST /api/game/resetGame
	 * Body: { roomId: string }
	 */
	async resetGame(req: Request, res: Response) {
		try {
			const { roomId } = req.body;

			if (!roomId) {
				return res.status(400).json({
					success: false,
					error: "roomId is required",
				});
			}

			const result = await gameService.resetGame(roomId);
			return res.status(200).json(result);
		} catch (error) {
			console.error("Error in resetGame:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	},
};

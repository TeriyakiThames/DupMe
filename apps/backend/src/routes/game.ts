import { Router } from "express";
import { gameController } from "../controllers/game_controller";

const router = Router();

// Root of the API
router.get("/", (req, res) => {
	res.json({ message: "Game API root" });
});

// Point management
router.patch("/increasePoint", gameController.increasePoint);
router.patch("/decreasePoint", gameController.decreasePoint);

// Game flow
router.post("/startGame", gameController.startGame);
router.post("/startTurn", gameController.startTurn);

// Pattern management
router.post("/savePattern", gameController.savePattern);
router.post("/checkPattern", gameController.checkPattern);

// Practise mode
router.get("/randomPattern", gameController.getRandomPattern);

// Results
router.post("/saveMatchResult", gameController.saveMatchResult);
router.post("/endGame", gameController.endGame);

// Reset
router.post("/resetGame", gameController.resetGame);

// Get general info
router.get("/getGameState/:roomId", gameController.getGameState);
router.get("/getPlayerPoints/:username", gameController.getPlayerPoints);
router.get("/getAllGameStates", gameController.getAllGameStates);

export default router;

import { Router } from "express";
import { RoomController } from "../controllers/roomController";
import { RoomManager } from "../services/roomService";

// This will be initialized in server.ts with the shared roomManager instance
let roomController: RoomController;

export const initializeRoomRoutes = (roomManager: RoomManager): Router => {
  const router = Router();
  roomController = new RoomController(roomManager);

  // Create a new room
  router.post("/room", roomController.createRoom);

  // Get room information
  router.get("/room/:roomId", roomController.getRoomById);

  // Get room statistics
  router.get("/rooms/stats", roomController.getRoomStats);

  // List all rooms (for debugging/admin purposes)
  router.get("/rooms", roomController.getAllRooms);

  return router;
};
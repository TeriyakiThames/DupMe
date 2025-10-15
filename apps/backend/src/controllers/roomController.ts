import { Request, Response } from "express";
import { RoomManager } from "../services/roomService";

export class RoomController {
  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  // Create a new room
  createRoom = (req: Request, res: Response): void => {
    try {
      const roomId = this.roomManager.createRoom();
      res.json({ 
        success: true, 
        roomId,
        message: `Room ${roomId} created successfully` 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create room' 
      });
    }
  };

  // Get room information
  getRoomById = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const room = this.roomManager.getRoomById(roomId);
    
    if (!room) {
      res.status(404).json({ 
        success: false, 
        error: 'Room not found' 
      });
      return;
    }

    res.json({ 
      success: true, 
      room: {
        id: room.id,
        userCount: room.userCount,
        maxUsers: room.maxUsers,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        metadata: room.metadata
      }
    });
  };

  // Get room statistics
  getRoomStats = (req: Request, res: Response): void => {
    const stats = this.roomManager.getStats();
    res.json({ success: true, stats });
  };

  // List all rooms (for debugging/admin purposes)
  getAllRooms = (req: Request, res: Response): void => {
    const rooms = this.roomManager.getAllRooms().map(room => ({
      id: room.id,
      userCount: room.userCount,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    }));
    
    res.json({ success: true, rooms, count: rooms.length });
  };
}
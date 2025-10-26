import { Socket } from 'socket.io-client';
import { initSocket } from '@/lib/socketClient';
import type { ServerEventRequest, ServerEventBroadcast } from '@/types/socket';

export class SocketManager {
  public socket: Socket | null = null;
  private eventListeners: Map<string, Set<(data: ServerEventBroadcast) => void>> = new Map();

  constructor() {
    this.socket = initSocket();
    this._setupListeners();
  }

  private _setupListeners() {
    if (!this.socket) return;
    this.socket.on('connected', (data) => this._emitToListeners('connected', data));
    this.socket.on('server-stats', (data) => this._emitToListeners('server-stats', data));
    this.socket.on('room-created', (data) => this._emitToListeners('room-created', data));
    this.socket.on('room-joined', (data) => this._emitToListeners('room-joined', data));
    this.socket.on('room-left', (data) => this._emitToListeners('room-left', data));
    this.socket.on('player-joined', (data) => this._emitToListeners('player-joined', data));
    this.socket.on('player-left', (data) => this._emitToListeners('player-left', data));
    this.socket.on('room-info', (data) => this._emitToListeners('room-info', data));
    this.socket.on('error', (data) => this._emitToListeners('error', data));
  }

  private _emitToListeners(event: string, data: ServerEventBroadcast) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  on(event: string, cb: (data: ServerEventBroadcast) => void) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(cb);
  }
  off(event: string, cb: (data: ServerEventBroadcast) => void) {
    this.eventListeners.get(event)?.delete(cb);
  }

  // Room actions
  createRoom(data: ServerEventRequest) {
    this.socket?.emit('create-room', data);
  }
  joinRoom(data: ServerEventRequest) {
    this.socket?.emit('join-room', data);
  }
  leaveRoom(data: ServerEventRequest) {
    this.socket?.emit('leave-room', data);
  }
  getRoomInfo(data: ServerEventRequest) {
    this.socket?.emit('get-room-info', data);
  }
  getServerStats() {
    this.socket?.emit('get-server-stats');
  }
}

export let socketManager: SocketManager | null = null;
export function createSocketManager() {
  socketManager = new SocketManager();
  return socketManager;
}

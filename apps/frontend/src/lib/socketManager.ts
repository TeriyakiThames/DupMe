// socketManager.ts
// Handles room, connection, and generic events
import { Socket } from 'socket.io-client';
import { initSocket } from './socketClient';

export class SocketManager {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

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

  private _emitToListeners(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(...args));
    }
  }

  on(event: string, cb: Function) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(cb);
  }
  off(event: string, cb: Function) {
    this.eventListeners.get(event)?.delete(cb);
  }

  // Room actions
  createRoom(data: any) {
    this.socket?.emit('create-room', data);
  }
  joinRoom(data: any) {
    this.socket?.emit('join-room', data);
  }
  leaveRoom(data: any) {
    this.socket?.emit('leave-room', data);
  }
  getRoomInfo(data: any) {
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

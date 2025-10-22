// socketGameManager.ts
// Handles game-specific socket events
import { Socket } from 'socket.io-client';
import { getSocket } from './socketClient';

export class SocketGameManager {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.socket = getSocket();
    this._setupListeners();
  }

  private _setupListeners() {
    if (!this.socket) return;
    this.socket.on('game-started', (data) => this._emitToListeners('game-started', data));
    this.socket.on('sequence-saved', (data) => this._emitToListeners('sequence-saved', data));
    this.socket.on('sequence-received', (data) => this._emitToListeners('sequence-received', data));
    this.socket.on('game-ended', (data) => this._emitToListeners('game-ended', data));
    this.socket.on('game-reset', (data) => this._emitToListeners('game-reset', data));
    this.socket.on('turns-switched', (data) => this._emitToListeners('turns-switched', data));
    this.socket.on('round-updated', (data) => this._emitToListeners('round-updated', data));
    this.socket.on('game-state', (data) => this._emitToListeners('game-state', data));
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

  // Game actions
  startGame(data: any) {
    this.socket?.emit('start-game', data);
  }
  saveSequence(data: any) {
    this.socket?.emit('save-sequence', data);
  }
  submitRoundResult(data: any) {
    this.socket?.emit('submit-round-result', data);
  }
  endGame(data: any) {
    this.socket?.emit('end-game', data);
  }
  resetGame(data: any) {
    this.socket?.emit('reset-game', data);
  }
  getGameState(data: any) {
    this.socket?.emit('get-game-state', data);
  }
}

export let socketGameManager: SocketGameManager | null = null;
export function createSocketGameManager() {
  socketGameManager = new SocketGameManager();
  return socketGameManager;
}

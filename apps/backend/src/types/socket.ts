import { Socket } from 'socket.io';
import { UserProfile } from './user';

export interface SocketWithUser extends Socket {
  currentRoomId?: string;
  userProfile?: UserProfile; // Optional, will be set when user provides profile in events
}
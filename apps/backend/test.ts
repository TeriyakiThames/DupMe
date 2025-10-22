import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://localhost:4000'; // Change if needed
const SOCKET_IO_URL = 'http://localhost:4000'; // Change if needed

async function registerUser(username: string, password: string) {
  const res = await axios.post(`${API_BASE}/api/auth/register`, { username, password });
  return res.data;
}

async function loginUser(username: string, password: string) {
  const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
  return res.data;
}

async function getLeaderboard() {
  const res = await axios.get(`${API_BASE}/api/users`,

  );
  const userArr = res.data.users;

  // limit to top 10 (comes sorted)
  const topUsers = userArr
    .slice(0, 10)
    .map((user : any) => ({ [user.username]: user.win_count }));

  return topUsers;
}

async function createRoom(socket: Socket, userProfile: any, maxUsers: number = 2) {
  return new Promise((resolve) => {
    socket.emit('create-room', { userProfile, maxUsers });
    socket.on('room-created', (data) => {
      resolve(data); 
    });
  });
}

async function joinRoom(socket: Socket, userProfile: any, roomId: string) {
  return new Promise((resolve) => {
    socket.emit('join-room', { userProfile, roomId });
    socket.on('room-joined', (data) => {
      resolve(data); 
    });
  });
}

async function leaveRoom(socket: Socket, roomId: string) {
  return new Promise((resolve) => {
    socket.emit('leave-room', { roomId });
    socket.on('room-left', (data) => {
      resolve(data); 
    });
  });
}

async function startGame(socket: Socket, userProfile: any) {
  return new Promise((resolve) => {
    socket.emit('start-game', { userProfile });
    socket.on('game-started', (data) => {
      resolve(data); 
    });
  });
}

async function submitSequence(socket: Socket, userProfile: any, sequence: string[]) {
  return new Promise((resolve) => {
    socket.emit('save-sequence', { userProfile, sequence });
    socket.on('sequence-saved', (data) => {
      resolve(data); 
    });
  });
}

function submitAnswer(questionSeq : string[], answerSeq: string[]) {
  let pointsEarned = 0;
  for (let i = 0; i < questionSeq.length; i++) {
    if (i < answerSeq.length) {
      if (questionSeq[i] === answerSeq[i]) pointsEarned++;
    }
  }
  
  return pointsEarned;

}

async function submitRoundResult(socket: Socket, userProfile: any, pointsEarned: number, success: boolean) {
  return new Promise((resolve) => {
    socket.emit('submit-round-result', { userProfile, pointsEarned });
    const handler = (data: any) => {
      resolve(data);
      socket.off('turns-switched', handler);
      socket.off('round-updated', handler);
      socket.off('game-ended', handler);
    };
    socket.on('turns-switched', handler);
    socket.on('round-updated', handler);
    socket.on('game-ended', handler);
  });
}


// Frontend testing
async function main() {
  const username = `Poppo`;
  const password = '123456';
  // console.log('Registering user...');
  // await registerUser(username, password);
  console.log('Logging in...');
  const loginRes = await loginUser(username, password);
  const userProfile = loginRes.user;

  const username2 = `Poppo2`;
  const password2 = '123456';
  // console.log('Registering second user...');
  // await registerUser(username2, password2);
  console.log('Logging in second user...');
  const loginRes2 = await loginUser(username2, password2);
  const userProfile2 = loginRes2.user;
  
  // AFTER a successful login,
  // Connect to Socket.IO  
  console.log('Connecting to Socket.IO...');
  const socket: Socket = io(SOCKET_IO_URL, {
        transports: ['websocket'],
        auth : { userProfile }
  });

  const socket2 : Socket = io(SOCKET_IO_URL, {
        transports: ['websocket'],
        auth : { userProfile: userProfile2 }
  });

  // Gauge response
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket2.on('connect', () => {
    console.log('Socket2 connected:', socket2.id);
  });

  // 1. [Socket] Listen to server stats
  socket.on('server-stats', (stats) => {
    console.log('Received server stats:', stats);
  });

  // 2. [API] Request leaderboard
  const topUsers = await getLeaderboard();
  console.log('Top Users Leaderboard:', topUsers);

  // 3.a [Socket] Create a room and auto-join
  console.log('Creating room...');
  const roomCreatedData : any = await createRoom(socket, userProfile, 2);
  const roomId = roomCreatedData.roomId;
  console.log('Room created with ID:', roomId);

  // 3.b [Socket] Join room
  console.log('Joining room:', roomId);
  const roomJoinData : any = await joinRoom(socket2, userProfile2, roomId);
  console.log('Room joined data:', roomJoinData);

  // 3.c [Socket] Leave room
  // console.log('Leaving room:', roomId);
  // const roomLeaveData : any = await leaveRoom(socket2, roomId);
  // console.log('Room left data:', roomLeaveData);

  // socket.on('error', (err) => {
  //   console.error('Socket error:', err);
  // });

  // 4. [Socket] Start a game
  const gameStartedData : any = await startGame(socket, userProfile);
  console.log('Game started data:', gameStartedData);

  // Listen to events
  socket.on('game-ended', (data) => {
    console.log('Game ended:', data);
  });

  socket.on('turns-switched', (data) => {
    console.log('Turns switched:', data);
  });

  socket.on('round-updated', (data) => {
    console.log('Round updated:', data);
  });

  const seq1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const seq1Attempt = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const seq2 = ['A', 'B', 'A', 'D', 'E', 'Y', 'G'];
  const seq2Attempt = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const questionPlayerId = gameStartedData.questionPlayer.id;
  if (questionPlayerId === userProfile.id) {
    console.log('User 1 is the question player');

    // 5.a [Socket] Submit sequence
    console.log('Submitting sequence for player 1...');
    const seqSaveRes1 : any = await submitSequence(socket, userProfile, seq1);
    console.log('Sequence save response for player 1:', seqSaveRes1);

    // 5.b [Socket] Await sequence-received event (as answer player)
    const sequenceReceived : any = await new Promise((resolve) => {
      socket2.on('sequence-received', (data) => {
        console.log('sequence-received event for player 2:', data);
        resolve(data);
      });
    });

    // 5.c [Socket] Check and submit round result
    const pointsEarned = submitAnswer(sequenceReceived.sequence, seq2Attempt);
    const roundResultSubmitted : any = await submitRoundResult(socket2, userProfile2, pointsEarned, pointsEarned === seq1.length);
    console.log('Round result submitted response:', roundResultSubmitted);


  } else {
    console.log('User 2 is the question player');

    // 5.a [Socket] Submit sequence
    console.log('Submitting sequence for player 2...');
    const seqSaveRes2 : any = await submitSequence(socket, userProfile2, seq2);
    console.log('Sequence save response for player 2:', seqSaveRes2);

    // 5.b [Socket] Await sequence-received event (as answer player)
    const sequenceReceived : any = await new Promise((resolve) => {
      socket.on('sequence-received', (data) => {
        console.log('sequence-received event for player 1:', data);
        resolve(data);
      });
    });

    // 5.c [Socket] Check and submit round result
    const pointsEarned = submitAnswer(sequenceReceived.sequence, seq1Attempt);
    const roundResultSubmitted : any = await submitRoundResult(socket, userProfile, pointsEarned, pointsEarned === seq2.length);
    console.log('Round result submitted response:', roundResultSubmitted);
  }

  // Disconnect after some time
  setTimeout(() => {
    socket.disconnect();
    console.log('Socket disconnected');
  }, 5000);
}

main().catch(console.error);

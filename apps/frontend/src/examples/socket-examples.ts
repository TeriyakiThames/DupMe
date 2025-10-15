import { socketClient } from '@/lib/socket-client';

/**
 * Example usage of the socket client
 * This shows how to interact with the backend without any UI concerns
 */

// Example 1: Initialize and join a room
async function exampleRoomOperations() {
  console.log('=== ROOM OPERATIONS EXAMPLE ===');
  
  // 1. Initialize with player ID
  const playerId = 'player123'; // This would come from your session/cookie
  const connected = await socketClient.init(playerId);
  
  if (!connected) {
    console.error('Failed to connect');
    return;
  }

  // 2. Join a room
  const roomId = 'ABC123';
  await socketClient.joinRoom(roomId);

  // 3. Get room info
  const roomInfo = await socketClient.getRoomInfo(roomId);
  console.log('Room info:', roomInfo.data);

  // 4. Send a message
  await socketClient.sendMessage(roomId, 'Hello everyone!');

  // 5. Leave room
  await socketClient.leaveRoom(roomId);
}

// Example 2: Game operations
async function exampleGameOperations() {
  console.log('=== GAME OPERATIONS EXAMPLE ===');
  
  const roomId = 'ABC123';
  
  // Start a game
  const gameStarted = await socketClient.startGame(roomId);
  console.log('Game started:', gameStarted.data);

  // End a game with scores
  const scores = { 'player123': 100, 'player456': 75 };
  const winner = 'player123';
  await socketClient.endGame(roomId, scores, winner);

  // Reset game
  await socketClient.resetGame(roomId);
}

// Example 3: Game service operations (pattern matching game)
async function exampleGameServiceOperations() {
  console.log('=== GAME SERVICE OPERATIONS EXAMPLE ===');
  
  const roomId = 'ABC123';
  const turnId = 'turn_001';

  // Start a turn
  await socketClient.startTurn(turnId, 'creator');

  // Save a pattern
  const pattern = ['A', 'B', 'C', 'A'];
  await socketClient.savePattern(roomId, turnId, pattern);

  // Check pattern keys one by one
  for (const key of pattern) {
    const result = await socketClient.checkPattern(roomId, turnId, key);
    console.log(`Key ${key} check:`, result.data);
    
    if (result.data?.done) {
      console.log('Pattern completed!');
      break;
    }
  }

  // Save match result
  await socketClient.saveMatchResult(roomId, 'player123', 'player456', 10, 8, 'player123');

  // Update player points
  await socketClient.increasePoints('player123', 50);
  await socketClient.decreasePoints('player456', 10);

  // Get player points
  const points = await socketClient.getPlayerPoints('player123');
  console.log('Player points:', points.data);
}

// Example 4: Event listeners
function setupEventListeners() {
  console.log('=== SETTING UP EVENT LISTENERS ===');

  // Listen for users joining/leaving
  socketClient.onUserJoined((data) => {
    console.log('👤 User joined:', data.playerId);
  });

  socketClient.onUserLeft((data) => {
    console.log('👤 User left:', data.playerId);
  });

  // Listen for messages
  socketClient.onMessageReceived((data) => {
    console.log('💬 Message:', data.playerId, ':', data.message);
  });

  // Listen for game events
  socketClient.onGameStarted((data) => {
    console.log('🎮 Game started:', data.firstPlayer);
  });

  socketClient.onGameEnded((data) => {
    console.log('🏁 Game ended. Winner:', data.winner);
  });

  // Listen for turn events
  socketClient.onTurnStarted((data) => {
    console.log('⏱️ Turn started:', data.role, data.duration + 's');
  });

  socketClient.onPatternSaved((data) => {
    console.log('💾 Pattern saved:', data.pattern);
  });

  socketClient.onPatternChecked((data) => {
    console.log('🔍 Pattern check:', data.correct ? '✅' : '❌', 'Done:', data.done);
  });

  socketClient.onPointsUpdated((data) => {
    console.log('🎯 Points updated:', data.userName, data.newPoints);
  });
}

// Example 5: Complete game flow
async function exampleCompleteGameFlow() {
  console.log('=== COMPLETE GAME FLOW EXAMPLE ===');

  const playerId = 'player123';
  const roomId = 'GAME001';

  try {
    // 1. Setup
    setupEventListeners();
    await socketClient.init(playerId);
    await socketClient.joinRoom(roomId);

    // 2. Start game
    const gameResult = await socketClient.startGame(roomId);
    console.log('Game started with players:', gameResult.data?.players);

    // 3. Play a round (creator creates pattern)
    const turnId = 'turn_001';
    await socketClient.startTurn(turnId, 'creator');
    
    const sequence = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    await socketClient.savePattern(roomId, turnId, sequence);

    // 4. Follower tries to match
    await socketClient.startTurn('turn_002', 'follower');
    
    for (const key of sequence) {
      const checkResult = await socketClient.checkPattern(roomId, 'turn_002', key);
      
      if (!checkResult.data?.correct) {
        console.log('❌ Wrong key! Expected:', checkResult.data?.expectedKey);
        break;
      }
      
      if (checkResult.data?.done) {
        console.log('✅ Pattern matched successfully!');
        break;
      }
    }

    // 5. End game
    const finalScores = { [playerId]: 100 };
    await socketClient.endGame(roomId, finalScores, playerId);

  } catch (error) {
    console.error('Game flow error:', error);
  }
}

// Export functions for testing
export {
  exampleRoomOperations,
  exampleGameOperations,
  exampleGameServiceOperations,
  setupEventListeners,
  exampleCompleteGameFlow
};

// Auto-run example if needed
if (typeof window !== 'undefined') {
  // Browser environment - can run examples
  console.log('🚀 Socket client examples ready. Call functions to test:');
  console.log('- exampleRoomOperations()');
  console.log('- exampleGameOperations()');
  console.log('- exampleGameServiceOperations()');
  console.log('- exampleCompleteGameFlow()');
}
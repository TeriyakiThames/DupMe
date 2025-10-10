// lib/api/gameService.ts
// Mock implementation for DupMe Game Service API
// Replace fetch() URLs later when your backend is ready

type Player = { userName: string; points: number };

export const gameService = {
  /** PATCH /increasePoint */
  async increasePoint(userName: string, points: number) {
    console.log(`Mock: increasePoint(${userName}, +${points})`);
    return Promise.resolve({ success: true });
  },

  /** PATCH /decreasePoint */
  async decreasePoint(userName: string, points: number) {
    console.log(`Mock: decreasePoint(${userName}, -${points})`);
    return Promise.resolve({ success: true });
  },

  /** POST /startGame */
  async startGame(roomId: string, players: Player[]) {
    console.log(`Mock: startGame(${roomId})`, players);
    // Randomize first player for mock
    const firstPlayer = players[Math.floor(Math.random() * players.length)];
    return Promise.resolve({
      roomId,
      firstPlayer,
      message: `Game started! ${firstPlayer.userName} goes first.`,
    });
  },

  /** POST /startTurn */
  async startTurn(turnId: string, role: "creator" | "follower") {
    console.log(`Mock: startTurn(${turnId}, ${role})`);
    return Promise.resolve({
      turnId,
      role,
      duration: role === "creator" ? 10 : 20,
      message: `It's now ${role}'s turn.`,
    });
  },

  /** POST /savePattern */
  async savePattern(roomId: string, turnId: string, seq: string[]) {
    console.log(`Mock: savePattern(${roomId}, ${turnId}, [${seq.join(", ")}])`);
    // pretend we save to memory
    mockDB.pattern = seq;
    return Promise.resolve({ success: true, length: seq.length });
  },

  /** POST /checkPattern */
  async checkPattern(roomId: string, turnId: string, key: string) {
    console.log(`Mock: checkPattern(${roomId}, ${turnId}, key=${key})`);
    const expected = mockDB.pattern?.[mockDB.index ?? 0];
    const correct = key === expected;
    if (correct) {
      mockDB.index = (mockDB.index ?? 0) + 1;
    }
    return Promise.resolve({
      correct,
      nextIndex: mockDB.index,
      done: mockDB.index === mockDB.pattern?.length,
    });
  },

  /** POST /saveMatchResult */
  async saveMatchResult(
    roomId: string,
    p1: string,
    p2: string,
    p1Score: number,
    p2Score: number,
    winner: string
  ) {
    console.log(`Mock: saveMatchResult(${roomId})`, {
      p1,
      p2,
      p1Score,
      p2Score,
      winner,
    });
    return Promise.resolve({ success: true });
  },

  /** POST /endGame */
  async endGame(
    roomId: string,
    scores: Record<string, number>,
    winner: string
  ) {
    console.log(`Mock: endGame(${roomId})`, scores, { winner });
    return Promise.resolve({
      message: `Game ended. Winner: ${winner}`,
      leaderboard: Object.entries(scores).map(([user, pts]) => ({ user, pts })),
    });
  },

  /** POST /resetGame */
  async resetGame(roomId: string) {
    console.log(`Mock: resetGame(${roomId})`);
    mockDB.pattern = [];
    mockDB.index = 0;
    return Promise.resolve({ success: true });
  },
};

// ---------------------------
// Mock in-memory store
// ---------------------------
const mockDB: { pattern?: string[]; index?: number } = {
  pattern: [],
  index: 0,
};

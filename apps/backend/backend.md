# DupMe Game - Backend

## Overview

This repository contains a small Express + TypeScript backend that implements core game server logic for **DupMe**. It uses an in-memory store (Maps) to keep game state and player points and exposes REST endpoints to manage points, game flow, patterns, and match results.

It is intended as a starter backend for local development or prototypes. Replace the in-memory storage with a database (MongoDB, PostgreSQL, Redis, etc.) before using it in production.

## Features

- Increase / decrease player points
- Start a game and initialize players
- Start a turn (returns role and duration)
- Save and check patterns (pattern progress tracking)
- Save match results and end a game (leaderboard)
- Reset a game's state
- Helper service methods to inspect in-memory game states and player points

## Tech stack

- Node.js
- TypeScript
- Express

## Project structure

```
apps/backend/
├─ src/
│  ├─ controllers/
│  │  └─ game_controller.ts    # Express route handlers
│  ├─ routes/
│  │  └─ game.ts               # Express router wiring
│  └─ services/
│     └─ game_service.ts       # In-memory game logic
└─ package.json
```

## API Reference

Base route: `/api/game` (see `apps/backend/src/routes/game.ts`)

> All request/response bodies are JSON. Below are the endpoints implemented by the controller.

### `GET /api/game/`

- Description: Root - quick health check
- Response: `{ message: "Game API root" }`
- TODO: show all values

---

### `PATCH /api/game/increasePoint`

- Body: `{ userName: string, points: number }`
- Response: `{ success: true, userName, previousPoints, addedPoints, newPoints }`
- Notes: Adds points for a player (creates player entry if missing).

---

### `PATCH /api/game/decreasePoint`

- Body: `{ userName: string, points: number }`
- Response: `{ success: true, userName, previousPoints, deductedPoints, newPoints }`
- Notes: Deducts points but never allows negative total (floors at 0).

---

### `POST /api/game/startGame`

- Body: `{ roomId: string, players: Player[] }` where `Player = { userName: string, points: number }`
- Response: `{ success: true, roomId, firstPlayer, message, players: [{ userName, points }] }`
- Notes: Initializes game state for `roomId`, randomizes first player and initializes scores.

---

### `POST /api/game/startTurn`

- Body: `{ turnId: string, role: "creator" | "follower" }`
- Response: `{ success: true, turnId, role, duration, message, timestamp }`
- Notes: Returns a duration depending on role (creator: 10s, follower: 20s in current implementation).

---

### `POST /api/game/savePattern`

- Body: `{ roomId: string, turnId: string, seq: string[] }`
- Response: `{ success: true, roomId, turnId, length, pattern, message }`
- Notes: Stores the current pattern and resets the progress index for the room.

---

### `POST /api/game/checkPattern`

- Body: `{ roomId: string, turnId: string, key: string }`
- Response: `{ success: true, correct, nextIndex, done, totalLength, expectedKey, message }`
- Notes: Checks a single key against the saved pattern for the room and advances progress when correct.

---

### `POST /api/game/saveMatchResult`

- Body: `{ roomId: string, p1: string, p2: string, p1Score: number, p2Score: number, winner: string }`
- Response: `{ success: true, roomId, match: { player1, player2, winner }, message }`
- Notes: Accumulates match scores into the game's `scores` object.

---

### `POST /api/game/endGame`

- Body: `{ roomId: string, scores: Record<string, number>, winner: string }`
- Response: `{ success: true, roomId, winner, leaderboard, message, timestamp }`
- Notes: Overwrites final scores for the room and returns a sorted leaderboard.

---

### `POST /api/game/resetGame`

- Body: `{ roomId: string }`
- Response: `{ success: true, roomId, message }`
- Notes: Clears the pattern, progress index, turn history and (optionally) resets scores to 0.

## Data model (in-service)

`GameState` (kept in-memory in `game_service.ts`):

```ts
interface Player {
	userName: string;
	points: number;
}
interface GameState {
	roomId: string;
	players: Player[];
	currentPattern: string[];
	patternIndex: number;
	firstPlayer?: Player;
	scores: Record<string, number>;
	turnHistory: Array<{
		turnId: string;
		role: "creator" | "follower";
		timestamp: Date;
	}>;
}
```

Server-wide in-memory maps:

- `gameStates: Map<string, GameState>`
- `playerPoints: Map<string, number>`

export type RoomStatus = "lobby" | "countdown" | "racing" | "finished";

export interface Player {
  playerId: string;
  name: string;
  isHost: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
  wpm: number;
  accuracy: number;
  progress: number;
  finished: boolean;
}

export interface StartPayload {
  targetText: string;
  startAt: number;
}

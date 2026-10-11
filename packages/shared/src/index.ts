export type Difficulty = 1 | 2 | 3;

export type DropStatus = "preview" | "open" | "retired";

export interface DropListItem {
  id: string;
  riddleTeaser: string;
  difficulty: Difficulty;
  areaName: string;
  hiderName: string;
  findCount: number;
  status: "open" | "retired";
  seeded: boolean;
  createdAt: string;
  /** Metres from the phone that asked. The stash coordinates are not included. */
  distanceMeters: number;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

export interface PlaceSuggestion {
  id: string;
  label: string;
  areaName: string;
}

export interface DropDetail {
  id: string;
  riddle: string;
  difficulty: Difficulty;
  areaName: string;
  hiderName: string;
  findCount: number;
  status: "open" | "retired";
  seeded: boolean;
  createdAt: string;
}

export interface CreateDropResponse {
  id: string;
  riddle: string;
  difficulty: Difficulty;
  areaName: string;
  hiderName: string;
  status: "preview";
  createdAt: string;
}

export interface PublishDropResponse {
  id: string;
  status: "open";
  riddle: string;
  difficulty: Difficulty;
  areaName: string;
}

export interface HiderDrop {
  id: string;
  riddle: string;
  difficulty: Difficulty;
  areaName: string;
  findCount: number;
  seeded: boolean;
  createdAt: string;
  latestFindAt: string | null;
  points: number;
}

export interface FindAttemptResponse {
  match: boolean;
  confidence: number;
  reason: string;
  attemptsUsed: number;
  attemptsRemaining: number;
  pointsAwarded: number;
  hiderPointsAwarded: number;
}

export interface LeaderboardHider {
  rank: number;
  name: string;
  dropsHidden: number;
  findsReceived: number;
  points: number;
}

export interface LeaderboardHunter {
  rank: number;
  name: string;
  finds: number;
  avgDifficultyCleared: number;
  points: number;
}

export interface LeaderboardResponse {
  hiders: LeaderboardHider[];
  hunters: LeaderboardHunter[];
}

export interface HealthResponse {
  ok: true;
}

export const HUNTER_POINT_FACTOR = 10;
export const HIDER_POINT_FACTOR = 5;
export const MAX_FIND_ATTEMPTS = 3;
/** A yes below this confidence is forced to no. Uncertainty never scores. */
export const MIN_MATCH_CONFIDENCE = 0.72;
export const BOARD_LIMIT = 40;
/** Default hunt radius. The phone asks; the server filters. Coordinates are not returned. */
export const NEARBY_RADIUS_METERS = 8_000;

export function isDifficulty(value: number): value is Difficulty {
  return value === 1 || value === 2 || value === 3;
}

export function hunterPoints(difficulty: Difficulty): number {
  return HUNTER_POINT_FACTOR * difficulty;
}

export function hiderPoints(difficulty: Difficulty): number {
  return HIDER_POINT_FACTOR * difficulty;
}

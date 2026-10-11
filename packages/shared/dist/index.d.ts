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
export declare const HUNTER_POINT_FACTOR = 10;
export declare const HIDER_POINT_FACTOR = 5;
export declare const MAX_FIND_ATTEMPTS = 3;
/** A yes below this confidence is forced to no. Uncertainty never scores. */
export declare const MIN_MATCH_CONFIDENCE = 0.72;
export declare const BOARD_LIMIT = 40;
export declare function isDifficulty(value: number): value is Difficulty;
export declare function hunterPoints(difficulty: Difficulty): number;
export declare function hiderPoints(difficulty: Difficulty): number;

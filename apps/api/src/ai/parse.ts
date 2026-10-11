import { isDifficulty, type Difficulty } from "@deaddrop/shared";

export interface ParsedRiddle {
  riddle: string;
  difficulty: Difficulty;
  safetyFlags: string[];
}

export interface ParsedVerdict {
  match: boolean;
  confidence: number;
  reason: string;
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("No JSON object.");
    }
    return JSON.parse(body.slice(start, end + 1)) as unknown;
  }
}

export function parseRiddle(raw: string): ParsedRiddle | null {
  let value: unknown;
  try {
    value = extractJson(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.riddle !== "string") return null;
  const riddle = record.riddle.trim().replace(/\s+/g, " ");
  if (riddle.length < 40 || riddle.length > 700) return null;
  const difficultyValue =
    typeof record.difficulty === "number"
      ? record.difficulty
      : Number(record.difficulty);
  if (!Number.isInteger(difficultyValue) || !isDifficulty(difficultyValue)) {
    return null;
  }
  if (record.safetyFlags == null) {
    return { riddle, difficulty: difficultyValue, safetyFlags: [] };
  }
  if (!Array.isArray(record.safetyFlags)) return null;
  const safetyFlags: string[] = [];
  for (const flag of record.safetyFlags) {
    if (typeof flag !== "string" || flag.length === 0 || flag.length > 80) {
      return null;
    }
    safetyFlags.push(flag);
  }
  return { riddle, difficulty: difficultyValue, safetyFlags };
}

export function parseVerdict(raw: string): ParsedVerdict | null {
  let value: unknown;
  try {
    value = extractJson(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.match !== "boolean") return null;
  const confidenceValue =
    typeof record.confidence === "number"
      ? record.confidence
      : Number(record.confidence);
  if (!Number.isFinite(confidenceValue)) return null;
  if (typeof record.reason !== "string") return null;
  const reason = record.reason.trim().replace(/\s+/g, " ");
  if (reason.length < 3 || reason.length > 500) return null;
  const confidence = Math.min(1, Math.max(0, confidenceValue));
  return { match: record.match, confidence, reason };
}

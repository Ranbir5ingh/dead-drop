import type { Difficulty } from "@deaddrop/shared";

export function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === 1) return "Stroll";
  if (difficulty === 2) return "Hunt";
  return "Devilish";
}

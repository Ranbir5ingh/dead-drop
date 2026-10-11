import { type Difficulty } from "@deaddrop/shared";
import { scanRiddle } from "./safety";

export interface RiddleDraft {
  riddle: string;
  difficulty: Difficulty;
}

const GENERIC =
  "Someone left a small, deliberate object in the public place named on this card. It sits low, out of the main current of feet, and it is not for sale and not for keeping. Look slowly. Admire it, then leave it for the next person.";

function vagueHint(objectHint: string): string {
  const hint = objectHint.toLowerCase();
  if (/(stone|rock|pebble)/.test(hint)) {
    return "a palm-sized stone someone changed on purpose is waiting";
  }
  if (/(paper|note|origami|crane|letter)/.test(hint)) {
    return "a folded bit of paper, patient and weather-shy, is waiting";
  }
  if (/sticker/.test(hint)) {
    return "a sticker that does not belong to its surface is waiting";
  }
  if (/(cap|bottle|coin|metal)/.test(hint)) {
    return "a tiny metal keepsake, slightly ridiculous, is waiting";
  }
  if (/(thread|string|yarn|ribbon|cloth)/.test(hint)) {
    return "something small, tied with a thread of color, is waiting";
  }
  return "a small object a person placed for a stranger is waiting";
}

function difficultyFrom(objectHint: string): Difficulty {
  const length = objectHint.trim().length;
  if (length < 40) return 1;
  if (length < 100) return 2;
  return 3;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function compose(place: string, hint: string, variant: number): string {
  if (variant % 3 === 1) {
    return `In ${place}, leave the straightest path and the doorways alone. ${hint[0]?.toUpperCase() ?? ""}${hint.slice(1)}. It was set down with care, closer to the ground than to eye level. When you meet it, leave it where it is.`;
  }
  if (variant % 3 === 2) {
    return `The public quiet of ${place} is hiding a joke. ${hint[0]?.toUpperCase() ?? ""}${hint.slice(1)}, off the busiest line of feet. Crouch if you mean it. Take the credit, not the object.`;
  }
  return `Somewhere in ${place}, away from any doorway, ${hint}. It was set down on purpose. Look low, look twice, and leave it for the next person.`;
}

/** Hand-written riddle. Used by the mock referee and when the model cannot be trusted. */
export function fallbackRiddle(input: {
  areaName: string;
  objectHint: string;
  variant?: number;
}): RiddleDraft {
  const areaFlags = scanRiddle(input.areaName);
  const place =
    areaFlags.length === 0 && input.areaName.trim().length >= 2
      ? input.areaName.trim()
      : "the public place named on this card";
  const hint = vagueHint(input.objectHint);
  const variant =
    input.variant ?? hash(`${input.areaName}|${input.objectHint}`);
  let riddle = compose(place, hint, variant);
  if (scanRiddle(riddle).length > 0) riddle = GENERIC;
  return { riddle, difficulty: difficultyFrom(input.objectHint) };
}

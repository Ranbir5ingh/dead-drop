export interface RiddleInput {
  vicinityDescription: string;
  objectHint: string;
  areaName: string;
}

export interface VerifyInput {
  photoBase64: string;
  mimeType: string;
  objectDescription: string;
  riddle: string;
}

export function riddlePrompt(input: RiddleInput, correction: string | null): string {
  return [
    "You write cryptic outdoor treasure riddles for a game called Dead Drop.",
    "A person hid a small object in a public place. Hunters read only the riddle.",
    "They must be able to find it while standing in the area, without an address.",
    "",
    `Broad area name: ${input.areaName}`,
    `Vicinity notes (private — do not copy street names or exact spots): ${input.vicinityDescription}`,
    `Hidden object (hint at it, do not inventory it): ${input.objectHint}`,
    "",
    "Return ONLY a JSON object:",
    '{"riddle": string, "difficulty": 1 | 2 | 3, "safetyFlags": string[]}',
    "",
    "Rules:",
    "- Two to four sentences. Playful, concrete, fair.",
    "- Solvable by a person physically in that vicinity.",
    "- NEVER include an address, street number, coordinates, plus code, phone number, email, URL, shop name, or the exact spot.",
    "- No bench numbers, no 'third tree', no doorways that pinpoint one entrance.",
    "- Do not copy the object description verbatim.",
    "- difficulty 1 is a generous hint, 2 is fair, 3 is sly but still solvable on foot.",
    "- safetyFlags is an empty array when you followed the rules.",
    correction
      ? `Previous draft was rejected: ${correction} Write a safer riddle.`
      : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function verifyPrompt(objectDescription: string, riddle: string): string {
  return [
    "You are a strict photo referee for an outdoor treasure hunt.",
    "Decide whether the attached photo actually shows the hidden object.",
    "",
    `Object description (the only thing you may match against): ${objectDescription}`,
    `Riddle (context only, not visual evidence): ${riddle}`,
    "",
    "Return ONLY JSON:",
    '{"match": boolean, "confidence": number, "reason": string}',
    "",
    "Rules:",
    "- Judge ONLY what is visible in the photo against the object description.",
    "- If the object is partly hidden, blurry, cropped away, or you are unsure, match is false.",
    "- Never guess. Never award a match because the scene is outdoors or merely plausible.",
    "- A photo of a screen, a printout, or a picture of a picture is not a match.",
    "- Indoor furniture, a couch, a desk, or a hand holding the object up to the lens is not a match unless the described object is unmistakably that object in the place the riddle implies.",
    "- confidence is from 0 to 1 and must be low when you are unsure.",
    "- reason is one or two short sentences a hunter can read.",
    "- Do not reveal a more exact hiding spot than the riddle already did.",
    "- Do not identify people.",
  ].join("\n");
}

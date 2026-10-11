const PHONE =
  /(?:\+\d{1,3}[\s.-])?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/;
const LONG_DIGITS = /\b\d{8,}\b/;
const COORD_DECIMAL = /-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/;
const COORD_DEGREES = /\d{1,3}\s*°/;
const COORD_LABEL =
  /\b(?:latitude|longitude|coordinates|plus\s*code|what3words|gps)\b/i;
const ADDRESS =
  /\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][\p{L}'-]+|[A-Z]{2,})(?:\s+[A-Z][\p{L}'-]+){0,3}\s+(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl|terrace|ter)\b/iu;
const ZIP = /\b\d{5}-\d{4}\b/;
const URL = /https?:\/\/|www\./i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PLUS_CODE =
  /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/;
const WHAT3WORDS = /\/\/\/[a-z]+\.[a-z]+\.[a-z]+/i;

export function scanRiddle(riddle: string): string[] {
  const flags: string[] = [];
  const add = (flag: string, hit: boolean): void => {
    if (hit && !flags.includes(flag)) flags.push(flag);
  };
  add("phone", PHONE.test(riddle) || LONG_DIGITS.test(riddle));
  add("coordinates", COORD_DECIMAL.test(riddle) || COORD_DEGREES.test(riddle));
  add("coordinates-label", COORD_LABEL.test(riddle));
  add("address", ADDRESS.test(riddle) || ZIP.test(riddle));
  add("url", URL.test(riddle));
  add("email", EMAIL.test(riddle));
  add("plus-code", PLUS_CODE.test(riddle));
  add("what3words", WHAT3WORDS.test(riddle));
  return flags;
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the riddle quotes the hidden-object answer instead of hinting. */
export function leaksObject(riddle: string, objectDescription: string): boolean {
  const r = norm(riddle);
  const o = norm(objectDescription);
  if (o.length >= 24 && r.includes(o)) return true;
  const words = o.split(" ").filter((word) => word.length > 2);
  if (words.length >= 6) {
    const window = words.slice(0, 6).join(" ");
    if (window.length >= 24 && r.includes(window)) return true;
  }
  return false;
}

export const NAME_PATTERN =
  /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{0,38}[\p{L}\p{M}.]?$/u;

export function tidy(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
}

export function namesMatch(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

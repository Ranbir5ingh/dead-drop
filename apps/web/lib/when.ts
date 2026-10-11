export function hiddenWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Hidden";
  const delta = Date.now() - then;
  const hour = 60 * 60 * 1000;
  if (delta < hour) return "Hidden within the hour";
  if (delta < 24 * hour) return "Hidden today";
  const days = Math.floor(delta / (24 * hour));
  if (days === 1) return "Hidden yesterday";
  if (days < 14) return `Hidden ${days} days ago`;
  return "Hidden a while ago";
}

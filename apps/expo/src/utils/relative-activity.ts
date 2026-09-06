/** Format the age of a legislative action using the feed's day-level copy. */
export function relativeActivity(
  value: Date | undefined,
  now = Date.now(),
): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const elapsedDays = Math.floor(
    Math.max(0, now - date.getTime()) / 86_400_000,
  );
  if (elapsedDays === 0) return "today";
  if (elapsedDays === 1) return "1 day ago";
  if (elapsedDays < 30) return `${elapsedDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

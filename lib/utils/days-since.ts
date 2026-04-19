export function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function isGhosted(lastActivityAt: string, status: string): boolean {
  if (status === "rejected" || status === "offer" || status === "ghosted") return false;
  const days = daysSince(lastActivityAt);
  if (status === "applied") return days > 21;
  if (status === "phone_screen") return days > 14;
  if (status === "interview") return days > 14;
  return false;
}

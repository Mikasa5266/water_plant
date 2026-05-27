export function formatTime(date: Date): string {
  const pad = (v: number) => v.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getTimestamp(): string {
  return formatTime(new Date());
}

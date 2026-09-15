export function loadMock<T>(key: string, seed: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function saveMock<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function nextId<T extends { id: number }>(items: T[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

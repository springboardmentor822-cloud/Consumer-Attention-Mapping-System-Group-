export function parseJsonOrThrow<T>(value: string, fallbackMessage: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

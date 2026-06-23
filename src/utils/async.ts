export function makeId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function once<T>(callback: (value: T) => void): (value: T) => void {
  let called = false;
  return (value: T) => {
    if (called) return;
    called = true;
    callback(value);
  };
}

export function withTimeout<T, F>(
  promise: Promise<T> | T,
  timeoutMs: number,
  fallbackValue: F,
): Promise<T | F> {
  return new Promise((resolve) => {
    const finish = once<T | F>(resolve);
    const timer = window.setTimeout(() => finish(fallbackValue), timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer);
        finish(value);
      })
      .catch(() => {
        window.clearTimeout(timer);
        finish(fallbackValue);
      });
  });
}

export function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks.length ? chunks : [""];
}


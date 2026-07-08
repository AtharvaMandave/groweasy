/**
 * Split an array into batches of a given size.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process batches with concurrency control.
 * Runs up to `concurrency` batches in parallel.
 */
export async function processBatchesConcurrently<T, R>(
  batches: T[][],
  processor: (batch: T[], batchIndex: number) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const results: R[] = new Array(batches.length);
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    const index = currentIndex++;
    if (index >= batches.length) return;
    results[index] = await processor(batches[index], index);
    await runNext();
  }

  // Start `concurrency` workers
  const workers = Array.from(
    { length: Math.min(concurrency, batches.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Retry an async function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

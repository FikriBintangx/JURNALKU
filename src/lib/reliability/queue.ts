/**
 * Simple concurrency controller (similar to p-limit)
 * to prevent provider request storms.
 */
export function createQueue(concurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        activeCount++;
        task();
      }
    }
  };

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeCount < concurrency) {
      activeCount++;
      try {
        return await fn();
      } finally {
        next();
      }
    }

    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          next();
        }
      });
    });
  };
}

// Global queues
export const aiQueue = createQueue(2); // Max 2 concurrent AI calls
export const searchQueue = createQueue(3); // Max 3 concurrent search provider calls

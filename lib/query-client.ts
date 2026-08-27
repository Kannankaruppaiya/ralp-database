// Lightweight reactive state helper
export function createQueryStore<T>(initialData: T) {
  let state = initialData;
  const listeners = new Set<(val: T) => void>();

  return {
    getState: () => state,
    setState: (newState: T) => {
      state = newState;
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener: (val: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

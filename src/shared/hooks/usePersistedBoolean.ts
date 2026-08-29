import { useCallback, useState } from "react";

/**
 * Persists a boolean toggle in localStorage under `storageKey`, initialized
 * from `defaultValue` when no value has been stored yet.
 *
 * Each write updates both the in-memory state and the stored value, keeping
 * React state and storage in sync for the remainder of the session.
 *
 * @returns [value, setValue] pair matching the React useState contract.
 */
export function usePersistedBoolean(
  storageKey: string,
  defaultValue: boolean,
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) return defaultValue;
    return stored === "true";
  });

  const setPersistedValue = useCallback(
    (nextValue: boolean) => {
      setValue(nextValue);
      window.localStorage.setItem(storageKey, String(nextValue));
    },
    [storageKey],
  );

  return [value, setPersistedValue];
}
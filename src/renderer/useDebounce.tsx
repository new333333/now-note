import { useEffect, useState } from 'react';

export default function useDebounce<T>(
  value: T | undefined,
  delay?: number
): T | undefined {
  const [debouncedValue, setDebouncedValue] = useState<T | undefined>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

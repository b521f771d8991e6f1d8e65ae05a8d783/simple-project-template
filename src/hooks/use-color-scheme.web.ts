import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppSelector } from '@/redux/store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const themeMode = useAppSelector((state) => state.theme.mode);

  const resolved = themeMode === 'system' ? systemScheme : themeMode;

  if (hasHydrated) {
    return resolved ?? 'light';
  }

  return 'light';
}

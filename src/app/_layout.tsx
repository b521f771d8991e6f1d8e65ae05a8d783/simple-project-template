import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { type PropsWithChildren, useMemo } from 'react';
import { BackgroundLayer } from '@/components/background-layer';
import { useBackground } from '@/hooks/use-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageContext } from '@/lib/i18n';
import { useAppSelector, store } from '@/redux/store';
import { Provider } from 'react-redux';

function LanguageProvider({ children }: PropsWithChildren) {
  const lang = useAppSelector((s) => s.language.code);
  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>;
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.title = Constants.expoConfig?.name!;
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppShell() {
  const colorScheme = useColorScheme();
  const { pattern, color } = useBackground();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const hasCustomBg = pattern !== 'none' || color !== null;
  const theme = useMemo(() => {
    if (!hasCustomBg) return baseTheme;
    return {
      ...baseTheme,
      colors: { ...baseTheme.colors, background: 'transparent', card: 'transparent' },
    };
  }, [hasCustomBg, baseTheme]);

  return (
    <LanguageProvider>
      <ThemeProvider value={theme}>
        <BackgroundLayer />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { type PropsWithChildren } from 'react';
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
}

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  );
}

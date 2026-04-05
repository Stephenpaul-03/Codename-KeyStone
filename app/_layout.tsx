import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider as ReduxProvider } from 'react-redux';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { ThemeModeProvider, useThemeMode } from '@/hooks/use-theme-mode';
import { store } from './finances/store';

export const unstable_settings = {
  anchor: '(drawer)',
};

function RootLayoutInner() {
  const { mode } = useThemeMode();
  const paperTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <RootLayoutInner />
    </ThemeModeProvider>
  );
}

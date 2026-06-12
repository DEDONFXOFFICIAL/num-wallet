import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { Platform, View, StyleSheet, useWindowDimensions, AppState, AppStateStatus } from 'react-native';
import { PrivyProvider } from '@privy-io/expo';
import { Config } from '../constants/config';
import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/userStore';

function RootLayoutContent() {
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const { biometricLockSetting, lastAppClosedAt, setLastAppClosedAt, lastOtpVerifiedAt } = useUserStore.getState();
      const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
      const isLoggedIn = lastOtpVerifiedAt && (Date.now() - lastOtpVerifiedAt <= ONE_MONTH_MS);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App returned to foreground
        if (isLoggedIn && biometricLockSetting !== 'none' && lastAppClosedAt) {
          let lockDurationMs = 0;
          switch (biometricLockSetting) {
            case 'immediately':
              lockDurationMs = 0;
              break;
            case '5m':
              lockDurationMs = 5 * 60 * 1000;
              break;
            case '15m':
              lockDurationMs = 15 * 60 * 1000;
              break;
            case '30m':
              lockDurationMs = 30 * 60 * 1000;
              break;
            case '1h':
              lockDurationMs = 60 * 60 * 1000;
              break;
            case '6h':
              lockDurationMs = 6 * 60 * 60 * 1000;
              break;
            case '24h':
              lockDurationMs = 24 * 60 * 60 * 1000;
              break;
          }

          const elapsed = Date.now() - lastAppClosedAt;
          if (elapsed >= lockDurationMs) {
            const segs = segments as unknown as string[];
            const isOnAuth = segs[0] === '(auth)';
            const isOnSplashOrWelcome = segs[1] === 'splash' || segs[1] === 'welcome' || segs[1] === 'otp' || segs[1] === 'phone' || segs[1] === 'biometrics' || segs[1] === 'pin' || segs[1] === 'success';

            if (!isOnAuth || isOnSplashOrWelcome) {
              router.replace({ pathname: '/(auth)/passcode', params: { mode: 'login' } });
            }
          }
        }
      }

      if (nextAppState.match(/inactive|background/)) {
        // App went to background
        setLastAppClosedAt(Date.now());
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg.base },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && windowWidth > 768;

  return (
    <PrivyProvider
      appId={Config.PRIVY_APP_ID}
      clientId={Config.PRIVY_CLIENT_ID}
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#05050A' }}>
        <SafeAreaProvider style={isLargeScreen ? styles.webContainer : styles.fullScreen}>
          <View style={isLargeScreen ? styles.webPreviewFrame : styles.fullScreen}>
            <StatusBar style="light" />
            <RootLayoutContent />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PrivyProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#05050A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webPreviewFrame: {
    width: 420,
    height: 840,
    maxHeight: '92%',
    backgroundColor: Colors.bg.base,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
});

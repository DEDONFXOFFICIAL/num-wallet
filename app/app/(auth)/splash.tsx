import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      // Tagline slides up
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      // Hold then navigate
      Animated.delay(1200),
    ]).start(() => {
      const state = useUserStore.getState();
      const hasAccount = state.accountNumber && state.loginPasscode;

      if (hasAccount) {
        const { biometricLockSetting, lastAppClosedAt } = state;
        
        if (biometricLockSetting !== 'none') {
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

          const elapsed = lastAppClosedAt ? (Date.now() - lastAppClosedAt) : Infinity;
          if (elapsed >= lockDurationMs) {
            router.replace({ pathname: '/(auth)/passcode', params: { mode: 'login' } });
            return;
          }
        }
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/welcome');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        {/* Chrome ring */}
        <View style={styles.chromeRing} />
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={[styles.brandWrap, { opacity: logoOpacity }]}>
        <Text style={styles.brandName}>
          <Text style={styles.brandNum}>Num</Text>
          <Text style={styles.brandWallet}> Wallet</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineWrap, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
        <Text style={styles.tagline}>Your number. Your wallet.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#1040D4',
    opacity: 0.06,
  },
  glowInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3A8AFF',
    opacity: 0.1,
  },
  logoWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  chromeRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#C4D4E840',
  },
  brandWrap: {
    marginBottom: 12,
  },
  brandName: {
    fontSize: Typography.size['2xl'],
    letterSpacing: -0.5,
  },
  brandNum: {
    color: Colors.brand.bright,
    fontWeight: '800',
  },
  brandWallet: {
    color: Colors.text.primary,
    fontWeight: '300',
  },
  taglineWrap: {
    paddingHorizontal: 40,
  },
  tagline: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  bottom: {
    position: 'absolute',
    bottom: 48,
  },
  poweredBy: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

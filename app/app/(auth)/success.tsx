import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const FEATURES = [
  { icon: 'smartphone' as const, label: 'Phone number linked to wallet', color: Colors.brand.bright },
  { icon: 'shield' as const, label: 'Wallet secured with MPC', color: Colors.brand.bright },
  { icon: 'lock' as const, label: 'Login Passcode & PIN set', color: Colors.brand.bright },
  { icon: 'zap' as const, label: 'Ready to send & receive', color: Colors.brand.bright },
];

export default function SuccessScreen() {
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(30)).current;
  const itemAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(100, itemAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true })
      )),
      Animated.delay(1800),
    ]).start(() => {
      router.replace('/(tabs)/home');
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Check circle */}
      <Animated.View style={[styles.checkWrap, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
        <LinearGradient
          colors={['#059669', '#10B981']}
          style={styles.checkCircle}
        >
          <Feather name="check" size={44} color="#fff" strokeWidth={3} />
        </LinearGradient>
        {/* Ring */}
        <View style={styles.checkRing} />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
        <Text style={styles.title}>Wallet created!</Text>
        <Text style={styles.subtitle}>
          Your Num Wallet is ready. Your phone number is now your address.
        </Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View style={[styles.featureList, { opacity: contentOpacity }]}>
        {FEATURES.map((f, i) => (
          <Animated.View
            key={i}
            style={[styles.featureItem, { opacity: itemAnims[i], transform: [{ translateX: itemAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: f.color + '18', borderColor: f.color + '30' }]}>
              <Feather name={f.icon} size={16} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Feather name="check-circle" size={16} color={f.color} />
          </Animated.View>
        ))}
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.loadingRow}>
        <Text style={styles.loadingText}>Opening your wallet</Text>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.loadingDot} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
    gap: Spacing[8],
  },
  glowWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glowOuter: {
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#10B981', opacity: 0.05,
  },
  glowInner: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#10B981', opacity: 0.08,
  },
  checkWrap: { alignItems: 'center', justifyContent: 'center' },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  checkRing: {
    position: 'absolute', width: 116, height: 116, borderRadius: 58,
    borderWidth: 1.5, borderColor: '#10B98140',
  },
  textBlock: { alignItems: 'center', gap: Spacing[3] },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing[4],
  },
  featureList: {
    width: '100%',
    gap: Spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  featureLabel: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  loadingText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  loadingDots: { flexDirection: 'row', gap: 4 },
  loadingDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.text.muted,
  },
});

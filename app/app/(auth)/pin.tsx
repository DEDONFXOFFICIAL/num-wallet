import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import NumPad from '../../components/NumPad';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const LENGTH = 4;

export default function PinScreen() {
  const { setTransactionPin } = useUserStore();
  const [code, setCode] = useState<string[]>([]);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [savedCode, setSavedCode] = useState<string[]>([]);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotsScale = useRef(Array.from({ length: LENGTH }, () => new Animated.Value(1))).current;

  const animateDot = (idx: number) => {
    Animated.sequence([
      Animated.timing(dotsScale[idx], { toValue: 1.5, duration: 80, useNativeDriver: true }),
      Animated.timing(dotsScale[idx], { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (digit: string) => {
    if (code.length >= LENGTH) return;
    const newCode = [...code, digit];
    animateDot(code.length);
    setCode(newCode);
    setError('');

    if (newCode.length === LENGTH) {
      setTimeout(() => {
        if (step === 'create') {
          setSavedCode(newCode);
          setStep('confirm');
          setCode([]);
        } else {
          if (newCode.join('') === savedCode.join('')) {
            setTransactionPin(newCode.join(''));
            router.push('/(auth)/biometrics');
          } else {
            setError('PINs do not match. Try again.');
            shake();
            setCode([]);
          }
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress */}
      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressLabel}>Step 2 of 3</Text>
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={28} color='#F59E0B' />
          </View>
          <Text style={styles.title}>
            {step === 'create' ? 'Set Transaction\nPIN' : 'Confirm your\nPIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'create'
              ? 'This 4-digit PIN authorises every payment and transfer.'
              : 'Re-enter your PIN to confirm it.'}
          </Text>

          {step === 'create' && (
            <View style={styles.warningBadge}>
              <Feather name="alert-triangle" size={12} color='#F59E0B' />
              <Text style={styles.warningText}>Never share this PIN with anyone</Text>
            </View>
          )}
        </View>

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: LENGTH }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i < code.length && styles.dotFilled,
                !!error && i < code.length && styles.dotError,
                { transform: [{ scale: dotsScale[i] }] },
              ]}
            />
          ))}
        </Animated.View>

        {/* Error */}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Numpad */}
      <View style={styles.padWrap}>
        <NumPad onPress={handlePress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing[5] },
  progress: { paddingTop: Spacing[6], gap: Spacing[1] },
  progressBar: {
    height: 3, backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: Radius.full,
  },
  progressLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[8] },
  header: { alignItems: 'center', gap: Spacing[4] },
  iconWrap: {
    width: 64, height: 64, borderRadius: Radius.xl,
    backgroundColor: '#F59E0B18',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F59E0B30',
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.black,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing[4],
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B10',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  warningText: {
    color: '#F59E0B',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: Spacing[6],
    justifyContent: 'center',
  },
  dot: {
    width: 20, height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: Colors.border.strong,
  },
  dotFilled: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  dotError: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },

  padWrap: { paddingBottom: Spacing[8] },
});

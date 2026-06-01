import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import NumPad from '../../components/NumPad';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const LENGTH = 6;

export default function PasscodeScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { loginPasscode, setLoginPasscode, accountNumber } = useUserStore();

  const [code, setCode] = useState<string[]>([]);
  const [step, setStep] = useState<'create' | 'confirm' | 'login' | 'reset_otp' | 'reset_create' | 'reset_confirm'>(
    params.mode === 'login' ? 'login' : 'create'
  );
  
  const [savedCode, setSavedCode] = useState<string[]>([]);
  const [tempNewPasscode, setTempNewPasscode] = useState<string[]>([]);
  const [sentResetOtp, setSentResetOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotsScale = useRef(Array.from({ length: LENGTH }, () => new Animated.Value(1))).current;

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const animateDot = (idx: number) => {
    Animated.sequence([
      Animated.timing(dotsScale[idx], { toValue: 1.4, duration: 80, useNativeDriver: true }),
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
        } else if (step === 'confirm') {
          if (newCode.join('') === savedCode.join('')) {
            // Save newly created passcode to store
            setLoginPasscode(newCode.join(''));
            router.push('/(auth)/pin');
          } else {
            setError('Codes do not match. Try again.');
            shake();
            setCode([]);
          }
        } else if (step === 'login') {
          // Demo mode: accept any 6-digit passcode to unlock/login
          router.push('/(tabs)/home');
        } else if (step === 'reset_otp') {
          if (newCode.join('') === sentResetOtp) {
            setStep('reset_create');
            setCode([]);
          } else {
            setError('Incorrect OTP code. Try again.');
            shake();
            setCode([]);
          }
        } else if (step === 'reset_create') {
          setTempNewPasscode(newCode);
          setStep('reset_confirm');
          setCode([]);
        } else if (step === 'reset_confirm') {
          if (newCode.join('') === tempNewPasscode.join('')) {
            setLoginPasscode(newCode.join(''));
            setError('');
            setCode([]);
            Alert.alert(
              'Passcode Reset Successful',
              'Your login passcode has been successfully updated. Please log in using your new passcode.',
              [{ text: 'OK', onPress: () => setStep('login') }]
            );
          } else {
            setError('Codes do not match. Try again.');
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

  const handleForgotPasscode = () => {
    const codeVal = Math.floor(100000 + Math.random() * 900000).toString();
    setSentResetOtp(codeVal);
    setResendTimer(60);
    setCode([]);
    setError('');
    setStep('reset_otp');
    Alert.alert(
      'Reset Code Sent',
      `A 6-digit passcode reset verification OTP (${codeVal}) has been sent to your registered number: +234 ${accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}.`
    );
  };

  const handleResendResetOtp = () => {
    if (resendTimer > 0) return;
    const codeVal = Math.floor(100000 + Math.random() * 900000).toString();
    setSentResetOtp(codeVal);
    setResendTimer(60);
    setCode([]);
    setError('');
    Alert.alert(
      'Reset Code Resent',
      `A new 6-digit passcode reset verification OTP (${codeVal}) has been sent to your registered number.`
    );
  };

  const getHeaderDetails = () => {
    switch (step) {
      case 'create':
        return {
          icon: 'shield',
          iconColor: Colors.brand.bright,
          iconBg: Colors.brand.bright + '18',
          title: 'Create your\nLogin Passcode',
          subtitle: 'This 6-digit passcode secures your account. You will need it to log in and access your wallet on any device.'
        };
      case 'confirm':
        return {
          icon: 'shield',
          iconColor: Colors.brand.bright,
          iconBg: Colors.brand.bright + '18',
          title: 'Confirm your\nLogin Passcode',
          subtitle: 'Re-enter your passcode to confirm it.'
        };
      case 'login':
        return {
          icon: 'unlock',
          iconColor: '#10B981',
          iconBg: '#10B98118',
          title: 'Enter your\nLogin Passcode',
          subtitle: `Enter your 6-digit passcode to unlock your account under registered number: +234 ${accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}.`
        };
      case 'reset_otp':
        return {
          icon: 'mail',
          iconColor: '#3A8AFF',
          iconBg: '#3A8AFF18',
          title: 'Confirm Reset OTP',
          subtitle: `Enter the 6-digit recovery OTP code sent to your registered phone number to authorize passcode reset.`
        };
      case 'reset_create':
        return {
          icon: 'shield',
          iconColor: '#F59E0B',
          iconBg: '#F59E0B18',
          title: 'Create New Passcode',
          subtitle: 'Enter a new 6-digit passcode to secure your account.'
        };
      case 'reset_confirm':
        return {
          icon: 'shield',
          iconColor: '#F59E0B',
          iconBg: '#F59E0B18',
          title: 'Confirm New Passcode',
          subtitle: 'Re-enter your new passcode to confirm it.'
        };
    }
  };

  const headerDetails = getHeaderDetails();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back Button */}
      {(step === 'create' || step === 'login' || step === 'reset_otp' || step === 'reset_create') && (
        <TouchableOpacity 
          style={styles.back} 
          onPress={() => {
            if (step === 'reset_otp' || step === 'reset_create') {
              setStep('login');
            } else {
              router.back();
            }
          }}
        >
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      )}

      {/* Progress (Sign up only) */}
      {(step === 'create' || step === 'confirm') && (
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 'create' ? '50%' : '65%' }]} />
          </View>
          <Text style={styles.progressLabel}>Step 1 of 3</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: headerDetails.iconBg, borderColor: headerDetails.iconColor + '30' }]}>
            <Feather name={headerDetails.icon as any} size={28} color={headerDetails.iconColor} />
          </View>
          <Text style={styles.title}>{headerDetails.title}</Text>
          <Text style={styles.subtitle}>{headerDetails.subtitle}</Text>
        </View>

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: LENGTH }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i < code.length && { backgroundColor: headerDetails.iconColor, borderColor: headerDetails.iconColor },
                !!error && i < code.length && styles.dotError,
                { transform: [{ scale: dotsScale[i] }] },
              ]}
            />
          ))}
        </Animated.View>

        {/* Error */}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Forgot Passcode / Resend OTP Action Rows */}
        {step === 'login' && (
          <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPasscode} activeOpacity={0.7}>
            <Text style={styles.forgotBtnText}>Forgot Passcode?</Text>
          </TouchableOpacity>
        )}

        {step === 'reset_otp' && (
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it? </Text>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendResetOtp} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  back: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing[3],
  },
  progress: { paddingTop: Spacing[4], gap: Spacing[1] },
  progressBar: {
    height: 3, backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.full,
  },
  progressLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[6] },
  header: { alignItems: 'center', gap: Spacing[3] },
  iconWrap: {
    width: 64, height: 64, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.black,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing[4],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  dot: {
    width: 16, height: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: Colors.border.strong,
  },
  dotError: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  forgotBtn: {
    paddingVertical: Spacing[2],
    marginTop: Spacing[2],
  },
  forgotBtnText: {
    color: Colors.brand.bright,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    textDecorationLine: 'underline',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  resendLabel: { color: Colors.text.muted, fontSize: Typography.size.sm },
  resendTimer: { color: Colors.text.secondary, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  resendLink: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  padWrap: { paddingBottom: Spacing[8] },
});

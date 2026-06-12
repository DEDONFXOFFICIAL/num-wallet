import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { SmsService } from '../../store/smsService';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../store/supabaseClient';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const { mode } = params;
  const displayPhone = params.phone || '+234 803 360 0717';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIdx, setActiveIdx] = useState(0);
  const [resendTimer, setResendTimer] = useState(59);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text: string, idx: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
      setActiveIdx(idx + 1);
    }

    // Auto-verify when full
    if (digit && idx === OTP_LENGTH - 1) {
      const full = [...newOtp.slice(0, -1), digit].join('');
      if (full.length === OTP_LENGTH) {
        setTimeout(() => verify(full), 100);
      }
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      const newOtp = [...otp];
      newOtp[idx - 1] = '';
      setOtp(newOtp);
      inputRefs.current[idx - 1]?.focus();
      setActiveIdx(idx - 1);
    }
  };

  const [loading, setLoading] = useState(false);

  const verify = async (codeStr: string) => {
    if (codeStr.length !== OTP_LENGTH || loading) return;
    setLoading(true);
    setError('');

    const result = await SmsService.verifyOtp(displayPhone, codeStr);
    setLoading(false);

    if (result.success) {
      // Save last verified OTP timestamp in user store
      useUserStore.getState().setLastOtpVerifiedAt(Date.now());
      if (mode === 'login') {
        // Passcode was already verified on phone.tsx screen, route straight to home!
        const cleanNum = useUserStore.getState().accountNumber;
        try {
          const { data } = await supabase
            .from('registries')
            .select('name, avatar_url, backup_email')
            .eq('account_number', cleanNum)
            .maybeSingle();
          if (data) {
            const store = useUserStore.getState();
            if (data.name) store.setName(data.name);
            if (data.avatar_url) store.setUploadedPhotoUri(data.avatar_url);
            if (data.backup_email) store.setBackupEmail(data.backup_email);
          }
        } catch (e) {
          console.warn('Failed to sync profile from Supabase on OTP login:', e);
        }
        router.replace('/(tabs)/home');
      } else {
        router.push({
          pathname: '/(auth)/passcode',
          params: { mode }
        });
      }
    } else {
      setError(result.error || 'Incorrect code. Try again.');
      shake();
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setActiveIdx(0);
      }
    };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setError('');
    
    const result = await SmsService.sendOtp(displayPhone);
    setLoading(false);

    if (result.success) {
      setResendTimer(59);
    } else {
      setError(result.error || 'Failed to resend code.');
    }
  };

  const isFull = otp.every(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={Colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Feather name="message-circle" size={28} color={Colors.brand.bright} />
          </View>
          <Text style={styles.title}>Confirm number{'\n'}ownership</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to{'\n'}
            <Text style={styles.phoneHighlight}>{displayPhone}</Text> to confirm you own this number.
          </Text>
        </View>

        {/* OTP boxes */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {otp.map((digit, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.otpBox,
                idx === activeIdx && styles.otpBoxActive,
                digit && styles.otpBoxFilled,
                !!error && styles.otpBoxError,
              ]}
              onPress={() => {
                inputRefs.current[idx]?.focus();
                setActiveIdx(idx);
              }}
              activeOpacity={1}
            >
              <TextInput
                ref={(r) => { inputRefs.current[idx] = r; }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(t) => handleChange(t, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                caretHidden
                onFocus={() => setActiveIdx(idx)}
              />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Error */}
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive it? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Verify button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => verify(otp.join(''))}
          disabled={!isFull || loading}
          activeOpacity={0.85}
        >
          {isFull ? (
            <LinearGradient
              colors={[Colors.brand.deep, Colors.brand.bright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.verifyBtn, styles.verifyBtnDisabled]}>
              <Text style={[styles.verifyBtnText, { color: Colors.text.disabled }]}>
                Verify & Continue
              </Text>
            </View>
          )}
        </TouchableOpacity>
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
    marginTop: Spacing[3], marginBottom: Spacing[6],
  },
  content: { flex: 1 },
  header: { marginBottom: Spacing[10], gap: Spacing[4] },
  iconWrap: {
    width: 56, height: 56, borderRadius: Radius.lg,
    backgroundColor: Colors.brand.bright + '18',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brand.bright + '30',
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    lineHeight: 24,
  },
  phoneHighlight: {
    color: Colors.text.primary,
    fontWeight: Typography.weight.semibold,
  },

  otpRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.brand.bright,
    backgroundColor: Colors.brand.bright + '10',
  },
  otpBoxFilled: {
    borderColor: Colors.brand.deep + '80',
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  otpInput: {
    color: Colors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },

  errorText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  resendLabel: { color: Colors.text.muted, fontSize: Typography.size.sm },
  resendTimer: { color: Colors.text.secondary, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  resendLink: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },

  footer: { paddingBottom: 32 },
  verifyBtn: {
    height: 56, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing[2],
  },
  verifyBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  verifyBtnText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
});

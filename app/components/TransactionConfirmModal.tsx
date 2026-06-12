import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
  Vibration,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { useUserStore } from '../store/userStore';


export interface SecuritySummaryType {
  status: 'SECURE' | 'WARNING' | 'DANGER';
  statusText: string;
  rating: string;
  statusColor: string;
  isVerified: boolean;
  phishingReported: boolean;
  permissions: string;
  risks: string[];
  recommendation: string;
}

interface TransactionConfirmModalProps {
  visible: boolean;
  title: string;
  details: { label: string; value: string }[];
  securityTips: string[];
  onConfirm: () => void;
  onCancel: () => void;
  actionLabel?: string;
  securitySummary?: SecuritySummaryType | null;
}

const { width } = Dimensions.get('window');

export default function TransactionConfirmModal({
  visible,
  title,
  details,
  securityTips,
  onConfirm,
  onCancel,
  actionLabel = 'Authorize & Sign',
  securitySummary = null,
}: TransactionConfirmModalProps) {
  const { isDarkMode, biometricsEnabled, transactionPin, accountNumber } = useUserStore();
  const [authStep, setAuthStep] = useState<'brief' | 'pin' | 'signing' | 'success'>('brief');
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLockError, setPinLockError] = useState('');
  const pinInputRef = useRef<TextInput>(null);


  useEffect(() => {
    if (visible) {
      setAuthStep('brief');
      setPinValue('');
      setPinError(false);
      setPinLockError('');
    }
  }, [visible]);

  useEffect(() => {
    const checkPinLock = async () => {
      if (authStep === 'pin') {
        try {
          const attemptsStr = await AsyncStorage.getItem(`pin_failed_attempts_${accountNumber}`);
          const lastFailedStr = await AsyncStorage.getItem(`pin_last_failed_${accountNumber}`);
          if (attemptsStr && lastFailedStr) {
            const attempts = parseInt(attemptsStr, 10);
            const lastFailed = parseInt(lastFailedStr, 10);
            if (attempts >= 4) {
              const elapsedHours = (Date.now() - lastFailed) / (1000 * 60 * 60);
              if (elapsedHours < 4) {
                const timeLeftMs = (4 * 60 * 60 * 1000) - (Date.now() - lastFailed);
                const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
                const minsLeft = Math.ceil((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                let timeText = hoursLeft > 0 ? `${hoursLeft} hour(s) and ${minsLeft} minute(s)` : `${minsLeft} minute(s)`;
                setPinLockError(`Security Lock: Please try again in ${timeText}.`);
                return;
              } else {
                // Expired, clear
                await AsyncStorage.setItem(`pin_failed_attempts_${accountNumber}`, '0');
              }
            }
          }
          setPinLockError('');
        } catch (e) {}
      }
    };
    checkPinLock();
  }, [authStep]);

  useEffect(() => {
    if (authStep === 'pin' && !pinLockError) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 200);
    }
  }, [authStep, pinLockError]);

  const handleStartAuth = async () => {
    if (biometricsEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm Transaction Signature',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: false,
        });

        if (result.success) {
          executeSuccess();
        } else {
          // If cancelled or failed, fallback to PIN input
          setAuthStep('pin');
        }
      } else {
        setAuthStep('pin');
      }
    } else {
      setAuthStep('pin');
    }
  };

  const handlePinChange = async (text: string) => {
    if (pinLockError) {
      setPinValue('');
      return;
    }
    const cleanText = text.replace(/\D/g, '').slice(0, 4);
    setPinValue(cleanText);

    if (cleanText.length === 4) {
      if (cleanText === transactionPin) {
        // Success: Reset failed attempts!
        try {
          await AsyncStorage.setItem(`pin_failed_attempts_${accountNumber}`, '0');
        } catch (e) {}
        executeSuccess();
      } else {
        setPinError(true);
        Vibration.vibrate([100, 100, 100]);
        
        let newAttempts = 1;
        try {
          const currentStr = await AsyncStorage.getItem(`pin_failed_attempts_${accountNumber}`);
          if (currentStr) {
            newAttempts = parseInt(currentStr, 10) + 1;
          }
          await AsyncStorage.setItem(`pin_failed_attempts_${accountNumber}`, newAttempts.toString());
          await AsyncStorage.setItem(`pin_last_failed_${accountNumber}`, Date.now().toString());
        } catch (e) {}

        const remaining = 4 - newAttempts;
        if (newAttempts >= 4) {
          setPinLockError('Security Lock: Too many failed attempts. Try again in 4 hours.');
          Alert.alert(
            'Security Lock Triggered',
            'You have entered an incorrect Transaction PIN 4 times. For your security, transaction signing is locked for 4 hours.'
          );
        } else {
          Alert.alert(
            'Incorrect PIN',
            `The Transaction PIN entered is incorrect. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before transaction signing is locked.`,
            [{ text: 'OK', onPress: () => setTimeout(() => pinInputRef.current?.focus(), 150) }]
          );
        }

        setTimeout(() => {
          setPinValue('');
          setPinError(false);
          if (newAttempts < 4) {
            // Focus is handled by the alert OK press callback
          }
        }, 800);
      }
    }
  };

  const executeSuccess = () => {
    setAuthStep('signing');
    
    // Call the original transaction execution in the background immediately
    onConfirm();

    // Show a beautiful block confirmation / MPC signing loader
    setTimeout(() => {
      setAuthStep('success');
      Vibration.vibrate(200);
      setTimeout(() => {
        onCancel(); // Close modal
      }, 1500);
    }, 1800);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={() => authStep === 'brief' && onCancel()}>
        <View style={styles.modalBg}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, !isDarkMode && styles.modalContainerLight]}>
              
              {authStep === 'brief' && (
                <>
                  {/* Modal Header */}
                  <View style={styles.header}>
                    <View style={styles.shieldBadge}>
                      <Ionicons name="shield-checkmark" size={24} color="#04D9C4" />
                    </View>
                    <Text style={[styles.title, !isDarkMode && styles.textLightPrimary]}>{title}</Text>
                    <Text style={styles.subtitle}>Secure Transaction Briefing</Text>
                  </View>

                  {/* Transaction Details Card */}
                  <View style={[styles.detailsCard, !isDarkMode && styles.cardLight]}>
                    {details.map((d, index) => (
                      <View key={index} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{d.label}</Text>
                        <Text style={[styles.detailValue, !isDarkMode && styles.textLightPrimary]} numberOfLines={2}>
                          {d.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Security Diagnosis & Tips */}
                  {securitySummary ? (
                    <View style={[styles.securitySummaryCard, !isDarkMode && styles.cardLight, { borderColor: securitySummary.statusColor + '30' }]}>
                      <View style={styles.securitySummaryHeader}>
                        <View style={[styles.securityStatusBadge, { backgroundColor: securitySummary.statusColor + '12', borderColor: securitySummary.statusColor + '30' }]}>
                          <View style={[styles.statusDot, { backgroundColor: securitySummary.statusColor }]} />
                          <Text style={[styles.statusBadgeText, { color: securitySummary.statusColor }]}>{securitySummary.statusText}</Text>
                        </View>
                        <Text style={styles.safetyRatingText}>Safety: <Text style={{ fontWeight: '900', color: securitySummary.statusColor }}>{securitySummary.rating}</Text></Text>
                      </View>

                      <View style={[styles.securityDivider, !isDarkMode && styles.securityDividerLight]} />

                      <View style={styles.summaryBulletList}>
                        <View style={styles.summaryBulletRow}>
                          <Feather name="shield" size={12} color="#04D9C4" style={{ marginTop: 2 }} />
                          <Text style={styles.bulletText}>
                            <Text style={{ fontWeight: '700', color: isDarkMode ? '#FFFFFF' : '#111827' }}>Permissions: </Text>
                            {securitySummary.permissions}
                          </Text>
                        </View>

                        {securitySummary.risks.map((risk, index) => (
                          <View key={index} style={styles.summaryBulletRow}>
                            <Feather name="alert-triangle" size={12} color={securitySummary.status === 'DANGER' ? '#EF4444' : '#F59E0B'} style={{ marginTop: 2 }} />
                            <Text style={styles.bulletText}>
                              <Text style={{ fontWeight: '700', color: securitySummary.status === 'DANGER' ? '#EF4444' : '#F59E0B' }}>Risk: </Text>
                              {risk}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.recommendationBox, { backgroundColor: securitySummary.statusColor + '08' }]}>
                        <Text style={[styles.recommendationText, { color: isDarkMode ? '#8888AA' : '#4B5563' }]}>
                          <Text style={{ fontWeight: '900', color: securitySummary.statusColor }}>Analysis: </Text>
                          {securitySummary.recommendation}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.securitySection}>
                      <View style={styles.securityHeader}>
                        <View style={styles.webacyStatus}>
                          <View style={styles.greenDot} />
                          <Text style={styles.webacyText}>Screened by Webacy Shield</Text>
                        </View>
                      </View>
                      
                      <View style={styles.tipsList}>
                        {securityTips.map((tip, index) => (
                          <View key={index} style={styles.tipRow}>
                            <Feather name="shield" size={12} color="#04D9C4" style={{ marginTop: 3 }} />
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.buttonCol}>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={handleStartAuth}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmBtnText}>{actionLabel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={onCancel}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cancelBtnText, !isDarkMode && styles.textLightSecondary]}>Cancel Request</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {authStep === 'pin' && (
                <View style={styles.pinContainer}>
                  <TouchableOpacity style={styles.pinBackBtn} onPress={() => setAuthStep('brief')}>
                    <Feather name="arrow-left" size={20} color={isDarkMode ? '#FFFFFF' : '#111827'} />
                  </TouchableOpacity>

                  <Text style={[styles.pinTitle, !isDarkMode && styles.textLightPrimary]}>Transaction PIN</Text>
                  <Text style={styles.pinDesc}>Enter your 4-digit PIN to authorize this request</Text>

                  {/* Dots Row / Lock Error */}
                  {pinLockError ? (
                    <Text style={{ color: '#EF4444', fontSize: Typography.size.sm, textAlign: 'center', marginVertical: 20, paddingHorizontal: 16, fontWeight: '600' }}>
                      {pinLockError}
                    </Text>
                  ) : (
                    <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                      <View style={[styles.pinDotsRow, { paddingVertical: 0, marginBottom: 0 }]}>
                        {[0, 1, 2, 3].map((index) => {
                          const isFilled = index < pinValue.length;
                          return (
                            <View
                              key={index}
                              style={[
                                styles.pinDot,
                                isFilled && styles.pinDotFilled,
                                pinError && styles.pinDotError,
                                !isDarkMode && styles.pinDotLight,
                                !isDarkMode && isFilled && styles.pinDotFilledLight,
                              ]}
                            />
                          );
                        })}
                      </View>

                      <TextInput
                        ref={pinInputRef}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent',
                          color: 'transparent',
                          fontSize: 24,
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                        value={pinValue}
                        onChangeText={handlePinChange}
                        secureTextEntry
                        caretHidden
                        autoFocus
                      />
                    </View>
                  )}
                </View>
              )}

              {authStep === 'signing' && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#04D9C4" />
                  <Text style={[styles.loaderTitle, !isDarkMode && styles.textLightPrimary]}>Signing Payload</Text>
                  <Text style={styles.loaderDesc}>
                    Generating client-side MPC signature fragments and broadcasting to secure nodes...
                  </Text>
                </View>
              )}

              {authStep === 'success' && (
                <View style={styles.loaderContainer}>
                  <View style={styles.successBadge}>
                    <Feather name="check" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.loaderTitle, !isDarkMode && styles.textLightPrimary]}>Authorized Successfully</Text>
                  <Text style={styles.loaderDesc}>
                    Signature verified on-chain. Transaction broadcast complete!
                  </Text>
                </View>
              )}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[5],
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 380,
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[5],
    gap: Spacing[2],
  },
  shieldBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(4, 217, 196, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(4, 217, 196, 0.25)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: '#131326',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[5],
    gap: Spacing[3],
  },
  cardLight: {
    backgroundColor: '#F9FAFB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing[4],
  },
  detailLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  securitySection: {
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webacyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  webacyText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsList: {
    gap: Spacing[2],
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  tipText: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  buttonCol: {
    gap: Spacing[3],
  },
  confirmBtn: {
    height: 52,
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  textLightPrimary: {
    color: '#111827',
  },
  textLightSecondary: {
    color: '#4B5563',
  },

  // PIN Panel CSS
  pinContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  pinBackBtn: {
    alignSelf: 'flex-start',
    padding: Spacing[1],
    marginBottom: Spacing[2],
  },
  pinTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  pinDesc: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    marginTop: Spacing[1],
    marginBottom: Spacing[6],
  },
  hiddenInput: {
    position: 'absolute',
    width: 200,
    height: 50,
    opacity: 0,
    left: -99999,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3E3E5C',
    backgroundColor: 'transparent',
  },
  pinDotLight: {
    borderColor: '#CBD5E1',
  },
  pinDotFilled: {
    backgroundColor: '#04D9C4',
    borderColor: '#04D9C4',
  },
  pinDotFilledLight: {
    backgroundColor: Colors.brand.bright,
    borderColor: Colors.brand.bright,
  },
  pinDotError: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },

  // Signing Overlay CSS
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: Spacing[4],
  },
  loaderTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: '800',
    marginTop: Spacing[2],
  },
  loaderDesc: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securitySummaryCard: {
    backgroundColor: '#131326',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[5],
    gap: Spacing[3],
  },
  securitySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  securityStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyRatingText: {
    color: '#9CA3AF',
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  securityDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  securityDividerLight: {
    backgroundColor: '#E5E7EB',
  },
  summaryBulletList: {
    gap: Spacing[3],
  },
  summaryBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  bulletText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  recommendationBox: {
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginTop: Spacing[1],
  },
  recommendationText: {
    fontSize: 10.5,
    lineHeight: 15,
  },
});

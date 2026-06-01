import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, TextInput,
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, Vibration,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const AVATARS_CONFIG = [
  { id: '1', icon: 'user' as const, color: '#3A8AFF', bg: '#3A8AFF20' },
  { id: '2', icon: 'aperture' as const, color: '#10B981', bg: '#10B98120' },
  { id: '3', icon: 'cpu' as const, color: '#8B5CF6', bg: '#8B5CF620' },
  { id: '4', icon: 'activity' as const, color: '#EC4899', bg: '#EC489920' },
  { id: '5', icon: 'shield' as const, color: '#F59E0B', bg: '#F59E0B20' },
];

export default function SettingsScreen() {
  const { name, selectedAvatarId, uploadedPhoto, uploadedPhotoUri, biometricsEnabled, setBiometricsEnabled, accountNumber, isDarkMode, setIsDarkMode, showNfts, showStake, setShowNfts, setShowStake, showPerps, showHub, setShowPerps, setShowHub, showMemes, setShowMemes, showDgames, setShowDgames, backupEmail, setBackupEmail, setAccountNumber, clearPortfolio, loginPasscode, transactionPin, setTransactionPin } = useUserStore();
  const cleanAccountNumber = accountNumber.replace(/^\+\d+/, '').replace(/\s+/g, '');
  
  // Link Gmail state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkStep, setLinkStep] = useState<'email' | 'verify' | 'success'>('email');
  const [gmailInput, setGmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Export seed states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<'pin' | 'success'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Regenerate Wallet states
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenStep, setRegenStep] = useState<'warn' | 'otp' | 'pin' | 'success'>('warn');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [regenPath, setRegenPath] = useState<'EXPORT' | 'SAVED'>('EXPORT');
  const [regenOtpCode, setRegenOtpCode] = useState('');
  const [sentRegenOtp, setSentRegenOtp] = useState('');
  const [regenPinInput, setRegenPinInput] = useState('');

  const pinRef = useRef<TextInput>(null);
  const regenPinRef = useRef<TextInput>(null);

  // Change Transaction PIN states
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'passcode' | 'otp' | 'new' | 'confirm' | 'success'>('passcode');
  const [changePinPasscodeInput, setChangePinPasscodeInput] = useState('');
  const [changePinOtpInput, setChangePinOtpInput] = useState('');
  const [sentChangePinOtp, setSentChangePinOtp] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Refs for change pin hidden inputs
  const changePinPasscodeRef = useRef<TextInput>(null);
  const changePinOtpRef = useRef<TextInput>(null);
  const changePinNewRef = useRef<TextInput>(null);
  const changePinConfirmRef = useRef<TextInput>(null);

  const [resendTimer, setResendTimer] = useState(0);
  const [regenAuthMode, setRegenAuthMode] = useState<'BIOMETRICS' | 'PIN'>('BIOMETRICS');
  const [isRegenScanning, setIsRegenScanning] = useState(false);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus regenerate PIN when step changes to 'pin'
  useEffect(() => {
    if (regenStep === 'pin' && showRegenModal) {
      setTimeout(() => {
        regenPinRef.current?.focus();
      }, 150);
    }
  }, [regenStep, showRegenModal]);

  // Auto-focus hidden inputs on change pin modal step changes
  useEffect(() => {
    if (showChangePinModal) {
      setTimeout(() => {
        if (changePinStep === 'passcode') {
          changePinPasscodeRef.current?.focus();
        } else if (changePinStep === 'otp') {
          changePinOtpRef.current?.focus();
        } else if (changePinStep === 'new') {
          changePinNewRef.current?.focus();
        } else if (changePinStep === 'confirm') {
          changePinConfirmRef.current?.focus();
        }
      }, 200);
    }
  }, [changePinStep, showChangePinModal]);

  const handleStartChangePin = () => {
    setChangePinPasscodeInput('');
    setChangePinOtpInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setChangePinStep('passcode');
    setShowChangePinModal(true);
  };

  const handleChangePinPasscodeChange = (text: string) => {
    setChangePinPasscodeInput(text);
    if (text.length === 6) {
      if (text === loginPasscode) {
        // Passcode correct! Move to OTP step
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentChangePinOtp(code);
        setChangePinOtpInput('');
        setChangePinStep('otp');
        setResendTimer(60);
        Alert.alert(
          'Verification OTP Sent',
          `For your security, we have sent a 6-digit transaction confirmation OTP (${code}) to your registered number: +234 ${accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}.`
        );
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect Passcode', 'The Login Passcode entered is incorrect. Please try again.');
        setChangePinPasscodeInput('');
      }
    }
  };

  const handleResendChangePinOtp = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentChangePinOtp(code);
    setChangePinOtpInput('');
    setResendTimer(60);
    Alert.alert(
      'Verification OTP Resent',
      `A new 6-digit transaction confirmation OTP (${code}) has been sent to your registered number.`
    );
  };

  const handleChangePinOtpChange = (text: string) => {
    setChangePinOtpInput(text);
    if (text.length === 6) {
      if (text === sentChangePinOtp) {
        setNewPinInput('');
        setChangePinStep('new');
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect OTP', 'The verification code entered is incorrect. Please try again.');
        setChangePinOtpInput('');
      }
    }
  };

  const handleNewPinChange = (text: string) => {
    setNewPinInput(text);
    if (text.length === 4) {
      setConfirmPinInput('');
      setChangePinStep('confirm');
    }
  };

  const handleConfirmPinChange = (text: string) => {
    setConfirmPinInput(text);
    if (text.length === 4) {
      if (text === newPinInput) {
        setTransactionPin(text);
        setChangePinStep('success');
        try {
          Vibration.vibrate(200);
        } catch (e) {}
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('PINs Do Not Match', 'The confirmation PIN does not match the new PIN. Please try again.');
        setNewPinInput('');
        setConfirmPinInput('');
        setChangePinStep('new');
      }
    }
  };

  const selectedAvatar = AVATARS_CONFIG.find((av) => av.id === selectedAvatarId);
  const initials = name.charAt(0).toUpperCase();

  const handleToggleBiometrics = (value: boolean) => {
    setBiometricsEnabled(value);
    Alert.alert(
      value ? 'Fingerprint Enabled' : 'Fingerprint Disabled',
      value 
        ? 'You can now use your fingerprint to quickly unlock your wallet and approve transfers.'
        : 'You will need to manually enter your passcode and PIN for all actions.'
    );
  };

  const handleToggleTheme = (value: boolean) => {
    setIsDarkMode(value);
  };

  const handleStartLinkGmail = () => {
    setGmailInput(backupEmail || '');
    setVerificationCode('');
    setLinkStep('email');
    setShowLinkModal(true);
  };

  const handleSendLinkCode = () => {
    if (!gmailInput.trim() || !gmailInput.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail address.');
      return;
    }
    setIsLinking(true);
    // Generate a random 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);

    setTimeout(() => {
      setIsLinking(false);
      setLinkStep('verify');
      setResendTimer(60); // Start 60s countdown
      Alert.alert(
        'Verification Code Sent',
        `An authentication code (${code}) has been sent to ${gmailInput}. Please enter it to authorize and link your Gmail.`
      );
    }, 1200);
  };

  const handleResendLinkCode = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setResendTimer(60); // Reset 60s countdown
    Alert.alert(
      'Verification Code Resent',
      `A new authentication code (${code}) has been sent to ${gmailInput}.`
    );
  };

  const handleVerifyLinkCode = () => {
    if (verificationCode !== sentCode) {
      Alert.alert('Incorrect Code', 'The verification code entered is incorrect. Please try again.');
      return;
    }
    setBackupEmail(gmailInput);
    setLinkStep('success');
  };

  const handleStartExportSeed = () => {
    if (!backupEmail) {
      Alert.alert(
        'Gmail Link Required',
        'Please link your preferred Gmail address first in settings to receive your encrypted seed phrase.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Link Gmail Now', onPress: () => handleStartLinkGmail() }
        ]
      );
      return;
    }
    setPinInput('');
    setExportStep('pin');
    setShowExportModal(true);
  };

  const handleExportPinChange = (text: string) => {
    setPinInput(text);
    if (text.length === 4) {
      if (text === transactionPin) {
        setIsExporting(true);
        setTimeout(() => {
          setIsExporting(false);
          setExportStep('success');
        }, 1500);
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect PIN', 'The Transaction PIN entered is incorrect. Please try again.');
        setPinInput('');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Num Wallet? Make sure you have backed up your credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => router.push('/(auth)/welcome') }
      ]
    );
  };

  const handleStartRegenerate = () => {
    setRegenStep('warn');
    setRegenOtpCode('');
    setRegenPinInput('');
    setShowRegenModal(true);
  };

  const handleSelectRegenPath = (path: 'EXPORT' | 'SAVED') => {
    if (!backupEmail) {
      Alert.alert(
        'Gmail Link Required',
        'A linked backup Gmail is required first to receive critical transaction keys and authorize account changes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Link Gmail Now',
            onPress: () => {
              setShowRegenModal(false);
              handleStartLinkGmail();
            }
          }
        ]
      );
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentRegenOtp(code);
    setRegenPath(path);

    Alert.alert(
      'Transaction Code Sent',
      `A transaction confirmation OTP code (${code}) has been sent to your connected email ${backupEmail}. Please enter it to authorize account changes.`
    );
    setRegenStep('otp');
    setResendTimer(60); // Start 60s countdown
  };

  const handleResendRegenOtp = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentRegenOtp(code);
    setResendTimer(60); // Reset 60s countdown
    Alert.alert(
      'Transaction Code Resent',
      `A new transaction confirmation OTP code (${code}) has been sent to your connected email ${backupEmail}.`
    );
  };

  const handleVerifyRegenOtp = () => {
    if (regenOtpCode !== sentRegenOtp) {
      Alert.alert('Incorrect Code', 'The verification code entered is incorrect. Please try again.');
      return;
    }
    setRegenAuthMode(biometricsEnabled ? 'BIOMETRICS' : 'PIN');
    setRegenPinInput('');
    setRegenStep('pin');
  };

  const executeWalletRegeneration = () => {
    const prefixes = ['803', '806', '813', '816', '903', '906'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
    const resolvedNewNumber = randomPrefix + randomDigits;
    
    setNewAccountNumber(resolvedNewNumber);
    setAccountNumber(resolvedNewNumber);
    clearPortfolio();
    
    const prevEmail = backupEmail;
    setBackupEmail(null);
    
    try {
      Vibration.vibrate(500);
    } catch (e) {}

    if (regenPath === 'EXPORT') {
      Alert.alert(
        'Keys Exported Successfully',
        `Your encrypted seed phrase recovery document has been securely sent to ${prevEmail}! Decrypt it using your Transaction PIN (${transactionPin}).`
      );
    }

    setRegenStep('success');
  };

  const handleRegenScanFingerprint = () => {
    setIsRegenScanning(true);
    setTimeout(() => {
      setIsRegenScanning(false);
      executeWalletRegeneration();
    }, 1800);
  };

  const handleRegenPinChange = (text: string) => {
    setRegenPinInput(text);
    if (text.length === 4) {
      if (text === transactionPin) {
        executeWalletRegeneration();
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect PIN', 'The Transaction PIN entered is incorrect. Please try again.');
        setRegenPinInput('');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, !isDarkMode && styles.borderLight]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={isDarkMode ? Colors.text.primary : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, !isDarkMode && styles.textLightPrimary]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, !isDarkMode && styles.cardLight]}>
          {uploadedPhotoUri ? (
            <Image source={{ uri: uploadedPhotoUri }} style={styles.profileImage} />
          ) : uploadedPhoto ? (
            <View style={[styles.avatar, { backgroundColor: '#0F0F1E', borderWidth: 1, borderColor: Colors.brand.bright }]}>
              <Feather name="image" size={22} color={Colors.brand.bright} />
            </View>
          ) : selectedAvatar ? (
            <View style={[styles.avatar, { backgroundColor: selectedAvatar.bg }]}>
              <Feather name={selectedAvatar.icon} size={24} color={selectedAvatar.color} />
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, !isDarkMode && styles.textLightPrimary]}>{name}</Text>
            <Text style={styles.profileNum}>{cleanAccountNumber}</Text>
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security & Keys</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleStartLinkGmail} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <Feather name="mail" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Link Backup Gmail</Text>
                <Text style={styles.rowSub}>{backupEmail ? backupEmail : 'Not Attached (Tap to link account)'}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleStartExportSeed} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <Feather name="shield" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Receive / Check Seed Phrase</Text>
                <Text style={styles.rowSub}>Send encrypted seed phrase document to Gmail</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleStartChangePin} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="edit" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Change Transaction PIN</Text>
                <Text style={styles.rowSub}>Modify your 4-digit payment and key PIN</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#3A8AFF15' }]}>
                <Feather name="lock" size={16} color="#3A8AFF" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Fingerprint Unlock</Text>
                <Text style={styles.rowSub}>Use fingerprint for quick authorizations</Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={biometricsEnabled ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="eye" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Dark Theme</Text>
                <Text style={styles.rowSub}>Toggle between dark and light modes</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={isDarkMode ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Dashboard & Menu Customization Section */}
        <Text style={styles.sectionTitle}>Dashboard & Menu Customization</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          {/* NFT Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="image" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>NFT Gallery</Text>
                <Text style={styles.rowSub}>Toggle NFT visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showNfts}
              onValueChange={setShowNfts}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showNfts ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Staking Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="layers" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Staking Actions</Text>
                <Text style={styles.rowSub}>Toggle Staking visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showStake}
              onValueChange={setShowStake}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showStake ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Perpetual Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="trending-up" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Perpetual Trading (Perps)</Text>
                <Text style={styles.rowSub}>Toggle Perps visibility on menu & dashboard</Text>
              </View>
            </View>
            <Switch
              value={showPerps}
              onValueChange={setShowPerps}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showPerps ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Decentralized Hub Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="grid" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Decentralized Hub</Text>
                <Text style={styles.rowSub}>Toggle Hub visibility on menu & dashboard</Text>
              </View>
            </View>
            <Switch
              value={showHub}
              onValueChange={setShowHub}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showHub ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Memes Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="zap" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Memes Terminal</Text>
                <Text style={styles.rowSub}>Toggle Memes visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showMemes}
              onValueChange={setShowMemes}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showMemes ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Dgames Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="play-circle" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Decentralized Games (Dgames)</Text>
                <Text style={styles.rowSub}>Toggle Dgames visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showDgames}
              onValueChange={setShowDgames}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showDgames ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>
        </View>

        {/* APP SECURITY CONTROLS - REGENERATE WALLET SEPARATED */}
        <Text style={styles.sectionTitle}>Dangerous Area</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight, { borderColor: '#EF444430', borderWidth: 1 }]}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleStartRegenerate} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <Feather name="refresh-cw" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary, { color: '#EF4444' }]}>Regenerate Wallet</Text>
                <Text style={styles.rowSub}>Reset wallet keys & generate a brand new account</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionTitle}>About App</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={[styles.infoValue, !isDarkMode && styles.textLightSecondary]}>v1.0.0 (Beta)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blockchain backing</Text>
            <Text style={[styles.infoValue, { color: '#14F195', fontWeight: 'bold' }]}>Solana Mainnet</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={Colors.error} />
          <Text style={styles.logoutBtnText}>Log Out Wallet</Text>
        </TouchableOpacity>
        
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* ── Link Gmail Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showLinkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Link Backup Gmail</Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Input Gmail */}
            {linkStep === 'email' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="mail-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Preferred Gmail Link</Text>
                </View>
                <Text style={styles.modalTitle}>Link Gmail Account</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your preferred Gmail address where the encrypted recovery keys will be sent.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. lawrence@gmail.com"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="email-address"
                  value={gmailInput}
                  onChangeText={setGmailInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSendLinkCode}
                  disabled={isLinking}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>
                      {isLinking ? 'Sending Authentication...' : 'Send Authentication Code'}
                    </Text>
                    <Feather name="send" size={14} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Verify Gmail OTP */}
            {linkStep === 'verify' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Verify Authentication</Text>
                </View>
                <Text style={styles.modalTitle}>Confirm OTP Code</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit confirmation code sent to <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{gmailInput}</Text>.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoFocus
                />

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: Colors.text.muted, fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendLinkCode} activeOpacity={0.7}>
                      <Text style={{ color: '#F59E0B', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleVerifyLinkCode}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Link Gmail Account</Text>
                    <Feather name="check-circle" size={14} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Success Screen */}
            {linkStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[5] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check" size={36} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Gmail Linked!</Text>
                <Text style={styles.modalSubtitle}>
                  Your preferred email <Text style={{ fontWeight: 'bold', color: Colors.brand.bright }}>{gmailInput}</Text> has been successfully verified and attached to your backup settings.
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowLinkModal(false)}>
                  <Text style={styles.doneBtnText}>Got it, thanks!</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Receive Seed Phrase Modal ────────────────────────────────────────── */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
        onShow={() => {
          setTimeout(() => pinRef.current?.focus(), 150);
        }}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Receive Seed Phrase</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Secure PIN Authorization */}
            {exportStep === 'pin' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="lock-closed" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Authentication Required</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Transaction PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your 4-digit Transaction PIN to confirm exporting key document.
                </Text>

                {/* Dots row - wrapped in TouchableOpacity to trigger native keypad */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => pinRef.current?.focus()}
                  style={styles.dotsRow}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < pinInput.length && styles.dotFilled,
                      ]}
                    />
                  ))}
                </TouchableOpacity>

                {/* Hidden Native TextInput focused on mount */}
                <TextInput
                  ref={pinRef}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={pinInput}
                  onChangeText={handleExportPinChange}
                  autoFocus
                  secureTextEntry
                />
              </View>
            )}

            {/* Step 2: Success & Decryption warning */}
            {exportStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[5] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="send" size={32} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Seed Phrase Sent!</Text>
                <Text style={styles.modalSubtitle}>
                  An encrypted recovery PDF document has been successfully sent to <Text style={{ fontWeight: 'bold', color: Colors.brand.bright }}>{backupEmail}</Text>.
                </Text>

                {/* Important alert block outlining PIN decryption */}
                <View style={styles.recoveryAlertBox}>
                  <Feather name="alert-triangle" size={18} color="#F59E0B" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.alertBoxTitle}>How to decrypt the document:</Text>
                    <Text style={styles.alertBoxText}>
                      Open the security document sent to your inbox. You must enter your <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>4-digit Transaction PIN</Text> as the decryption password to open and access your seed phrase.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowExportModal(false)}>
                  <Text style={styles.doneBtnText}>Got it, thanks!</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Regenerate Wallet Modal ────────────────────────────────────────── */}
      <Modal
        visible={showRegenModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalContainerBox, !isDarkMode && styles.modalContainerBoxLight]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, !isDarkMode && styles.borderLight, { borderBottomWidth: 1, paddingBottom: Spacing[3], marginBottom: Spacing[4] }]}>
              <Text style={[styles.modalHeaderTitle, !isDarkMode && styles.textLightPrimary]}>Regenerate Wallet</Text>
              <TouchableOpacity onPress={() => setShowRegenModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Warning and Export Prompt */}
            {regenStep === 'warn' && (
              <View style={{ gap: Spacing[4], alignItems: 'center' }}>
                <View style={[styles.secureBadge, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                  <Feather name="alert-triangle" size={18} color="#EF4444" />
                  <Text style={[styles.secureText, { color: '#EF4444' }]}>Critical Security Reset</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Wallet Compromised?</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  This action will completely delete your current wallet from this device and permanently deregister it from your account number, generating a brand new secure address instead.
                </Text>

                <View style={[styles.recoveryAlertBox, !isDarkMode && { backgroundColor: '#F59E0B08', borderColor: '#F59E0B20' }]}>
                  <Feather name="info" size={18} color="#F59E0B" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.alertBoxTitle}>Important Warning:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#C4D4E8' : '#374151' }]}>
                      Since the wallet is being deleted from your account, any funds currently held will be completely lost if you do not keep the seed phrase. Please make sure you have exported and safely stored your current seed phrase before proceeding.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={() => handleSelectRegenPath('EXPORT')}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Feather name="shield" size={14} color="#FFFFFF" />
                    <Text style={styles.btnText}>Export Current Seed Phrase</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%', marginTop: -Spacing[2] }]}
                  onPress={() => handleSelectRegenPath('SAVED')}
                >
                  <View style={[styles.btnGradient, { backgroundColor: isDarkMode ? '#1A1A2E' : '#F3F4F6', borderWidth: 1, borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
                    <Text style={[styles.btnText, { color: '#EF4444' }]}>I have saved it already, proceed</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2A: Email OTP Code Validation */}
            {regenStep === 'otp' && (
              <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Feather name="mail" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Account Security Check</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Confirm Transaction OTP</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  Enter the 6-digit transaction confirmation code sent to your connected backup email: <Text style={{ fontWeight: 'bold', color: '#3A8AFF' }}>{backupEmail}</Text>
                </Text>

                <TextInput
                  style={[styles.modalInput, !isDarkMode && { backgroundColor: '#F3F4F6', color: '#111827', borderColor: '#E5E7EB' }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={isDarkMode ? Colors.text.disabled : '#9CA3AF'}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={regenOtpCode}
                  onChangeText={setRegenOtpCode}
                  autoFocus
                />

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: isDarkMode ? '#94A3B8' : '#6B7280', fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendRegenOtp} activeOpacity={0.7}>
                      <Text style={{ color: '#3A8AFF', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend OTP Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={handleVerifyRegenOtp}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Feather name="lock" size={14} color="#FFFFFF" />
                    <Text style={styles.btnText}>Verify Security Code</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRegenStep('warn')}
                >
                  <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2B: Transaction PIN / Biometrics Input */}
            {regenStep === 'pin' && (
              isRegenScanning ? (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%', paddingVertical: Spacing[4] }}>
                  <View style={styles.scanningIconContainer}>
                    <Ionicons name="finger-print" size={64} color="#10B981" />
                    <ActivityIndicator size="large" color="#10B981" style={StyleSheet.absoluteFill} />
                  </View>
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { color: '#10B981', fontSize: Typography.size.lg }]}>
                    Scanning Fingerprint...
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Verifying secure hardware enclave keys & signature permissions on local module...
                  </Text>
                </View>
              ) : regenAuthMode === 'BIOMETRICS' ? (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                  <Ionicons name="finger-print" size={64} color="#3A8AFF" style={{ alignSelf: 'center', marginBottom: Spacing[2] }} />
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Biometric Verification</Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Place your fingerprint on the scanner or align your face to authorize wallet regeneration.
                  </Text>

                  <TouchableOpacity
                    style={styles.scanTouchBtn}
                    activeOpacity={0.8}
                    onPress={handleRegenScanFingerprint}
                  >
                    <LinearGradient
                      colors={['#3A8AFF15', '#1040D425']}
                      style={styles.scanTouchGradient}
                    >
                      <Ionicons name="scan-outline" size={20} color="#3A8AFF" />
                      <Text style={styles.scanTouchText}>Tap to Scan Fingerprint</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchAuthBtn}
                    onPress={() => setRegenAuthMode('PIN')}
                  >
                    <Text style={styles.switchAuthBtnText}>Use Transaction PIN instead</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setRegenStep('otp')}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                  <View style={[styles.secureBadge, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                    <Feather name="lock" size={18} color="#EF4444" />
                    <Text style={[styles.secureText, { color: '#EF4444' }]}>Authorization Required</Text>
                  </View>
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Enter Transaction PIN</Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Enter your 4-digit Transaction PIN to complete the reset authorization.
                  </Text>

                  {/* Dots row - wrapped in TouchableOpacity to trigger native keypad */}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => regenPinRef.current?.focus()}
                    style={styles.dotsRow}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < regenPinInput.length && styles.dotFilled,
                        ]}
                      />
                    ))}
                  </TouchableOpacity>

                  {/* Hidden Native TextInput focused on mount */}
                  <TextInput
                    ref={regenPinRef}
                    style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={regenPinInput}
                    onChangeText={handleRegenPinChange}
                    autoFocus
                    secureTextEntry
                  />

                  {biometricsEnabled && (
                    <TouchableOpacity
                      style={styles.switchAuthBtn}
                      onPress={() => setRegenAuthMode('BIOMETRICS')}
                    >
                      <Text style={styles.switchAuthBtnText}>Use Biometrics instead</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setRegenStep('otp')}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {/* Step 3: Success Screen */}
            {regenStep === 'success' && (
              <View style={{ gap: Spacing[5], alignItems: 'center' }}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check-circle" size={36} color="#10B981" />
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Wallet Regenerated!</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  A new secure wallet account has been successfully generated and attached to your phone number.
                </Text>

                <View style={[styles.recoveryAlertBox, { backgroundColor: '#10B98110', borderColor: '#10B98125' }]}>
                  <Feather name="shield" size={18} color="#10B981" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.alertBoxTitle, { color: '#10B981' }]}>New Account Number:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#FFFFFF' : '#111827', fontSize: Typography.size.sm, fontFamily: 'monospace', fontWeight: 'bold' }]}>
                      {newAccountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.doneBtn, { width: '100%' }]} onPress={() => setShowRegenModal(false)}>
                  <Text style={styles.doneBtnText}>Start Using New Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Change Transaction PIN Modal ─────────────────────────────────────── */}
      <Modal
        visible={showChangePinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePinModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Change Transaction PIN</Text>
              <TouchableOpacity onPress={() => setShowChangePinModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Passcode Verification */}
            {changePinStep === 'passcode' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Authentication Required</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Login Passcode</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your 6-digit Login Passcode to verify identity before modifying payment settings.
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => changePinPasscodeRef.current?.focus()}
                  style={styles.dotsRow}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < changePinPasscodeInput.length && [styles.dotFilled, { backgroundColor: '#3A8AFF', borderColor: '#3A8AFF' }],
                      ]}
                    />
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={changePinPasscodeRef}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={changePinPasscodeInput}
                  onChangeText={handleChangePinPasscodeChange}
                  secureTextEntry
                />
              </View>
            )}

            {/* Step 2: OTP Verification */}
            {changePinStep === 'otp' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Ionicons name="mail-outline" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Verify Phone Number</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Verification OTP</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit confirmation code sent to your registered number: <Text style={{ fontWeight: 'bold', color: '#3A8AFF' }}>+234 {accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}</Text>
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => changePinOtpRef.current?.focus()}
                  style={styles.dotsRow}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < changePinOtpInput.length && [styles.dotFilled, { backgroundColor: '#3A8AFF', borderColor: '#3A8AFF' }],
                      ]}
                    />
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={changePinOtpRef}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={changePinOtpInput}
                  onChangeText={handleChangePinOtpChange}
                />

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: Colors.text.muted, fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendChangePinOtp} activeOpacity={0.7}>
                      <Text style={{ color: '#3A8AFF', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Step 3: New Transaction PIN */}
            {changePinStep === 'new' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>New PIN Creation</Text>
                </View>
                <Text style={styles.modalTitle}>Set New PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Create a new 4-digit Transaction PIN to authorize every payment and key document change.
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => changePinNewRef.current?.focus()}
                  style={styles.dotsRow}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < newPinInput.length && styles.dotFilled,
                      ]}
                    />
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={changePinNewRef}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={newPinInput}
                  onChangeText={handleNewPinChange}
                  secureTextEntry
                />
              </View>
            )}

            {/* Step 4: Confirm Transaction PIN */}
            {changePinStep === 'confirm' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>New PIN Confirmation</Text>
                </View>
                <Text style={styles.modalTitle}>Confirm New PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Please re-enter your 4-digit Transaction PIN to confirm.
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => changePinConfirmRef.current?.focus()}
                  style={styles.dotsRow}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < confirmPinInput.length && styles.dotFilled,
                      ]}
                    />
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={changePinConfirmRef}
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={confirmPinInput}
                  onChangeText={handleConfirmPinChange}
                  secureTextEntry
                />
              </View>
            )}

            {/* Step 5: Success Screen */}
            {changePinStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[5] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check" size={36} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>PIN Updated Successfully!</Text>
                <Text style={styles.modalSubtitle}>
                  Your 4-digit Transaction PIN has been securely updated. Use this new PIN to authorize all future send actions and security changes.
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowChangePinModal(false)}>
                  <Text style={styles.doneBtnText}>Return to Settings</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  borderLight: { borderBottomColor: '#E5E7EB' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  headerTitle: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[4],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  profileImage: { width: 54, height: 54, borderRadius: Radius.full },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: '700' },
  profileDetails: { gap: 2 },
  profileName: { color: Colors.text.primary, fontSize: Typography.size.base, fontWeight: '700' },
  profileNum: { color: Colors.text.muted, fontSize: Typography.size.xs },

  // Sections
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing[2],
  },
  sectionCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  iconBox: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: '700' },
  rowSub: { color: Colors.text.muted, fontSize: 10, marginTop: 1 },
  divider: { height: 1, backgroundColor: '#C4D4E808' },
  
  // App Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4] },
  infoLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  infoValue: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '25',
    borderRadius: Radius.xl,
    paddingVertical: Spacing[4],
    marginTop: Spacing[4],
  },
  logoutBtnText: { color: Colors.error, fontSize: Typography.size.sm, fontWeight: '700' },

  // ── Modal Styles ───────────────────────────────────────────────────────────
  modalBg: { flex: 1, backgroundColor: '#000000F0' },
  modalContent: { flex: 1, paddingHorizontal: Spacing[5] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  modalHeaderTitle: { color: '#FFFFFF', fontSize: Typography.size.base, fontWeight: '700' },
  modalCloseBtn: { padding: 4 },
  modalBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[2], gap: Spacing[4] },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B12',
    borderWidth: 1,
    borderColor: '#F59E0B25',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
  },
  secureText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },
  modalTitle: { color: '#FFFFFF', fontSize: Typography.size.xl, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing[2] },
  
  // Modal PIN Dots
  dotsRow: { flexDirection: 'row', gap: Spacing[6], marginVertical: Spacing[4] },
  dot: { width: 16, height: 16, borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#C4D4E830', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },

  // Pin Pad Grid
  padWrap: { width: '100%', paddingHorizontal: Spacing[2], marginTop: Spacing[2] },
  padGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing[4] },
  padKey: {
    width: '28%',
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padKeyText: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: '700' },

  // Modal Email Input
  modalInput: {
    width: '100%',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '40',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  modalSubmitBtn: { width: '100%', marginTop: Spacing[3] },
  btnGradient: { height: 56, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2] },
  btnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },

  // Modal Success Icons
  iconWrapSuccess: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  recoveryAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: '#F59E0B10',
    borderWidth: 1,
    borderColor: '#F59E0B25',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginTop: Spacing[2],
  },
  alertBoxTitle: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },
  alertBoxText: { color: Colors.text.muted, fontSize: 10, lineHeight: 15 },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.bright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[4],
  },
  doneBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: '700' },
  modalCancelBtn: {
    marginTop: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
  },
  modalCancelBtnText: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainerBox: {
    backgroundColor: '#08080F',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#C4D4E812',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    maxHeight: '90%',
  },
  modalContainerBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  scanTouchBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing[4],
    width: '100%',
  },
  scanTouchGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  scanTouchText: {
    color: '#3A8AFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    marginBottom: Spacing[2],
    width: '100%',
  },
  switchAuthBtnText: {
    color: '#3A8AFF',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  scanningIconContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
});

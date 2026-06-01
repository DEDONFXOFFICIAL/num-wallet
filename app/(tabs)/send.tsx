import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, IconSize } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const TOKENS = [
  { symbol: 'SOL', name: 'Solana', balance: '0.00 SOL', price: 175.50, color: '#14F195', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00 USDC', price: 1.00, color: '#2775CA', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/logo.png' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00 ETH', price: 3450.00, color: '#627EEA', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { symbol: 'BONK', name: 'Bonk', balance: '0.00 BONK', price: 0.000025, color: '#E4A13B', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/DezXAZ8z7PnrnRJjz3wXLDkAoAhfQDQJFrT7Sgh27oon/logo.png' },
];

export default function SendScreen() {
  const { isDarkMode, biometricsEnabled, transactionPin } = useUserStore();
  const params = useLocalSearchParams<{ recipient?: string }>();
  const initialRecipient = params?.recipient;

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [shieldVerified, setShieldVerified] = useState<boolean | null>(null);
  const [inputCurrency, setInputCurrency] = useState<'TOKEN' | 'USD' | 'USDT' | 'USDC' | 'CNGN'>('TOKEN');

  // Interactive step-by-step transaction wizard & identity resolution states
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientColor, setRecipientColor] = useState<string>('#3A8AFF');
  const [isRecipientConfirmed, setIsRecipientConfirmed] = useState<boolean>(false);

  // Security and Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'BIOMETRICS' | 'PIN'>('BIOMETRICS');
  const [pinValue, setPinValue] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const sendPinRef = useRef<TextInput>(null);

  // Auto-focus transfer PIN when authMode is 'PIN' and modal is shown
  useEffect(() => {
    if (showAuthModal && authMode === 'PIN') {
      setTimeout(() => {
        sendPinRef.current?.focus();
      }, 150);
    }
  }, [showAuthModal, authMode]);

  // Simulated signing / success animation states
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState<boolean>(false);

  const handleScanFingerprint = () => {
    setIsScanningFingerprint(true);
    setTimeout(() => {
      setIsScanningFingerprint(false);
      handleAuthSuccess();
    }, 1800);
  };

  const handleRecipientChange = (text: string) => {
    setRecipient(text);
    const cleaned = text.trim();
    if (cleaned.length >= 8) {
      // Simulate Num Shield registry lookup
      const isNum = /^\+?\d+$/.test(cleaned.replace(/\s+/g, ''));
      if (isNum) {
        setShieldVerified(true);
        if (cleaned.includes('8023456789') || cleaned === '8023456789') {
          setRecipientName('Alice Johnson');
          setRecipientColor('#10B981'); // Emerald
        } else if (cleaned.includes('8134567890') || cleaned === '8134567890') {
          setRecipientName('Bob Carter');
          setRecipientColor('#8B5CF6'); // Purple
        } else if (cleaned.includes('9087654321') || cleaned === '9087654321') {
          setRecipientName('Chidi Okafor');
          setRecipientColor('#3B82F6'); // Blue
        } else {
          const names = ['Adebayo Kolawole', 'Fatima Bello', 'Chinedu Okafor', 'Samuel Johnson', 'Olamide Balogun', 'Tunde Bakare', 'Ngozi Eze', 'Emeka Obi'];
          const index = parseInt(cleaned.slice(-1)) % names.length;
          setRecipientName(names[index] || 'Num User');
          const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];
          setRecipientColor(colors[parseInt(cleaned.slice(-1)) % colors.length] || '#3B82F6');
        }
      } else if (cleaned.length > 20) {
        setShieldVerified(true);
        setRecipientName('Solana Address (' + cleaned.slice(0, 4) + '...' + cleaned.slice(-4) + ')');
        setRecipientColor('#14F195'); // Solana Green
      } else {
        setShieldVerified(false);
        setRecipientName(null);
      }
    } else {
      setShieldVerified(null);
      setRecipientName(null);
    }
  };

  useEffect(() => {
    if (initialRecipient) {
      handleRecipientChange(initialRecipient);
    }
  }, [initialRecipient]);

  const handleSend = () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient address or phone number.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Instead of raw alert, open the gorgeous glassmorphic review modal
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = () => {
    setShowConfirmModal(false);
    setShowAuthModal(true);
    // If biometrics is enabled, launch biometrics overlay first. Otherwise, direct PIN pad.
    if (biometricsEnabled) {
      setAuthMode('BIOMETRICS');
    } else {
      setAuthMode('PIN');
    }
  };

  const handlePinChange = (text: string) => {
    setPinValue(text);
    if (text.length === 4) {
      if (text === transactionPin) {
        handleAuthSuccess();
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinValue('');
          setPinError(false);
          sendPinRef.current?.focus();
        }, 800);
      }
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthorizing(true);
    // Simulate Privy secure multi-party signing & broadcasting tx
    setTimeout(() => {
      setIsAuthorizing(false);
      setIsAuthorized(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAmount('');
        setRecipient('');
        setIsRecipientConfirmed(false);
        setIsAuthorized(false);
        setPinValue('');
        router.push('/(tabs)/home');
      }, 1800);
    }, 1500);
  };


  const numericValue = parseFloat(amount) || 0;
  
  // Dynamic conversions based on selected input currency
  let usdValue = 0;
  let tokenAmount = 0;
  let cngnValue = 0;

  if (inputCurrency === 'TOKEN') {
    tokenAmount = numericValue;
    usdValue = numericValue * selectedToken.price;
    cngnValue = usdValue * 1500;
  } else if (inputCurrency === 'USD' || inputCurrency === 'USDT' || inputCurrency === 'USDC') {
    usdValue = numericValue;
    tokenAmount = selectedToken.price > 0 ? numericValue / selectedToken.price : 0;
    cngnValue = usdValue * 1500;
  } else if (inputCurrency === 'CNGN') {
    cngnValue = numericValue;
    usdValue = numericValue / 1500;
    tokenAmount = selectedToken.price > 0 ? (numericValue / 1500) / selectedToken.price : 0;
  }

  const getConversionSubtitle = () => {
    const formattedToken = tokenAmount.toFixed(tokenAmount > 100 ? 2 : 6);
    const formattedUsd = usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedCngn = cngnValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    if (inputCurrency === 'TOKEN') {
      return `≈ $${formattedUsd} USD · ₦${formattedCngn} CNGN`;
    } else if (inputCurrency === 'USD') {
      return `≈ ${formattedToken} ${selectedToken.symbol} · ₦${formattedCngn} CNGN`;
    } else if (inputCurrency === 'CNGN') {
      return `≈ ${formattedToken} ${selectedToken.symbol} · $${formattedUsd} USD`;
    } else {
      return `≈ ${formattedToken} ${selectedToken.symbol} · $${formattedUsd} USD`;
    }
  };


  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const headerStyle = isDarkMode ? styles.header : [styles.header, styles.headerLight];
  const backBtnStyle = isDarkMode ? styles.backBtn : [styles.backBtn, styles.backBtnLight];
  const headerTitleStyle = isDarkMode ? styles.headerTitle : [styles.headerTitle, styles.textLightPrimary];
  const arrowColor = isDarkMode ? Colors.text.primary : '#111827';
  const cardStyle = isDarkMode ? styles.card : [styles.card, styles.cardLight];
  const tokenSelectorStyle = isDarkMode ? styles.tokenSelector : [styles.tokenSelector, styles.tokenSelectorLight];
  const labelStyle = isDarkMode ? styles.label : [styles.label, styles.textLightSecondary];
  const inputContainerStyle = isDarkMode ? styles.inputContainer : [styles.inputContainer, styles.inputContainerLight];
  const inputStyle = isDarkMode 
    ? styles.input 
    : [styles.input, styles.textLightPrimary, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }];
  const amountCardStyle = isDarkMode ? styles.amountCard : [styles.amountCard, styles.amountCardLight];
  const amountInputStyle = isDarkMode ? styles.amountInput : [styles.amountInput, styles.textLightPrimary];
  const amountLabelStyle = isDarkMode ? styles.amountLabel : [styles.amountLabel, styles.textLightSecondary];
  const summaryCardStyle = isDarkMode ? styles.summaryCard : [styles.summaryCard, styles.summaryCardLight];
  const summaryValueStyle = isDarkMode ? styles.summaryValue : [styles.summaryValue, styles.textLightSecondary];
  const tokenSymbolStyle = isDarkMode ? styles.tokenSymbol : [styles.tokenSymbol, styles.textLightPrimary];
  const textInputPlaceholderColor = isDarkMode ? Colors.text.disabled : '#9CA3AF';

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={arrowColor} />
        </TouchableOpacity>
        <Text style={headerTitleStyle}>Send Crypto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Token Selector */}
        <View style={cardStyle}>
          <Text style={labelStyle}>Select Asset</Text>
          <TouchableOpacity
            style={tokenSelectorStyle}
            onPress={() => setShowTokenPicker(!showTokenPicker)}
            activeOpacity={0.8}
          >
            <View style={styles.tokenLeft}>
              <Image source={{ uri: selectedToken.logo }} style={styles.tokenLogoImage} />
              <View>
                <Text style={tokenSymbolStyle}>{selectedToken.symbol}</Text>
                <Text style={styles.tokenName}>{selectedToken.name}</Text>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenBalance}>Bal: {selectedToken.balance}</Text>
              <Feather name={showTokenPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.text.muted} />
            </View>
          </TouchableOpacity>

          {showTokenPicker && (
            <View style={[styles.dropdown, !isDarkMode && styles.cardLight]}>
              {TOKENS.map((token) => (
                <TouchableOpacity
                  key={token.symbol}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedToken(token);
                    setShowTokenPicker(false);
                  }}
                >
                  <View style={styles.tokenLeft}>
                    <Image source={{ uri: token.logo }} style={styles.tokenLogoImage} />
                    <Text style={[styles.dropdownSymbol, !isDarkMode && styles.textLightPrimary]}>{token.symbol}</Text>
                  </View>
                  <Text style={styles.dropdownBalance}>{token.balance}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recipient Identity / Wizard Step 1 */}
        {isRecipientConfirmed ? (
          <View style={cardStyle}>
            <View style={styles.recipientPillRow}>
              <View style={styles.recipientPillLeft}>
                <View style={[styles.avatarCircleSmall, { backgroundColor: recipientColor }]}>
                  <Text style={styles.avatarInitialsText}>
                    {recipientName ? recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'NU'}
                  </Text>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.recipientPillName, !isDarkMode && styles.textLightPrimary]}>
                      {recipientName || 'Num User'}
                    </Text>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.recipientPillNumber}>{recipient}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editRecipientBtn}
                onPress={() => setIsRecipientConfirmed(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.editRecipientBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={cardStyle}>
            <Text style={labelStyle}>Recipient Identity</Text>
            <View style={inputContainerStyle}>
              <TextInput
                style={inputStyle}
                placeholder="Enter phone number or Solana address"
                placeholderTextColor={textInputPlaceholderColor}
                value={recipient}
                onChangeText={handleRecipientChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {shieldVerified === true && (
                <View style={styles.shieldBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.shieldBadgeText}>Shield Verified</Text>
                </View>
              )}
              {shieldVerified === false && (
                <View style={[styles.shieldBadge, styles.shieldBadgeWarn]}>
                  <Ionicons name="shield-outline" size={14} color="#F59E0B" />
                  <Text style={[styles.shieldBadgeText, { color: '#F59E0B' }]}>Unverified</Text>
                </View>
              )}
            </View>

            {shieldVerified === true && recipientName && (
              <View style={[styles.resolvedUserPreview, !isDarkMode && styles.resolvedUserPreviewLight]}>
                <View style={[styles.avatarCircleSmall, { backgroundColor: recipientColor }]}>
                  <Text style={styles.avatarInitialsText}>
                    {recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resolvedUserName, !isDarkMode && styles.textLightPrimary]}>{recipientName}</Text>
                  <Text style={styles.resolvedUserSub}>Registered & Verified Num User</Text>
                </View>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              </View>
            )}

            <Text style={styles.helpText}>
              You can type any phone number. If they don't have Num Wallet yet, they'll get an SMS to claim!
            </Text>

            {shieldVerified === true && (
              <TouchableOpacity
                style={styles.confirmRecipientBtn}
                onPress={() => setIsRecipientConfirmed(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmRecipientBtnText}>Confirm Recipient</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 2: Amount & Confirm (Only shows after Recipient is verified and locked) */}
        {isRecipientConfirmed && (
          <>
            {/* Amount Input */}
            <View style={amountCardStyle}>
              <Text style={amountLabelStyle}>Amount to Send</Text>

              {/* Currency Switcher Tabs */}
              <View style={styles.currencyToggleContainer}>
                {(['TOKEN', 'USD', 'USDT', 'USDC', 'CNGN'] as const).map((curr) => {
                  const label = curr === 'TOKEN' ? selectedToken.symbol : curr;
                  const isSelected = inputCurrency === curr;
                  return (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.currencyTab,
                        !isDarkMode && styles.currencyTabLight,
                        isSelected && styles.currencyTabSelected,
                        !isDarkMode && isSelected && styles.currencyTabSelectedLight,
                      ]}
                      onPress={() => setInputCurrency(curr)}
                    >
                      <Text
                        style={[
                          styles.currencyTabText,
                          !isDarkMode && styles.currencyTabTextLight,
                          isSelected && styles.currencyTabTextSelected,
                          !isDarkMode && isSelected && styles.currencyTabTextSelectedLight,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.amountInputRow}>
                <TextInput
                  style={amountInputStyle}
                  placeholder="0"
                  placeholderTextColor={textInputPlaceholderColor}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.amountTokenLabel}>
                  {inputCurrency === 'TOKEN' ? selectedToken.symbol : inputCurrency}
                </Text>
              </View>
              <Text style={styles.dollarConversion}>{getConversionSubtitle()}</Text>
            </View>

            {/* Transaction Summary */}
            <View style={summaryCardStyle}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Fee</Text>
                <Text style={summaryValueStyle}>0.00005 SOL (~$0.00001)</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Speed</Text>
                <Text style={[summaryValueStyle, { color: '#10B981', fontWeight: 'bold' }]}>Instant (Solana)</Text>
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity style={styles.sendBtnWrap} onPress={handleSend} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendBtn}
              >
                <Text style={styles.sendBtnText}>Confirm and Send</Text>
                <Feather name="arrow-up-right" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Review Transaction Modal (Glassmorphic) */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.glassConfirmBox, !isDarkMode && styles.glassConfirmBoxLight]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <Ionicons name="shield-checkmark" size={18} color="#3A8AFF" />
                <Text style={[styles.modalTitleText, !isDarkMode && styles.textLightPrimary]}>Confirm Transaction</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowConfirmModal(false)}>
                <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Visual Amount Display */}
            <View style={styles.modalAmountBlock}>
              <Text style={styles.modalSendLabel}>YOU ARE SENDING</Text>
              <Text style={styles.modalLargeAmount}>
                {tokenAmount.toFixed(tokenAmount > 100 ? 2 : 6)} {selectedToken.symbol}
              </Text>
              <Text style={styles.modalAmountSub}>
                ≈ ${usdValue.toFixed(2)} USD · ₦{(usdValue * 1500).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} CNGN
              </Text>
            </View>

            {/* Destination User Card */}
            <View style={[styles.modalRecipientCard, !isDarkMode && styles.modalRecipientCardLight]}>
              <View style={[styles.avatarCircleSmall, { backgroundColor: recipientColor }]}>
                <Text style={styles.avatarInitialsText}>
                  {recipientName ? recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'NU'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalRecipientName, !isDarkMode && styles.textLightPrimary]}>
                  {recipientName || 'Num User'}
                </Text>
                <Text style={styles.modalRecipientPhone}>{recipient}</Text>
              </View>
              <View style={styles.modalVerifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                <Text style={styles.modalVerifiedBadgeText}>VERIFIED</Text>
              </View>
            </View>

            {/* Core Transaction Fields */}
            <View style={styles.modalFieldsList}>
              <View style={styles.modalFieldRow}>
                <Text style={styles.modalFieldLabel}>Network</Text>
                <Text style={[styles.modalFieldValue, !isDarkMode && styles.textLightPrimary]}>Solana Blockchain</Text>
              </View>
              <View style={styles.modalFieldRow}>
                <Text style={styles.modalFieldLabel}>Network Fee</Text>
                <Text style={[styles.modalFieldValue, !isDarkMode && styles.textLightPrimary]}>0.00005 SOL (~$0.00001)</Text>
              </View>
              <View style={styles.modalFieldRow}>
                <Text style={styles.modalFieldLabel}>Speed</Text>
                <Text style={[styles.modalFieldValue, { color: '#10B981', fontWeight: 'bold' }]}>Instant (~400ms)</Text>
              </View>
            </View>

            {/* Scam Shield Warn Box */}
            <View style={styles.securityWarningBox}>
              <Feather name="alert-triangle" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityWarningTitle}>Scam Shield Active</Text>
                <Text style={styles.securityWarningText}>
                  This recipient is not in your frequent contacts history. Please review the destination number carefully to prevent irreversible loss of funds.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmTransfer} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearConfirmBtn}
              >
                <Text style={styles.modalConfirmBtnText}>Confirm and Authorize</Text>
                <Feather name="lock" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowConfirmModal(false)}>
              <Text style={[styles.modalCancelBtnText, !isDarkMode && styles.textLightSecondary]}>Cancel Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Authentication Modal */}
      <Modal
        visible={showAuthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isAuthorizing && !isAuthorized) setShowAuthModal(false);
        }}
        onShow={() => {
          if (authMode === 'PIN') {
            setTimeout(() => sendPinRef.current?.focus(), 150);
          }
        }}
      >
        <View style={styles.authModalOverlay}>
          {isAuthorizing ? (
            <View style={styles.signingView}>
              <ActivityIndicator size="large" color="#3A8AFF" />
              <Text style={styles.signingTitle}>Signing Transaction</Text>
              <Text style={styles.signingSubtitle}>Reconstructing Privy MPC local key fragments to authorize on-chain payload...</Text>
            </View>
          ) : isAuthorized ? (
            <View style={styles.successView}>
              <View style={styles.successCircle}>
                <Feather name="check" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Transfer Authorized</Text>
              <Text style={styles.successSubtitle}>Your transaction has been securely broadcast to the Solana network!</Text>
            </View>
          ) : isScanningFingerprint ? (
            <View style={[styles.authCardBox, !isDarkMode && styles.authCardBoxLight, { alignItems: 'center', paddingVertical: Spacing[6] }]}>
              <View style={styles.scanningIconContainer}>
                <Ionicons name="finger-print" size={64} color="#10B981" />
                <ActivityIndicator size="large" color="#10B981" style={StyleSheet.absoluteFill} />
              </View>
              <Text style={[styles.authCardTitle, !isDarkMode && styles.textLightPrimary, { color: '#10B981', marginTop: Spacing[4] }]}>
                Scanning Fingerprint...
              </Text>
              <Text style={styles.authCardDesc}>
                Verifying secure hardware enclave keys & signature permissions on local module...
              </Text>
            </View>
          ) : authMode === 'BIOMETRICS' ? (
            <View style={[styles.authCardBox, !isDarkMode && styles.authCardBoxLight]}>
              <Ionicons name="finger-print" size={64} color="#3A8AFF" style={{ alignSelf: 'center', marginBottom: Spacing[4] }} />
              <Text style={[styles.authCardTitle, !isDarkMode && styles.textLightPrimary]}>Biometric Verification</Text>
              <Text style={styles.authCardDesc}>Place your fingerprint on the scanner or align your face to authorize signing.</Text>
              
              <TouchableOpacity
                style={styles.scanTouchBtn}
                activeOpacity={0.8}
                onPress={handleScanFingerprint}
              >
                <LinearGradient
                  colors={['#3A8AFF15', '#1040D425']}
                  style={styles.scanTouchGradient}
                >
                  <Ionicons name="scan-outline" size={24} color="#3A8AFF" />
                  <Text style={styles.scanTouchText}>Tap to Scan Fingerprint</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchAuthBtn}
                onPress={() => setAuthMode('PIN')}
              >
                <Text style={styles.switchAuthBtnText}>Use 4-Digit Transaction PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authCardCancelBtn}
                onPress={() => setShowAuthModal(false)}
              >
                <Text style={[styles.authCardCancelText, !isDarkMode && styles.textLightSecondary]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.pinFullContainer, !isDarkMode && styles.pinFullContainerLight]}>
              <TouchableOpacity style={styles.pinCloseBtn} onPress={() => setShowAuthModal(false)}>
                <Feather name="x" size={20} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>

              <Text style={[styles.pinScreenTitle, !isDarkMode && styles.textLightPrimary]}>Transaction PIN</Text>
              <Text style={styles.pinScreenDesc}>Enter your 4-digit Transaction PIN to complete the transfer</Text>

              {/* Dots row - wrapped in TouchableOpacity to trigger native keypad */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => sendPinRef.current?.focus()}
                style={styles.pinDotsRow}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      !isDarkMode && styles.pinDotLight,
                      pinValue.length > idx && styles.pinDotFilled,
                      pinError && styles.pinDotError,
                    ]}
                  />
                ))}
              </TouchableOpacity>

              {pinError && (
                <Text style={styles.pinErrorLabel}>Incorrect PIN. Please try again.</Text>
              )}

              {/* Hidden Native TextInput */}
              <TextInput
                ref={sendPinRef}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                keyboardType="number-pad"
                maxLength={4}
                value={pinValue}
                onChangeText={handlePinChange}
                autoFocus
                secureTextEntry
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
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
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  label: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginTop: 4,
  },
  tokenLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  tokenIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenLogoImage: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  tokenSymbol: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: '700' },
  tokenName: { color: Colors.text.muted, fontSize: Typography.size.xs },
  tokenRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  tokenBalance: { color: Colors.text.secondary, fontSize: Typography.size.xs },
  dropdown: {
    backgroundColor: '#0F0F1E',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C4D4E815',
    overflow: 'hidden',
    marginTop: Spacing[2],
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E808',
  },
  dropdownSymbol: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: '600' },
  dropdownBalance: { color: Colors.text.secondary, fontSize: Typography.size.xs },
  inputContainer: {
    position: 'relative',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    paddingRight: 110,
  },
  shieldBadge: {
    position: 'absolute',
    right: 12,
    top: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98130',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shieldBadgeWarn: {
    backgroundColor: '#F59E0B15',
    borderColor: '#F59E0B30',
  },
  shieldBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  helpText: { color: Colors.text.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  amountCard: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    gap: Spacing[2],
  },
  currencyToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    marginVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    flexWrap: 'wrap',
  },
  currencyTab: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  currencyTabSelected: {
    backgroundColor: Colors.brand.deep,
    borderColor: Colors.brand.bright,
  },
  currencyTabLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  currencyTabSelectedLight: {
    backgroundColor: Colors.brand.deep,
    borderColor: Colors.brand.deep,
  },
  currencyTabText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  currencyTabTextSelected: {
    color: Colors.text.primary,
  },
  currencyTabTextLight: {
    color: '#6B7280',
  },
  currencyTabTextSelectedLight: {
    color: '#FFFFFF',
  },
  amountLabel: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: '600' },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  amountInput: {
    color: Colors.text.primary,
    fontSize: Typography.size['4xl'],
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 100,
  },
  amountTokenLabel: { color: Colors.brand.bright, fontSize: Typography.size.xl, fontWeight: '800' },
  dollarConversion: { color: Colors.text.muted, fontSize: Typography.size.sm, fontFamily: 'monospace' },
  summaryCard: {
    backgroundColor: '#0F0F1E',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  summaryValue: { color: Colors.text.secondary, fontSize: Typography.size.xs },
  sendBtnWrap: { marginTop: Spacing[4], marginBottom: Spacing[8] },
  sendBtn: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  sendBtnText: { color: Colors.text.primary, fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  containerLight: { backgroundColor: '#F3F4F6' },
  headerLight: { borderBottomColor: '#E5E7EB' },
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  tokenSelectorLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  inputContainerLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  amountCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  summaryCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  resolvedUserPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
  },
  resolvedUserPreviewLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  resolvedUserName: {
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  resolvedUserSub: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  confirmRecipientBtn: {
    backgroundColor: Colors.brand.deep,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  confirmRecipientBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  recipientPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatarCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: '800',
  },
  recipientPillName: {
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  recipientPillNumber: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  editRecipientBtn: {
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444430',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
  },
  editRecipientBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  glassConfirmBox: {
    backgroundColor: '#08080F',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: '#C4D4E815',
  },
  glassConfirmBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  modalTitleText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: '800',
  },
  closeModalBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAmountBlock: {
    alignItems: 'center',
    marginVertical: Spacing[3],
    gap: Spacing[1],
  },
  modalSendLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalLargeAmount: {
    color: '#3A8AFF',
    fontSize: Typography.size['3xl'],
    fontWeight: '800',
  },
  modalAmountSub: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontFamily: 'monospace',
  },
  modalRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    padding: Spacing[3],
    marginVertical: Spacing[3],
  },
  modalRecipientCardLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  modalRecipientName: {
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  modalRecipientPhone: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  modalVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#10B98115',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: Radius.sm,
  },
  modalVerifiedBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
  },
  modalFieldsList: {
    gap: 10,
    marginVertical: Spacing[2],
  },
  modalFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFieldLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  modalFieldValue: {
    color: Colors.text.primary,
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  securityWarningBox: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginVertical: Spacing[4],
  },
  securityWarningTitle: {
    color: '#F59E0B',
    fontSize: Typography.size.xs,
    fontWeight: '800',
    marginBottom: 2,
  },
  securityWarningText: {
    color: '#F59E0B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  modalConfirmBtn: {
    marginTop: Spacing[2],
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  linearConfirmBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: Spacing[1],
  },
  modalCancelBtnText: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: Spacing[5],
  },
  signingView: {
    alignItems: 'center',
    gap: Spacing[4],
  },
  signingTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  signingSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing[4],
  },
  successView: {
    alignItems: 'center',
    gap: Spacing[4],
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.xl,
    fontWeight: '800',
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  authCardBox: {
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.xl,
    padding: Spacing[5],
    width: '100%',
  },
  authCardBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  authCardTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  authCardDesc: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing[5],
  },
  scanTouchBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing[4],
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
  },
  switchAuthBtnText: {
    color: '#3A8AFF',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  authCardCancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  authCardCancelText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  pinFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: Spacing[5],
  },
  pinFullContainerLight: {
    backgroundColor: '#FFFFFF',
  },
  pinCloseBtn: {
    position: 'absolute',
    top: 50,
    right: Spacing[5],
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinScreenTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '800',
    marginBottom: Spacing[2],
  },
  pinScreenDesc: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[6],
    height: 16,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#C4D4E830',
    backgroundColor: 'transparent',
  },
  pinDotLight: {
    borderColor: '#D1D5DB',
  },
  pinDotFilled: {
    backgroundColor: '#3A8AFF',
    borderColor: '#3A8AFF',
  },
  pinDotError: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  pinErrorLabel: {
    color: '#EF4444',
    fontSize: Typography.size.xs,
    fontWeight: '700',
    marginBottom: Spacing[4],
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing[4],
    marginTop: Spacing[4],
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKeyBtn: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyBtnLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  keypadKeyBtnEmpty: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '700',
  },
  keypadCancelText: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scanningIconContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

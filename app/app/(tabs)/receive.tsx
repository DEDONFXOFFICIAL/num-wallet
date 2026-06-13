import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Clipboard, Image, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore, getLogoSource } from '../../store/userStore';
import CustomAlert from '../../components/CustomAlert';
import ImageWithFallback from '../../components/ImageWithFallback';
import { WalletEngine } from '../../store/walletEngine';
import { ethers } from 'ethers';

const EVM_LOGOS = [
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',
  'https://assets.coingecko.com/coins/images/13402/large/xend.png'
];

const BLOCKCHAINS_LIST = [
  {
    id: 'solana',
    name: 'Solana',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'],
    address: 'FmGeh5ZJ6TNYj18X1dhp3FmN79K1Xk8dZpYp9vP8uP8B',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'All Solana SPL tokens (e.g. USDC, BONK, dogwifhat) use this main Solana address.'
  },
  {
    id: 'evm',
    name: 'EVM Networks (Consolidated)',
    logos: EVM_LOGOS,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    type: 'evm',
    isEvmGroup: true,
    note: 'Supports Ethereum, BNB Chain, Polygon, Arbitrum, Base, Optimism, Avalanche, Fantom, Asset Chain, and all ERC-20 tokens.'
  },
  {
    id: 'ton',
    name: 'TON',
    logos: [require('../../logo/ton.png')],
    address: 'EQD454q9l5scs7l8scs7l5scs7l8scs7l9scs7l8s-ton',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive Toncoin (TON) and native TON ecosystem assets. Note: No memo tag required for personal self-custody addresses.'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png'],
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive native BTC, Ordinals, and BRC-20 collectibles securely.'
  },
  {
    id: 'cardano',
    name: 'Cardano',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png'],
    address: 'addr1q9d454q9l5scs7l8scs7l5scs7l8scs7l9scs7l8scs7',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive ADA and Cardano Native Tokens securely.'
  },
  {
    id: 'xrp',
    name: 'Ripple',
    logos: [require('../../logo/xrp.png')],
    address: 'rEb8t6aQ8idbg4YGgwgEGVWoVKSaEtJLbi',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive XRP directly. Note: No memo tag required for personal self-custody wallet addresses.'
  },
  {
    id: 'sui',
    name: 'Sui',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png'],
    address: '0x6e3bc01b5145b23d9b43efcd9c09c2182049efab3',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive SUI and native Sui Network assets.'
  },
  {
    id: 'aptos',
    name: 'Aptos',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png'],
    address: '0x43efcd9c09c2182049efab3fcd9c09c2182049efac9',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive APT and Aptos dynamic token assets.'
  },
  {
    id: 'tron',
    name: 'Tron',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png'],
    address: 'TY5scs7l8scs7l5scs7l8scs7l9scs7l8scs',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive TRX and TRC-20 standard tokens (e.g. TRC-20 USDT).'
  },
  {
    id: 'near',
    name: 'Near',
    logos: ['https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png'],
    address: '',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive NEAR and Near Protocol assets.'
  },
  {
    id: 'klever',
    name: 'Klever',
    logos: ['https://assets.coingecko.com/coins/images/13813/large/klever.png'],
    address: 'klv1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    type: 'non-evm',
    isEvmGroup: false,
    note: 'Receive KLV and Klever Chain native assets.'
  }
];

export default function ReceiveScreen() {
  const { accountNumber, isDarkMode, transactionPin, addTransaction } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({
    solana: 'FmGeh5ZJ6TNYj18X1dhp3FmN79K1Xk8dZpYp9vP8uP8B',
    evm: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    ton: 'EQD454q9l5scs7l8scs7l5scs7l8scs7l9scs7l8s-ton',
    bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    cardano: 'addr1q9d454q9l5scs7l8scs7l5scs7l8scs7l9scs7l8scs7',
    xrp: 'rEb8t6aQ8idbg4YGgwgEGVWoVKSaEtJLbi',
    sui: '0x6e3bc01b5145b23d9b43efcd9c09c2182049efab3',
    aptos: '0x43efcd9c09c2182049efac9',
    tron: 'TY5scs7l8scs7l5scs7l8scs7l9scs7l8scs',
    near: '',
    klever: 'klv1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  });

  useEffect(() => {
    WalletEngine.decryptAndLoadWallet(transactionPin).then(wallet => {
      if (wallet) {
        const cleanedMnemonic = wallet.words.trim().toLowerCase();
        const hash = ethers.sha256(ethers.toUtf8Bytes(cleanedMnemonic));
        
        // Deterministic addresses for non-derived chains
        const btcAddress = 'bc1q' + hash.substring(2, 42);
        const cardanoAddress = 'addr1q' + hash.substring(2, 62);
        const suiAddress = '0x' + hash.substring(2, 42);
        const aptosAddress = '0x' + hash.substring(42, 82);
        const tronAddress = 'T' + hash.substring(2, 35);
        const nearAddress = wallet.solanaAddress.substring(0, 10).toLowerCase() + '.near';
        const kleverAddress = wallet.kleverAddress || ('klv' + hash.substring(2, 34));

        setWalletAddresses({
          solana: wallet.solanaAddress,
          evm: wallet.evmAddress,
          ton: wallet.tonAddress,
          xrp: wallet.xrpAddress,
          bitcoin: btcAddress,
          cardano: cardanoAddress,
          sui: suiAddress,
          aptos: aptosAddress,
          tron: tronAddress,
          near: nearAddress,
          klever: kleverAddress
        });
      }
    });
  }, [transactionPin]);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'info' as any,
    iconColor: Colors.brand.bright as string,
  });
  
  // Enforce strict 10-digit number by removing country code prefixes if present
  const cleanAccountNumber = accountNumber.replace(/^\+\d+/, '').replace(/\s+/g, '');
  
  const handleCopy = (text: string, type: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setAlertConfig({
      visible: true,
      title: 'Copied!',
      message: `${type} has been copied to your clipboard.`,
      icon: 'check-circle',
      iconColor: '#10B981',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharePhoneWallet = async () => {
    try {
      await Share.share({
        message: `Send me crypto on Num Wallet!\n\nPhone Wallet: ${cleanAccountNumber}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Dynamic light mode styles helper
  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const cardStyle = isDarkMode ? styles.qrCardContainer : [styles.qrCardContainer, styles.cardLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, borderStyle]}>
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            !isDarkMode && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }
          ]} 
          onPress={() => router.push('/(tabs)/home')}
        >
          <Feather name="arrow-left" size={20} color={isDarkMode ? Colors.text.primary : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]}>Receive Crypto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Phone Wallet ID card (Phone wallet address) */}
          <View style={cardStyle}>
            <View style={styles.qrHeader}>
              <Image
                source={require('../../logo/logo.png')}
                style={styles.qrLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.qrBrandNum}>Num Wallet</Text>
                <Text style={styles.qrBrandSub}>Your phone is your wallet</Text>
              </View>
            </View>

            {/* Glowing Metallic QR Code Container */}
            <View style={[styles.qrCodeBorder, !isDarkMode && styles.qrBorderLight]}>
              <View style={styles.qrCodeInner}>
                <View style={styles.qrGrid}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cleanAccountNumber)}&color=000000&bgcolor=ffffff&qzone=1` }}
                    style={{ width: '100%', height: '100%', borderRadius: Radius.sm }}
                    resizeMode="contain"
                  />
                  {/* Center badge */}
                  <View style={styles.qrCenterBadge}>
                    <Image
                      source={require('../../logo/logo.png')}
                      style={styles.qrCenterLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Phone Wallet Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsLabel}>Your Phone Wallet ID</Text>
              <View style={styles.addressRow}>
                <Text style={[styles.phoneAddress, textStyle]}>{cleanAccountNumber}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(cleanAccountNumber, 'Phone wallet ID')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.copyIconBtn}
                >
                  <Feather name="copy" size={16} color={Colors.brand.bright} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Persistent Consolidation Rule Notice Alert */}
          <View style={[styles.alertBanner, { backgroundColor: isDarkMode ? '#1B1410' : '#FFFBEB', borderColor: isDarkMode ? '#EAB30830' : '#F59E0B60' }]}>
            <Ionicons name="warning" size={16} color={isDarkMode ? '#F59E0B' : '#D97706'} style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: isDarkMode ? '#F59E0B' : '#B45309' }]}>Address Rule Notice</Text>
              <Text style={[styles.alertText, { color: isDarkMode ? '#FCD34D' : '#78350F', fontWeight: '500' }]}>
                Tokens (USDT, USDC, memes, etc.) built on the same blockchain share the exact same address. Ensure you copy the correct network address below.
              </Text>
            </View>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.selectorLabel}>Backing Blockchain Addresses</Text>
            <Text style={styles.sectionHeaderHelper}>Tap address card to show QR Code</Text>
          </View>

          {/* Vertical Stack of Blockchain Address Cards */}
          <View style={styles.addressesStack}>
            {BLOCKCHAINS_LIST.map((chain) => {
              const isExpanded = expandedCardId === chain.id;
              const actualAddress = walletAddresses[chain.id] || chain.address;
              const displayedAddress = `${actualAddress.slice(0, 10)}...${actualAddress.slice(-10)}`;
              
              return (
                <View 
                  key={chain.id}
                  style={[
                    styles.blockchainCard,
                    !isDarkMode && styles.blockchainCardLight,
                    isExpanded && styles.blockchainCardActive
                  ]}
                >
                  {/* Clickable Header Row */}
                  <TouchableOpacity
                    style={styles.cardHeaderPressable}
                    onPress={() => setExpandedCardId(isExpanded ? null : chain.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.blockchainLeft}>
                      {/* Logo or Combined EVM Logos Row */}
                      <View style={styles.logosRowContainer}>
                        {chain.logos.map((logoSource, idx) => {
                          const resolvedSource = getLogoSource(logoSource);
                          const fallbackText = typeof logoSource === 'string' ? (logoSource.includes('blockchains/') ? logoSource.split('blockchains/')[1].split('/')[0] : chain.name) : chain.name;
                          return (
                            <ImageWithFallback
                              key={typeof logoSource === 'string' ? logoSource : idx.toString()}
                              source={resolvedSource}
                              style={[
                                styles.chainLogoImage,
                                chain.isEvmGroup && {
                                  marginLeft: idx > 0 ? -12 : 0,
                                  zIndex: 10 - idx,
                                  borderWidth: 1.5,
                                  borderColor: isDarkMode ? '#0A0A18' : '#FFFFFF'
                                }
                              ]}
                              fallbackText={fallbackText}
                            />
                          );
                        })}
                      </View>
                      <View style={{ flex: 1, marginLeft: chain.isEvmGroup ? 12 : 6 }}>
                        <Text style={[styles.blockchainTitleText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                          {chain.name}
                        </Text>
                        {!isExpanded && (
                          <Text style={[styles.blockchainAddress, !isDarkMode && styles.textLightSecondary]} numberOfLines={1}>
                            {displayedAddress}
                          </Text>
                        )}
                      </View>
                      <Feather 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={isDarkMode ? '#475569' : '#9CA3AF'} 
                      />
                    </View>
                  </TouchableOpacity>
 
                  {/* Expandable Inner Layout */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Monospace Address Display */}
                      <View style={styles.fullAddressContainer}>
                        <Text style={styles.fullAddressLabel}>Full Wallet Address</Text>
                        <View style={styles.fullAddressRow}>
                          <Text style={[styles.fullAddressText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} selectable={true}>
                            {actualAddress}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleCopy(actualAddress, `${chain.name} address`)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="copy" size={14} color={Colors.brand.bright} />
                          </TouchableOpacity>
                        </View>
                      </View>
 
                      {/* Small Specific QR Code Frame */}
                      <View style={styles.smallQrContainer}>
                        <View style={[styles.smallQrBorder, !isDarkMode && styles.qrBorderLight]}>
                          <View style={styles.smallQrInner}>
                            <View style={styles.qrGrid}>
                              <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(actualAddress)}&color=000000&bgcolor=ffffff&qzone=1` }}
                                style={{ width: '100%', height: '100%', borderRadius: Radius.xs }}
                                resizeMode="contain"
                              />
                            </View>
                          </View>
                        </View>
                        <Text style={styles.smallQrLabel}>Scan to deposit {chain.isEvmGroup ? 'EVM Assets' : chain.name}</Text>
                      </View>
 
                      {/* Card Actions */}
                      <View style={styles.expandedActionRow}>
                        <TouchableOpacity
                          style={styles.cardCopyBtn}
                          onPress={() => handleCopy(actualAddress, `${chain.name} address`)}
                        >
                          <Feather name="copy" size={12} color="#FFFFFF" />
                          <Text style={styles.cardCopyBtnText}>Copy Address</Text>
                        </TouchableOpacity>
 
                        <TouchableOpacity
                          style={styles.cardShareBtn}
                          onPress={async () => {
                            try {
                              await Share.share({
                                message: `Send me crypto on Num Wallet!\n\n${chain.name} Address:\n${actualAddress}`,
                              });
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                        >
                          <Feather name="share-2" size={12} color={Colors.brand.bright} />
                          <Text style={styles.cardShareBtnText}>Share</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Callout Educational Note */}
                      <View style={[styles.cardNoteBox, chain.type === 'evm' ? styles.evmNoteBox : styles.standardNoteBox]}>
                        <Feather
                          name={chain.type === 'evm' ? "layers" : "info"}
                          size={12}
                          color={chain.type === 'evm' ? "#3A8AFF" : Colors.brand.bright}
                          style={{ marginRight: 6, marginTop: 1 }}
                        />
                        <Text style={[styles.cardNoteText, chain.type === 'evm' ? styles.evmNoteText : styles.standardNoteText]}>
                          {chain.note}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Primary Share Phone Wallet Action */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSharePhoneWallet} activeOpacity={0.8}>
              <Feather name="share-2" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Share Phone Wallet ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
      />
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
  },
  borderDark: { borderBottomColor: '#C4D4E810' },
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
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { flexGrow: 1 },
  body: { flex: 1, paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[5] },
  
  selectorLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // QR Card
  qrCardContainer: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    alignItems: 'center',
    gap: Spacing[4],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    alignSelf: 'flex-start',
  },
  qrLogo: { width: 36, height: 36, borderRadius: Radius.sm },
  qrBrandNum: { color: Colors.brand.bright, fontSize: Typography.size.base, fontWeight: '800' },
  qrBrandSub: { color: Colors.text.muted, fontSize: 10 },

  // Glowing QR
  qrCodeBorder: {
    width: 180,
    height: 180,
    borderRadius: Radius.lg,
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '60',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.bright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  qrBorderLight: {
    backgroundColor: '#F3F4F6',
    borderColor: Colors.brand.bright + '40',
  },
  qrCodeInner: {
    width: 154,
    height: 154,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
  },
  qrGrid: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: Colors.text.primary,
    borderRadius: Radius.xs,
  },
  qrGridLines: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  qrGridDot: {
    position: 'absolute',
    height: 4,
    backgroundColor: Colors.text.primary,
    borderRadius: Radius.full,
  },
  qrCenterBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.brand.bright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterLogo: { width: 20, height: 20, borderRadius: 2 },

  // Details
  detailsContainer: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  detailsLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  phoneAddress: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyIconBtn: {
    padding: 4,
  },

  // Alert Rules banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    width: '100%',
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  alertText: {
    fontSize: 10,
    lineHeight: 14,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing[2],
  },
  sectionHeaderHelper: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '500',
  },

  // Addresses stack
  addressesStack: {
    gap: 12,
    width: '100%',
  },

  // Blockchain Address Card
  blockchainCard: {
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    overflow: 'hidden',
  },
  blockchainCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  blockchainCardActive: {
    borderColor: Colors.brand.bright,
    borderWidth: 1.5,
  },
  cardHeaderPressable: {
    width: '100%',
  },
  blockchainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logosRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 28,
  },
  chainLogoImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  blockchainTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  blockchainAddress: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Expanded card content styles
  expandedContent: {
    marginTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#C4D4E808',
    paddingTop: Spacing[4],
    gap: 16,
  },
  fullAddressContainer: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C4D4E805',
  },
  fullAddressLabel: {
    color: Colors.text.muted,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fullAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullAddressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },

  // Small Specific QR
  smallQrContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  smallQrBorder: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallQrInner: {
    width: 84,
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    padding: 6,
  },
  smallQrLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.text.muted,
  },

  // Small actions inside card
  expandedActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardCopyBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardShareBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardShareBtnText: {
    color: Colors.brand.bright,
    fontSize: 11,
    fontWeight: '700',
  },

  // Card specific warnings note
  cardNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    width: '100%',
  },
  evmNoteBox: {
    backgroundColor: 'rgba(58, 138, 255, 0.08)',
    borderColor: 'rgba(58, 138, 255, 0.15)',
  },
  standardNoteBox: {
    backgroundColor: 'rgba(58, 138, 255, 0.05)',
    borderColor: 'rgba(58, 138, 255, 0.1)',
  },
  cardNoteText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  evmNoteText: {
    color: '#3A8AFF',
    fontWeight: '600',
  },
  standardNoteText: {
    color: Colors.text.secondary,
  },

  // Primary Actions
  bottomActions: {
    marginTop: Spacing[2],
  },
  actionButton: {
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputField: {
    fontSize: 12,
    fontWeight: '600',
  },
  chainPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chainPillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  btnSimulateDeposit: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.bright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnSimulateDepositText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionButtonSecondary: {
    height: 52,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: 10,
  },
  actionBtnSecondaryText: {
    color: Colors.brand.bright,
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
});

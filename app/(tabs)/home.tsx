import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors, Typography, Spacing, Radius, IconSize } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const AVATARS_CONFIG = [
  { id: '1', icon: 'user' as const, color: '#3A8AFF', bg: '#3A8AFF20' },
  { id: '2', icon: 'aperture' as const, color: '#10B981', bg: '#10B98120' },
  { id: '3', icon: 'cpu' as const, color: '#8B5CF6', bg: '#8B5CF620' },
  { id: '4', icon: 'activity' as const, color: '#EC4899', bg: '#EC489920' },
  { id: '5', icon: 'shield' as const, color: '#F59E0B', bg: '#F59E0B20' },
];

// ── Mock data ─────────────────────────────────────────────────────────────────
const USER = {
  name: 'Lawrence',
  accountNumber: '8033600717',
  cryptoBalance: '$0.00',
  bankBalance: '₦0.00',
};


const ACTION_BUTTONS = [
  { id: 'send', label: 'Send', icon: 'arrow-up' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
  { id: 'receive', label: 'Receive', icon: 'arrow-down' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
  { id: 'convert', label: 'Convert', icon: 'repeat' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
  { id: 'hub', label: 'Hub', icon: 'grid' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
  { id: 'nfts', label: 'NFTs', icon: 'image' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
  { id: 'stake', label: 'Stake', icon: 'layers' as const, color: Colors.brand.bright, bg: Colors.brand.bright + '15' },
];

function Header() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Read dynamic store values
  const { name, selectedAvatarId, uploadedPhoto, uploadedPhotoUri, isDarkMode } = useUserStore();
  const initials = name.charAt(0).toUpperCase();

  // Find selected avatar configuration
  const selectedAvatar = AVATARS_CONFIG.find((av) => av.id === selectedAvatarId);

  const iconColor = isDarkMode ? Colors.text.primary : '#111827';
  const btnBg = isDarkMode ? '#0F0F1E' : '#FFFFFF';
  const btnBorder = isDarkMode ? '#C4D4E810' : '#E5E7EB';

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {/* Render dynamic avatar based on onboarding profile inputs */}
        {uploadedPhotoUri ? (
          <Image source={{ uri: uploadedPhotoUri }} style={styles.avatarImage} />
        ) : uploadedPhoto ? (
          <View style={[styles.avatar, { backgroundColor: '#0F0F1E', borderWidth: 1, borderColor: Colors.brand.bright }]}>
            <Feather name="image" size={18} color={Colors.brand.bright} />
          </View>
        ) : selectedAvatar ? (
          <View style={[styles.avatar, { backgroundColor: selectedAvatar.bg }]}>
            <Feather name={selectedAvatar.icon} size={20} color={selectedAvatar.color} />
          </View>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text style={[styles.greeting, !isDarkMode && styles.textLightSecondary]}>{greeting}</Text>
          <Text style={[styles.userName, !isDarkMode && styles.textLightPrimary]} numberOfLines={1}>{name}</Text>
        </View>
      </View>
      
      {/* Scanner & Notifications Side-by-Side circle buttons */}
      <View style={styles.headerRightActions}>
        <TouchableOpacity 
          style={[styles.actionBtnHeader, { backgroundColor: btnBg, borderColor: btnBorder }]} 
          onPress={() => router.push('/(tabs)/scanner')}
        >
          <Ionicons name="scan-outline" size={18} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtnHeader, { backgroundColor: btnBg, borderColor: btnBorder }]} 
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Feather name="bell" size={18} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

import CustomAlert from '../../components/CustomAlert';

function BalanceCards() {
  const { accountNumber, isDarkMode, isBalanceVisible, setIsBalanceVisible, portfolioAssets } = useUserStore();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'info' as any,
    iconColor: Colors.brand.bright as string,
  });

  const cardBg = isDarkMode ? Colors.bg.surface : '#FFFFFF';
  const cardBorder = isDarkMode ? Colors.primary.border : '#E5E7EB';
  const textColor = isDarkMode ? Colors.text.primary : '#111827';
  const textSecColor = isDarkMode ? Colors.text.secondary : '#4B5563';

  // Calculate dynamic crypto balance from active portfolioAssets
  const calculatedBalance = portfolioAssets.reduce((sum, chain) => {
    if (chain.totalValue !== undefined) {
      return sum + chain.totalValue;
    }
    const chainSum = chain.tokens.reduce((tokenSum: number, token: any) => {
      const val = parseFloat(token.value.replace(/[^0-9.]/g, '')) || 0;
      return tokenSum + val;
    }, 0);
    return sum + chainSum;
  }, 0);

  const formattedCryptoBalance = `$${calculatedBalance.toFixed(2)}`;

  return (
    <View style={styles.balanceSection}>
      {/* Crypto Card — Active with Stacked Actions */}
      <View style={[styles.cryptoCard, { backgroundColor: cardBg, borderColor: cardBorder, padding: Spacing[5] }]}>
        
        {/* Row 1: Brand Logo & Naked Clickable Transaction History */}
        <View style={[styles.cardTopRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] }]}>
          <View style={styles.cardBrandContainer}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={styles.cardLabel}>Num Wallet Crypto</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/history')}
            activeOpacity={0.7}
          >
            <Text style={{ color: Colors.brand.bright, fontSize: 11, fontWeight: '800' }}>
              Transaction History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Balance Amount & Prominent Fund Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] }}>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceAmount, { color: textColor }]}>
              {isBalanceVisible ? formattedCryptoBalance : '••••••'}
            </Text>
            <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)} style={styles.eyeButton}>
              <Feather
                name={isBalanceVisible ? 'eye' : 'eye-off'}
                size={IconSize.sm}
                color={textSecColor}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cardFundBtn}
            onPress={() => {
              setAlertConfig({
                visible: true,
                title: 'Coming Soon',
                message: 'Direct fiat-to-crypto deposit and bank transfer funding gateways are currently under private beta and will unlock in the next mainnet update.',
                icon: 'clock',
                iconColor: Colors.brand.bright,
              });
            }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.cardFundBtnText}>Fund Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Account Number Copy Row */}
        <View style={styles.accountRow}>
          <Feather name="hash" size={IconSize.xs} color={Colors.text.muted} />
          <Text style={[styles.accountNumber, { color: textSecColor }]}>{accountNumber}</Text>
          <TouchableOpacity 
            onPress={() => {
              Clipboard.setStringAsync(accountNumber);
              setAlertConfig({
                visible: true,
                title: 'Copied!',
                message: 'Your wallet account number has been copied to your clipboard.',
                icon: 'check-circle',
                iconColor: '#10B981',
              });
            }} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="copy" size={IconSize.xs} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function ActionButtons() {
  const { isDarkMode, showNfts, showStake, showHub, showMemes, showDgames } = useUserStore();
  
  const handleAction = (id: string) => {
    if (id === 'send') router.push('/(tabs)/send');
    else if (id === 'receive') router.push('/(tabs)/receive');
    else if (id === 'convert') router.push('/(tabs)/convert');
    else if (id === 'hub') router.push('/(tabs)/hub');
    else if (id === 'nfts') router.push('/(tabs)/nfts');
    else if (id === 'stake') router.push('/(tabs)/stake');
    else if (id === 'meme') router.push('/(tabs)/meme');
    else if (id === 'dgames') {
      router.push('/(tabs)/dgames');
    }
  };

  type ButtonConfig = {
    id: string;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    color: string;
    bg: string;
    visible: boolean;
  };

  const allButtons: ButtonConfig[] = [
    { id: 'send', label: 'Send', icon: 'arrow-up', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: true },
    { id: 'receive', label: 'Receive', icon: 'arrow-down', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: true },
    { id: 'convert', label: 'Convert', icon: 'repeat', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: true },
    { id: 'hub', label: 'Hub', icon: 'grid', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showHub },
    { id: 'nfts', label: 'NFTs', icon: 'image', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showNfts },
    { id: 'meme', label: 'Memes', icon: 'zap', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showMemes },
    { id: 'stake', label: 'Stake', icon: 'layers', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showStake },
    { id: 'dgames', label: 'Dgames', icon: 'play-circle', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showDgames },
  ];

  const activeButtons = allButtons.filter(btn => btn.visible);

  return (
    <View style={{ marginBottom: Spacing[4] }}>
      <View style={styles.actionGrid}>
        {activeButtons.map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={styles.actionBtn}
            onPress={() => handleAction(btn.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDarkMode ? btn.bg : '#3A8AFF12' }]}>
              <Feather name={btn.icon} size={IconSize.md} color={Colors.brand.bright} />
            </View>
            <Text style={[styles.actionLabel, !isDarkMode && styles.textLightSecondary]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TokenRow({ symbol, name, amount, value, change, isPositive, logo, onConvert }: {
  symbol: string; name: string; amount: string; value: string; change: string; isPositive: boolean; logo: string; onConvert: () => void;
}) {
  const { isDarkMode, isBalanceVisible } = useUserStore();
  return (
    <View style={[styles.tokenRow, !isDarkMode && styles.borderLightRow]}>
      <Image source={typeof logo === 'string' ? { uri: logo } : logo} style={styles.tokenLogoImage} />
      <View style={styles.tokenInfo}>
        <Text style={[styles.tokenSymbol, !isDarkMode && styles.textLightPrimary]}>{symbol}</Text>
        <Text style={styles.tokenAmount}>{isBalanceVisible ? amount : '••••'}</Text>
      </View>
      <View style={styles.tokenRight}>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.tokenValue, !isDarkMode && styles.textLightSecondary]}>{isBalanceVisible ? value : '••••'}</Text>
          <View style={[
            styles.changeBadge,
            {
              backgroundColor: isPositive ? '#10B9811A' : '#EF44441A',
              borderColor: isPositive ? '#10B98133' : '#EF444433',
            }
          ]}>
            <Text style={[styles.changeText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
              {isPositive ? '▲ ' : '▼ '}{change}
            </Text>
          </View>
        </View>
        <View style={styles.tokenActions}>
          <TouchableOpacity style={[styles.tokenActionBtn, { borderColor: Colors.brand.bright + '40' }]} onPress={() => router.push('/(tabs)/send')}>
            <Text style={[styles.tokenActionText, { color: Colors.brand.bright }]}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tokenActionBtn, { borderColor: Colors.brand.bright + '40' }]}
            onPress={onConvert}
          >
            <Text style={[styles.tokenActionText, { color: Colors.brand.bright }]}>Convert</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function TokenAccordion() {
  const [openChain, setOpenChain] = useState<string | null>(null);
  const { isDarkMode, isBalanceVisible, portfolioAssets, importCustomAsset } = useUserStore();
  const [contractInputs, setContractInputs] = useState<Record<string, string>>({});
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'info' as any,
    iconColor: Colors.brand.bright as string,
    showConfirm: false,
    confirmText: 'Confirm',
    onConfirm: undefined as (() => void) | undefined,
  });

  const handleInputChange = (chainId: string, text: string) => {
    setContractInputs(prev => ({ ...prev, [chainId]: text }));
  };

  const handlePaste = async (chainId: string) => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().length > 0) {
        setContractInputs(prev => ({ ...prev, [chainId]: text.trim() }));
      } else {
        setAlertConfig({
          visible: true,
          title: 'Clipboard Empty',
          message: 'No address found in clipboard.',
          icon: 'alert-circle',
          iconColor: Colors.error,
          showConfirm: false,
          confirmText: 'Confirm',
          onConfirm: undefined,
        });
      }
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: 'Permission Error',
        message: 'Unable to access clipboard.',
        icon: 'lock',
        iconColor: Colors.error,
        showConfirm: false,
        confirmText: 'Confirm',
        onConfirm: undefined,
      });
    }
  };

  const handleImportToken = (chainId: string) => {
    const address = contractInputs[chainId] || '';
    if (address.trim().length === 0) return;
    
    // Auto-detect network based on address prefix
    const isEthLike = address.trim().startsWith('0x');
    const detectedChain = isEthLike ? 'Ethereum' : 'Solana';
    const detectedSymbol = isEthLike ? 'USDT' : 'USDC';
    const detectedName = isEthLike ? 'Tether USD' : 'USD Coin';
    const detectedLogo = isEthLike 
      ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
      : 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';

    setAlertConfig({
      visible: true,
      title: 'Contract Resolved Successfully',
      message: `Indexer detected token:\n\nSymbol: ${detectedSymbol}\nName: ${detectedName}\nNetwork: ${detectedChain}\nAddress: ${address.substring(0, 10)}...${address.substring(address.length - 4)}\n\nWould you like to import this token into your wallet?`,
      icon: 'check-circle',
      iconColor: '#10B981',
      showConfirm: true,
      confirmText: 'Import Token',
      onConfirm: () => {
        // Import dynamically into the Zustand userStore!
        importCustomAsset(detectedChain, detectedSymbol, detectedName, detectedLogo);
        setContractInputs(prev => ({ ...prev, [chainId]: '' }));
        
        // Show success alert after a brief delay so the modal can transition
        setTimeout(() => {
          setAlertConfig({
            visible: true,
            title: 'Import Success!',
            message: `Imported ${detectedSymbol} on ${detectedChain}. The network card and asset balances have been fetched and updated successfully.`,
            icon: 'check-circle',
            iconColor: '#10B981',
            showConfirm: false,
            confirmText: 'Confirm',
            onConfirm: undefined,
          });
        }, 350);
      }
    });
  };

  return (
    <View style={styles.accordionSection}>
      <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary]}>Your Assets</Text>
      <View style={styles.accordionList}>
        {portfolioAssets.map((chain) => {
          // Compute chain balance display dynamically
          const totalVal = chain.tokens.reduce((sum: number, t: any) => {
            const parsed = parseFloat(t.value.replace(/[^0-9.]/g, '')) || 0;
            return sum + parsed;
          }, 0);
          const formattedChainTotal = `$${totalVal.toFixed(2)}`;

          return (
            <View key={chain.id} style={[styles.chainCard, !isDarkMode && styles.cardLight]}>
              {/* Chain header row */}
              <Pressable
                style={styles.chainHeader}
                onPress={() => setOpenChain(openChain === chain.id ? null : chain.id)}
              >
                <View style={styles.chainLeft}>
                  <Image source={typeof chain.logo === 'string' ? { uri: chain.logo } : chain.logo} style={styles.chainLogoImage} />
                  <Text style={[styles.chainName, !isDarkMode && styles.textLightPrimary]}>{chain.chain}</Text>
                </View>
                <View style={styles.chainRight}>
                  <View style={{ alignItems: 'flex-end', marginRight: Spacing[3] }}>
                    <Text style={[styles.chainValue, !isDarkMode && styles.textLightSecondary]}>
                      {isBalanceVisible ? formattedChainTotal : '••••'}
                    </Text>
                    <View style={[
                      styles.changeBadge,
                      {
                        backgroundColor: chain.isPositive ? '#10B9811A' : '#EF44441A',
                        borderColor: chain.isPositive ? '#10B98133' : '#EF444433',
                      }
                    ]}>
                      <Text style={[styles.changeText, { color: chain.isPositive ? '#10B981' : '#EF4444' }]}>
                        {chain.isPositive ? '▲ ' : '▼ '}{chain.change || '+0.00%'}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={openChain === chain.id ? 'chevron-up' : 'chevron-down'}
                    size={IconSize.sm}
                    color={Colors.text.muted}
                  />
                </View>
              </Pressable>

              {/* Token list */}
              {openChain === chain.id && (
                <View style={[styles.tokenList, !isDarkMode && styles.borderLightRow]}>
                  {/* Contract search at the top */}
                  <View style={[
                    styles.searchContractContainer,
                    isDarkMode ? styles.searchContractContainerDark : styles.searchContractContainerLight
                  ]}>
                    <Feather name="search" size={14} color={Colors.text.muted} style={{ marginRight: 6 }} />
                    <TextInput
                      style={[
                        styles.searchContractInput,
                        { color: isDarkMode ? '#FFFFFF' : '#111827' }
                      ]}
                      placeholder="Search or paste contract address..."
                      placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                      value={contractInputs[chain.id] || ''}
                      onChangeText={(text) => handleInputChange(chain.id, text)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => handleImportToken(chain.id)}
                    />
                    {(contractInputs[chain.id] || '').length > 0 ? (
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => handleInputChange(chain.id, '')}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Feather name="x" size={14} color={Colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.importInlineBtn}
                          onPress={() => handleImportToken(chain.id)}
                        >
                          <Text style={styles.importInlineText}>Import</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.pasteBadge}
                        onPress={() => handlePaste(chain.id)}
                        activeOpacity={0.7}
                      >
                        <Feather name="clipboard" size={10} color={Colors.brand.bright} style={{ marginRight: 3 }} />
                        <Text style={styles.pasteBadgeText}>Paste</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {chain.tokens.length === 0 ? (
                    <Text style={styles.emptyChainText}>No tokens — paste a contract address to add</Text>
                  ) : (
                    chain.tokens.map((token: any) => (
                      <TokenRow
                        key={token.symbol}
                        {...token}
                        onConvert={() => router.push('/(tabs)/convert')}
                      />
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        showConfirm={alertConfig.showConfirm}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { isDarkMode } = useUserStore();
  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <BalanceCards />
        <ActionButtons />
        <TokenAccordion />
        {/* Bottom padding for tab bar */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
  },

  // Brand Header
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    marginBottom: Spacing[1],
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
  },
  brandText: {
    fontSize: Typography.size.lg,
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
  brandRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  actionBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  cardBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  cardLogo: {
    width: 20,
    height: 20,
    borderRadius: Radius.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[5],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
  },
  avatarText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  greeting: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.regular,
  },
  userName: {
    color: Colors.text.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  fundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  fundButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },

  // Balance Cards
  balanceSection: {
    gap: Spacing[3],
    marginBottom: Spacing[5],
  },
  cryptoCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.primary.border,
    borderRadius: Radius.xl,
    padding: Spacing[5],
  },
  bankCard: {
    backgroundColor: Colors.bg.muted,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    opacity: 0.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  cardLabel: {
    color: Colors.primary.DEFAULT,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bankCardLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeBadge: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: Colors.primary.DEFAULT,
    fontSize: 10,
    fontWeight: Typography.weight.semibold,
  },
  comingSoonBadge: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  comingSoonText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: Typography.weight.medium,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  balanceAmount: {
    color: Colors.text.primary,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    letterSpacing: -0.5,
  },
  eyeButton: {
    padding: 4,
  },
  bankBalance: {
    color: Colors.text.disabled,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    marginBottom: Spacing[2],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountNumber: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    fontFamily: 'monospace',
    flex: 1,
  },
  bankAccountNumber: {
    color: Colors.text.disabled,
    fontSize: Typography.size.xs,
    fontFamily: 'monospace',
  },

  // Action buttons
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: Spacing[4],
    marginBottom: Spacing[4],
  },
  actionBtn: {
    width: '20%',
    alignItems: 'center',
    gap: Spacing[1],
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  // Token accordion
  accordionSection: {
    gap: Spacing[3],
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  accordionList: {
    gap: Spacing[2],
  },
  chainCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  chainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  chainDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  chainName: {
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  chainRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  chainValue: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    fontFamily: 'monospace',
  },
  tokenList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: Spacing[3],
  },
  tokenIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  tokenAmount: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tokenValue: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    fontFamily: 'monospace',
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 6,
  },
  tokenActionBtn: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tokenActionText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  searchContractContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  searchContractContainerDark: {
    backgroundColor: '#070712',
    borderColor: '#3A8AFF40', // Outstanding bright border in dark mode
  },
  searchContractContainerLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB', // Slate gray border in light mode
  },
  searchContractInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    padding: 0,
    height: '100%',
  },
  pasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.bright + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 0.8,
    borderColor: Colors.brand.bright + '30',
  },
  pasteBadgeText: {
    color: Colors.brand.bright,
    fontSize: 9,
    fontWeight: '800',
  },
  importInlineBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  importInlineText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  emptyChainText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  containerLight: {
    backgroundColor: '#F3F4F6',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  textLightPrimary: {
    color: '#111827',
  },
  textLightSecondary: {
    color: '#4B5563',
  },
  headerBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  borderLightRow: {
    borderTopColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
    borderTopWidth: 1,
  },
  iconBoxLight: {
    backgroundColor: '#E5E7EB',
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.bright + '15',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyBadgeText: {
    color: Colors.brand.bright,
    fontSize: 9,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardFundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardFundBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenLogoImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: Spacing[3],
    backgroundColor: 'transparent',
  },
  chainLogoImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing[2],
    backgroundColor: 'transparent',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  changeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});

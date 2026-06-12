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
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { Colors, Typography, Spacing, Radius, IconSize } from '../../constants/theme';
import { useUserStore, INITIAL_TOP20_PORTFOLIO, getLogoSource } from '../../store/userStore';
import { WalletEngine } from '../../store/walletEngine';
import ImageWithFallback from '../../components/ImageWithFallback';
import { supabase } from '../../store/supabaseClient';
const metadataMap: Record<string, { color: string; icon: string; pack: 'Feather' | 'Ionicons'; letter: string }> = {
  solana: { color: '#14F195', icon: 'sun', pack: 'Feather', letter: 'S' },
  ethereum: { color: '#627EEA', icon: 'zap', pack: 'Feather', letter: 'E' },
  smartchain: { color: '#F3BA2F', icon: 'layers', pack: 'Feather', letter: 'B' },
  bnb: { color: '#F3BA2F', icon: 'layers', pack: 'Feather', letter: 'B' },
  polygon: { color: '#8247E5', icon: 'hexagon', pack: 'Feather', letter: 'P' },
  arbitrum: { color: '#28A0F0', icon: 'activity', pack: 'Feather', letter: 'A' },
  optimism: { color: '#FF0420', icon: 'zap', pack: 'Feather', letter: 'O' },
  base: { color: '#0052FF', icon: 'link', pack: 'Feather', letter: 'Ba' },
  assetchain: { color: '#F25C22', icon: 'link', pack: 'Feather', letter: 'AC' },
  klever: { color: '#E11B4C', icon: 'key', pack: 'Feather', letter: 'Kl' },
  avalanche: { color: '#E84142', icon: 'activity', pack: 'Feather', letter: 'Av' },
  avalanchec: { color: '#E84142', icon: 'activity', pack: 'Feather', letter: 'Av' },
  fantom: { color: '#1969FF', icon: 'database', pack: 'Feather', letter: 'F' },
  ton: { color: '#0098EA', icon: 'zap', pack: 'Feather', letter: 'To' },
  theopennetwork: { color: '#0098EA', icon: 'zap', pack: 'Feather', letter: 'To' },
  bitcoin: { color: '#F7931A', icon: 'shield', pack: 'Feather', letter: 'Bi' },
  cardano: { color: '#0033AD', icon: 'disc', pack: 'Feather', letter: 'C' },
  ripple: { color: '#23292F', icon: 'anchor', pack: 'Feather', letter: 'X' },
  xrp: { color: '#23292F', icon: 'anchor', pack: 'Feather', letter: 'X' },
  sui: { color: '#6FB1E4', icon: 'droplet', pack: 'Feather', letter: 'Su' },
  aptos: { color: '#2DD4BF', icon: 'cpu', pack: 'Feather', letter: 'Ap' },
  tron: { color: '#EC0623', icon: 'triangle', pack: 'Feather', letter: 'T' },
  near: { color: '#000000', icon: 'globe', pack: 'Feather', letter: 'N' },
  polkadot: { color: '#E6007A', icon: 'disc', pack: 'Feather', letter: 'Po' },
  cronos: { color: '#002D74', icon: 'shield', pack: 'Feather', letter: 'Cr' },
  stellar: { color: '#000000', icon: 'globe', pack: 'Feather', letter: 'St' },
  cosmos: { color: '#2E3192', icon: 'globe', pack: 'Feather', letter: 'Co' },
  scroll: { color: '#E5E7EB', icon: 'layers', pack: 'Feather', letter: 'Sc' },
  zksync: { color: '#000000', icon: 'zap', pack: 'Feather', letter: 'Zk' },
  linea: { color: '#60A5FA', icon: 'link', pack: 'Feather', letter: 'Li' },
  celo: { color: '#35D07F', icon: 'disc', pack: 'Feather', letter: 'Ce' },
  blast: { color: '#FCFC03', icon: 'zap', pack: 'Feather', letter: 'Bl' },
  gnosis: { color: '#04795B', icon: 'shield', pack: 'Feather', letter: 'Gn' },
  moonbeam: { color: '#53CBC9', icon: 'disc', pack: 'Feather', letter: 'Mb' },
  mantle: { color: '#000000', icon: 'layers', pack: 'Feather', letter: 'Mt' },
  metis: { color: '#00D2FF', icon: 'database', pack: 'Feather', letter: 'Me' },
  mode: { color: '#DFFE00', icon: 'link', pack: 'Feather', letter: 'Mo' },
  taiko: { color: '#FC0B93', icon: 'zap', pack: 'Feather', letter: 'Tk' },
  sei: { color: '#9E0000', icon: 'zap', pack: 'Feather', letter: 'Se' },
  hyperliquid: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hpl: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hyperevm: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hyp: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hype: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  '1337': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  '999': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
};

const DEFAULT_LIFI_CHAINS = [
  { id: 1, name: 'Ethereum', key: 'eth', coin: 'ETH', color: '#627EEA', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { id: 1151111081099710, name: 'Solana', key: 'sol', coin: 'SOL', color: '#14F195', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
  { id: 56, name: 'BNB Chain', key: 'bsc', coin: 'BNB', color: '#F3BA2F', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' },
  { id: 8453, name: 'Base', key: 'bas', coin: 'ETH', color: '#0052FF', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' },
  { id: 42161, name: 'Arbitrum', key: 'arb', coin: 'ETH', color: '#28A0F0', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' },
  { id: 137, name: 'Polygon', key: 'pol', coin: 'POL', color: '#8247E5', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
  { id: 10, name: 'Optimism', key: 'opt', coin: 'ETH', color: '#FF0420', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' },
  { id: 43114, name: 'Avalanche', key: 'ava', coin: 'AVAX', color: '#E84142', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png' },
  { id: 250, name: 'Fantom', key: 'ftm', coin: 'FTM', color: '#1969FF', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png' },
  { id: 25, name: 'Cronos', key: 'cro', coin: 'CRO', color: '#002D74', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cronos/info/logo.png' },
  { id: 9270000000000000, name: 'Sui', key: 'sui', coin: 'SUI', color: '#6FB1E4', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png' },
  { id: 728126428, name: 'Tron', key: 'trn', coin: 'TRX', color: '#EC0623', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png' },
  { id: 20000000000001, name: 'Bitcoin', key: 'btc', coin: 'BTC', color: '#F7931A', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },
  { id: 534352, name: 'Scroll', key: 'scr', coin: 'ETH', color: '#E5E7EB', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png' },
  { id: 324, name: 'zkSync Era', key: 'era', coin: 'ETH', color: '#000000', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png' },
  { id: 59144, name: 'Linea', key: 'lin', coin: 'ETH', color: '#60A5FA', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png' },
  { id: 42220, name: 'Celo', key: 'cel', coin: 'CELO', color: '#35D07F', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png' },
  { id: 81457, name: 'Blast', key: 'bla', coin: 'ETH', color: '#FCFC03', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/blast/info/logo.png' },
  { id: 100, name: 'Gnosis', key: 'gno', coin: 'xDAI', color: '#04795B', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png' },
  { id: 1284, name: 'Moonbeam', key: 'glmr', coin: 'GLMR', color: '#53CBC9', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/moonbeam/info/logo.png' },
  { id: 5000, name: 'Mantle', key: 'mnt', coin: 'MNT', color: '#000000', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png' },
  { id: 1088, name: 'Metis', key: 'met', coin: 'METIS', color: '#00D2FF', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/metis/info/logo.png' },
  { id: 34443, name: 'Mode', key: 'mod', coin: 'ETH', color: '#DFFE00', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mode/info/logo.png' },
  { id: 167000, name: 'Taiko', key: 'tko', coin: 'ETH', color: '#FC0B93', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/taiko/info/logo.png' },
  { id: 1329, name: 'Sei', key: 'sei', coin: 'SEI', color: '#9E0000', logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sei/info/logo.png' }
];

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

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uploadedPhotoUri]);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {/* Render dynamic avatar based on onboarding profile inputs */}
        {uploadedPhotoUri && !imageError ? (
          <Image 
            source={{ uri: uploadedPhotoUri }} 
            style={styles.avatarImage as any} 
            onError={() => setImageError(true)}
          />
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
      
      {/* Scanner, Security Shield & Notifications circle buttons */}
      <View style={styles.headerRightActions}>
        <TouchableOpacity 
          style={[styles.actionBtnHeader, { backgroundColor: btnBg, borderColor: btnBorder }]} 
          onPress={() => router.push('/(tabs)/scanner')}
        >
          <Ionicons name="scan-outline" size={18} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtnHeader, { backgroundColor: btnBg, borderColor: btnBorder }]} 
          onPress={() => router.push('/(tabs)/security')}
        >
          <Feather name="shield" size={18} color={Colors.brand.bright} />
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

function BalanceCards({ onPressFund }: { onPressFund: () => void }) {
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
              source={require('../../logo/logo.png')}
              style={styles.cardLogo as any}
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
            onPress={onPressFund}
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

function ActionButtons({ openChain }: { openChain: string | null }) {
  const { isDarkMode, showNfts, showStake, showMemes, showDgames, showDsocials, showPrediction, showAi, portfolioAssets } = useUserStore();
  
  const handleAction = (id: string) => {
    const currentChain = portfolioAssets.find(c => c.id === openChain);
    const firstToken = currentChain?.tokens?.[0];

    if (id === 'send') {
      if (firstToken && openChain) {
        router.push({
          pathname: '/(tabs)/send',
          params: {
            tokenSymbol: firstToken.symbol,
            chainId: openChain
          }
        });
      } else {
        router.push('/(tabs)/send');
      }
    }
    else if (id === 'receive') router.push('/(tabs)/receive');
    else if (id === 'convert') {
      if (firstToken && openChain && currentChain) {
        router.push({
          pathname: '/(tabs)/convert',
          params: {
            fromSymbol: firstToken.symbol,
            fromName: firstToken.name,
            fromChain: currentChain.chain,
            fromChainId: openChain,
            fromPrice: firstToken.price?.toString() || '0'
          }
        });
      } else {
        router.push('/(tabs)/convert');
      }
    }
    else if (id === 'nfts') router.push('/(tabs)/nfts');
    else if (id === 'meme') router.push('/(tabs)/meme');
    else if (id === 'dsocials') router.push('/(tabs)/dsocials');
    else if (id === 'dgames') {
      router.push('/(tabs)/dgames');
    }
    else if (id === 'prediction') router.push('/(tabs)/prediction');
    else if (id === 'stake') router.push('/(tabs)/stake');
    else if (id === 'ai') router.push('/(tabs)/ai');
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
    { id: 'nfts', label: 'NFTs', icon: 'image', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showNfts },
    { id: 'meme', label: 'Memes', icon: 'zap', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showMemes },
    { id: 'dsocials', label: 'Dsocials', icon: 'message-square', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showDsocials },
    { id: 'dgames', label: 'Dgames', icon: 'play-circle', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showDgames },
    { id: 'prediction', label: 'Prediction', icon: 'bar-chart-2', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showPrediction },
    { id: 'stake', label: 'Stake', icon: 'layers', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showStake },
    { id: 'ai', label: 'AI', icon: 'cpu', color: Colors.brand.bright, bg: Colors.brand.bright + '15', visible: showAi },
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

function getChangeDetails(changeStr: string) {
  const cleanStr = changeStr.replace(/[^0-9.-]/g, '');
  const val = parseFloat(cleanStr) || 0;

  if (val > 0) {
    return {
      color: '#10B981', // green
      bg: '#10B9811A',
      border: '#10B98133',
      icon: '▲ '
    };
  } else if (val < 0) {
    return {
      color: '#EF4444', // red
      bg: '#EF44441A',
      border: '#EF444433',
      icon: '▼ '
    };
  } else {
    return {
      color: '#6B7280', // neutral grey
      bg: '#6B72801A',
      border: '#6B728033',
      icon: ''
    };
  }
}


function formatTokenPrice(price: number): string {
  if (!price || price <= 0) return '--';
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toExponential(2)}`;
}

function TokenRow({ symbol, name, amount, value, change, isPositive, logo, price, onSend, onConvert }: {
  symbol: string; name: string; amount: string; value: string; change: string; isPositive: boolean; logo: string; price?: number; onSend: () => void; onConvert: () => void;
}) {
  const { isDarkMode, isBalanceVisible } = useUserStore();
  const changeDetails = getChangeDetails(change);
  return (
    <View style={[styles.tokenRow, !isDarkMode && styles.borderLightRow]}>
      <ImageWithFallback source={getLogoSource(logo)} style={styles.tokenLogoImage} fallbackText={symbol} />
      <View style={styles.tokenInfo}>
        <Text style={[styles.tokenSymbol, !isDarkMode && styles.textLightPrimary]}>{symbol}</Text>
        <Text style={styles.tokenAmount}>{isBalanceVisible ? amount : '••••'}</Text>
      </View>
      <View style={styles.tokenRight}>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.tokenValue, !isDarkMode && styles.textLightSecondary]}>
            {isBalanceVisible ? formatTokenPrice(price ?? 0) : '••••'}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.text.muted, marginBottom: 1 }}>
            {isBalanceVisible ? value : '••••'}
          </Text>
          <View style={[
            styles.changeBadge,
            {
              backgroundColor: changeDetails.bg,
              borderColor: changeDetails.border,
            }
          ]}>
            <Text style={[styles.changeText, { color: changeDetails.color }]}>
              {changeDetails.icon}{change}
            </Text>
          </View>
        </View>
        <View style={styles.tokenActions}>
          <TouchableOpacity style={[styles.tokenActionBtn, { borderColor: Colors.brand.bright + '40' }]} onPress={onSend}>
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

function SearchResultTokenRow({
  symbol,
  name,
  amount,
  value,
  change,
  isPositive,
  logo,
  chainName,
  chainLogo,
  price,
  onSend,
  onConvert,
  onPress
}: {
  symbol: string;
  name: string;
  amount: string;
  value: string;
  change: string;
  isPositive: boolean;
  logo: string;
  chainName: string;
  chainLogo: string;
  price?: number;
  onSend: () => void;
  onConvert: () => void;
  onPress?: () => void;
}) {
  const { isDarkMode, isBalanceVisible } = useUserStore();
  const changeDetails = getChangeDetails(change);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.tokenRow, !isDarkMode && styles.borderLightRow]}
    >
      <ImageWithFallback source={getLogoSource(logo)} style={styles.tokenLogoImage} fallbackText={symbol} />
      <View style={styles.tokenInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.tokenSymbol, !isDarkMode && styles.textLightPrimary]}>{symbol}</Text>
          <View style={[
            styles.chainTagPill,
            { backgroundColor: isDarkMode ? '#1E1E2F' : '#EAECEF' }
          ]}>
            <ImageWithFallback source={getLogoSource(chainLogo)} style={styles.chainTagLogo} fallbackText={chainName} />
            <Text style={[styles.chainTagText, { color: isDarkMode ? '#A0AEC0' : '#4A5568' }]}>{chainName}</Text>
          </View>
        </View>
        <Text style={styles.tokenAmount}>{isBalanceVisible ? amount : '••••'}</Text>
      </View>
      <View style={styles.tokenRight}>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.tokenValue, !isDarkMode && styles.textLightSecondary]}>
            {isBalanceVisible ? formatTokenPrice(price ?? 0) : '••••'}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.text.muted, marginBottom: 1 }}>
            {isBalanceVisible ? value : '••••'}
          </Text>
          <View style={[
            styles.changeBadge,
            {
              backgroundColor: changeDetails.bg,
              borderColor: changeDetails.border,
            }
          ]}>
            <Text style={[styles.changeText, { color: changeDetails.color }]}>
              {changeDetails.icon}{change}
            </Text>
          </View>
        </View>
        <View style={styles.tokenActions}>
          <TouchableOpacity style={[styles.tokenActionBtn, { borderColor: Colors.brand.bright + '40' }]} onPress={onSend}>
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
    </TouchableOpacity>
  );
}

function TokenAccordion({ openChain, setOpenChain }: { openChain: string | null; setOpenChain: (id: string | null) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, isBalanceVisible, portfolioAssets, importCustomAsset, hiddenTokenAddresses } = useUserStore();
  const [contractInputs, setContractInputs] = useState<Record<string, string>>({});
  const [platformChains, setPlatformChains] = useState<any[]>(DEFAULT_LIFI_CHAINS);

  useEffect(() => {
    fetch('https://li.quest/v1/chains?chainTypes=EVM,SVM,UTXO,TVM,MVM')
      .then(res => res.json())
      .then(data => {
        if (data && data.chains) {
          const mapped = data.chains.map((c: any) => {
            const keyLower = c.key.toLowerCase();
            const meta = metadataMap[keyLower] || metadataMap[c.name.toLowerCase()] || { color: '#3A8AFF', letter: c.name.substring(0, 2) };
            return {
              id: c.id,
              name: c.name,
              key: c.key,
              coin: c.coin,
              color: meta.color,
              logoURI: c.logoURI
            };
          });
          setPlatformChains(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const sortedAssets = useMemo(() => {
    const defaultRanks: Record<string, number> = {
      solana: 0,
      ethereum: 1,
      smartchain: 2,
      base: 3,
      arbitrum: 4,
      theopennetwork: 5,
      sui: 6,
      cardano: 7,
      avalanchec: 8,
      tron: 9,
      polygon: 10,
      polkadot: 11,
      optimism: 12,
      cronos: 13,
      fantom: 14,
      near: 15,
      aptos: 16,
      xrp: 17,
      stellar: 18,
      cosmos: 19,
      bitcoin: 999,
    };

    const getChainValue = (chain: any) => {
      if (chain.totalValue !== undefined) return chain.totalValue;
      return chain.tokens.reduce((sum: number, t: any) => {
        const parsed = parseFloat(t.value.replace(/[^0-9.]/g, '')) || 0;
        return sum + parsed;
      }, 0);
    };

    const filteredAssets = portfolioAssets.map(chain => ({
      ...chain,
      tokens: chain.tokens.filter((t: any) => {
        const key = (t.address || t.symbol).toLowerCase();
        return !hiddenTokenAddresses.includes(key);
      })
    }));

    const assetsCopy = [...filteredAssets];
    assetsCopy.sort((a, b) => {
      const valA = getChainValue(a);
      const valB = getChainValue(b);

      if (valA > 0 && valB > 0) {
        return valB - valA;
      }
      if (valA > 0) return -1;
      if (valB > 0) return 1;

      const rankA = defaultRanks[a.id] ?? 99;
      const rankB = defaultRanks[b.id] ?? 99;
      return rankA - rankB;
    });

    return assetsCopy;
  }, [portfolioAssets, hiddenTokenAddresses]);
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

  const handleImportToken = async (chainId: string) => {
    const address = contractInputs[chainId] || '';
    if (address.trim().length === 0) return;
    
    setAlertConfig({
      visible: true,
      title: 'Resolving Contract...',
      message: `Connecting to LI.FI indexers to resolve token metadata for contract:\n\n${address}`,
      icon: 'clock',
      iconColor: Colors.brand.bright,
      showConfirm: false,
      confirmText: 'Confirm',
      onConfirm: undefined,
    });

    try {
      const chainMapping: Record<string, string> = {
        solana: 'sol',
        ethereum: '1',
        smartchain: '56',
        base: '8453',
        arbitrum: '42161',
        polygon: '137',
        optimism: '10',
        avalanchec: '43114',
        fantom: '250',
        cronos: '25',
        sui: 'sui',
        tron: 'trn',
        bitcoin: 'btc'
      };

      const lifiChainId = chainMapping[chainId] || chainId;
      const url = `https://li.quest/v1/token?chain=${lifiChainId}&token=${address.trim()}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        const detectedSymbol = data.symbol || 'USDC';
        const detectedName = data.name || 'USD Coin';
        const detectedLogo = data.logoURI || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
        const detectedPrice = parseFloat(data.priceUSD) || 0.0;
        const detectedDecimals = data.decimals || 18;

        const chainName = portfolioAssets.find(c => c.id === chainId)?.chain || chainId;

        setAlertConfig({
          visible: true,
          title: 'Contract Resolved Successfully',
          message: `Indexer detected token:\n\nSymbol: ${detectedSymbol}\nName: ${detectedName}\nNetwork: ${chainName}\nDecimals: ${detectedDecimals}\nPrice: $${detectedPrice.toFixed(2)} USD\nAddress: ${address.substring(0, 10)}...${address.substring(address.length - 4)}\n\nWould you like to import this token into your wallet?`,
          icon: 'check-circle',
          iconColor: '#10B981',
          showConfirm: true,
          confirmText: 'Import Token',
          onConfirm: () => {
            importCustomAsset(chainName, detectedSymbol, detectedName, detectedLogo, address.trim(), detectedDecimals, detectedPrice);
            setContractInputs(prev => ({ ...prev, [chainId]: '' }));
            
            setTimeout(() => {
              setAlertConfig({
                visible: true,
                title: 'Import Success!',
                message: `Imported ${detectedSymbol} on ${chainName}. The network card and asset balances have been fetched and updated successfully.`,
                icon: 'check-circle',
                iconColor: '#10B981',
                showConfirm: false,
                confirmText: 'Confirm',
                onConfirm: undefined,
              });
            }, 350);
          }
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Resolution Failed',
          message: `LI.FI failed to resolve any token for address:\n${address}\non selected network. Please verify the contract address and try again.`,
          icon: 'alert-triangle',
          iconColor: Colors.error,
          showConfirm: false,
          confirmText: 'Confirm',
          onConfirm: undefined,
        });
      }
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: 'Network Error',
        message: 'Could not connect to LI.FI token metadata API. Please check your internet connection.',
        icon: 'alert-triangle',
        iconColor: Colors.error,
        showConfirm: false,
        confirmText: 'Confirm',
        onConfirm: undefined,
      });
    }
  };

  // Filter tokens based on search query
  const filteredTokens: any[] = [];
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    // 1. Search existing portfolio assets
    for (const chain of portfolioAssets) {
      const chainMatches = chain.chain.toLowerCase().includes(q);
      for (const token of chain.tokens) {
        const symbolMatches = token.symbol.toLowerCase().includes(q);
        const nameMatches = token.name.toLowerCase().includes(q);
        if (chainMatches || symbolMatches || nameMatches) {
          filteredTokens.push({
            ...token,
            chainName: chain.chain,
            chainLogo: chain.logo,
            chainId: chain.id
          });
        }
      }
    }

    // 2. Search platform-supported chains from LI.FI
    for (const chain of platformChains) {
      const chainMatches = chain.name.toLowerCase().includes(q);
      const symbolMatches = chain.coin.toLowerCase().includes(q);
      const keyMatches = chain.key.toLowerCase().includes(q);
      if (chainMatches || symbolMatches || keyMatches) {
        const CHAIN_ID_TO_EVM_ID: Record<string, number> = {
          ethereum: 1,
          smartchain: 56,
          base: 8453,
          arbitrum: 42161,
          polygon: 137,
          optimism: 10,
          avalanchec: 43114,
          fantom: 250,
          cronos: 25,
          scroll: 534352,
          zksync: 324,
          linea: 59144,
          celo: 42220,
          blast: 81457,
          gnosis: 100,
          moonbeam: 1284,
          mantle: 5000,
          metis: 1088,
          mode: 34443,
          taiko: 167000,
          sei: 1329,
        };

        const chainKey = chain.name.toLowerCase().replace(/\s+/g, '');
        const alreadyInPortfolio = portfolioAssets.some(p => {
          const evmId = CHAIN_ID_TO_EVM_ID[p.id];
          const matchesName = p.chain.toLowerCase() === chain.name.toLowerCase();
          const matchesId = p.id.toLowerCase() === chainKey;
          return p.id === chain.key || p.id === chain.id.toString() || (evmId !== undefined && evmId === chain.id) || matchesName || matchesId;
        });

        if (!alreadyInPortfolio) {
          const chainIdStr = chainKey;
          const alreadyAdded = filteredTokens.some(t => t.chainId === chainIdStr && t.symbol === chain.coin);
          if (!alreadyAdded) {
            filteredTokens.push({
              symbol: chain.coin,
              name: `${chain.name} Native Token`,
              amount: `0.00 ${chain.coin}`,
              value: '$0.00',
              change: '+0.00%',
              isPositive: true,
              logo: chain.logoURI,
              chainName: chain.name,
              chainLogo: chain.logoURI,
              chainId: chainIdStr,
              isVirtual: true,
              decimals: 18,
              price: 0
            });
          }
        }
      }
    }
  }

  return (
    <View style={styles.accordionSection}>
      <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary]}>Your Assets</Text>

      {/* Sleek asset search bar */}
      <View style={[
        styles.searchAssetsContainer,
        isDarkMode ? styles.searchAssetsContainerDark : styles.searchAssetsContainerLight
      ]}>
        <Feather name="search" size={16} color={Colors.text.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={[
            styles.searchAssetsInput,
            { color: isDarkMode ? '#FFFFFF' : '#111827' }
          ]}
          placeholder="Search tokens or networks..."
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={16} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.accordionList}>
        {searchQuery.trim().length > 0 ? (
          filteredTokens.length === 0 ? (
            <View style={{ paddingVertical: Spacing[6], alignItems: 'center' }}>
              <Feather name="search" size={24} color={Colors.text.muted} style={{ marginBottom: Spacing[2] }} />
              <Text style={{ color: Colors.text.muted, fontSize: Typography.size.sm }}>No assets found matching "{searchQuery}"</Text>
            </View>
          ) : (
            <View style={[styles.chainCard, !isDarkMode && styles.cardLight]}>
              <View style={styles.tokenList}>
                {filteredTokens.map((token: any) => (
                  <SearchResultTokenRow
                    key={`${token.chainId}-${token.symbol}`}
                    {...token}
                    onSend={() => {
                      if (token.isVirtual) {
                        importCustomAsset(token.chainName, token.symbol, token.name, token.logo, token.address || '', token.decimals || 18, token.price || 0, token.chainLogo);
                      }
                      router.push({
                        pathname: '/(tabs)/send',
                        params: {
                          tokenSymbol: token.symbol,
                          chainId: token.chainId
                        }
                      });
                    }}
                    onConvert={() => {
                      if (token.isVirtual) {
                        importCustomAsset(token.chainName, token.symbol, token.name, token.logo, token.address || '', token.decimals || 18, token.price || 0, token.chainLogo);
                      }
                      router.push({
                        pathname: '/(tabs)/convert',
                        params: {
                          fromSymbol: token.symbol,
                          fromName: token.name,
                          fromChain: token.chainName,
                          fromChainId: token.chainId,
                          fromPrice: token.price?.toString() || '0'
                        }
                      });
                    }}
                    onPress={() => {
                      if (token.isVirtual) {
                        importCustomAsset(token.chainName, token.symbol, token.name, token.logo, token.address || '', token.decimals || 18, token.price || 0, token.chainLogo);
                        setSearchQuery('');
                        setOpenChain(token.chainId);
                        setAlertConfig({
                          visible: true,
                          title: 'Network Added',
                          message: `${token.chainName} has been successfully added to your asset list on the dashboard.`,
                          icon: 'check-circle',
                          iconColor: '#10B981',
                          showConfirm: false,
                          confirmText: 'Confirm',
                          onConfirm: undefined,
                        });
                      } else {
                        setSearchQuery('');
                        setOpenChain(token.chainId);
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          )
        ) : (
          sortedAssets.map((chain) => {
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
                    <ImageWithFallback source={getLogoSource(chain.logo)} style={styles.chainLogoImage} fallbackText={chain.chain} />
                    <Text style={[styles.chainName, !isDarkMode && styles.textLightPrimary]}>{chain.chain}</Text>
                  </View>
                  <View style={styles.chainRight}>
                    <View style={{ alignItems: 'flex-end', marginRight: Spacing[3] }}>
                      <Text style={[styles.chainValue, !isDarkMode && styles.textLightSecondary]}>
                        {isBalanceVisible ? formattedChainTotal : '••••'}
                      </Text>
                      {(() => {
                        const chainChangeDetails = getChangeDetails(chain.change || '+0.00%');
                        return (
                          <View style={[
                            styles.changeBadge,
                            {
                              backgroundColor: chainChangeDetails.bg,
                              borderColor: chainChangeDetails.border,
                            }
                          ]}>
                            <Text style={[styles.changeText, { color: chainChangeDetails.color }]}>
                              {chainChangeDetails.icon}{chain.change || '+0.00%'}
                            </Text>
                          </View>
                        );
                      })()}
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
                          onSend={() => router.push({
                            pathname: '/(tabs)/send',
                            params: {
                              tokenSymbol: token.symbol,
                              chainId: chain.id
                            }
                          })}
                          onConvert={() => router.push({
                            pathname: '/(tabs)/convert',
                            params: {
                              fromSymbol: token.symbol,
                              fromName: token.name,
                              fromChain: chain.chain,
                              fromChainId: chain.id,
                              fromPrice: token.price?.toString() || '0'
                            }
                          })}
                        />
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
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
  const { isDarkMode, transactionPin } = useUserStore();
  const [openChain, setOpenChain] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [showFundModal, setShowFundModal] = useState(false);
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

  useEffect(() => {
    const decryptWallet = async () => {
      if (transactionPin) {
        const dec = await WalletEngine.decryptAndLoadWallet(transactionPin);
        setWallet(dec);
      }
    };
    decryptWallet();
  }, [transactionPin]);



  useEffect(() => {
    // Sync profile registry from Supabase on mount/launch to ensure persistent avatar URL and details
    const syncProfileFromRegistry = async () => {
      const cleanNum = useUserStore.getState().accountNumber;
      if (!cleanNum) return;
      try {
        const { data } = await supabase
          .from('registries')
          .select('name, avatar_url, backup_email')
          .eq('account_number', cleanNum.replace(/^\+\d+/, '').replace(/\s+/g, ''))
          .maybeSingle();
        if (data) {
          const store = useUserStore.getState();
          if (data.name) store.setName(data.name);
          if (data.avatar_url) store.setUploadedPhotoUri(data.avatar_url);
          if (data.backup_email) store.setBackupEmail(data.backup_email);
        }
      } catch (e) {
        console.warn('Failed to sync profile from registries on mount:', e);
      }
    };
    syncProfileFromRegistry();

    // Auto-migrate: If the user's cached AsyncStorage has fewer than 15 chains, or is missing Bitcoin, or has outdated chain names, or is missing assetchain/klever/CNGN, update to INITIAL_TOP20_PORTFOLIO
    const { portfolioAssets } = useUserStore.getState();
    const hasBitcoin = portfolioAssets.some(a => a.id === 'bitcoin');
    const hasBnbSmartChain = portfolioAssets.some(a => a.id === 'smartchain' && a.chain === 'BNB Smart Chain');
    const hasTheOpenNetwork = portfolioAssets.some(a => a.id === 'theopennetwork' && a.chain === 'The Open Network');
    const hasAssetChain = portfolioAssets.some(a => a.id === 'assetchain');
    const hasKlever = portfolioAssets.some(a => a.id === 'klever');
    const hasCngn = portfolioAssets.some(a => a.tokens.some((t: any) => t.symbol === 'CNGN'));

    if (portfolioAssets.length < 15 || !hasBitcoin || !hasBnbSmartChain || !hasTheOpenNetwork || !hasAssetChain || !hasKlever || !hasCngn) {
      useUserStore.setState({ portfolioAssets: INITIAL_TOP20_PORTFOLIO });
    }
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const loadLiveBalances = async () => {
    try {
      const existingPortfolio = useUserStore.getState().portfolioAssets;
      let updatedAssets;

      if (wallet) {
        updatedAssets = await WalletEngine.fetchPortfolioBalances(
          wallet.solanaAddress,
          wallet.evmAddress,
          existingPortfolio,
          wallet.kleverAddress
        );
      } else {
        const tempWallet = transactionPin ? await WalletEngine.decryptAndLoadWallet(transactionPin) : null;
        if (tempWallet) {
          setWallet(tempWallet);
          updatedAssets = await WalletEngine.fetchPortfolioBalances(
            tempWallet.solanaAddress,
            tempWallet.evmAddress,
            existingPortfolio,
            tempWallet.kleverAddress
          );
        } else {
          updatedAssets = await WalletEngine.fetchPricesOnly(existingPortfolio);
        }
      }

      useUserStore.setState({ portfolioAssets: updatedAssets });
    } catch (e) {
      console.warn('Failed to load active mainnet balances/prices:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveBalances();
    setRefreshing(false);
  };

  useEffect(() => {
    let active = true;

    const runLoad = async () => {
      await loadLiveBalances();
    };

    runLoad();
    const interval = setInterval(async () => {
      if (active) {
        await loadLiveBalances();
      }
    }, 30000); // refresh every 30s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [transactionPin, wallet]);

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#3A8AFF' : '#1F2937'}
            colors={['#3A8AFF']}
          />
        }
      >
        <Header />
        <BalanceCards onPressFund={() => setShowFundModal(true)} />
        <ActionButtons openChain={openChain} />
        <TokenAccordion openChain={openChain} setOpenChain={setOpenChain} />
        {/* Bottom padding for tab bar */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Fund Modal */}
      <Modal
        visible={showFundModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFundModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFundModal(false)}
        >
          <View style={[styles.fundModalContent, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF' }]}>
            {/* Handle bar for drag-to-dismiss look */}
            <View style={[styles.modalHandle, { backgroundColor: isDarkMode ? '#3A8AFF40' : '#E5E7EB' }]} />
            
            <View style={styles.fundModalHeader}>
              <Text style={[styles.fundModalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                Fund Wallet
              </Text>
              <TouchableOpacity
                onPress={() => setShowFundModal(false)}
                style={[styles.fundModalCloseBtn, { backgroundColor: isDarkMode ? '#1E1E2F' : '#F3F4F6' }]}
              >
                <Feather name="x" size={16} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fundModalSubtitle}>
              Choose how you want to add funds to your Num Wallet account.
            </Text>

            <View style={styles.fundOptionsContainer}>
              {/* Option 1: Deposit from External Wallet */}
              <TouchableOpacity
                style={[
                  styles.fundOptionCard,
                  { 
                    backgroundColor: isDarkMode ? '#131326' : '#F9FAFB',
                    borderColor: isDarkMode ? '#3A8AFF30' : '#E5E7EB'
                  }
                ]}
                onPress={() => {
                  setShowFundModal(false);
                  router.push('/(tabs)/receive');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.fundOptionIconBox, { backgroundColor: '#3A8AFF20' }]}>
                  <Feather name="arrow-down-left" size={20} color={Colors.brand.bright} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.fundOptionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                    Deposit Crypto
                  </Text>
                  <Text style={styles.fundOptionDesc}>
                    Receive from an external wallet or exchange using your public address.
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.text.muted} />
              </TouchableOpacity>

              {/* Option 2: P2P Funding */}
              <TouchableOpacity
                style={[
                  styles.fundOptionCard,
                  { 
                    backgroundColor: isDarkMode ? '#131326' : '#F9FAFB',
                    borderColor: isDarkMode ? '#3A8AFF15' : '#E5E7EB',
                    opacity: 0.5
                  }
                ]}
                onPress={() => {
                  setShowFundModal(false);
                  setAlertConfig({
                    visible: true,
                    title: 'Coming Soon',
                    message: 'Internal P2P merchant matching and fiat gateways are currently in private beta and will unlock in the next release.',
                    icon: 'clock',
                    iconColor: Colors.brand.bright,
                    showConfirm: false,
                    confirmText: 'Confirm',
                    onConfirm: undefined,
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.fundOptionIconBox, { backgroundColor: '#6B728015' }]}>
                  <Feather name="users" size={20} color="#6B7280" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.fundOptionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                      P2P Funding
                    </Text>
                    <View style={styles.comingSoonPill}>
                      <Text style={styles.comingSoonPillText}>Coming Soon</Text>
                    </View>
                  </View>
                  <Text style={styles.fundOptionDesc}>
                    Buy crypto with NGN bank transfer directly from local merchants.
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#6B7280" style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

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
  searchAssetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
  },
  searchAssetsContainerDark: {
    backgroundColor: '#0F0F1E',
    borderColor: '#C4D4E815',
  },
  searchAssetsContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  searchAssetsInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
    height: '100%',
  },
  chainTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  chainTagLogo: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chainTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  fundModalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  fundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  fundModalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  fundModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundModalSubtitle: {
    fontSize: Typography.size.xs,
    color: '#94A3B8',
    marginBottom: Spacing[5],
  },
  fundOptionsContainer: {
    gap: Spacing[3],
  },
  fundOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  fundOptionDisabled: {
    borderColor: '#C4D4E808',
  },
  fundOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundOptionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  fundOptionDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 14,
  },
  comingSoonPill: {
    backgroundColor: Colors.brand.bright + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.brand.bright + '30',
  },
  comingSoonPillText: {
    color: Colors.brand.bright,
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

});

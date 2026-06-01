import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

// High-fidelity multi-chain tokens list with real logos
const UNIFIED_TOKENS = [
  // Solana
  { symbol: 'SOL', name: 'Solana', balance: '0.00', price: 175.50, color: '#14F195', icon: 'sun' as const, chain: 'Solana', chainId: 'solana', networkLetter: 'S', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00', price: 1.00, color: '#2775CA', icon: 'dollar-sign' as const, chain: 'Solana', chainId: 'solana', networkLetter: 'S', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
  { symbol: 'USDT', name: 'Tether USD', balance: '0.00', price: 1.00, color: '#26A17B', icon: 'dollar-sign' as const, chain: 'Solana', chainId: 'solana', networkLetter: 'S', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
  { symbol: 'JUP', name: 'Jupiter Token', balance: '0.00', price: 1.12, color: '#F3BA2F', icon: 'zap' as const, chain: 'Solana', chainId: 'solana', networkLetter: 'S', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/27G8ZQRH21GfDatQ21BFSjDLusFdJwTSKmHnXY3NVN58/logo.png' },

  // Ethereum
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', price: 3450.00, color: '#627EEA', icon: 'zap' as const, chain: 'Ethereum', chainId: 'ethereum', networkLetter: 'E', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00', price: 1.00, color: '#2775CA', icon: 'dollar-sign' as const, chain: 'Ethereum', chainId: 'ethereum', networkLetter: 'E', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
  { symbol: 'USDT', name: 'Tether USD', balance: '0.00', price: 1.00, color: '#26A17B', icon: 'dollar-sign' as const, chain: 'Ethereum', chainId: 'ethereum', networkLetter: 'E', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.00', price: 68500.00, color: '#F7931A', icon: 'link' as const, chain: 'Ethereum', chainId: 'ethereum', networkLetter: 'E', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png' },

  // BNB Chain
  { symbol: 'BNB', name: 'BNB Coin', balance: '0.00', price: 580.00, color: '#F3BA2F', icon: 'layers' as const, chain: 'BNB Chain', chainId: 'bsc', networkLetter: 'B', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' },
  { symbol: 'USDT', name: 'Tether USD', balance: '0.00', price: 1.00, color: '#26A17B', icon: 'dollar-sign' as const, chain: 'BNB Chain', chainId: 'bsc', networkLetter: 'B', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },

  // Polygon
  { symbol: 'POL', name: 'Polygon', balance: '0.00', price: 0.65, color: '#8247E5', icon: 'hexagon' as const, chain: 'Polygon', chainId: 'polygon', networkLetter: 'P', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
  { symbol: 'USDT', name: 'Tether USD', balance: '0.00', price: 1.00, color: '#26A17B', icon: 'dollar-sign' as const, chain: 'Polygon', chainId: 'polygon', networkLetter: 'P', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },

  // Arbitrum
  { symbol: 'ARB', name: 'Arbitrum', balance: '0.00', price: 0.95, color: '#28A0F0', icon: 'activity' as const, chain: 'Arbitrum', chainId: 'arbitrum', networkLetter: 'A', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', price: 3450.00, color: '#627EEA', icon: 'zap' as const, chain: 'Arbitrum', chainId: 'arbitrum', networkLetter: 'A', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },

  // Optimism
  { symbol: 'OP', name: 'Optimism', balance: '0.00', price: 1.82, color: '#FF0420', icon: 'zap' as const, chain: 'Optimism', chainId: 'optimism', networkLetter: 'O', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', price: 3450.00, color: '#627EEA', icon: 'zap' as const, chain: 'Optimism', chainId: 'optimism', networkLetter: 'O', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },

  // Base
  { symbol: 'AERO', name: 'Aerodrome', balance: '0.00', price: 1.25, color: '#0052FF', icon: 'link' as const, chain: 'Base', chainId: 'base', networkLetter: 'Ba', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x940181a94A35A4569E4529A3CDfB74e38FD98631/logo.png' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', price: 3450.00, color: '#627EEA', icon: 'zap' as const, chain: 'Base', chainId: 'base', networkLetter: 'Ba', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },

  // Avalanche
  { symbol: 'AVAX', name: 'Avalanche', balance: '0.00', price: 32.40, color: '#E84142', icon: 'activity' as const, chain: 'Avalanche', chainId: 'avalanche', networkLetter: 'Av', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png' },
  { symbol: 'JOE', name: 'Trader Joe', balance: '0.00', price: 0.42, color: '#F3BA2F', icon: 'zap' as const, chain: 'Avalanche', chainId: 'avalanche', networkLetter: 'Av', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanche/assets/0x6e84a6216eA6dACC71eA8C687327911178a46b9C/logo.png' },

  // Fantom
  { symbol: 'FTM', name: 'Fantom', balance: '0.00', price: 0.72, color: '#1969FF', icon: 'database' as const, chain: 'Fantom', chainId: 'fantom', networkLetter: 'F', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png' },

  // TON
  { symbol: 'TON', name: 'Toncoin', balance: '0.00', price: 6.50, color: '#0098EA', icon: 'zap' as const, chain: 'TON', chainId: 'ton', networkLetter: 'To', logo: require('../../assets/ton.png') },

  // Bitcoin
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.00', price: 68500.00, color: '#F7931A', icon: 'shield' as const, chain: 'Bitcoin', chainId: 'bitcoin', networkLetter: 'Bi', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },

  // Cardano
  { symbol: 'ADA', name: 'Cardano', balance: '0.00', price: 0.45, color: '#0033AD', icon: 'disc' as const, chain: 'Cardano', chainId: 'cardano', networkLetter: 'C', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png' },

  // Ripple
  { symbol: 'XRP', name: 'Ripple', balance: '0.00', price: 0.52, color: '#23292F', icon: 'anchor' as const, chain: 'Ripple', chainId: 'xrp', networkLetter: 'X', logo: require('../../assets/xrp.png') },

  // Sui
  { symbol: 'SUI', name: 'Sui Coin', balance: '0.00', price: 1.05, color: '#6FB1E4', icon: 'droplet' as const, chain: 'Sui', chainId: 'sui', networkLetter: 'Su', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png' },

  // Aptos
  { symbol: 'APT', name: 'Aptos Coin', balance: '0.00', price: 8.20, color: '#2DD4BF', icon: 'cpu' as const, chain: 'Aptos', chainId: 'aptos', networkLetter: 'Ap', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png' },

  // Tron
  { symbol: 'TRX', name: 'Tron Token', balance: '0.00', price: 0.12, color: '#EC0623', icon: 'triangle' as const, chain: 'Tron', chainId: 'tron', networkLetter: 'T', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png' },

  // Near
  { symbol: 'NEAR', name: 'Near Protocol', balance: '0.00', price: 5.60, color: '#000000', icon: 'globe' as const, chain: 'Near', chainId: 'near', networkLetter: 'N', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png' }
];

type TokenType = typeof UNIFIED_TOKENS[0];

// Network listing for circular filtering grid - 16 networks with official TrustWallet logos!
const SUPPORTED_NETWORKS = [
  { id: null, name: 'All', color: Colors.brand.bright, icon: 'apps-sharp' as const, pack: 'Ionicons' as const, letter: '*', logo: null },
  { id: 'solana', name: 'Solana', color: '#14F195', icon: 'sun' as const, pack: 'Feather' as const, letter: 'S', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA', icon: 'zap' as const, pack: 'Feather' as const, letter: 'E', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { id: 'bsc', name: 'BNB Chain', color: '#F3BA2F', icon: 'layers' as const, pack: 'Feather' as const, letter: 'B', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5', icon: 'hexagon' as const, pack: 'Feather' as const, letter: 'P', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0', icon: 'activity' as const, pack: 'Feather' as const, letter: 'A', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420', icon: 'zap' as const, pack: 'Feather' as const, letter: 'O', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' },
  { id: 'base', name: 'Base', color: '#0052FF', icon: 'link' as const, pack: 'Feather' as const, letter: 'Ba', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142', icon: 'activity' as const, pack: 'Feather' as const, letter: 'Av', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png' },
  { id: 'fantom', name: 'Fantom', color: '#1969FF', icon: 'database' as const, pack: 'Feather' as const, letter: 'F', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png' },
  { id: 'ton', name: 'TON', color: '#0098EA', icon: 'zap' as const, pack: 'Feather' as const, letter: 'To', logo: require('../../assets/ton.png') },
  { id: 'bitcoin', name: 'Bitcoin', color: '#F7931A', icon: 'shield' as const, pack: 'Feather' as const, letter: 'Bi', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },
  { id: 'cardano', name: 'Cardano', color: '#0033AD', icon: 'disc' as const, pack: 'Feather' as const, letter: 'C', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png' },
  { id: 'xrp', name: 'Ripple', color: '#23292F', icon: 'anchor' as const, pack: 'Feather' as const, letter: 'X', logo: require('../../assets/xrp.png') },
  { id: 'sui', name: 'Sui', color: '#6FB1E4', icon: 'droplet' as const, pack: 'Feather' as const, letter: 'Su', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png' },
  { id: 'aptos', name: 'Aptos', color: '#2DD4BF', icon: 'cpu' as const, pack: 'Feather' as const, letter: 'Ap', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png' },
  { id: 'tron', name: 'Tron', color: '#EC0623', icon: 'triangle' as const, pack: 'Feather' as const, letter: 'T', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png' },
  { id: 'near', name: 'Near', color: '#000000', icon: 'globe' as const, pack: 'Feather' as const, letter: 'N', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png' }
];

export default function ConvertScreen() {
  const { isDarkMode } = useUserStore();
  const [payAmount, setPayAmount] = useState('');

  const params = useLocalSearchParams<{
    fromSymbol?: string;
    fromName?: string;
    fromChain?: string;
    fromChainId?: string;
    fromPrice?: string;
    toSymbol?: string;
    toName?: string;
    toChain?: string;
    toChainId?: string;
    toPrice?: string;
  }>();

  // Source & Destination Selections - EMPTY BY DEFAULT
  const [payToken, setPayToken] = useState<TokenType | null>(null);
  const [receiveToken, setReceiveToken] = useState<TokenType | null>(null);

  useEffect(() => {
    if (params.fromSymbol && params.fromChain) {
      const found = UNIFIED_TOKENS.find(
        t => t.symbol === params.fromSymbol && t.chain === params.fromChain
      );
      if (found) {
        setPayToken(found);
      } else {
        const customFrom: TokenType = {
          symbol: params.fromSymbol,
          name: params.fromName || params.fromSymbol,
          balance: '0.00',
          price: parseFloat(params.fromPrice || '0'),
          color: '#3A8AFF',
          icon: 'zap' as const,
          chain: params.fromChain,
          chainId: params.fromChainId || 'solana',
          networkLetter: (params.fromChain.charAt(0) || 'S') as any,
          logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
        };
        setPayToken(customFrom);
      }
    }
    
    if (params.toSymbol && params.toChain) {
      const found = UNIFIED_TOKENS.find(
        t => t.symbol === params.toSymbol && t.chain === params.toChain
      );
      if (found) {
        setReceiveToken(found);
      } else {
        const customTo: TokenType = {
          symbol: params.toSymbol,
          name: params.toName || params.toSymbol,
          balance: '0.00',
          price: parseFloat(params.toPrice || '0'),
          color: '#EC4899',
          icon: 'zap' as const,
          chain: params.toChain,
          chainId: params.toChainId || 'solana',
          networkLetter: (params.toChain.charAt(0) || 'S') as any,
          logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
        };
        setReceiveToken(customTo);
      }
    }
  }, [
    params.fromSymbol,
    params.fromName,
    params.fromChain,
    params.fromChainId,
    params.fromPrice,
    params.toSymbol,
    params.toName,
    params.toChain,
    params.toChainId,
    params.toPrice
  ]);

  // Search Modal state
  const [activePickerSide, setActivePickerSide] = useState<'pay' | 'receive' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string | null>(null);

  // Bidirectional Swap Button Action
  const handleSwapDirections = () => {
    if (!payToken || !receiveToken) return;
    const temp = payToken;
    setPayToken(receiveToken);
    setReceiveToken(temp);
    setPayAmount('');
  };

  // Determine transaction type dynamically based on token selection (Swap, Bridge, Cross-Chain Swap)
  const operationType = useMemo(() => {
    if (!payToken || !receiveToken) return 'Swap & Bridge';
    if (payToken.chainId === receiveToken.chainId) return 'Swap';
    if (payToken.symbol === receiveToken.symbol) return 'Bridge';
    return 'Cross-Chain Swap';
  }, [payToken, receiveToken]);

  // Handle balance preset clicks
  const handlePresetSelect = (percent: number) => {
    if (!payToken) return;
    const bal = parseFloat(payToken.balance);
    if (isNaN(bal) || bal <= 0) return;
    const calculated = (bal * percent).toFixed(5);
    setPayAmount(parseFloat(calculated).toString());
  };

  const handleMaxSelect = () => {
    if (!payToken) return;
    setPayAmount(payToken.balance);
  };

  // Calculate Exchange Rates & Output amount dynamically
  const exchangeRate = useMemo(() => {
    if (!payToken || !receiveToken) return 0;
    return payToken.price / receiveToken.price;
  }, [payToken, receiveToken]);

  const calculatedReceive = useMemo(() => {
    if (!payAmount || !exchangeRate) return '0.00';
    return (parseFloat(payAmount) * exchangeRate).toFixed(4);
  }, [payAmount, exchangeRate]);

  // Derive the action button label & icon from the current operationType
  const buttonLabel = useMemo(() => {
    if (!payToken || !receiveToken) return 'Select Assets';
    if (operationType === 'Swap') return 'Swap';
    if (operationType === 'Bridge') return 'Bridge';
    return 'Cross-Chain Swap';
  }, [operationType, payToken, receiveToken]);

  const buttonIcon = useMemo(() => {
    if (operationType === 'Swap') return 'refresh-cw' as const;
    if (operationType === 'Bridge') return 'git-merge' as const;
    return 'repeat' as const;
  }, [operationType]);

  // Modal filters
  const networkFilteredTokens = useMemo(() => {
    if (selectedNetworkFilter === null) return UNIFIED_TOKENS;
    return UNIFIED_TOKENS.filter(t => t.chainId === selectedNetworkFilter);
  }, [selectedNetworkFilter]);

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return networkFilteredTokens;
    return networkFilteredTokens.filter(
      t =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.chain.toLowerCase().includes(query)
    );
  }, [searchQuery, networkFilteredTokens]);

  const holdingsList = useMemo(() => {
    return filteredTokens.filter(t => parseFloat(t.balance) > 0);
  }, [filteredTokens]);

  const allAssetsList = useMemo(() => {
    return filteredTokens;
  }, [filteredTokens]);

  const handleSelectToken = (token: TokenType) => {
    if (activePickerSide === 'pay') {
      setPayToken(token);
      setPayAmount('');
    } else {
      setReceiveToken(token);
    }
    setActivePickerSide(null);
    setSearchQuery('');
    setSelectedNetworkFilter(null);
  };

  const handleConvert = () => {
    if (!payToken || !receiveToken) {
      Alert.alert('Selection Required', 'Please select both From and To assets before executing transaction.');
      return;
    }
    if (!payAmount || parseFloat(payAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please input a valid amount to convert.');
      return;
    }

    Alert.alert(
      'Transaction Authorized!',
      `Successfully routed via the Num Wallet Engine:\n\nType: ${operationType}\nRoute: ${payAmount} ${payToken.symbol} (${payToken.chain}) → ${calculatedReceive} ${receiveToken.symbol} (${receiveToken.chain})\n\nNetwork Gas Fee: 0.0005 ${payToken.chainId === 'solana' ? 'SOL' : 'ETH'}`,
      [{ text: 'Great!', onPress: () => setPayAmount('') }]
    );
  };

  // Color schemas based on theme
  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const cardStyle = isDarkMode ? styles.card : [styles.card, styles.cardLight];
  const selectBoxBg = isDarkMode ? '#131326' : '#F3F4F6';
  const selectBoxBorder = isDarkMode ? '#C4D4E810' : '#E5E7EB';
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle}>
      {/* Page Header */}
      <View style={[styles.header, borderStyle]}>
        <Text style={[styles.headerTitle, textStyle]}>Convert Assets</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* MAIN JUMPER-STYLE SWAP CARD */}
        <View style={cardStyle}>
          {/* Card Title Header with controls */}
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeaderTitle, textStyle]}>Swap & Bridge</Text>
            <View style={styles.cardHeaderActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.actionIconButton}>
                <Feather name="clock" size={16} color={isDarkMode ? '#94A3B8' : '#4B5563'} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.actionIconButton}>
                <Feather name="sliders" size={16} color={Colors.brand.bright} />
              </TouchableOpacity>
            </View>
          </View>

          {/* FROM -> TO Side-by-Side Selectors Row */}
          <View style={styles.selectorsRow}>
            {/* From Selector */}
            <TouchableOpacity
              style={[styles.selectBox, { backgroundColor: selectBoxBg, borderColor: selectBoxBorder }]}
              onPress={() => {
                setActivePickerSide('pay');
                setSelectedNetworkFilter(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.selectLabel}>From</Text>
              <View style={styles.selectContentRow}>
                {/* Token icon + Network badge overlay */}
                <View style={styles.iconBadgeWrapper}>
                  <View style={[styles.tokenIconBox, { backgroundColor: payToken ? payToken.color + '20' : '#47556920' }]}>
                    {payToken && payToken.logo ? (
                      <Image 
                        source={typeof payToken.logo === 'string' ? { uri: payToken.logo } : payToken.logo} 
                        style={styles.tokenLogoImage} 
                      />
                    ) : (
                      <Feather name={payToken ? payToken.icon : 'help-circle'} size={16} color={payToken ? payToken.color : '#475569'} />
                    )}
                  </View>
                  <View style={[styles.networkBadge, { backgroundColor: payToken ? payToken.color : '#475569' }]}>
                    <Text style={styles.networkBadgeText}>{payToken ? payToken.networkLetter : '?'}</Text>
                  </View>
                </View>
                <View style={styles.selectDetails}>
                  <Text style={[styles.selectSymbol, textStyle]}>{payToken ? payToken.symbol : 'Select...'}</Text>
                  <Text style={styles.selectChain}>{payToken ? payToken.chain : 'Select Network'}</Text>
                </View>
                <Feather name="chevron-down" size={14} color={isDarkMode ? '#475569' : '#9CA3AF'} style={styles.chevron} />
              </View>
            </TouchableOpacity>

            {/* Interchange Circle Button */}
            <View style={styles.interchangeWrapper}>
              <TouchableOpacity
                style={[
                  styles.interchangeBtn,
                  {
                    backgroundColor: isDarkMode ? '#1B1B36' : '#FFFFFF',
                    borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB',
                  },
                ]}
                onPress={handleSwapDirections}
                disabled={!payToken || !receiveToken}
                activeOpacity={0.8}
              >
                <Feather name="arrow-right" size={14} color={payToken && receiveToken ? Colors.brand.bright : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* To Selector */}
            <TouchableOpacity
              style={[styles.selectBox, { backgroundColor: selectBoxBg, borderColor: selectBoxBorder }]}
              onPress={() => {
                setActivePickerSide('receive');
                setSelectedNetworkFilter(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.selectLabel}>To</Text>
              <View style={styles.selectContentRow}>
                {/* Token icon + Network badge overlay */}
                <View style={styles.iconBadgeWrapper}>
                  <View style={[styles.tokenIconBox, { backgroundColor: receiveToken ? receiveToken.color + '20' : '#47556920' }]}>
                    {receiveToken && receiveToken.logo ? (
                      <Image source={typeof receiveToken.logo === 'string' ? { uri: receiveToken.logo } : receiveToken.logo} style={styles.tokenLogoImage} />
                    ) : (
                      <Feather name={receiveToken ? receiveToken.icon : 'help-circle'} size={16} color={receiveToken ? receiveToken.color : '#475569'} />
                    )}
                  </View>
                  <View style={[styles.networkBadge, { backgroundColor: receiveToken ? receiveToken.color : '#475569' }]}>
                    <Text style={styles.networkBadgeText}>{receiveToken ? receiveToken.networkLetter : '?'}</Text>
                  </View>
                </View>
                <View style={styles.selectDetails}>
                  <Text style={[styles.selectSymbol, textStyle]}>{receiveToken ? receiveToken.symbol : 'Select...'}</Text>
                  <Text style={styles.selectChain}>{receiveToken ? receiveToken.chain : 'Select Network'}</Text>
                </View>
                <Feather name="chevron-down" size={14} color={isDarkMode ? '#475569' : '#9CA3AF'} style={styles.chevron} />
              </View>
            </TouchableOpacity>
          </View>

          {/* SEND INPUT CARD */}
          <View style={[styles.sendInputCard, { backgroundColor: isDarkMode ? '#0A0A18' : '#F9FAFB', borderColor: selectBoxBorder }]}>
            <View style={styles.sendHeaderRow}>
              <Text style={styles.sendLabel}>Send</Text>
              <Text style={styles.sendBalance}>
                Balance: {payToken ? `${payToken.balance} ${payToken.symbol}` : '--'}
              </Text>
            </View>

            <View style={styles.sendMainRow}>
              {/* Token Display Icon */}
              <View style={styles.iconBadgeWrapperMini}>
                <View style={[styles.tokenIconBoxMini, { backgroundColor: payToken ? payToken.color + '20' : '#47556920' }]}>
                  {payToken && payToken.logo ? (
                    <Image source={typeof payToken.logo === 'string' ? { uri: payToken.logo } : payToken.logo} style={styles.tokenLogoImageMini} />
                  ) : (
                    <Feather name={payToken ? payToken.icon : 'help-circle'} size={14} color={payToken ? payToken.color : '#475569'} />
                  )}
                </View>
                <View style={[styles.networkBadgeMini, { backgroundColor: payToken ? payToken.color : '#475569' }]}>
                  <Text style={styles.networkBadgeTextMini}>{payToken ? payToken.networkLetter : '?'}</Text>
                </View>
              </View>

              {/* Number Amount Input */}
              <TextInput
                style={[styles.hugeInput, textStyle]}
                placeholder="0"
                placeholderTextColor={isDarkMode ? '#2D3748' : '#9CA3AF'}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                editable={payToken !== null}
              />

              {/* Right Side Max/Denominator */}
              <Text style={styles.denomBalance}>
                / {payToken ? payToken.balance : '--'}
              </Text>
            </View>

            <View style={styles.sendFooterRow}>
              {/* Active USD valuation */}
              <Text style={styles.usdSubtext}>
                ≈ ${payToken ? (parseFloat(payAmount || '0') * payToken.price).toFixed(2) : '0.00'} USD
              </Text>

              {/* Percentage shortcut buttons */}
              <View style={styles.presetsRow}>
                <TouchableOpacity onPress={() => handlePresetSelect(0.25)} disabled={!payToken} style={styles.presetPill}>
                  <Text style={styles.presetPillText}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePresetSelect(0.50)} disabled={!payToken} style={styles.presetPill}>
                  <Text style={styles.presetPillText}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePresetSelect(0.75)} disabled={!payToken} style={styles.presetPill}>
                  <Text style={styles.presetPillText}>75%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMaxSelect} disabled={!payToken} style={[styles.presetPill, payToken && styles.presetPillActive]}>
                  <Text style={[styles.presetPillText, payToken && styles.presetPillTextActive]}>MAX</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* DYNAMIC RECEIVE CARD */}
          <View style={[styles.receiveOutputCard, { backgroundColor: isDarkMode ? '#0A0A18' : '#F9FAFB', borderColor: selectBoxBorder }]}>
            <View style={styles.receiveHeaderRow}>
              <Text style={styles.receiveLabel}>Receive (Est.)</Text>
              <Text style={styles.receiveOperation}>{operationType}</Text>
            </View>

            <View style={styles.receiveMainRow}>
              {/* Destination Token Icon */}
              <View style={styles.iconBadgeWrapperMini}>
                <View style={[styles.tokenIconBoxMini, { backgroundColor: receiveToken ? receiveToken.color + '20' : '#47556920' }]}>
                  {receiveToken && receiveToken.logo ? (
                    <Image source={typeof receiveToken.logo === 'string' ? { uri: receiveToken.logo } : receiveToken.logo} style={styles.tokenLogoImageMini} />
                  ) : (
                    <Feather name={receiveToken ? receiveToken.icon : 'help-circle'} size={14} color={receiveToken ? receiveToken.color : '#475569'} />
                  )}
                </View>
                <View style={[styles.networkBadgeMini, { backgroundColor: receiveToken ? receiveToken.color : '#475569' }]}>
                  <Text style={styles.networkBadgeTextMini}>{receiveToken ? receiveToken.networkLetter : '?'}</Text>
                </View>
              </View>

              {/* Computed Amount Display */}
              <Text style={[styles.hugeDisplay, textStyle, (!payAmount || !receiveToken) && styles.dimDisplay]}>
                {calculatedReceive}
              </Text>

              <Text style={styles.receiveSymbol}>
                {receiveToken ? receiveToken.symbol : ''}
              </Text>
            </View>

            <View style={styles.receiveFooterRow}>
              <Text style={styles.usdSubtext}>
                ≈ ${receiveToken ? (parseFloat(calculatedReceive) * receiveToken.price).toFixed(2) : '0.00'} USD
              </Text>
            </View>
          </View>

          {/* BRANDED RATES CARD (Completely hidden aggregator info) */}
          <View style={[styles.summaryBox, { borderColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exchange Rate</Text>
              <Text style={[styles.summaryVal, textStyle]}>
                1 {payToken ? payToken.symbol : '--'} = {exchangeRate ? exchangeRate.toFixed(4) : '--'} {receiveToken ? receiveToken.symbol : '--'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network Gas Fee</Text>
              <Text style={[styles.summaryVal, textStyle]}>
                {payToken ? `0.0005 ${payToken.chainId === 'solana' ? 'SOL' : 'ETH'}` : '--'}
              </Text>
            </View>
          </View>

          {/* ACTION EXCHANGE BUTTON */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.exchangeBtnWrap} onPress={handleConvert} activeOpacity={0.85}>
              <LinearGradient
                colors={payToken && receiveToken ? [Colors.brand.deep, Colors.brand.bright] : ['#2D2D44', '#1E1E30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exchangeBtn}
              >
                <Text style={styles.exchangeBtnText}>{buttonLabel}</Text>
                <Feather name={buttonIcon} size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.walletIconBtn,
                {
                  backgroundColor: isDarkMode ? '#131326' : '#FFFFFF',
                  borderColor: isDarkMode ? '#1A1A30' : '#E5E7EB',
                },
              ]}
              activeOpacity={0.8}
            >
              <Feather name="credit-card" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* POPUP JUMPER-STYLE SEARCHABLE MODAL */}
      <Modal
        visible={activePickerSide !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setActivePickerSide(null);
          setSearchQuery('');
          setSelectedNetworkFilter(null);
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#080814' : '#FFFFFF' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                Exchange {activePickerSide === 'pay' ? 'from' : 'to'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActivePickerSide(null);
                  setSearchQuery('');
                  setSelectedNetworkFilter(null);
                }}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}
              >
                <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* JUMPER-STYLE NETWORK SELECTOR GRID */}
            <View style={styles.networkSelectWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.networkSelectScroll}
              >
                {SUPPORTED_NETWORKS.map(net => {
                  const isActive = selectedNetworkFilter === net.id;
                  const activeBorderColor = isDarkMode ? '#FFFFFF' : Colors.brand.bright;
                  
                  return (
                    <TouchableOpacity
                      key={net.name}
                      style={[
                        styles.networkCircleBtn,
                        {
                          backgroundColor: isDarkMode ? '#131326' : '#F3F4F6',
                          borderColor: isActive ? activeBorderColor : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedNetworkFilter(net.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.networkCircleIconBox, { backgroundColor: net.color + '20' }]}>
                        {net.logo ? (
                          <Image source={typeof net.logo === 'string' ? { uri: net.logo } : net.logo} style={styles.networkCircleLogo} />
                        ) : net.pack === 'Ionicons' ? (
                          <Ionicons name={net.icon} size={16} color={net.color} />
                        ) : (
                          <Feather name={net.icon} size={16} color={net.color} />
                        )}
                      </View>
                      <View style={[styles.networkLetterBadge, { backgroundColor: net.color }]}>
                        <Text style={styles.networkLetterBadgeText}>{net.letter}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Glowing Search Bar */}
            <View style={styles.searchBarWrapper}>
              <View
                style={[
                  styles.searchBarContainer,
                  {
                    backgroundColor: isDarkMode ? '#0C0C1C' : '#F3F4F6',
                    borderColor: isDarkMode ? '#1A1A30' : '#E5E7EB',
                  },
                ]}
              >
                <Feather name="search" size={16} color={Colors.brand.bright} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                  placeholder="Search by token or address"
                  placeholderTextColor={isDarkMode ? '#475569' : '#9CA3AF'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Modal Token List */}
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {/* Holdings Section */}
              {holdingsList.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.sectionHeader}>YOUR HOLDINGS</Text>
                  {holdingsList.map(t => (
                    <TouchableOpacity
                      key={`holding-${t.symbol}-${t.chainId}`}
                      style={[
                        styles.dropdownRowItem,
                        { borderBottomColor: isDarkMode ? '#C4D4E806' : '#F3F4F6' },
                      ]}
                      onPress={() => handleSelectToken(t)}
                    >
                      <View style={styles.dropdownRowLeft}>
                        {/* Circle token icon with absolute chain dot overlay */}
                        <View style={styles.iconBadgeWrapper}>
                          <View style={[styles.tokenIconBox, { backgroundColor: t.color + '15' }]}>
                            {t.logo ? (
                              <Image source={typeof t.logo === 'string' ? { uri: t.logo } : t.logo} style={styles.tokenLogoImageMini} />
                            ) : (
                              <Feather name={t.icon} size={14} color={t.color} />
                            )}
                          </View>
                          <View style={[styles.networkBadge, { backgroundColor: t.color }]}>
                            <Text style={styles.networkBadgeText}>{t.networkLetter}</Text>
                          </View>
                        </View>
                        <View>
                          <View style={styles.tokenSymbolRow}>
                            <Text style={[styles.dropdownItemSymbol, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                              {t.symbol}
                            </Text>
                            <View style={styles.inlineChainBadge}>
                              <Text style={styles.inlineChainBadgeText}>{t.chain}</Text>
                            </View>
                          </View>
                          <Text style={styles.dropdownItemName}>{t.name}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.dropdownItemBalance, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                          {t.balance}
                        </Text>
                        <Text style={styles.dropdownItemUSD}>
                          ≈ ${(parseFloat(t.balance) * t.price).toFixed(2)} USD
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* All Supported Assets Section */}
              {allAssetsList.length > 0 ? (
                <View style={styles.listSection}>
                  <Text style={styles.sectionHeader}>ALL SUPPORTED ASSETS</Text>
                  {allAssetsList.map(t => (
                    <TouchableOpacity
                      key={`all-${t.symbol}-${t.chainId}`}
                      style={[
                        styles.dropdownRowItem,
                        { borderBottomColor: isDarkMode ? '#C4D4E806' : '#F3F4F6' },
                      ]}
                      onPress={() => handleSelectToken(t)}
                    >
                      <View style={styles.dropdownRowLeft}>
                        <View style={styles.iconBadgeWrapper}>
                          <View style={[styles.tokenIconBox, { backgroundColor: t.color + '10' }]}>
                            {t.logo ? (
                              <Image source={typeof t.logo === 'string' ? { uri: t.logo } : t.logo} style={styles.tokenLogoImageMini} />
                            ) : (
                              <Feather name={t.icon} size={14} color={t.color} />
                            )}
                          </View>
                          <View style={[styles.networkBadge, { backgroundColor: t.color }]}>
                            <Text style={styles.networkBadgeText}>{t.networkLetter}</Text>
                          </View>
                        </View>
                        <View>
                          <View style={styles.tokenSymbolRow}>
                            <Text style={[styles.dropdownItemSymbol, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                              {t.symbol}
                            </Text>
                            <View style={styles.inlineChainBadge}>
                              <Text style={styles.inlineChainBadgeText}>{t.chain}</Text>
                            </View>
                          </View>
                          <Text style={styles.dropdownItemName}>{t.name}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.dropdownItemBalance, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                          {t.balance}
                        </Text>
                        <Text style={styles.dropdownItemUSD}>
                          ≈ ${(parseFloat(t.balance) * t.price).toFixed(2)} USD
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyResults}>
                  <Feather name="info" size={24} color={Colors.text.muted} />
                  <Text style={[styles.emptyText, { color: isDarkMode ? '#94A3B8' : '#4B5563' }]}>
                    No supported assets found matching "{searchQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>
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
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  borderDark: { borderBottomColor: '#C4D4E810' },
  borderLight: { borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  textMuted: { color: Colors.text.secondary },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4] },

  // main swap card container
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: 16,
    marginTop: Spacing[2],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: Radius.xs,
  },

  // side-by-side selectors style
  selectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 76,
  },
  selectBox: {
    flex: 1,
    height: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  selectLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectDetails: {
    marginLeft: 10,
    flex: 1,
  },
  selectSymbol: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectChain: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  chevron: {
    marginLeft: 2,
  },

  // overlay badge style (professional & silk)
  iconBadgeWrapper: {
    position: 'relative',
    width: 34,
    height: 34,
  },
  tokenIconBox: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadgeText: {
    fontSize: 7,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // interchange connection button style
  interchangeWrapper: {
    width: 32,
    alignItems: 'center',
    zIndex: 10,
  },
  interchangeBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.bright,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Send amount card styling
  sendInputCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  sendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sendBalance: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sendMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadgeWrapperMini: {
    position: 'relative',
    width: 26,
    height: 26,
  },
  tokenIconBoxMini: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadgeMini: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadgeTextMini: {
    fontSize: 5,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  hugeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    padding: 0,
  },
  denomBalance: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  sendFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  usdSubtext: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetPill: {
    backgroundColor: '#1E1E38',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  presetPillActive: {
    backgroundColor: Colors.brand.bright + '20',
    borderWidth: 0.5,
    borderColor: Colors.brand.bright + '40',
  },
  presetPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  presetPillTextActive: {
    color: Colors.brand.bright,
  },

  // receive estimation display styles
  receiveOutputCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  receiveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiveOperation: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.brand.bright,
    textTransform: 'uppercase',
  },
  receiveMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hugeDisplay: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
  },
  dimDisplay: {
    color: '#2D3748',
  },
  receiveSymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  receiveFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // rate card styles
  summaryBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    marginTop: Spacing[1],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // exchange action button style (Jumper-like matching)
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing[2],
    marginBottom: Spacing[8],
  },
  exchangeBtnWrap: {
    flex: 1,
  },
  exchangeBtn: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exchangeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletIconBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MODAL OVERLAY STYLING (Premium Modern)
  modalContainer: {
    flex: 1,
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
    textTransform: 'capitalize',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Horizontal network select selector
  networkSelectWrapper: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  networkSelectScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: Spacing[5],
  },
  networkCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  networkCircleIconBox: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkLetterBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#080814',
  },
  networkLetterBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },

  searchBarWrapper: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  listSection: {
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
  },
  sectionHeader: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
  },
  dropdownRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  dropdownRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  tokenSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dropdownItemSymbol: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  inlineChainBadge: {
    backgroundColor: Colors.brand.bright + '12',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.xs,
  },
  inlineChainBadgeText: {
    color: Colors.brand.bright,
    fontSize: 8,
    fontWeight: '700',
  },
  dropdownItemName: {
    color: Colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  dropdownItemBalance: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  dropdownItemUSD: {
    fontSize: 9,
    color: Colors.text.muted,
    marginTop: 2,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: Spacing[3],
  },
  emptyText: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing[10],
  },
  networkCircleLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  tokenLogoImage: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
  },
  tokenLogoImageMini: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
  },
});

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore, getLogoSource } from '../../store/userStore';
import { WalletEngine } from '../../store/walletEngine';
import CustomAlert from '../../components/CustomAlert';
import ImageWithFallback from '../../components/ImageWithFallback';
import TransactionConfirmModal from '../../components/TransactionConfirmModal';
import { WebacyService } from '../../store/webacyService';
import { ethers } from 'ethers';

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
  hyperliquid: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hpl: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hyperevm: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hyp: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hype: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  '1337': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  '999': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
};

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  SOL: 'solana',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  XRP: 'ripple',
  TON: 'the-open-network',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  TRX: 'tron',
  POL: 'polygon-ecosystem-token',
  DOT: 'polkadot',
  ARB: 'arbitrum',
  OP: 'optimism',
  KLV: 'klever',
  CRO: 'crypto-com-chain',
  FTM: 'fantom',
  NEAR: 'near',
  APT: 'aptos',
  SUI: 'sui',
  XLM: 'stellar',
  ATOM: 'cosmos',
  BTC: 'bitcoin',
  RWA: 'xend-finance'
};

// Curated stablecoins for Convert picker "Stables" tab — verified logos, one primary stable per chain.
const CURATED_STABLECOINS_RAW = [
  // ── USDC (preferred on most chains for native issuance) ──
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Solana', chainId: 'solana', lifiChainId: 1151111081099710 as number | string, networkLetter: 'S', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Ethereum', chainId: 'ethereum', lifiChainId: 1 as number | string, networkLetter: 'E', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0xA0b86991c6218b36c1d19D4a2e9eb0CE3606eb48', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Base', chainId: 'base', lifiChainId: 8453 as number | string, networkLetter: 'Ba', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Arbitrum', chainId: 'arbitrum', lifiChainId: 42161 as number | string, networkLetter: 'A', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Polygon', chainId: 'polygon', lifiChainId: 137 as number | string, networkLetter: 'P', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Optimism', chainId: 'optimism', lifiChainId: 10 as number | string, networkLetter: 'O', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0x0b2C639c533813f4Aa9d7837CAf62653d097Ff85', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.0, color: '#2775CA', chain: 'Avalanche', chainId: 'avalanchec', lifiChainId: 43114 as number | string, networkLetter: 'Av', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', address: '0xB97EF154c8E493685857F0E44128354a3F68d607', decimals: 6 },
  // ── USDT (dominant on BNB Chain, Ethereum) ──
  { symbol: 'USDT', name: 'Tether USD', price: 1.0, color: '#26A17B', chain: 'BNB Smart Chain', chainId: 'smartchain', lifiChainId: 56 as number | string, networkLetter: 'B', logo: 'https://coin-images.coingecko.com/coins/images/325/large/tether.png', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  // ── cNGN (Nigerian naira stablecoin) ──
  { symbol: 'CNGN', name: 'Compliant Naira', price: 0.00065, color: '#7C3AED', chain: 'Ethereum', chainId: 'ethereum', lifiChainId: 1 as number | string, networkLetter: 'E', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png', address: '0x0b2b22cCfd95B1Ff2De52F192749986385B1a6b6', decimals: 18 },
  { symbol: 'CNGN', name: 'Compliant Naira', price: 0.00065, color: '#7C3AED', chain: 'BNB Smart Chain', chainId: 'smartchain', lifiChainId: 56 as number | string, networkLetter: 'B', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png', address: '0x8a078b182bA9649c03982c2a80CDcc81cdc99dA8', decimals: 18 },
  { symbol: 'CNGN', name: 'Compliant Naira', price: 0.00065, color: '#7C3AED', chain: 'Base', chainId: 'base', lifiChainId: 8453 as number | string, networkLetter: 'Ba', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png', address: '0xe2387F04d3858e7Cb64Ef5Ed6617f9B2fcEEAfa2', decimals: 18 },
  { symbol: 'CNGN', name: 'Compliant Naira', price: 0.00065, color: '#7C3AED', chain: 'Polygon', chainId: 'polygon', lifiChainId: 137 as number | string, networkLetter: 'P', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png', address: '0x995Ba562E513a22122C499622b193C91b32E2A28', decimals: 18 },
];

export interface TokenType {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  color: string;
  icon: any;
  chain: string;
  chainId: string;
  lifiChainId?: string | number;
  networkLetter: string;
  logo: any;
  address?: string;
  decimals?: number;
}

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

export default function ConvertScreen() {
  const { isDarkMode, portfolioAssets, importCustomAsset, addTransaction, transactionPin, hiddenTokenAddresses } = useUserStore();
  const [payAmount, setPayAmount] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [lifiChains, setLifiChains] = useState<any[]>(DEFAULT_LIFI_CHAINS);
  const [chainTokens, setChainTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const [tokenRisk, setTokenRisk] = useState<any>(null);
  const [holderAnalysis, setHolderAnalysis] = useState<any>(null);
  const [loadingWebacyToken, setLoadingWebacyToken] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'info' as any,
    iconColor: Colors.brand.bright as string,
  });

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
          setLifiChains(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const dynamicUnifiedTokens = useMemo<TokenType[]>(() => {
    const list: TokenType[] = [];
    portfolioAssets.forEach(asset => {
      if (asset.id === 'assetchain' || asset.id === 'rwa') return; // Hide Asset Chain from holdings
      const meta = metadataMap[asset.id] || { color: '#3A8AFF', icon: 'zap', pack: 'Feather', letter: asset.chain.substring(0, 2) };
      asset.tokens.forEach((t: any) => {
        const tokenKey = (t.address || t.symbol).toLowerCase();
        if (hiddenTokenAddresses.includes(tokenKey)) return;

        const cleanVal = parseFloat(t.value.replace(/[^0-9.]/g, '')) || 0;
        const cleanAmt = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
        // Derive price from stored price, or calculate from value/amount ratio
        const price = (t.price !== undefined && t.price > 0) ? t.price : (cleanAmt > 0 && cleanVal > 0 ? (cleanVal / cleanAmt) : 0.0);
        list.push({
          symbol: t.symbol,
          name: t.name,
          balance: t.amount.split(' ')[0] || '0.00',
          price: price,
          color: meta.color,
          icon: meta.icon,
          chain: asset.chain,
          chainId: asset.id,
          lifiChainId: asset.id === 'solana' ? 1151111081099710 : (asset.id === 'bitcoin' ? 20000000000001 : (asset.id === 'sui' ? 9270000000000000 : (asset.id === 'tron' ? 728126428 : undefined))),
          networkLetter: meta.letter,
          logo: t.logo || asset.logo,
          address: t.address,
          decimals: t.decimals
        });
      });
    });
    return list;
  }, [portfolioAssets, hiddenTokenAddresses]);

  const dynamicSupportedNetworks = useMemo(() => {
    const nets = lifiChains.map(c => {
      const meta = metadataMap[c.key] || metadataMap[c.name.toLowerCase()] || { color: '#3A8AFF', icon: 'zap', pack: 'Feather', letter: c.name.substring(0, 2) };
      return {
        id: c.id,
        name: c.name,
        color: c.color || meta.color,
        icon: 'zap' as const,
        pack: 'Feather' as const,
        letter: meta.letter,
        logo: c.logoURI
      };
    });
    return [
      { id: null, name: 'Holdings', color: Colors.brand.bright, icon: 'apps-sharp' as const, pack: 'Ionicons' as const, letter: '*', logo: null },
      ...nets
    ];
  }, [lifiChains]);

  const params = useLocalSearchParams<{
    fromSymbol?: string;
    fromName?: string;
    fromChain?: string;
    fromChainId?: string;
    fromPrice?: string;
    fromLogo?: string;
    fromAddress?: string;
    toSymbol?: string;
    toName?: string;
    toChain?: string;
    toChainId?: string;
    toPrice?: string;
    toLogo?: string;
    toAddress?: string;
    isMemeBuy?: string;
    isMemeSell?: string;
  }>();

  const navigation = useNavigation();

  // Source & Destination Selections - EMPTY BY DEFAULT
  const [payToken, setPayToken] = useState<TokenType | null>(null);
  const [receiveToken, setReceiveToken] = useState<TokenType | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we came from a token pre-fill or if we just clicked the tab
      if (!params.fromSymbol) {
        setPayToken(null);
        setReceiveToken(null);
        setPayAmount('');
      }
    });
    return unsubscribe;
  }, [navigation, params]);

  useEffect(() => {
    if (params.fromSymbol && params.fromChain) {
      const fromSym = params.fromSymbol;
      const fromCh = params.fromChain;
      const found = dynamicUnifiedTokens.find(
        t => t.symbol.toUpperCase() === fromSym.toUpperCase() &&
             (t.chain.toLowerCase().includes(fromCh.toLowerCase()) || 
              fromCh.toLowerCase().includes(t.chain.toLowerCase()) ||
              t.chainId.toLowerCase() === params.fromChainId?.toLowerCase())
      );
      if (found) {
        setPayToken(found);
      } else {
        const chainIdVal = params.fromChainId || 'solana';
        const customFrom: TokenType = {
          symbol: fromSym,
          name: params.fromName || fromSym,
          balance: '0.00',
          price: parseFloat(params.fromPrice || '0') || 0.0,
          color: '#3A8AFF',
          icon: 'zap' as const,
          chain: fromCh,
          chainId: chainIdVal,
          networkLetter: (fromCh.charAt(0) || 'S') as any,
          logo: params.fromLogo || getChainLogoById(chainIdVal) || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          address: params.fromAddress || ''
        };
        setPayToken(customFrom);
      }
    } else if (dynamicUnifiedTokens.length > 0 && !payToken) {
      const defaultSol = dynamicUnifiedTokens.find(t => t.symbol === 'SOL' && t.chainId === 'solana' && isLifiSupported(t));
      if (defaultSol) {
        setPayToken(defaultSol);
      } else {
        const firstSupported = dynamicUnifiedTokens.find(t => isLifiSupported(t));
        if (firstSupported) {
          setPayToken(firstSupported);
        }
      }
    }
    
    if (params.toSymbol && params.toChain) {
      const toSym = params.toSymbol;
      const toCh = params.toChain;
      const found = dynamicUnifiedTokens.find(
        t => t.symbol.toUpperCase() === toSym.toUpperCase() &&
             (t.chain.toLowerCase().includes(toCh.toLowerCase()) || 
              toCh.toLowerCase().includes(t.chain.toLowerCase()) ||
              t.chainId.toLowerCase() === params.toChainId?.toLowerCase())
      );
      if (found) {
        setReceiveToken(found);
      } else {
        const chainIdVal = params.toChainId || 'solana';
        const customTo: TokenType = {
          symbol: toSym,
          name: params.toName || toSym,
          balance: '0.00',
          price: parseFloat(params.toPrice || '0') || 0.0,
          color: '#EC4899',
          icon: 'zap' as const,
          chain: toCh,
          chainId: chainIdVal,
          networkLetter: (toCh.charAt(0) || 'S') as any,
          logo: params.toLogo || getChainLogoById(chainIdVal) || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          address: params.toAddress || ''
        };
        setReceiveToken(customTo);
      }
    } else if (dynamicUnifiedTokens.length > 0 && !receiveToken) {
      const defaultEth = dynamicUnifiedTokens.find(t => t.symbol === 'ETH' && t.chainId === 'ethereum' && isLifiSupported(t));
      if (defaultEth) {
        setReceiveToken(defaultEth);
      } else {
        const firstSupported = payToken || dynamicUnifiedTokens.find(t => isLifiSupported(t));
        const secondSupported = dynamicUnifiedTokens.filter(t => isLifiSupported(t) && t.symbol !== firstSupported?.symbol)[0];
        if (secondSupported) {
          setReceiveToken(secondSupported);
        }
      }
    }
  }, [
    params.fromSymbol,
    params.fromName,
    params.fromChain,
    params.fromChainId,
    params.fromPrice,
    params.fromLogo,
    params.fromAddress,
    params.toSymbol,
    params.toName,
    params.toChain,
    params.toChainId,
    params.toPrice,
    params.toLogo,
    params.toAddress,
    dynamicUnifiedTokens
  ]);

  // Validation effect: Alert and reset if payToken is not supported by LI.FI
  useEffect(() => {
    if (payToken && !isLifiSupported(payToken)) {
      setAlertConfig({
        visible: true,
        title: 'Conversion Unsupported',
        message: `Swaps are currently disabled for ${payToken.chain}. You can only Send or Receive ${payToken.symbol} on the Num Wallet until it gets supported by LI.FI.`,
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      // Reset payToken to a supported default
      const defaultSol = dynamicUnifiedTokens.find(t => t.symbol === 'SOL' && t.chainId === 'solana' && isLifiSupported(t));
      if (defaultSol) {
        setPayToken(defaultSol);
      } else {
        const firstSupported = dynamicUnifiedTokens.find(t => isLifiSupported(t));
        setPayToken(firstSupported || null);
      }
    }
  }, [payToken, dynamicUnifiedTokens]);

  // Validation effect: Alert and reset if receiveToken is not supported by LI.FI
  useEffect(() => {
    if (receiveToken && !isLifiSupported(receiveToken)) {
      setAlertConfig({
        visible: true,
        title: 'Conversion Unsupported',
        message: `Swaps are currently disabled for ${receiveToken.chain}. You can only Send or Receive ${receiveToken.symbol} on the Num Wallet until it gets supported by LI.FI.`,
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      // Reset receiveToken to a supported default
      const defaultEth = dynamicUnifiedTokens.find(t => t.symbol === 'ETH' && t.chainId === 'ethereum' && isLifiSupported(t));
      if (defaultEth) {
        setReceiveToken(defaultEth);
      } else {
        const firstSupported = payToken;
        const secondSupported = dynamicUnifiedTokens.filter(t => isLifiSupported(t) && t.symbol !== firstSupported?.symbol)[0];
        setReceiveToken(secondSupported || null);
      }
    }
  }, [receiveToken, dynamicUnifiedTokens, payToken]);

  useEffect(() => {
    let active = true;
    if (!receiveToken || !receiveToken.address) {
      setTokenRisk(null);
      setHolderAnalysis(null);
      return;
    }

    const fetchTokenDueDiligence = async () => {
      setLoadingWebacyToken(true);
      try {
        const addr = receiveToken.address as string;
        const chainId = receiveToken.chainId;
        const [risk, holders] = await Promise.all([
          WebacyService.analyzeToken(addr, chainId),
          WebacyService.getHolderAnalysis(addr, chainId)
        ]);

        if (active) {
          setTokenRisk(risk);
          setHolderAnalysis(holders);
        }
      } catch (e) {
        console.log('Error doing Webacy token due diligence:', e);
      } finally {
        if (active) {
          setLoadingWebacyToken(false);
        }
      }
    };

    fetchTokenDueDiligence();
    return () => {
      active = false;
    };
  }, [receiveToken]);

  // Search Modal state
  const [activePickerSide, setActivePickerSide] = useState<'pay' | 'receive' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<number | null>(null);
  const [isStablesMode, setIsStablesMode] = useState(false);
  const [discoveredTokens, setDiscoveredTokens] = useState<TokenType[]>([]);
  const [searchingDiscovery, setSearchingDiscovery] = useState(false);


  // Settings Modal states
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [slippage, setSlippage] = useState('1.0');
  const [gasPriority, setGasPriority] = useState('Fast');
  const [customSlippage, setCustomSlippage] = useState('');

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setDiscoveredTokens([]);
      setSearchingDiscovery(false);
      return;
    }

    setSearchingDiscovery(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const isHex = /^0x[a-fA-F0-9]{40}$/.test(query);
        const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);

        let mapped: TokenType[] = [];
        let seen = new Set<string>();

        // 1. Prioritize Asset Chain Explorer API for hex query address (fast-track Shalom / Asset Chain tokens)
        if (isHex) {
          try {
            const acExplorerRes = await fetch(`https://scan.assetchain.org/api/v2/tokens/${query}`, { signal: controller.signal });
            if (acExplorerRes.ok) {
              const acExplorerData = await acExplorerRes.ok ? await acExplorerRes.json() : null;
              if (acExplorerData && acExplorerData.symbol && acExplorerData.name) {
                const symbol = acExplorerData.symbol.toUpperCase();
                const meta = metadataMap['assetchain'] || { color: '#F25C22', letter: 'AC' };
                mapped.push({
                  symbol,
                  name: acExplorerData.name,
                  balance: '0.00',
                  price: parseFloat(acExplorerData.exchange_rate || acExplorerData.exchange_rate_usd) || 0.0,
                  color: meta.color,
                  icon: 'zap',
                  chain: 'Asset Chain',
                  chainId: 'assetchain',
                  networkLetter: meta.letter,
                  logo: acExplorerData.icon_url || null,
                  address: query
                });
                seen.add(`${symbol}-assetchain`);
              }
            }
          } catch (e) {
            console.log('Asset Chain explorer search in convert failed:', e);
          }
        }

        // 2. Query DexScreener search API as standard fallback
        try {
          const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (data && data.pairs) {
              data.pairs.slice(0, 15).forEach((pair: any) => {
                const base = pair.baseToken;
                const chainIdLower = pair.chainId.toLowerCase();
                const uniqueKey = `${base.symbol.toUpperCase()}-${chainIdLower}`;

                if (seen.has(uniqueKey)) return;
                seen.add(uniqueKey);

                let chainName = 'Ethereum';
                if (chainIdLower === 'solana') chainName = 'Solana';
                else if (chainIdLower === 'bsc' || chainIdLower === 'smartchain') chainName = 'BNB Chain';
                else if (chainIdLower === 'ton') chainName = 'TON';
                else if (chainIdLower === 'base') chainName = 'Base';
                else if (chainIdLower === 'arbitrum') chainName = 'Arbitrum';
                else if (chainIdLower === 'polygon') chainName = 'Polygon';
                else if (chainIdLower === 'optimism') chainName = 'Optimism';
                else if (chainIdLower === 'avalanche' || chainIdLower === 'avalanchec') chainName = 'Avalanche';
                else chainName = pair.chainId.charAt(0).toUpperCase() + pair.chainId.slice(1);

                const meta = metadataMap[chainIdLower] || { color: '#3A8AFF', letter: base.symbol.substring(0, 2).toUpperCase() };

                mapped.push({
                  symbol: base.symbol.toUpperCase(),
                  name: base.name,
                  balance: '0.00',
                  price: parseFloat(pair.priceUsd) || 0.0,
                  color: meta.color,
                  icon: 'zap',
                  chain: chainName,
                  chainId: chainIdLower,
                  networkLetter: meta.letter,
                  logo: pair.info?.imageUrl || null,
                  address: base.address
                });
              });
            }
          }
        } catch (err) {
          console.log('DexScreener search in convert failed:', err);
        }

        // 3. Fallback to parallel EVM RPC scan if nothing found and it is a hex address
        if (mapped.length === 0 && isHex) {
          try {
            const EVM_CHAINS = [
              { name: 'Ethereum', idLower: 'ethereum', rpc: 'https://ethereum-rpc.publicnode.com' },
              { name: 'Base', idLower: 'base', rpc: 'https://mainnet.base.org' },
              { name: 'Arbitrum', idLower: 'arbitrum', rpc: 'https://arbitrum.publicnode.com' },
              { name: 'BNB Chain', idLower: 'bsc', rpc: 'https://bsc-dataseed1.binance.org' },
              { name: 'Polygon', idLower: 'polygon', rpc: 'https://polygon-rpc.com' },
              { name: 'Optimism', idLower: 'optimism', rpc: 'https://mainnet.optimism.io' },
              { name: 'Avalanche', idLower: 'avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
              { name: 'Fantom', idLower: 'fantom', rpc: 'https://rpc.ankr.com/fantom' },
              { name: 'Cronos', idLower: 'cronos', rpc: 'https://evm.cronos.org' },
              { name: 'Linea', idLower: 'linea', rpc: 'https://rpc.linea.build' },
              { name: 'Scroll', idLower: 'scroll', rpc: 'https://rpc.scroll.io' },
              { name: 'Asset Chain', idLower: 'assetchain', rpc: 'https://mainnet-rpc.assetchain.org' },
              { name: 'Mantle', idLower: 'mantle', rpc: 'https://rpc.mantle.xyz' },
              { name: 'Blast', idLower: 'blast', rpc: 'https://rpc.blast.io' },
              { name: 'Celo', idLower: 'celo', rpc: 'https://forno.celo.org' },
              { name: 'Gnosis', idLower: 'gnosis', rpc: 'https://rpc.gnosischain.com' },
              { name: 'zkSync', idLower: 'zksync', rpc: 'https://mainnet.era.zksync.io' },
              { name: 'Taiko', idLower: 'taiko', rpc: 'https://rpc.mainnet.taiko.xyz' },
              { name: 'Kava', idLower: 'kava', rpc: 'https://evm.kava.io' },
              { name: 'Metis', idLower: 'metis', rpc: 'https://andromeda.metis.io/?owner=1088' },
              { name: 'Sei EVM', idLower: 'sei', rpc: 'https://evm-rpc.sei-apis.com' },
              { name: 'Mode', idLower: 'mode', rpc: 'https://mainnet.mode.network' }
            ];

            const promises = EVM_CHAINS.map(async (c) => {
              try {
                const fetchWithTimeout = async (url: string, data: string, timeoutMs = 5000) => {
                  const ctrl = new AbortController();
                  const id = setTimeout(() => ctrl.abort(), timeoutMs);
                  try {
                    const res = await fetch(url, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'eth_call',
                        params: [{ to: query, data }, 'latest']
                      }),
                      signal: ctrl.signal
                    });
                    clearTimeout(id);
                    if (res.ok) {
                      const json = await res.json();
                      return json.result;
                    }
                  } catch (e) {
                    clearTimeout(id);
                  }
                  return null;
                };

                const [nameHex, symbolHex] = await Promise.all([
                  fetchWithTimeout(c.rpc, '0x06fdde03'),
                  fetchWithTimeout(c.rpc, '0x95d89b41')
                ]);

                if (nameHex && symbolHex && nameHex !== '0x' && symbolHex !== '0x') {
                  const decodedName = ethers.AbiCoder.defaultAbiCoder().decode(['string'], nameHex)[0];
                  const decodedSymbol = ethers.AbiCoder.defaultAbiCoder().decode(['string'], symbolHex)[0];
                  if (decodedSymbol) {
                    return {
                      name: decodedName || decodedSymbol,
                      symbol: decodedSymbol,
                      chain: c
                    };
                  }
                }
              } catch (e) {
                // ignore
              }
              return null;
            });

            const results = await Promise.all(promises);
            const found = results.find(r => r !== null);
            if (found) {
              const meta = metadataMap[found.chain.idLower] || { color: '#3A8AFF', letter: found.symbol.substring(0, 2).toUpperCase() };
              mapped.push({
                symbol: found.symbol.toUpperCase(),
                name: found.name,
                balance: '0.00',
                price: 0.0,
                color: meta.color,
                icon: 'zap',
                chain: found.chain.name,
                chainId: found.chain.idLower,
                networkLetter: meta.letter,
                logo: null,
                address: query
              });
            }
          } catch (rpcErr) {
            console.log('Parallel RPC search in convert failed:', rpcErr);
          }
        }

        // 4. Try multi-aggregator API fallback to resolve/heal name, symbol, price, and logo
        for (let i = 0; i < mapped.length; i++) {
          const item = mapped[i];
          if (item.address && (item.price === 0.0 || item.price === 0.01 || !item.logo || !item.name || !item.symbol)) {
            try {
              const aggResult = await WebacyService.fetchTokenFromAggregators(item.address, item.chainId);
              if (aggResult) {
                if (aggResult.name && (!item.name || item.name.includes('Resolved Token') || item.name.includes('Token (0x'))) {
                  item.name = aggResult.name;
                }
                if (aggResult.symbol && (!item.symbol || item.symbol.startsWith('EVM-') || item.symbol === 'TOKEN')) {
                  item.symbol = aggResult.symbol.toUpperCase();
                }
                if (aggResult.price && (item.price === 0.0 || item.price === 0.01)) {
                  item.price = aggResult.price;
                }
                if (aggResult.logo && !item.logo) {
                  item.logo = aggResult.logo;
                }
              }
            } catch (aggErr) {
              console.log('Aggregators search fallback in convert failed:', aggErr);
            }
          }

          if (!item.logo && item.address && (item.chainId === 'ethereum' || item.chainId === 'bsc' || item.chainId === 'polygon' || item.chainId === 'arbitrum' || item.chainId === 'optimism' || item.chainId === 'avalanche' || item.chainId === 'solana')) {
            const trustChainMap: Record<string, string> = {
              ethereum: 'ethereum',
              bsc: 'smartchain',
              polygon: 'polygon',
              arbitrum: 'arbitrum',
              optimism: 'optimism',
              avalanche: 'avalanchec',
              solana: 'solana'
            };
            const trustChain = trustChainMap[item.chainId];
            if (trustChain) {
              item.logo = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${trustChain}/assets/${item.address}/logo.png`;
            }
          }
        }

        const filteredMapped = mapped.filter(t => t.chainId !== 'assetchain' && t.chainId !== 'rwa');
        setDiscoveredTokens(filteredMapped);
        setSearchingDiscovery(false);
      } catch (err: any) {
        if (err && err.name === 'AbortError') {
          return;
        }
        console.log('Discovery search info:', err);
        setSearchingDiscovery(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (selectedNetworkFilter === null) {
      setChainTokens([]);
      return;
    }
    let active = true;
    setLoadingTokens(true);
    const url = `https://li.quest/v1/tokens?chains=${selectedNetworkFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data && data.tokens && data.tokens[selectedNetworkFilter]) {
          const mapped = data.tokens[selectedNetworkFilter].map((t: any) => {
            let userBalance = '0.00';
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
            };
            const chainKey = Object.keys(CHAIN_ID_TO_EVM_ID).find(
              k => CHAIN_ID_TO_EVM_ID[k] === selectedNetworkFilter
            ) || (selectedNetworkFilter === 1151111081099710 ? 'solana' : selectedNetworkFilter?.toString() || '');

            const pChain = portfolioAssets.find(c => c.id === chainKey || c.id === selectedNetworkFilter?.toString());
            if (pChain) {
              const pToken = pChain.tokens.find((pt: any) => 
                pt.symbol === t.symbol || 
                (pt.address && t.address && pt.address.toLowerCase() === t.address.toLowerCase())
              );
              if (pToken) {
                userBalance = pToken.amount.split(' ')[0] || '0.00';
              }
            }

            const meta = metadataMap[chainKey] || { color: '#3A8AFF', letter: t.symbol.substring(0, 2) };

            return {
              symbol: t.symbol,
              name: t.name,
              balance: userBalance,
              price: parseFloat(t.priceUSD) || 0.0,
              color: meta.color,
              icon: 'zap',
              chain: lifiChains.find(c => c.id === selectedNetworkFilter)?.name || '',
              chainId: chainKey,
              lifiChainId: selectedNetworkFilter,
              networkLetter: meta.letter,
              logo: t.logoURI,
              address: t.address
            };
          });
          setChainTokens(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingTokens(false);
      });

    return () => {
      active = false;
    };
  }, [selectedNetworkFilter, portfolioAssets, lifiChains]);

  const getChainLogoById = (chainIdStr: any) => {
    if (!chainIdStr) return null;
    const chainIdLower = chainIdStr.toString().toLowerCase();
    
    // Explicit overrides
    if (chainIdLower === 'smartchain' || chainIdLower === 'bsc' || chainIdLower === 'bnb') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png';
    }
    if (chainIdLower === 'solana' || chainIdLower === 'sol') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
    }
    if (chainIdLower === 'ethereum' || chainIdLower === 'eth') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
    }
    if (chainIdLower === 'avalanchec' || chainIdLower === 'avalanche' || chainIdLower === 'avax') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png';
    }
    if (chainIdLower === 'theopennetwork' || chainIdLower === 'ton') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png';
    }
    if (chainIdLower === 'ripple' || chainIdLower === 'xrp') {
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png';
    }
    if (chainIdLower === 'assetchain' || chainIdLower === 'rwa') {
      return 'https://assets.coingecko.com/coins/images/13402/large/xend.png';
    }
    if (chainIdLower === 'klever' || chainIdLower === 'klv') {
      return 'https://assets.coingecko.com/coins/images/13813/large/klever.png';
    }
    if (chainIdLower === 'hyperliquid' || chainIdLower === 'hpl' || chainIdLower === '1337') {
      return 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fhyperliquid.svg&output=png';
    }
    if (chainIdLower === 'hyperevm' || chainIdLower === 'hyp' || chainIdLower === '999' || chainIdLower === 'hype') {
      return 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fhyperevm.svg&output=png';
    }

    const found = lifiChains.find(c => 
      c.id === chainIdStr || 
      c.key === chainIdStr || 
      c.id.toString() === chainIdStr.toString() ||
      c.name.toLowerCase() === chainIdLower ||
      c.key.toLowerCase() === chainIdLower
    );
    return found ? found.logoURI : null;
  };

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
    const cleanBal = payToken.balance.replace(/,/g, '');
    const bal = parseFloat(cleanBal);
    if (isNaN(bal)) return;
    if (bal <= 0) {
      setPayAmount('0');
      return;
    }
    const calculated = (bal * percent).toFixed(5);
    setPayAmount(parseFloat(calculated).toString());
  };

  const handleMaxSelect = () => {
    if (!payToken) return;
    const cleanBal = payToken.balance.replace(/,/g, '');
    const bal = parseFloat(cleanBal);
    if (isNaN(bal) || bal <= 0) {
      setPayAmount('0');
    } else {
      setPayAmount(cleanBal);
    }
  };

  // ─── LI.FI State ────────────────────────────────────────────────────────────
  const [lifiQuote, setLifiQuote] = useState<any>(null);
  const [lifiLoading, setLifiLoading] = useState(false);

  // ─── DEX Fallback State ─────────────────────────────────────────────────────
  // When LI.FI does not support the token pair (e.g. Asset Chain), we fall back
  // to a direct on-chain DEX swap via the Uniswap V3-compatible router.
  const [dexFallbackAvailable, setDexFallbackAvailable] = useState(false);
  const [dexFallbackLoading, setDexFallbackLoading] = useState(false);
  const [dexQuoteOut, setDexQuoteOut] = useState<string | null>(null);

  // ─── LI.FI Helper Functions ──────────────────────────────────────────────────
  const isLifiSupported = (token: TokenType | null) => {
    if (!token) return false;
    const chainIdLower = token.chainId.toLowerCase();
    if (chainIdLower === 'solana') return true;
    const EVM_CHAINS = [
      'ethereum', 'smartchain', 'bsc', 'base', 'arbitrum', 'polygon', 'optimism', 'avalanche', 'avalanchec',
      'fantom', 'cronos', 'scroll', 'zksync', 'linea', 'celo', 'blast', 'gnosis', 'moonbeam', 'mantle', 'metis', 'mode', 'taiko'
    ];
    return EVM_CHAINS.includes(chainIdLower);
  };

  const getTokenDecimals = (token: TokenType | null) => {
    if (!token) return 18;
    if (token.decimals !== undefined && token.decimals !== null) return token.decimals;
    const sym = token.symbol.toUpperCase();
    const chainIdLower = token.chainId.toLowerCase();
    if (sym === 'SOL') return 9;
    if (sym === 'ETH') return 18;
    if (sym === 'BNB') return 18;
    if (sym === 'TON') return 9;
    if (sym === 'BTC') return 8;
    if (sym === 'XRP') return 6;
    if (sym === 'TRX') return 6;
    if (sym === 'SUI') return 9;
    if (sym === 'APT') return 8;
    if (sym === 'NEAR') return 24;
    if (sym === 'USDC' || sym === 'USDT') return 6;
    if (chainIdLower === 'solana' || chainIdLower === 'ton') return 9;
    return 18;
  };

  const getLifiChainId = (token: TokenType | null) => {
    if (!token) return 1;
    if (token.lifiChainId) return token.lifiChainId;
    const CHAIN_ID_TO_EVM_ID: Record<string, number> = {
      ethereum: 1, smartchain: 56, bsc: 56, base: 8453, arbitrum: 42161,
      polygon: 137, optimism: 10, avalanchec: 43114, avalanche: 43114,
      fantom: 250, cronos: 25, scroll: 534352, zksync: 324, linea: 59144,
      celo: 42220, blast: 81457, gnosis: 100, moonbeam: 1284, mantle: 5000,
      metis: 1088, mode: 34443, taiko: 167000, assetchain: 42420,
    };
    if (token.chainId.toLowerCase() === 'solana') return 1151111081099710;
    return CHAIN_ID_TO_EVM_ID[token.chainId.toLowerCase()] || 1;
  };

  const getLifiTokenAddress = (token: TokenType | null) => {
    if (!token) return '';
    if (token.address) return token.address;
    const sym = token.symbol.toUpperCase();
    const chainIdLower = token.chainId.toLowerCase();
    if (chainIdLower === 'solana' && sym === 'SOL') return '11111111111111111111111111111111';
    const isEvm = [
      'ethereum', 'smartchain', 'bsc', 'base', 'arbitrum', 'polygon', 'optimism', 'avalanchec', 'avalanche',
      'fantom', 'cronos', 'scroll', 'zksync', 'linea', 'celo', 'blast', 'gnosis', 'moonbeam', 'mantle', 'metis', 'mode', 'taiko', 'assetchain'
    ].includes(chainIdLower);
    if (isEvm && (sym === 'ETH' || sym === 'BNB' || sym === 'POL' || sym === 'AVAX' || sym === 'FTM' || sym === 'CRO' || sym === 'RWA')) {
      return '0x0000000000000000000000000000000000000000';
    }
    return token.symbol;
  };

  const getGasTokenSymbol = (token: TokenType | null) => {
    if (!token) return 'ETH';
    const chainIdLower = token.chainId.toLowerCase();
    if (chainIdLower === 'solana') return 'SOL';
    if (chainIdLower === 'smartchain' || chainIdLower === 'bsc' || chainIdLower === 'bnb') return 'BNB';
    if (chainIdLower === 'polygon') return 'POL';
    if (chainIdLower === 'avalanche' || chainIdLower === 'avalanchec') return 'AVAX';
    if (chainIdLower === 'ton' || chainIdLower === 'theopennetwork') return 'TON';
    if (chainIdLower === 'bitcoin') return 'BTC';
    if (chainIdLower === 'ripple' || chainIdLower === 'xrp') return 'XRP';
    if (chainIdLower === 'tron') return 'TRX';
    if (chainIdLower === 'near') return 'NEAR';
    if (chainIdLower === 'fantom') return 'FTM';
    if (chainIdLower === 'sui') return 'SUI';
    if (chainIdLower === 'aptos') return 'APT';
    if (chainIdLower === 'cardano') return 'ADA';
    if (chainIdLower === 'cronos') return 'CRO';
    if (chainIdLower === 'stellar') return 'XLM';
    if (chainIdLower === 'cosmos') return 'ATOM';
    if (chainIdLower === 'celo') return 'CELO';
    if (chainIdLower === 'gnosis') return 'xDAI';
    if (chainIdLower === 'moonbeam') return 'GLMR';
    if (chainIdLower === 'mantle') return 'MNT';
    if (chainIdLower === 'metis') return 'METIS';
    if (chainIdLower === 'sei') return 'SEI';
    if (chainIdLower === 'assetchain') return 'RWA';
    if (chainIdLower === 'klever') return 'KLV';
    return 'ETH';
  };


  const resolveTokenPrice = async (token: TokenType | null, setter: (t: TokenType) => void) => {
    if (!token || token.price > 0) return;

    // 1. If it's a native token in our CoinGecko map, query CoinGecko first
    const symUpper = token.symbol.toUpperCase();
    const geckoId = SYMBOL_TO_COINGECKO_ID[symUpper];
    if (!token.address && geckoId) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[geckoId] && data[geckoId].usd !== undefined) {
            const fetchedPrice = parseFloat(data[geckoId].usd) || 0;
            if (fetchedPrice > 0) {
              setter({ ...token, price: fetchedPrice });
              return;
            }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // 2. Try LI.FI token price API
    const lifiChainIdNum = getLifiChainId(token);
    const tokenAddr = getLifiTokenAddress(token);
    if (tokenAddr) {
      try {
        const res = await fetch(`https://li.quest/v1/token?chain=${lifiChainIdNum}&token=${encodeURIComponent(tokenAddr)}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedPrice = parseFloat(data.priceUSD);
          if (fetchedPrice > 0) {
            setter({ ...token, price: fetchedPrice });
            return;
          }
        }
      } catch (e) { /* ignore */ }
    }

    // 3. Fallback: Try DexScreener
    try {
      const addr = token.address || token.symbol;
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.pairs?.length > 0) {
          const price = parseFloat(data.pairs[0].priceUsd);
          if (price > 0) {
            setter({ ...token, price });
            return;
          }
        }
      }
    } catch (e) { /* ignore */ }

    // 4. Fallback: Try CoinGecko if it has an address but wasn't fetched yet
    if (geckoId) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[geckoId] && data[geckoId].usd !== undefined) {
            const fetchedPrice = parseFloat(data[geckoId].usd) || 0;
            if (fetchedPrice > 0) {
              setter({ ...token, price: fetchedPrice });
              return;
            }
          }
        }
      } catch (e) { /* ignore */ }
    }
  };

  useEffect(() => {
    resolveTokenPrice(payToken, setPayToken);
  }, [payToken?.symbol, payToken?.chainId, payToken?.address]);

  useEffect(() => {
    resolveTokenPrice(receiveToken, setReceiveToken);
  }, [receiveToken?.symbol, receiveToken?.chainId, receiveToken?.address]);

  // Calculate Exchange Rates & Output amount dynamically
  const exchangeRate = useMemo(() => {
    if (!payToken || !receiveToken) return 0;
    const payPrice = parseFloat(payToken.price as any);
    const receivePrice = parseFloat(receiveToken.price as any);
    if (isNaN(payPrice) || isNaN(receivePrice) || payPrice <= 0 || receivePrice <= 0) {
      return 0;
    }
    return payPrice / receivePrice;
  }, [payToken, receiveToken]);

  // True if this pair can be routed via LI.FI (regardless of local price availability)
  const lifiRoutable = useMemo(() => {
    return isLifiSupported(payToken) && isLifiSupported(receiveToken);
  }, [payToken, receiveToken]);

  // True if this pair can use a direct DEX swap fallback (same-chain EVM only)
  const dexRoutable = useMemo(() => {
    if (!payToken || !receiveToken) return false;
    if (payToken.chainId !== receiveToken.chainId) return false; // cross-chain requires LI.FI
    const CHAINS_WITH_DEX_ROUTER = [1, 56, 8453, 42161, 137, 10, 42420];
    const chainId = getLifiChainId(payToken) as number;
    return CHAINS_WITH_DEX_ROUTER.includes(chainId) && !lifiRoutable;
  }, [payToken, receiveToken, lifiRoutable]);

  // The swap is executable if: we have a live LI.FI quote OR the exchange rate is known OR DEX fallback is available
  const canExecuteSwap = useMemo(() => {
    if (!payToken || !receiveToken) return false;
    if (lifiQuote && lifiQuote.estimate) return true;
    if (dexFallbackAvailable && dexQuoteOut) return true;
    if (exchangeRate > 0) return true;
    // If LI.FI supports the chain pair but quote hasn't loaded yet, allow (it's loading)
    if (lifiRoutable && lifiLoading) return true;
    if (dexRoutable && dexFallbackLoading) return true;
    return false;
  }, [payToken, receiveToken, lifiQuote, exchangeRate, lifiRoutable, lifiLoading, dexFallbackAvailable, dexQuoteOut, dexRoutable, dexFallbackLoading]);



  useEffect(() => {
    let isCurrent = true;
    if (!payToken || !receiveToken || !payAmount || parseFloat(payAmount) <= 0) {
      setLifiQuote(null);
      return;
    }

    if (!isLifiSupported(payToken) || !isLifiSupported(receiveToken)) {
      setLifiQuote(null);
      return;
    }

    const fetchQuote = async () => {
      if (!isCurrent) return;
      setLifiLoading(true);
      try {
        const fromChain = getLifiChainId(payToken);
        const toChain = getLifiChainId(receiveToken);
        const fromToken = getLifiTokenAddress(payToken);
        const toToken = getLifiTokenAddress(receiveToken);

        const decimals = getTokenDecimals(payToken);
        const amountInMinDenom = (parseFloat(payAmount) * Math.pow(10, decimals)).toFixed(0);

          const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
          const fromAddress = wallet
            ? (fromChain === 1151111081099710 ? wallet.solanaAddress : wallet.evmAddress)
            : (fromChain === 1151111081099710
              ? 'HN7cABviJcf42y4CgAT1z1u1G8VcxLK28z1KuHE5gZaZ'
              : '0xd8da6bf26964af9d7eed9e03e53415d37aa96045');

          const url = `https://li.quest/v1/quote?fromChain=${fromChain}&toChain=${toChain}&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${amountInMinDenom}&fromAddress=${fromAddress}&integrator=NUM-WALLET&fee=0.001`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isCurrent) {
            setLifiQuote(data);
          }
        }
      } catch (e) {
        console.log('LI.FI Quote API info:', e);
      } finally {
        if (isCurrent) {
          setLifiLoading(false);
        }
      }
    };

    const t = setTimeout(fetchQuote, 600);
    return () => {
      isCurrent = false;
      clearTimeout(t);
    };
  }, [payToken, receiveToken, payAmount]);

  // ─── DEX Fallback Quote Fetcher ─────────────────────────────────────────────
  useEffect(() => {
    let isCurrent = true;
    setDexFallbackAvailable(false);
    setDexQuoteOut(null);

    if (!dexRoutable || !payToken || !receiveToken || !payAmount || parseFloat(payAmount) <= 0) return;

    const fetchDexQuote = async () => {
      if (!isCurrent) return;
      setDexFallbackLoading(true);
      try {
        const chainId = getLifiChainId(payToken) as number;
        const NATIVE_ADDR = '0x0000000000000000000000000000000000000000';
        const tokenInAddr = payToken.address || NATIVE_ADDR;
        const tokenOutAddr = receiveToken.address || NATIVE_ADDR;
        const inDecimals = getTokenDecimals(payToken);
        const outDecimals = getTokenDecimals(receiveToken);
        const amountIn = BigInt((parseFloat(payAmount) * Math.pow(10, inDecimals)).toFixed(0));

        const result = await WalletEngine.getDirectDexQuote(chainId, tokenInAddr, tokenOutAddr, amountIn);
        if (isCurrent && result.success && result.amountOut && result.amountOut > 0n) {
          const outFormatted = (Number(result.amountOut) / Math.pow(10, outDecimals)).toFixed(6);
          setDexQuoteOut(outFormatted);
          setDexFallbackAvailable(true);
        } else if (isCurrent) {
          setDexFallbackAvailable(false);
          setDexQuoteOut(null);
        }
      } catch (e) {
        if (isCurrent) setDexFallbackAvailable(false);
      } finally {
        if (isCurrent) setDexFallbackLoading(false);
      }
    };

    const t = setTimeout(fetchDexQuote, 700);
    return () => { isCurrent = false; clearTimeout(t); };
  }, [payToken, receiveToken, payAmount, dexRoutable]);

  const calculatedReceive = useMemo(() => {
    if (lifiQuote && lifiQuote.estimate && lifiQuote.estimate.toAmount) {
      const decimals = getTokenDecimals(receiveToken);
      const rawAmt = parseFloat(lifiQuote.estimate.toAmount) / Math.pow(10, decimals);
      // LI.FI quote already has the 0.10% integrator fee and solver fees deducted by the API
      return Math.max(0, rawAmt).toFixed(6);
    }
    if (dexQuoteOut) {
      const rawAmt = parseFloat(dexQuoteOut);
      // Deduct 0.15% total fee (0.10% Num Platform Fee + 0.05% Swap Fee)
      const netAmt = rawAmt * 0.9985;
      return Math.max(0, netAmt).toFixed(6);
    }
    if (!payAmount || !exchangeRate || !isFinite(exchangeRate) || isNaN(exchangeRate) || exchangeRate <= 0) return '0.00';
    const rawAmt = parseFloat(payAmount) * exchangeRate;
    // Deduct 0.15% total fee (0.10% Num Platform Fee + 0.05% Swap Fee)
    const netAmt = rawAmt * 0.9985;
    return Math.max(0, netAmt).toFixed(6);
  }, [payAmount, exchangeRate, lifiQuote, receiveToken, dexQuoteOut]);

  const getGasTokenPrice = (token: TokenType | null) => {
    if (!token) return 0;
    const gasSymbol = getGasTokenSymbol(token);
    // Find the gas token in dynamicUnifiedTokens to get its price
    const gasToken = dynamicUnifiedTokens.find(
      t => t.symbol === gasSymbol && t.chainId === token.chainId
    );
    if (gasToken && gasToken.price > 0) {
      return gasToken.price;
    }
    // Fallback prices if not found in user holdings
    if (gasSymbol === 'SOL') return 175;
    if (gasSymbol === 'ETH') return 3450;
    if (gasSymbol === 'BNB') return 580;
    if (gasSymbol === 'POL') return 0.65;
    if (gasSymbol === 'AVAX') return 35;
    if (gasSymbol === 'CRO') return 0.15;
    if (gasSymbol === 'TON') return 7.5;
    if (gasSymbol === 'XRP') return 0.50;
    return 1.0; // default fallback
  };

  const totalNetworkFeeDisplay = useMemo(() => {
    if (!payToken) return '--';

    const gasSymbol = getGasTokenSymbol(payToken);
    const gasPrice = getGasTokenPrice(payToken);
    const gasFeeUsd = 0.0005 * gasPrice;

    let payPrice = parseFloat(payToken.price as any) || 0;
    if (payPrice === 0 && receiveToken && (receiveToken.price as any) > 0 && exchangeRate > 0) {
      payPrice = (parseFloat(receiveToken.price as any) || 0) / exchangeRate;
    }

    const inputAmt = parseFloat(payAmount) || 0;

    if (payPrice > 0) {
      const platformFeeUsd = inputAmt * payPrice * 0.0015;
      const totalFeeUsd = gasFeeUsd + platformFeeUsd;
      return `$${totalFeeUsd.toFixed(2)}`;
    }

    // Fallback if price is not available
    return `0.0005 ${gasSymbol}`;
  }, [payToken, receiveToken, payAmount, exchangeRate, dynamicUnifiedTokens]);

  // Determine active swap route source for display
  const swapRouteSource = useMemo(() => {
    if (lifiQuote && lifiQuote.estimate) return 'LI.FI';
    if (dexFallbackAvailable) return 'DEX (On-Chain)';
    if (lifiRoutable) return 'LI.FI';
    if (dexRoutable) return 'DEX (On-Chain)';
    return null;
  }, [lifiQuote, dexFallbackAvailable, lifiRoutable, dexRoutable]);

  // Derive the action button label & icon from the current operationType
  const buttonLabel = useMemo(() => {
    if (!payToken || !receiveToken) return 'Select Assets';
    if (dexFallbackLoading && !dexQuoteOut) return 'Finding DEX Route...';
    if (lifiLoading && !lifiQuote) return 'Getting Quote...';

    // Insufficient Balance check
    const userBal = parseFloat(payToken.balance) || 0;
    const inputAmt = parseFloat(payAmount) || 0;
    if (inputAmt > userBal) return 'Insufficient Balance';

    // Only block the swap if we can't execute it at all (no quote, no price, not loading)
    if (!canExecuteSwap && !lifiLoading && !dexFallbackLoading) return 'Price Unavailable';
    if (operationType === 'Swap') return 'Swap';
    if (operationType === 'Bridge') return 'Bridge';
    return 'Cross-Chain Swap';
  }, [operationType, payToken, receiveToken, canExecuteSwap, lifiLoading, lifiQuote, dexFallbackLoading, dexQuoteOut, payAmount]);

  const buttonIcon = useMemo(() => {
    if (operationType === 'Swap') return 'refresh-cw' as const;
    if (operationType === 'Bridge') return 'git-merge' as const;
    return 'repeat' as const;
  }, [operationType]);

  // Modal filters
  const networkFilteredTokens = useMemo(() => {
    if (selectedNetworkFilter === null) return dynamicUnifiedTokens;
    return chainTokens;
  }, [selectedNetworkFilter, dynamicUnifiedTokens, chainTokens]);

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return networkFilteredTokens;
    return networkFilteredTokens.filter(
      t =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.chain.toLowerCase().includes(query) ||
        (t.address && t.address.toLowerCase().includes(query))
    );
  }, [searchQuery, networkFilteredTokens]);

  const holdingsList = useMemo(() => {
    return filteredTokens.filter(t => parseFloat(t.balance) > 0);
  }, [filteredTokens]);

  const allAssetsList = useMemo(() => {
    return filteredTokens;
  }, [filteredTokens]);

  const modalListData = useMemo(() => {
    const list = [];
    
    if (isStablesMode) {
      const sq = searchQuery.trim().toLowerCase();
      const filtered = CURATED_STABLECOINS_RAW.filter(s => {
        const matchSearch = sq.length === 0
          || s.symbol.toLowerCase().includes(sq)
          || s.name.toLowerCase().includes(sq)
          || s.chain.toLowerCase().includes(sq)
          || (s.address?.toLowerCase().includes(sq) ?? false);
        const matchNetwork = selectedNetworkFilter === null
          || s.lifiChainId === selectedNetworkFilter;
        return matchSearch && matchNetwork;
      });

      const usdcList = filtered.filter(s => s.symbol === 'USDC');
      const usdtList = filtered.filter(s => s.symbol === 'USDT');
      const cngnList = filtered.filter(s => s.symbol === 'CNGN');

      // User stable holdings
      const userStableHoldings = dynamicUnifiedTokens.filter(t =>
        (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'CNGN') &&
        parseFloat(t.balance) > 0 &&
        (selectedNetworkFilter === null || t.lifiChainId === selectedNetworkFilter)
      );

      if (userStableHoldings.length > 0) {
        list.push({ type: 'header', title: 'YOUR HOLDINGS', key: 'stables-holdings-header' });
        userStableHoldings.forEach((t, i) => {
          list.push({ type: 'token', token: t, key: `stables-holding-${t.symbol}-${t.chainId}-${i}` });
        });
      }

      if (usdcList.length > 0) {
        list.push({ type: 'header', title: 'USDC · USD COIN', key: 'usdc-header' });
        usdcList.forEach((s, i) => {
          list.push({ type: 'stable', stable: s, key: `usdc-${s.chainId}-${i}` });
        });
      }
      if (usdtList.length > 0) {
        list.push({ type: 'header', title: 'USDT · TETHER', key: 'usdt-header' });
        usdtList.forEach((s, i) => {
          list.push({ type: 'stable', stable: s, key: `usdt-${s.chainId}-${i}` });
        });
      }
      if (cngnList.length > 0) {
        list.push({ type: 'header', title: 'CNGN · COMPLIANT NAIRA', key: 'cngn-header' });
        cngnList.forEach((s, i) => {
          list.push({ type: 'stable', stable: s, key: `cngn-${s.chainId}-${i}` });
        });
      }
      if (filtered.length === 0 && userStableHoldings.length === 0) {
        list.push({ type: 'empty', key: 'stables-empty' });
      }
    } else if (loadingTokens) {
      list.push({ type: 'loader', key: 'standard-loader' });
    } else {
      // Standard Mode
      if (holdingsList.length > 0) {
        list.push({ type: 'header', title: 'YOUR HOLDINGS', key: 'holdings-header' });
        holdingsList.forEach((t, i) => {
          list.push({ type: 'token', token: t, key: `holding-${t.symbol}-${t.chainId}-${i}` });
        });
      }

      if (discoveredTokens.length > 0) {
        list.push({ type: 'header', title: 'DISCOVERED TOKENS (ON-CHAIN)', key: 'discovered-header' });
        discoveredTokens.forEach((t, i) => {
          list.push({ type: 'token', token: t, key: `discovered-${t.symbol}-${t.chainId}-${i}` });
        });
      }

      if (allAssetsList.length > 0) {
        list.push({ type: 'header', title: 'ALL SUPPORTED ASSETS', key: 'all-header' });
        allAssetsList.forEach((t, i) => {
          list.push({ type: 'token', token: t, key: `all-${t.symbol}-${t.chainId}-${i}` });
        });
      } else if (holdingsList.length === 0 && discoveredTokens.length === 0) {
        list.push({ type: 'empty', key: 'standard-empty' });
      }
    }

    return list;
  }, [isStablesMode, searchQuery, selectedNetworkFilter, dynamicUnifiedTokens, holdingsList, discoveredTokens, allAssetsList, loadingTokens]);

  const renderModalItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>{item.title}</Text>
        </View>
      );
    }
    if (item.type === 'loader') {
      return (
        <View style={{ paddingVertical: Spacing[8], alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.brand.bright} />
          <Text style={{ color: Colors.text.muted, marginTop: Spacing[3], fontSize: Typography.size.sm }}>
            Loading tokens for chain...
          </Text>
        </View>
      );
    }
    if (item.type === 'empty') {
      if (isStablesMode) {
        return (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Feather name="dollar-sign" size={32} color={isDarkMode ? '#334155' : '#D1D5DB'} />
            <Text style={{ color: isDarkMode ? '#475569' : '#9CA3AF', marginTop: 10, fontSize: 14 }}>
              No stablecoins or holdings match your filter
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.emptyResults}>
          <Feather name="info" size={24} color={Colors.text.muted} />
          <Text style={[styles.emptyText, { color: isDarkMode ? '#94A3B8' : '#4B5563' }]}>
            No supported assets found matching "{searchQuery}"
          </Text>
        </View>
      );
    }
    
    if (item.type === 'stable') {
      const s = item.stable;
      // Look up actual user balance for this stablecoin
      const matchedToken = dynamicUnifiedTokens.find(t =>
        t.symbol.toUpperCase() === s.symbol.toUpperCase() &&
        t.chain.toLowerCase() === s.chain.toLowerCase()
      );
      const userBalance = matchedToken ? matchedToken.balance : '0';
      const balNum = parseFloat(userBalance) || 0;

      const token: TokenType = {
        ...s,
        balance: userBalance,
        icon: 'dollar-sign' as any,
      };
      const chainLogo = getChainLogoById(s.lifiChainId || s.chainId);
      return (
        <TouchableOpacity
          style={[
            styles.dropdownRowItem,
            { borderBottomColor: isDarkMode ? '#C4D4E806' : '#F3F4F6' },
          ]}
          onPress={() => handleSelectToken(token)}
        >
          <View style={styles.dropdownRowLeft}>
            <View style={styles.iconBadgeWrapper}>
              <View style={[styles.tokenIconBox, { backgroundColor: s.color + '20' }]}>
                <ImageWithFallback
                  source={getLogoSource(s.logo)}
                  style={styles.tokenLogoImageMini}
                  fallbackText={s.symbol}
                />
              </View>
              <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                {chainLogo ? (
                  <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={s.chain} />
                ) : (
                  <Text style={styles.networkBadgeText}>{s.networkLetter}</Text>
                )}
              </View>
            </View>
            <View>
              <View style={styles.tokenSymbolRow}>
                <Text style={[styles.dropdownItemSymbol, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  {s.symbol}
                </Text>
                <View style={styles.inlineChainBadge}>
                  <Text style={styles.inlineChainBadgeText}>{s.chain}</Text>
                </View>
              </View>
              <Text style={styles.dropdownItemName}>{s.name}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.dropdownItemBalance, { color: '#26A17B' }]}>
              ${s.price.toFixed(s.price < 0.01 ? 5 : 2)}
            </Text>
            <Text style={styles.dropdownItemUSD}>
              {balNum > 0
                ? `${userBalance} · $${(balNum * s.price).toFixed(2)}`
                : 'per token'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'token') {
      const t = item.token;
      const chainLogo = getChainLogoById(t.lifiChainId || t.chainId);
      const isUserHolding = parseFloat(t.balance) > 0;
      return (
        <TouchableOpacity
          style={[
            styles.dropdownRowItem,
            { borderBottomColor: isDarkMode ? '#C4D4E806' : '#F3F4F6' },
          ]}
          onPress={() => handleSelectToken(t)}
        >
          <View style={styles.dropdownRowLeft}>
            <View style={styles.iconBadgeWrapper}>
              <View style={[styles.tokenIconBox, { backgroundColor: t.color + '15' }]}>
                {t.logo ? (
                  <ImageWithFallback source={getLogoSource(t.logo)} style={styles.tokenLogoImageMini} fallbackText={t.symbol} />
                ) : (
                  <Feather name={t.icon} size={14} color={t.color} />
                )}
              </View>
              <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                {chainLogo ? (
                  <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={t.chain} />
                ) : (
                  <Text style={styles.networkBadgeText}>{t.networkLetter}</Text>
                )}
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
              {t.price > 0
                ? `$${t.price >= 1 ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.price < 0.0001 ? t.price.toExponential(2) : t.price.toFixed(6)}`
                : '--'}
            </Text>
            <Text style={styles.dropdownItemUSD}>
              {isUserHolding
                ? `${t.balance} · $${(parseFloat(t.balance) * t.price).toFixed(2)}`
                : 'per token'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const handleSelectToken = (token: TokenType) => {
    if (token.chainId === 'assetchain' || token.chainId === 'rwa') {
      setAlertConfig({
        visible: true,
        title: 'Unsupported Chain',
        message: 'Asset Chain (RWA) conversions are currently disabled. Please select a token on a supported network.',
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }
    if (!isLifiSupported(token)) {
      setAlertConfig({
        visible: true,
        title: 'Conversion Unsupported',
        message: `Swaps are currently disabled for ${token.chain}. You can only Send or Receive ${token.symbol} on the Num Wallet until it gets supported by LI.FI.`,
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }
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
      setAlertConfig({
        visible: true,
        title: 'Selection Required',
        message: 'Please select both From and To assets before executing transaction.',
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Invalid Amount',
        message: 'Please input a valid amount to convert.',
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }

    const userBal = parseFloat(payToken.balance) || 0;
    const inputAmt = parseFloat(payAmount) || 0;
    if (inputAmt > userBal) {
      setAlertConfig({
        visible: true,
        title: 'Insufficient Balance',
        message: `You do not have enough ${payToken.symbol} to perform this conversion.\n\nYour balance: ${payToken.balance} ${payToken.symbol}\nRequired: ${payAmount} ${payToken.symbol}`,
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }

    // Launch secure security briefing and authorization flow
    setShowAuthModal(true);
  };

  const executeSwapTransaction = async () => {
    if (!payToken || !receiveToken) return;

    // ── DEX Fallback Path ─────────────────────────────────────────────────────
    // When LI.FI quote is unavailable but direct DEX route is available, use it
    if ((!lifiQuote || !lifiQuote.transactionRequest) && dexFallbackAvailable) {
      try {
        const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
        if (!wallet) {
          setAlertConfig({ visible: true, title: 'Decryption Mismatch', message: 'Failed to decrypt wallet. Check your PIN.', icon: 'alert-circle', iconColor: Colors.error });
          return;
        }

        const chainId = getLifiChainId(payToken) as number;
        const NATIVE_ADDR = '0x0000000000000000000000000000000000000000';
        const tokenInAddr = payToken.address || NATIVE_ADDR;
        const tokenOutAddr = receiveToken.address || NATIVE_ADDR;
        const inDecimals = getTokenDecimals(payToken);
        const outDecimals = getTokenDecimals(receiveToken);
        const amountIn = BigInt((parseFloat(payAmount) * Math.pow(10, inDecimals)).toFixed(0));
        // Allow 1% slippage on direct DEX swaps
        const slippagePct = parseFloat(slippage) / 100 || 0.01;
        const minOut = dexQuoteOut
          ? BigInt((parseFloat(dexQuoteOut) * (1 - slippagePct) * 0.9985 * Math.pow(10, outDecimals)).toFixed(0))
          : 0n;

        setAlertConfig({ visible: true, title: 'Executing DEX Swap...', message: `Routing directly via on-chain DEX router on chain ${chainId}.\n\nPlease do not close the app.`, icon: 'clock', iconColor: Colors.brand.bright });

        const dexResult = await WalletEngine.executeDirectDexSwap(
          chainId,
          tokenInAddr,
          tokenOutAddr,
          amountIn,
          minOut,
          wallet.evmAddress,
          transactionPin
        );

        if (!dexResult.success) throw new Error(dexResult.error || 'DEX swap failed.');

        // Import tokens to portfolio if needed
        if (receiveToken.address) {
          const alreadyIn = portfolioAssets.some((a: any) => a.tokens.some((t: any) => t.address?.toLowerCase() === receiveToken.address?.toLowerCase()));
          if (!alreadyIn) importCustomAsset(receiveToken.chain, receiveToken.symbol, receiveToken.name, receiveToken.logo, receiveToken.address, outDecimals, receiveToken.price);
        }

        addTransaction({
          type: operationType,
          fromSymbol: payToken.symbol,
          toSymbol: receiveToken.symbol,
          fromAmount: payAmount,
          toAmount: calculatedReceive,
          chain: payToken.chain,
          status: 'Success',
          txHash: dexResult.signature || '0x...'
        });

        setAlertConfig({
          visible: true,
          title: 'DEX Swap Successful!',
          message: `Swapped ${payAmount} ${payToken.symbol} → ${calculatedReceive} ${receiveToken.symbol}\nvia On-Chain DEX Router\n\nTx Hash: ${dexResult.signature}`,
          icon: 'check-circle',
          iconColor: '#10B981',
        });
        setPayAmount('');
        setPayToken(null);
        setReceiveToken(null);
        return;
      } catch (err: any) {
        setAlertConfig({ visible: true, title: 'DEX Swap Failed', message: err?.message || 'On-chain DEX swap was rejected or failed.', icon: 'alert-circle', iconColor: Colors.error });
        return;
      }
    }

    // ── LI.FI Path ────────────────────────────────────────────────────────────
    if (!lifiQuote || !lifiQuote.transactionRequest) {
      setAlertConfig({
        visible: true,
        title: 'No Route Available',
        message: 'No swap route found via LI.FI or direct DEX. Try a different token pair or check your network.',
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
      return;
    }

    try {
      // 1. Decrypt user keys to authorize signing
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) {
        setAlertConfig({
          visible: true,
          title: 'Decryption Mismatch',
          message: 'Failed to decrypt wallet keys. Please check your transaction PIN.',
          icon: 'alert-circle',
          iconColor: Colors.error,
        });
        return;
      }

      let txResult: { success: boolean; signature?: string; error?: string };
      const fromChainId = Number(getLifiChainId(payToken));

      // 2. Routing logic: Solana vs EVM
      if (payToken.chainId.toLowerCase() === 'solana') {
        // Execute Solana swap transaction request
        const txDataBase64 = lifiQuote.transactionRequest.data;
        if (!txDataBase64) {
          throw new Error('Solana swap transaction data payload is missing.');
        }

        // Inform user on loading UI or alert
        setAlertConfig({
          visible: true,
          title: 'Signing Solana Swap...',
          message: 'Transmitting signature securely on-chain to Solana mainnet.',
          icon: 'clock',
          iconColor: Colors.brand.bright,
        });

        txResult = await WalletEngine.sendSolanaTransactionRequest(txDataBase64, transactionPin);
      } else {
        // EVM Swap Logic
        const spenderAddress = lifiQuote.estimate?.approvalAddress || lifiQuote.transactionRequest.to;
        const fromTokenAddress = getLifiTokenAddress(payToken);

        // Check if ERC-20 approval is required (non-native EVM token)
        const isNativeEvm = fromTokenAddress === '0x0000000000000000000000000000000000000000';
        if (!isNativeEvm) {
          const decimals = getTokenDecimals(payToken);
          const requiredAmount = BigInt((parseFloat(payAmount) * Math.pow(10, decimals)).toFixed(0));

          setAlertConfig({
            visible: true,
            title: 'Verifying ERC-20 Allowance...',
            message: `Verifying allowance for spender: ${spenderAddress}`,
            icon: 'clock',
            iconColor: Colors.brand.bright,
          });

          const currentAllowance = await WalletEngine.getERC20Allowance(
            fromChainId,
            fromTokenAddress,
            wallet.evmAddress,
            spenderAddress
          );

          if (currentAllowance < requiredAmount) {
            setAlertConfig({
              visible: true,
              title: 'ERC-20 Approval Required',
              message: `Submitting approval request for ${payToken.symbol} to the blockchain...\n\nPlease do not close the app.`,
              icon: 'clock',
              iconColor: Colors.brand.bright,
            });

            const approveResult = await WalletEngine.sendERC20Approve(
              fromChainId,
              fromTokenAddress,
              spenderAddress,
              requiredAmount.toString(),
              transactionPin
            );

            if (!approveResult.success) {
              throw new Error(`Approval rejected: ${approveResult.error}`);
            }
          }
        }

        // Execute EVM swap transaction request
        setAlertConfig({
          visible: true,
          title: 'Executing EVM Swap...',
          message: `Sending transaction request to chain ID ${fromChainId}...`,
          icon: 'clock',
          iconColor: Colors.brand.bright,
        });

        txResult = await WalletEngine.sendEVMTransactionRequest(
          fromChainId,
          lifiQuote.transactionRequest.to,
          lifiQuote.transactionRequest.data,
          lifiQuote.transactionRequest.value,
          transactionPin
        );
      }

      if (!txResult.success) {
        throw new Error(txResult.error || 'The blockchain network rejected the transaction.');
      }

      // Import custom/discovered tokens to portfolio holds if they are not already imported
      if (receiveToken && receiveToken.address) {
        const isAlreadyInPortfolio = portfolioAssets.some((asset: any) =>
          asset.tokens.some((token: any) => token.address && token.address.toLowerCase() === receiveToken.address?.toLowerCase())
        );
        if (!isAlreadyInPortfolio) {
          importCustomAsset(
            receiveToken.chain,
            receiveToken.symbol,
            receiveToken.name,
            receiveToken.logo,
            receiveToken.address,
            getTokenDecimals(receiveToken),
            receiveToken.price
          );
        }
      }

      if (payToken && payToken.address) {
        const isAlreadyInPortfolio = portfolioAssets.some((asset: any) =>
          asset.tokens.some((token: any) => token.address && token.address.toLowerCase() === payToken.address?.toLowerCase())
        );
        if (!isAlreadyInPortfolio) {
          importCustomAsset(
            payToken.chain,
            payToken.symbol,
            payToken.name,
            payToken.logo,
            payToken.address,
            getTokenDecimals(payToken),
            payToken.price
          );
        }
      }

      let txType = operationType;
      if (params.isMemeBuy === 'true') {
        txType = 'Meme Buy';
      } else if (params.isMemeSell === 'true') {
        txType = 'Meme Sell';
      }

      addTransaction({
        type: txType,
        fromSymbol: payToken.symbol,
        toSymbol: receiveToken.symbol,
        fromAmount: payAmount,
        toAmount: calculatedReceive,
        chain: payToken.chain === receiveToken.chain ? payToken.chain : `${payToken.chain} → ${receiveToken.chain}`,
        status: 'Success',
        txHash: txResult.signature || '0x...'
      });

      setAlertConfig({
        visible: true,
        title: 'Transaction Authorized!',
        message: `Successfully routed via the Num Wallet Engine:\n\nType: ${operationType}\nRoute: ${payAmount} ${payToken.symbol} (${payToken.chain}) → ${calculatedReceive} ${receiveToken.symbol} (${receiveToken.chain})\n\nTx Hash: ${txResult.signature}`,
        icon: 'check-circle',
        iconColor: '#10B981',
      });
      setPayAmount('');
      setPayToken(null);
      setReceiveToken(null);

    } catch (err: any) {
      console.log('On-chain swap execution error:', err);
      setAlertConfig({
        visible: true,
        title: 'Transaction Failed',
        message: err?.message || 'On-chain swap transaction rejected or execution failed.',
        icon: 'alert-circle',
        iconColor: Colors.error,
      });
    }
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
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionIconButton}
                onPress={() => setSettingsModalVisible(true)}
              >
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
                      <ImageWithFallback 
                        source={getLogoSource(payToken.logo)} 
                        style={styles.tokenLogoImage} 
                        fallbackText={payToken.symbol}
                      />
                    ) : (
                      <Feather name={payToken ? payToken.icon : 'help-circle'} size={16} color={payToken ? payToken.color : '#475569'} />
                    )}
                  </View>
                  {(() => {
                    const chainLogo = payToken ? getChainLogoById(payToken.lifiChainId || payToken.chainId) : null;
                    return (
                      <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                        {chainLogo ? (
                          <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={payToken ? payToken.chain : '?'} />
                        ) : (
                          <Text style={styles.networkBadgeText}>{payToken ? payToken.networkLetter : '?'}</Text>
                        )}
                      </View>
                    );
                  })()}
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
                      <ImageWithFallback source={getLogoSource(receiveToken.logo)} style={styles.tokenLogoImage} fallbackText={receiveToken.symbol} />
                    ) : (
                      <Feather name={receiveToken ? receiveToken.icon : 'help-circle'} size={16} color={receiveToken ? receiveToken.color : '#475569'} />
                    )}
                  </View>
                  {(() => {
                    const chainLogo = receiveToken ? getChainLogoById(receiveToken.lifiChainId || receiveToken.chainId) : null;
                    return (
                      <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                        {chainLogo ? (
                          <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={receiveToken ? receiveToken.chain : '?'} />
                        ) : (
                          <Text style={styles.networkBadgeText}>{receiveToken ? receiveToken.networkLetter : '?'}</Text>
                        )}
                      </View>
                    );
                  })()}
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
                    <ImageWithFallback source={getLogoSource(payToken.logo)} style={styles.tokenLogoImageMini} fallbackText={payToken.symbol} />
                  ) : (
                    <Feather name={payToken ? payToken.icon : 'help-circle'} size={14} color={payToken ? payToken.color : '#475569'} />
                  )}
                </View>
                {(() => {
                  const chainLogo = payToken ? getChainLogoById(payToken.lifiChainId || payToken.chainId) : null;
                  return (
                    <View style={[styles.networkBadgeMini, { backgroundColor: '#111827' }]}>
                      {chainLogo ? (
                        <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={payToken ? payToken.chain : '?'} />
                      ) : (
                        <Text style={styles.networkBadgeTextMini}>{payToken ? payToken.networkLetter : '?'}</Text>
                      )}
                    </View>
                  );
                })()}
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
                ≈ ${payToken && payToken.price > 0 && isFinite(payToken.price) ? (parseFloat(payAmount || '0') * payToken.price).toFixed(2) : '0.00'} USD
              </Text>

              {/* Percentage shortcut buttons */}
              <View style={styles.presetsRow}>
                <TouchableOpacity 
                  onPress={() => handlePresetSelect(0.25)} 
                  disabled={!payToken} 
                  style={[
                    styles.presetPill, 
                    { backgroundColor: isDarkMode ? '#1E1E38' : '#E2E8F0' },
                    payToken && styles.presetPillActive
                  ]}
                >
                  <Text style={[
                    styles.presetPillText, 
                    { color: isDarkMode ? '#94A3B8' : '#475569' },
                    payToken && styles.presetPillTextActive
                  ]}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handlePresetSelect(0.50)} 
                  disabled={!payToken} 
                  style={[
                    styles.presetPill, 
                    { backgroundColor: isDarkMode ? '#1E1E38' : '#E2E8F0' },
                    payToken && styles.presetPillActive
                  ]}
                >
                  <Text style={[
                    styles.presetPillText, 
                    { color: isDarkMode ? '#94A3B8' : '#475569' },
                    payToken && styles.presetPillTextActive
                  ]}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handlePresetSelect(0.75)} 
                  disabled={!payToken} 
                  style={[
                    styles.presetPill, 
                    { backgroundColor: isDarkMode ? '#1E1E38' : '#E2E8F0' },
                    payToken && styles.presetPillActive
                  ]}
                >
                  <Text style={[
                    styles.presetPillText, 
                    { color: isDarkMode ? '#94A3B8' : '#475569' },
                    payToken && styles.presetPillTextActive
                  ]}>75%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleMaxSelect} 
                  disabled={!payToken} 
                  style={[
                    styles.presetPill, 
                    { backgroundColor: isDarkMode ? '#1E1E38' : '#E2E8F0' },
                    payToken && styles.presetPillActive
                  ]}
                >
                  <Text style={[
                    styles.presetPillText, 
                    { color: isDarkMode ? '#94A3B8' : '#475569' },
                    payToken && styles.presetPillTextActive
                  ]}>MAX</Text>
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
                    <ImageWithFallback source={getLogoSource(receiveToken.logo)} style={styles.tokenLogoImageMini} fallbackText={receiveToken.symbol} />
                  ) : (
                    <Feather name={receiveToken ? receiveToken.icon : 'help-circle'} size={14} color={receiveToken ? receiveToken.color : '#475569'} />
                  )}
                </View>
                {(() => {
                  const chainLogo = receiveToken ? getChainLogoById(receiveToken.lifiChainId || receiveToken.chainId) : null;
                  return (
                    <View style={[styles.networkBadgeMini, { backgroundColor: '#111827' }]}>
                      {chainLogo ? (
                        <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={receiveToken ? receiveToken.chain : '?'} />
                      ) : (
                        <Text style={styles.networkBadgeTextMini}>{receiveToken ? receiveToken.networkLetter : '?'}</Text>
                      )}
                    </View>
                  );
                })()}
              </View>

              {/* Computed Amount Display */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {lifiLoading && (
                  <ActivityIndicator color={Colors.brand.bright} size="small" style={{ marginRight: 10 }} />
                )}
                <Text style={[styles.hugeDisplay, textStyle, (!payAmount || !receiveToken) && styles.dimDisplay]}>
                  {calculatedReceive}
                </Text>
              </View>

              <Text style={styles.receiveSymbol}>
                {receiveToken ? receiveToken.symbol : ''}
              </Text>
            </View>

            <View style={styles.receiveFooterRow}>
              <Text style={styles.usdSubtext}>
                ≈ ${receiveToken && receiveToken.price > 0 && isFinite(receiveToken.price) ? (parseFloat(calculatedReceive) * receiveToken.price).toFixed(2) : '0.00'} USD
              </Text>
            </View>
          </View>

          {/* BRANDED RATES CARD (Completely hidden aggregator info) */}
          <View style={[styles.summaryBox, { borderColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exchange Rate</Text>
              <Text style={[styles.summaryVal, textStyle]}>
                {(() => {
                  // Prefer LI.FI quote rate if available
                  if (lifiQuote?.estimate?.toAmountMin && lifiQuote?.estimate?.fromAmount) {
                    const fromDec = getTokenDecimals(payToken);
                    const toDec = getTokenDecimals(receiveToken);
                    const fromAmt = parseFloat(lifiQuote.estimate.fromAmount) / Math.pow(10, fromDec);
                    const toAmt = parseFloat(lifiQuote.estimate.toAmountMin) / Math.pow(10, toDec);
                    if (fromAmt > 0) {
                      return `1 ${payToken?.symbol || '--'} ≈ ${(toAmt / fromAmt).toFixed(6)} ${receiveToken?.symbol || '--'}`;
                    }
                  }
                  // Use DEX quote rate
                  if (dexQuoteOut && payAmount && parseFloat(payAmount) > 0) {
                    const rate = parseFloat(dexQuoteOut) / parseFloat(payAmount);
                    return `1 ${payToken?.symbol || '--'} ≈ ${rate.toFixed(6)} ${receiveToken?.symbol || '--'}`;
                  }
                  if (exchangeRate > 0) {
                    return `1 ${payToken?.symbol || '--'} ≈ ${exchangeRate.toFixed(6)} ${receiveToken?.symbol || '--'}`;
                  }
                  if (lifiLoading || dexFallbackLoading) return 'Fetching live rate...';
                  return 'Rate Unavailable';
                })()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network Fee</Text>
              <Text style={[styles.summaryVal, textStyle]}>
                {totalNetworkFeeDisplay}
              </Text>
            </View>
            {/* Route Provider indicator */}
            {swapRouteSource && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Route Provider</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={[
                    {
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: swapRouteSource === 'LI.FI' ? '#10B981' : '#F59E0B'
                    }
                  ]} />
                  <Text style={[styles.summaryVal, { color: swapRouteSource === 'LI.FI' ? '#10B981' : '#F59E0B' }]}>
                    {swapRouteSource === 'LI.FI' ? 'Num × LI.FI Aggregator' : 'On-Chain DEX Router'}
                  </Text>
                </View>
              </View>
            )}
            {/* Min. Receive */}
            {(lifiQuote?.estimate?.toAmountMin || dexQuoteOut) && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Min. Receive</Text>
                <Text style={[styles.summaryVal, textStyle]}>
                  {lifiQuote?.estimate?.toAmountMin
                    ? `${(parseFloat(lifiQuote.estimate.toAmountMin) / Math.pow(10, getTokenDecimals(receiveToken))).toFixed(6)} ${receiveToken?.symbol || ''}`
                    : dexQuoteOut
                      ? `${(parseFloat(dexQuoteOut) * (1 - (parseFloat(slippage) / 100 || 0.01)) * 0.9985).toFixed(6)} ${receiveToken?.symbol || ''}`
                      : '--'
                  }
                </Text>
              </View>
            )}
          </View>

          {/* WEBACY TOKEN DUE DILIGENCE CARD */}
          {receiveToken && receiveToken.address && (!tokenRisk || !tokenRisk.unsupportedToken) && (
            <View style={[styles.webacyCard, { backgroundColor: isDarkMode ? '#131326' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E5E7EB' }]}>
              <View style={styles.webacyCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={16} color="#04D9C4" />
                  <Text style={[styles.webacyCardTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Webacy Due Diligence Scorecard</Text>
                </View>
                {tokenRisk && (
                  <View style={[styles.webacyBadge, { backgroundColor: tokenRisk.unsupportedToken ? 'rgba(148,163,184,0.1)' : tokenRisk.isLive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }]}>
                    <Text style={[styles.webacyBadgeText, { color: tokenRisk.unsupportedToken ? '#94A3B8' : tokenRisk.isLive ? '#10B981' : '#94A3B8' }]}>
                      {tokenRisk.unsupportedToken ? 'UNSUPPORTED' : tokenRisk.isLive ? 'WEBACY LIVE' : 'WEBACY SANDBOX'}
                    </Text>
                  </View>
                )}
              </View>

              {loadingWebacyToken ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#04D9C4" />
                  <Text style={{ fontSize: 11, color: Colors.text.muted, marginTop: 6 }}>Auditing smart contract & buyer concentration...</Text>
                </View>
              ) : tokenRisk ? (
                tokenRisk.unsupportedToken ? (
                  <View style={styles.ddWarningBox}>
                    <Feather name="alert-triangle" size={14} color="#EF4444" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ddWarningTitle}>Cannot find token score</Text>
                      <Text style={[styles.ddWarningDesc, { marginTop: 4 }]}>
                        This token is not supported or indexed by Webacy or GoPlus security registry. Proceed with caution.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {(() => {
                      let unifiedRisk = tokenRisk.overallRisk || 0;
                      if (holderAnalysis) {
                        if (holderAnalysis.top10Concentration > 80) {
                          unifiedRisk = Math.max(unifiedRisk, 75);
                        } else if (holderAnalysis.top10Concentration > 60) {
                          unifiedRisk = Math.max(unifiedRisk, 45);
                        }
                        if (holderAnalysis.sniperCount > 3 || holderAnalysis.isCoordinatedBuy) {
                          unifiedRisk = Math.max(unifiedRisk, 40);
                        }
                      }
                      const score = Math.max(0, 100 - unifiedRisk);
                      const statusText = score < 30 ? 'High Risk' : score < 60 ? 'Medium Risk' : 'Low Risk';
                      const statusColor = score < 30 ? '#EF4444' : score < 60 ? '#F59E0B' : '#10B981';
                      
                      return (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text.muted }}>Security Rating</Text>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: statusColor }}>
                            {score}/100 ({statusText})
                          </Text>
                        </View>
                      );
                    })()}

                    <View style={styles.webacyGrid}>
                      <View style={styles.webacyGridItem}>
                        <Text style={styles.gridLabel}>HoneyPot Check</Text>
                        <Text style={[styles.gridVal, { color: tokenRisk.honeyPot ? '#EF4444' : '#10B981' }]}>
                          {tokenRisk.honeyPot ? 'HoneyPot' : 'Passed'}
                        </Text>
                      </View>
                      <View style={styles.webacyGridItem}>
                        <Text style={styles.gridLabel}>LP Pool Key</Text>
                        <Text style={[styles.gridVal, { color: tokenRisk.lpLocked ? '#10B981' : '#EF4444' }]}>
                          {tokenRisk.lpLocked ? 'Locked' : 'Unlocked'}
                        </Text>
                      </View>
                      <View style={styles.webacyGridItem}>
                        <Text style={styles.gridLabel}>Top 10 Holders</Text>
                        <Text style={[styles.gridVal, { color: (holderAnalysis?.top10Concentration > 60) ? '#EF4444' : (isDarkMode ? '#FFFFFF' : '#111827') }]}>
                          {holderAnalysis ? `${holderAnalysis.top10Concentration.toFixed(1)}%` : '--'}
                        </Text>
                      </View>
                      <View style={styles.webacyGridItem}>
                        <Text style={styles.gridLabel}>Sniper/Bundlers</Text>
                        <Text style={[styles.gridVal, { color: (holderAnalysis?.sniperCount > 0) ? '#F59E0B' : (isDarkMode ? '#FFFFFF' : '#111827') }]}>
                          {holderAnalysis ? `${holderAnalysis.sniperCount}s / ${holderAnalysis.bundlerCount}b` : '--'}
                        </Text>
                      </View>
                    </View>

                    {(tokenRisk.honeyPot || !tokenRisk.lpLocked || holderAnalysis?.top10Concentration > 60 || holderAnalysis?.sniperCount > 0) && (
                      <View style={styles.ddWarningBox}>
                        <Feather name="alert-triangle" size={14} color="#EF4444" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ddWarningTitle}>Critical Trading Flags Detected</Text>
                          <View style={{ gap: 2, marginTop: 2 }}>
                            {tokenRisk.honeyPot && <Text style={styles.ddWarningDesc}>• Token is an active Honeypot (standard users blocked from selling).</Text>}
                            {!tokenRisk.lpLocked && <Text style={styles.ddWarningDesc}>• Liquidity pool tokens are unlocked (deployer can rug-pull liquidity).</Text>}
                            {holderAnalysis?.top10Concentration > 60 && <Text style={styles.ddWarningDesc}>• High concentration: Top 10 wallets control over 60% of supply.</Text>}
                            {holderAnalysis?.sniperCount > 0 && <Text style={styles.ddWarningDesc}>• Coordinated Snipe launch detected (early buyers are sniper bots).</Text>}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )
              ) : (
                <Text style={{ fontSize: 11, color: Colors.text.muted, textAlign: 'center', marginVertical: 10 }}>Select a target token to run Webacy due diligence scan.</Text>
              )}
            </View>
          )}

          {/* ACTION EXCHANGE BUTTON */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.exchangeBtnWrap} 
              onPress={handleConvert} 
              activeOpacity={0.85}
              disabled={
                !payToken || 
                !receiveToken || 
                (!canExecuteSwap && !lifiLoading) || 
                (parseFloat(payAmount || '0') > (parseFloat(payToken?.balance || '0') || 0))
              }
            >
              <LinearGradient
                colors={
                  payToken && 
                  receiveToken && 
                  (canExecuteSwap || lifiLoading) && 
                  (parseFloat(payAmount || '0') <= (parseFloat(payToken?.balance || '0') || 0))
                    ? [Colors.brand.deep, Colors.brand.bright]
                    : ['#2D2D44', '#1E1E30']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exchangeBtn}
              >
                <Text style={styles.exchangeBtnText}>{buttonLabel}</Text>
                {(canExecuteSwap || lifiLoading) && 
                 (parseFloat(payAmount || '0') <= (parseFloat(payToken?.balance || '0') || 0)) && 
                 <Feather name={buttonIcon} size={16} color="#FFFFFF" />}
              </LinearGradient>
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
          setIsStablesMode(false);
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
                  setIsStablesMode(false);
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
                {dynamicSupportedNetworks.map(net => {
                  const isActive = selectedNetworkFilter === net.id;
                  const activeBorderColor = isDarkMode ? '#FFFFFF' : Colors.brand.bright;
                  
                  return (
                    <TouchableOpacity
                      key={net.id !== null ? `net-${net.id}` : 'net-all'}
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
                          <ImageWithFallback source={getLogoSource(net.logo)} style={styles.networkCircleLogo} fallbackText={net.name} />
                        ) : net.pack === 'Ionicons' ? (
                          <Ionicons name={net.icon} size={16} color={net.color} />
                        ) : (
                          <Feather name={net.icon} size={16} color={net.color} />
                        )}
                      </View>
                      <View style={[styles.networkLetterBadge, { backgroundColor: '#111827' }]}>
                        {net.logo ? (
                          <ImageWithFallback source={getLogoSource(net.logo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={net.letter} />
                        ) : (
                          <Text style={styles.networkLetterBadgeText}>{net.letter}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Assets / Stables Toggle */}
            <View style={{
              flexDirection: 'row',
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6',
              borderRadius: 12,
              padding: 3,
            }}>
              <TouchableOpacity
                onPress={() => setIsStablesMode(false)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: !isStablesMode
                    ? (isDarkMode ? '#1E1E3A' : '#FFFFFF')
                    : 'transparent',
                  shadowColor: !isStablesMode ? Colors.brand.bright : 'transparent',
                  shadowOpacity: !isStablesMode ? 0.25 : 0,
                  shadowRadius: 6,
                  elevation: !isStablesMode ? 3 : 0,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: !isStablesMode
                    ? (isDarkMode ? '#FFFFFF' : '#111827')
                    : (isDarkMode ? '#475569' : '#9CA3AF'),
                  letterSpacing: 0.3,
                }}>Assets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsStablesMode(true)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: isStablesMode
                    ? (isDarkMode ? '#1E1E3A' : '#FFFFFF')
                    : 'transparent',
                  shadowColor: isStablesMode ? '#26A17B' : 'transparent',
                  shadowOpacity: isStablesMode ? 0.25 : 0,
                  shadowRadius: 6,
                  elevation: isStablesMode ? 3 : 0,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isStablesMode
                    ? '#26A17B'
                    : (isDarkMode ? '#475569' : '#9CA3AF'),
                  letterSpacing: 0.3,
                }}>Stables</Text>
              </TouchableOpacity>
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
                {searchingDiscovery && (
                  <ActivityIndicator size="small" color={Colors.brand.bright} style={{ marginRight: 6 }} />
                )}
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Modal Token List */}
            <FlatList
              data={modalListData}
              keyExtractor={(item) => item.key}
              renderItem={renderModalItem}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              style={{ flex: 1 }}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>



      {/* SETTINGS MODAL */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#080814' : '#FFFFFF' }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="sliders" size={18} color={Colors.brand.bright} />
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                Transaction Settings
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSettingsModalVisible(false)}
              style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}
            >
              <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.settingsContentContainer}>
            {/* Slippage tolerance section */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsSectionHeader}>
                <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  Slippage Tolerance
                </Text>
                <Text style={styles.settingsSectionVal}>
                  {customSlippage ? `${customSlippage}%` : `${slippage}%`}
                </Text>
              </View>
              <Text style={styles.settingsDescription}>
                Your transaction will revert if the price changes unfavorably by more than this percentage.
              </Text>

              <View style={styles.slippagePresetsRow}>
                {['0.1', '0.5', '1.0', '3.0'].map(preset => {
                  const isSelected = !customSlippage && slippage === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.slippagePresetBtn,
                        isSelected && { backgroundColor: Colors.brand.bright, borderColor: Colors.brand.bright },
                        { borderColor: isDarkMode ? '#1E1E38' : '#CBD5E1' }
                      ]}
                      onPress={() => {
                        setSlippage(preset);
                        setCustomSlippage('');
                      }}
                    >
                      <Text style={[styles.slippagePresetText, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {preset}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <View
                  style={[
                    styles.customSlippageInputContainer,
                    customSlippage !== '' && { borderColor: Colors.brand.bright },
                    { backgroundColor: isDarkMode ? '#0A0A18' : '#F3F4F6', borderColor: isDarkMode ? '#1E1E38' : '#CBD5E1' }
                  ]}
                >
                  <TextInput
                    style={[styles.customSlippageInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                    placeholder="Custom"
                    placeholderTextColor={isDarkMode ? '#475569' : '#9CA3AF'}
                    keyboardType="numeric"
                    value={customSlippage}
                    onChangeText={(val) => {
                      setCustomSlippage(val);
                      if (val) {
                        setSlippage(val);
                      } else {
                        setSlippage('0.5'); // fallback
                      }
                    }}
                  />
                  <Text style={styles.customSlippagePercentSign}>%</Text>
                </View>
              </View>
            </View>

            {/* Gas Speed priority section */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsSectionHeader}>
                <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  Gas Priority (Speed)
                </Text>
                <Text style={[styles.settingsSectionVal, { color: Colors.brand.bright }]}>
                  {gasPriority}
                </Text>
              </View>
              <Text style={styles.settingsDescription}>
                Higher priority increases the network fee to speed up verification under network congestion.
              </Text>

              <View style={styles.gasPriorityContainer}>
                {[
                  { level: 'Standard', time: '~ 2 mins', fee: 'Low' },
                  { level: 'Fast', time: '~ 30 secs', fee: 'Medium' },
                  { level: 'Instant', time: '< 10 secs', fee: 'High' }
                ].map(item => {
                  const isSelected = gasPriority === item.level;
                  return (
                    <TouchableOpacity
                      key={item.level}
                      style={[
                        styles.gasPriorityBtn,
                        isSelected && { borderColor: Colors.brand.bright, backgroundColor: isDarkMode ? '#0D0D26' : '#F0F9FF' },
                        { borderColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }
                      ]}
                      onPress={() => setGasPriority(item.level)}
                    >
                      <View style={styles.gasPriorityRadioRow}>
                        <View
                          style={[
                            styles.gasPriorityRadioOuter,
                            { borderColor: isDarkMode ? '#475569' : '#CBD5E1' },
                            isSelected && { borderColor: Colors.brand.bright }
                          ]}
                        >
                          {isSelected && <View style={[styles.gasPriorityRadioInner, { backgroundColor: Colors.brand.bright }]} />}
                        </View>
                        <Text style={[styles.gasPriorityLabel, { color: isDarkMode ? '#FFFFFF' : '#111827' }, isSelected && { fontWeight: '700' }]}>
                          {item.level}
                        </Text>
                      </View>

                      <View style={styles.gasPriorityDetails}>
                        <Text style={styles.gasPriorityDetailText}>Time: {item.time}</Text>
                        <Text style={styles.gasPriorityDetailText}>Fee: {item.fee}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom routing option or additional premium setting */}
            <View style={[styles.settingsSection, { borderBottomWidth: 0 }]}>
              <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                Advanced Routing
              </Text>
              <Text style={styles.settingsDescription}>
                Aggregate DEX paths dynamically using the LI.FI protocol to find the absolute lowest swap rate.
              </Text>
              <View style={[styles.routingToggleBox, { backgroundColor: isDarkMode ? '#0D0D1F' : '#F9FAFB', borderColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.routingToggleTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Multi-Path Hop</Text>
                  <Text style={styles.routingToggleDesc}>Splits routes across different liquidity pools (enabled by default).</Text>
                </View>
                <View style={[styles.activeIndicatorBadge, { backgroundColor: Colors.brand.bright + '15' }]}>
                  <Text style={[styles.activeIndicatorText, { color: Colors.brand.bright }]}>Active</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action button at bottom of settings */}
          <View style={[styles.settingsFooter, { borderTopColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}>
            <TouchableOpacity
              onPress={() => setSettingsModalVisible(false)}
              style={styles.settingsSaveBtnWrap}
            >
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.settingsSaveBtn}
              >
                <Text style={styles.settingsSaveBtnText}>Save Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <TransactionConfirmModal
        visible={showAuthModal}
        title={operationType === 'Bridge' ? 'Authorize Bridge Signature' : 'Authorize Swap Signature'}
        details={[
          { label: 'Pay Asset', value: `${payAmount} ${payToken?.symbol} (${payToken?.chain})` },
          { label: 'Receive Asset', value: `${calculatedReceive} ${receiveToken?.symbol} (${receiveToken?.chain})` },
          { label: 'Network Route', value: payToken?.chain === receiveToken?.chain ? `${payToken?.chain} DEX aggregator` : `Cross-chain via LI.FI` },
          { label: 'Max Slippage', value: `${slippage}%` },
          { label: 'Network Fee', value: totalNetworkFeeDisplay }
        ]}        securityTips={[
          "Verify the tokens and output amount. Swaps cannot be reverted on-chain.",
          "Webacy audited contract route: Verified secure liquidity aggregator pool.",
          "MPC cryptography requires device biometric signature approval."
        ]}
        onConfirm={executeSwapTransaction}
        onCancel={() => setShowAuthModal(false)}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
  // Settings & History specific styles
  settingsContentContainer: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: 40,
  },
  settingsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
    paddingVertical: 18,
    gap: 8,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsSectionVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  settingsDescription: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  slippagePresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  slippagePresetBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slippagePresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  customSlippageInputContainer: {
    flex: 2,
    height: 38,
    borderRadius: Radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  customSlippageInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  customSlippagePercentSign: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 2,
  },
  gasPriorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  gasPriorityBtn: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  gasPriorityRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gasPriorityRadioOuter: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gasPriorityRadioInner: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  gasPriorityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  gasPriorityDetails: {
    gap: 2,
  },
  gasPriorityDetailText: {
    fontSize: 9,
    color: '#64748B',
  },
  routingToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  routingToggleTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  routingToggleDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  activeIndicatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  activeIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  settingsFooter: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing[5],
    paddingVertical: 14,
  },
  settingsSaveBtnWrap: {
    width: '100%',
  },
  settingsSaveBtn: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyItemCard: {
    marginHorizontal: Spacing[5],
    marginTop: 12,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
  },
  historyRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTypeBadge: {
    backgroundColor: Colors.brand.bright + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  historyTypeBadgeText: {
    color: Colors.brand.bright,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  historyDateText: {
    fontSize: 10,
    color: '#64748B',
  },
  historyRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTokenCol: {
    flex: 1,
  },
  historyAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyChainLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
  },
  historyRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetailLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyTxHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00000020',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.xs,
    marginTop: 2,
  },
  historyHashText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#64748B',
  },
  historyCopyBtn: {
    padding: 2,
  },
  webacyCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  webacyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  webacyCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  webacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  webacyBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  webacyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  webacyGridItem: {
    width: '48%',
    backgroundColor: 'rgba(128,128,128,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(128,128,128,0.1)',
    borderRadius: Radius.md,
    padding: Spacing[2],
    gap: 2,
  },
  gridLabel: {
    color: '#8888AA',
    fontSize: 9,
    fontWeight: '700',
  },
  gridVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  ddWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
    borderWidth: 0.5,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginTop: 4,
  },
  ddWarningTitle: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  ddWarningDesc: {
    color: '#EF4444',
    fontSize: 10,
    lineHeight: 14,
  },
});

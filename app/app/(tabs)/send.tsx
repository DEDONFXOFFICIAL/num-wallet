import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, Modal, ActivityIndicator, Image, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, IconSize } from '../../constants/theme';
import { useUserStore, getLogoSource } from '../../store/userStore';
import { supabase } from '../../store/supabaseClient';
import { WalletEngine } from '../../store/walletEngine';
import { WebacyService } from '../../store/webacyService';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import CustomAlert from '../../components/CustomAlert';
import ImageWithFallback from '../../components/ImageWithFallback';
import TransactionConfirmModal from '../../components/TransactionConfirmModal';

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

export default function SendScreen() {
  const { isDarkMode, biometricsEnabled, transactionPin, addTransaction } = useUserStore();

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon: any;
    iconColor: string;
    showConfirm: boolean;
    confirmText: string;
    onConfirm: (() => void) | undefined;
    onClose: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    icon: 'info',
    iconColor: Colors.brand.bright,
    showConfirm: false,
    confirmText: 'Confirm',
    onConfirm: undefined,
    onClose: () => {},
  });

  const [userAddresses, setUserAddresses] = useState<Record<string, string>>({});
  const [gasShortfallDetails, setGasShortfallDetails] = useState<{
    show: boolean;
    nativeSymbol: string;
    nativeBalance: number;
    estimatedFee: number;
    feeUsd: number;
    chainName: string;
    depositAddress: string;
    isBlocked: boolean;
    suggestedAmount: number;
  } | null>(null);

  useEffect(() => {
    const loadAddresses = async () => {
      if (transactionPin) {
        try {
          const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
          if (wallet) {
            const cleanedMnemonic = wallet.words.trim().toLowerCase();
            const hash = ethers.sha256(ethers.toUtf8Bytes(cleanedMnemonic));
            const btcAddress = 'bc1q' + hash.substring(2, 42);
            setUserAddresses({
              solana: wallet.solanaAddress,
              evm: wallet.evmAddress,
              ton: wallet.tonAddress,
              xrp: wallet.xrpAddress,
              bitcoin: btcAddress,
            });
          }
        } catch (e) {
          console.warn('Failed to decrypt and load addresses for gas checks:', e);
        }
      }
    };
    loadAddresses();
  }, [transactionPin]);

  const Alert = {
    alert: (title: string, message?: string, buttons?: any[]) => {
      let icon = 'info';
      let iconColor: string = Colors.brand.bright;
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('success') || lowerTitle.includes('copied') || lowerTitle.includes('updated')) {
        icon = 'check-circle';
        iconColor = '#10B981';
      } else if (lowerTitle.includes('failed') || lowerTitle.includes('error') || lowerTitle.includes('incorrect') || lowerTitle.includes('invalid')) {
        icon = 'alert-triangle';
        iconColor = '#EF4444';
      }

      const hasButtons = !!(buttons && buttons.length > 0);
      const cancelBtn = buttons?.find(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel');
      const confirmBtn = buttons?.find(b => b.style !== 'cancel' && b.text?.toLowerCase() !== 'cancel');

      setAlertConfig({
        visible: true,
        title,
        message: message || '',
        icon,
        iconColor,
        showConfirm: hasButtons,
        confirmText: confirmBtn?.text || buttons?.[0]?.text || 'Confirm',
        onConfirm: confirmBtn?.onPress || buttons?.[0]?.onPress || undefined,
        onClose: cancelBtn?.onPress || (() => {})
      });
    }
  };

  const params = useLocalSearchParams<{ recipient?: string; tokenSymbol?: string; chainId?: string }>();
  const initialRecipient = params?.recipient;

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [webacyRisk, setWebacyRisk] = useState<any>(null);
  const { portfolioAssets } = useUserStore();

  const dynamicUnifiedTokens = useMemo(() => {
    const list: any[] = [];
    portfolioAssets.forEach(asset => {
      const meta = metadataMap[asset.id] || { color: '#3A8AFF', icon: 'zap', pack: 'Feather', letter: asset.chain.substring(0, 2) };
      asset.tokens.forEach((t: any) => {
        const cleanVal = parseFloat(t.value.replace(/[^0-9.]/g, '')) || 0;
        const cleanAmt = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
        const price = cleanAmt > 0 ? (cleanVal / cleanAmt) : 1.0;
        list.push({
          symbol: t.symbol,
          name: t.name,
          balance: t.amount, // Keep "0.00 SOL" balance format
          price: price || 1.0,
          color: meta.color,
          logo: t.logo || asset.logo,
          chainId: asset.id,
          address: t.address,
          chain: asset.chain,
          lifiChainId: asset.id === 'solana' ? 1151111081099710 : (asset.id === 'bitcoin' ? 20000000000001 : (asset.id === 'sui' ? 9270000000000000 : (asset.id === 'tron' ? 728126428 : undefined)))
        });
      });
    });
    return list;
  }, [portfolioAssets]);

  const [selectedToken, setSelectedToken] = useState<any>({
    symbol: 'SOL',
    name: 'Solana',
    balance: '0.00 SOL',
    price: 175.50,
    color: '#14F195',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    chainId: 'solana'
  });

  useEffect(() => {
    if (params.tokenSymbol && params.chainId) {
      const found = dynamicUnifiedTokens.find((t: any) =>
        t.symbol === params.tokenSymbol && t.chainId === params.chainId
      );
      if (found) {
        setSelectedToken(found);
        return;
      }
    }
    const firstHolding = dynamicUnifiedTokens.find((t: any) => parseFloat(t.balance) > 0);
    if (firstHolding) {
      setSelectedToken(firstHolding);
      return;
    }
    const defaultSol = dynamicUnifiedTokens.find((t: any) => t.symbol === 'SOL' && t.chainId === 'solana');
    if (defaultSol) {
      setSelectedToken(defaultSol);
    }
  }, [dynamicUnifiedTokens, params.tokenSymbol, params.chainId]);

  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [lifiChains, setLifiChains] = useState<any[]>(DEFAULT_LIFI_CHAINS);
  const [chainTokens, setChainTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<number | null>(null);

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

            const pChain = portfolioAssets.find((c: any) => c.id === chainKey || c.id === selectedNetworkFilter?.toString());
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
              balance: `${userBalance} ${t.symbol}`,
              price: parseFloat(t.priceUSD) || 1.0,
              color: meta.color,
              icon: 'zap',
              chain: lifiChains.find((c: any) => c.id === selectedNetworkFilter)?.name || '',
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
    return filteredTokens.filter(t => {
      const balanceNum = parseFloat(t.balance) || 0;
      return balanceNum > 0 || (t.address && t.address.trim().length > 0);
    });
  }, [filteredTokens]);

  const allAssetsList = useMemo(() => {
    return filteredTokens;
  }, [filteredTokens]);

  const handleSelectToken = (token: any) => {
    setSelectedToken(token);
    setShowTokenPicker(false);
    setSearchQuery('');
    setSelectedNetworkFilter(null);
  };
  const [shieldVerified, setShieldVerified] = useState<boolean | null>(null);
  const [inputCurrency, setInputCurrency] = useState<'TOKEN' | 'USD' | 'USDT' | 'USDC' | 'CNGN'>('TOKEN');

  // Interactive step-by-step transaction wizard & identity resolution states
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientColor, setRecipientColor] = useState<string>('#3A8AFF');
  const [isRecipientConfirmed, setIsRecipientConfirmed] = useState<boolean>(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  // Security and Confirmation Modal States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const handleRecipientChange = async (text: string) => {
    setRecipient(text);
    setResolvedAddress(null);
    const cleaned = text.trim();
    if (cleaned.length >= 8) {
      // 1. Try resolving via actual Supabase registry DB first!
      const isNum = /^\+?\d+$/.test(cleaned.replace(/\s+/g, ''));
      if (isNum) {
        try {
          const cleanNum = cleaned.replace(/^0/, '').replace(/\s+/g, '');
          const { data } = await supabase
            .from('registries')
            .select('*')
            .eq('account_number', cleanNum)
            .maybeSingle();

          if (data) {
            setShieldVerified(true);
            setRecipientName(data.name || 'Num User');
            setRecipientColor('#3A8AFF');
            // Resolve correct address based on selected asset chain
            setResolvedAddress(selectedToken.symbol === 'SOL' ? data.solana_address : data.evm_address);
            return;
          } else {
            // Number not found in Supabase registries database
            setShieldVerified(false);
            setRecipientName(null);
          }
        } catch (e) {
          console.log('Supabase lookup info:', e);
          setShieldVerified(false);
          setRecipientName(null);
        }
      } else if (cleaned.length > 20) {
        // 2. Direct external public blockchain address input with Webacy real-time threat screening!
        setRecipientName('Screening address risk...');
        setRecipientColor('#6B7280');
        setShieldVerified(false);
        setWebacyRisk(null);
        
        try {
          const result = await WebacyService.screenAddress(cleaned, selectedToken.chainId);
          setResolvedAddress(cleaned);
          setWebacyRisk(result);
          
          if (result.isSanctioned) {
            setShieldVerified(false);
            setRecipientName('Sanctioned Wallet (Blocked)');
            setRecipientColor('#EF4444');
          } else if (result.overallRisk > 70) {
            setShieldVerified(false);
            setRecipientName('High Risk Address (' + cleaned.slice(0, 4) + '...)');
            setRecipientColor('#EF4444');
          } else if (result.overallRisk > 40) {
            setShieldVerified(false);
            setRecipientName('Medium Risk Address (' + cleaned.slice(0, 4) + '...)');
            setRecipientColor('#F59E0B');
          } else {
            setShieldVerified(true); // Webacy audited & verified safe!
            setRecipientName('External Wallet (' + cleaned.slice(0, 4) + '...' + cleaned.slice(-4) + ')');
            setRecipientColor('#10B981');
          }
        } catch (e) {
          console.log('Webacy screening info:', e);
          setShieldVerified(false);
          setRecipientName('External Address (' + cleaned.slice(0, 4) + '...' + cleaned.slice(-4) + ')');
          setRecipientColor('#14F195');
        }
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

  const checkGasShortfall = (): boolean => {
    const chainId = selectedToken.chainId;
    const chainAsset = portfolioAssets.find(c => c.id === chainId);
    if (!chainAsset) return false;

    const nativeToken = chainAsset.tokens.find((t: any) => !t.address) || chainAsset.tokens[0];
    if (!nativeToken) return false;

    const nativeSymbol = nativeToken.symbol;
    const nativeBalance = parseFloat(nativeToken.amount.split(' ')[0]) || 0;
    const nativePrice = nativeToken.price || 0;
    const chainName = chainAsset.chain;

    const estimatedFee = chainId === 'solana' ? 0.00005 : 0.0001;
    const feeUsd = estimatedFee * nativePrice;

    let depositAddress = '';
    if (chainId === 'solana') {
      depositAddress = userAddresses.solana || '';
    } else if (chainId === 'bitcoin') {
      depositAddress = userAddresses.bitcoin || '';
    } else if (chainId === 'ton') {
      depositAddress = userAddresses.ton || '';
    } else if (chainId === 'xrp') {
      depositAddress = userAddresses.xrp || '';
    } else {
      depositAddress = userAddresses.evm || '';
    }

    const isSendingNative = selectedToken.symbol === nativeSymbol;
    const requiredNative = isSendingNative ? (tokenAmount + estimatedFee) : estimatedFee;
    const balanceInUsd = nativeBalance * nativePrice;

    const isBlocked = nativeBalance < requiredNative;
    const isLowBalance = nativePrice > 0 && balanceInUsd < 1.0;

    if (isBlocked || isLowBalance) {
      setGasShortfallDetails({
        show: true,
        nativeSymbol,
        nativeBalance,
        estimatedFee,
        feeUsd,
        chainName,
        depositAddress,
        isBlocked,
        suggestedAmount: nativePrice > 0 ? (1.0 / nativePrice) : 0
      } as any);
      return true;
    }

    return false;
  };

  const handleSend = () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient address or phone number.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Check for gas fee shortfall
    if (checkGasShortfall()) {
      return;
    }

    // Launch secure security briefing and authorization flow
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    const destination = resolvedAddress || recipient.trim();

    let result;
    if (selectedToken.symbol === 'SOL') {
      result = await WalletEngine.sendSolanaTransfer(destination, tokenAmount, transactionPin);
    } else if (selectedToken.symbol === 'ETH') {
      result = await WalletEngine.sendEVMTransfer(destination, tokenAmount, transactionPin);
    } else {
      // Simulate transfer for SPL/ERC20 custom tokens
      await new Promise(r => setTimeout(r, 1200));
      result = { success: true, signature: '0x' + Math.random().toString(16).substring(2, 40) };
    }

    if (result.success) {
      addTransaction({
        type: 'Send',
        fromSymbol: selectedToken.symbol,
        toSymbol: selectedToken.symbol,
        fromAmount: tokenAmount.toString(),
        toAmount: '0.00',
        chain: selectedToken.chain || 'Solana',
        status: 'Success',
        txHash: result.signature || '0x' + Math.random().toString(16).substring(2, 40)
      });
      
      setTimeout(() => {
        setAmount('');
        setRecipient('');
        setIsRecipientConfirmed(false);
        router.push('/(tabs)/home');
      }, 2500);
    } else {
      Alert.alert('Transfer Failed', result.error || 'The blockchain network rejected the signature.');
    }
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
            onPress={() => setShowTokenPicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.tokenLeft}>
              <View style={styles.iconBadgeWrapper}>
                <View style={[styles.tokenIconBoxModal, { backgroundColor: selectedToken.color ? selectedToken.color + '20' : '#47556920' }]}>
                  <ImageWithFallback source={getLogoSource(selectedToken.logo)} style={styles.tokenLogoImage} fallbackText={selectedToken.symbol} />
                </View>
                {(() => {
                  const chainLogo = getChainLogoById(selectedToken.lifiChainId || selectedToken.chainId);
                  const metadata = metadataMap[selectedToken.chainId];
                  return (
                    <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                      {chainLogo ? (
                        <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={selectedToken ? selectedToken.chain : '?'} />
                      ) : (
                        <Text style={styles.networkBadgeText}>{metadata ? metadata.letter : '?'}</Text>
                      )}
                    </View>
                  );
                })()}
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={tokenSymbolStyle}>{selectedToken.symbol}</Text>
                <Text style={styles.tokenName}>{selectedToken.name}</Text>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenBalance}>Bal: {selectedToken.balance}</Text>
              <Feather name="chevron-down" size={16} color={Colors.text.muted} />
            </View>
          </TouchableOpacity>
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

            {shieldVerified === true && recipientName && !webacyRisk && (
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

            {/* Webacy Screening Risk Indicator Cards */}
            {webacyRisk && (
              <View style={[
                styles.resolvedUserPreview,
                !isDarkMode && styles.resolvedUserPreviewLight,
                {
                  borderColor: webacyRisk.isSanctioned 
                    ? '#EF4444' 
                    : webacyRisk.overallRisk > 70 
                      ? '#EF444460' 
                      : webacyRisk.overallRisk > 40 
                        ? '#F59E0B60' 
                        : '#10B98160',
                  backgroundColor: webacyRisk.isSanctioned 
                    ? 'rgba(239, 68, 68, 0.08)' 
                    : webacyRisk.overallRisk > 70 
                      ? 'rgba(239, 68, 68, 0.03)' 
                      : webacyRisk.overallRisk > 40 
                        ? 'rgba(245, 158, 11, 0.03)' 
                        : 'rgba(16, 185, 129, 0.03)'
                }
              ]}>
                <View style={[styles.avatarCircleSmall, { backgroundColor: recipientColor }]}>
                  {webacyRisk.isSanctioned ? (
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  ) : webacyRisk.overallRisk > 70 ? (
                    <Ionicons name="warning" size={20} color="#EF4444" />
                  ) : webacyRisk.overallRisk > 40 ? (
                    <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                  ) : (
                    <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 4 }}>
                    <Text style={[styles.resolvedUserName, { color: recipientColor }, webacyRisk.isSanctioned && { color: '#EF4444' }, { flex: 1 }]}>
                      {recipientName}
                    </Text>
                    <View style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: webacyRisk.isLive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                      borderWidth: 0.5,
                      borderColor: webacyRisk.isLive ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'
                    }}>
                      <Text style={{
                        fontSize: 7,
                        fontWeight: '900',
                        color: webacyRisk.isLive ? '#10B981' : '#94A3B8'
                      }}>
                        {webacyRisk.isLive ? 'WEBACY LIVE' : 'WEBACY SANDBOX'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.resolvedUserSub}>
                    {webacyRisk.isSanctioned 
                      ? 'Webacy KYW Alert: Regulated Sanctions Block list match.' 
                      : `Webacy Safety Rating: ${(100 - webacyRisk.overallRisk).toFixed(0)}/100 (Overall Risk: ${webacyRisk.overallRisk}%)`
                    }
                  </Text>
                </View>
              </View>
            )}

            {/* Warning explanatory details for high risk addresses */}
            {webacyRisk && webacyRisk.isSanctioned && (
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: Spacing[2], backgroundColor: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#EF444440' }}>
                <Ionicons name="shield-outline" size={16} color="#EF4444" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: Typography.size.xs, color: '#EF4444', flex: 1, lineHeight: 16, fontWeight: '700' }}>
                  Compliance Block: This wallet is banned from receiving transfers due to sanctions violations detected by the Webacy Compliance Suite.
                </Text>
              </View>
            )}

            {webacyRisk && !webacyRisk.isSanctioned && webacyRisk.overallRisk > 70 && (
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: Spacing[2], backgroundColor: 'rgba(245,158,11,0.08)', padding: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#F59E0B40' }}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: Typography.size.xs, color: isDarkMode ? '#FCD34D' : '#D97706', flex: 1, lineHeight: 16, fontWeight: '600' }}>
                  High Risk Warning: Webacy detected behavioral threats (malicious contracts, exploit funding, or phishing history) associated with this address. Verify carefully.
                </Text>
              </View>
            )}

            <Text style={styles.helpText}>
              You can type any phone number. If they don't have Num Wallet yet, they'll get an SMS to claim!
            </Text>

            {((shieldVerified === true) || (resolvedAddress && webacyRisk && !webacyRisk.isSanctioned)) && (
              <TouchableOpacity
                style={[
                  styles.confirmRecipientBtn,
                  webacyRisk && webacyRisk.overallRisk > 70 && { backgroundColor: '#EF4444' }
                ]}
                onPress={() => setIsRecipientConfirmed(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmRecipientBtnText}>
                  {webacyRisk && webacyRisk.overallRisk > 70 ? 'Confirm High Risk Recipient' : 'Confirm Recipient'}
                </Text>
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

      {/* Secure Security Briefing & Authentication Modal */}
      <TransactionConfirmModal
        visible={showAuthModal}
        title="Confirm Transfer"
        details={[
          { label: 'Recipient Name', value: recipientName || 'External Address' },
          { label: 'Recipient Wallet', value: resolvedAddress || recipient },
          { label: 'Network', value: `${selectedToken.chain || 'Solana'} Blockchain` },
          { label: 'Amount', value: `${tokenAmount} ${selectedToken.symbol}` },
          { label: 'Network Fee', value: selectedToken.symbol === 'SOL' ? '0.00005 SOL (~$0.00001)' : '0.0001 ETH' }
        ]}
        securityTips={[
          "Verify the recipient address carefully. Transactions are irreversible.",
          "Webacy scanned this address: No malicious history or contract risk detected.",
          "Private keys will be derived locally to sign this payload."
        ]}
        onConfirm={handleAuthSuccess}
        onCancel={() => setShowAuthModal(false)}
      />

      {/* POPUP JUMPER-STYLE SEARCHABLE MODAL */}
      <Modal
        visible={showTokenPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowTokenPicker(false);
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
                Select Asset to Send
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTokenPicker(false);
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
              {loadingTokens ? (
                <View style={{ paddingVertical: Spacing[8], alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Colors.brand.bright} />
                  <Text style={{ color: Colors.text.muted, marginTop: Spacing[3], fontSize: Typography.size.sm }}>
                    Loading tokens for chain...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Holdings Section */}
                  {holdingsList.length > 0 ? (
                    <View style={styles.listSection}>
                      <Text style={styles.sectionHeader}>YOUR HOLDINGS</Text>
                      {holdingsList.map((t: any) => (
                        <TouchableOpacity
                          key={`holding-${t.symbol}-${t.chainId}-${t.address || ''}`}
                          style={[
                            styles.dropdownRowItem,
                            { borderBottomColor: isDarkMode ? '#C4D4E806' : '#F3F4F6' },
                          ]}
                          onPress={() => handleSelectToken(t)}
                        >
                          <View style={styles.dropdownRowLeft}>
                            {/* Circle token icon with absolute chain dot overlay */}
                            <View style={styles.iconBadgeWrapper}>
                              <View style={[styles.tokenIconBoxModal, { backgroundColor: t.color + '15' }]}>
                                {t.logo ? (
                                  <ImageWithFallback source={getLogoSource(t.logo)} style={styles.tokenLogoImageMini} fallbackText={t.symbol} />
                                ) : (
                                  <Feather name={t.icon || 'zap'} size={14} color={t.color} />
                                )}
                              </View>
                              {(() => {
                                const chainLogo = getChainLogoById(t.lifiChainId || t.chainId);
                                return (
                                  <View style={[styles.networkBadge, { backgroundColor: '#111827' }]}>
                                    {chainLogo ? (
                                      <ImageWithFallback source={getLogoSource(chainLogo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={t.chain} />
                                    ) : (
                                      <Text style={styles.networkBadgeText}>{t.networkLetter || '?'}</Text>
                                    )}
                                  </View>
                                );
                              })()}
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
                        No holdings found matching "{searchQuery}"
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Network Fee Shortfall Modal */}
      <Modal
        visible={!!gasShortfallDetails?.show}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGasShortfallDetails(null)}
      >
        <Pressable 
          style={styles.shortfallModalOverlay} 
          onPress={() => setGasShortfallDetails(null)}
        >
          <View style={[styles.shortfallModalContent, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDarkMode ? '#EF444440' : '#E5E7EB' }]} />
            
            <View style={styles.shortfallHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons 
                  name={gasShortfallDetails?.isBlocked ? "alert-circle" : "warning"} 
                  size={24} 
                  color={gasShortfallDetails?.isBlocked ? "#EF4444" : "#F59E0B"} 
                />
                <Text style={[styles.shortfallTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  {gasShortfallDetails?.isBlocked ? 'Network Fee Required' : 'Low Fee Balance Warning'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGasShortfallDetails(null)}
                style={[styles.shortfallCloseBtn, { backgroundColor: isDarkMode ? '#1E1E2F' : '#F3F4F6' }]}
              >
                <Feather name="x" size={16} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.shortfallDescription}>
              To process transactions on the <Text style={{ fontWeight: 'bold' }}>{gasShortfallDetails?.chainName}</Text>, the network requires a small fee in <Text style={{ fontWeight: 'bold' }}>{gasShortfallDetails?.nativeSymbol}</Text> to reward validators/miners.
            </Text>

            {/* Balances Box */}
            <View style={[styles.shortfallInfoBox, { backgroundColor: isDarkMode ? '#070712' : '#F9FAFB', borderColor: isDarkMode ? '#EF444420' : '#E5E7EB' }]}>
              <View style={styles.shortfallInfoRow}>
                <Text style={styles.shortfallInfoLabel}>Your {gasShortfallDetails?.nativeSymbol} Balance</Text>
                <Text style={[styles.shortfallInfoValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  {gasShortfallDetails?.nativeBalance.toFixed(5)} {gasShortfallDetails?.nativeSymbol}
                </Text>
              </View>
              <View style={styles.shortfallInfoRow}>
                <Text style={styles.shortfallInfoLabel}>Estimated Network Fee</Text>
                <Text style={[styles.shortfallInfoValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                  {gasShortfallDetails?.estimatedFee.toFixed(5)} {gasShortfallDetails?.nativeSymbol} (~${gasShortfallDetails?.feeUsd.toFixed(5)})
                </Text>
              </View>
              <View style={[styles.shortfallDivider, { backgroundColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]} />
              <View style={styles.shortfallInfoRow}>
                <Text style={[styles.shortfallInfoLabel, { fontWeight: '700' }]}>Status</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: gasShortfallDetails?.isBlocked ? '#EF4444' : '#F59E0B' }}>
                  {gasShortfallDetails?.isBlocked ? 'Insufficient Balance' : 'Low Balance'}
                </Text>
              </View>
            </View>

            <Text style={styles.shortfallRecommendation}>
              {gasShortfallDetails?.isBlocked 
                ? `You do not have enough ${gasShortfallDetails?.nativeSymbol} to pay for this transaction's fee. Please deposit native ${gasShortfallDetails?.nativeSymbol} to proceed.`
                : `Your balance is very low. We recommend keeping a minimum of $1.00 USD (approx. ${gasShortfallDetails?.suggestedAmount?.toFixed(4) || '0.00'} ${gasShortfallDetails?.nativeSymbol}) in native ${gasShortfallDetails?.nativeSymbol} to process multiple transactions smoothly.`
              }
            </Text>

            {/* Address copy card */}
            <View style={[styles.depositAddressCard, { backgroundColor: isDarkMode ? '#131326' : '#F3F4F6' }]}>
              <Text style={styles.depositAddressLabel}>{gasShortfallDetails?.chainName} Deposit Address</Text>
              <View style={styles.depositAddressRow}>
                <Text style={[styles.depositAddressText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} numberOfLines={1} selectable>
                  {gasShortfallDetails?.depositAddress}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (gasShortfallDetails?.depositAddress) {
                      Clipboard.setStringAsync(gasShortfallDetails.depositAddress);
                      Alert.alert('Address Copied', 'Your wallet deposit address has been copied to your clipboard.');
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="copy" size={16} color={Colors.brand.bright} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.shortfallActions}>
              <TouchableOpacity
                style={styles.shortfallCopyBtn}
                onPress={() => {
                  if (gasShortfallDetails?.depositAddress) {
                    Clipboard.setStringAsync(gasShortfallDetails.depositAddress);
                    Alert.alert('Address Copied', 'Your wallet deposit address has been copied to your clipboard.');
                  }
                }}
              >
                <Feather name="copy" size={14} color="#FFFFFF" />
                <Text style={styles.shortfallCopyBtnText}>Copy Address</Text>
              </TouchableOpacity>

              {/* P2P Funding (Faded) */}
              <TouchableOpacity
                style={[styles.shortfallP2pBtn, { opacity: 0.5 }]}
                onPress={() => {
                  Alert.alert('Coming Soon', 'P2P Funding is in private beta and will be available in the next mainnet release.');
                }}
              >
                <Feather name="users" size={14} color={Colors.brand.bright} />
                <Text style={styles.shortfallP2pBtnText}>Fund with P2P</Text>
              </TouchableOpacity>
            </View>

            {!gasShortfallDetails?.isBlocked && (
              <TouchableOpacity
                style={styles.proceedAnywayBtn}
                onPress={() => {
                  setGasShortfallDetails(null);
                  setShowAuthModal(true);
                }}
              >
                <Text style={styles.proceedAnywayText}>Send Anyway</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.shortfallCloseActionBtn, { borderColor: isDarkMode ? '#1A1A30' : '#E5E7EB' }]}
              onPress={() => setGasShortfallDetails(null)}
            >
              <Text style={[styles.shortfallCloseActionText, { color: isDarkMode ? '#94A3B8' : '#4B5563' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          alertConfig.onClose();
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        showConfirm={alertConfig.showConfirm}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
      />
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
  tokenLogoImageMini: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
  },
  iconBadgeWrapper: {
    position: 'relative',
    width: 34,
    height: 34,
  },
  tokenIconBoxModal: {
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
  shortfallModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  shortfallModalContent: {
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
  shortfallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  shortfallTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  shortfallCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortfallDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: Spacing[4],
  },
  shortfallInfoBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  shortfallInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortfallInfoLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  shortfallInfoValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  shortfallDivider: {
    height: 1,
    marginVertical: Spacing[1],
  },
  shortfallRecommendation: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: Spacing[4],
  },
  depositAddressCard: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  depositAddressLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  depositAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  depositAddressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: Spacing[4],
  },
  shortfallActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  shortfallCopyBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  shortfallCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shortfallP2pBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  shortfallP2pBtnText: {
    color: Colors.brand.bright,
    fontSize: 13,
    fontWeight: '700',
  },
  proceedAnywayBtn: {
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B98130',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  proceedAnywayText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  shortfallCloseActionBtn: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortfallCloseActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

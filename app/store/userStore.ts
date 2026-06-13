import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TransactionType {
  id: string;
  type: string; // 'Swap' | 'Bridge' | 'Send' | 'Receive' | 'Meme Buy' | 'Meme Sell' | 'NFT Send' | 'NFT Receive'
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  chain: string;
  date: string;
  status: string; // 'Success' | 'Failed'
  txHash: string;
}

export interface MinimizedTabType {
  url: string;
  title: string;
  favicon?: string;
  previewUri?: string;
  isStarred?: boolean;
}

interface UserState {
  name: string;
  selectedAvatarId: string | null; // '1' | '2' | '3' | '4' | '5' or null
  uploadedPhoto: boolean;
  uploadedPhotoUri: string | null;
  biometricsEnabled: boolean;
  isDarkMode: boolean;
  isBalanceVisible: boolean; // Global balance visibility state
  accountNumber: string;
  showNfts: boolean;
  showStake: boolean;
  showPerps: boolean;
  showHub: boolean;
  showMemes: boolean;
  showDgames: boolean;
  showDsocials: boolean;
  showPrediction: boolean;
  showAi: boolean;
  bookmarkedDapps: { name: string; url: string }[];
  minimizedTabs: MinimizedTabType[];
  backupEmail: string | null;
  hasEmailedSeedPhrase: boolean;
  portfolioAssets: any[]; // Dynamic asset portfolio list
  loginPasscode: string;
  transactionPin: string;
  lastOtpVerifiedAt: number | null; // Persisted timestamp for monthly OTP verification check
  biometricLockSetting: 'none' | 'immediately' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h';
  lastAppClosedAt: number | null;
  transactionHistory: TransactionType[];
  hiddenTokenAddresses: string[];
  hideTokenAddress: (addressOrSymbol: string) => void;
  setName: (name: string) => void;
  setSelectedAvatarId: (id: string | null) => void;
  setUploadedPhoto: (uploaded: boolean) => void;
  setUploadedPhotoUri: (uri: string | null) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setIsBalanceVisible: (visible: boolean) => void;
  setAccountNumber: (accountNumber: string) => void;
  setShowNfts: (show: boolean) => void;
  setShowStake: (show: boolean) => void;
  setShowPerps: (show: boolean) => void;
  setShowHub: (show: boolean) => void;
  setShowMemes: (show: boolean) => void;
  setShowDgames: (show: boolean) => void;
  setShowDsocials: (show: boolean) => void;
  setShowPrediction: (show: boolean) => void;
  setShowAi: (show: boolean) => void;
  addBookmark: (dapp: { name: string; url: string }) => void;
  removeBookmark: (url: string) => void;
  setMinimizedTabs: (tabs: MinimizedTabType[]) => void;
  setBackupEmail: (email: string | null) => void;
  setHasEmailedSeedPhrase: (emailed: boolean) => void;
  setLoginPasscode: (code: string) => void;
  setTransactionPin: (pin: string) => void;
  setLastOtpVerifiedAt: (time: number | null) => void;
  setBiometricLockSetting: (setting: 'none' | 'immediately' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h') => void;
  setLastAppClosedAt: (time: number | null) => void;
  importCustomAsset: (chainName: string, tokenSymbol: string, tokenName: string, logoUrl?: string, address?: string, decimals?: number, price?: number, chainLogoUrl?: string) => void;
  clearPortfolio: () => void;
  addTransaction: (tx: Omit<TransactionType, 'id' | 'date'>) => void;
  clearTransactionHistory: () => void;
}

export const INITIAL_TOP20_PORTFOLIO = [
  {
    id: 'solana',
    chain: 'Solana',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    tokens: [
      { symbol: 'SOL', name: 'Solana', amount: '0.00 SOL', value: '$0.00', change: '+1.45%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' }
    ]
  },
  {
    id: 'ethereum',
    chain: 'Ethereum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', amount: '0.00 ETH', value: '$0.00', change: '+0.85%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' }
    ]
  },
  {
    id: 'smartchain',
    chain: 'BNB Smart Chain',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    tokens: [
      { symbol: 'BNB', name: 'BNB Coin', amount: '0.00 BNB', value: '$0.00', change: '+2.10%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' }
    ]
  },
  {
    id: 'xrp',
    chain: 'Ripple',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
    tokens: [
      { symbol: 'XRP', name: 'Ripple', amount: '0.00 XRP', value: '$0.00', change: '-0.30%', isPositive: false, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png' }
    ]
  },
  {
    id: 'theopennetwork',
    chain: 'The Open Network',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png',
    tokens: [
      { symbol: 'TON', name: 'Toncoin', amount: '0.00 TON', value: '$0.00', change: '+4.12%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png' }
    ]
  },
  {
    id: 'cardano',
    chain: 'Cardano',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
    tokens: [
      { symbol: 'ADA', name: 'Cardano', amount: '0.00 ADA', value: '$0.00', change: '+0.15%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png' }
    ]
  },
  {
    id: 'avalanchec',
    chain: 'Avalanche',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    tokens: [
      { symbol: 'AVAX', name: 'Avalanche', amount: '0.00 AVAX', value: '$0.00', change: '+1.62%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png' }
    ]
  },
  {
    id: 'tron',
    chain: 'TRON',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
    tokens: [
      { symbol: 'TRX', name: 'TRON', amount: '0.00 TRX', value: '$0.00', change: '+0.54%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png' }
    ]
  },
  {
    id: 'polygon',
    chain: 'Polygon',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    tokens: [
      { symbol: 'POL', name: 'Polygon ecosystem token', amount: '0.00 POL', value: '$0.00', change: '+0.95%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' }
    ]
  },
  {
    id: 'polkadot',
    chain: 'Polkadot',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
    tokens: [
      { symbol: 'DOT', name: 'Polkadot', amount: '0.00 DOT', value: '$0.00', change: '-1.25%', isPositive: false, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png' }
    ]
  },
  {
    id: 'arbitrum',
    chain: 'Arbitrum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    tokens: [
      { symbol: 'ARB', name: 'Arbitrum', amount: '0.00 ARB', value: '$0.00', change: '+1.02%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' }
    ]
  },
  {
    id: 'optimism',
    chain: 'Optimism',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    tokens: [
      { symbol: 'OP', name: 'Optimism', amount: '0.00 OP', value: '$0.00', change: '+0.45%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' }
    ]
  },
  {
    id: 'base',
    chain: 'Base',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum (Base)', amount: '0.00 ETH', value: '$0.00', change: '+2.45%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' }
    ]
  },
  {
    id: 'assetchain',
    chain: 'Asset Chain',
    logo: 'https://assets.coingecko.com/coins/images/13402/large/xend.png',
    tokens: [
      { symbol: 'RWA', name: 'Asset Chain Native', amount: '0.00 RWA', value: '$0.00', change: '+0.00%', isPositive: true, logo: 'https://assets.coingecko.com/coins/images/13402/large/xend.png' },
      { symbol: 'XRWA', name: 'Xend Finance', amount: '0.00 XRWA', value: '$0.00', change: '+0.00%', isPositive: true, logo: 'assets/xrwa.png', address: '0x02afe9989D86a0357fbb238579FE035dc17BcAB0', decimals: 18 }
    ]
  },
  {
    id: 'klever',
    chain: 'Klever',
    logo: 'https://assets.coingecko.com/coins/images/13813/large/klever.png',
    tokens: [
      { symbol: 'KLV', name: 'Klever Native', amount: '0.00 KLV', value: '$0.00', change: '+0.00%', isPositive: true, logo: 'https://assets.coingecko.com/coins/images/13813/large/klever.png' }
    ]
  },
  {
    id: 'cronos',
    chain: 'Cronos',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cronos/info/logo.png',
    tokens: [
      { symbol: 'CRO', name: 'Cronos', amount: '0.00 CRO', value: '$0.00', change: '-0.10%', isPositive: false, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cronos/info/logo.png' }
    ]
  },
  {
    id: 'fantom',
    chain: 'Fantom',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',
    tokens: [
      { symbol: 'FTM', name: 'Fantom', amount: '0.00 FTM', value: '$0.00', change: '+3.14%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png' }
    ]
  },
  {
    id: 'near',
    chain: 'Near',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
    tokens: [
      { symbol: 'NEAR', name: 'NEAR Protocol', amount: '0.00 NEAR', value: '$0.00', change: '+2.85%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png' }
    ]
  },
  {
    id: 'aptos',
    chain: 'Aptos',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
    tokens: [
      { symbol: 'APT', name: 'Aptos', amount: '0.00 APT', value: '$0.00', change: '+1.50%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png' }
    ]
  },
  {
    id: 'sui',
    chain: 'Sui',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
    tokens: [
      { symbol: 'SUI', name: 'Sui', amount: '0.00 SUI', value: '$0.00', change: '+5.78%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png' }
    ]
  },
  {
    id: 'stellar',
    chain: 'Stellar',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png',
    tokens: [
      { symbol: 'XLM', name: 'Stellar Lumens', amount: '0.00 XLM', value: '$0.00', change: '+0.25%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png' }
    ]
  },
  {
    id: 'cosmos',
    chain: 'Cosmos',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
    tokens: [
      { symbol: 'ATOM', name: 'Cosmos', amount: '0.00 ATOM', value: '$0.00', change: '-0.40%', isPositive: false, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png' }
    ]
  },
  {
    id: 'bitcoin',
    chain: 'Bitcoin',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    tokens: [
      { symbol: 'BTC', name: 'Bitcoin', amount: '0.00 BTC', value: '$0.00', change: '+0.50%', isPositive: true, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' }
    ]
  }
];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: '',
      selectedAvatarId: null,
      uploadedPhoto: false,
      uploadedPhotoUri: null,
      biometricsEnabled: false,
      isDarkMode: true,
      isBalanceVisible: true,
      accountNumber: '',
      showNfts: true,
      showStake: true,
      showPerps: true,
      showHub: true,
      showMemes: true,
      showDgames: true,
      showDsocials: true,
      showPrediction: true,
      showAi: true,
      bookmarkedDapps: [
        { name: 'Jupiter', url: 'jup.ag' },
        { name: 'Magic Eden', url: 'magiceden.io' },
        { name: 'Raydium', url: 'raydium.io' },
        { name: 'Orca', url: 'orca.so' }
      ],
      minimizedTabs: [],
      backupEmail: null,
      hasEmailedSeedPhrase: false,
      portfolioAssets: INITIAL_TOP20_PORTFOLIO,
      loginPasscode: '123456',
      transactionPin: '1234',
      lastOtpVerifiedAt: null,
      biometricLockSetting: 'none',
      lastAppClosedAt: null,
      transactionHistory: [],
      hiddenTokenAddresses: [],
      hideTokenAddress: (addressOrSymbol) => set((state) => ({
        hiddenTokenAddresses: [...state.hiddenTokenAddresses, addressOrSymbol.toLowerCase()]
      })),
      setName: (name) => set({ name }),
      setSelectedAvatarId: (id) => set({ selectedAvatarId: id }),
      setUploadedPhoto: (uploaded) => set({ uploadedPhoto: uploaded }),
      setUploadedPhotoUri: (uri) => set({ uploadedPhotoUri: uri }),
      setBiometricsEnabled: (enabled) => set({ biometricsEnabled: enabled }),
      setIsDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setIsBalanceVisible: (isBalanceVisible) => set({ isBalanceVisible }),
      setAccountNumber: (accountNumber) => set({ accountNumber }),
      setShowNfts: (showNfts) => set({ showNfts }),
      setShowStake: (showStake) => set({ showStake }),
      setShowPerps: (showPerps) => set({ showPerps }),
      setShowHub: (showHub) => set({ showHub }),
      setShowMemes: (showMemes) => set({ showMemes }),
      setShowDgames: (showDgames) => set({ showDgames }),
      setShowDsocials: (showDsocials) => set({ showDsocials }),
      setShowPrediction: (showPrediction) => set({ showPrediction }),
      setShowAi: (showAi) => set({ showAi }),
      addBookmark: (dapp) => set((state) => {
        if (state.bookmarkedDapps.some((x) => x.url.toLowerCase() === dapp.url.toLowerCase())) return {};
        if (state.bookmarkedDapps.length >= 30) return {};
        return { bookmarkedDapps: [...state.bookmarkedDapps, dapp] };
      }),
      removeBookmark: (url) => set((state) => ({
        bookmarkedDapps: state.bookmarkedDapps.filter((x) => x.url.toLowerCase() !== url.toLowerCase())
      })),
      setMinimizedTabs: (minimizedTabs) => set({ minimizedTabs }),
      setBackupEmail: (backupEmail) => set({ backupEmail }),
      setHasEmailedSeedPhrase: (hasEmailedSeedPhrase) => set({ hasEmailedSeedPhrase }),
      setLoginPasscode: (loginPasscode) => set({ loginPasscode }),
      setTransactionPin: (transactionPin) => set({ transactionPin }),
      setLastOtpVerifiedAt: (lastOtpVerifiedAt) => set({ lastOtpVerifiedAt }),
      setBiometricLockSetting: (biometricLockSetting) => set({ biometricLockSetting }),
      setLastAppClosedAt: (lastAppClosedAt) => set({ lastAppClosedAt }),
      importCustomAsset: (chainName, tokenSymbol, tokenName, logoUrl, address, decimals, price, chainLogoUrl) => set((state) => {
        const chainId = chainName.toLowerCase().replace(/\s+/g, '');
        const existingChain = state.portfolioAssets.find(c => c.id === chainId || c.chain.toLowerCase() === chainName.toLowerCase());
        
        const tokenAddress = address || '';
        const tokenDecimals = decimals !== undefined ? decimals : 18;
        const tokenPrice = price !== undefined ? price : 0;
        
        const newToken = {
          symbol: tokenSymbol.toUpperCase(),
          name: tokenName,
          amount: `0.00 ${tokenSymbol.toUpperCase()}`,
          value: '$0.00',
          change: '+0.00%',
          isPositive: true,
          logo: logoUrl || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          address: tokenAddress,
          decimals: tokenDecimals,
          price: tokenPrice
        };

        if (existingChain) {
          // Avoid duplicate symbols or contract addresses on the same chain
          const duplicate = existingChain.tokens.some((t: any) => 
            t.symbol === newToken.symbol || 
            (tokenAddress && t.address && t.address.toLowerCase() === tokenAddress.toLowerCase())
          );
          if (duplicate) return {};

          return {
            portfolioAssets: state.portfolioAssets.map(c => {
              if (c.id === existingChain.id) {
                return {
                  ...c,
                  tokens: [...c.tokens, newToken]
                };
              }
              return c;
            })
          };
        } else {
          const chainLogoMap: Record<string, string> = {
            solana: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
            ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
            smartchain: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            bnbchain: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
            bitcoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png'
          };
          
          const newChain = {
            id: chainId,
            chain: chainName,
            totalValue: 0.0,
            display: '$0.00',
            logo: chainLogoUrl || chainLogoMap[chainId] || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            change: '+0.00%',
            isPositive: true,
            tokens: [newToken]
          };
          
          return {
            portfolioAssets: [...state.portfolioAssets, newChain]
          };
        }
      }),
      clearPortfolio: () => set({ portfolioAssets: INITIAL_TOP20_PORTFOLIO }),
      addTransaction: (tx) => set((state) => {
        const newTx = {
          ...tx,
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          date: new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        return { transactionHistory: [newTx, ...state.transactionHistory] };
      }),
      clearTransactionHistory: () => set({ transactionHistory: [] })
    }),
    {
      name: 'num-wallet-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 7,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as any;
        if (version < 2) {
          if (state && Array.isArray(state.portfolioAssets)) {
            const hasAssetChain = state.portfolioAssets.some((a: any) => a.id === 'assetchain');
            const hasKlever = state.portfolioAssets.some((a: any) => a.id === 'klever');
            if (!hasAssetChain || !hasKlever) {
              const merged = [...state.portfolioAssets];
              if (!hasAssetChain) {
                const ac = INITIAL_TOP20_PORTFOLIO.find(a => a.id === 'assetchain');
                if (ac) merged.splice(13, 0, ac);
              }
              if (!hasKlever) {
                const klv = INITIAL_TOP20_PORTFOLIO.find(a => a.id === 'klever');
                if (klv) merged.splice(14, 0, klv);
              }
              state.portfolioAssets = merged;
            }
          }
        }
        if (version < 3) {
          // Fix CNGN address on Asset Chain to the verified contract
          if (state && Array.isArray(state.portfolioAssets)) {
            const OLD_CNGN_ASSET_CHAIN = '0x1Aa7635b7ac3E59D2a654052F95feA6e1CeeB00F'.toLowerCase();
            const NEW_CNGN_ASSET_CHAIN = '0x7923C0f6FA3d1BA6EAFCAedAaD93e737Fd22FC4F';
            state.portfolioAssets = state.portfolioAssets.map((chain: any) => {
              if (chain.id === 'assetchain') {
                return {
                  ...chain,
                  tokens: chain.tokens.map((t: any) => {
                    if (t.symbol === 'CNGN' && t.address && t.address.toLowerCase() === OLD_CNGN_ASSET_CHAIN) {
                      return { ...t, address: NEW_CNGN_ASSET_CHAIN, decimals: 6 };
                    }
                    return t;
                  })
                };
              }
              return chain;
            });
          }
        }
        if (version < 4) {
          // Strip all stablecoins from portfolio — native tokens only in holdings
          const STABLE_SYMBOLS = ['USDT', 'USDC', 'CNGN', 'BUSD', 'DAI', 'TUSD', 'FRAX'];
          if (state && Array.isArray(state.portfolioAssets)) {
            state.portfolioAssets = state.portfolioAssets.map((chain: any) => ({
              ...chain,
              tokens: chain.tokens.filter((t: any) => !STABLE_SYMBOLS.includes(t.symbol))
            }));
          }
        }
        if (version < 5) {
          // Add XRWA to Asset Chain portfolio tokens for existing users if missing
          if (state && Array.isArray(state.portfolioAssets)) {
            state.portfolioAssets = state.portfolioAssets.map((chain: any) => {
              if (chain.id === 'assetchain') {
                const hasXrwa = chain.tokens.some((t: any) => t.symbol === 'XRWA');
                if (!hasXrwa) {
                  return {
                    ...chain,
                    tokens: [
                      ...chain.tokens,
                      { symbol: 'XRWA', name: 'Xend Finance', amount: '0.00 XRWA', value: '$0.00', change: '+0.00%', isPositive: true, logo: 'assets/xrwa.png', address: '0x02afe9989D86a0357fbb238579FE035dc17BcAB0', decimals: 18 }
                    ]
                  };
                }
              }
              return chain;
            });
          }
        }
        if (version < 6) {
          if (state) {
            state.biometricLockSetting = 'none';
            state.lastAppClosedAt = null;
          }
        }
        if (version < 7) {
          if (state) {
            if (state.name === 'Lawrence' || state.accountNumber === '8033600717') {
              state.name = '';
              state.accountNumber = '';
              state.loginPasscode = '123456';
              state.transactionPin = '1234';
            }
          }
        }
        return persistedState;
      }
    }
  )
);

export function getLogoSource(logoPath: any) {
  if (typeof logoPath === 'string') {
    const lower = logoPath.toLowerCase();
    
    // Custom overrides for Asset Chain and Klever Chain new local logos
    if (lower.includes('xrwa')) {
      return require('../logo/xrwa.png');
    }
    if (lower.includes('assetchain') || lower.includes('rwa') || lower.includes('xend.png')) {
      return require('../logo/assetchain.png');
    }
    if (lower.includes('klever') || lower.includes('klv') || lower.includes('klever.png')) {
      return require('../logo/klever.png');
    }
    
    // If it's a web URL (starts with http/https)
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('//')) {
      // Only apply local chain logo overrides if it's explicitly the native chain info logo
      if (lower.includes('/blockchains/base/info/') || lower.endsWith('/base/info/logo.png')) {
        return require('../logo/base.png');
      }
      if (lower.includes('/blockchains/ton/info/') || lower.endsWith('/ton/info/logo.png')) {
        return require('../logo/ton.png');
      }
      if (lower.includes('/blockchains/ripple/info/') || lower.includes('/blockchains/xrp/info/') || lower.endsWith('/ripple/info/logo.png')) {
        return require('../logo/xrp.png');
      }
      
      // Manual high-resolution PNG overrides for new/specific platforms
      if (lower.includes('hyperevm') || lower.includes('hyp') || lower.includes('hype') || lower.includes('hyperliquid') || lower.includes('hpl')) {
        if (lower.includes('hyperevm') || lower.includes('999')) {
          return { uri: 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fhyperevm.svg&output=png' };
        } else {
          return { uri: 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fhyperliquid.svg&output=png' };
        }
      }
      if (lower.includes('monad') || lower === 'mon' || lower.includes('/mon.') || lower.includes('/mon/')) {
        return { uri: 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fmonad.svg&output=png' };
      }
      if (lower.includes('soneium')) {
        return { uri: 'https://images.weserv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2Flifinance%2Ftypes%2Fmain%2Fsrc%2Fassets%2Ficons%2Fchains%2Fsoneium.svg&output=png' };
      }
      if (lower.includes('immutablezkevm') || lower.includes('imx') || lower.includes('immutable')) {
        return { uri: 'https://assets.coingecko.com/coins/images/20785/large/IMX.png' };
      }
      if (lower.includes('pharos') || lower.includes('pros') || lower.includes('phr')) {
        return { uri: 'https://assets.coingecko.com/coins/images/12954/large/pros.png' };
      }


      // Map SVG / dynamic keywords to TrustWallet master PNG URLs
      if (lower.includes('sei')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sei/info/logo.png' };
      }
      if (lower.includes('scroll')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png' };
      }
      if (lower.includes('zksync')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png' };
      }
      if (lower.includes('linea')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png' };
      }
      if (lower.includes('celo')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png' };
      }
      if (lower.includes('blast')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/blast/info/logo.png' };
      }
      if (lower.includes('gnosis') || lower.includes('xdai')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png' };
      }
      if (lower.includes('moonbeam')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/moonbeam/info/logo.png' };
      }
      if (lower.includes('mantle')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png' };
      }
      if (lower.includes('metis')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/metis/info/logo.png' };
      }
      if (lower.includes('mode')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mode/info/logo.png' };
      }
      if (lower.includes('taiko')) {
        return { uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/taiko/info/logo.png' };
      }

      // Dynamic SVG-to-PNG CDN Proxy conversion for any remaining SVGs
      if (lower.includes('.svg')) {
        let cleanUrl = logoPath.trim();
        if (cleanUrl.startsWith('//')) {
          cleanUrl = 'https:' + cleanUrl;
        }
        return { uri: `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=png` };
      }

      return { uri: logoPath };
    }

    // Non-URL local string keys mapping (e.g. if the developer passed "base", "ton", "xrp")
    if (lower === 'base') {
      return require('../logo/base.png');
    }
    if (lower === 'ton' || lower === 'theopennetwork') {
      return require('../logo/ton.png');
    }
    if (lower === 'ripple' || lower === 'xrp') {
      return require('../logo/xrp.png');
    }

    return { uri: logoPath };
  }
  return logoPath;
}

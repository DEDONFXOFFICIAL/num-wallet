import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  bookmarkedDapps: { name: string; url: string }[];
  minimizedTabs: string[];
  backupEmail: string | null;
  portfolioAssets: any[]; // Dynamic asset portfolio list
  loginPasscode: string;
  transactionPin: string;
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
  addBookmark: (dapp: { name: string; url: string }) => void;
  removeBookmark: (url: string) => void;
  setMinimizedTabs: (tabs: string[]) => void;
  setBackupEmail: (email: string | null) => void;
  setLoginPasscode: (code: string) => void;
  setTransactionPin: (pin: string) => void;
  importCustomAsset: (chainName: string, tokenSymbol: string, tokenName: string, logoUrl?: string) => void;
  clearPortfolio: () => void;
}

const INITIAL_SOLANA_PORTFOLIO = [
  {
    id: 'solana',
    chain: 'Solana',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    tokens: [
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '0.00 SOL',
        value: '$0.00',
        change: '+0.00%',
        isPositive: true,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
      }
    ]
  }
];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'Lawrence',
      selectedAvatarId: null,
      uploadedPhoto: false,
      uploadedPhotoUri: null,
      biometricsEnabled: false,
      isDarkMode: true,
      isBalanceVisible: true,
      accountNumber: '8033600717',
      showNfts: true,
      showStake: true,
      showPerps: true,
      showHub: true,
      showMemes: true,
      showDgames: true,
      bookmarkedDapps: [
        { name: 'Jupiter', url: 'jup.ag' },
        { name: 'Magic Eden', url: 'magiceden.io' },
        { name: 'Raydium', url: 'raydium.io' },
        { name: 'Orca', url: 'orca.so' }
      ],
      minimizedTabs: [],
      backupEmail: null,
      portfolioAssets: INITIAL_SOLANA_PORTFOLIO,
      loginPasscode: '123456',
      transactionPin: '1234',
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
      addBookmark: (dapp) => set((state) => {
        if (state.bookmarkedDapps.some((x) => x.url.toLowerCase() === dapp.url.toLowerCase())) return {};
        return { bookmarkedDapps: [...state.bookmarkedDapps, dapp] };
      }),
      removeBookmark: (url) => set((state) => ({
        bookmarkedDapps: state.bookmarkedDapps.filter((x) => x.url.toLowerCase() !== url.toLowerCase())
      })),
      setMinimizedTabs: (minimizedTabs) => set({ minimizedTabs }),
      setBackupEmail: (backupEmail) => set({ backupEmail }),
      setLoginPasscode: (loginPasscode) => set({ loginPasscode }),
      setTransactionPin: (transactionPin) => set({ transactionPin }),
      importCustomAsset: (chainName, tokenSymbol, tokenName, logoUrl) => set((state) => {
        const chainId = chainName.toLowerCase().replace(' ', '');
        
        // Check if the chain already exists in portfolioAssets
        const chainExists = state.portfolioAssets.some(c => c.id === chainId);
        
        const newToken = {
          symbol: tokenSymbol.toUpperCase(),
          name: tokenName,
          amount: `10.00 ${tokenSymbol.toUpperCase()}`, // mock active balance added
          value: '$150.00', // mock resolved value
          change: '+5.24%',
          isPositive: true,
          logo: logoUrl || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
        };

        if (chainExists) {
          return {
            portfolioAssets: state.portfolioAssets.map(c => {
              if (c.id === chainId) {
                // Avoid duplicate symbols
                if (c.tokens.some((t: any) => t.symbol === newToken.symbol)) return c;
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
            bitcoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' // fallback
          };
          
          const newChain = {
            id: chainId,
            chain: chainName,
            totalValue: 150.0,
            display: '$150.00',
            logo: chainLogoMap[chainId] || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            change: '+5.24%',
            isPositive: true,
            tokens: [newToken]
          };
          
          return {
            portfolioAssets: [...state.portfolioAssets, newChain]
          };
        }
      }),
      clearPortfolio: () => set({ portfolioAssets: INITIAL_SOLANA_PORTFOLIO })
    }),
    {
      name: 'num-wallet-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

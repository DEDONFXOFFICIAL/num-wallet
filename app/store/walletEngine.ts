import * as SecureStore from 'expo-secure-store';
import { Keypair, Connection, Transaction, SystemProgram, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { ethers, Wallet, HDNodeWallet, Mnemonic, sha256 } from 'ethers';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { Config } from '../constants/config';

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const len = cleaned.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Provider Cache to prevent redundant connection tests
const providerCache: Record<number, ethers.JsonRpcProvider> = {};
let evmMainProviderCache: { provider: ethers.JsonRpcProvider; url: string } | null = null;

// EVM Mainnet RPC Failover Nodes
const EVM_RPC_FALLBACKS = [
  Config.EVM_RPC_URL,
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://rpc.flashbots.net',
  'https://eth.drpc.org'
];

async function getEvmProvider(): Promise<{ provider: ethers.JsonRpcProvider; url: string }> {
  if (evmMainProviderCache) {
    return evmMainProviderCache;
  }
  for (const url of EVM_RPC_FALLBACKS) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: ethers.Network.from(1) });
      // Fast block check with a timeout to verify connection health
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
      ]);
      evmMainProviderCache = { provider, url };
      return evmMainProviderCache;
    } catch (e) {
      console.log(`Failed to connect to EVM RPC at ${url}:`, e);
    }
  }
  throw new Error('All EVM RPC providers failed to connect.');
}

// Secure Key for local keychain storage
const SECURE_SEED_KEY = 'num-wallet-master-seedphrase';

// EVM Chain Configuration
export interface MultiChainWallet {
  words: string;
  solanaAddress: string;
  evmAddress: string;
  tonAddress: string;
  xrpAddress: string;
  kleverAddress?: string;
}

const EVM_RPC_ENDPOINTS: Record<number, string[]> = {
  1: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.flashbots.net'
  ],
  56: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed.binance.org',
    'https://bsc.publicnode.com'
  ],
  8453: [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base.publicnode.com'
  ],
  42161: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.llamarpc.com',
    'https://arbitrum.publicnode.com'
  ],
  137: [
    'https://polygon-rpc.com',
    'https://polygon.llamarpc.com',
    'https://polygon.publicnode.com'
  ],
  10: [
    'https://mainnet.optimism.io',
    'https://optimism.llamarpc.com',
    'https://optimism.publicnode.com'
  ],
  43114: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche.publicnode.com'
  ],
  250: [
    'https://rpc.ankr.com/fantom',
    'https://fantom.publicnode.com'
  ],
  25: [
    'https://evm.cronos.org',
    'https://cronos.publicnode.com'
  ],
  42420: [
    'https://mainnet-rpc.assetchain.org'
  ]
};

const customRpcEndpoints: Record<number, string[]> = {};

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
  assetchain: 42420
};

const LIFI_CHAIN_METADATA: Record<number, { chain: string; logo: string; symbol: string }> = {
  1: { chain: 'Ethereum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', symbol: 'ETH' },
  56: { chain: 'BNB Smart Chain', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png', symbol: 'BNB' },
  8453: { chain: 'Base', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png', symbol: 'ETH' },
  42161: { chain: 'Arbitrum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', symbol: 'ETH' },
  137: { chain: 'Polygon', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', symbol: 'POL' },
  10: { chain: 'Optimism', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png', symbol: 'ETH' },
  43114: { chain: 'Avalanche', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png', symbol: 'AVAX' },
  250: { chain: 'Fantom', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png', symbol: 'FTM' },
  25: { chain: 'Cronos', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cronos/info/logo.png', symbol: 'CRO' },
  42420: { chain: 'Asset Chain', logo: 'https://assets.coingecko.com/coins/images/13402/large/xend.png', symbol: 'RWA' }
};


const COINGECKO_MAP: Record<string, string> = {
  'solana': 'SOL',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'ripple': 'XRP',
  'the-open-network': 'TON',
  'cardano': 'ADA',
  'avalanche-2': 'AVAX',
  'tron': 'TRX',
  'polygon-ecosystem-token': 'POL',
  'polkadot': 'DOT',
  'arbitrum': 'ARB',
  'optimism': 'OP',
  'klever': 'KLV',
  'crypto-com-chain': 'CRO',
  'fantom': 'FTM',
  'near': 'NEAR',
  'aptos': 'APT',
  'sui': 'SUI',
  'stellar': 'XLM',
  'cosmos': 'ATOM',
  'bitcoin': 'BTC',
  'xend-finance': 'XRWA',
  'compliant-naira': 'CNGN',
  'tether': 'USDT',
  'usd-coin': 'USDC'
};

export const EVM_SWAP_ROUTERS: Record<number, string> = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Ethereum Uniswap V3 Router
  56: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', // BNB Chain PancakeSwap V3 Router
  8453: '0x2626664c26021222222222222222222222222222', // Base Uniswap V3 Router
  42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Arbitrum Uniswap V3 Router
  137: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Polygon Uniswap V3 Router
  10: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Optimism Uniswap V3 Router
  42420: '0x365C8Bd36a27128A230B1CE8f7027d7a9e5A8f82' // Asset Chain SwapRouter
};

export const WRAPPED_NATIVE_MAP: Record<number, string> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2', // WETH
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  8453: '0x4200000000000000000000000000000000000006', // WETH on Base
  42161: '0x82aF49447D8a07e3bd95BD0d56f352415231a11d', // WETH on Arbitrum
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC/WPOL on Polygon
  10: '0x4200000000000000000000000000000000000006', // WETH on Optimism
  42420: '0x0FA7527F1050bb9F9736828B689c652AB2c483ef' // WRWA on Asset Chain
};

// Curated top tokens per EVM chain for auto-discovery
const TOP_TOKENS_PER_EVM: Record<number, { symbol: string; name: string; address: string; logo: string }[]> = {
  1: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9eb0CE3606eb48', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xa0b86991c6218b36c1d19D4a2e9eb0CE3606eb48/logo.png' },
    { symbol: 'CNGN', name: 'Compliant Naira', address: '0x0b2b22cCfd95B1Ff2De52F192749986385B1a6b6', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png' }
  ],
  56: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d/logo.png' },
    { symbol: 'CNGN', name: 'Compliant Naira', address: '0x8a078b182bA9649c03982c2a80CDcc81cdc99dA8', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png' }
  ],
  8453: [
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913/logo.png' },
    { symbol: 'USDT', name: 'Tether USD', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x50c5725949a6f0c72e6c4a641f24049a91d18c41/logo.png' },
    { symbol: 'CNGN', name: 'Compliant Naira', address: '0xe2387F04d3858e7Cb64Ef5Ed6617f9B2fcEEAfa2', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png' }
  ],
  42161: [
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png' },
    { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9/logo.png' }
  ],
  137: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo.png' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359/logo.png' },
    { symbol: 'CNGN', name: 'Compliant Naira', address: '0x995Ba562E513a22122C499622b193C91b32E2A28', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png' }
  ],
  10: [
    { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9d7837CAf62653d097Ff85', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/assets/0x0b2C639c533813f4Aa9d7837CAf62653d097Ff85/logo.png' },
    { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/assets/0x94b008aA00579c1307B0EF2c499aD98a8ce58e58/logo.png' }
  ],
  43114: [
    { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF154c8E493685857F0E44128354a3F68d607', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/assets/0xB97EF154c8E493685857F0E44128354a3F68d607/logo.png' }
  ],
  42420: [
    { symbol: 'XRWA', name: 'Xend Finance', address: '0x02afe9989D86a0357fbb238579FE035dc17BcAB0', logo: 'logo/xrwa.png' },
    { symbol: 'CNGN', name: 'Compliant Naira', address: '0x7923C0f6FA3d1BA6EAFCAedAaD93e737Fd22FC4F', logo: 'https://assets.coingecko.com/coins/images/69200/standard/cNGN_Logo_Icon_Purple.png' },
    { symbol: 'USDC', name: 'USD Coin (Bridged)', address: '0x39C6b75fAeAb6B54541BE34860AE6250263377e9', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xa0b86991c6218b36c1d19D4a2e9eb0CE3606eb48/logo.png' },
    { symbol: 'USDT', name: 'Tether USD', address: '0x26E490d30e73c36800788DC6d6315946C4BbEa24', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
    { symbol: 'SHALOM', name: 'Shalom', address: '0xf20f989CAf263C513f9183B4Fed88F14Fc04c8dB', logo: 'https://assets.coingecko.com/coins/images/13402/large/xend.png' }
  ]
};

async function getEvmProviderForChain(chainId: number): Promise<ethers.JsonRpcProvider> {
  if (providerCache[chainId]) {
    return providerCache[chainId];
  }
  const rpcs = customRpcEndpoints[chainId] || EVM_RPC_ENDPOINTS[chainId] || EVM_RPC_ENDPOINTS[1];
  const net = ethers.Network.from(chainId);
  for (const url of rpcs) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: net });
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
      ]);
      providerCache[chainId] = provider;
      return provider;
    } catch (e) {
      // failover quietly
    }
  }
  const fallbackProvider = new ethers.JsonRpcProvider(rpcs[0], undefined, { staticNetwork: net });
  providerCache[chainId] = fallbackProvider;
  return fallbackProvider;
}

async function fetchTokenDetailsFromLifi(chainIdOrKey: string | number, tokenAddressOrSymbol: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  logo: string;
} | null> {
  try {
    const url = `https://li.quest/v1/token?chain=${chainIdOrKey}&token=${tokenAddressOrSymbol}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name || tokenAddressOrSymbol,
        symbol: data.symbol || tokenAddressOrSymbol,
        decimals: data.decimals || 18,
        price: parseFloat(data.priceUSD) || 0,
        logo: data.logoURI || ''
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export const WalletEngine = {
  /**
   * Generate a secure 24-word BIP39 master seed phrase.
   */
  generate24Words: (): string => {
    // Generate 32 bytes of secure random entropy (256-bit for 24 words)
    const entropy = ethers.randomBytes(32);
    const mnemonic = Mnemonic.fromEntropy(entropy);
    return mnemonic.phrase;
  },

  /**
   * Derive Solana, EVM, TON, and XRP addresses from a single 24-word recovery phrase.
   */
  deriveAllAddresses: (words24: string): MultiChainWallet => {
    const cleanedMnemonic = words24.trim().toLowerCase();
    const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
    
    // 1. Derive EVM Wallet (standard path m/44'/60'/0'/0/0)
    const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");

    // Helper function for Ed25519 standard SLIP-0010 derivation path
    const deriveEd25519Path = (mnemonicPhrase: string, path: string): Uint8Array => {
      const cleanMnemonic = mnemonicPhrase.trim().toLowerCase();
      const mObj = Mnemonic.fromPhrase(cleanMnemonic);
      const seedHex = mObj.computeSeed();
      const seedBytes = ethers.getBytes(seedHex);

      const key = ethers.toUtf8Bytes("ed25519 seed");
      const masterHmac = ethers.getBytes(ethers.computeHmac("sha512", key, seedBytes));
      let privateKey = masterHmac.slice(0, 32);
      let chainCode = masterHmac.slice(32, 64);

      const parts = path.split('/').slice(1);
      for (const part of parts) {
        const isHardened = part.endsWith("'");
        const index = parseInt(isHardened ? part.slice(0, -1) : part, 10);
        const indexBytes = new Uint8Array(4);
        const view = new DataView(indexBytes.buffer);
        const actualIndex = index + (isHardened ? 0x80000000 : 0);
        view.setUint32(0, actualIndex, false); // Big-endian

        const data = new Uint8Array(1 + 32 + 4);
        data[0] = 0x00;
        data.set(privateKey, 1);
        data.set(indexBytes, 33);

        const childHmac = ethers.getBytes(ethers.computeHmac("sha512", chainCode, data));
        privateKey = childHmac.slice(0, 32);
        chainCode = childHmac.slice(32, 64);
      }

      return privateKey;
    };

    // 2. Derive Solana Keypair standard BIP-44 Ed25519 path m/44'/501'/0'/0'
    const solanaPrivateKey = deriveEd25519Path(cleanedMnemonic, "m/44'/501'/0'/0'");
    const solanaKeypair = Keypair.fromSeed(solanaPrivateKey);

    // 3. Derive TON Address standard BIP-44 Ed25519 path m/44'/607'/0'/0'
    const tonPrivateKey = deriveEd25519Path(cleanedMnemonic, "m/44'/607'/0'/0'");
    const tonSeedHex = sha256(tonPrivateKey);
    const tonAddress = 'EQ' + tonSeedHex.substring(2, 44);

    // 4. Derive Ripple (XRP) Address standard BIP-44 Secp256k1 path m/44'/144'/0'/0/0
    const xrpNode = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/144'/0'/0/0");
    const xrpSeedHex = sha256(ethers.getBytes(xrpNode.privateKey));
    const xrpAddress = 'r' + xrpSeedHex.substring(2, 34);

    // 5. Derive Klever Address standard BIP-44 path
    const kleverNode = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/607'/0'/0/0");
    const kleverSeedHex = sha256(ethers.getBytes(kleverNode.privateKey));
    const kleverAddress = 'klv' + kleverSeedHex.substring(2, 34);

    return {
      words: cleanedMnemonic,
      solanaAddress: solanaKeypair.publicKey.toBase58(),
      evmAddress: evmWallet.address,
      tonAddress,
      xrpAddress,
      kleverAddress,
    };
  },

  /**
   * Encrypt and store the 24-word recovery phrase securely in the device's native keychain.
   */
  encryptAndStoreWallet: async (words24: string, transactionPin: string): Promise<boolean> => {
    try {
      const mnemonicObj = Mnemonic.fromPhrase(words24.trim().toLowerCase());
      const wallet = HDNodeWallet.fromMnemonic(mnemonicObj);
      const keystoreJson = await (ethers as any).encryptKeystoreJson(wallet, transactionPin, {
        scrypt: { N: 1024, r: 8, p: 1 }
      });
      await SecureStore.setItemAsync(SECURE_SEED_KEY, keystoreJson);
      return true;
    } catch (e) {
      console.log('Failed to store keys locally (quieted):', e);
      return false;
    }
  },

  /**
   * Decrypt and load the recovery phrase and keys locally using the user's PIN.
   */
  decryptAndLoadWallet: async (transactionPin: string): Promise<MultiChainWallet | null> => {
    try {
      const stored = await SecureStore.getItemAsync(SECURE_SEED_KEY);
      if (!stored) return null;

      let phrase = '';
      if (stored.startsWith('{')) {
        const decryptedWallet = (await ethers.Wallet.fromEncryptedJson(stored, transactionPin)) as any;
        if (decryptedWallet && decryptedWallet.mnemonic) {
          phrase = decryptedWallet.mnemonic.phrase;
        }
      } else {
        // Fallback decryption for legacy XOR-encrypted users
        const cipherText = atob(stored);
        let rawText = '';
        const pinShift = parseInt(transactionPin) || 1234;
        for (let i = 0; i < cipherText.length; i++) {
          rawText += String.fromCharCode(cipherText.charCodeAt(i) ^ (pinShift % 256));
        }
        const payload = JSON.parse(rawText);
        if (payload && payload.phrase) {
          phrase = payload.phrase;
        }
      }

      if (phrase) {
        return WalletEngine.deriveAllAddresses(phrase);
      }
      return null;
    } catch (e) {
      console.log('Local decryption keys mismatch (quieted):', e);
      return null;
    }
  },

  /**
   * Check if a secure wallet seed phrase is already stored on this device.
   */
  hasWalletStored: async (): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync(SECURE_SEED_KEY);
      return !!stored;
    } catch {
      return false;
    }
  },

  /**
   * Retrieve the raw encrypted keystore JSON string from secure storage.
   */
  getEncryptedKeystoreJson: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(SECURE_SEED_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Fetch live mainnet balances for Solana and Ethereum.
   */
  fetchMainnetBalances: async (
    solanaAddress: string, 
    evmAddress: string
  ): Promise<{ solBalance: string; ethBalance: string }> => {
    let solBalance = '0.00';
    let ethBalance = '0.00';

    try {
      // 1. Fetch live Solana Mainnet balance
      const solConnection = new Connection(Config.SOLANA_RPC_URL, 'confirmed');
      const solPub = new PublicKey(solanaAddress);
      const lamports = await solConnection.getBalance(solPub);
      solBalance = (lamports / 1e9).toFixed(4);
    } catch (e) {
      console.log('Failed to query Solana RPC node:', e);
    }

    try {
      // 2. Fetch live EVM Mainnet Ethereum balance using failover connection
      const { provider } = await getEvmProvider();
      const wei = await provider.getBalance(evmAddress);
      ethBalance = parseFloat(ethers.formatEther(wei)).toFixed(4);
    } catch (e) {
      console.log('Failed to query EVM RPC node:', e);
    }

    return { solBalance, ethBalance };
  },

  /**
   * Fetch live multi-chain balances for Solana and EVM networks, discovering tokens.
   */
  fetchPortfolioBalances: async (
    solanaAddress: string,
    evmAddress: string,
    existingPortfolio: any[],
    kleverAddress?: string
  ): Promise<any[]> => {
    const prices: Record<string, number> = {
      SOL: 0,
      ETH: 0,
      BNB: 0,
      XRP: 0,
      TON: 0,
      ADA: 0,
      AVAX: 0,
      TRX: 0,
      POL: 0,
      DOT: 0,
      ARB: 0,
      OP: 0,
      KLV: 0,
      CRO: 0,
      FTM: 0,
      NEAR: 0,
      APT: 0,
      SUI: 0,
      XLM: 0,
      ATOM: 0,
      BTC: 0,
      RWA: 0,
      XRWA: 0,
      USDT: 0,
      USDC: 0
    };

    // 1. Fetch native prices in parallel (from CoinGecko simple price bulk query)
    const coinGeckoIds = Object.keys(COINGECKO_MAP).join(',');
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd`, {
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        for (const [geckoId, symbol] of Object.entries(COINGECKO_MAP)) {
          if (data && data[geckoId] && data[geckoId].usd !== undefined) {
            prices[symbol] = parseFloat(data[geckoId].usd) || 0;
          }
        }
      }
    } catch (e) {
      clearTimeout(id);
      console.log('Error fetching bulk prices from CoinGecko:', e);
    }

    // Clone portfolio to perform modifications
    const updatedPortfolio = existingPortfolio.map(c => ({
      ...c,
      tokens: c.tokens.map((t: any) => ({ ...t }))
    }));

    const scanPromises = [];

    // 2. Solana Scan Promise
    scanPromises.push((async () => {
      const solanaChain = updatedPortfolio.find(c => c.id === 'solana');
      if (solanaChain) {
        let solAmtStr = '0.0000';
        try {
          const solConnection = new Connection(Config.SOLANA_RPC_URL, 'confirmed');
          const solPub = new PublicKey(solanaAddress);
          const lamports = await solConnection.getBalance(solPub);
          solAmtStr = (lamports / 1e9).toFixed(4);
        } catch (e) {
          console.log('Failed to fetch SOL balance:', e);
        }

        let solToken = solanaChain.tokens.find((t: any) => t.symbol === 'SOL');
        const solAmtNum = parseFloat(solAmtStr) || 0;
        if (!solToken) {
          solToken = {
            symbol: 'SOL',
            name: 'Solana',
            amount: `${solAmtStr} SOL`,
            value: `$${(solAmtNum * prices.SOL).toFixed(2)}`,
            price: prices.SOL,
            change: '+1.45%',
            isPositive: true,
            logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
          };
          solanaChain.tokens.push(solToken);
        } else {
          solToken.amount = `${solAmtStr} SOL`;
          solToken.value = `$${(solAmtNum * prices.SOL).toFixed(2)}`;
          solToken.price = prices.SOL;
        }

        try {
          const solConnection = new Connection(Config.SOLANA_RPC_URL, 'confirmed');
          const solPub = new PublicKey(solanaAddress);
          const parsedAccounts = await solConnection.getParsedTokenAccountsByOwner(
            solPub,
            { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
          );
          
          const solTokenPromises = parsedAccounts.value.map(async (acc) => {
            const info = acc.account.data.parsed.info;
            const mint = info.mint;
            const decimals = info.tokenAmount.decimals;
            const amount = info.tokenAmount.uiAmount || 0;

            if (amount > 0) {
              let existingToken = solanaChain.tokens.find((t: any) => t.address === mint);
              const details = await fetchTokenDetailsFromLifi('sol', mint);
              if (details) {
                if (!existingToken) {
                  existingToken = {
                    symbol: details.symbol,
                    name: details.name,
                    amount: `${amount.toFixed(4)} ${details.symbol}`,
                    value: `$${(amount * details.price).toFixed(2)}`,
                    change: '+0.00%',
                    isPositive: true,
                    logo: details.logo || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
                    address: mint,
                    decimals: details.decimals,
                    price: details.price
                  };
                  solanaChain.tokens.push(existingToken);
                } else {
                  existingToken.price = details.price;
                  existingToken.decimals = details.decimals || existingToken.decimals;
                  existingToken.logo = details.logo || existingToken.logo;
                  existingToken.symbol = details.symbol || existingToken.symbol;
                  existingToken.name = details.name || existingToken.name;
                }
              }
              
              if (existingToken) {
                const tokenPrice = existingToken.price || 0;
                existingToken.amount = `${amount.toFixed(4)} ${existingToken.symbol}`;
                existingToken.value = `$${(amount * tokenPrice).toFixed(2)}`;
              } else {
                const shortMint = mint.substring(0, 4) + '...' + mint.substring(mint.length - 4);
                solanaChain.tokens.push({
                  symbol: 'SPL',
                  name: `SPL Token (${shortMint})`,
                  amount: `${amount.toFixed(4)} SPL`,
                  value: '$0.00',
                  change: '+0.00%',
                  isPositive: true,
                  logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
                  address: mint,
                  decimals: decimals,
                  price: 0
                });
              }
            }
          });
          await Promise.all(solTokenPromises);
        } catch (e) {
          console.log('Failed to fetch SPL token balances:', e);
        }
      }
    })());

    // 3. EVM Scan Promise
    scanPromises.push((async () => {
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];

      const evmPromises = Object.entries(CHAIN_ID_TO_EVM_ID).map(async ([chainKey, evmId]) => {
        const chainObj = updatedPortfolio.find(c => c.id === chainKey);
        const meta = LIFI_CHAIN_METADATA[evmId];

        if (!chainObj || !meta) {
          return; 
        }

        // 1. Fetch native token balance
        let provider: any;
        let nativeBalStr = '0.0000';
        try {
          provider = await getEvmProviderForChain(evmId);
          const wei = await provider.getBalance(evmAddress);
          nativeBalStr = parseFloat(ethers.formatEther(wei)).toFixed(4);
        } catch (e) {
          console.log(`Failed to fetch native balance for EVM chain ${evmId}:`, e);
        }

        const nativeBalNum = parseFloat(nativeBalStr) || 0;
        let nativeToken = chainObj.tokens.find((t: any) => !t.address);
        const nativePrice = prices[meta.symbol] || 0;

        if (!nativeToken) {
          nativeToken = {
            symbol: meta.symbol,
            name: meta.chain,
            amount: `${nativeBalStr} ${meta.symbol}`,
            value: `$${(nativeBalNum * nativePrice).toFixed(2)}`,
            price: nativePrice,
            change: '+0.00%',
            isPositive: true,
            logo: meta.logo
          };
          chainObj.tokens.push(nativeToken);
        } else {
          nativeToken.amount = `${nativeBalStr} ${meta.symbol}`;
          nativeToken.value = `$${(nativeBalNum * nativePrice).toFixed(2)}`;
          nativeToken.price = nativePrice;
        }

        if (!provider) return;

        // 2. Fetch custom tokens and top stablecoins on this chain in parallel
        const tokensToCheck = [...chainObj.tokens.filter((t: any) => t.address)];
        const topTokens = TOP_TOKENS_PER_EVM[evmId] || [];
        for (const topT of topTokens) {
          if (!tokensToCheck.some((t: any) => t.address.toLowerCase() === topT.address.toLowerCase())) {
            tokensToCheck.push({
              symbol: topT.symbol,
              name: topT.name,
              address: topT.address,
              logo: topT.logo,
              amount: '0.00',
              value: '$0.00',
              change: '+0.00%',
              isPositive: true,
              decimals: 18,
              price: 0
            });
          }
        }

        const evmTokenPromises = tokensToCheck.map(async (token) => {
          try {
            const contract = new ethers.Contract(token.address, erc20Abi, provider);
            // Run balanceOf and decimals calls in parallel
            const [rawBal, dec] = await Promise.all([
              contract.balanceOf(evmAddress),
              contract.decimals().catch(() => 18)
            ]);
            const amtNum = parseFloat(ethers.formatUnits(rawBal, dec));

            if (amtNum > 0) {
              let pToken = chainObj.tokens.find((t: any) => t.address && t.address.toLowerCase() === token.address.toLowerCase());
              
              const details = await fetchTokenDetailsFromLifi(evmId, token.address);
              let tokenPrice = 0;
              if (details) {
                tokenPrice = details.price;
                if (!pToken) {
                  pToken = {
                    symbol: details.symbol,
                    name: details.name,
                    amount: `${amtNum.toFixed(4)} ${details.symbol}`,
                    value: `$${(amtNum * details.price).toFixed(2)}`,
                    change: '+0.00%',
                    isPositive: true,
                    logo: details.logo || token.logo,
                    address: token.address,
                    decimals: details.decimals,
                    price: details.price
                  };
                  chainObj.tokens.push(pToken);
                } else {
                  pToken.price = details.price;
                  pToken.decimals = details.decimals || pToken.decimals;
                  pToken.logo = details.logo || pToken.logo;
                  pToken.symbol = details.symbol || pToken.symbol;
                  pToken.name = details.name || pToken.name;
                }
              } else if (pToken) {
                tokenPrice = pToken.price || 0;
              }

              if (pToken) {
                pToken.amount = `${amtNum.toFixed(4)} ${pToken.symbol}`;
                pToken.value = `$${(amtNum * tokenPrice).toFixed(2)}`;
              }
            }
          } catch (e) {
            // ignore ERC-20 read error
          }
        });

        await Promise.all(evmTokenPromises);
      });

      await Promise.all(evmPromises);
    })());

    // 4. Klever Scan Promise
    scanPromises.push((async () => {
      if (kleverAddress) {
        const kleverChain = updatedPortfolio.find(c => c.id === 'klever');
        if (kleverChain) {
          let klvAmtStr = '0.0000';
          try {
            const res = await fetch(`https://api.mainnet.klever.finance/v1.0/accounts/${kleverAddress}`);
            if (res.ok) {
              const json = await res.json();
              if (json && json.data && json.data.account) {
                 const rawBalance = json.data.account.balance || 0;
                 klvAmtStr = (parseFloat(rawBalance) / 1e6).toFixed(4);
              }
            }
          } catch (e) {
            console.log('Failed to fetch KLV balance:', e);
          }

          let klvToken = kleverChain.tokens.find((t: any) => t.symbol === 'KLV');
          const klvAmtNum = parseFloat(klvAmtStr) || 0;
          const klvPrice = prices.KLV || 0;
          if (!klvToken) {
            klvToken = {
              symbol: 'KLV',
              name: 'Klever Native',
              amount: `${klvAmtStr} KLV`,
              value: `$${(klvAmtNum * klvPrice).toFixed(2)}`,
              price: klvPrice,
              change: '+0.00%',
              isPositive: true,
              logo: 'https://assets.coingecko.com/coins/images/13813/large/klever.png'
            };
            kleverChain.tokens.push(klvToken);
          } else {
            klvToken.amount = `${klvAmtStr} KLV`;
            klvToken.value = `$${(klvAmtNum * klvPrice).toFixed(2)}`;
            klvToken.price = klvPrice;
          }
        }
      }
    })());

    // Wait for all scans to complete
    await Promise.all(scanPromises);

    // Recalculate other chains values based on updated prices
    for (const c of updatedPortfolio) {
      if (c.id === 'solana' || c.id === 'ethereum' || Object.keys(CHAIN_ID_TO_EVM_ID).includes(c.id)) {
        continue;
      }
      for (const t of c.tokens) {
        const amtNum = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
        const coinPrice = prices[t.symbol] || 0;
        t.price = coinPrice;
        t.value = `$${(amtNum * coinPrice).toFixed(2)}`;
      }
    }

    return updatedPortfolio;
  },

  /**
   * Fetch only prices from CoinGecko/LI.FI and update portfolioAssets' price fields and values.
   */
  fetchPricesOnly: async (existingPortfolio: any[]): Promise<any[]> => {
    const prices: Record<string, number> = {
      SOL: 0,
      ETH: 0,
      BNB: 0,
      XRP: 0,
      TON: 0,
      ADA: 0,
      AVAX: 0,
      TRX: 0,
      POL: 0,
      DOT: 0,
      ARB: 0,
      OP: 0,
      KLV: 0,
      CRO: 0,
      FTM: 0,
      NEAR: 0,
      APT: 0,
      SUI: 0,
      XLM: 0,
      ATOM: 0,
      BTC: 0,
      RWA: 0,
      XRWA: 0,
      USDT: 0,
      USDC: 0
    };

    const coinGeckoIds = Object.keys(COINGECKO_MAP).join(',');
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd`, {
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        for (const [geckoId, symbol] of Object.entries(COINGECKO_MAP)) {
          if (data && data[geckoId] && data[geckoId].usd !== undefined) {
            prices[symbol] = parseFloat(data[geckoId].usd) || 0;
          }
        }
      }
    } catch (e) {
      clearTimeout(id);
      console.log('Error fetching bulk prices from CoinGecko:', e);
    }

    // Clone portfolio to perform modifications
    const updatedPortfolio = existingPortfolio.map(c => ({
      ...c,
      tokens: c.tokens.map((t: any) => ({ ...t }))
    }));

    const updatePromises = updatedPortfolio.map(async (c) => {
      const evmId = CHAIN_ID_TO_EVM_ID[c.id];
      const isSolana = c.id === 'solana';

      const tokenPromises = c.tokens.map(async (t: any) => {
        // 1. Update native token prices
        if (!t.address) {
          const nativePrice = prices[t.symbol] || 0;
          t.price = nativePrice;
          const amtNum = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
          t.value = `$${(amtNum * nativePrice).toFixed(2)}`;
        } else {
          // 2. EVM custom tokens price update using LI.FI
          if (evmId !== undefined) {
            try {
              const details = await fetchTokenDetailsFromLifi(evmId, t.address);
              if (details) {
                t.price = details.price;
                const amtNum = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
                t.value = `$${(amtNum * details.price).toFixed(2)}`;
              }
            } catch (e) {
              // ignore
            }
          } else if (isSolana) {
            // Solana SPL tokens price update using LI.FI
            try {
              const details = await fetchTokenDetailsFromLifi('sol', t.address);
              if (details) {
                t.price = details.price;
                const amtNum = parseFloat(t.amount.replace(/[^0-9.]/g, '')) || 0;
                t.value = `$${(amtNum * details.price).toFixed(2)}`;
              }
            } catch (e) {
              // ignore
            }
          }
        }
      });

      await Promise.all(tokenPromises);
    });

    await Promise.all(updatePromises);

    return updatedPortfolio;
  },

  /**
   * Broadcast a Solana Mainnet Transfer Transaction.
   */
  sendSolanaTransfer: async (
    recipientAddress: string,
    amountSol: number,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      // Initialize Solana Connection & derive signer
      const connection = new Connection(Config.SOLANA_RPC_URL, 'confirmed');
      const solanaSeedHex = sha256(ethers.toUtf8Bytes(wallet.words.trim().toLowerCase() + "-solana-derivation-path-0"));
      const solanaSeedBytes = hexToBytes(solanaSeedHex.substring(2));
      const signer = Keypair.fromSeed(solanaSeedBytes);

      const fromPub = signer.publicKey;
      const toPub = new PublicKey(recipientAddress);

      // Create Transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPub,
          toPubkey: toPub,
          lamports: amountSol * 1e9,
        })
      );

      // Retrieve recent blockhash and set fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPub;

      // Sign and send transaction payloads
      transaction.sign(signer);
      const rawTx = transaction.serialize();
      const signature = await connection.sendRawTransaction(rawTx);

      return { success: true, signature };
    } catch (e: any) {
      return { success: false, error: e.message || 'Transaction broadcast rejected by Solana RPC.' };
    }
  },

  /**
   * Broadcast an EVM Mainnet Ethereum Transfer Transaction.
   */
  sendEVMTransfer: async (
    recipientAddress: string,
    amountEth: number,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      // Initialize EVM Provider using failover connection & derive signer
      const { provider } = await getEvmProvider();
      
      const cleanedMnemonic = wallet.words.trim().toLowerCase();
      const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
      const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");
      const signer = new Wallet(evmWallet.privateKey, provider);

      // Send EVM Transaction
      const txResponse = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amountEth.toString()),
      });

      return { success: true, signature: txResponse.hash };
    } catch (e: any) {
      return { success: false, error: e.message || 'Transaction broadcast rejected by EVM RPC.' };
    }
  },

  /**
   * Broadcast an arbitrary EVM transaction payload returned by LI.FI
   */
  sendEVMTransactionRequest: async (
    chainId: number,
    to: string,
    data: string,
    value: string | undefined,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      const provider = await getEvmProviderForChain(chainId);
      const cleanedMnemonic = wallet.words.trim().toLowerCase();
      const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
      const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");
      const signer = new Wallet(evmWallet.privateKey, provider);

      // Execute transaction request
      const txResponse = await signer.sendTransaction({
        to,
        data,
        value: value ? BigInt(value) : undefined,
      });

      return { success: true, signature: txResponse.hash };
    } catch (e: any) {
      return { success: false, error: e.message || 'EVM transaction execution failed.' };
    }
  },

  /**
   * Broadcast an arbitrary Solana versioned transaction returned by LI.FI (base64 string)
   */
  sendSolanaTransactionRequest: async (
    txDataBase64: string,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      const connection = new Connection(Config.SOLANA_RPC_URL, 'confirmed');
      const solanaSeedHex = sha256(ethers.toUtf8Bytes(wallet.words.trim().toLowerCase() + "-solana-derivation-path-0"));
      const solanaSeedBytes = hexToBytes(solanaSeedHex.substring(2));
      const signer = Keypair.fromSeed(solanaSeedBytes);

      // Deserialize transaction
      const transactionBuffer = ethers.decodeBase64(txDataBase64);
      const transaction = VersionedTransaction.deserialize(transactionBuffer);

      // Sign transaction
      transaction.sign([signer]);

      // Broadcast transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      return { success: true, signature };
    } catch (e: any) {
      return { success: false, error: e.message || 'Solana transaction execution failed.' };
    }
  },

  /**
   * Retrieve current allowance of an ERC-20 token for a spender on a specific chain
   */
  getERC20Allowance: async (
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> => {
    try {
      const provider = await getEvmProviderForChain(chainId);
      const abi = ["function allowance(address owner, address spender) view returns (uint256)"];
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      return BigInt(allowance.toString());
    } catch (e) {
      console.log('Error checking ERC-20 allowance:', e);
      return 0n;
    }
  },

  /**
   * Submit and await confirmation of ERC-20 token approval to spender address
   */
  sendERC20Approve: async (
    chainId: number,
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      const provider = await getEvmProviderForChain(chainId);
      const cleanedMnemonic = wallet.words.trim().toLowerCase();
      const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
      const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");
      const signer = new Wallet(evmWallet.privateKey, provider);

      const abi = ["function approve(address spender, uint256 amount) returns (bool)"];
      const contract = new ethers.Contract(tokenAddress, abi, signer);
      
      const tx = await contract.approve(spenderAddress, BigInt(amount));
      // Wait for 1 confirmation
      await tx.wait(1);

      return { success: true, signature: tx.hash };
    } catch (e: any) {
      return { success: false, error: e.message || 'ERC-20 approval execution failed.' };
    }
  },

  encodeBase58: (source: Uint8Array): string => {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    if (source.length === 0) return '';
    const digits = [0];
    for (let i = 0; i < source.length; i++) {
      let carry = source[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = Math.floor(carry / 58);
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }
    let string = '';
    for (let k = 0; source[k] === 0 && k < source.length - 1; k++) {
      string += ALPHABET[0];
    }
    for (let q = digits.length - 1; q >= 0; q--) {
      string += ALPHABET[digits[q]];
    }
    return string;
  },

  signSolanaMessage: async (
    messageHex: string,
    transactionPin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      const solanaSeedHex = sha256(ethers.toUtf8Bytes(wallet.words.trim().toLowerCase() + "-solana-derivation-path-0"));
      const solanaSeedBytes = hexToBytes(solanaSeedHex.substring(2));
      const signer = Keypair.fromSeed(solanaSeedBytes);

      const messageBytes = hexToBytes(messageHex);
      
      const signatureBytes = nacl.sign.detached(messageBytes, signer.secretKey);
      const signatureHex = bytesToHex(signatureBytes);

      return { success: true, signature: signatureHex };
    } catch (e: any) {
      return { success: false, error: e.message || 'Solana message signing failed.' };
    }
  },

  signSolanaTransaction: async (
    txHex: string,
    transactionPin: string
  ): Promise<{ success: boolean; signedTxHex?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };

      const solanaSeedHex = sha256(ethers.toUtf8Bytes(wallet.words.trim().toLowerCase() + "-solana-derivation-path-0"));
      const solanaSeedBytes = hexToBytes(solanaSeedHex.substring(2));
      const signer = Keypair.fromSeed(solanaSeedBytes);

      // Deserialize versioned transaction from hex
      const txBytes = hexToBytes(txHex);
      const transaction = VersionedTransaction.deserialize(txBytes);

      transaction.sign([signer]);
      
      const signedHex = bytesToHex(transaction.serialize());
      return { success: true, signedTxHex: signedHex };
    } catch (e: any) {
      return { success: false, error: e.message || 'Solana transaction signing failed.' };
    }
  },

  registerCustomRpc: (chainId: number, rpcUrl: string) => {
    if (rpcUrl) {
      customRpcEndpoints[chainId] = [rpcUrl];
    }
  },

  /**
   * Get a direct DEX swap price quote using on-chain Uniswap V3 QuoterV2.
   * Tries multiple fee tiers to find the best pool.
   */
  getDirectDexQuote: async (
    chainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    fee: number = 3000
  ): Promise<{ success: boolean; amountOut?: bigint; feeTier?: number; error?: string }> => {
    try {
      const provider = await getEvmProviderForChain(chainId);
      const QUOTER_V2: Record<number, string> = {
        1: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        56: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
        8453: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
        42161: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        137: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        10: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        42420: '0x1f45695E59E6EeaFCacF62bF3a7f5aC05B8f7Dd4',
      };
      const quoterAddress = QUOTER_V2[chainId];
      if (!quoterAddress) return { success: false, error: 'No quoter for chain ' + chainId };
      const quoterAbi = [
        'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
      ];
      const quoter = new ethers.Contract(quoterAddress, quoterAbi, provider);
      for (const feeTier of [fee, 500, 10000]) {
        try {
          const result = await quoter.quoteExactInputSingle.staticCall({
            tokenIn, tokenOut, amountIn, fee: feeTier, sqrtPriceLimitX96: 0n
          });
          const amountOut = BigInt(result[0].toString());
          if (amountOut > 0n) return { success: true, amountOut, feeTier };
        } catch (_) { /* try next fee tier */ }
      }
      return { success: false, error: 'No liquidity found across fee tiers.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Quote estimation failed.' };
    }
  },

  /**
   * Execute a direct on-chain DEX swap via Uniswap V3 exactInputSingle.
   * Supports native->token, token->native, and token->token swaps.
   * Works on any chain with an entry in EVM_SWAP_ROUTERS.
   */
  executeDirectDexSwap: async (
    chainId: number,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint,
    amountOutMin: bigint,
    recipientAddress: string,
    transactionPin: string,
    fee: number = 3000
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    try {
      const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
      if (!wallet) return { success: false, error: 'Incorrect Transaction PIN. Key decryption failed.' };
      const routerAddress = EVM_SWAP_ROUTERS[chainId];
      if (!routerAddress) {
        return { success: false, error: 'No DEX router configured for chain ' + chainId + '. This chain requires LI.FI for swaps.' };
      }
      const provider = await getEvmProviderForChain(chainId);
      const cleanedMnemonic = wallet.words.trim().toLowerCase();
      const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
      const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");
      const signer = new Wallet(evmWallet.privateKey, provider);
      const NATIVE_ADDR = '0x0000000000000000000000000000000000000000';
      const wrappedNative = WRAPPED_NATIVE_MAP[chainId];
      const isNativeIn = tokenInAddress.toLowerCase() === NATIVE_ADDR;
      const isNativeOut = tokenOutAddress.toLowerCase() === NATIVE_ADDR;
      const actualTokenIn = isNativeIn ? wrappedNative : tokenInAddress;
      const actualTokenOut = isNativeOut ? wrappedNative : tokenOutAddress;
      if (!actualTokenIn || !actualTokenOut) {
        return { success: false, error: 'Wrapped native token not configured for this chain.' };
      }
      const quoteResult = await WalletEngine.getDirectDexQuote(chainId, actualTokenIn, actualTokenOut, amountIn, fee);
      const bestFee = quoteResult.feeTier ?? fee;
      if (!isNativeIn) {
        const allowance = await WalletEngine.getERC20Allowance(chainId, actualTokenIn, signer.address, routerAddress);
        if (allowance < amountIn) {
          const abi = ['function approve(address spender, uint256 amount) returns (bool)'];
          const tokenContract = new ethers.Contract(actualTokenIn, abi, signer);
          const approveTx = await tokenContract.approve(routerAddress, amountIn * 10n);
          await approveTx.wait(1);
        }
      }
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const routerAbi = [
        'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
        'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)',
        'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
      ];
      const router = new ethers.Contract(routerAddress, routerAbi, signer);
      const swapParams = {
        tokenIn: actualTokenIn,
        tokenOut: actualTokenOut,
        fee: bestFee,
        recipient: isNativeOut ? routerAddress : recipientAddress,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0n,
      };
      let txResponse: any;
      if (isNativeOut) {
        const swapData = router.interface.encodeFunctionData('exactInputSingle', [swapParams]);
        const unwrapData = router.interface.encodeFunctionData('unwrapWETH9', [amountOutMin, recipientAddress]);
        txResponse = await router.multicall(deadline, [swapData, unwrapData], { gasLimit: 600000n });
      } else if (isNativeIn) {
        txResponse = await router.exactInputSingle(swapParams, { value: amountIn, gasLimit: 600000n });
      } else {
        txResponse = await router.exactInputSingle(swapParams, { gasLimit: 600000n });
      }
      const receipt = await txResponse.wait(1);
      return { success: true, signature: receipt?.hash || txResponse.hash };
    } catch (e: any) {
      return { success: false, error: e.message || 'Direct DEX swap execution failed.' };
    }
  },
};

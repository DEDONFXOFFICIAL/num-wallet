import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore, getLogoSource } from '../../store/userStore';
import ImageWithFallback from '../../components/ImageWithFallback';
import { WebacyService } from '../../store/webacyService';
import { ethers } from 'ethers';

interface PresetToken {
  symbol: string;
  name: string;
  address: string;
  price: number;
  chain: string;
  chainId: string;
  securityScore: number;
  taxBuy: string;
  taxSell: string;
  honeyPot: boolean;
  lpLocked: boolean;
  devHolding: string;
  logo?: string | null;
  description?: string;
  isLive?: boolean;
  holderAnalysis?: any;
  unsupportedToken?: boolean;
}

const PRESET_TOKENS: PresetToken[] = [
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    price: 3.12,
    chain: 'Solana',
    chainId: 'solana',
    securityScore: 92,
    taxBuy: '0%',
    taxSell: '0%',
    honeyPot: false,
    lpLocked: true,
    devHolding: '1.2%',
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    price: 0.0000142,
    chain: 'Ethereum',
    chainId: 'ethereum',
    securityScore: 88,
    taxBuy: '0%',
    taxSell: '0%',
    honeyPot: false,
    lpLocked: true,
    devHolding: '2.5%',
  },
  {
    symbol: 'DEGEN',
    name: 'Degen',
    address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    price: 0.0125,
    chain: 'Base',
    chainId: 'base',
    securityScore: 85,
    taxBuy: '0%',
    taxSell: '0%',
    honeyPot: false,
    lpLocked: true,
    devHolding: '3.8%',
  },
  {
    symbol: 'FLOKI',
    name: 'Floki Inu',
    address: '0xfb5b838b6cfeedc2873ab27866079ac55363d37e',
    price: 0.000228,
    chain: 'BNB Chain',
    chainId: 'bsc',
    securityScore: 82,
    taxBuy: '0.3%',
    taxSell: '0.3%',
    honeyPot: false,
    lpLocked: true,
    devHolding: '5.1%',
  },
];

export default function MemeScreen() {
  const { isDarkMode } = useUserStore();
  const [address, setAddress] = useState('');
  const [resolvedToken, setResolvedToken] = useState<PresetToken | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanText = address.trim();
    if (!cleanText) {
      setResolvedToken(null);
      setLoading(false);
      setErrorMsg('');
      return;
    }

    // Presets bypass removed to force live price & metrics queries

    // Dynamic resolution base rules
    const isHex = /^0x[a-fA-F0-9]{40}$/.test(cleanText) || /^0x[a-fA-F0-9]{64}$/.test(cleanText);
    const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanText);
    const isTon = /^[E|U][Q|k|a|b][A-Za-z0-9_\-]{46}$/.test(cleanText) || cleanText.toLowerCase().endsWith('-ton');
    const isBitcoin = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/.test(cleanText);
    const isCardano = /^addr1[a-z0-9]{50,100}$/.test(cleanText);
    const isTron = /^T[a-zA-HJ-NP-Z0-9]{33}$/.test(cleanText);
    const isNear = /^[a-zA-Z0-9_\-]+\.near$/.test(cleanText);

    if (!isHex && !isBase58 && !isTon && !isBitcoin && !isCardano && !isTron && !isNear) {
      setResolvedToken(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        let dexscreenerData = null;
        let lifiData = null;
        let chainName = 'Ethereum';
        let chainIdLower = 'ethereum';

        // Detect chain from address format first
        if (isHex) {
          chainName = 'Ethereum';
          chainIdLower = 'ethereum';
        } else if (isBase58) {
          chainName = 'Solana';
          chainIdLower = 'solana';
        } else if (isTon) {
          chainName = 'TON';
          chainIdLower = 'ton';
        } else if (isBitcoin) {
          chainName = 'Bitcoin';
          chainIdLower = 'bitcoin';
        } else if (isTron) {
          chainName = 'Tron';
          chainIdLower = 'tron';
        } else {
          const isCd = cleanText.startsWith('addr1') || isCardano;
          const isNr = cleanText.endsWith('.near') || isNear;
          chainName = isCd ? 'Cardano' : isNr ? 'Near' : 'Multi-Chain';
          chainIdLower = isCd ? 'cardano' : isNr ? 'near' : 'solana';
        }

        // 1. Try DexScreener Search API first (resolves both tokens and pair addresses on all chains)
        try {
          const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${cleanText}`;
          const res = await fetch(searchUrl, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (data && data.pairs && data.pairs.length > 0) {
              // Prioritize pair that matches the queried address
              const sortedPairs = [...data.pairs].sort((a, b) => {
                const aBase = a.baseToken?.address?.toLowerCase() === cleanText.toLowerCase();
                const aPair = a.pairAddress?.toLowerCase() === cleanText.toLowerCase();
                const bBase = b.baseToken?.address?.toLowerCase() === cleanText.toLowerCase();
                const bPair = b.pairAddress?.toLowerCase() === cleanText.toLowerCase();
                
                if ((aBase || aPair) && !(bBase || bPair)) return -1;
                if (!(aBase || aPair) && (bBase || bPair)) return 1;
                return 0;
              });
              dexscreenerData = sortedPairs[0];
            }
          }
        } catch (e) {
          console.log('DexScreener Search API error:', e);
        }

        // 2. If search didn't resolve anything, try DexScreener Token endpoint
        if (!dexscreenerData && (isHex || isBase58 || isTon)) {
          try {
            const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${cleanText}`;
            const res = await fetch(tokenUrl, { signal: controller.signal });
            if (res.ok) {
              const data = await res.json();
              if (data && data.pairs && data.pairs.length > 0) {
                dexscreenerData = data.pairs[0];
              }
            }
          } catch (e) {
            console.log('DexScreener Token API error:', e);
          }
        }

        // Determine chain details if DexScreener resolved
        if (dexscreenerData) {
          chainIdLower = dexscreenerData.chainId.toLowerCase();
          const mappedName = dexscreenerData.chainId.toLowerCase();
          if (mappedName === 'solana') chainName = 'Solana';
          else if (mappedName === 'bsc' || mappedName === 'smartchain') chainName = 'BNB Chain';
          else if (mappedName === 'ton') chainName = 'TON';
          else if (mappedName === 'base') chainName = 'Base';
          else if (mappedName === 'arbitrum') chainName = 'Arbitrum';
          else if (mappedName === 'polygon') chainName = 'Polygon';
          else if (mappedName === 'optimism') chainName = 'Optimism';
          else if (mappedName === 'avalanche' || mappedName === 'avalanchec') chainName = 'Avalanche';
          else chainName = dexscreenerData.chainId.charAt(0).toUpperCase() + dexscreenerData.chainId.slice(1);
        }

        // 3. If DexScreener has no details, try LI.FI metadata query
        if (!dexscreenerData) {
          try {
            if (isHex) {
              const evmChains = [
                { name: 'Ethereum', idLower: 'ethereum', lifi: '1' },
                { name: 'Base', idLower: 'base', lifi: '8453' },
                { name: 'Arbitrum', idLower: 'arbitrum', lifi: '42161' },
                { name: 'BNB Chain', idLower: 'bsc', lifi: '56' },
                { name: 'Polygon', idLower: 'polygon', lifi: '137' }
              ];
              
              const promises = evmChains.map(async (c) => {
                try {
                  const res = await fetch(`https://li.quest/v1/token?chain=${c.lifi}&token=${cleanText}`, { signal: controller.signal });
                  if (res.ok) {
                    const data = await res.json();
                    if (data && data.symbol) {
                      return { data, chain: c };
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
                lifiData = found.data;
                chainIdLower = found.chain.idLower;
                chainName = found.chain.name;
              }
            } else {
              const lifiChainMap: Record<string, string> = {
                solana: 'sol',
                ton: 'ton'
              };
              const lifiChain = lifiChainMap[chainIdLower];
              if (lifiChain) {
                const res = await fetch(`https://li.quest/v1/token?chain=${lifiChain}&token=${cleanText}`, { signal: controller.signal });
                if (res.ok) {
                  const data = await res.json();
                  if (data && data.symbol) {
                    lifiData = data;
                  }
                }
              }
            }
          } catch (e) {
            console.log('LI.FI metadata fetch error:', e);
          }
        }

        // 4. Try on-chain RPC lookup for EVM chains as third fallback (using lightweight fetch POST to RPC URLs)
        let rpcData = null;
        if (!dexscreenerData && !lifiData && isHex) {
          // 4a. Prioritize Asset Chain Explorer API to check if it's an Asset Chain token (avoids parallel RPC timeouts)
          try {
            const acExplorerRes = await fetch(`https://scan.assetchain.org/api/v2/tokens/${cleanText}`, { signal: controller.signal });
            if (acExplorerRes.ok) {
              const acExplorerData = await acExplorerRes.json();
              if (acExplorerData && acExplorerData.symbol && acExplorerData.name) {
                rpcData = {
                  name: acExplorerData.name,
                  symbol: acExplorerData.symbol,
                  price: parseFloat(acExplorerData.exchange_rate || acExplorerData.exchange_rate_usd) || 0.0,
                  logo: acExplorerData.icon_url || null,
                  chain: { name: 'Asset Chain', idLower: 'assetchain', rpc: 'https://mainnet-rpc.assetchain.org' }
                };
                chainIdLower = 'assetchain';
                chainName = 'Asset Chain';
              }
            }
          } catch (acExplorerErr) {
            console.log('Asset Chain explorer lookup error:', acExplorerErr);
          }

          // 4b. Fallback to parallel multi-chain EVM RPC search if not resolved on Asset Chain
          if (!rpcData) {
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
                          params: [{ to: cleanText, data }, 'latest']
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
                        price: 0.0,
                        logo: null,
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
                rpcData = found;
                chainIdLower = found.chain.idLower;
                chainName = found.chain.name;
              }
            } catch (e) {
              console.log('On-chain EVM RPC lookup error:', e);
            }
          }
        }

        // 4b. Try Mobula API metadata resolution as fourth fallback if everything else failed
        if (!dexscreenerData && !lifiData && !rpcData && (isHex || isBase58)) {
          try {
            const mobulaRes = await fetch(`https://api.mobula.io/api/1/metadata?asset=${cleanText}`, { signal: controller.signal });
            if (mobulaRes.ok) {
              const mobulaData = await mobulaRes.json();
              if (mobulaData && mobulaData.data) {
                const mData = mobulaData.data;
                const primaryBlockchain = (mData.blockchains && mData.blockchains[0]) || mData.blockchain || '';
                const cleanChain = primaryBlockchain.toLowerCase().replace(/\s+/g, '');
                
                let detectedChainId = 'ethereum';
                let detectedChainName = 'Ethereum';
                if (cleanChain.includes('assetchain')) {
                  detectedChainId = 'assetchain';
                  detectedChainName = 'Asset Chain';
                } else if (cleanChain.includes('solana') || cleanChain === 'sol') {
                  detectedChainId = 'solana';
                  detectedChainName = 'Solana';
                } else if (cleanChain.includes('bsc') || cleanChain.includes('binance')) {
                  detectedChainId = 'bsc';
                  detectedChainName = 'BNB Chain';
                } else if (cleanChain.includes('base')) {
                  detectedChainId = 'base';
                  detectedChainName = 'Base';
                } else if (cleanChain.includes('arbitrum') || cleanChain === 'arb') {
                  detectedChainId = 'arbitrum';
                  detectedChainName = 'Arbitrum';
                } else if (cleanChain.includes('polygon') || cleanChain === 'matic') {
                  detectedChainId = 'polygon';
                  detectedChainName = 'Polygon';
                } else if (cleanChain.includes('optimism') || cleanChain === 'op') {
                  detectedChainId = 'optimism';
                  detectedChainName = 'Optimism';
                }
                
                rpcData = {
                  name: mData.name,
                  symbol: mData.symbol?.toUpperCase(),
                  price: parseFloat(mData.price) || 0.0,
                  logo: mData.logo || null,
                  chain: {
                    idLower: detectedChainId,
                    name: detectedChainName
                  }
                };
                chainIdLower = detectedChainId;
                chainName = detectedChainName;
              }
            }
          } catch (mobulaErr) {
            console.log('Mobula Metadata fallback error:', mobulaErr);
          }
        }

        // Compile resolved data
        let symbol = 'MEME';
        let name = 'Resolved Token';
        let price = 0.0;
        let logo = null;

        if (dexscreenerData) {
          const baseToken = dexscreenerData.baseToken;
          const quoteToken = dexscreenerData.quoteToken;
          let resolvedBase = baseToken;
          if (cleanText.toLowerCase() === quoteToken?.address?.toLowerCase()) {
            resolvedBase = quoteToken;
          }
          symbol = resolvedBase.symbol;
          name = resolvedBase.name;
          price = parseFloat(dexscreenerData.priceUsd) || 0.0;
          logo = dexscreenerData.info?.imageUrl || null;
        } else if (lifiData) {
          symbol = lifiData.symbol;
          name = lifiData.name || lifiData.symbol;
          price = parseFloat(lifiData.priceUSD) || 0.0;
          logo = lifiData.logoURI || null;
        } else if (rpcData) {
          symbol = rpcData.symbol;
          name = rpcData.name;
          price = rpcData.price || 0.0;
          logo = rpcData.logo;
        } else {
          const shortAddr = cleanText.substring(0, 4) + '...' + cleanText.substring(cleanText.length - 4);
          symbol = isHex ? 'EVM-TOKEN' : isBase58 ? 'SOL-TOKEN' : 'TOKEN';
          name = `${chainName} Token (${shortAddr})`;
          price = 0.0;
        }

        // 5. If price <= 0.0, try Jupiter (Solana) and GeckoTerminal (EVM) price APIs as fallback
        if (price <= 0.0) {
          if (chainIdLower === 'solana') {
            try {
              const jupRes = await fetch(`https://api.jup.ag/price/v2?ids=${cleanText}`, { signal: controller.signal });
              if (jupRes.ok) {
                const jupData = await jupRes.json();
                if (jupData && jupData.data && jupData.data[cleanText]) {
                  price = parseFloat(jupData.data[cleanText].price) || 0.0;
                }
              }
            } catch (e) {
              console.log('Jupiter Price API error:', e);
            }
          }

          const geckoChainMap: Record<string, string> = {
            ethereum: 'eth',
            solana: 'solana',
            bsc: 'bsc',
            smartchain: 'bsc',
            base: 'base',
            arbitrum: 'arbitrum',
            polygon: 'polygon_pos',
            optimism: 'optimistic-ethereum',
            avalanche: 'avax',
            fantom: 'fantom',
            cronos: 'cronos',
            linea: 'linea',
            scroll: 'scroll',
            ton: 'ton',
            assetchain: 'assetchain',
            blast: 'blast',
            celo: 'celo',
            gnosis: 'gnosis',
            zksync: 'zksync',
            taiko: 'taiko',
            kava: 'kava',
            metis: 'metis',
            sei: 'sei',
            mode: 'mode'
          };
          const geckoNetwork = geckoChainMap[chainIdLower];
          if (geckoNetwork && (price <= 0.0 || !logo)) {
            try {
              const gtRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/tokens/${cleanText}`, { signal: controller.signal });
              if (gtRes.ok) {
                const gtData = await gtRes.json();
                if (gtData && gtData.data && gtData.data.attributes) {
                  if (price <= 0.0) {
                    price = parseFloat(gtData.data.attributes.price_usd) || 0.0;
                  }
                  if (!logo && gtData.data.attributes.image_url) {
                    logo = gtData.data.attributes.image_url;
                  }
                }
              }
            } catch (e) {
              console.log('GeckoTerminal Price API error:', e);
            }
          }
        }

        // 5b. Fallback to multi-aggregator API search to resolve/heal name, symbol, price, and logo
        if (price <= 0.0 || !logo || symbol === 'MEME' || name === 'Resolved Token') {
          try {
            const aggResult = await WebacyService.fetchTokenFromAggregators(cleanText, chainIdLower);
            if (aggResult) {
              if (aggResult.name && (name === 'Resolved Token' || name.includes('Token (0x'))) {
                name = aggResult.name;
              }
              if (aggResult.symbol && (symbol === 'MEME' || symbol === 'TOKEN' || symbol.startsWith('EVM-'))) {
                symbol = aggResult.symbol.toUpperCase();
              }
              if (aggResult.price && price <= 0.0) {
                price = aggResult.price;
              }
              if (aggResult.logo && !logo) {
                logo = aggResult.logo;
              }
            }
          } catch (aggErr) {
            console.log('Aggregators search fallback in meme failed:', aggErr);
          }
        }

        // 5c. Fallback to Trust Wallet Assets repository for EVM/Solana logos if still null
        if (!logo && (chainIdLower === 'ethereum' || chainIdLower === 'bsc' || chainIdLower === 'polygon' || chainIdLower === 'arbitrum' || chainIdLower === 'optimism' || chainIdLower === 'avalanche' || chainIdLower === 'solana')) {
          const trustChainMap: Record<string, string> = {
            ethereum: 'ethereum',
            bsc: 'smartchain',
            polygon: 'polygon',
            arbitrum: 'arbitrum',
            optimism: 'optimism',
            avalanche: 'avalanchec',
            solana: 'solana'
          };
          const trustChain = trustChainMap[chainIdLower];
          if (trustChain) {
            logo = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${trustChain}/assets/${cleanText}/logo.png`;
          }
        }

        // Prepend the hosting chain name in front of the resolved token's display name
        const finalName = name.startsWith('[') ? name : `[${chainName}] ${name}`;

        // Fetch Webacy details (now GoPlus-backed if Webacy API Key is missing)
        let webacyAudit;
        let holderAnalysis;
        try {
          const [auditRes, holdersRes] = await Promise.all([
            WebacyService.analyzeToken(cleanText, chainIdLower),
            WebacyService.getHolderAnalysis(cleanText, chainIdLower)
          ]);
          webacyAudit = auditRes;
          holderAnalysis = holdersRes;
        } catch (e) {
          console.log('Error resolving Webacy/GoPlus audit:', e);
          webacyAudit = {
            overallRisk: 0,
            securityScore: 0,
            honeyPot: false,
            lpLocked: false,
            taxBuy: '0%',
            taxSell: '0%',
            devHolding: '0%',
            issues: [],
            description: 'Cannot find token score. Proceed with caution.',
            isLive: false,
            unsupportedToken: true,
          };
          holderAnalysis = null;
        }

        setResolvedToken({
          symbol,
          name: finalName,
          address: cleanText,
          price,
          chain: chainName,
          chainId: chainIdLower,
          securityScore: webacyAudit.securityScore,
          taxBuy: webacyAudit.taxBuy,
          taxSell: webacyAudit.taxSell,
          honeyPot: webacyAudit.honeyPot,
          lpLocked: webacyAudit.lpLocked,
          devHolding: webacyAudit.devHolding,
          logo,
          description: webacyAudit.description,
          isLive: webacyAudit.isLive,
          holderAnalysis,
          unsupportedToken: webacyAudit.unsupportedToken
        });
        setLoading(false);
      } catch (err: any) {
        if (err && err.name === 'AbortError') {
          return;
        }
        console.log('Metadata resolution error:', err);
        setLoading(false);
      }
    }, 500);

    return () => {
      controller.abort();
      timeoutId && clearTimeout(timeoutId);
    };
  }, [address]);

  const handleAddressChange = (text: string) => {
    setAddress(text);
  };

  const selectPreset = (token: PresetToken) => {
    const prefixedPreset = {
      ...token,
      // Keep the existing price (don't zero it out) - convert.tsx will live-fetch if needed
      name: token.name.startsWith('[') ? token.name : `[${token.chain}] ${token.name}`
    };
    setAddress(token.address);
    setResolvedToken(prefixedPreset);
    setErrorMsg('');
  };

  const handleAction = (type: 'buy' | 'sell') => {
    if (!resolvedToken) return;

    const nativeSymbolMap: Record<string, string> = {
      solana: 'SOL',
      ethereum: 'ETH',
      ton: 'TON',
      bitcoin: 'BTC',
      bsc: 'BNB',
      smartchain: 'BNB',
      arbitrum: 'ETH',
      polygon: 'POL',
      optimism: 'ETH',
      base: 'ETH',
      avalanche: 'AVAX',
      avalanchec: 'AVAX',
      fantom: 'FTM',
      cardano: 'ADA',
      xrp: 'XRP',
      sui: 'SUI',
      aptos: 'APT',
      tron: 'TRX',
      near: 'NEAR',
      assetchain: 'RWA',
      klever: 'KLV'
    };

    const nativeSymbol = nativeSymbolMap[resolvedToken.chainId] || 'SOL';
    // Pass price=0 for native token - convert.tsx live price resolver will fetch the real price via LI.FI
    const nativePrice = '0';

    if (type === 'buy') {
      // Buy: Pay with native chain asset -> Receive Meme
      router.push({
        pathname: '/(tabs)/convert',
        params: {
          fromSymbol: nativeSymbol,
          fromChain: resolvedToken.chain,
          fromChainId: resolvedToken.chainId,
          fromPrice: nativePrice,
          toSymbol: resolvedToken.symbol,
          toName: resolvedToken.name,
          toChain: resolvedToken.chain,
          toChainId: resolvedToken.chainId,
          toPrice: resolvedToken.price.toString(),
          toLogo: resolvedToken.logo || '',
          toAddress: resolvedToken.address || '',
          isMemeBuy: 'true',
        },
      });
    } else {
      // Sell: Pay with Meme -> Receive native chain asset
      router.push({
        pathname: '/(tabs)/convert',
        params: {
          fromSymbol: resolvedToken.symbol,
          fromName: resolvedToken.name,
          fromChain: resolvedToken.chain,
          fromChainId: resolvedToken.chainId,
          fromPrice: resolvedToken.price.toString(),
          fromLogo: resolvedToken.logo || '',
          fromAddress: resolvedToken.address || '',
          toSymbol: nativeSymbol,
          toChain: resolvedToken.chain,
          toChainId: resolvedToken.chainId,
          toPrice: nativePrice,
          isMemeSell: 'true',
        },
      });
    }
  };

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const cardStyle = isDarkMode ? styles.card : [styles.card, styles.cardLight];
  const textPrimaryStyle = isDarkMode ? styles.textWhite : styles.textBlack;
  const borderCol = isDarkMode ? '#1A1A30' : '#E5E7EB';
  const statBoxStyle = isDarkMode ? styles.statBox : [styles.statBox, styles.statBoxLight];

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={isDarkMode ? Colors.text.primary : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textPrimaryStyle]}>Meme Token Terminal</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Main Console Input */}
          <View style={cardStyle}>
            <Text style={styles.label}>Pasted Contract Address</Text>
            <View style={[styles.inputBox, { borderColor: errorMsg ? Colors.error + '60' : borderCol }]}>
              <Feather name="hash" size={16} color={Colors.text.muted} style={{ marginRight: Spacing[2] }} />
              <TextInput
                style={[styles.input, textPrimaryStyle]}
                placeholder="Paste address from any chain (EVM, Solana, TON, BTC...)"
                placeholderTextColor={Colors.text.disabled}
                value={address}
                onChangeText={handleAddressChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {address ? (
                <TouchableOpacity onPress={() => handleAddressChange('')}>
                  <Feather name="x" size={16} color={Colors.text.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          </View>

          {/* Quick Presets */}
          <View style={{ marginVertical: Spacing[3] }}>
            <Text style={styles.sectionTitle}>Quick Token Presets</Text>
            <View style={styles.presetsRow}>
              {PRESET_TOKENS.map((t) => (
                <TouchableOpacity
                  key={t.symbol}
                  style={[
                    styles.presetBadge,
                    !isDarkMode && styles.presetBadgeLight,
                    address === t.address && styles.presetBadgeActive,
                  ]}
                  onPress={() => selectPreset(t)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      address === t.address && styles.presetTextActive,
                      !isDarkMode && !address && { color: '#4B5563' },
                    ]}
                  >
                    {t.symbol} ({t.chain.split(' ')[0]})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dynamic Auto-Detection Panel */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.brand.bright} />
              <Text style={styles.loadingText}>Detecting chain & resolving contract metadata...</Text>
            </View>
          ) : resolvedToken ? (
            <View style={styles.detectionPanel}>
              
              {/* Token Info Card */}
              <View style={cardStyle}>
                <View style={styles.tokenMainRow}>
                  <View style={styles.tokenVisual}>
                    <View style={styles.tokenIconBox}>
                      {resolvedToken.logo ? (
                        <ImageWithFallback
                          source={getLogoSource(resolvedToken.logo)}
                          style={styles.tokenLogoImage}
                          fallbackText={resolvedToken.symbol}
                        />
                      ) : (
                        <View style={[styles.tokenIconBoxFallback, { backgroundColor: resolvedToken.chainId === 'solana' ? '#14F19515' : '#627EEA15' }]}>
                          <Text style={[styles.tokenIconText, { color: resolvedToken.chainId === 'solana' ? '#14F195' : '#627EEA' }]}>
                            {resolvedToken.symbol.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View>
                      <Text style={[styles.tokenSymbolText, textPrimaryStyle]}>{resolvedToken.symbol}</Text>
                      <Text style={styles.tokenNameText}>{resolvedToken.name}</Text>
                    </View>
                  </View>

                  <View style={[styles.chainBadge, !isDarkMode && styles.chainBadgeLight]}>
                    <Text style={[styles.chainBadgeText, { color: resolvedToken.chainId === 'solana' ? '#14F195' : '#3A8AFF' }]}>
                      {resolvedToken.chain}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Pricing / Metric values */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Approx. Price</Text>
                    <Text style={[styles.metricValue, textPrimaryStyle]}>
                      {resolvedToken.price && resolvedToken.price > 0
                        ? `$${resolvedToken.price < 0.001 ? resolvedToken.price.toFixed(8) : resolvedToken.price.toFixed(4)}`
                        : 'Price Unavailable'}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Safety Rating</Text>
                    {resolvedToken.unsupportedToken ? (
                      <Text style={[styles.metricValue, { color: '#94A3B8' }]}>
                        N/A
                      </Text>
                    ) : (
                      <Text style={[styles.metricValue, { color: resolvedToken.securityScore > 80 ? '#10B981' : '#F59E0B' }]}>
                        {resolvedToken.securityScore}/100
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Glowing Scam Shield Card */}
              <View style={[styles.scamShieldCard, !isDarkMode && styles.scamShieldCardLight, resolvedToken.unsupportedToken && { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
                <LinearGradient
                  colors={
                    resolvedToken.unsupportedToken
                      ? (isDarkMode ? ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.03)'] : ['rgba(239, 68, 68, 0.06)', 'rgba(239, 68, 68, 0.01)'])
                      : (isDarkMode ? ['rgba(245, 158, 11, 0.15)', 'rgba(16, 185, 129, 0.03)'] : ['rgba(245, 158, 11, 0.06)', 'rgba(245, 158, 11, 0.01)'])
                  }
                  style={styles.scamShieldGradient}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={styles.scamTitleRow}>
                      <Ionicons name={resolvedToken.unsupportedToken ? "alert-circle" : "shield-checkmark"} size={18} color={resolvedToken.unsupportedToken ? "#EF4444" : "#F59E0B"} style={{ marginRight: 4 }} />
                      <Text style={[styles.scamTitle, { color: resolvedToken.unsupportedToken ? "#EF4444" : "#F59E0B" }]}>
                        {resolvedToken.unsupportedToken ? "Unsupported Token Network" : "Webacy Risk Diagnosis"}
                      </Text>
                    </View>
                    <View style={[
                      styles.webacyBadge,
                      {
                        backgroundColor: resolvedToken.unsupportedToken ? 'rgba(148,163,184,0.1)' : resolvedToken.isLive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                        borderColor: resolvedToken.unsupportedToken ? 'rgba(148,163,184,0.3)' : resolvedToken.isLive ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'
                      }
                    ]}>
                      <Text style={[
                        styles.webacyBadgeText,
                        { color: resolvedToken.unsupportedToken ? '#94A3B8' : resolvedToken.isLive ? '#10B981' : '#94A3B8' }
                      ]}>
                        {resolvedToken.unsupportedToken ? 'UNSUPPORTED' : resolvedToken.isLive ? 'WEBACY LIVE' : 'WEBACY SANDBOX'}
                      </Text>
                    </View>
                  </View>
                  
                  {resolvedToken.unsupportedToken ? (
                    <View style={{ gap: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                        Cannot find token score. Proceed with caution.
                      </Text>
                      <Text style={[styles.scamExplanation, { color: isDarkMode ? Colors.text.secondary : '#374151' }]}>
                        This token is hosted on a network or blockchain not currently indexed or supported by the Webacy or GoPlus security registry. Real-time safety metrics and audit checks are unavailable for this contract.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.scamExplanation, { color: isDarkMode ? Colors.text.secondary : '#374151' }]}>
                        {resolvedToken.securityScore > 85 
                          ? 'No malicious mint permissions detected. Smart contract locks verify liquidity pool tokens are burned. Trade concentration index is low.'
                          : resolvedToken.lpLocked 
                            ? 'Liquidity is mostly locked but developer wallets hold higher concentration tokens. Watch for sell volume fluctuations.'
                            : 'Caution: Unlocked liquidity pools detected! Developers retain mint and burn authorities. High risk of immediate liquidity drain.'
                        }
                      </Text>

                      <View style={styles.gridStats}>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>HoneyPot Check</Text>
                          <Text style={[styles.statValue, { color: resolvedToken.honeyPot ? Colors.error : '#10B981' }]}>
                            {resolvedToken.honeyPot ? 'RUG RISK' : 'PASSED'}
                          </Text>
                        </View>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>LP Lock Status</Text>
                          <Text style={[styles.statValue, { color: resolvedToken.lpLocked ? '#10B981' : Colors.error }]}>
                            {resolvedToken.lpLocked ? 'BURNED' : 'UNLOCKED'}
                          </Text>
                        </View>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>Buy / Sell Taxes</Text>
                          <Text style={[styles.statValue, textPrimaryStyle]}>
                            {resolvedToken.taxBuy} / {resolvedToken.taxSell}
                          </Text>
                        </View>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>Dev Holdings</Text>
                          <Text style={[styles.statValue, textPrimaryStyle]}>
                            {resolvedToken.devHolding}
                          </Text>
                        </View>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>Top 10 Holders</Text>
                          <Text style={[styles.statValue, { color: resolvedToken.holderAnalysis && resolvedToken.holderAnalysis.top10Concentration > 60 ? Colors.error : '#10B981' }]}>
                            {resolvedToken.holderAnalysis ? `${resolvedToken.holderAnalysis.top10Concentration.toFixed(1)}%` : resolvedToken.devHolding}
                          </Text>
                        </View>
                        <View style={statBoxStyle}>
                          <Text style={styles.statLabel}>Sniper Count</Text>
                          <Text style={[styles.statValue, { color: resolvedToken.holderAnalysis && resolvedToken.holderAnalysis.sniperCount > 0 ? '#F59E0B' : '#10B981' }]}>
                            {resolvedToken.holderAnalysis ? `${resolvedToken.holderAnalysis.sniperCount} bots` : '0 bots'}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </View>

              {/* Execution Actions */}
              <View style={styles.actionRowContainer}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleAction('buy')}
                  activeOpacity={0.85}
                  disabled={resolvedToken.price <= 0}
                >
                  <LinearGradient
                    colors={resolvedToken.price > 0 ? [Colors.brand.deep, Colors.brand.bright] : ['#2D2D44', '#1E1E30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.executeBtn}
                  >
                    <Text style={styles.executeBtnText}>{resolvedToken.price > 0 ? 'BUY (Swap/Bridge)' : 'Price Unavailable'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.executeBtnSecondary,
                    {
                      borderColor: resolvedToken.price > 0
                        ? (isDarkMode ? Colors.brand.bright + '60' : '#3A8AFF')
                        : (isDarkMode ? '#2D2D44' : '#E5E7EB')
                    }
                  ]}
                  onPress={() => handleAction('sell')}
                  activeOpacity={0.8}
                  disabled={resolvedToken.price <= 0}
                >
                  <Text
                    style={[
                      styles.executeBtnTextSecondary,
                      {
                        color: resolvedToken.price > 0
                          ? (isDarkMode ? '#FFFFFF' : '#3A8AFF')
                          : Colors.text.disabled
                      }
                    ]}
                  >
                    {resolvedToken.price > 0 ? 'SELL (Swap/Bridge)' : 'Price Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="orbit"
                size={48}
                color={isDarkMode ? '#1A1A30' : '#E5E7EB'}
                style={{ marginBottom: Spacing[4] }}
              />
              <Text style={styles.emptyText}>
                Paste an active meme contract address above or select a preset to analyze its security score and check flags.
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040408',
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textBlack: {
    color: '#000000',
  },
  card: {
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#1A1A30',
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  label: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.xs,
    marginTop: Spacing[2],
    fontWeight: '600',
  },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  presetBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#1A1A30',
    backgroundColor: '#08080F',
  },
  presetBadgeLight: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  presetBadgeActive: {
    borderColor: Colors.brand.bright,
    backgroundColor: Colors.brand.bright + '15',
  },
  presetText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Colors.text.muted,
  },
  presetTextActive: {
    color: Colors.brand.bright,
  },
  detectionPanel: {
    gap: Spacing[4],
    marginTop: Spacing[2],
  },
  tokenMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  tokenIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenLogoImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
  },
  tokenIconBoxFallback: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing[3],
  },
  loadingText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  tokenIconText: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  tokenSymbolText: {
    fontSize: Typography.size.md,
    fontWeight: '800',
  },
  tokenNameText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  chainBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1C1C24',
  },
  chainBadgeLight: {
    backgroundColor: '#F3F4F6',
  },
  chainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#C4D4E808',
    marginVertical: Spacing[3],
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    gap: 4,
  },
  metricLabel: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  metricValue: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  scamShieldCard: {
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  scamShieldCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B50',
  },
  scamShieldGradient: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  scamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  scamTitle: {
    color: '#F59E0B',
    fontSize: Typography.size.xs,
    fontWeight: '800',
  },
  scamExplanation: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    lineHeight: 18,
  },
  gridStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  statBox: {
    width: '48%',
    backgroundColor: '#0C0C14',
    borderWidth: 1,
    borderColor: '#C4D4E805',
    padding: Spacing[3],
    borderRadius: Radius.md,
    gap: 2,
  },
  statBoxLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 9,
  },
  statValue: {
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  actionRowContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  executeBtn: {
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  executeBtnSecondary: {
    flex: 1,
    height: 52,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  executeBtnTextSecondary: {
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing[4],
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  webacyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  webacyBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

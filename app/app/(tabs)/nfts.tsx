import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore, getLogoSource } from '../../store/userStore';
import { router } from 'expo-router';
import CustomAlert from '../../components/CustomAlert';
import ImageWithFallback from '../../components/ImageWithFallback';
import TransactionConfirmModal from '../../components/TransactionConfirmModal';
import { WalletEngine, MultiChainWallet } from '../../store/walletEngine';
import { Config } from '../../constants/config';

interface NFTAsset {
  id: string;
  name: string;
  collection: string;
  image: string;
  chain: string;
  floor?: string;
  attributes?: { trait_type: string; value: string }[];
  tokenId: string;
  contractAddress: string;
  isVerified?: boolean;
}

const EVM_BLOCKSCOUT_APIS: Record<string, string> = {
  Ethereum: 'https://eth.blockscout.com',
  Polygon: 'https://polygon.blockscout.com',
  Base: 'https://base.blockscout.com',
  Arbitrum: 'https://arbitrum.blockscout.com',
  Optimism: 'https://optimism.blockscout.com',
  Abstract: 'https://abstract.blockscout.com',
  ZKsync: 'https://zksync-era.blockscout.com',
  Scroll: 'https://scroll.blockscout.com',
  Linea: 'https://linea.blockscout.com',
  Blast: 'https://blast.blockscout.com'
};

const CHAIN_LOGOS: Record<string, string> = {
  Solana: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  Ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  Polygon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  Base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  Arbitrum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  Optimism: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  TON: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png',
  Abstract: 'https://assets.coingecko.com/coins/images/51385/large/Abstract.png',
  ZKsync: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png',
  Scroll: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png',
  Linea: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png',
  Blast: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/blast/info/logo.png'
};

async function fetchEvmNfts(address: string, chain: string): Promise<NFTAsset[]> {
  const baseUrl = EVM_BLOCKSCOUT_APIS[chain];
  if (!baseUrl) return [];
  try {
    const url = `${baseUrl}/api/v2/addresses/${address}/tokens?type=ERC-721,ERC-1155`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];
    
    return items.map((item: any) => {
      const token = item.token || {};
      const instance = item.token_instance || {};
      const metadata = instance.metadata || {};
      
      let imageUrl = metadata.image || metadata.image_url || '';
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return {
        id: `${chain}-${token.address}-${item.token_id || item.id}`,
        name: metadata.name || `${token.name || 'NFT'} #${item.token_id || ''}`,
        collection: token.name || 'Unknown Collection',
        image: imageUrl || 'https://images.weserv.nl/?url=https%3A%2F%2Fplacehold.co%2F200.png&output=png',
        chain,
        tokenId: item.token_id || '0',
        contractAddress: token.address || '',
        attributes: metadata.attributes || [],
        isVerified: true
      };
    });
  } catch (e) {
    console.log(`Error fetching EVM NFTs for ${chain}:`, e);
    return [];
  }
}

async function fetchSolanaNfts(solanaAddress: string): Promise<NFTAsset[]> {
  try {
    const rpcUrl = Config.SOLANA_RPC_URL;
    const body = {
      jsonrpc: "2.0",
      id: "antigravity-das",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: solanaAddress,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: false
        }
      }
    };
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.result?.items || [];
    
    return items.map((item: any) => {
      const metadata = item.content?.metadata || {};
      let imageUrl = item.content?.files?.[0]?.uri || item.content?.links?.image || '';
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      return {
        id: `Solana-${item.id}`,
        name: metadata.name || item.content?.metadata?.name || 'Solana NFT',
        collection: item.grouping?.[0]?.group_value || metadata.symbol || 'Solana Collection',
        image: imageUrl || 'https://images.weserv.nl/?url=https%3A%2F%2Fplacehold.co%2F200.png&output=png',
        chain: 'Solana',
        tokenId: item.id || '',
        contractAddress: item.id || '',
        attributes: metadata.attributes || [],
        isVerified: true
      };
    });
  } catch (e) {
    console.log('Error fetching Solana NFTs:', e);
    return [];
  }
}

async function fetchTonNfts(tonAddress: string): Promise<NFTAsset[]> {
  try {
    const url = `https://tonapi.io/v2/accounts/${tonAddress}/nfts?limit=100`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.nft_items || [];
    return items.map((item: any) => {
      const metadata = item.metadata || {};
      let imageUrl = metadata.image || '';
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      return {
        id: `TON-${item.address}`,
        name: metadata.name || `TON NFT #${item.index}`,
        collection: item.collection?.name || 'TON Collection',
        image: imageUrl || 'https://images.weserv.nl/?url=https%3A%2F%2Fplacehold.co%2F200.png&output=png',
        chain: 'TON',
        tokenId: item.address || '',
        contractAddress: item.collection?.address || item.address || '',
        attributes: metadata.attributes || [],
        isVerified: true
      };
    });
  } catch (e) {
    console.log('Error fetching TON NFTs:', e);
    return [];
  }
}

const isNftVerified = (nft: NFTAsset) => {
  const coll = nft.collection.toLowerCase();
  const name = nft.name.toLowerCase();
  if (
    coll.includes('fake') || 
    coll.includes('voucher') || 
    coll.includes('rewards') || 
    coll.includes('spam') || 
    name.includes('fake') || 
    name.includes('voucher') || 
    name.includes('rewards') || 
    name.includes('spam') || 
    name.includes('$1,000') || 
    name.includes('claim')
  ) {
    return false;
  }
  return true;
};

export default function NFTsScreen() {
  const { isDarkMode, addTransaction, transactionPin, transactionHistory } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('All');
  const [selectedVerifyFilter, setSelectedVerifyFilter] = useState<'All' | 'Verified' | 'Unverified' | 'RecentlyReceived' | 'RecentlySent'>('All');

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

  const [selectedNft, setSelectedNft] = useState<NFTAsset | null>(null);
  const [showSendNftModal, setShowSendNftModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [nftRecipient, setNftRecipient] = useState('');
  
  const [walletAddresses, setWalletAddresses] = useState<MultiChainWallet | null>(null);
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);

  const scanAllNfts = async (wallet: MultiChainWallet) => {
    setLoading(true);
    setLoadingLogs([]);
    const allFetchedNfts: NFTAsset[] = [];
    
    const promises: Promise<NFTAsset[]>[] = [];
    
    if (wallet.solanaAddress) {
      setLoadingLogs(prev => [...prev, 'Scanning Solana network (Helius API)...']);
      promises.push(
        fetchSolanaNfts(wallet.solanaAddress).then(res => {
          setLoadingLogs(prev => [...prev, `Solana scan finished: found ${res.length} NFT(s).`]);
          return res;
        })
      );
    }
    
    const evmChains = ['Ethereum', 'Polygon', 'Base', 'Arbitrum', 'Optimism', 'Abstract', 'ZKsync', 'Scroll', 'Linea', 'Blast'];
    evmChains.forEach(chain => {
      if (wallet.evmAddress) {
        setLoadingLogs(prev => [...prev, `Scanning ${chain} network (Blockscout API)...`]);
        promises.push(
          fetchEvmNfts(wallet.evmAddress, chain).then(res => {
            setLoadingLogs(prev => [...prev, `${chain} scan finished: found ${res.length} NFT(s).`]);
            return res;
          })
        );
      }
    });
    
    if (wallet.tonAddress) {
      setLoadingLogs(prev => [...prev, 'Scanning TON network (TON API)...']);
      promises.push(
        fetchTonNfts(wallet.tonAddress).then(res => {
          setLoadingLogs(prev => [...prev, `TON scan finished: found ${res.length} NFT(s).`]);
          return res;
        })
      );
    }

    try {
      const results = await Promise.all(promises);
      results.forEach(res => {
        allFetchedNfts.push(...res);
      });
      
      setNfts(allFetchedNfts);
    } catch (e) {
      console.log('Error scanning all NFTs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadWalletAndNfts = async () => {
      setLoading(true);
      setLoadingLogs(prev => [...prev, 'Decrypting secure wallet address keys...']);
      try {
        const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
        if (wallet) {
          setWalletAddresses(wallet);
          setLoadingLogs(prev => [...prev, 'Wallet keys loaded successfully.']);
          await scanAllNfts(wallet);
        } else {
          setLoadingLogs(prev => [...prev, 'Failed to decrypt wallet keys. Make sure your passcode is setup.']);
        }
      } catch (e) {
        setLoadingLogs(prev => [...prev, 'Decryption error.']);
      } finally {
        setLoading(false);
      }
    };
    loadWalletAndNfts();
  }, [transactionPin]);

  const activeWalletAddressForSelectedChain = useMemo(() => {
    if (!walletAddresses) return '';
    const c = selectedNft?.chain || 'Solana';
    if (c === 'Solana') return walletAddresses.solanaAddress;
    if (c === 'TON') return walletAddresses.tonAddress;
    return walletAddresses.evmAddress;
  }, [walletAddresses, selectedNft]);

  const handleInspectScam = (nft: NFTAsset) => {
    setAlertConfig({
      visible: true,
      title: '⚠️ SECURITY THREAT WARNING!',
      message: `This asset ("${nft.name}") is unverified and flagged as a potential phishing voucher.\n\nInteracting with this card or signing signature requests from it will compromise your private keys and lead to a total loss of funds.\n\nDo you want to proceed at your own risk?`,
      icon: 'alert-triangle',
      iconColor: '#EF4444',
      showConfirm: true,
      confirmText: 'Force Open',
      onConfirm: () => {
        setSelectedNft(nft);
      }
    });
  };

  const executeNftSend = () => {
    if (selectedNft) {
      setNfts(prev => prev.filter(x => x.id !== selectedNft.id));
      addTransaction({
        type: 'NFT Send',
        fromSymbol: selectedNft.collection || 'NFT',
        toSymbol: selectedNft.name || 'NFT',
        fromAmount: '1',
        toAmount: '0',
        chain: selectedNft.chain,
        status: 'Success',
        txHash: '0x' + Math.random().toString(16).substring(2, 38)
      });
      Alert.alert('Collectible Sent!', `Successfully transferred "${selectedNft.name}" to ${nftRecipient}! Logged in history.`);
    }

    setShowSendNftModal(false);
    setSelectedNft(null);
    setNftRecipient('');
  };

  const handleSellNft = (nft: NFTAsset) => {
    let marketplaceUrl = 'https://opensea.io';
    const c = nft.chain;
    const token = nft.tokenId;
    const contract = nft.contractAddress;

    if (c === 'Solana') {
      marketplaceUrl = `https://magiceden.io/item-details/${token}`;
    } else if (c === 'TON') {
      marketplaceUrl = `https://getgems.io/nft/${token}`;
    } else if (c === 'Ethereum') {
      marketplaceUrl = `https://opensea.io/assets/ethereum/${contract}/${token}`;
    } else if (c === 'Polygon') {
      marketplaceUrl = `https://opensea.io/assets/matic/${contract}/${token}`;
    } else if (c === 'Base') {
      marketplaceUrl = `https://opensea.io/assets/base/${contract}/${token}`;
    } else if (c === 'Arbitrum') {
      marketplaceUrl = `https://opensea.io/assets/arbitrum/${contract}/${token}`;
    } else if (c === 'Optimism') {
      marketplaceUrl = `https://opensea.io/assets/optimism/${contract}/${token}`;
    } else if (c === 'Abstract') {
      marketplaceUrl = `https://rarible.com/token/abstract/${contract}:${token}`;
    } else if (c === 'ZKsync') {
      marketplaceUrl = `https://element.market/assets/zksync/${contract}/${token}`;
    } else if (c === 'Scroll') {
      marketplaceUrl = `https://element.market/assets/scroll/${contract}/${token}`;
    } else if (c === 'Linea') {
      marketplaceUrl = `https://element.market/assets/linea/${contract}/${token}`;
    } else if (c === 'Blast') {
      marketplaceUrl = `https://opensea.io/assets/blast/${contract}/${token}`;
    }

    setSelectedNft(null);
    router.push({ pathname: '/(tabs)/hub', params: { url: marketplaceUrl } });
  };

  const filteredNfts = useMemo(() => {
    return nfts.filter(nft => {
      const matchesSearch = 
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.chain.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesChain = selectedChainFilter === 'All' || nft.chain === selectedChainFilter;
      
      const verified = isNftVerified(nft);
      let matchesVerify = true;
      if (selectedVerifyFilter === 'Verified') {
        matchesVerify = verified;
      } else if (selectedVerifyFilter === 'Unverified') {
        matchesVerify = !verified;
      }
      
      return matchesSearch && matchesChain && matchesVerify;
    });
  }, [nfts, searchQuery, selectedChainFilter, selectedVerifyFilter]);

  const displayNfts = useMemo(() => {
    if (selectedVerifyFilter === 'RecentlySent') {
      const sentTxs = transactionHistory.filter(tx => tx.type === 'NFT Send');
      return sentTxs.map(tx => ({
        id: tx.id,
        name: tx.toSymbol || 'Sent NFT',
        collection: tx.fromSymbol || 'Sent Collection',
        image: 'https://images.weserv.nl/?url=https%3A%2F%2Fplacehold.co%2F200.png&output=png',
        chain: tx.chain,
        tokenId: '0',
        contractAddress: '0x0000000000000000000000000000000000000000',
        isVerified: true
      }));
    }
    return filteredNfts;
  }, [filteredNfts, selectedVerifyFilter, transactionHistory]);

  const dynamicChainsList = useMemo(() => {
    const uniqueChains = new Set<string>();
    nfts.forEach(nft => {
      if (nft.chain) uniqueChains.add(nft.chain);
    });
    return ['All', ...Array.from(uniqueChains)];
  }, [nfts]);

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, borderStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.headerTitle, textStyle]}>Ecosystem Collectibles</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.brand.bright} style={{ padding: 4 }} />
        ) : (
          <TouchableOpacity
            onPress={() => walletAddresses && scanAllNfts(walletAddresses)}
            style={{ padding: 4 }}
          >
            <Feather name="refresh-cw" size={16} color={Colors.brand.bright} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Section */}
      <View style={{ paddingHorizontal: Spacing[5], paddingTop: Spacing[3], gap: 8 }}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
          <Feather name="search" size={16} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
            placeholder="Search collections or assets..."
            placeholderTextColor={Colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Chain Horizonal Scrolling Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainFilterRow}>
          {dynamicChainsList.map((chain) => {
            const isActive = selectedChainFilter === chain;
            const logo = CHAIN_LOGOS[chain];
            return (
              <TouchableOpacity
                key={chain}
                style={[
                  styles.chainFilterPill,
                  !isDarkMode && styles.chainFilterPillLight,
                  isActive && styles.chainFilterPillActive
                ]}
                onPress={() => setSelectedChainFilter(chain)}
              >
                <View style={styles.chainPillContent}>
                  {logo && (
                    <Image source={{ uri: logo }} style={styles.chainPillIcon} />
                  )}
                  <Text style={[styles.chainFilterText, isActive && styles.chainFilterTextActive]}>
                    {chain === 'All' ? 'All Chains' : chain}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Type / Verify Horizontal Scrolling Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainFilterRow}>
          {[
            { id: 'All', label: 'All NFTs' },
            { id: 'Verified', label: 'Verified Collections' },
            { id: 'Unverified', label: 'Unverified Collections' },
            { id: 'RecentlyReceived', label: 'Recently Received' },
            { id: 'RecentlySent', label: 'Recently Sent' }
          ].map((item) => {
            const isActive = selectedVerifyFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chainFilterPill,
                  !isDarkMode && styles.chainFilterPillLight,
                  isActive && styles.chainFilterPillActive
                ]}
                onPress={() => setSelectedVerifyFilter(item.id as any)}
              >
                <Text style={[styles.chainFilterText, isActive && styles.chainFilterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Master Collections Gallery */}
        <View style={styles.galleryWrapper}>
          <Text style={[styles.galleryTitle, !isDarkMode && styles.textLightSecondary]}>
            MY EXHIBITS ({displayNfts.length})
          </Text>

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.brand.bright} />
              <Text style={[styles.emptyTitle, textStyle, { marginTop: Spacing[3] }]}>Scanning Collectibles...</Text>
              <Text style={styles.emptySub}>
                Scanning Solana, TON, and EVM Blockscout indexes concurrently...
              </Text>
            </View>
          ) : displayNfts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="image" size={44} color={Colors.border.DEFAULT} />
              <Text style={[styles.emptyTitle, textStyle]}>No Collectibles Found</Text>
              <Text style={styles.emptySub}>
                No assets detected matching the current filters. Start holding NFTs on supported networks to showcase them here!
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {displayNfts.map((nft) => {
                const verified = isNftVerified(nft);
                return (
                  <TouchableOpacity
                    key={nft.id}
                    style={styles.museumFrameContainer}
                    onPress={() => {
                      if (!verified && selectedVerifyFilter !== 'Unverified') {
                        handleInspectScam(nft);
                      } else {
                        setSelectedNft(nft);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={verified ? styles.goldOuterBorder : styles.scamOuterBorder}>
                      <View style={verified ? styles.woodInnerBorder : styles.scamInnerBorder}>
                        <View style={verified ? styles.artworkPanel : styles.scamArtworkPanel}>
                          <ImageWithFallback source={{ uri: nft.image }} style={{ width: '100%', height: '100%' }} fallbackText={nft.collection.substring(0, 2)} />
                          <View style={styles.spotlight} />
                        </View>
                      </View>
                    </View>

                    <View style={[styles.museumPlacard, !verified && { backgroundColor: '#1C0C0C', borderColor: '#EF444425' }]}>
                      <Text style={[styles.placardCollection, !verified && { color: '#EF4444' }]} numberOfLines={1}>
                        {nft.collection}
                      </Text>
                      <Text style={[styles.placardTitle, !isDarkMode && styles.textLightPrimary, !verified && { color: '#FFFFFF' }]} numberOfLines={1}>
                        "{nft.name}"
                      </Text>
                      <View style={styles.placardDivider} />
                      <Text style={[styles.placardMetric, !verified && { color: '#EF4444' }]}>{nft.chain}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Transaction Authorizer */}
      <TransactionConfirmModal
        visible={showAuthModal}
        title="Authorize Collectible Transfer"
        details={[
          { label: 'Collectible', value: selectedNft?.name || 'NFT' },
          { label: 'Collection', value: selectedNft?.collection || 'Art' },
          { label: 'Recipient', value: nftRecipient },
          { label: 'Network', value: `${selectedNft?.chain || 'Solana'} Blockchain` },
          { label: 'Network Fee', value: selectedNft?.chain === 'Solana' ? '0.00005 SOL' : '0.001 ETH' }
        ]}
        securityTips={[
          "NFT transfers are irreversible once signed on-chain.",
          "Webacy has screened the recipient address. No risk found.",
          "Please verify the smart contract address of the collectible."
        ]}
        onConfirm={executeNftSend}
        onCancel={() => setShowAuthModal(false)}
      />

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

      {/* NFT DETAIL MODAL */}
      <Modal
        visible={selectedNft !== null && !showSendNftModal && !showReceiveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNft(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.bottomSheetContainer, { backgroundColor: isDarkMode ? '#0B0B14' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Collectible Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedNft(null)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#1E1E38' : '#F3F4F6' }]}
              >
                <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            {selectedNft && (
              <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                <View style={styles.goldOuterBorderLarge}>
                  <View style={styles.woodInnerBorderLarge}>
                    <View style={styles.artworkPanelLarge}>
                      <ImageWithFallback source={{ uri: selectedNft.image }} style={{ width: '100%', height: '100%' }} fallbackText={selectedNft.collection.substring(0, 2)} />
                      <View style={styles.spotlightLarge} />
                    </View>
                  </View>
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, color: Colors.brand.bright, fontWeight: '800', textTransform: 'uppercase' }}>
                    {selectedNft.collection}
                  </Text>
                  <Text style={[styles.detailNftName, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                    {selectedNft.name}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailGridBox}>
                    <Text style={styles.detailLabel}>Network Chain</Text>
                    <Text style={[styles.detailVal, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>{selectedNft.chain}</Text>
                  </View>
                  <View style={styles.detailGridBox}>
                    <Text style={styles.detailLabel}>Token ID</Text>
                    <Text style={[styles.detailVal, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>{selectedNft.tokenId}</Text>
                  </View>
                  <View style={styles.detailGridBox}>
                    <Text style={styles.detailLabel}>Contract Address</Text>
                    <Text style={[styles.detailVal, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>{selectedNft.contractAddress}</Text>
                  </View>
                  <View style={styles.detailGridBox}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailVal, { color: isNftVerified(selectedNft) ? '#10B981' : '#EF4444' }]}>
                      {isNftVerified(selectedNft) ? 'Verified' : 'Unverified'}
                    </Text>
                  </View>
                </View>

                {/* NFT Actions panel */}
                <View style={{ gap: 10, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={styles.btnSendNft}
                      onPress={() => setShowSendNftModal(true)}
                    >
                      <Feather name="send" size={14} color="#FFFFFF" />
                      <Text style={styles.btnSendNftText}>Send NFT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnReceiveNft}
                      onPress={() => setShowReceiveModal(true)}
                    >
                      <Feather name="download" size={14} color={Colors.brand.bright} />
                      <Text style={styles.btnReceiveNftText}>Receive NFT</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnSendNft, { backgroundColor: Colors.brand.bright }]}
                    onPress={() => handleSellNft(selectedNft)}
                  >
                    <Feather name="shopping-cart" size={14} color="#FFFFFF" />
                    <Text style={styles.btnSendNftText}>Sell on Marketplace</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* SEND NFT MODAL */}
      <Modal
        visible={showSendNftModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSendNftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.bottomSheetContainerMini, { backgroundColor: isDarkMode ? '#0B0B14' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Send Collectible</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSendNftModal(false);
                  setNftRecipient('');
                }}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#1E1E38' : '#F3F4F6' }]}
              >
                <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 16 }}>
              <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
                Enter the recipient address to transfer "{selectedNft?.name}".
              </Text>
              <View style={[styles.inputBox, { borderColor: isDarkMode ? '#1E1E38' : '#E5E7EB', backgroundColor: isDarkMode ? '#00000030' : '#F9FAFB' }]}>
                <TextInput
                  style={[styles.inputField, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                  placeholder="Recipient Wallet Address"
                  placeholderTextColor={isDarkMode ? '#475569' : '#9CA3AF'}
                  value={nftRecipient}
                  onChangeText={setNftRecipient}
                />
              </View>
              <TouchableOpacity
                style={styles.btnConfirmSendNft}
                onPress={() => {
                  if (!nftRecipient.trim()) {
                    Alert.alert('Error', 'Please enter a valid recipient address.');
                    return;
                  }
                  setShowSendNftModal(false);
                  setShowAuthModal(true);
                }}
              >
                <Text style={styles.btnConfirmSendNftText}>Confirm Transfer Signature</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* RECEIVE NFT MODAL */}
      <Modal
        visible={showReceiveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.bottomSheetContainerMini, { backgroundColor: isDarkMode ? '#0B0B14' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Receive Collectible</Text>
              <TouchableOpacity
                onPress={() => setShowReceiveModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#1E1E38' : '#F3F4F6' }]}
              >
                <Feather name="x" size={18} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 16, alignItems: 'center' }}>
              <Text style={{ color: Colors.text.muted, fontSize: 11, textAlign: 'center' }}>
                Scan this QR code to receive NFTs directly on the {selectedNft?.chain || 'Solana'} chain.
              </Text>
              
              {activeWalletAddressForSelectedChain ? (
                <>
                  <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Image
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeWalletAddressForSelectedChain)}` }}
                      style={{ width: 180, height: 180 }}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.inputBox, { width: '100%', borderColor: isDarkMode ? '#1E1E38' : '#E5E7EB', alignItems: 'center' }]}
                    onPress={() => {
                      import('expo-clipboard').then(Clipboard => {
                        Clipboard.setStringAsync(activeWalletAddressForSelectedChain);
                        Alert.alert('Copied Address', 'Wallet address copied to clipboard.');
                      });
                    }}
                  >
                    <Text style={{ color: isDarkMode ? '#FFFFFF' : '#111827', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
                      {activeWalletAddressForSelectedChain}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: Colors.error, fontSize: 12 }}>No address available.</Text>
              )}
            </View>
          </SafeAreaView>
        </View>
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
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    height: 44,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: Typography.size.sm },

  // Network console
  consoleCard: {
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    padding: Spacing[4],
  },
  consoleTitle: { color: Colors.brand.bright, fontSize: 10, fontWeight: 'bold' },
  consoleLogText: { color: '#14F195', fontSize: 9.5, fontFamily: 'monospace', lineHeight: 14 },

  // Museum Art Gallery Frame Styles!
  galleryWrapper: { gap: Spacing[3] },
  galleryTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  
  museumFrameContainer: {
    width: '48%', // side by side rows
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  goldOuterBorder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#D4AF37', // Gold frame
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 2,
    borderColor: '#AA771C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  woodInnerBorder: {
    flex: 1,
    backgroundColor: '#1E1000', // Dark wood border backing
    borderRadius: Radius.xs,
    padding: 4,
    borderWidth: 1,
    borderColor: '#0F0800',
  },
  artworkPanel: {
    flex: 1,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000000',
  },
  spotlight: {
    position: 'absolute',
    top: 0,
    left: '15%',
    width: '70%',
    height: '100%',
    borderRadius: Radius.full,
    transform: [{ scaleX: 1.2 }],
  },

  // Silver Museum info card Placard
  museumPlacard: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.xs,
    padding: 6,
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placardCollection: { color: '#6B7280', fontSize: 7, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },
  placardTitle: { color: '#111827', fontSize: 10, fontWeight: '700', fontFamily: 'serif', fontStyle: 'italic', textAlign: 'center' },
  placardDivider: { width: '85%', height: 0.5, backgroundColor: '#E5E7EB', marginVertical: 2 },
  placardMetric: { color: '#374151', fontSize: 8, textAlign: 'center', fontWeight: 'bold' },

  // Empty states
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3], paddingVertical: 100 },
  emptyTitle: { fontSize: Typography.size.base, fontWeight: 'bold' },
  emptySub: { color: Colors.text.muted, fontSize: Typography.size.xs, textAlign: 'center', paddingHorizontal: Spacing[6], lineHeight: 18 },
 
  // Scam assets
  scamOuterBorder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EF444420',
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 2,
    borderColor: '#EF444460',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  scamInnerBorder: {
    flex: 1,
    backgroundColor: '#0F0808', // Dark red backing
    borderRadius: Radius.xs,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  scamArtworkPanel: {
    flex: 1,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EF444410',
  },
  
  chainPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chainPillIcon: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
  },
  chainFilterRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginVertical: Spacing[1],
  },
  chainFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chainFilterPillLight: {
    backgroundColor: '#E5E7EB',
  },
  chainFilterPillActive: {
    backgroundColor: Colors.brand.bright + '15',
    borderColor: Colors.brand.bright + '45',
  },
  chainFilterText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
  },
  chainFilterTextActive: {
    color: Colors.brand.bright,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  bottomSheetContainerMini: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 20,
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
  goldOuterBorderLarge: {
    width: '100%',
    height: 240,
    backgroundColor: '#D4AF37',
    borderRadius: Radius.lg,
    padding: 8,
    borderWidth: 2,
    borderColor: '#AA771C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  woodInnerBorderLarge: {
    flex: 1,
    backgroundColor: '#1E1000',
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 1.2,
    borderColor: '#0F0800',
  },
  artworkPanelLarge: {
    flex: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000000',
  },
  spotlightLarge: {
    position: 'absolute',
    top: 0,
    left: '10%',
    width: '80%',
    height: '100%',
    borderRadius: Radius.full,
    transform: [{ scaleX: 1.5 }],
  },
  detailNftName: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'serif',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailGridBox: {
    width: '47%',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C4D4E810',
    backgroundColor: '#00000010',
    gap: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnSendNft: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSendNftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  btnReceiveNft: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.brand.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnReceiveNftText: {
    color: Colors.brand.bright,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  btnConfirmSendNft: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.bright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmSendNftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

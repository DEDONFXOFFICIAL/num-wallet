import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { router } from 'expo-router';

const MOCK_PREMIUM_NFTS: {
  id: string;
  name: string;
  collection: string;
  floor: string;
  icon: any;
  color1: string;
  color2: string;
  artist: string;
  acquisitionDate: string;
  chain: string;
}[] = [];

const MOCK_SCAM_NFTS: {
  id: string;
  name: string;
  collection: string;
  floor: string;
  icon: any;
  color1: string;
  color2: string;
  desc: string;
}[] = [];

const CHAIN_LOGOS: Record<string, any> = {
  Solana: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  Ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  Bitcoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', // Or btc if available
  TON: require('../../assets/ton.png'),
  XRP: require('../../assets/xrp.png'),
  'BNB Chain': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  Polygon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  Arbitrum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  Base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  Avalanche: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
  Optimism: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  Tron: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  Cardano: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
};

const MOCK_MARKETPLACES = [
  {
    id: 'magiceden',
    name: 'Magic Eden',
    url: 'magiceden.io',
    desc: 'Ecosystem premier multi-chain marketplace. Trade Solana NFTs, Bitcoin Ordinals, and Ethereum collections.',
    color: '#E4A13B',
    chains: ['Solana', 'Ethereum', 'Bitcoin', 'Polygon', 'Base', 'Arbitrum'],
    icon: 'shopping-bag' as const,
    volume: 'High Liquidity',
  },
  {
    id: 'tensor',
    name: 'Tensor',
    url: 'tensor.trade',
    desc: 'Solana pro NFT trading arena. Real-time charting analysis, floor-price sweeps, and advanced aggregations.',
    color: '#FF007A',
    chains: ['Solana'],
    icon: 'trending-up' as const,
    volume: 'High Liquidity',
  },
  {
    id: 'blur',
    name: 'Blur',
    url: 'blur.io',
    desc: 'Ethereum pro aggregator and sweep marketplace. Trade with sweeping real-time analytics and low gas.',
    color: '#00E5FF',
    chains: ['Ethereum'],
    icon: 'zap' as const,
    volume: 'High Liquidity',
  },
  {
    id: 'opensea',
    name: 'OpenSea',
    url: 'opensea.io',
    desc: 'The general multi-chain marketplace for virtual collectibles across Solana, Ethereum, and others.',
    color: '#2081E2',
    chains: ['Ethereum', 'Solana', 'Polygon', 'Base', 'Arbitrum', 'Avalanche', 'Optimism'],
    icon: 'anchor' as const,
    volume: 'High Liquidity',
  },
  {
    id: 'solanart',
    name: 'Solanart',
    url: 'solanart.io',
    desc: 'Curated artistic legacy collections exclusively focused on Solana classic digital art exhibition items.',
    color: '#3A8AFF',
    chains: ['Solana'],
    icon: 'image' as const,
    volume: 'Moderate Liquidity',
  },
  {
    id: 'ordinalwallet',
    name: 'Ordinal Wallet',
    url: 'ordinals-wallet.com',
    desc: 'Dedicated Bitcoin Ordinals wallet and marketplace. Trade BRC-20 tokens, stamps, and inscriptions.',
    color: '#F7931A',
    chains: ['Bitcoin'],
    icon: 'shield' as const,
    volume: 'Moderate Liquidity',
  },
  {
    id: 'getgems',
    name: 'Getgems',
    url: 'getgems.io',
    desc: 'The premier NFT marketplace on The Open Network (TON). Buy, sell, and auction unique TON digital items.',
    color: '#0098EA',
    chains: ['TON'],
    icon: 'grid' as const,
    volume: 'Moderate Liquidity',
  },
  {
    id: 'xrpcafe',
    name: 'XRP Cafe',
    url: 'xrp.cafe',
    desc: 'The leading NFT marketplace on the XRP Ledger. Discover XRP arts, collectibles, and ledger badges.',
    color: '#23292F',
    chains: ['XRP'],
    icon: 'coffee' as const,
    volume: 'Moderate Liquidity',
  },
  {
    id: 'nftrade',
    name: 'NFTrade',
    url: 'nftrade.com',
    desc: 'Cross-chain NFT aggregator and marketplace supporting BNB Chain, Polygon, Avalanche, and Tron assets.',
    color: '#3D8CFF',
    chains: ['BNB Chain', 'Polygon', 'Avalanche', 'Tron'],
    icon: 'shuffle' as const,
    volume: 'Moderate Liquidity',
  },
  {
    id: 'tofunft',
    name: 'tofuNFT',
    url: 'tofunft.com',
    desc: 'Focusing on GameFi and collectible NFTs across Arbitrum, Optimism, Base, Cardano, and Polygon.',
    color: '#FF7A00',
    chains: ['Arbitrum', 'Optimism', 'Base', 'Cardano', 'Polygon'],
    icon: 'play' as const,
    volume: 'Moderate Liquidity',
  }
];

export default function NFTsScreen() {
  const { isDarkMode } = useUserStore();
  const [activeTab, setActiveTab] = useState<'Collections' | 'Marketplaces' | 'Items' | 'Hidden' | 'Unverified'>('Collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('All');

  // Dynamically extract unique chains where there are listed marketplaces (future-proof!)
  const marketplaceChains = useMemo(() => {
    const chainsSet = new Set<string>();
    MOCK_MARKETPLACES.forEach(m => m.chains.forEach(c => chainsSet.add(c)));
    return ['All', ...Array.from(chainsSet)];
  }, []);

  // Shuffle trigger state
  const [shuffleTrigger, setShuffleTrigger] = useState(0);

  // Dynamic collections chain filtering (based dynamically on held NFT networks)
  const [selectedCollectionChain, setSelectedCollectionChain] = useState<string>('All');

  // Dynamically extract unique chains where the user actively holds NFTs (future-proof!)
  const heldChains = Array.from(new Set(MOCK_PREMIUM_NFTS.map(nft => nft.chain || 'Solana')));
  const collectionChainOptions = ['All', ...heldChains];

  const handleInspectScam = (nft: typeof MOCK_SCAM_NFTS[0]) => {
    Alert.alert(
      '⚠️ SECURITY THREAT WARNING!',
      `This asset ("${nft.name}") is unverified and flagged as a potential phishing voucher.\n\nInteracting with this card or signing signature requests from it will compromise your private keys and lead to a total loss of funds.\n\nDo you want to proceed at your own risk?`,
      [
        { text: 'Cancel & Dismiss', style: 'cancel' },
        { 
          text: 'Force Open (At Your Own Risk)', 
          style: 'destructive',
          onPress: () => Alert.alert('Action Logged', 'You have bypassed security. Any dynamic transaction signature approval is your sole responsibility.')
        }
      ]
    );
  };

  const filteredNfts = MOCK_PREMIUM_NFTS.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collection.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedCollectionChain === 'All' || (nft.chain || 'Solana') === selectedCollectionChain;
    return matchesSearch && matchesChain;
  });

  const displayNfts = useMemo(() => {
    let list = [...filteredNfts];
    if (shuffleTrigger > 0) {
      // Fisher-Yates shuffle algorithm
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
    }
    return list;
  }, [filteredNfts, shuffleTrigger]);

  const filteredMarketplaces = MOCK_MARKETPLACES.filter(m => {
    if (selectedChain === 'All') return true;
    return m.chains.includes(selectedChain);
  });

  // Dynamic light mode styles helper
  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, borderStyle]}>
        <Text style={[styles.headerTitle, textStyle]}>Ecosystem Collectibles</Text>
      </View>

      {/* 5 Distinct Curated Tabs */}
      <View style={[styles.tabs, borderStyle]}>
        {(['Collections', 'Marketplaces', 'Items', 'Hidden', 'Unverified'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        {activeTab !== 'Unverified' && activeTab !== 'Marketplaces' && (
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
            <Feather name="search" size={16} color={Colors.text.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
              placeholder="Search museum collections..."
              placeholderTextColor={Colors.text.disabled}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShuffleTrigger(0);
              }}
              autoCorrect={false}
            />
          </View>
        )}

        {/* ── NFT MARKETPLACES TAB ──────────────────────────────────────────────── */}
        {activeTab === 'Marketplaces' && (
          <View style={styles.marketSection}>
            <Text style={[styles.marketTitle, !isDarkMode && styles.textLightSecondary]}>Ecosystem Marketplaces</Text>
            
            {/* Horizontal Chain Filter Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainFilterRow}>
              {marketplaceChains.map((chain) => {
                const isActive = selectedChain === chain;
                const logo = CHAIN_LOGOS[chain];
                return (
                  <TouchableOpacity
                    key={chain}
                    style={[
                      styles.chainFilterPill,
                      !isDarkMode && styles.chainFilterPillLight,
                      isActive && styles.chainFilterPillActive
                    ]}
                    onPress={() => setSelectedChain(chain)}
                  >
                    <View style={styles.chainPillContent}>
                      {logo && (
                        typeof logo === 'string' ? (
                          <Image source={{ uri: logo }} style={styles.chainPillIcon} />
                        ) : (
                          <Image source={logo} style={styles.chainPillIcon} />
                        )
                      )}
                      <Text style={[styles.chainFilterText, isActive && styles.chainFilterTextActive]}>
                        {chain === 'All' ? 'All Chains' : chain}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Horizontal Scroll of Square Card Boxes (Without Gold Frame) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketHorizontalScroll}>
              {filteredMarketplaces.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.marketBoxCard,
                    isDarkMode ? styles.marketBoxCardDark : styles.marketBoxCardLight
                  ]}
                  onPress={() => router.push({ pathname: '/(tabs)/hub', params: { url: m.url } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.marketBoxTop}>
                    <View style={[styles.marketBoxIconBox, { backgroundColor: m.color + '15' }]}>
                      <Feather name={m.icon} size={20} color={m.color} />
                    </View>
                    <Text style={[styles.marketBoxName, textStyle]}>{m.name}</Text>
                    <Text style={styles.marketBoxUrl}>{m.url}</Text>
                  </View>

                  <Text style={styles.marketBoxDesc} numberOfLines={3}>{m.desc}</Text>

                  {/* Chain indicators */}
                  <View style={styles.marketBoxChainsRow}>
                    {m.chains.map(c => (
                      <View key={c} style={[styles.marketBoxChainBadge, !isDarkMode && styles.marketBoxChainBadgeLight]}>
                        <Text style={styles.marketBoxChainText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── UNVERIFIED / SCAM HUB TAB ─────────────────────────────────────────── */}
        {activeTab === 'Unverified' && (
          <View style={styles.scamSection}>
            <View style={styles.scamWarningBox}>
              <Feather name="alert-triangle" size={20} color="#EF4444" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.scamWarningTitle}>FILTERED SUSPICIOUS ASSETS</Text>
                <Text style={styles.scamWarningText}>
                  These air-dropped tokens are unverified and may contain phishing contracts designed to drain your wallet. Interacting with them is highly dangerous. You are solely responsible for your actions.
                </Text>
              </View>
            </View>

            {MOCK_SCAM_NFTS.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="shield" size={44} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={[styles.emptyTitle, textStyle]}>Inbox Clean & Secure</Text>
                <Text style={styles.emptySub}>
                  No unverified vouchers or suspicious air-dropped collectibles have been detected.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {MOCK_SCAM_NFTS.map((scam) => (
                  <TouchableOpacity
                    key={scam.id}
                    style={styles.museumFrameContainer}
                    onPress={() => handleInspectScam(scam)}
                    activeOpacity={0.8}
                  >
                    {/* Caution Danger Frame */}
                    <View style={styles.scamOuterBorder}>
                      <View style={styles.scamInnerBorder}>
                        <LinearGradient
                          colors={[scam.color1 + '20', scam.color2 + '10']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.scamArtworkPanel}
                        >
                          <Ionicons name={scam.icon} size={24} color={scam.color1} />
                          
                          {/* Glow caution spotlight overlay */}
                          <View style={[styles.spotlight, { backgroundColor: scam.color1 + '10' }]} />
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Dark Red / Caution Warning Placard */}
                    <View style={[styles.scamPlacard, !isDarkMode && styles.scamPlacardLight]}>
                      <Text style={styles.scamPlacardHeader}>⚠️ HIGH RISK</Text>
                      <Text style={[styles.scamPlacardTitle, !isDarkMode && styles.textLightPrimary]} numberOfLines={1}>
                        {scam.name}
                      </Text>
                      <View style={styles.scamPlacardDivider} />
                      <Text style={styles.scamPlacardSub} numberOfLines={1}>
                        {scam.collection}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── HIDDEN ASSETS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'Hidden' && (
          <View style={styles.emptyContainer}>
            <Feather name="eye-off" size={44} color={Colors.border.DEFAULT} />
            <Text style={[styles.emptyTitle, textStyle]}>Vault Hidden Collectibles</Text>
            <Text style={styles.emptySub}>Assets you manually hid from your primary gallery appear securely here.</Text>
          </View>
        )}

        {/* ── ITEMS TAB (STANDALONE ARCHIVE) ────────────────────────────────────── */}
        {activeTab === 'Items' && (
          <View style={styles.emptyContainer}>
            <Feather name="archive" size={44} color={Colors.border.DEFAULT} />
            <Text style={[styles.emptyTitle, textStyle]}>No Individual Items</Text>
            <Text style={styles.emptySub}>Collectibles are currently organized inside master museum frames.</Text>
          </View>
        )}

        {/* ── MASTER COLLECTIONS GALLERY TAB ────────────────────────────────────── */}
        {activeTab === 'Collections' && (
          <View style={styles.galleryWrapper}>
            <View style={styles.shuffleHeader}>
              <Text style={[styles.galleryTitle, !isDarkMode && styles.textLightSecondary]}>Museum Exhibition</Text>
              <TouchableOpacity
                style={[
                  styles.shuffleBtn,
                  !isDarkMode && styles.shuffleBtnLight
                ]}
                onPress={() => setShuffleTrigger(prev => prev + 1)}
                activeOpacity={0.7}
              >
                <Feather name="shuffle" size={11} color={Colors.brand.bright} style={{ marginRight: 4 }} />
                <Text style={styles.shuffleBtnText}>Shuffle Collection</Text>
              </TouchableOpacity>
            </View>
            
            {/* Dynamic Horizontal Chain Filter Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainFilterRow}>
              {collectionChainOptions.map((chain) => {
                const isActive = selectedCollectionChain === chain;
                const logo = CHAIN_LOGOS[chain];
                return (
                  <TouchableOpacity
                    key={chain}
                    style={[
                      styles.chainFilterPill,
                      !isDarkMode && styles.chainFilterPillLight,
                      isActive && styles.chainFilterPillActive
                    ]}
                    onPress={() => {
                      setSelectedCollectionChain(chain);
                      setShuffleTrigger(0);
                    }}
                  >
                    <View style={styles.chainPillContent}>
                      {logo && (
                        typeof logo === 'string' ? (
                          <Image source={{ uri: logo }} style={styles.chainPillIcon} />
                        ) : (
                          <Image source={logo} style={styles.chainPillIcon} />
                        )
                      )}
                      <Text style={[styles.chainFilterText, isActive && styles.chainFilterTextActive]}>
                        {chain === 'All' ? 'All Chains' : chain}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {displayNfts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="image" size={44} color={Colors.border.DEFAULT} />
                <Text style={[styles.emptyTitle, textStyle]}>No Collectibles Found</Text>
                <Text style={styles.emptySub}>
                  Your gallery is empty. Start holding digital art on Solana or other networks to showcase them here!
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {displayNfts.map((nft) => (
                  <View key={nft.id} style={styles.museumFrameContainer}>
                    {/* Premium Gold & Wood Picture Frame */}
                    <View style={styles.goldOuterBorder}>
                      <View style={styles.woodInnerBorder}>
                        <LinearGradient
                          colors={[nft.color1 + '35', nft.color2 + '15']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.artworkPanel}
                        >
                          <Ionicons name={nft.icon} size={24} color={nft.color1} />
                          
                          {/* Glow spotlight overlay */}
                          <View style={[styles.spotlight, { backgroundColor: nft.color1 + '15' }]} />
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Silver-Metallic Museum Info Placard */}
                    <View style={styles.museumPlacard}>
                      <Text style={styles.placardCollection} numberOfLines={1}>{nft.collection}</Text>
                      <Text style={styles.placardTitle} numberOfLines={1}>"{nft.name}"</Text>
                      <View style={styles.placardDivider} />
                      <View style={styles.placardFooter}>
                        <Text style={styles.placardMetric}>Artist: {nft.artist}</Text>
                        <Text style={styles.placardMetric}>Floor: <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{nft.floor}</Text></Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
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
  
  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing[3] },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brand.bright },
  tabText: { color: Colors.text.muted, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  tabTextActive: { color: Colors.brand.bright },
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

  // Museum Art Gallery Frame Styles!
  galleryWrapper: { gap: Spacing[3] },
  galleryTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  
  museumFrameContainer: {
    width: '30.5%',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  goldOuterBorder: {
    width: '100%',
    height: 100, // compact height for 3-column
    backgroundColor: '#D4AF37', // Gold frame
    borderRadius: Radius.md,
    padding: 4, // Thinner frame outline for smaller cells
    borderWidth: 1.2,
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
    padding: 3, // Smaller inner border
    borderWidth: 0.6,
    borderColor: '#0F0800',
  },
  artworkPanel: {
    flex: 1,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.8,
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
    padding: 4,
    alignItems: 'center',
    gap: 1,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placardCollection: { color: '#6B7280', fontSize: 6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },
  placardTitle: { color: '#111827', fontSize: 9, fontWeight: '700', fontFamily: 'serif', fontStyle: 'italic', textAlign: 'center' },
  placardDivider: { width: '85%', height: 0.5, backgroundColor: '#E5E7EB', marginVertical: 2 },
  placardFooter: { flexDirection: 'column', alignItems: 'center', width: '100%' },
  placardMetric: { color: '#374151', fontSize: 7, textAlign: 'center', marginTop: 1 },

  // Empty states
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3], paddingVertical: 100 },
  emptyTitle: { fontSize: Typography.size.base, fontWeight: 'bold' },
  emptySub: { color: Colors.text.muted, fontSize: Typography.size.xs, textAlign: 'center', paddingHorizontal: Spacing[6] },

  // Scam assets
  scamSection: { gap: Spacing[4] },
  scamWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: '#EF444410',
    borderWidth: 1,
    borderColor: '#EF444430',
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  scamWarningTitle: { color: '#EF4444', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  scamWarningText: { color: Colors.text.muted, fontSize: 10, lineHeight: 15 },
  scamOuterBorder: {
    width: '100%',
    height: 100,
    backgroundColor: '#EF444420',
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1.2,
    borderColor: '#EF444460',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  scamInnerBorder: {
    flex: 1,
    backgroundColor: '#0F0808', // Dark red backing
    borderRadius: Radius.xs,
    padding: 2,
    borderWidth: 0.6,
    borderColor: '#EF444430',
  },
  scamArtworkPanel: {
    flex: 1,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: '#EF444410',
  },
  scamPlacard: {
    width: '100%',
    backgroundColor: '#1C0C0C', // translucent dark red
    borderWidth: 1,
    borderColor: '#EF444425',
    borderRadius: Radius.xs,
    padding: 4,
    alignItems: 'center',
    gap: 1,
    marginTop: 4,
  },
  scamPlacardLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  scamPlacardHeader: {
    color: '#EF4444',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scamPlacardTitle: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scamPlacardDivider: {
    width: '80%',
    height: 0.5,
    backgroundColor: '#EF444420',
    marginVertical: 2,
  },
  scamPlacardSub: {
    color: Colors.text.muted,
    fontSize: 7,
    textAlign: 'center',
  },
  
  // Marketplaces tab styles
  marketSection: { gap: Spacing[4] },
  marketTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  marketHorizontalScroll: {
    paddingVertical: Spacing[2],
    gap: Spacing[4],
    paddingRight: Spacing[5],
  },
  marketBoxCard: {
    width: 175,
    height: 200,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing[4],
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketBoxCardDark: {
    backgroundColor: '#0A0A16',
    borderColor: '#C4D4E808',
  },
  marketBoxCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  marketBoxTop: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  marketBoxIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketBoxName: {
    fontSize: Typography.size.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  marketBoxUrl: {
    color: Colors.brand.bright,
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  marketBoxDesc: {
    color: Colors.text.muted,
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  marketBoxChainsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  marketBoxChainBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  chainPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chainPillIcon: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  marketBoxChainBadgeLight: {
    backgroundColor: '#F3F4F6',
  },
  marketBoxChainText: {
    color: Colors.text.muted,
    fontSize: 7,
    fontWeight: 'bold',
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
  shuffleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(58, 138, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(58, 138, 255, 0.2)',
  },
  shuffleBtnLight: {
    backgroundColor: 'rgba(58, 138, 255, 0.05)',
    borderColor: 'rgba(58, 138, 255, 0.15)',
  },
  shuffleBtnText: {
    color: Colors.brand.bright,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

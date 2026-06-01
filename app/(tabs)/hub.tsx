import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';

const CHAINS_DATA = [
  { id: 'solana', name: 'Solana', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', symbol: 'SOL' },
  { id: 'ethereum', name: 'Ethereum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', symbol: 'ETH' },
  { id: 'bnb', name: 'BNB Chain', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', symbol: 'POL' },
  { id: 'arbitrum', name: 'Arbitrum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png', symbol: 'OP' },
  { id: 'base', name: 'Base', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png', symbol: 'ETH' },
  { id: 'avalanche', name: 'Avalanche', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png', symbol: 'AVAX' },
  { id: 'fantom', name: 'Fantom', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png', symbol: 'FTM' },
  { id: 'ton', name: 'TON', logo: require('../../assets/ton.png'), symbol: 'TON' },
  { id: 'bitcoin', name: 'Bitcoin', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', symbol: 'BTC' },
  { id: 'cardano', name: 'Cardano', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png', symbol: 'ADA' },
  { id: 'xrp', name: 'Ripple', logo: require('../../assets/xrp.png'), symbol: 'XRP' },
  { id: 'sui', name: 'Sui', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png', symbol: 'SUI' },
  { id: 'aptos', name: 'Aptos', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png', symbol: 'APT' },
  { id: 'tron', name: 'Tron', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png', symbol: 'TRX' },
  { id: 'near', name: 'Near', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png', symbol: 'NEAR' }
];

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

export default function HubScreen() {
  const { isDarkMode, accountNumber, bookmarkedDapps, addBookmark, removeBookmark, minimizedTabs, setMinimizedTabs } = useUserStore();
  const [searchUrl, setSearchUrl] = useState('');
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(true);
  const [showTabsModal, setShowTabsModal] = useState(false);
  const [activeNetworkIndex, setActiveNetworkIndex] = useState(0);
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string | null>(null);

  const activeNetwork = CHAINS_DATA[activeNetworkIndex];

  // Filter bookmarked dApps based on active network selection
  const filteredBookmarks = useMemo(() => {
    if (selectedNetworkFilter === null) return bookmarkedDapps;
    
    return bookmarkedDapps.filter(dapp => {
      const name = dapp.name.toLowerCase();
      const url = dapp.url.toLowerCase();
      
      if (selectedNetworkFilter === 'solana') {
        return name.includes('jup') || name.includes('raydium') || name.includes('orca') || name.includes('tensor') || name.includes('solanart') || url.includes('jup.ag') || url.includes('raydium.io') || url.includes('orca.so') || url.includes('tensor.trade');
      }
      if (selectedNetworkFilter === 'ethereum') {
        return name.includes('uni') || name.includes('blur') || name.includes('opensea') || url.includes('uniswap.org') || url.includes('opensea.io') || url.includes('blur.io');
      }
      if (selectedNetworkFilter === 'bsc') {
        return name.includes('pancake') || url.includes('pancakeswap');
      }
      if (selectedNetworkFilter === 'polygon') {
        return name.includes('quick') || url.includes('quickswap');
      }
      if (selectedNetworkFilter === 'ton') {
        return name.includes('ton') || url.includes('ton');
      }
      if (selectedNetworkFilter === 'xrp') {
        return name.includes('ripple') || name.includes('xrp') || url.includes('xrp');
      }
      
      // Default: allow others or fallback to Magic Eden if not matched
      return name.includes('eden') || name.includes('magic') || url.includes('magiceden.io');
    });
  }, [bookmarkedDapps, selectedNetworkFilter]);

  const handleCycleNetwork = () => {
    setActiveNetworkIndex((prev) => (prev + 1) % CHAINS_DATA.length);
  };

  const params = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    if (params.url) {
      handleLaunchBrowser(params.url);
    }
  }, [params.url]);

  const handleLaunchBrowser = (url: string) => {
    let formattedUrl = url.trim().toLowerCase();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      if (!formattedUrl.includes('.')) {
        formattedUrl = `google.com/search?q=${formattedUrl}`;
      } else {
        formattedUrl = `https://${formattedUrl}`;
      }
    }
    setBrowserUrl(formattedUrl);
    
    if (!minimizedTabs.includes(formattedUrl)) {
      setMinimizedTabs([...minimizedTabs, formattedUrl]);
    }
  };

  const handleCloseBrowser = () => {
    setBrowserUrl(null);
    setSearchUrl('');
  };

  const handleSimulateDappAction = (dappName: string) => {
    Alert.alert(
      'Wallet Interaction Requested',
      `dApp (${dappName}) is requesting signature authorization for gas estimation.`,
      [
        {
          text: 'Approve Signature',
          onPress: () => Alert.alert('Success', 'Transaction signed and broadcasted successfully by Num Guard.'),
        },
        { text: 'Reject', style: 'cancel' }
      ]
    );
  };

  // Extract clean domain for bookmarking
  const cleanUrl = browserUrl ? browserUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] : '';
  const isBookmarked = bookmarkedDapps.some((x) => x.url.toLowerCase() === cleanUrl.toLowerCase());

  const handleToggleBookmark = () => {
    if (!browserUrl) return;
    if (isBookmarked) {
      removeBookmark(cleanUrl);
      Alert.alert('Bookmark Removed', `${cleanUrl} has been removed from your browser bookmarks.`);
    } else {
      addBookmark({ name: cleanUrl, url: cleanUrl });
      Alert.alert('Bookmark Added', `${cleanUrl} has been added to your browser bookmarks!`);
    }
  };

  // Styles based on theme
  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {browserUrl ? (
        /* ── SANDBOXED IN-APP WEB3 BROWSER ───────────────────────────────────────── */
        <View style={styles.browserContainer}>
          {/* Browser Address Bar */}
          <View style={[styles.browserHeader, { backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF', borderBottomColor: isDarkMode ? '#1A1A30' : '#E5E7EB', borderBottomWidth: 1 }]}>
            <View style={styles.browserNav}>
              <TouchableOpacity onPress={handleCloseBrowser} style={[styles.browserNavBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
                <Feather name="chevron-left" size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.browserNavBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
                <Feather name="rotate-cw" size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            <View style={[styles.browserAddressBox, { backgroundColor: isDarkMode ? '#0C0C1C' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB' }]}>
              <Feather name="lock" size={12} color="#10B981" />
              <Text style={[styles.browserAddressText, { color: isDarkMode ? '#FFFFFF' : '#111827', flex: 1 }]} numberOfLines={1}>
                {browserUrl}
              </Text>
              <TouchableOpacity onPress={handleToggleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingLeft: 4 }}>
                <Ionicons 
                  name={isBookmarked ? "star" : "star-outline"} 
                  size={14} 
                  color={isBookmarked ? "#F59E0B" : Colors.text.muted} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleCloseBrowser} style={[styles.browserCloseBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
              <Feather name="x" size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>

          {/* Num Guard Wallet Connection Banner */}
          <View style={styles.walletBanner}>
            <View style={styles.walletBannerLeft}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.walletBannerText}>
                Num Guard Injection: <Text style={{ fontWeight: 'bold' }}>{walletConnected ? `Connected (${accountNumber})` : 'Disconnected'}</Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.disconnectBtn, !walletConnected && styles.connectBtn]} 
              onPress={() => setWalletConnected(!walletConnected)}
            >
              <Text style={styles.disconnectBtnText}>{walletConnected ? 'Disconnect' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>

          {/* Simulated Browser Webpage View */}
          <View style={styles.browserBody}>
            <LinearGradient
              colors={['#1F1F38', '#0F0F1E']}
              style={styles.webPageLayout}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 }}>
                <Text style={styles.webPageTitle}>
                  {browserUrl.includes('uniswap') ? 'Uniswap Interface V4' : 
                   browserUrl.includes('jup') ? 'Jupiter Aggregator' :
                   browserUrl.includes('raydium') ? 'Raydium Protocol' :
                   browserUrl.includes('magiceden') ? 'Magic Eden Marketplace' : 'dApp Sandbox Dashboard'}
                </Text>
                
                {/* Active Network Selector Pill inside Simulated DApp */}
                <TouchableOpacity 
                  style={styles.sandboxNetworkBadge}
                  onPress={handleCycleNetwork}
                  activeOpacity={0.8}
                >
                  <Image source={typeof activeNetwork.logo === 'string' ? { uri: activeNetwork.logo } : activeNetwork.logo} style={styles.sandboxNetworkLogo} />
                  <Text style={styles.sandboxNetworkText}>{activeNetwork.name}</Text>
                  <Feather name="chevron-down" size={10} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.webPageCard}>
                <Text style={styles.webPageCardLabel}>Swap / Interaction Panel</Text>
                
                <View style={styles.webInputBox}>
                  <Text style={styles.webTokenLabel}>From ({activeNetwork.symbol})</Text>
                  <Text style={styles.webTokenVal}>0.00 {activeNetwork.symbol}</Text>
                </View>

                <View style={styles.webInputBox}>
                  <Text style={styles.webTokenLabel}>To (USDC)</Text>
                  <Text style={styles.webTokenVal}>~$0.00 USD</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.webActionBtn, !walletConnected && styles.webActionBtnDisabled]} 
                  onPress={() => handleSimulateDappAction(browserUrl)}
                  disabled={!walletConnected}
                >
                  <Text style={styles.webActionText}>
                    {walletConnected ? 'Authorize Wallet Swap' : 'Please Connect Wallet'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.webPageFooter}>
                Secured locally by Num Wallet Injected API. Key files are fully offline.
              </Text>
            </LinearGradient>
          </View>
        </View>
      ) : (
        /* ── DAPP EXPLORER SEARCH DASHBOARD ─────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          <View style={[styles.header, borderStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitle, textStyle]}>
                <Text style={{ color: Colors.brand.bright, fontWeight: '800' }}>Num</Text> Browser
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.tabsBtn, !isDarkMode && styles.tabsBtnLight]} 
              onPress={() => setShowTabsModal(true)}
              activeOpacity={0.7}
            >
              <Feather name="layers" size={18} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              {minimizedTabs.length > 0 && (
                <View style={styles.tabsBadge}>
                  <Text style={styles.tabsBadgeText}>{minimizedTabs.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Search Web Bar */}
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>Web3 Address Search</Text>
              <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? Colors.brand.bright + '30' : '#E5E7EB' }]}>
                <Feather name="globe" size={16} color={Colors.text.muted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                  placeholder="Enter dApp URL (e.g. jup.ag)..."
                  placeholderTextColor={Colors.text.disabled}
                  value={searchUrl}
                  onChangeText={setSearchUrl}
                  onSubmitEditing={() => handleLaunchBrowser(searchUrl)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                />
                {searchUrl.trim().length > 0 && (
                  <TouchableOpacity onPress={() => handleLaunchBrowser(searchUrl)} style={styles.goBtn}>
                    <Text style={styles.goBtnText}>GO</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Network Explorer Horizontal Scrolling Selector Grid */}
            <View style={styles.networkSelectSection}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary, { marginTop: 0 }]}>
                Network Explorer
              </Text>
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
                          backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF',
                          borderColor: isActive ? activeBorderColor : (isDarkMode ? '#C4D4E810' : '#E5E7EB'),
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        setSelectedNetworkFilter(net.id);
                        if (net.id !== null) {
                          const chainIdx = CHAINS_DATA.findIndex(c => c.id === net.id);
                          if (chainIdx !== -1) {
                            setActiveNetworkIndex(chainIdx);
                          }
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.networkCircleIconBox, { backgroundColor: net.color + '15' }]}>
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

            {/* Bookmarks Grid (4 Columns Wrapping Horizontally) */}
            <View style={styles.bookmarksSection}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary]}>Bookmarks Menu</Text>
              {filteredBookmarks.length === 0 ? (
                <View style={[styles.emptyGridCard, !isDarkMode && styles.emptyGridCardLight]}>
                  <Feather name="star" size={20} color={Colors.text.muted} />
                  <Text style={styles.emptyGridText}>
                    {bookmarkedDapps.length === 0 
                      ? 'No bookmarked websites yet. Star a URL inside the browser to save it here.' 
                      : `No bookmarked websites found for this specific network.`}
                  </Text>
                </View>
              ) : (
                <View style={styles.bookmarksGrid}>
                  {filteredBookmarks.map((dapp) => {
                    const faviconUrl = `https://www.google.com/s2/favicons?domain=${dapp.url}&sz=64`;
                    return (
                      <View key={dapp.url} style={[styles.bookmarkCard, !isDarkMode && styles.bookmarkCardLight]}>
                        <TouchableOpacity 
                          style={styles.bookmarkClickable}
                          onPress={() => handleLaunchBrowser(dapp.url)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.bookmarkIconBox, !isDarkMode && styles.bookmarkIconBoxLight]}>
                            <Image 
                              source={{ uri: faviconUrl }} 
                              style={styles.bookmarkIcon} 
                            />
                          </View>
                          <Text style={[styles.bookmarkName, !isDarkMode && styles.textLightPrimary]} numberOfLines={1}>
                            {dapp.name}
                          </Text>
                        </TouchableOpacity>

                        {/* Subtly positioned remove button */}
                        <TouchableOpacity 
                          style={styles.deleteBookmarkBtn}
                          onPress={() => removeBookmark(dapp.url)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="x" size={10} color={Colors.text.muted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Custom Injected DApp Guide */}
            <View style={[styles.infoGuideCard, !isDarkMode && styles.infoGuideCardLight]}>
              <View style={styles.guideTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.brand.bright} />
                <Text style={[styles.guideTitle, textStyle]}>Secure Sandboxed Browser</Text>
              </View>
              <Text style={styles.guideDesc}>
                Type any unverified Web3 URL or custom dApp address in the search bar above to launch our isolated browser sandbox.
              </Text>
              <View style={styles.guideBulletRow}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.guideBulletText}>Num Guard automatically injects the Web3 wallet connection API securely.</Text>
              </View>
              <View style={styles.guideBulletRow}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.guideBulletText}>Your private keys remain 100% offline and are never exposed to any dApp.</Text>
              </View>
              <View style={styles.guideBulletRow}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.guideBulletText}>Each signature request requires explicit manual confirmation before execution.</Text>
              </View>
            </View>
            <View style={{ height: Spacing[8] }} />
          </ScrollView>
        </View>
      )}

      {/* ── MINIMIZED TABS LAYERS MODAL ────────────────────────────────────────── */}
      <Modal
        visible={showTabsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTabsModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="layers" size={16} color="#FFFFFF" />
                <Text style={styles.modalHeaderTitle}>Minimized Tabs ({minimizedTabs.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTabsModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {minimizedTabs.length === 0 ? (
              <View style={styles.emptyTabsBody}>
                <Feather name="layers" size={42} color={Colors.text.muted} />
                <Text style={styles.emptyTabsTitle}>No Minimized Tabs</Text>
                <Text style={styles.emptyTabsSubtitle}>
                  Tabs are automatically saved here when you close the browser dashboard, keeping your Web3 sessions intact.
                </Text>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowTabsModal(false)}>
                  <Text style={styles.closeModalBtnText}>Got it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.tabsGridScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.tabsPreviewGrid}>
                    {minimizedTabs.map((tabUrl) => {
                      const cleanTabDomain = tabUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                      const tabFavicon = `https://www.google.com/s2/favicons?domain=${cleanTabDomain}&sz=64`;
                      const isActive = browserUrl === tabUrl;
                      
                      return (
                        <View 
                          key={tabUrl} 
                          style={[
                            styles.tabPreviewCard,
                            isActive && { borderColor: Colors.brand.bright, borderWidth: 1.5 }
                          ]}
                        >
                          {/* Tab Card Header */}
                          <View style={styles.tabCardHeader}>
                            <Image source={{ uri: tabFavicon }} style={styles.tabCardFavicon} />
                            <Text style={styles.tabCardDomain} numberOfLines={1}>
                              {cleanTabDomain}
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                const nextTabs = minimizedTabs.filter(x => x !== tabUrl);
                                setMinimizedTabs(nextTabs);
                                if (browserUrl === tabUrl) {
                                  setBrowserUrl(nextTabs[nextTabs.length - 1] || null);
                                }
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.tabCardCloseBtn}
                            >
                              <Feather name="x" size={10} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>

                          {/* Tab Content Preview (Mock webpage look) */}
                          <TouchableOpacity
                            style={styles.tabCardBody}
                            onPress={() => {
                              setBrowserUrl(tabUrl);
                              setShowTabsModal(false);
                            }}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={['#1F1F38', '#0F0F1E']}
                              style={styles.mockPreviewLayout}
                            >
                              <View style={styles.mockAddressBar}>
                                <Feather name="lock" size={6} color="#10B981" />
                                <Text style={styles.mockAddressText} numberOfLines={1}>{cleanTabDomain}</Text>
                              </View>

                              {/* Tiny Swap interface preview */}
                              <View style={styles.mockSwapBox}>
                                <View style={styles.mockSwapInput} />
                                <View style={styles.mockSwapInput} />
                                <View style={styles.mockSwapBtn} />
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>

                          {/* Active Label */}
                          {isActive && (
                            <View style={styles.activeTabTag}>
                              <Text style={styles.activeTabText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Close All Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={() => {
                      setMinimizedTabs([]);
                      setBrowserUrl(null);
                      setShowTabsModal(false);
                      Alert.alert('Tabs Cleared', 'All browser tabs have been closed.');
                    }}
                  >
                    <Feather name="trash" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.clearAllBtnText}>Close All Tabs</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
  headerLogo: { width: 24, height: 24, borderRadius: Radius.xs },
  tabsBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    position: 'relative',
  },
  tabsBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  tabsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },

  // Search Address Bar
  searchSection: { gap: 6 },
  searchLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    height: 48,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: Typography.size.sm },
  goBtn: {
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  // Bookmarks Section
  bookmarksSection: { gap: Spacing[2], marginBottom: Spacing[1] },
  sectionTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing[2] },
  bookmarksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '2.6%',
    rowGap: Spacing[3],
    marginTop: Spacing[1],
  },
  bookmarkCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[2],
    position: 'relative',
  },
  bookmarkCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  bookmarkClickable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 6,
  },
  bookmarkIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIconBoxLight: {
    backgroundColor: '#F3F4F6',
  },
  bookmarkIcon: { width: 20, height: 20, borderRadius: Radius.xs },
  bookmarkName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  deleteBookmarkBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGridCard: {
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  emptyGridCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  emptyGridText: { color: Colors.text.muted, fontSize: 10, textAlign: 'center', lineHeight: 15 },

  // Browser Container
  browserContainer: { flex: 1, backgroundColor: '#000000' },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  browserNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  browserNavBtn: { padding: 4 },
  browserAddressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    marginHorizontal: Spacing[3],
  },
  browserAddressText: { color: '#FFFFFF', fontSize: Typography.size.xs, fontWeight: '600' },
  browserCloseBtn: { padding: 4 },
  
  // Wallet Connection Banner
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B98115',
    borderBottomWidth: 1,
    borderBottomColor: '#10B98130',
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
  },
  walletBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletBannerText: { color: '#10B981', fontSize: 10 },
  disconnectBtn: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  connectBtn: {
    backgroundColor: '#10B98120',
    borderColor: '#10B98140',
  },
  disconnectBtnText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },

  // Simulated Web View
  browserBody: { flex: 1 },
  webPageLayout: { flex: 1, padding: Spacing[5], alignItems: 'center', gap: Spacing[6], paddingTop: 40 },
  webPageTitle: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: '900', textAlign: 'center' },
  webPageCard: {
    width: '100%',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: '#C4D4E810',
    borderRadius: Radius.xl,
    padding: Spacing[5],
    gap: Spacing[4],
  },
  webPageCardLabel: { color: Colors.brand.bright, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  webInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    padding: 14,
  },
  webTokenLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  webTokenVal: { color: '#FFFFFF', fontSize: Typography.size.xs, fontWeight: 'bold' },
  webActionBtn: {
    backgroundColor: Colors.brand.bright,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webActionBtnDisabled: { backgroundColor: '#374151' },
  webActionText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  webPageFooter: { color: Colors.text.muted, fontSize: 9, textAlign: 'center', position: 'absolute', bottom: 20 },

  // Info Sandboxed Guide Card
  infoGuideCard: {
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  infoGuideCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  guideTitle: { fontSize: Typography.size.sm, fontWeight: '800' },
  guideDesc: { color: Colors.text.secondary, fontSize: Typography.size.xs, lineHeight: 18, marginBottom: 4 },
  guideBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  guideBulletText: { color: Colors.text.muted, fontSize: Typography.size.xs, lineHeight: 16, flex: 1 },

  // Minimized Tabs Layers Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  modalContent: { flex: 1, paddingHorizontal: Spacing[5] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  modalHeaderTitle: { color: '#FFFFFF', fontSize: Typography.size.base, fontWeight: '700' },
  modalCloseBtn: { padding: 4 },
  emptyTabsBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  emptyTabsTitle: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: 'bold', marginTop: Spacing[2] },
  emptyTabsSubtitle: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 22 },
  closeModalBtn: {
    backgroundColor: Colors.brand.bright,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    marginTop: Spacing[4],
  },
  closeModalBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  tabsGridScroll: {
    paddingVertical: Spacing[4],
  },
  tabsPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '4%',
    rowGap: Spacing[4],
  },
  tabPreviewCard: {
    width: '48%',
    height: 160,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  tabCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#08080F',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E808',
  },
  tabCardFavicon: {
    width: 12,
    height: 12,
    borderRadius: Radius.xs,
  },
  tabCardDomain: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  tabCardCloseBtn: {
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.xs,
  },
  tabCardBody: {
    flex: 1,
    padding: 6,
    backgroundColor: '#000000',
  },
  mockPreviewLayout: {
    flex: 1,
    borderRadius: Radius.sm,
    padding: 6,
    alignItems: 'center',
    gap: 6,
  },
  mockAddressBar: {
    width: '100%',
    height: 12,
    borderRadius: 3,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  mockAddressText: {
    color: '#FFFFFF',
    fontSize: 5,
    fontFamily: 'monospace',
  },
  mockSwapBox: {
    width: '100%',
    backgroundColor: '#08080F',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.sm,
    padding: 4,
    gap: 3,
    alignItems: 'center',
  },
  mockSwapInput: {
    width: '100%',
    height: 8,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  mockSwapBtn: {
    width: '100%',
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.brand.bright,
  },
  activeTabTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalFooter: {
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#C4D4E810',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  clearAllBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  sandboxNetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sandboxNetworkLogo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  sandboxNetworkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  networkSelectSection: {
    gap: 8,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
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
  networkCircleLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
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
});

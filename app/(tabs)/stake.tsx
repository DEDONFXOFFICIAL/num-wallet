import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const NETWORKS = [
  { id: 'solana', name: 'Solana', token: 'SOL', color: '#14F195', baseApy: '6.8% APY' },
  { id: 'ethereum', name: 'Ethereum', token: 'ETH', color: '#627EEA', baseApy: '4.1% APY' },
  { id: 'bsc', name: 'BNB Chain', token: 'BNB', color: '#F3BA2F', baseApy: '5.4% APY' },
];

const VALIDATORS_BY_NETWORK: Record<string, Array<{ id: string; name: string; apy: string; fee: string; icon: string }>> = {
  solana: [
    { id: 'num', name: 'Num Validator', apy: '6.80% APY', fee: '0% Fee', icon: 'zap' },
    { id: 'jito', name: 'Jito Liquid Pool', apy: '6.72% APY', fee: '0.1% Fee', icon: 'activity' },
    { id: 'marinade', name: 'Marinade Staking', apy: '6.55% APY', fee: '0.3% Fee', icon: 'shield' },
  ],
  ethereum: [
    { id: 'lido', name: 'Lido Finance', apy: '3.95% APY', fee: '10% Reward Fee', icon: 'droplet' },
    { id: 'rocket', name: 'Rocket Pool', apy: '4.10% APY', fee: '15% Node Fee', icon: 'zap' },
    { id: 'coinbase', name: 'Coinbase Staking', apy: '3.65% APY', fee: '25% Fee', icon: 'circle' },
  ],
  bsc: [
    { id: 'bsc-val', name: 'BSC Active Pool', apy: '5.40% APY', fee: '0% Fee', icon: 'activity' },
    { id: 'ankr', name: 'Ankr BNB Staking', apy: '5.25% APY', fee: '2% Fee', icon: 'layers' },
  ],
};

export default function StakeScreen() {
  const { isDarkMode } = useUserStore();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showValidators, setShowValidators] = useState(false);
  
  const validators = VALIDATORS_BY_NETWORK[selectedNetwork.id];
  const [selectedValidator, setSelectedValidator] = useState(validators[0]);

  // Aggregate external staked portfolio items
  const [stakedPositions, setStakedPositions] = useState([
    { id: 'pos-1', chain: 'Solana', amount: '2.50 SOL', pool: 'Num Validator', status: 'Earning Rewards', apy: '6.80% APY' }
  ]);

  const handleNetworkChange = (network: typeof NETWORKS[0]) => {
    setSelectedNetwork(network);
    const networkValidators = VALIDATORS_BY_NETWORK[network.id];
    setSelectedValidator(networkValidators[0]);
    setStakeAmount('');
    setShowValidators(false);
  };

  const handleImportPosition = () => {
    Alert.prompt(
      'Import External Position',
      'Enter your external wallet address or staking contract key to aggregate your cross-chain yield portfolio.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import Positions', 
          onPress: (address: string | undefined) => {
            if (address && address.trim().length > 10) {
              const newPos = {
                id: `pos-${Date.now()}`,
                chain: 'Ethereum',
                amount: '1.25 ETH',
                pool: 'Lido Finance',
                status: 'Aggregated Yield',
                apy: '3.95% APY',
              };
              setStakedPositions(prev => [...prev, newPos]);
              Alert.alert('Import Successful', 'Located 1 active Lido position on-chain. Added securely to your portfolio tracker.');
            } else {
              Alert.alert('Error', 'Please enter a valid contract or public key.');
            }
          }
        }
      ]
    );
  };

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount to stake.');
      return;
    }

    Alert.alert(
      'Staking Successful!',
      `You have staked ${stakeAmount} ${selectedNetwork.token} with ${selectedValidator.name}.\n\nYou are now earning ${selectedValidator.apy}!`,
      [{ 
        text: 'View Portfolio', 
        onPress: () => {
          const newPos = {
            id: `pos-${Date.now()}`,
            chain: selectedNetwork.name,
            amount: `${stakeAmount} ${selectedNetwork.token}`,
            pool: selectedValidator.name,
            status: 'Earning Rewards',
            apy: selectedValidator.apy,
          };
          setStakedPositions(prev => [newPos, ...prev]);
          setStakeAmount('');
        }
      }]
    );
  };

  const estimatedYearlyReward = stakeAmount 
    ? (parseFloat(stakeAmount) * parseFloat(selectedValidator.apy) / 100).toFixed(4)
    : '0.0000';

  // Dynamic light mode styles helper
  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const cardStyle = isDarkMode ? styles.card : [styles.card, styles.cardLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Premium Coming Soon Overlay */}
      <View style={styles.overlayContainer}>
        <LinearGradient
          colors={['rgba(8, 8, 15, 0.94)', 'rgba(15, 15, 30, 0.98)']}
          style={styles.comingSoonOverlay}
        >
          <View style={styles.comingSoonBadgeOverlay}>
            <View style={styles.stakeIconBox}>
              <Feather name="layers" size={32} color={Colors.brand.bright} />
            </View>
            <Text style={styles.comingSoonTitle}>Yield Staking</Text>
            <View style={styles.comingSoonBadgeTag}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>COMING SOON</Text>
            </View>
            <Text style={styles.comingSoonDesc}>
              Ecosystem yield staking, validator liquid pools, and automated compounding accounts are currently in sandbox beta and will unlock in the next mainnet update.
            </Text>
            <TouchableOpacity 
              style={styles.backHomeBtn}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.8}
            >
              <Text style={styles.backHomeText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Header */}
      <View style={[styles.header, borderStyle]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={isDarkMode ? Colors.text.primary : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]}>Yield Staking Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Dynamic Staked Portfolio tracker (Aggregated across any chain / interface) */}
        <View style={cardStyle}>
          <View style={styles.portfolioHeader}>
            <Text style={styles.cardLabel}>Aggregated Yield Portfolio</Text>
            <TouchableOpacity style={styles.importBtn} onPress={handleImportPosition}>
              <Feather name="download-cloud" size={12} color={Colors.brand.bright} />
              <Text style={styles.importBtnText}>Import Staking</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.positionsList}>
            {stakedPositions.map((pos) => (
              <View key={pos.id} style={[styles.positionItem, { backgroundColor: isDarkMode ? '#0F0F1E50' : '#F3F4F650', borderColor: isDarkMode ? '#C4D4E805' : '#E5E7EB' }]}>
                <View style={styles.posRowLeft}>
                  <View style={[styles.dot, { backgroundColor: pos.chain === 'Solana' ? '#14F195' : pos.chain === 'Ethereum' ? '#627EEA' : '#F3BA2F' }]} />
                  <View>
                    <Text style={[styles.posAmount, textStyle]}>{pos.amount}</Text>
                    <Text style={styles.posDetail}>{pos.pool} • {pos.chain}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.posApy}>{pos.apy}</Text>
                  <Text style={styles.posStatus}>{pos.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Dynamic Chain Selector Grid */}
        <Text style={styles.sectionTitle}>Select Ecosystem Network</Text>
        <View style={styles.networksGrid}>
          {NETWORKS.map(net => (
            <TouchableOpacity
              key={net.id}
              style={[
                styles.networkCard,
                !isDarkMode && styles.cardLight,
                selectedNetwork.id === net.id && { borderColor: net.color },
              ]}
              onPress={() => handleNetworkChange(net)}
              activeOpacity={0.8}
            >
              <View style={[styles.networkDot, { backgroundColor: net.color }]} />
              <Text style={[styles.networkName, textStyle]}>{net.name}</Text>
              <Text style={styles.networkApy}>{net.baseApy}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Validator Pool Selector */}
        <View style={cardStyle}>
          <Text style={styles.label}>Select Liquid Pool</Text>
          <TouchableOpacity
            style={[styles.selector, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB' }]}
            onPress={() => setShowValidators(!showValidators)}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View style={[styles.selectorIconBox, { backgroundColor: selectedNetwork.color + '15' }]}>
                <Feather name="zap" size={14} color={selectedNetwork.color} />
              </View>
              <View>
                <Text style={[styles.selectorName, textStyle]}>{selectedValidator.name}</Text>
                <Text style={styles.selectorFee}>{selectedValidator.fee}</Text>
              </View>
            </View>
            <View style={styles.selectorRight}>
              <Text style={styles.selectorApy}>{selectedValidator.apy}</Text>
              <Feather name={showValidators ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.text.muted} />
            </View>
          </TouchableOpacity>

          {showValidators && (
            <View style={[styles.dropdown, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB' }]}>
              {validators.map((val) => (
                <TouchableOpacity
                  key={val.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedValidator(val);
                    setShowValidators(false);
                  }}
                >
                  <View style={styles.selectorLeft}>
                    <View style={[styles.selectorIconBox, { backgroundColor: selectedNetwork.color + '15' }]}>
                      <Feather name="zap" size={14} color={selectedNetwork.color} />
                    </View>
                    <Text style={[styles.dropdownName, textStyle]}>{val.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dropdownApy}>{val.apy}</Text>
                    <Text style={styles.dropdownFee}>{val.fee}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Staking Input Card */}
        <View style={cardStyle}>
          <Text style={styles.label}>Amount to Stake</Text>
          <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? Colors.brand.bright + '30' : '#E5E7EB' }]}>
            <TextInput
              style={[styles.input, textStyle]}
              placeholder="0.0"
              placeholderTextColor={Colors.text.disabled}
              keyboardType="numeric"
              value={stakeAmount}
              onChangeText={setStakeAmount}
            />
            <Text style={styles.tokenLabel}>{selectedNetwork.token}</Text>
          </View>
          <Text style={styles.yearlyRewardsText}>
            Projected Reward: <Text style={{ color: '#14F195', fontWeight: 'bold' }}>{estimatedYearlyReward} {selectedNetwork.token}</Text> yearly
          </Text>
        </View>

        {/* Stake Button */}
        <TouchableOpacity style={styles.stakeBtnWrap} onPress={handleStake} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.brand.deep, Colors.brand.bright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Stake Asset Now</Text>
            <Feather name="trending-up" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  borderDark: { borderBottomColor: '#C4D4E810' },
  borderLight: { borderBottomColor: '#E5E7EB' },
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
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },

  // Card
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: 14,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardLabel: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Portfolio
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.bright + '10',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
  },
  importBtnText: { color: Colors.brand.bright, fontSize: 10, fontWeight: '700' },
  positionsList: { gap: Spacing[3] },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F0F1E50',
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: '#C4D4E805',
  },
  posRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  posAmount: { fontSize: Typography.size.sm, fontWeight: '800' },
  posDetail: { color: Colors.text.muted, fontSize: 10, marginTop: 1 },
  posApy: { color: '#14F195', fontSize: Typography.size.xs, fontWeight: '700' },
  posStatus: { color: Colors.text.muted, fontSize: 9, marginTop: 1 },

  // Chain selection
  sectionTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing[2] },
  networksGrid: { flexDirection: 'row', gap: 10 },
  networkCard: {
    flex: 1,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1.5,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    alignItems: 'center',
    gap: 4,
  },
  networkDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  networkName: { fontSize: Typography.size.xs, fontWeight: '700' },
  networkApy: { color: '#14F195', fontSize: 10, fontWeight: 'bold' },

  // Selector
  label: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  selector: {
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
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  selectorIconBox: { width: 28, height: 28, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  selectorName: { fontSize: Typography.size.xs, fontWeight: '700' },
  selectorFee: { color: Colors.text.muted, fontSize: 9 },
  selectorRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  selectorApy: { color: '#14F195', fontSize: Typography.size.xs, fontWeight: '700' },

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
    borderBottomColor: '#C4D4E806',
  },
  dropdownName: { fontSize: Typography.size.xs, fontWeight: '600' },
  dropdownApy: { color: '#14F195', fontSize: Typography.size.xs, fontWeight: '700' },
  dropdownFee: { color: Colors.text.muted, fontSize: 8, textAlign: 'right' },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginTop: 4,
  },
  input: { fontSize: Typography.size.md, fontWeight: '700', flex: 1 },
  tokenLabel: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: '800' },
  yearlyRewardsText: { color: Colors.text.muted, fontSize: 10, marginTop: 4 },

  stakeBtnWrap: { marginTop: Spacing[4], marginBottom: Spacing[8] },
  btn: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  btnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  comingSoonOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  comingSoonBadgeOverlay: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    width: '100%',
    gap: Spacing[4],
  },
  stakeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.bright + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  comingSoonTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comingSoonBadgeTag: {
    backgroundColor: Colors.brand.bright,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  comingSoonDesc: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing[2],
  },
  backHomeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    marginTop: Spacing[2],
  },
  backHomeText: {
    color: '#000000',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
});

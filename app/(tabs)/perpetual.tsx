import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { router } from 'expo-router';

const MOCK_CANDLES = [
  { time: '12:00', open: 172.5, close: 173.8, high: 174.5, low: 171.8, color: '#14F195' },
  { time: '13:00', open: 173.8, close: 173.2, high: 174.2, low: 172.5, color: '#EC4899' },
  { time: '14:00', open: 173.2, close: 175.1, high: 175.8, low: 173.0, color: '#14F195' },
  { time: '15:00', open: 175.1, close: 174.8, high: 175.5, low: 174.0, color: '#EC4899' },
  { time: '16:00', open: 174.8, close: 176.4, high: 176.8, low: 174.2, color: '#14F195' },
  { time: '17:00', open: 176.4, close: 175.5, high: 176.6, low: 175.0, color: '#EC4899' },
];

export default function PerpetualScreen() {
  const { isDarkMode } = useUserStore();
  const [tradeSize, setTradeSize] = useState('10');
  const [leverage, setLeverage] = useState(10);
  const [isLong, setIsLong] = useState(true);
  const [activePositions, setActivePositions] = useState([
    {
      id: 'pos-1',
      market: 'SOL-PERP',
      isLong: true,
      leverage: 10,
      size: '$100.00',
      entryPrice: '$175.20',
      markPrice: '$175.50',
      pnl: '+$2.50 (+25.0%)',
      color: '#14F195',
    }
  ]);

  const handleOpenPosition = () => {
    const size = parseFloat(tradeSize) || 0;
    if (size <= 0) {
      Alert.alert('Error', 'Please enter a valid trade size.');
      return;
    }

    const calculatedLeveragedSize = (size * leverage).toFixed(2);
    const newPosition = {
      id: `pos-${Date.now()}`,
      market: 'SOL-PERP',
      isLong: isLong,
      leverage: leverage,
      size: `$${calculatedLeveragedSize}`,
      entryPrice: '$175.50',
      markPrice: '$175.50',
      pnl: '+$0.00 (0.00%)',
      color: '#14F195',
    };

    setActivePositions(prev => [newPosition, ...prev]);
    Alert.alert(
      'Order Executed!',
      `Opened ${isLong ? 'Long' : 'Short'} position for SOL-PERP.\nSize: $${calculatedLeveragedSize} (${leverage}x Leverage)`
    );
  };

  const handleClosePosition = (id: string) => {
    setActivePositions(prev => prev.filter(pos => pos.id !== id));
    Alert.alert('Position Closed', 'Your leverage contract has been fully settled.');
  };

  const estimatedLiquidation = isLong 
    ? (175.50 * (1 - 0.9 / leverage)).toFixed(2)
    : (175.50 * (1 + 0.9 / leverage)).toFixed(2);

  // Dynamic light mode styles helper
  const dynamicText = isDarkMode ? Colors.text.primary : '#111827';
  const dynamicSubText = isDarkMode ? Colors.text.secondary : '#4B5563';
  const dynamicBorder = isDarkMode ? '#C4D4E810' : '#E5E7EB';
  const dynamicCard = isDarkMode ? Colors.bg.surface : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      {/* Premium Coming Soon Overlay */}
      <View style={styles.overlayContainer}>
        <LinearGradient
          colors={['rgba(8, 8, 15, 0.94)', 'rgba(15, 15, 30, 0.98)']}
          style={styles.comingSoonOverlay}
        >
          <View style={styles.comingSoonBadgeOverlay}>
            <View style={styles.clockIconBox}>
              <Feather name="clock" size={32} color={Colors.brand.bright} />
            </View>
            <Text style={styles.comingSoonTitle}>Perpetual Trading</Text>
            <View style={styles.comingSoonBadgeTag}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>COMING SOON</Text>
            </View>
            <Text style={styles.comingSoonDesc}>
              Advanced decentralized leverage contracts (up to 100x leverage) are currently in private sandbox testing and will be fully integrated soon.
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
      <View style={[styles.header, !isDarkMode && styles.borderLight]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, !isDarkMode && styles.textLightPrimary]}>SOL-PERP</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>$175.50</Text>
            <Text style={styles.changeText}>+1.85%</Text>
          </View>
        </View>
        <View style={styles.leverageBadge}>
          <Text style={styles.leverageBadgeText}>Max 100x</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Breathtaking Candlestick Chart */}
        <View style={[styles.card, !isDarkMode && styles.cardLight]}>
          <Text style={styles.cardLabel}>SOL Price Candlestick Chart (1H)</Text>
          
          <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB', borderWidth: isDarkMode ? 0 : 1 }]}>
            {/* Grid helper lines */}
            <View style={[styles.chartGridLine, { backgroundColor: isDarkMode ? '#FFFFFF05' : '#00000005' }]} />
            <View style={[styles.chartGridLine, { top: 60, backgroundColor: isDarkMode ? '#FFFFFF05' : '#00000005' }]} />
            <View style={[styles.chartGridLine, { top: 110, backgroundColor: isDarkMode ? '#FFFFFF05' : '#00000005' }]} />

            {/* Candle drawings */}
            <View style={styles.candlesRow}>
              {MOCK_CANDLES.map((c, i) => {
                const height = Math.abs(c.open - c.close) * 20 + 20;
                const top = 100 - (Math.max(c.open, c.close) - 171) * 20;
                const wickTop = 100 - (c.high - 171) * 20;
                const wickHeight = (c.high - c.low) * 20;

                return (
                  <View key={i} style={styles.candleContainer}>
                    {/* Wick */}
                    <View style={[styles.wick, { top: wickTop, height: wickHeight, backgroundColor: c.color }]} />
                    {/* Body */}
                    <View style={[styles.candleBody, { top: top, height: height, backgroundColor: c.color }]} />
                    <Text style={styles.candleTime}>{c.time}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Position Controls (Long/Short) */}
        <View style={[styles.card, !isDarkMode && styles.cardLight]}>
          <Text style={styles.cardLabel}>Trade Execution</Text>
          
          <View style={styles.directionRow}>
            <TouchableOpacity 
              style={[styles.directionBtn, isLong ? styles.longBtnActive : { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]} 
              onPress={() => setIsLong(true)}
            >
              <Text style={[styles.directionBtnText, isLong && styles.textWhite, !isLong && !isDarkMode && { color: '#4B5563' }]}>Long (Buy)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.directionBtn, !isLong ? styles.shortBtnActive : { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]} 
              onPress={() => setIsLong(false)}
            >
              <Text style={[styles.directionBtnText, !isLong && styles.textWhite, isLong && !isDarkMode && { color: '#4B5563' }]}>Short (Sell)</Text>
            </TouchableOpacity>
          </View>

          {/* Size inputs */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Collateral (Margin USD)</Text>
            <View style={[styles.inputBox, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB' }]}>
              <TextInput
                style={[styles.textInput, !isDarkMode && styles.textLightPrimary]}
                keyboardType="numeric"
                value={tradeSize}
                onChangeText={setTradeSize}
                placeholder="10"
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.tokenLabel}>USDC</Text>
            </View>
          </View>

          {/* Leverage Selector custom layout */}
          <View style={styles.leverageSection}>
            <View style={styles.leverageHeader}>
              <Text style={styles.inputLabel}>Leverage Selector</Text>
              <Text style={styles.leverageDisplay}>{leverage}x</Text>
            </View>

            <View style={styles.leverageSelectRow}>
              {[2, 5, 10, 25, 50, 100].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.leverageValBtn, leverage === val ? styles.leverageValBtnActive : { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}
                  onPress={() => setLeverage(val)}
                >
                  <Text style={[styles.leverageValText, leverage === val && styles.textWhite, leverage !== val && !isDarkMode && { color: '#4B5563' }]}>{val}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Liquidation estimate */}
          <View style={[styles.liqCard, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
            <View style={styles.liqRow}>
              <Text style={styles.liqLabel}>Estimated Liquidation Price</Text>
              <Text style={[styles.liqValue, { color: isDarkMode ? Colors.text.secondary : '#4B5563' }]}>${estimatedLiquidation} SOL</Text>
            </View>
            <View style={styles.liqRow}>
              <Text style={styles.liqLabel}>Total Leveraged Size</Text>
              <Text style={[styles.liqValue, { color: isDarkMode ? Colors.text.secondary : '#4B5563' }]}>${((parseFloat(tradeSize) || 0) * leverage).toFixed(2)} USD</Text>
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity onPress={handleOpenPosition} activeOpacity={0.85}>
            <LinearGradient
              colors={isLong ? ['#14F195', '#0F9E69'] : ['#EC4899', '#B81D6C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.openBtn}
            >
              <Text style={styles.openBtnText}>
                {isLong ? 'Open Leveraged Long' : 'Open Leveraged Short'}
              </Text>
              <Feather name="activity" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Staked Active Positions */}
        <Text style={styles.sectionTitle}>Active Leveraged Positions ({activePositions.length})</Text>
        
        {activePositions.length === 0 ? (
          <View style={[styles.emptyCard, !isDarkMode && styles.cardLight]}>
            <Feather name="folder" size={32} color={Colors.border.DEFAULT} />
            <Text style={[styles.emptyTitle, !isDarkMode && styles.textLightPrimary]}>No active contracts</Text>
            <Text style={styles.emptySub}>Set leverage and click open long/short to execute trades.</Text>
          </View>
        ) : (
          <View style={styles.positionsList}>
            {activePositions.map(pos => (
              <View key={pos.id} style={[styles.positionCard, !isDarkMode && styles.cardLight]}>
                <View style={styles.posHeader}>
                  <View style={styles.posLeft}>
                    <View style={[styles.posBadge, { backgroundColor: pos.isLong ? '#14F19515' : '#EC489915' }]}>
                      <Text style={[styles.posBadgeText, { color: pos.isLong ? '#14F195' : '#EC4899' }]}>
                        {pos.market} {pos.leverage}x
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleClosePosition(pos.id)} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#FFFFFF05' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E812' : '#E5E7EB' }]}>
                    <Text style={styles.closeBtnText}>Market Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.posMetrics}>
                  <View style={styles.posMetricItem}>
                    <Text style={styles.metricLabel}>Contract Size</Text>
                    <Text style={[styles.metricValue, !isDarkMode && styles.textLightPrimary]}>{pos.size}</Text>
                  </View>
                  <View style={styles.posMetricItem}>
                    <Text style={styles.metricLabel}>Entry Price</Text>
                    <Text style={[styles.metricValue, !isDarkMode && styles.textLightPrimary]}>{pos.entryPrice}</Text>
                  </View>
                  <View style={styles.posMetricItem}>
                    <Text style={styles.metricLabel}>Net PnL (Yield)</Text>
                    <Text style={[styles.metricValue, { color: pos.isLong ? '#14F195' : '#EC4899', fontWeight: 'bold' }]}>{pos.pnl}</Text>
                  </View>
                </View>
              </View>
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  borderLight: { borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  headerTitle: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  textLightPrimary: { color: '#111827' },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: '700' },
  changeText: { color: '#14F195', fontSize: 10, fontWeight: '700' },
  leverageBadge: {
    backgroundColor: Colors.brand.bright + '15',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  leverageBadgeText: { color: Colors.brand.bright, fontSize: 10, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  
  // Card
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardLabel: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Candlestick Chart View
  chartContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#0F0F1E',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[2],
    paddingTop: Spacing[4],
    overflow: 'hidden',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 1,
    backgroundColor: '#FFFFFF05',
  },
  candlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingHorizontal: Spacing[1],
  },
  candleContainer: {
    width: '13%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  wick: {
    position: 'absolute',
    width: 1.5,
    borderRadius: Radius.full,
  },
  candleBody: {
    position: 'absolute',
    width: 14,
    borderRadius: 2,
  },
  candleTime: {
    position: 'absolute',
    bottom: -22,
    color: Colors.text.muted,
    fontSize: 9,
    fontFamily: 'monospace',
  },

  // Trade inputs
  directionRow: { flexDirection: 'row', gap: Spacing[3] },
  directionBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#C4D4E810',
  },
  longBtnActive: { backgroundColor: '#14F19515', borderColor: '#14F195' },
  shortBtnActive: { backgroundColor: '#EC489915', borderColor: '#EC4899' },
  directionBtnText: { color: Colors.text.secondary, fontSize: Typography.size.sm, fontWeight: 'bold' },
  textWhite: { color: '#FFFFFF' },
  inputWrap: { gap: 6 },
  inputLabel: { color: Colors.text.muted, fontSize: 10, fontWeight: '600' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  textInput: { color: '#FFFFFF', fontSize: Typography.size.md, fontWeight: '700', flex: 1 },
  tokenLabel: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: '800' },

  // Leverage Selector styles
  leverageSection: { gap: Spacing[2] },
  leverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leverageDisplay: { color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: '800' },
  leverageSelectRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  leverageValBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  leverageValBtnActive: { backgroundColor: Colors.brand.bright, borderColor: Colors.brand.bright },
  leverageValText: { color: Colors.text.muted, fontSize: 10, fontWeight: 'bold' },

  // Liquidation estimates
  liqCard: {
    backgroundColor: '#0F0F1E',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  liqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liqLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  liqValue: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: '700' },

  openBtn: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  openBtnText: { color: '#FFFFFF', fontSize: Typography.size.md, fontWeight: '800' },

  // Position cards
  sectionTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing[2] },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    paddingVertical: 40,
    gap: Spacing[2],
  },
  emptyTitle: { color: Colors.text.secondary, fontSize: Typography.size.base, fontWeight: 'bold' },
  emptySub: { color: Colors.text.muted, fontSize: 10, textAlign: 'center' },
  positionsList: { gap: Spacing[3] },
  positionCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  posLeft: { flexDirection: 'row', alignItems: 'center' },
  posBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  posBadgeText: { fontSize: 10, fontWeight: 'bold' },
  closeBtn: {
    backgroundColor: '#FFFFFF05',
    borderWidth: 1,
    borderColor: '#C4D4E812',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closeBtnText: { color: Colors.text.muted, fontSize: 9, fontWeight: 'bold' },
  posMetrics: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[2] },
  posMetricItem: { gap: 2 },
  metricLabel: { color: Colors.text.muted, fontSize: 9 },
  metricValue: { color: Colors.text.primary, fontSize: Typography.size.xs, fontWeight: '700' },
  
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
  clockIconBox: {
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

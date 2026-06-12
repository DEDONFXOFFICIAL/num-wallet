import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

export default function HistoryScreen() {
  const { isDarkMode, transactionHistory, clearTransactionHistory } = useUserStore();

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const headerStyle = isDarkMode ? styles.header : [styles.header, styles.headerLight];
  const backBtnStyle = isDarkMode ? styles.backBtn : [styles.backBtn, styles.backBtnLight];
  const headerTitleStyle = isDarkMode ? styles.title : [styles.title, styles.textLightPrimary];
  const arrowColor = isDarkMode ? Colors.text.primary : '#111827';
  const filterChipStyle = isDarkMode ? styles.filterChip : [styles.filterChip, styles.filterChipLight];
  const filterTextStyle = isDarkMode ? styles.filterText : [styles.filterText, styles.textLightSecondary];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Transaction History',
      'Are you sure you want to permanently clear all transaction logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearTransactionHistory() }
      ]
    );
  };

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={headerStyle}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
            <Feather name="arrow-left" size={20} color={arrowColor} />
          </TouchableOpacity>
          <Text style={headerTitleStyle}>Transaction History</Text>
          {transactionHistory.length > 0 ? (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearAllBtn}>
              <Feather name="trash-2" size={18} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <View style={styles.filterRow}>
          {['Chain', 'Type', 'Date'].map((f) => (
            <View key={f} style={filterChipStyle}>
              <Text style={filterTextStyle}>{f}</Text>
              <Feather name="chevron-down" size={12} color={Colors.text.muted} />
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
        {transactionHistory.length === 0 ? (
          <View style={styles.body}>
            <Feather name="clock" size={48} color={isDarkMode ? Colors.border.DEFAULT : '#94A3B8'} style={{ marginBottom: 12 }} />
            <Text style={[styles.placeholder, !isDarkMode && styles.textLightSecondary]}>No transactions yet</Text>
            <Text style={styles.sub}>All your sends, swaps, bridges and P2P activity will appear here</Text>
          </View>
        ) : (
          transactionHistory.map((item) => {
            const isSuccess = item.status === 'Success';
            const statusColor = isSuccess ? '#10B981' : '#EF4444';
            const txCardBg = isDarkMode ? '#0F0F24' : '#FFFFFF';
            const txCardBorder = isDarkMode ? '#C4D4E810' : '#E5E7EB';

            // Resolve Type specific icons
            let iconName: 'refresh-cw' | 'git-merge' | 'arrow-up-right' | 'arrow-down-left' | 'shopping-bag' | 'link' | 'slash' | 'shield' = 'refresh-cw';
            if (item.type.toLowerCase().includes('send')) iconName = 'arrow-up-right';
            else if (item.type.toLowerCase().includes('receive')) iconName = 'arrow-down-left';
            else if (item.type.toLowerCase().includes('bridge')) iconName = 'git-merge';
            else if (item.type.toLowerCase().includes('buy') || item.type.toLowerCase().includes('sell')) iconName = 'shopping-bag';
            else if (item.type.toLowerCase().includes('connect')) iconName = 'link';
            else if (item.type.toLowerCase().includes('disconnect')) iconName = 'slash';
            else if (item.type.toLowerCase().includes('revoke')) iconName = 'shield';

            return (
              <View
                key={item.id}
                style={[
                  styles.txCard,
                  { backgroundColor: txCardBg, borderColor: txCardBorder }
                ]}
              >
                <View style={styles.txHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.txIconContainer, { backgroundColor: isDarkMode ? '#1E1E3C' : '#F3F4F6' }]}>
                      <Feather name={iconName as any} size={16} color={Colors.brand.bright} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txTypeTitle, textStyle]}>{item.type}</Text>
                      <Text style={styles.txDateText}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    {item.type.toLowerCase().includes('connect') || item.type.toLowerCase().includes('disconnect') ? (
                      <Text style={[styles.txAmountText, { color: Colors.brand.bright }]}>
                        {item.type.toLowerCase().includes('connect') ? 'Connected' : 'Disconnected'}
                      </Text>
                    ) : item.type.toLowerCase().includes('revoke') ? (
                      <Text style={[styles.txAmountText, { color: '#EF4444' }]}>
                        Revoked
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.txAmountText, { color: isSuccess ? '#10B981' : '#EF4444' }]}>
                          {item.type.toLowerCase().includes('receive') ? '+' : '-'}{item.fromAmount} {item.fromSymbol}
                        </Text>
                        {item.toAmount && item.toAmount !== '0.00' && item.toSymbol !== item.fromSymbol && (
                          <Text style={styles.txSubAmountText}>
                            ➔ {item.toAmount} {item.toSymbol}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E1E38' : '#E5E7EB' }]} />

                <View style={styles.txDetailsRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="link-sharp" size={12} color="#64748B" />
                    <Text style={styles.txChainLabel}>{item.chain}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                    <Text style={[styles.txStatusText, { color: statusColor }]}>{item.status}</Text>
                  </View>
                </View>

                {item.txHash ? (
                  <View style={styles.hashRow}>
                    <Text numberOfLines={1} style={styles.hashText}>Hash: {item.txHash}</Text>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Transaction Hash', `Copied Hash:\n${item.txHash}`)}
                      style={styles.copyHashBtn}
                    >
                      <Feather name="copy" size={11} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], paddingBottom: Spacing[4], gap: Spacing[3] },
  headerLight: { borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
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
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  title: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  clearAllBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: Spacing[2] },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border.DEFAULT, borderRadius: 20, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  filterChipLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  filterText: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  textWhite: { color: '#FFFFFF' },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 40,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: Spacing[3],
    paddingHorizontal: Spacing[8]
  },
  placeholder: { color: Colors.text.secondary, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  sub: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },

  // Transaction Cards styles
  txCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txIconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDateText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  txSubAmountText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  txDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txChainLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00000015',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.xs,
  },
  hashText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: '#64748B',
    flex: 1,
  },
  copyHashBtn: {
    padding: 2,
    marginLeft: 6,
  },
});

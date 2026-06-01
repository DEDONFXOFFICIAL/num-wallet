import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

export default function HistoryScreen() {
  const { isDarkMode } = useUserStore();

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const headerStyle = isDarkMode ? styles.header : [styles.header, styles.headerLight];
  const backBtnStyle = isDarkMode ? styles.backBtn : [styles.backBtn, styles.backBtnLight];
  const headerTitleStyle = isDarkMode ? styles.title : [styles.title, styles.textLightPrimary];
  const arrowColor = isDarkMode ? Colors.text.primary : '#111827';
  const filterChipStyle = isDarkMode ? styles.filterChip : [styles.filterChip, styles.filterChipLight];
  const filterTextStyle = isDarkMode ? styles.filterText : [styles.filterText, styles.textLightSecondary];

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={headerStyle}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
            <Feather name="arrow-left" size={20} color={arrowColor} />
          </TouchableOpacity>
          <Text style={headerTitleStyle}>Transaction History</Text>
          <View style={{ width: 40 }} />
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
      <View style={styles.body}>
        <Feather name="clock" size={48} color={isDarkMode ? Colors.border.DEFAULT : '#94A3B8'} />
        <Text style={[styles.placeholder, !isDarkMode && styles.textLightSecondary]}>No transactions yet</Text>
        <Text style={styles.sub}>All your sends, swaps, bridges and P2P activity will appear here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], paddingBottom: Spacing[4], gap: Spacing[3] },
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
  title: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  filterRow: { flexDirection: 'row', gap: Spacing[2] },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border.DEFAULT, borderRadius: 20, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  filterText: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3], paddingHorizontal: Spacing[8] },
  placeholder: { color: Colors.text.secondary, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  sub: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
  containerLight: { backgroundColor: '#F3F4F6' },
  headerLight: { borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  filterChipLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
});

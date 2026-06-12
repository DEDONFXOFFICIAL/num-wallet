import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const MOCK_NOTIFICATIONS: MOCK_NOTIFICATIONS_T[] = [];
interface MOCK_NOTIFICATIONS_T {
  id: string;
  title: string;
  desc: string;
  time: string;
  icon: any;
  color: string;
  unread: boolean;
}

export default function NotificationsScreen() {
  const { isDarkMode } = useUserStore();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const headerStyle = isDarkMode ? styles.header : [styles.header, styles.headerLight];
  const backBtnStyle = isDarkMode ? styles.backBtn : [styles.backBtn, styles.backBtnLight];
  const headerTitleStyle = isDarkMode ? styles.headerTitle : [styles.headerTitle, styles.textLightPrimary];
  const arrowColor = isDarkMode ? Colors.text.primary : '#111827';
  const emptyIconColor = isDarkMode ? Colors.border.DEFAULT : '#94A3B8';

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={arrowColor} />
        </TouchableOpacity>
        <Text style={headerTitleStyle}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="bell-off" size={48} color={emptyIconColor} />
          <Text style={[styles.emptyTitle, !isDarkMode && styles.textLightSecondary]}>All caught up!</Text>
          <Text style={styles.emptySub}>No new notifications or alerts at this time.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {notifications.map((notif) => (
              <View
                key={notif.id}
                style={[
                  isDarkMode ? styles.itemCard : [styles.itemCard, styles.cardLight],
                  notif.unread && (isDarkMode ? styles.itemCardUnread : [styles.itemCardUnread, { borderColor: Colors.brand.bright + '50' }])
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: notif.color + '15', borderColor: notif.color + '30' }]}>
                  <Feather name={notif.icon} size={16} color={notif.color} />
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={[styles.itemTitle, !isDarkMode && styles.textLightPrimary]}>{notif.title}</Text>
                    {notif.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.itemDesc, !isDarkMode && styles.textLightSecondary]}>{notif.desc}</Text>
                  <Text style={styles.itemTime}>{notif.time}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Feather name="trash-2" size={14} color={Colors.text.muted} />
            <Text style={styles.clearText}>Clear All History</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
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
  headerTitle: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  markReadText: { color: Colors.brand.bright, fontSize: Typography.size.xs, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  list: { gap: Spacing[3] },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: 14,
  },
  itemCardUnread: {
    borderColor: Colors.brand.bright + '30',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  itemDetails: { flex: 1, gap: 4 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: '700' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brand.bright },
  itemDesc: { color: Colors.text.secondary, fontSize: 11, lineHeight: 15 },
  itemTime: { color: Colors.text.muted, fontSize: 10, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing[3],
    marginTop: Spacing[4],
  },
  clearText: { color: Colors.text.muted, fontSize: Typography.size.xs, fontWeight: '600' },
  
  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3], paddingHorizontal: Spacing[8] },
  emptyTitle: { color: Colors.text.secondary, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  emptySub: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
  containerLight: { backgroundColor: '#F3F4F6' },
  headerLight: { borderBottomColor: '#E5E7EB' },
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
});

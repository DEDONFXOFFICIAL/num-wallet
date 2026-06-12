import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function AiScreen() {
  const { isDarkMode } = useUserStore();

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Premium Coming Soon Overlay */}
      <View style={styles.overlayContainer}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(8, 8, 15, 0.94)', 'rgba(15, 15, 30, 0.98)'] : ['rgba(243, 244, 246, 0.94)', 'rgba(255, 255, 255, 0.98)']}
          style={styles.comingSoonOverlay}
        >
          <View style={[styles.comingSoonBadgeOverlay, !isDarkMode && styles.comingSoonBadgeOverlayLight]}>
            <View style={styles.aiIconBox}>
              <Feather name="cpu" size={32} color={Colors.brand.bright} />
            </View>
            <Text style={[styles.comingSoonTitle, !isDarkMode && styles.textLightPrimary]}>AI Assistant</Text>
            <View style={styles.comingSoonBadgeTag}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>COMING SOON</Text>
            </View>
            <Text style={[styles.comingSoonDesc, !isDarkMode && styles.textLightMuted]}>
              Automated smart portfolio analysis, conversational transaction building, and intelligent market predictions powered by on-chain models are currently in beta and will unlock in the next mainnet update.
            </Text>
            <TouchableOpacity 
              style={[styles.backHomeBtn, !isDarkMode && styles.backHomeBtnLight]}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.8}
            >
              <Text style={[styles.backHomeText, !isDarkMode && styles.textLightPrimary]}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
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
  comingSoonBadgeOverlayLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  aiIconBox: {
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
  backHomeBtnLight: {
    backgroundColor: '#3A8AFF',
    borderColor: '#3A8AFF',
  },
  backHomeText: {
    color: '#111827',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  textLightPrimary: { color: '#111827' },
  textLightMuted: { color: '#6B7280' },
});

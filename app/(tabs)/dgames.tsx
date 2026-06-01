import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { router } from 'expo-router';

export default function DgamesScreen() {
  const { isDarkMode } = useUserStore();

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      {/* Premium Coming Soon Overlay */}
      <View style={styles.overlayContainer}>
        <LinearGradient
          colors={['rgba(8, 8, 15, 0.94)', 'rgba(15, 15, 30, 0.98)']}
          style={styles.comingSoonOverlay}
        >
          <View style={styles.comingSoonBadgeOverlay}>
            <View style={styles.gameIconBox}>
              <Ionicons name="game-controller-outline" size={32} color={Colors.brand.bright} />
            </View>
            <Text style={styles.comingSoonTitle}>Dgames</Text>
            <View style={styles.comingSoonBadgeTag}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>COMING SOON</Text>
            </View>
            <Text style={styles.comingSoonDesc}>
              Decentralized Games (Dgames) hub is currently in alpha testing. Connect your wallet to secure, on-chain play-to-earn dApps in our upcoming release!
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
  gameIconBox: {
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

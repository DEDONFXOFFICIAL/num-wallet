import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { router } from 'expo-router';
import { supabase } from '../../store/supabaseClient';

export default function DgamesScreen() {
  const { isDarkMode } = useUserStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from('curated_items')
          .select('*')
          .eq('category', 'dgames')
          .order('id', { ascending: false });
        
        if (!error && data) {
          setItems(data);
        }
      } catch (e) {
        console.warn('Failed to load curated games:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();

    // Setup real-time listener for curated games database changes
    const channel = supabase
      .channel('realtime_dgames')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'curated_items',
        filter: 'category=eq.dgames'
      }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, borderStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
          <Ionicons name="game-controller" size={20} color={Colors.brand.bright} />
          <Text style={[styles.headerTitle, isDarkMode ? styles.textWhite : styles.textLightPrimary]}>Decentralized Games Portal</Text>
        </View>
        <TouchableOpacity
          style={[styles.backBtn, !isDarkMode && styles.backBtnLight]}
          onPress={() => router.push('/(tabs)/home')}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Curated Games List */}
        <View style={styles.lobbyWrapper}>
          <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary]}>
            Curated Games Lobby
          </Text>

          {loading ? (
            <View style={[styles.curatorCard, !isDarkMode && styles.curatorCardLight]}>
              <ActivityIndicator size="small" color={Colors.brand.bright} />
              <Text style={[styles.curatorTitle, isDarkMode ? styles.textWhite : styles.textLightPrimary]}>Loading Games...</Text>
            </View>
          ) : items.length === 0 ? (
            /* Curator Empty State */
            <View style={[styles.curatorCard, !isDarkMode && styles.curatorCardLight]}>
              <View style={styles.gameIconBox}>
                <Ionicons name="game-controller-outline" size={32} color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
              </View>
              <Text style={[styles.curatorTitle, isDarkMode ? styles.textWhite : styles.textLightPrimary]}>No Games Listed</Text>
              <Text style={[styles.curatorDesc, isDarkMode ? styles.textMuted : styles.textLightMuted]}>
                Curated Games Lobby
              </Text>
            </View>
          ) : (
            /* Curated Games List */
            <View style={styles.listContainer}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, !isDarkMode && styles.itemCardLight]}
                  onPress={() => router.push({ pathname: '/(tabs)/hub', params: { url: item.url } })}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.icon_url }}
                    style={styles.itemLogo}
                    defaultSource={require('../../logo/icon.png')} // Fallback image asset
                  />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, isDarkMode ? styles.textWhite : styles.textLightPrimary]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemDesc, isDarkMode ? styles.textMuted : styles.textLightMuted]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  backBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4] },
  lobbyWrapper: { gap: Spacing[4] },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  curatorCard: {
    paddingVertical: 40,
    paddingHorizontal: Spacing[6],
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  curatorCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  gameIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  curatorTitle: { fontSize: Typography.size.base, fontWeight: 'bold' },
  curatorDesc: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  textMuted: { color: Colors.text.muted },
  textLightMuted: { color: '#9CA3AF' },
  
  // Custom interactive item cards
  listContainer: {
    gap: Spacing[3],
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    gap: Spacing[3],
  },
  itemCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  itemLogo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: Typography.size.base,
    fontWeight: 'bold',
  },
  itemDesc: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
});


import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { Platform, View, StyleSheet } from 'react-native';
import { useUserStore } from '../../store/userStore';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface TabIconProps {
  name: FeatherIconName;
  color: any;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  const { isDarkMode } = useUserStore();
  return (
    <View style={[
      styles.iconWrapper,
      focused && { backgroundColor: isDarkMode ? Colors.brand.bright + '15' : '#3A8AFF12' }
    ]}>
      <Feather name={name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { isDarkMode, showHub, showPerps } = useUserStore();
  const activeColor = Colors.brand.bright; // Unified electric blue logo color!
  const inactiveColor = isDarkMode ? Colors.text.muted : '#94A3B8';
  const tabBg = isDarkMode ? '#08080F' : '#FFFFFF';
  const borderCol = isDarkMode ? '#1A1A30' : '#E5E7EB';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: tabBg,
            borderTopColor: borderCol,
          }
        ],
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Hub',
          href: showHub ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="convert"
        options={{
          title: 'Convert',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="repeat" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perpetual"
        options={{
          title: 'Perps',
          href: showPerps ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trending-up" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dgames"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stake"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="nfts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meme"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
});

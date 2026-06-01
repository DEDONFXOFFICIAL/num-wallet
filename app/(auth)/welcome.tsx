import { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, FlatList, ViewToken, Image, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    useLogo: true,
    title: 'NUM WALLET',
    subtitle: 'Your phone number becomes your permanent crypto wallet address.',
    accent: Colors.brand.bright,
  },
  {
    id: '2',
    icon: 'shield' as const,
    iconColor: '#10B981',
    iconBg: '#10B98118',
    title: 'You own your keys.',
    subtitle: 'MPC-secured. Your assets live on-chain — we can never touch them. Only you control your wallet.',
    accent: '#10B981',
  },
  {
    id: '3',
    icon: 'zap' as const,
    iconColor: '#F59E0B',
    iconBg: '#F59E0B18',
    title: 'Send in seconds.',
    subtitle: 'Type a phone number, pick an amount, confirm with your PIN. That\'s it. Web3 made simple.',
    accent: '#F59E0B',
  },
];

function FallingItem({ type, itemValue, delay }: { type: 'text' | 'icon'; itemValue: string; delay: number }) {
  const fallAnim = useRef(new Animated.Value(-100)).current;
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const leftPos = useRef(Math.random() * (Math.min(screenWidth, 380) - 80) + 10).current;
  const scale = useRef(Math.random() * 0.4 + 0.6).current;
  const opacity = useRef(
    type === 'text' 
      ? Math.random() * 0.08 + 0.16 // 16% to 24% opacity for country codes (faded watermark look)
      : Math.random() * 0.08 + 0.12 // 12% to 20% opacity for key and clock icon sketches
  ).current;
  const rotation = useRef(`${Math.random() * 90 - 45}deg`).current; // light rotation
  const duration = useRef(Math.random() * 6000 + 12000).current; // extremely soft, slow speed (12s to 18s)

  useEffect(() => {
    let isMounted = true;

    const runFall = (startDelay: number) => {
      if (!isMounted) return;

      fallAnim.setValue(-100);

      Animated.sequence([
        Animated.delay(startDelay),
        Animated.timing(fallAnim, {
          toValue: screenHeight + 50,
          duration: duration,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        if (isMounted) {
          runFall(0); // Loop infinitely, resetting immediately without delay
        }
      });
    };

    runFall(delay);

    return () => {
      isMounted = false;
      fallAnim.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.fallingItem,
        {
          left: leftPos,
          opacity: opacity,
          transform: [
            { translateY: fallAnim },
            { scale: scale },
            { rotate: rotation },
          ],
        },
      ]}
    >
      {type === 'text' ? (
        <Text style={styles.fallingText}>{itemValue}</Text>
      ) : (
        <Feather name={itemValue as any} size={36} color="#C4D4E8" />
      )}
    </Animated.View>
  );
}

function FallingBackground({ type, items }: { type: 'text' | 'icon'; items: string[] }) {
  const count = 9; // moderated density so it is not noisy or cluttered
  return (
    <View style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <FallingItem
          key={i}
          type={type}
          itemValue={items[i % items.length]}
          delay={i * 1800} // beautifully staggered delay
        />
      ))}
    </View>
  );
}

function Slide({ item, width }: { item: typeof SLIDES[0]; width: number }) {
  let bgType: 'text' | 'icon' = 'text';
  let bgItems: string[] = [];

  if (item.id === '1') {
    bgType = 'text';
    bgItems = ['+234', '+1', '+233', '+254', '+27', '+44', '+91', '+55', '+61', '+229', '+228', '+231'];
  } else if (item.id === '2') {
    bgType = 'icon';
    bgItems = ['key'];
  } else if (item.id === '3') {
    bgType = 'icon';
    bgItems = ['clock'];
  }

  return (
    <View style={[styles.slide, { width, height: Platform.OS === 'web' ? '100%' : undefined }]}>
      {/* Soft falling sketches background */}
      <FallingBackground type={bgType} items={bgItems} />

      {/* Icon card */}
      {item.useLogo ? (
        <View style={[styles.iconCard, { backgroundColor: Colors.bg.base, borderColor: '#C4D4E820', zIndex: 10 }]}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={[styles.iconCard, { backgroundColor: Colors.bg.elevated, borderColor: `${item.iconColor}30`, zIndex: 10 }]}>
          <Feather name={item.icon!} size={48} color={item.iconColor!} />
        </View>
      )}

      {/* Text */}
      <Text
        style={[styles.slideTitle, { color: Colors.text.primary, zIndex: 10 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.title}
      </Text>
      <Text style={[styles.slideSubtitle, { zIndex: 10 }]}>{item.subtitle}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
  const flatRef = useRef<FlatList>(null);

  const getItemLayout = (_: any, index: number) => ({
    length: containerWidth,
    offset: containerWidth * index,
    index,
  });

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      flatRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    } else {
      router.push('/(auth)/phone');
    }
  };

  const handleSkip = () => router.push('/(auth)/phone');

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View 
      style={styles.container}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0) {
          setContainerWidth(width);
        }
      }}
    >
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <Slide item={item} width={containerWidth} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.slider}
        contentContainerStyle={{ flexGrow: 1, height: Platform.OS === 'web' ? '100%' : undefined }}
        getItemLayout={getItemLayout}
      />

      {/* Bottom area */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.brand.deep, Colors.brand.bright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, { width: containerWidth - Spacing[10] }]}
          >
            <Text style={styles.ctaBtnText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Feather
              name={isLast ? 'arrow-right' : 'arrow-right'}
              size={18}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity style={styles.loginLink} onPress={() => router.push({ pathname: '/(auth)/phone', params: { mode: 'login' } })}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  skip: {
    position: 'absolute',
    top: 60,
    right: Spacing[5],
    zIndex: 10,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  slider: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[6],
  },
  iconCard: {
    width: 120,
    height: 120,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: Radius['2xl'] - 2,
  },
  slideTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: Typography.weight.regular,
  },
  bottom: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 48,
    gap: Spacing[5],
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border.strong,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.brand.bright,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    width: width - Spacing[10],
    height: 56,
    borderRadius: Radius.xl,
  },
  ctaBtnText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  loginLink: {
    paddingVertical: Spacing[2],
  },
  loginLinkText: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
  },
  loginLinkBold: {
    color: Colors.brand.bright,
    fontWeight: Typography.weight.semibold,
  },

  // Falling background items
  fallingItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  fallingText: {
    color: '#C4D4E8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

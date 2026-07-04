import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/GradientButton';
import { useColors } from '@/hooks/useColors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'flame' as const,
    color: '#FF416C',
    title: 'Welcome to Embr',
    subtitle: 'The social platform that keeps your connections alive and burning.',
  },
  {
    icon: 'images' as const,
    color: '#F7941D',
    title: 'Share Your World',
    subtitle: 'Post photos, videos, and stories. Add music, locations, and feelings to every moment.',
  },
  {
    icon: 'people' as const,
    color: '#4A90E2',
    title: 'Grow Your Community',
    subtitle: 'Follow creators, discover trending content, and connect with people who share your interests.',
  },
  {
    icon: 'chatbubbles' as const,
    color: '#22C55E',
    title: 'Real-Time Messaging',
    subtitle: 'Stay connected with private chats, voice notes, reactions, and read receipts.',
  },
  {
    icon: 'shield-checkmark' as const,
    color: '#9B59B6',
    title: 'Your Privacy Matters',
    subtitle: 'Control who sees your content. Private accounts, blocked users, and full security settings.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(i => i + 1);
    } else {
      router.push('/(auth)/signup');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip */}
      <TouchableOpacity
        style={[styles.skip, { top: topPad + 12 }]}
        onPress={() => router.push('/(auth)/signup')}
      >
        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, paddingTop: topPad + 60 }]}>
            <LinearGradient
              colors={[item.color + '20', item.color + '05']}
              style={styles.iconBg}
            >
              <Ionicons name={item.icon} size={60} color={item.color} />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? { backgroundColor: colors.primary, width: 24 }
                : { backgroundColor: colors.border },
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: bottomPad + 24 }]}>
        <GradientButton
          label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
        />
        {activeIndex === SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: 12 }}>
            <Text style={[styles.loginLink, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 20 },
  iconBg: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, transition: 'width 0.3s' } as any,
  actions: { paddingHorizontal: 32 },
  loginLink: { textAlign: 'center', fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

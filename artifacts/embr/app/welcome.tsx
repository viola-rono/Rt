import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '@/components/GradientButton';
import { useColors } from '@/hooks/useColors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[styles.container, { paddingTop: topPad }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={[styles.decorCircle, { top: -60, left: -60, width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.08)' }]} />
      <View style={[styles.decorCircle, { bottom: height * 0.2, right: -80, width: 250, height: 250, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
      <View style={[styles.decorCircle, { top: height * 0.15, right: -40, width: 140, height: 140, backgroundColor: 'rgba(255,255,255,0.05)' }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoBg}>
            <Ionicons name="flame" size={52} color="#fff" />
          </View>
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>Embr</Text>
        <Text style={styles.tagline}>Fluttur</Text>
        <Text style={styles.subtitle}>Connect. Share. Ignite.</Text>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { icon: 'images-outline' as const, text: 'Share photos & videos' },
            { icon: 'people-outline' as const, text: 'Grow your community' },
            { icon: 'chatbubbles-outline' as const, text: 'Real-time messaging' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={18} color="#fff" />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom actions */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/onboarding');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.getStartedInner}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decorCircle: { position: 'absolute', borderRadius: 999 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap: { marginBottom: 24 },
  logoBg: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: { fontSize: 52, fontWeight: '800', color: '#fff', fontFamily: 'Poppins_700Bold', letterSpacing: -1 },
  tagline: { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular', marginTop: -8, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins_400Regular', marginBottom: 40, letterSpacing: 2 },
  features: { gap: 16, alignSelf: 'stretch' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 15, color: '#fff', fontFamily: 'Poppins_500Medium' },
  actions: { paddingHorizontal: 32, gap: 16 },
  getStartedBtn: { backgroundColor: '#fff', borderRadius: 30, overflow: 'hidden' },
  getStartedInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  getStartedText: { fontSize: 17, fontWeight: '700', color: '#FF416C', fontFamily: 'Poppins_700Bold' },
  loginLink: { textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  loginLinkBold: { fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { GradientButton } from '@/components/GradientButton';
import { useColors } from '@/hooks/useColors';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSend = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'embr://reset-password',
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <Ionicons name="key" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.sub}>Enter your email and we'll send a reset link</Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: botPad + 24 }]}>
        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Email Sent!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Check your inbox for a password reset link. It may take a few minutes.
            </Text>
            <GradientButton label="Back to Login" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24 }} />
          </View>
        ) : (
          <>
            {error ? (
              <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
            ) : null}
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <GradientButton label="Send Reset Link" onPress={handleSend} loading={loading} />
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.back, { color: colors.mutedForeground }]}>
                Back to <Text style={{ color: colors.primary }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginBottom: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6 },
  body: { flex: 1, padding: 24, gap: 16 },
  error: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10, height: 52 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  back: { textAlign: 'center', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  successSub: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22 },
});

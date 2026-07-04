import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { GradientButton } from '@/components/GradientButton';
import { useColors } from '@/hooks/useColors';

function strengthLabel(pw: string): { label: string; color: string; score: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
  return { label: labels[score - 1] ?? 'Weak', color: colors[score - 1] ?? '#EF4444', score };
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');
  const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const strength = password ? strengthLabel(password) : null;

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(clean);
    setUsernameStatus('idle');
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    if (clean.length >= 3) {
      setUsernameStatus('checking');
      usernameTimeout.current = setTimeout(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();
        setUsernameStatus(data ? 'taken' : 'available');
      }, 500);
    }
  };

  const handleSignup = async () => {
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (usernameStatus === 'taken') { setError('Username is already taken.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (!password || (strength?.score ?? 0) < 2) { setError('Password is too weak.'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, full_name: username } },
      });
      if (authErr) { setError(authErr.message); return; }
      router.push({ pathname: '/(auth)/verify-otp', params: { email } });
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed.');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join the Embr community</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        {/* Username */}
        <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: usernameStatus === 'taken' ? colors.destructive : usernameStatus === 'available' ? '#22C55E' : colors.border }]}>
          <Ionicons name="at" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="your_username"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoComplete="username"
          />
          {usernameStatus === 'checking' && <ActivityIndicator size="small" color={colors.mutedForeground} />}
          {usernameStatus === 'available' && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
          {usernameStatus === 'taken' && <Ionicons name="close-circle" size={18} color={colors.destructive} />}
        </View>
        {usernameStatus === 'taken' && <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: -8 }}>Username is taken</Text>}
        {usernameStatus === 'available' && <Text style={{ color: '#22C55E', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: -8 }}>Username is available</Text>}

        {/* Email */}
        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
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
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(v => !v)}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {strength && (
          <View style={styles.strengthRow}>
            {[1, 2, 3, 4].map(i => (
              <View
                key={i}
                style={[styles.strengthBar, { backgroundColor: i <= strength.score ? strength.color : colors.border }]}
              />
            ))}
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}

        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By signing up, you agree to our{' '}
          <Text style={{ color: colors.primary }}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
        </Text>

        <GradientButton label="Create Account" onPress={handleSignup} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular' },
  form: { padding: 24, gap: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  label: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginBottom: -4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10, height: 52 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  terms: { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  loginLink: { fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { GradientButton } from '@/components/GradientButton';
import { useColors } from '@/hooks/useColors';

const OTP_LEN = 6;

export default function VerifyOtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text: string, index: number) => {
    const val = text.slice(-1);
    const next = [...code];
    next[index] = val;
    setCode(next);
    if (val && index < OTP_LEN - 1) inputRefs.current[index + 1]?.focus();
    // Auto-submit
    if (next.every(c => c) && index === OTP_LEN - 1) {
      setTimeout(() => verifyCode(next.join('')), 100);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (otp: string) => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      if (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err.message);
        shake();
        setCode(Array(OTP_LEN).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/');
      }
    } catch (e: any) {
      setError(e.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!canResend || !email) return;
    setCanResend(false);
    setCountdown(60);
    await supabase.auth.resend({ type: 'signup', email });
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>We sent a 6-digit code to{'\n'}{email}</Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: botPad + 24 }]}>
        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => { inputRefs.current[i] = r; }}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.input,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={digit}
              onChangeText={t => handleChange(t, i)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        <GradientButton
          label="Verify"
          onPress={() => verifyCode(code.join(''))}
          loading={loading}
          disabled={code.some(c => !c)}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity onPress={resend} disabled={!canResend} style={{ marginTop: 16 }}>
          <Text style={[styles.resend, { color: canResend ? colors.primary : colors.mutedForeground }]}>
            {canResend ? 'Resend code' : `Resend in ${countdown}s`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6, lineHeight: 22 },
  body: { flex: 1, padding: 24, alignItems: 'center', gap: 16 },
  error: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  codeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  codeInput: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, textAlign: 'center', fontSize: 22, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  resend: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { GradientButton } from '@/components/GradientButton';

interface Field {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
}

const FIELDS: Field[] = [
  { key: 'full_name', label: 'Full Name', placeholder: 'Your full name' },
  { key: 'username', label: 'Username', placeholder: 'your_username' },
  { key: 'bio', label: 'Bio', placeholder: 'Tell people about yourself...', multiline: true },
  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com', keyboardType: 'url' },
  { key: 'location', label: 'Location', placeholder: 'Your city, country' },
];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        username: profile.username ?? '',
        bio: profile.bio ?? '',
        website: profile.website ?? '',
        location: profile.location ?? '',
      });
      setAvatarUri(profile.avatar_url ?? null);
      setCoverUri(profile.cover_url ?? null);
    }
  }, [profile]);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
  };

  const pickCover = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!res.canceled) setCoverUri(res.assets[0].uri);
  };

  const uploadImage = async (uri: string, bucket: string, path: string): Promise<string | null> => {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const save = async () => {
    if (!user?.id) return;
    if (form.username && form.username.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    // Check username uniqueness
    if (form.username && form.username !== profile?.username) {
      const { data } = await supabase.from('profiles').select('id').eq('username', form.username).maybeSingle();
      if (data) { setUsernameError('Username already taken.'); return; }
    }
    setUsernameError('');
    setSaving(true);
    try {
      const updates: Record<string, any> = { ...form };
      // Upload avatar if changed
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        const url = await uploadImage(avatarUri, 'avatars', `${user.id}/avatar.jpg`);
        if (url) updates.avatar_url = url;
      }
      // Upload cover if changed
      if (coverUri && coverUri !== profile?.cover_url) {
        const url = await uploadImage(coverUri, 'avatars', `${user.id}/cover.jpg`);
        if (url) updates.cover_url = url;
      }
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <TouchableOpacity onPress={pickCover} activeOpacity={0.85}>
          <View style={styles.coverBox}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImg} contentFit="cover" />
            ) : (
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.coverImg} />
            )}
            <View style={styles.coverOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.coverLabel}>Change Cover</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: colors.muted }]}>
                <Ionicons name="person" size={36} color={colors.mutedForeground} />
              </View>
            )}
            <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        {FIELDS.map(f => (
          <View key={f.key} style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>{f.label}</Text>
            {f.key === 'username' && usernameError ? (
              <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>{usernameError}</Text>
            ) : null}
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: f.key === 'username' && usernameError ? colors.destructive : colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }, f.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
                value={form[f.key] ?? ''}
                onChangeText={val => setForm(p => ({ ...p, [f.key]: val }))}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
                multiline={f.multiline}
                keyboardType={f.keyboardType ?? 'default'}
                autoCapitalize={f.key === 'username' ? 'none' : 'sentences'}
                maxLength={f.key === 'bio' ? 160 : f.key === 'username' ? 30 : 100}
              />
            </View>
            {f.key === 'bio' && (
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{(form.bio ?? '').length}/160</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  saveBtn: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  form: { padding: 20, gap: 16 },
  coverBox: { height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', gap: 4 },
  coverLabel: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  avatarSection: { alignItems: 'flex-start', marginTop: -20 },
  avatarWrap: { position: 'relative', marginLeft: 16 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  label: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  inputWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4 },
  input: { fontSize: 15, fontFamily: 'Poppins_400Regular', paddingVertical: 10 },
  charCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'right' },
});

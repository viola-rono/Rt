import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, Alert, Image as RNImage, FlatList, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/contexts/CreatePostContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { GradientButton } from '@/components/GradientButton';

const { width: SCREEN_W } = Dimensions.get('window');

const BG_COLORS = [
  null,
  '#FF416C', '#FF4B2B', '#F7941D',
  '#4A90E2', '#9B59B6', '#22C55E',
  '#1A1A2E', '#16213E', '#0F3460',
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: 'globe-outline' as const },
  { value: 'friends', label: 'Friends', icon: 'people-outline' as const },
  { value: 'private', label: 'Only Me', icon: 'lock-closed-outline' as const },
];

export default function CreatePostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  // Shared draft state written to by sub-screens (feeling/location/tag/music)
  const {
    feeling, setFeeling: setContextFeeling,
    location, setLocation: setContextLocation,
    taggedIds,
    song: selectedSong, setSong: setContextSong,
    reset: resetDraft,
  } = useCreatePost();
  const [content, setContent] = useState('');
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [mediaAssets, setMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [posting, setPosting] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to add media.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!res.canceled) {
      setMediaAssets(prev => [...prev, ...res.assets].slice(0, 10));
      setSelectedBg(null);
    }
  };

  const uploadMedia = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const ext = asset.type === 'video' ? 'mp4' : 'jpg';
      const path = `${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('posts').upload(path, blob, { upsert: false });
      if (error) return null;
      const { data } = supabase.storage.from('posts').getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('Empty post', 'Add some text or media before posting.');
      return;
    }
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    try {
      // Upload all media in parallel
      const mediaUrls = mediaAssets.length > 0
        ? (await Promise.all(mediaAssets.map(uploadMedia))).filter(Boolean) as string[]
        : [];

      // Extract hashtags
      const hashtags = [...(content.match(/#(\w+)/g) ?? [])].map(h => h.slice(1).toLowerCase());

      const postData = {
        user_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaAssets.length > 0 ? (mediaAssets[0].type === 'video' ? 'video' : 'image') : null,
        bg_color: selectedBg,
        visibility,
        feeling: feeling?.label ?? null,
        feeling_icon: feeling?.icon ?? null,
        location_name: location,
        tagged_users: taggedIds.length > 0 ? taggedIds : null,
        song_title: selectedSong?.title ?? null,
        song_artist: selectedSong?.artist ?? null,
        hashtags,
        post_type: 'original',
        view_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        saves_count: 0,
        is_edited: false,
      };

      const { error } = await supabase.from('posts').insert(postData);
      if (error) throw error;

      // Update hashtag counts
      if (hashtags.length > 0) {
        for (const tag of hashtags) {
          await supabase.rpc('increment_hashtag', { tag_name: tag });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetDraft();
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const removeMedia = (idx: number) => {
    setMediaAssets(prev => prev.filter((_, i) => i !== idx));
  };

  const currentVis = VISIBILITY_OPTIONS.find(o => o.value === visibility)!;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Post</Text>
        <GradientButton
          label={posting ? 'Posting...' : 'Post'}
          onPress={handlePost}
          loading={posting}
          small
          style={{ minWidth: 70 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.form, { paddingBottom: botPad + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <UserAvatar uri={profile?.avatar_url} name={profile?.username} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{profile?.username}</Text>
            {/* Visibility */}
            <TouchableOpacity
              style={[styles.visibilityBtn, { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                const idx = VISIBILITY_OPTIONS.findIndex(o => o.value === visibility);
                const next = VISIBILITY_OPTIONS[(idx + 1) % VISIBILITY_OPTIONS.length];
                setVisibility(next.value as any);
              }}
            >
              <Ionicons name={currentVis.icon} size={12} color={colors.primary} />
              <Text style={[styles.visibilityLabel, { color: colors.primary }]}>{currentVis.label}</Text>
              <Ionicons name="chevron-down" size={10} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feeling / location / song badges */}
        {(feeling || location || selectedSong || taggedIds.length > 0) && (
          <View style={styles.badgesRow}>
            {feeling && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.badgeText}>{feeling.icon} feeling {feeling.label}</Text>
                <TouchableOpacity onPress={() => setContextFeeling(null)}>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {location && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>{location}</Text>
                <TouchableOpacity onPress={() => setContextLocation(null)}>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedSong && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="musical-note" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]} numberOfLines={1}>{selectedSong.title}</Text>
                <TouchableOpacity onPress={() => setContextSong(null)}>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {taggedIds.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>{taggedIds.length} tagged</Text>
              </View>
            )}
          </View>
        )}

        {/* Text area */}
        {selectedBg ? (
          <View style={[styles.bgPost, { backgroundColor: selectedBg }]}>
            <TextInput
              style={styles.bgText}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              maxLength={1000}
              textAlign="center"
            />
          </View>
        ) : (
          <TextInput
            style={[styles.textArea, { color: colors.foreground }]}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={5000}
            autoFocus
          />
        )}

        {/* Media grid */}
        {mediaAssets.length > 0 && (
          <View style={styles.mediaGrid}>
            {mediaAssets.slice(0, 4).map((asset, i) => (
              <View key={i} style={[styles.mediaItem, mediaAssets.length === 1 && { width: '100%', height: 220 }]}>
                <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                {asset.type === 'video' && (
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={32} color="#fff" />
                  </View>
                )}
                {i === 3 && mediaAssets.length > 4 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{mediaAssets.length - 4}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeMedia} onPress={() => removeMedia(i)}>
                  <Ionicons name="close-circle" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Background color picker (only shown when no media) */}
        {mediaAssets.length === 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bgPicker} contentContainerStyle={{ gap: 8 }}>
            {BG_COLORS.map((c, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedBg(c)}
                style={[
                  styles.bgSwatch,
                  c === null ? { backgroundColor: colors.muted, borderWidth: 2, borderColor: colors.border } : { backgroundColor: c },
                  selectedBg === c && styles.bgSwatchSelected,
                ]}
              >
                {c === null && <Ionicons name="close" size={14} color={colors.mutedForeground} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={pickMedia}>
          <Ionicons name="image-outline" size={24} color="#4A90E2" />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Media</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/create-post/feeling')}>
          <Ionicons name="happy-outline" size={24} color="#F7941D" />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Feeling</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/create-post/location')}>
          <Ionicons name="location-outline" size={24} color="#22C55E" />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/create-post/tag-people')}>
          <Ionicons name="pricetag-outline" size={24} color="#9B59B6" />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Tag</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/create-post/music')}>
          <Ionicons name="musical-note" size={24} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Music</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  cancelBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  form: { padding: 16, gap: 14 },
  authorRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  authorName: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  visibilityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  visibilityLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#FF416C' },
  bgPost: { height: 220, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 20 },
  bgText: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', fontFamily: 'Poppins_700Bold', width: '100%' },
  textArea: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 24, minHeight: 120 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderRadius: 12, overflow: 'hidden' },
  mediaItem: { width: (SCREEN_W - 48) / 2, height: 140, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  moreOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  moreText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  removeMedia: { position: 'absolute', top: 6, right: 6 },
  bgPicker: { marginTop: -6 },
  bgSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bgSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 3, padding: 8 },
  actionLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

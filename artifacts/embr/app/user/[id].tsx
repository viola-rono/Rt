import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import { GradientButton } from '@/components/GradientButton';
import { SkeletonBox } from '@/components/SkeletonLoader';
import type { Profile, Post } from '@/types/database';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      // Check if current user is following
      if (user?.id && id !== user?.id) {
        const { data: f } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .maybeSingle();
        setIsFollowing(!!f);
      }
      return data as Profile;
    },
    enabled: !!id,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', id],
    queryFn: async () => {
      let q = supabase.from('posts').select('*, profile:profiles(*)').eq('user_id', id);
      if (id !== user?.id) q = q.eq('visibility', 'public');
      q = q.order('created_at', { ascending: false });
      const { data } = await q;
      return (data ?? []) as Post[];
    },
    enabled: !!id,
  });

  const toggleFollow = async () => {
    if (!user?.id || !id) return;
    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      await supabase.from('followers').insert({ follower_id: user.id, following_id: id });
    } else {
      await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', id);
    }
  };

  const handleMessage = () => {
    router.push({ pathname: '/messages/[id]', params: { id: id!, username: profile?.username } });
  };

  const handleMore = () => {
    Alert.alert('Options', undefined, [
      { text: 'Report', style: 'destructive', onPress: () => {} },
      { text: 'Block', style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const COVER_H = 180;
  const AVATAR_SIZE = 86;
  const AVATAR_BORDER = 3;
  const AVATAR_OFFSET = (AVATAR_SIZE + AVATAR_BORDER * 2) / 2; // Half of avatar size to overlap cover

  const ListHeader = () => (
    <View>
      {/* Cover */}
      <View style={{ height: COVER_H, position: 'relative' }}>
        {profile?.cover_url ? (
          <Image source={{ uri: profile.cover_url }} style={{ width: '100%', height: COVER_H }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ width: '100%', height: COVER_H }} />
        )}
        <View style={[styles.topBar, { top: topPad + 8 }]}>
          <TouchableOpacity style={styles.coverBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.coverBtn} onPress={handleMore}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.avatarWrap, { borderColor: colors.card, bottom: -AVATAR_OFFSET }]}>
          <UserAvatar uri={profile?.avatar_url} name={profile?.username} size={AVATAR_SIZE} />
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoSection, { backgroundColor: colors.card, marginTop: AVATAR_OFFSET }]}>
        <View style={{ paddingTop: AVATAR_OFFSET + 16, paddingHorizontal: 16 }}>
          {profileLoading ? (
            <View style={{ gap: 8, paddingBottom: 16 }}>
              <SkeletonBox width={160} height={20} borderRadius={8} />
              <SkeletonBox width={100} height={14} borderRadius={8} />
            </View>
          ) : (
            <>
              <View style={styles.nameRow}>
                <View>
                  <Text style={[styles.name, { color: colors.foreground }]}>{profile?.full_name || profile?.username}</Text>
                  <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile?.username}</Text>
                </View>
                {profile?.is_verified && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </View>
              {profile?.bio ? <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text> : null}

              <View style={styles.statsRow}>
                {[
                  { label: 'Posts', value: profile?.posts_count ?? 0 },
                  { label: 'Followers', value: profile?.followers_count ?? 0 },
                  { label: 'Following', value: profile?.following_count ?? 0 },
                ].map(s => (
                  <View key={s.label} style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>{s.value.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {id !== user?.id && (
                <View style={styles.actionBtns}>
                  <GradientButton
                    label={isFollowing ? 'Following' : 'Follow'}
                    variant={isFollowing ? 'outline' : 'gradient'}
                    onPress={toggleFollow}
                    style={{ flex: 1 }}
                  />
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: colors.muted }]}
                    onPress={handleMessage}
                  >
                    <Ionicons name="mail-outline" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts ?? []}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 12, marginBottom: 8 }}>
            <PostCard post={item} currentUserId={user?.id} />
          </View>
        )}
        ListEmptyComponent={
          postsLoading
            ? <View style={{ padding: 16 }}><SkeletonBox width="100%" height={200} borderRadius={16} /></View>
            : <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="images-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet</Text>
              </View>
        }
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  coverBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'absolute', left: 20, borderRadius: 50, borderWidth: 3 },
  infoSection: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, paddingBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  handle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  bio: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  actionBtns: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
});

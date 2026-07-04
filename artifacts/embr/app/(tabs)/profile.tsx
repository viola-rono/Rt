import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ScrollView, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import { SkeletonBox } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { GradientButton } from '@/components/GradientButton';
import type { Post } from '@/types/database';

type ProfileTab = 'Posts' | 'Media' | 'Tagged' | 'Reposts';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>('Posts');
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 : insets.bottom + 54;

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['my-posts', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from('posts').select('*, profile:profiles(*)').eq('user_id', user.id);
      if (activeTab === 'Posts') q = q.eq('post_type', 'original').neq('media_type', 'video');
      if (activeTab === 'Media') q = q.in('media_type', ['image', 'video']);
      if (activeTab === 'Reposts') q = q.eq('post_type', 'repost');
      q = q.order('created_at', { ascending: false });
      const { data } = await q;
      return (data ?? []) as Post[];
    },
    enabled: !!user?.id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const TABS: ProfileTab[] = ['Posts', 'Media', 'Tagged', 'Reposts'];
  const COVER_H = 180;

  const ListHeader = () => (
    <View>
      {/* Cover */}
      <View style={{ height: COVER_H, position: 'relative' }}>
        {profile?.cover_url ? (
          <Image source={{ uri: profile.cover_url }} style={{ width: '100%', height: COVER_H }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ width: '100%', height: COVER_H }} />
        )}
        {/* Back/settings row */}
        <View style={[styles.coverActions, { top: topPad + 8 }]}>
          <View />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.coverBtn} onPress={() => router.push('/settings/')}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Avatar */}
        <View style={[styles.avatarWrap, { borderColor: colors.card }]}>
          <UserAvatar uri={profile?.avatar_url} name={profile?.username} size={86} />
        </View>
      </View>

      {/* Profile info */}
      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
        <View style={{ paddingTop: 52, paddingHorizontal: 16 }}>
          <View style={styles.nameRow}>
            <View>
              <Text style={[styles.name, { color: colors.foreground }]}>{profile?.full_name || profile?.username}</Text>
              <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile?.username}</Text>
            </View>
            {profile?.is_verified && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </View>
          {profile?.bio ? <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text> : null}

          {/* Stats */}
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

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <GradientButton label="Edit Profile" onPress={() => router.push('/settings/edit-profile')} style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.muted }]} onPress={() => router.push('/messages/')}>
              <Ionicons name="mail-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.muted }]} onPress={signOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile tabs */}
        <View style={[styles.tabRow, { borderTopColor: colors.border }]}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabLabel, { color: activeTab === t ? colors.primary : colors.mutedForeground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts ?? []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          activeTab === 'Media' ? (
            <TouchableOpacity
              style={styles.mediaItem}
              onPress={() => router.push(`/post/${item.id}`)}
            >
              {item.media_urls?.[0] && (
                <Image source={{ uri: item.media_urls[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ marginHorizontal: 12, marginBottom: 8 }}>
              <PostCard post={item} currentUserId={user?.id} />
            </View>
          )
        )}
        numColumns={activeTab === 'Media' ? 3 : 1}
        key={activeTab === 'Media' ? 'media' : 'list'}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading
            ? <View style={{ padding: 16 }}><SkeletonBox width="100%" height={200} borderRadius={16} /></View>
            : <EmptyState icon="images-outline" title={`No ${activeTab.toLowerCase()} yet`} />
        }
        contentContainerStyle={{ paddingBottom: botPad }}
        columnWrapperStyle={activeTab === 'Media' ? { gap: 2 } : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverActions: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  coverBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'absolute', bottom: -43, left: 20, borderRadius: 47, borderWidth: 3 },
  infoSection: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  handle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  bio: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  actionBtns: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  mediaItem: { width: '33.33%', height: 130 },
});

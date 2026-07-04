import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { GradientButton } from '@/components/GradientButton';
import { SkeletonBox } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import type { Profile } from '@/types/database';

type Tab = 'people' | 'posts' | 'hashtags';

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { hashtag } = useLocalSearchParams<{ hashtag?: string }>();
  const [query, setQuery] = useState(hashtag ? `#${hashtag}` : '');
  const [activeTab, setActiveTab] = useState<Tab>('people');
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 : insets.bottom + 54;

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['explore-users', query],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id ?? '')
        .order('followers_count', { ascending: false })
        .limit(30);
      if (query && !query.startsWith('#')) {
        q = q.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
      }
      const { data } = await q;
      return (data ?? []) as Profile[];
    },
    staleTime: 1000 * 30,
  });

  const { data: trending } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(username, avatar_url)')
        .eq('visibility', 'public')
        .order('likes_count', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: hashtags } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const toggleFollow = async (profileId: string) => {
    const isFollowing = following.has(profileId);
    const next = new Set(following);
    if (isFollowing) {
      next.delete(profileId);
      await supabase.from('followers').delete().eq('follower_id', user?.id).eq('following_id', profileId);
    } else {
      next.add(profileId);
      await supabase.from('followers').insert({ follower_id: user?.id, following_id: profileId });
    }
    setFollowing(next);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'people', label: 'People' },
    { key: 'posts', label: 'Posts' },
    { key: 'hashtags', label: 'Hashtags' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="search-outline" size={16} color="#fff" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, posts, #hashtags"
            placeholderTextColor="rgba(255,255,255,0.7)"
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Filter tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, activeTab === t.key ? styles.tabLabelActive : { color: 'rgba(255,255,255,0.7)' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      {activeTab === 'people' && (
        <FlatList
          data={users ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: botPad }}
          ListEmptyComponent={
            loadingUsers
              ? <View style={{ gap: 8 }}>{[1,2,3].map(i => <View key={i} style={[styles.userCard, {backgroundColor:colors.card}]}><SkeletonBox width={46} height={46} borderRadius={23} /><View style={{flex:1,gap:6}}><SkeletonBox width={100} height={12} /><SkeletonBox width={70} height={10} /></View></View>)}</View>
              : <EmptyState icon="people-outline" title="No users found" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/user/${item.id}`)}
              activeOpacity={0.8}
            >
              <UserAvatar uri={item.avatar_url} name={item.username} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.username, { color: colors.foreground }]}>{item.full_name || item.username}</Text>
                <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{item.username} · {item.followers_count} followers</Text>
              </View>
              {item.id !== user?.id && (
                <GradientButton
                  label={following.has(item.id) ? 'Following' : 'Follow'}
                  onPress={() => toggleFollow(item.id)}
                  variant={following.has(item.id) ? 'outline' : 'gradient'}
                  small
                />
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'posts' && (
        <FlatList
          data={trending ?? []}
          keyExtractor={(item: any) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 4, paddingBottom: botPad }}
          columnWrapperStyle={{ gap: 4 }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={styles.gridPost}
              onPress={() => router.push(`/post/${item.id}`)}
              activeOpacity={0.85}
            >
              {item.media_urls?.[0] ? (
                <Image source={{ uri: item.media_urls[0] }} style={styles.gridImage} contentFit="cover" />
              ) : (
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gridImage}>
                  <Text style={styles.gridText} numberOfLines={4}>{item.content}</Text>
                </LinearGradient>
              )}
              <View style={styles.gridOverlay}>
                <Ionicons name="heart" size={12} color="#fff" />
                <Text style={styles.gridStat}>{item.likes_count}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="images-outline" title="No trending posts yet" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'hashtags' && (
        <FlatList
          data={hashtags ?? []}
          keyExtractor={(item: any) => item.name}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: botPad }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={[styles.hashtagCard, { backgroundColor: colors.card }]}
              onPress={() => { setActiveTab('posts'); setQuery(`#${item.name}`); }}
            >
              <View style={[styles.hashIcon, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.hashSymbol, { color: colors.primary }]}>#</Text>
              </View>
              <View>
                <Text style={[styles.hashName, { color: colors.foreground }]}>#{item.name}</Text>
                <Text style={[styles.hashCount, { color: colors.mutedForeground }]}>{item.post_count} posts</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No hashtags yet" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold', marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 14, height: 40, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabBtnActive: { backgroundColor: '#fff' },
  tabLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  tabLabelActive: { color: '#FF416C', fontFamily: 'Poppins_700Bold' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  username: { fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  handle: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  gridPost: { flex: 1, height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 8 },
  gridText: { color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins_500Medium' },
  gridOverlay: { position: 'absolute', bottom: 6, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridStat: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hashtagCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 14 },
  hashIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hashSymbol: { fontSize: 22, fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  hashName: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  hashCount: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
});

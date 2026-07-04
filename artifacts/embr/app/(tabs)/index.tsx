import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { GradientHeader } from '@/components/GradientHeader';
import { PostCard } from '@/components/PostCard';
import { StoryBar } from '@/components/StoryBar';
import { SkeletonPost, SkeletonStory } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import type { Post } from '@/types/database';

const PAGE_SIZE = 10;

async function fetchPosts(cursor: string | null): Promise<{ posts: Post[]; nextCursor: string | null }> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      profile:profiles(id, username, full_name, avatar_url, is_verified)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  const posts = (data ?? []) as Post[];
  return {
    posts,
    nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].created_at : null,
  };
}

export default function HomeScreen() {
  const colors = useColors();
  const { profile, user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const bottomPad = Platform.OS === 'web' ? 84 : insets.bottom + 54;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }: { pageParam: string | null }) => fetchPosts(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor,
  });

  const { data: stories } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stories')
        .select('*, profile:profiles(*)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleDeletePost = (id: string) => {
    queryClient.setQueryData(['feed'], (old: any) => ({
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        posts: page.posts.filter((p: Post) => p.id !== id),
      })),
    }));
  };

  const storyUsers = (stories ?? []).reduce<any[]>((acc, s: any) => {
    if (!acc.find((u: any) => u.id === s.user_id)) {
      acc.push({ id: s.user_id, profile: s.profile, hasStory: true, hasUnviewedStory: !s.is_viewed });
    }
    return acc;
  }, []);

  const renderHeader = () => (
    <View>
      {/* Stories */}
      <View style={[styles.storiesCard, { backgroundColor: colors.card }]}>
        {isLoading ? (
          <View style={{ flexDirection: 'row', padding: 14 }}>
            {[1, 2, 3, 4].map(i => <SkeletonStory key={i} />)}
          </View>
        ) : (
          <StoryBar
            currentUserProfile={profile}
            storyUsers={storyUsers}
            onAddStory={() => {}}
            onViewStory={uid => router.push(`/user/${uid}`)}
          />
        )}
      </View>

      {/* Quick post box */}
      <TouchableOpacity
        style={[styles.postBox, { backgroundColor: colors.card }]}
        onPress={() => router.push('/create-post/')}
        activeOpacity={0.8}
      >
        <View style={styles.postBoxInner}>
          <View style={[styles.avatar24, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
          <View style={[styles.postInput, { backgroundColor: colors.muted }]}>
            <Text style={[styles.postPlaceholder, { color: colors.mutedForeground }]}>
              Share your thoughts...
            </Text>
          </View>
        </View>
        <View style={styles.postBtns}>
          <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/create-post/')}>
            <Ionicons name="image-outline" size={18} color={colors.primary} />
            <Text style={[styles.postBtnLabel, { color: colors.foreground }]}>Photo</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/create-post/')}>
            <Ionicons name="videocam-outline" size={18} color="#F7941D" />
            <Text style={[styles.postBtnLabel, { color: colors.foreground }]}>Video</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/create-post/feeling')}>
            <Ionicons name="happy-outline" size={18} color="#22C55E" />
            <Text style={[styles.postBtnLabel, { color: colors.foreground }]}>Feeling</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader
          title={`Hello, ${profile?.username ?? 'there'} 👋`}
          subtitle="What's on your mind?"
          showSearch
          showMessages
        />
        <View style={{ padding: 12, gap: 8 }}>
          {[1, 2, 3].map(i => <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.card }]}><SkeletonPost /></View>)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title={`Hello, ${profile?.username ?? 'there'} 👋`}
        subtitle="What's on your mind?"
        showSearch
        showMessages
      />
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id}
            onDelete={handleDeletePost}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-outline"
            title="Your feed is empty"
            subtitle="Follow people to see their posts here"
            actionLabel="Explore"
            onAction={() => router.push('/(tabs)/explore')}
          />
        }
        ListFooterComponent={isFetchingNextPage ? <SkeletonPost /> : null}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ gap: 8, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  storiesCard: { marginHorizontal: 12, marginTop: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  postBox: { marginHorizontal: 12, marginTop: 8, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  postBoxInner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar24: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  postInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  postPlaceholder: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  postBtns: { flexDirection: 'row', alignItems: 'center' },
  postBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  postBtnLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  divider: { width: 1, height: 20 },
  skeletonCard: { borderRadius: 16, marginHorizontal: 12 },
});

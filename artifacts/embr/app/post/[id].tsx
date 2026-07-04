import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Platform, RefreshControl, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { PostCard } from '@/components/PostCard';
import { CommentItem } from '@/components/CommentItem';
import { UserAvatar } from '@/components/UserAvatar';
import { SkeletonBox } from '@/components/SkeletonLoader';
import type { Post, Comment } from '@/types/database';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single();
      // increment view count
      if (data) await supabase.from('posts').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', id);
      return data as Post;
    },
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading, refetch } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('post_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      return (data ?? []) as Comment[];
    },
    enabled: !!id,
  });

  const submitComment = async () => {
    if (!commentText.trim() || !user?.id || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    const newComment = {
      post_id: id,
      user_id: user.id,
      content: commentText.trim(),
      parent_id: replyTo?.id ?? null,
    };
    await supabase.from('comments').insert(newComment);
    await supabase.from('posts').update({ comments_count: (post?.comments_count ?? 0) + 1 }).eq('id', id);
    setCommentText('');
    setReplyTo(null);
    queryClient.invalidateQueries({ queryKey: ['comments', id] });
    setSubmitting(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View>
      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'web' ? 67 : insets.top, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Post</Text>
        <View style={{ width: 36 }} />
      </View>
      {postLoading ? (
        <View style={{ padding: 16, gap: 8 }}>
          <SkeletonBox width="100%" height={200} borderRadius={16} />
        </View>
      ) : post ? (
        <View style={{ marginHorizontal: 12, marginTop: 8, marginBottom: 12 }}>
          <PostCard post={post} currentUserId={user?.id} />
        </View>
      ) : null}
      {/* Likes summary */}
      {post && (
        <View style={[styles.likesSummary, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text style={styles.emoji}>❤️</Text>
            <Text style={styles.emoji}>👍</Text>
            <Text style={styles.emoji}>😁</Text>
            <Text style={[styles.likeCount, { color: colors.foreground }]}>{post.likes_count} Likes</Text>
          </View>
          <Text style={[styles.commentsCount, { color: colors.foreground }]}>{post.comments_count} Comments</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={comments ?? []}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            currentUserId={user?.id}
            onReply={c => {
              setReplyTo(c);
              inputRef.current?.focus();
            }}
          />
        )}
        ListEmptyComponent={
          commentsLoading
            ? <View style={{ padding: 16, gap: 12 }}>{[1,2,3].map(i => <SkeletonBox key={i} width="100%" height={60} borderRadius={8} />)}</View>
            : <View style={{ alignItems: 'center', padding: 32 }}><Text style={[styles.noComments, { color: colors.mutedForeground }]}>Be the first to comment</Text></View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 + botPad }}
      />

      {/* Comment input */}
      <View style={[styles.commentBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
        {replyTo && (
          <View style={[styles.replyBanner, { backgroundColor: colors.muted }]}>
            <Text style={[styles.replyText, { color: colors.mutedForeground }]}>
              Replying to <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold' }}>@{replyTo.profile?.username}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentRow}>
          <UserAvatar uri={profile?.avatar_url} name={profile?.username} size={34} />
          <TextInput
            ref={inputRef}
            style={[styles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={submitComment}
          />
          <TouchableOpacity onPress={() => {}} style={styles.mediaBtn}>
            <Ionicons name="image-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.mediaBtn}>
            <Ionicons name="happy-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submitComment}
            disabled={!commentText.trim() || submitting}
            style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.muted }]}
          >
            <Ionicons name="send" size={16} color={commentText.trim() ? '#fff' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>Max 2MB per media file</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  likesSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  emoji: { fontSize: 18 },
  likeCount: { fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold', marginLeft: 4 },
  commentsCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  noComments: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  commentBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 12 },
  replyBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6 },
  replyText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  commentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 100 },
  mediaBtn: { padding: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mediaHint: { fontSize: 11, textAlign: 'center', marginTop: 4, fontFamily: 'Poppins_400Regular' },
});

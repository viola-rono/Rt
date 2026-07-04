import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Share, Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/types/database';

const SCREEN_W = Dimensions.get('window').width;

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PostCard({ post, currentUserId, onDelete, onRefresh }: PostCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [likes, setLikes] = useState(post.likes_count ?? 0);

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikes(l => l + (next ? 1 : -1));
    if (next) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      await supabase.from('posts').update({ likes_count: likes + 1 }).eq('id', post.id);
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      await supabase.from('posts').update({ likes_count: likes - 1 }).eq('id', post.id);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !saved;
    setSaved(next);
    if (next) {
      await supabase.from('post_saves').insert({ post_id: post.id, user_id: currentUserId });
    } else {
      await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', currentUserId);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: post.content ?? 'Check this post on Embr!' });
    } catch { /* ignore */ }
  };

  const handleMore = () => {
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' | 'default' }[] = [
      { text: 'Report', style: 'destructive', onPress: () => {} },
      { text: 'Block user', style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ];
    if (post.user_id === currentUserId) {
      options.unshift({
        text: 'Delete post',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('posts').delete().eq('id', post.id);
          onDelete?.(post.id);
        },
      });
    }
    Alert.alert('Options', undefined, options as any);
  };

  const images = post.media_urls ?? [];
  const visibleImages = images.slice(0, 3);
  const extraCount = images.length - 3;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push(`/post/${post.id}`)}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <UserAvatar
          uri={post.profile?.avatar_url}
          name={post.profile?.username}
          size={42}
          showOnline
          onPress={() => router.push(`/user/${post.user_id}`)}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.username, { color: colors.foreground }]}>
            {post.profile?.full_name || post.profile?.username || 'User'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{timeAgo(post.created_at)}</Text>
            {post.visibility === 'public' && (
              <Ionicons name="globe-outline" size={12} color={colors.mutedForeground} />
            )}
            {post.location_name ? (
              <Text style={[styles.meta, { color: colors.primary }]}>{post.location_name}</Text>
            ) : null}
            {post.is_edited && (
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>(edited)</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Song */}
      {post.song_title ? (
        <View style={styles.songRow}>
          <Ionicons name="musical-note" size={13} color={colors.primary} />
          <Text style={[styles.songText, { color: colors.foreground }]}>
            {post.song_title}{post.song_artist ? ` – ${post.song_artist}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Feeling */}
      {post.feeling ? (
        <Text style={[styles.content, { color: colors.foreground }]}>
          {post.feeling_icon} feeling {post.feeling}
        </Text>
      ) : null}

      {/* Content */}
      {post.content ? (
        post.bg_color ? (
          <View style={[styles.textPost, { backgroundColor: post.bg_color }]}>
            <Text style={styles.textPostContent}>{post.content}</Text>
          </View>
        ) : (
          <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
        )
      ) : null}

      {/* Hashtags */}
      {post.hashtags?.length > 0 && !post.bg_color && (
        <View style={styles.hashtagRow}>
          {post.hashtags.slice(0, 5).map(tag => (
            <TouchableOpacity key={tag} onPress={() => router.push(`/(tabs)/explore?hashtag=${tag}`)}>
              <Text style={[styles.hashtag, { color: colors.primary }]}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Images */}
      {visibleImages.length > 0 && (
        <View style={styles.imageContainer}>
          {visibleImages.length === 1 ? (
            <View>
              <Image
                source={{ uri: visibleImages[0] }}
                style={[styles.singleImage, { width: SCREEN_W - 32 }]}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.viewCountOverlay}>
                <Ionicons name="eye-outline" size={12} color="#fff" />
                <Text style={styles.viewCountText}>{post.view_count?.toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.multiImageGrid}>
              {visibleImages.map((uri, i) => (
                <View key={i} style={[styles.gridImageWrap, { width: (SCREEN_W - 48) / visibleImages.length }]}>
                  <Image source={{ uri }} style={styles.gridImage} contentFit="cover" transition={300} />
                  {i === 2 && extraCount > 0 && (
                    <View style={styles.moreOverlay}>
                      <Text style={styles.moreText}>+{extraCount}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Reaction row */}
      <View style={styles.reactRow}>
        <View style={styles.emojiGroup}>
          <Text style={styles.emoji}>❤️</Text>
          <Text style={styles.emoji}>👍</Text>
          <Text style={styles.emoji}>😁</Text>
          <Text style={[styles.reactCount, { color: colors.foreground }]}>{likes} Likes</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
            <Text style={[styles.reactMeta, { color: colors.mutedForeground }]}>
              {post.view_count?.toLocaleString()} views
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
            <Text style={[styles.reactMeta, { color: colors.mutedForeground }]}>
              {post.comments_count} Comments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={liked ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.actionLabel, { color: liked ? colors.primary : colors.mutedForeground }]}>
            Like
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${post.id}`)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.primary }]}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.actionLabel, { color: saved ? colors.primary : colors.mutedForeground }]}>
            Save
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 8 },
  username: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 6, gap: 4 },
  songText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  content: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, paddingHorizontal: 14, marginBottom: 8 },
  textPost: { margin: 14, borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 180 },
  textPostContent: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', fontFamily: 'Poppins_700Bold' },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 6, marginBottom: 8 },
  hashtag: { fontSize: 13, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  imageContainer: { marginBottom: 8 },
  singleImage: { height: 240 },
  viewCountOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  viewCountText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  multiImageGrid: { flexDirection: 'row', gap: 4, paddingHorizontal: 14 },
  gridImageWrap: { height: 140, borderRadius: 8, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  reactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  emojiGroup: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  emoji: { fontSize: 16, marginRight: -4 },
  reactCount: { fontSize: 13, fontWeight: '600', marginLeft: 8, fontFamily: 'Poppins_600SemiBold' },
  reactMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});

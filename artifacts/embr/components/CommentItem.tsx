import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/database';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1}h`;
  return `${Math.floor(m / 60)}d`;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply?: (comment: Comment) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, currentUserId, onReply, isReply = false }: CommentItemProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(comment.is_liked ?? false);
  const [likes, setLikes] = useState(comment.likes_count ?? 0);
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikes(l => l + (next ? 1 : -1));
    if (next) {
      await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: currentUserId });
    } else {
      await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', currentUserId);
    }
  };

  return (
    <View style={[isReply && { paddingLeft: 52 }]}>
      <View style={styles.row}>
        <UserAvatar
          uri={comment.profile?.avatar_url}
          name={comment.profile?.username}
          size={isReply ? 30 : 38}
          onPress={() => router.push(`/user/${comment.user_id}`)}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.bubble}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {comment.profile?.username || 'User'}
            </Text>
            <Text style={[styles.content, { color: colors.foreground }]}>{comment.content}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(comment.created_at)}</Text>
            <TouchableOpacity onPress={() => onReply?.(comment)}>
              <Text style={[styles.metaBtn, { color: colors.mutedForeground }]}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onReply?.(comment)}>
              <Text style={[styles.metaBtn, { color: colors.mutedForeground }]}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#FF416C' : colors.mutedForeground} />
          {likes > 0 && <Text style={[styles.likeCount, { color: colors.mutedForeground }]}>{likes}</Text>}
        </TouchableOpacity>
      </View>

      {/* Replies toggle */}
      {!isReply && comment.replies_count > 0 && (
        <TouchableOpacity
          style={{ paddingLeft: 52, marginTop: 4 }}
          onPress={() => setShowReplies(v => !v)}
        >
          <Text style={[styles.viewReplies, { color: colors.primary }]}>
            {showReplies ? 'Hide replies' : `↳ View ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Nested replies */}
      {showReplies && comment.replies?.map(r => (
        <CommentItem key={r.id} comment={r} currentUserId={currentUserId} onReply={onReply} isReply />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  bubble: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  content: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  time: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  metaBtn: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  likeBtn: { alignItems: 'center', paddingTop: 4, gap: 2 },
  likeCount: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  viewReplies: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
});

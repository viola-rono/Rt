import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { GradientButton } from '@/components/GradientButton';
import type { Notification } from '@/types/database';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  like: { name: 'heart', color: '#FF416C' },
  comment: { name: 'chatbubble', color: '#4A90E2' },
  reply: { name: 'chatbubble-ellipses', color: '#4A90E2' },
  follow: { name: 'person-add', color: '#22C55E' },
  mention: { name: 'at', color: '#F7941D' },
  tag: { name: 'pricetag', color: '#9B59B6' },
  share: { name: 'share-social', color: '#F7941D' },
  message: { name: 'mail', color: '#4A90E2' },
  security_login: { name: 'phone-portrait-outline', color: '#9B9B9B' },
  security_location: { name: 'location', color: '#9B9B9B' },
};

interface NotificationItemProps {
  notification: Notification;
  isFollowing?: boolean;
  onFollow?: (actorId: string) => void;
  onRead?: (id: string) => void;
}

export function NotificationItem({ notification, isFollowing, onFollow, onRead }: NotificationItemProps) {
  const colors = useColors();
  const iconInfo = TYPE_ICONS[notification.type] ?? { name: 'notifications' as const, color: colors.primary };
  const isSecurity = notification.type === 'security_login' || notification.type === 'security_location';

  const handlePress = () => {
    onRead?.(notification.id);
    if (notification.post_id) router.push(`/post/${notification.post_id}`);
    else if (notification.actor_id && !isSecurity) router.push(`/user/${notification.actor_id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        !notification.is_read && { backgroundColor: colors.primary + '0D' },
      ]}
      activeOpacity={0.7}
    >
      {/* Avatar / Icon */}
      <View style={styles.avatarWrap}>
        {isSecurity ? (
          <View style={[styles.secIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name={iconInfo.name} size={22} color={colors.mutedForeground} />
          </View>
        ) : (
          <UserAvatar
            uri={notification.actor?.avatar_url}
            name={notification.actor?.username}
            size={46}
            onPress={() => router.push(`/user/${notification.actor_id}`)}
          />
        )}
        <View style={[styles.typeBadge, { backgroundColor: iconInfo.color }]}>
          <Ionicons name={iconInfo.name} size={10} color="#fff" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
          {notification.actor && !isSecurity ? (
            <Text style={styles.bold}>{notification.actor.username} </Text>
          ) : null}
          {notification.message}
          {'  '}
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(notification.created_at)}</Text>
        </Text>
        {isSecurity && notification.meta && (
          <Text style={[styles.secMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {Object.values(notification.meta).join(' · ')}
          </Text>
        )}
        {notification.type === 'follow' && !isFollowing && (
          <GradientButton
            label="Follow"
            onPress={() => onFollow?.(notification.actor_id)}
            small
            style={{ marginTop: 6, alignSelf: 'flex-start' }}
          />
        )}
      </View>

      {/* Post thumbnail or chevron */}
      {notification.post?.media_urls?.[0] ? (
        <Image
          source={{ uri: notification.post.media_urls[0] }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : isSecurity ? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatarWrap: { position: 'relative' },
  secIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  typeBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  content: { flex: 1 },
  message: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  bold: { fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  time: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  secMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  thumbnail: { width: 44, height: 44, borderRadius: 8 },
});

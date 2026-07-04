import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { NotificationItem } from '@/components/NotificationItem';
import { SkeletonNotification } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import type { Notification } from '@/types/database';

type FilterTab = 'All' | 'Mentions' | 'Security';

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 : insets.bottom + 54;

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id, activeFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(*), post:posts(id, media_urls, content)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeFilter === 'Mentions') q = q.in('type', ['mention', 'tag']);
      if (activeFilter === 'Security') q = q.in('type', ['security_login', 'security_location']);

      const { data } = await q;
      return (data ?? []) as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = (notifications ?? []).filter(n => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id ?? '');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    queryClient.setQueryData(['notifications', user?.id, activeFilter], (old: Notification[] | undefined) =>
      (old ?? []).map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const FILTERS: FilterTab[] = ['All', 'Mentions', 'Security'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>
        {/* Filter pills */}
        <View style={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterBtn,
                activeFilter === f ? styles.filterBtnActive : { backgroundColor: 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Text style={[
                styles.filterLabel,
                activeFilter === f ? styles.filterLabelActive : { color: '#fff' },
              ]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={notifications ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onRead={markRead}
            onFollow={async (actorId) => {
              await supabase.from('followers').insert({ follower_id: user?.id, following_id: actorId });
            }}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          isLoading
            ? <View>{[1,2,3,4,5].map(i => <SkeletonNotification key={i} />)}</View>
            : <EmptyState icon="notifications-outline" title="No notifications yet" subtitle="When someone interacts with your posts, you'll see it here" />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  badge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#FF416C', fontSize: 12, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  markAll: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  filters: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  filterBtnActive: { backgroundColor: '#fff' },
  filterLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  filterLabelActive: { color: '#FF416C', fontFamily: 'Poppins_700Bold' },
  list: { backgroundColor: 'transparent' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 72 },
});

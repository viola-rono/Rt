import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import { SkeletonBox } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import type { Conversation } from '@/types/database';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:profiles!participant1_id(*),
          participant2:profiles!participant2_id(*)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      return (data ?? []) as Conversation[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const filtered = (conversations ?? []).filter(c => {
    if (!search) return true;
    const other = c.participant1_id === user?.id ? c.participant2 : c.participant1;
    return (
      other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      other?.full_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.newBtn}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          isLoading
            ? <View style={{ padding: 16, gap: 12 }}>{[1,2,3,4,5].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                  <SkeletonBox width={48} height={48} borderRadius={24} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBox width={120} height={12} borderRadius={6} />
                    <SkeletonBox width="70%" height={10} borderRadius={6} />
                  </View>
                </View>
              ))}</View>
            : <EmptyState
                icon="chatbubbles-outline"
                title="No conversations yet"
                subtitle="Start a conversation with someone"
              />
        }
        renderItem={({ item }) => {
          const other = item.participant1_id === user?.id ? item.participant2 : item.participant1;
          const unread = item.unread_count ?? 0;
          return (
            <TouchableOpacity
              style={[styles.convRow, { backgroundColor: colors.card }]}
              onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id, username: other?.username } })}
              activeOpacity={0.75}
            >
              <UserAvatar uri={other?.avatar_url} name={other?.username} size={50} showOnline />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.convName, { color: colors.foreground }]} numberOfLines={1}>
                    {other?.full_name || other?.username}
                  </Text>
                  <Text style={[styles.convTime, { color: unread > 0 ? colors.primary : colors.mutedForeground }]}>
                    {item.last_message_at ? timeAgo(item.last_message_at) : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={[styles.convLastMsg, { color: unread > 0 ? colors.foreground : colors.mutedForeground, fontWeight: unread > 0 ? '600' : '400' }]}
                    numberOfLines={1}
                  >
                    {item.last_message ?? 'No messages yet'}
                  </Text>
                  {unread > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadCount}>{unread > 99 ? '99+' : unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  newBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, height: 38, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  convRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  convName: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', flex: 1 },
  convTime: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  convLastMsg: { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minWidth: 20 },
  unreadCount: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 76 },
});

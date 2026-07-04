import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import type { Message } from '@/types/database';

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const { id: conversationId, username } = useLocalSearchParams<{ id: string; username: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: messages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(id, username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const sendMessage = async () => {
    if (!text.trim() || !user?.id || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: 'text',
    });
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    setSending(false);
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <UserAvatar uri={(item as any).sender?.avatar_url} name={(item as any).sender?.username} size={28} />
        )}
        <View style={{ maxWidth: '72%' }}>
          <View style={[
            styles.bubble,
            isMine
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
          ]}>
            {item.media_url ? (
              <View style={{ width: 180, height: 180, backgroundColor: colors.muted, borderRadius: 8 }}>
                <Ionicons name="image" size={40} color={colors.mutedForeground} style={{ margin: 'auto' }} />
              </View>
            ) : null}
            {item.content ? (
              <Text style={[styles.bubbleText, { color: isMine ? '#fff' : colors.foreground }]}>
                {item.content}
              </Text>
            ) : null}
          </View>
          <View style={[styles.msgMeta, isMine && { justifyContent: 'flex-end' }]}>
            <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{timeLabel(item.created_at)}</Text>
            {isMine && item.is_read && (
              <Ionicons name="checkmark-done" size={12} color={colors.primary} />
            )}
          </View>
        </View>
      </View>
    );
  }, [user?.id, colors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{username || 'Chat'}</Text>
          <Text style={styles.headerSub}>Active now</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="call-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="videocam-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages ?? []}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
        <TouchableOpacity style={styles.attach}>
          <Ionicons name="attach" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.attach}>
          <Ionicons name="image-outline" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.muted, color: colors.foreground }]}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={2000}
          returnKeyType="send"
          enablesReturnKeyAutomatically
        />
        {text.trim() ? (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={sendMessage}
            disabled={sending}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.attach}>
            <Ionicons name="mic-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, paddingHorizontal: 4 },
  msgTime: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  attach: { padding: 6 },
  chatInput: { flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 120 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});

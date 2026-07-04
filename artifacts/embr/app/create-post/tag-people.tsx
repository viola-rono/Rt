import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useCreatePost } from '@/contexts/CreatePostContext';
import { UserAvatar } from '@/components/UserAvatar';
import { GradientButton } from '@/components/GradientButton';
import type { Profile } from '@/types/database';

export default function TagPeopleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { setTaggedIds } = useCreatePost();
  const [search, setSearch] = useState('');
  const [tagged, setTagged] = useState<Profile[]>([]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: results } = useQuery({
    queryKey: ['tag-search', search],
    queryFn: async () => {
      if (search.length < 1) return [];
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id ?? '')
        .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(20);
      return (data ?? []) as Profile[];
    },
    enabled: search.length >= 1,
  });

  const toggle = (p: Profile) => {
    setTagged(prev =>
      prev.find(t => t.id === p.id)
        ? prev.filter(t => t.id !== p.id)
        : [...prev, p]
    );
  };

  const confirm = () => {
    setTaggedIds(tagged.map(t => t.id));
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Tag People</Text>
        {tagged.length > 0 ? (
          <GradientButton label={`Done (${tagged.length})`} onPress={confirm} small />
        ) : <View style={{ width: 60 }} />}
      </View>

      {/* Tagged chips */}
      {tagged.length > 0 && (
        <View style={styles.tagged}>
          {tagged.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, { backgroundColor: colors.primary + '20' }]}
              onPress={() => toggle(t)}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>@{t.username}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.muted, margin: 16, marginTop: tagged.length > 0 ? 8 : 16 }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or username..."
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
      </View>

      <FlatList
        data={results ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        ListEmptyComponent={
          search.length < 1
            ? <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>Search for people to tag</Text>
              </View>
            : null
        }
        renderItem={({ item }) => {
          const isTagged = tagged.some(t => t.id === item.id);
          return (
            <TouchableOpacity
              style={[styles.personRow, { borderBottomColor: colors.border }]}
              onPress={() => toggle(item)}
              activeOpacity={0.75}
            >
              <UserAvatar uri={item.avatar_url} name={item.username} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.personName, { color: colors.foreground }]}>{item.full_name || item.username}</Text>
                <Text style={[styles.personHandle, { color: colors.mutedForeground }]}>@{item.username}</Text>
              </View>
              <View style={[
                styles.checkCircle,
                { borderColor: isTagged ? colors.primary : colors.border },
                isTagged && { backgroundColor: colors.primary },
              ]}>
                {isTagged && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  tagged: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  personRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  personName: { fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  personHandle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center' },
});

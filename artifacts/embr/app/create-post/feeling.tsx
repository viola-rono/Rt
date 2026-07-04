import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCreatePost } from '@/contexts/CreatePostContext';

const FEELINGS = [
  { label: 'happy', icon: '😊' },
  { label: 'loved', icon: '🥰' },
  { label: 'excited', icon: '🤩' },
  { label: 'thankful', icon: '🙏' },
  { label: 'blessed', icon: '😇' },
  { label: 'amazing', icon: '😄' },
  { label: 'sad', icon: '😢' },
  { label: 'angry', icon: '😠' },
  { label: 'tired', icon: '😴' },
  { label: 'sick', icon: '🤒' },
  { label: 'nervous', icon: '😰' },
  { label: 'surprised', icon: '😲' },
  { label: 'confused', icon: '😕' },
  { label: 'hopeful', icon: '🌟' },
  { label: 'motivated', icon: '💪' },
  { label: 'relaxed', icon: '😌' },
  { label: 'proud', icon: '🥳' },
  { label: 'heartbroken', icon: '💔' },
  { label: 'bored', icon: '😑' },
  { label: 'loved', icon: '❤️' },
  { label: 'determined', icon: '🎯' },
  { label: 'grateful', icon: '🤗' },
  { label: 'adventurous', icon: '🗺️' },
  { label: 'creative', icon: '🎨' },
];

export default function FeelingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setFeeling } = useCreatePost();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = FEELINGS.filter(f => f.label.includes(search.toLowerCase()));

  const select = (feeling: { label: string; icon: string }) => {
    setFeeling(feeling);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>How are you feeling?</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={[styles.searchBar, { backgroundColor: colors.muted, margin: 16 }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search feelings..."
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.label}-${i}`}
        numColumns={2}
        columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 8, paddingBottom: botPad + 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.feelingCard, { backgroundColor: colors.card, flex: 1 }]}
            onPress={() => select(item)}
            activeOpacity={0.75}
          >
            <Text style={styles.feelingIcon}>{item.icon}</Text>
            <Text style={[styles.feelingLabel, { color: colors.foreground }]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  feelingCard: { alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  feelingIcon: { fontSize: 32 },
  feelingLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCreatePost } from '@/contexts/CreatePostContext';

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl60: string;
  previewUrl?: string;
  collectionName?: string;
}

export default function MusicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { setSong } = useCreatePost();
  const [results, setResults] = useState<ItunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const searchMusic = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20`
      );
      const json = await res.json();
      setResults(json.results ?? []);
    } catch { setResults([]); }
    setLoading(false);
  };

  let searchTimeout: ReturnType<typeof setTimeout>;
  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchMusic(val), 600);
  };

  const selectTrack = (track: ItunesTrack) => {
    setSong({ title: track.trackName, artist: track.artistName });
    router.back();
  };

  const TRENDING = [
    'Flowers Miley Cyrus',
    'Cruel Summer Taylor Swift',
    'As It Was Harry Styles',
    'Levitating Dua Lipa',
    'Blinding Lights The Weeknd',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Music</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.muted, margin: 16 }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search songs, artists..."
          placeholderTextColor={colors.mutedForeground}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => searchMusic(query)}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Trending quick search */}
      {!query && (
        <>
          <Text style={[styles.section, { color: colors.mutedForeground }]}>TRENDING</Text>
          <View style={styles.trending}>
            {TRENDING.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.trendingChip, { backgroundColor: colors.card }]}
                onPress={() => handleSearch(t)}
              >
                <Ionicons name="trending-up" size={12} color={colors.primary} />
                <Text style={[styles.trendingText, { color: colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {results.length > 0 && (
        <Text style={[styles.section, { color: colors.mutedForeground }]}>RESULTS</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={item => String(item.trackId)}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.trackRow, { borderBottomColor: colors.border }]}
            onPress={() => selectTrack(item)}
            activeOpacity={0.75}
          >
            <Image source={{ uri: item.artworkUrl60 }} style={styles.artwork} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackName, { color: colors.foreground }]} numberOfLines={1}>{item.trackName}</Text>
              <Text style={[styles.artistName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.artistName} · {item.collectionName ?? ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.selectBtn} onPress={() => selectTrack(item)}>
              <LinearGradientInline />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query.length > 0
            ? <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="musical-notes-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>No songs found for "{query}"</Text>
              </View>
            : null
        }
      />
    </View>
  );
}

// Mini inline gradient select button
function LinearGradientInline() {
  const colors = useColors();
  return (
    <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
      <Ionicons name="add" size={16} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  section: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 },
  trending: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  trendingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  trendingText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  artwork: { width: 50, height: 50, borderRadius: 8 },
  trackName: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  artistName: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  selectBtn: {},
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center' },
});

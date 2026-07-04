import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useCreatePost } from '@/contexts/CreatePostContext';

const POPULAR = [
  'New York, USA', 'London, UK', 'Paris, France', 'Tokyo, Japan',
  'Sydney, Australia', 'Dubai, UAE', 'Toronto, Canada', 'Berlin, Germany',
  'Los Angeles, USA', 'Singapore',
];

export default function LocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const { setLocation: setContextLocation } = useCreatePost();
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (query.length > 1) {
      const filtered = POPULAR.filter(p => p.toLowerCase().includes(query.toLowerCase()));
      setResults(filtered.length > 0 ? filtered : [`${query}`, `${query}, USA`, `${query}, UK`]);
    } else {
      setResults([]);
    }
  }, [query]);

  const getCurrentLocation = async () => {
    setLoadingCurrent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoadingCurrent(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geocode.length > 0) {
        const g = geocode[0];
        const loc_str = [g.city, g.country].filter(Boolean).join(', ');
        setCurrentLocation(loc_str);
        selectLocation(loc_str);
      }
    } catch { /* ignore */ }
    setLoadingCurrent(false);
  };

  const selectLocation = (loc: string) => {
    setContextLocation(loc);
    router.back();
  };

  const displayList = query.length > 1 ? results : POPULAR;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Location</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search location..."
            placeholderTextColor={colors.mutedForeground}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.currentBtn, { backgroundColor: colors.card }]}
          onPress={getCurrentLocation}
          disabled={loadingCurrent}
        >
          {loadingCurrent ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="locate" size={18} color={colors.primary} />
          )}
          <Text style={[styles.currentLabel, { color: colors.primary }]}>Use current location</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.section, { color: colors.mutedForeground }]}>
        {query.length > 1 ? 'RESULTS' : 'POPULAR LOCATIONS'}
      </Text>

      <FlatList
        data={displayList}
        keyExtractor={item => item}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.locationRow, { borderBottomColor: colors.border }]}
            onPress={() => selectLocation(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.locationIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.locationName, { color: colors.foreground }]}>{item}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
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
  currentBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  currentLabel: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  section: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  locationIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  locationName: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
});

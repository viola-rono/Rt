import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import type { Profile } from '@/types/database';

interface StoryUser {
  id: string;
  profile: Profile;
  hasStory: boolean;
  hasUnviewedStory: boolean;
}

interface StoryBarProps {
  currentUserProfile: Profile | null;
  storyUsers: StoryUser[];
  onAddStory: () => void;
  onViewStory: (userId: string) => void;
}

export function StoryBar({ currentUserProfile, storyUsers, onAddStory, onViewStory }: StoryBarProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Your story */}
      <TouchableOpacity style={styles.storyItem} onPress={onAddStory} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          {currentUserProfile?.avatar_url ? (
            <Image
              source={{ uri: currentUserProfile.avatar_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
              <Ionicons name="person" size={22} color={colors.mutedForeground} />
            </View>
          )}
          <View style={[styles.addBtn, { backgroundColor: colors.primary, borderColor: colors.card }]}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>Your Story</Text>
      </TouchableOpacity>

      {/* Other users */}
      {storyUsers.map(u => (
        <TouchableOpacity
          key={u.id}
          style={styles.storyItem}
          onPress={() => onViewStory(u.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={u.hasUnviewedStory
              ? [colors.gradientStart, colors.gradientEnd]
              : [colors.border, colors.border]}
            style={styles.storyRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.innerRing, { borderColor: colors.card }]}>
              {u.profile.avatar_url ? (
                <Image
                  source={{ uri: u.profile.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                  <Ionicons name="person" size={22} color={colors.mutedForeground} />
                </View>
              )}
            </View>
          </LinearGradient>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {u.profile.username}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingVertical: 12, gap: 14 },
  storyItem: { alignItems: 'center', gap: 6, width: 64 },
  avatarWrap: { width: 64, height: 64, position: 'relative' },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 2 },
  innerRing: { flex: 1, borderRadius: 30, borderWidth: 2, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  name: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', width: 60 },
});

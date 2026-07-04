import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.skeletonBase, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonPost() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width={120} height={12} />
          <SkeletonBox width={80} height={10} />
        </View>
      </View>
      <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonBox width="80%" height={14} style={{ marginBottom: 12 }} />
      <SkeletonBox width="100%" height={200} borderRadius={12} style={{ marginBottom: 12 }} />
      <View style={styles.actionRow}>
        <SkeletonBox width={60} height={14} />
        <SkeletonBox width={60} height={14} />
        <SkeletonBox width={60} height={14} />
      </View>
    </View>
  );
}

export function SkeletonStory() {
  return (
    <View style={{ alignItems: 'center', gap: 6, marginRight: 12 }}>
      <SkeletonBox width={60} height={60} borderRadius={30} />
      <SkeletonBox width={50} height={10} />
    </View>
  );
}

export function SkeletonNotification() {
  return (
    <View style={styles.notifRow}>
      <SkeletonBox width={46} height={46} borderRadius={23} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="80%" height={12} />
        <SkeletonBox width="50%" height={10} />
      </View>
      <SkeletonBox width={40} height={40} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
});

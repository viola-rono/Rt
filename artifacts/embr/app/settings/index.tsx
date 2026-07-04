import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  destructive?: boolean;
}

function SettingRow({ icon, iconBg, label, value, onPress, toggle, toggleValue, onToggle, destructive }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={toggle || !onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/settings/edit-profile')}
          activeOpacity={0.85}
        >
          <UserAvatar uri={profile?.avatar_url} name={profile?.username} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile?.full_name || profile?.username}</Text>
            <Text style={[styles.profileHandle, { color: colors.mutedForeground }]}>@{profile?.username}</Text>
            <Text style={[styles.editProfile, { color: colors.primary }]}>Edit Profile →</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Account */}
        <Section title="ACCOUNT">
          <SettingRow icon="person-outline" iconBg="#4A90E2" label="Personal Information" onPress={() => router.push('/settings/edit-profile')} />
          <SettingRow icon="lock-closed-outline" iconBg="#9B59B6" label="Privacy" onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" iconBg="#22C55E" label="Security" onPress={() => {}} />
          <SettingRow icon="key-outline" iconBg="#F7941D" label="Change Password" onPress={() => {}} />
          <SettingRow icon="eye-outline" iconBg="#3498DB" label="Profile Visibility" value="Public" onPress={() => {}} />
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <SettingRow icon="notifications-outline" iconBg="#FF416C" label="Push Notifications" toggle toggleValue={true} onToggle={() => {}} />
          <SettingRow icon="mail-outline" iconBg="#4A90E2" label="Email Notifications" toggle toggleValue={false} onToggle={() => {}} />
          <SettingRow icon="volume-medium-outline" iconBg="#F7941D" label="Sound" toggle toggleValue={true} onToggle={() => {}} />
        </Section>

        {/* Content */}
        <Section title="CONTENT">
          <SettingRow icon="globe-outline" iconBg="#22C55E" label="Language" value="English" onPress={() => {}} />
          <SettingRow icon="moon-outline" iconBg="#9B59B6" label="Dark Mode" toggle toggleValue={false} onToggle={() => {}} />
          <SettingRow icon="text-outline" iconBg="#3498DB" label="Font Size" value="Default" onPress={() => {}} />
          <SettingRow icon="wifi-outline" iconBg="#F7941D" label="Data Saver" toggle toggleValue={false} onToggle={() => {}} />
        </Section>

        {/* Support */}
        <Section title="SUPPORT">
          <SettingRow icon="help-circle-outline" iconBg="#4A90E2" label="Help Center" onPress={() => {}} />
          <SettingRow icon="chatbubble-ellipses-outline" iconBg="#22C55E" label="Contact Us" onPress={() => {}} />
          <SettingRow icon="star-outline" iconBg="#F7941D" label="Rate Embr" onPress={() => {}} />
          <SettingRow icon="document-text-outline" iconBg="#9B59B6" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="information-circle-outline" iconBg="#3498DB" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="code-outline" iconBg="#95A5A6" label="App Version" value="1.0.0" />
        </Section>

        {/* Danger zone */}
        <Section title="ACCOUNT ACTIONS">
          <SettingRow icon="log-out-outline" iconBg="#FF416C" label="Sign Out" destructive onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]);
          }} />
          <SettingRow icon="trash-outline" iconBg="#CC0000" label="Delete Account" destructive onPress={() => {
            Alert.alert('Delete Account', 'This action cannot be undone. All your data will be permanently deleted.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {} },
            ]);
          }} />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  content: { padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  profileName: { fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  profileHandle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  editProfile: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  rowValue: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginRight: 6 },
});

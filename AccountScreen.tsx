import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import { userStorage } from '../storage/userStorage';
import { ParentProfile } from '../types/user.types';
import CustomHeader from '../components/CustomHeader';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [user, setUser] = useState<ParentProfile | null>(null);

  // Sayfa her açıldığında verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const userData = await userStorage.getUser();
    if (userData) {
      setUser(userData);
    }
  };

  const child = user?.children[0];

  const handleLogout = () => {
    Alert.alert(
      'Oturum Kapat',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await userStorage.removeUser();
              // Navigation stack'i sıfırla ve Welcome'a yönlendir
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' as never }],
                })
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const ProfileHeader = () => {
    if (!user) return null;
    
    return (
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileUsername}>@{user.username}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightElement,
  }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        showArrow && <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const handleBackPress = () => {
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Account is a tab screen; safest is to switch to Home.
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader title="Hesap" showBack onBackPress={handleBackPress} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Header */}
        <ProfileHeader />

        {/* Çocuk Bilgileri */}
        {child && (
          <View style={styles.section}>
            <SectionHeader title="Çocuk Bilgileri" />
            
            <TouchableOpacity
              style={styles.childCard}
              onPress={() => {
                if (!child.id) {
                  Alert.alert('Hata', 'Çocuk bilgileri bulunamadı');
                  return;
                }
                navigation.navigate('ChildProfile', { childId: child.id });
              }}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>{child.name[0]}</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childDetails}>
                  {child.gender === 'male' ? '👦 Erkek' : '👧 Kız'} • {child.bloodType || 'Belirtilmemiş'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <SectionHeader title="Hesap Ayarları" />
          
          <MenuItem
            icon="create-outline"
            title="Profil Düzenle"
            subtitle="Ad, e-posta, telefon, şifre"
            onPress={() => navigation.navigate('EditProfile' as never)}
          />
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <SectionHeader title="Bildirim Ayarları" />
          
          <MenuItem
            icon="notifications-outline"
            title="Bildirimleri Aç"
            subtitle="Uygulama bildirimleri"
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          
          <MenuItem
            icon="alarm-outline"
            title="Randevu Hatırlatıcıları"
            subtitle="Randevu öncesi bildirim"
            showArrow={false}
            rightElement={
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
        </View>

        {/* Uygulama Ayarları */}
        <View style={styles.section}>
          <SectionHeader title="Uygulama Ayarları" />
          
          <MenuItem
            icon="language-outline"
            title="Dil"
            subtitle="Türkçe"
            onPress={() => console.log('Language')}
          />
        </View>

        {/* Destek */}
        <View style={styles.section}>
          <SectionHeader title="Destek" />
          
          <MenuItem
            icon="chatbubble-outline"
            title="Geri Bildirim Gönder"
            onPress={() => console.log('Feedback')}
          />
        </View>

        {/* Tehlikeli İşlemler */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            <Text style={styles.logoutText}>Oturumu Kapat</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profileName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  profileUsername: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editProfileButton: {
    padding: SPACING.sm,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  sectionHeader: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.purple,
  },
  childInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  childName: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  childDetails: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  addChildText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    opacity: 0.7,
    gap: SPACING.sm,
  },
  deleteText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.error,
  },
});

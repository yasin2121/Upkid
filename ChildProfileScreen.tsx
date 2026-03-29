import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import { userStorage } from '../storage/userStorage';
import { Child, ParentProfile } from '../types/user.types';

export default function ChildProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const childId: string | undefined = route?.params?.childId;

  const [user, setUser] = useState<ParentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState(''); // DD/MM/YYYY
  const [bloodType, setBloodType] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await userStorage.getUser();
        setUser(userData);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const child: Child | undefined = useMemo(() => {
    if (!user || !childId) return undefined;
    return user.children.find((c) => c.id === childId);
  }, [user, childId]);

  const formatBirthDateForUI = (isoOrAny: string | undefined) => {
    if (!isoOrAny) return '';
    const dt = new Date(isoOrAny);
    if (Number.isNaN(dt.getTime())) return '';
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseBirthDateToISO = (ddmmyyyy: string) => {
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(ddmmyyyy)) return null;
    const [day, month, year] = ddmmyyyy.split('/').map(Number);
    const dt = new Date(year, month - 1, day);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  useEffect(() => {
    if (!child) return;
    setName(child.name || '');
    setGender(child.gender);
    setBirthDate(formatBirthDateForUI(child.birthDate));
    setBloodType(child.bloodType || '');
    setHeight(typeof child.height === 'number' ? String(child.height) : '');
    setWeight(typeof child.weight === 'number' ? String(child.weight) : '');
  }, [child]);

  const handleBackPress = () => {
    if (isEditing) {
      Alert.alert('Değişiklikleri Kaydetmediniz', 'Değişiklikler kaydedilmeden çıkılsın mı?', [
        { text: 'Kal', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => {
            setIsEditing(false);
            if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('MainTabs', { screen: 'Account' });
          },
        },
      ]);
      return;
    }
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Account' });
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen çocuğun adını girin');
      return false;
    }
    if (!birthDate.trim()) {
      Alert.alert('Hata', 'Lütfen doğum tarihini girin');
      return false;
    }
    const iso = parseBirthDateToISO(birthDate.trim());
    if (!iso) {
      Alert.alert('Hata', 'Doğum tarihini GG/AA/YYYY formatında girin');
      return false;
    }
    if (height.trim() && !/^\d+$/.test(height.trim())) {
      Alert.alert('Hata', 'Boy sadece tam sayı olmalıdır');
      return false;
    }
    if (weight.trim() && !/^\d+$/.test(weight.trim())) {
      Alert.alert('Hata', 'Kilo sadece tam sayı olmalıdır');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !child) return;
    if (!validateForm()) return;

    const birthISO = parseBirthDateToISO(birthDate.trim());
    if (!birthISO) return;

    setSaving(true);
    try {
      const updatedChild: Child = {
        ...child,
        name: name.trim(),
        gender,
        birthDate: birthISO,
        bloodType: bloodType.trim() ? bloodType.trim() : undefined,
        height: height.trim() ? parseInt(height.trim(), 10) : undefined,
        weight: weight.trim() ? parseInt(weight.trim(), 10) : undefined,
      };

      const updatedUser: ParentProfile = {
        ...user,
        children: user.children.map((c) => (c.id === child.id ? updatedChild : c)),
      };

      await userStorage.saveUser(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Başarılı', 'Çocuk bilgileri güncellendi');
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!child) {
      setIsEditing(false);
      return;
    }
    setName(child.name || '');
    setGender(child.gender);
    setBirthDate(formatBirthDateForUI(child.birthDate));
    setBloodType(child.bloodType || '');
    setHeight(typeof child.height === 'number' ? String(child.height) : '');
    setWeight(typeof child.weight === 'number' ? String(child.weight) : '');
    setIsEditing(false);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );

  const InputRow = ({ label, value, onChangeText, placeholder, keyboardType }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader
          title="Çocuk Bilgileri"
          showBack
          onBackPress={handleBackPress}
          rightComponent={
            !isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : !child ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Çocuk bulunamadı</Text>
              <Text style={styles.emptySubtitle}>Bilgiler yüklenemedi.</Text>
            </View>
          ) : (
            <>
              <View style={styles.profileCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(isEditing ? name : child.name)?.[0] || '?'}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{isEditing ? name || child.name : child.name}</Text>
                  <Text style={styles.subtitle}>
                    {(isEditing ? gender : child.gender) === 'male' ? '👦 Erkek' : '👧 Kız'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Genel Bilgiler</Text>
              <View style={styles.card}>
                {!isEditing ? (
                  <>
                    <InfoRow label="Doğum Tarihi" value={formatBirthDateForUI(child.birthDate) || 'Belirtilmemiş'} />
                    <InfoRow label="Kan Grubu" value={child.bloodType || 'Belirtilmemiş'} />
                    <InfoRow label="Boy" value={typeof child.height === 'number' ? `${child.height} cm` : 'Belirtilmemiş'} />
                    <InfoRow label="Kilo" value={typeof child.weight === 'number' ? `${child.weight} kg` : 'Belirtilmemiş'} />
                  </>
                ) : (
                  <>
                    <InputRow
                      label="Ad"
                      value={name}
                      onChangeText={setName}
                      placeholder="Çocuk adı"
                    />

                    <Text style={styles.inputLabel}>Cinsiyet</Text>
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                        onPress={() => setGender('male')}
                      >
                        <Ionicons name="male" size={18} color={gender === 'male' ? COLORS.white : COLORS.primary} />
                        <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Erkek</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                        onPress={() => setGender('female')}
                      >
                        <Ionicons name="female" size={18} color={gender === 'female' ? COLORS.white : COLORS.error} />
                        <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Kız</Text>
                      </TouchableOpacity>
                    </View>

                    <InputRow
                      label="Doğum Tarihi (GG/AA/YYYY)"
                      value={birthDate}
                      onChangeText={setBirthDate}
                      placeholder="15/03/2023"
                      keyboardType="numeric"
                    />

                    <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <InputRow
                          label="Boy (cm)"
                          value={height}
                          onChangeText={setHeight}
                          placeholder="70"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.halfInput}>
                        <InputRow
                          label="Kilo (kg)"
                          value={weight}
                          onChangeText={setWeight}
                          placeholder="6"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Kan Grubu</Text>
                    <View style={styles.bloodTypeContainer}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.bloodTypeButton,
                            bloodType === type && styles.bloodTypeButtonActive,
                          ]}
                          onPress={() => setBloodType(type)}
                        >
                          <Text
                            style={[
                              styles.bloodTypeText,
                              bloodType === type && styles.bloodTypeTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[styles.bloodTypeButton, !bloodType && styles.bloodTypeButtonActive]}
                        onPress={() => setBloodType('')}
                      >
                        <Text style={[styles.bloodTypeText, !bloodType && styles.bloodTypeTextActive]}>
                          Belirtilmemiş
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.editButtonsRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                        disabled={saving}
                      >
                        <Text style={styles.cancelButtonText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color={COLORS.white} />
                            <Text style={styles.saveButtonText}>Kaydet</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.purple,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sectionHeader: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  bloodTypeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  bloodTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bloodTypeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  bloodTypeTextActive: {
    color: COLORS.white,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.white,
  },
  rowLabel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
  },
  loadingText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

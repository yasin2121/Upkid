import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import { userStorage } from '../storage/userStorage';
import { ParentProfile, Child } from '../types/user.types';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const safeGoBack = () => {
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate?.('MainTabs', { screen: 'Account' });
  };

  // Ebeveyn bilgileri
  const [parentName, setParentName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Çocuk bilgileri
  const [childName, setChildName] = useState('');
  const [childSex, setChildSex] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Orijinal veriler (değişiklik kontrolü için)
  const [originalData, setOriginalData] = useState<ParentProfile | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await userStorage.getUser();
      if (user) {
        setOriginalData(user);
        
        // Ebeveyn bilgilerini doldur
        setParentName(user.name);
        setUsername(user.username);
        setEmail(user.email);
        setPhone(user.phone || '');

        // İlk çocuğun bilgilerini doldur
        if (user.children && user.children.length > 0) {
          const child = user.children[0];
          setChildName(child.name);
          setChildSex(child.gender);
          
          // ISO tarihini GG/AA/YYYY formatına çevir
          const date = new Date(child.birthDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          setBirthDate(`${day}/${month}/${year}`);

          setWeight(child.weight?.toString() || '');
          setHeight(child.height?.toString() || '');
          setBloodType(child.bloodType || '');
        }
        
        // Veriler yüklendikten sonra değişiklik yapılabilir hale getir
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!parentName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Hata', 'Lütfen kullanıcı adı girin');
      return false;
    }
    if (username.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalıdır');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen email adresinizi girin');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir email adresi girin');
      return false;
    }
    if (!childName.trim()) {
      Alert.alert('Hata', 'Lütfen bebeğinizin adını girin');
      return false;
    }
    if (!birthDate.trim()) {
      Alert.alert('Hata', 'Lütfen doğum tarihini girin');
      return false;
    }

    // Tarih formatı kontrolü
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(birthDate)) {
      Alert.alert('Hata', 'Doğum tarihini GG/AA/YYYY formatında girin');
      return false;
    }

    if (weight.trim() && !/^\d+$/.test(weight.trim())) {
      Alert.alert('Hata', 'Kilo sadece tam sayı olmalıdır');
      return false;
    }
    if (height.trim() && !/^\d+$/.test(height.trim())) {
      Alert.alert('Hata', 'Boy sadece tam sayı olmalıdır');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!originalData) return;

    setSaving(true);
    try {
      // Doğum tarihini ISO formatına çevir
      const [day, month, year] = birthDate.split('/').map(Number);
      const birthDateISO = new Date(year, month - 1, day).toISOString();

      const updatedChild: Child = {
        ...originalData.children[0],
        name: childName,
        gender: childSex,
        birthDate: birthDateISO,
        weight: weight.trim() ? parseInt(weight.trim(), 10) : undefined,
        height: height.trim() ? parseInt(height.trim(), 10) : undefined,
        bloodType: bloodType || undefined,
      };

      const updatedUser: ParentProfile = {
        ...originalData,
        name: parentName,
        username: username,
        email: email,
        phone: phone || undefined,
        children: [updatedChild],
      };

      await userStorage.saveUser(updatedUser);
      
      Alert.alert(
        'Başarılı!',
        'Profiliniz güncellendi',
        [{ text: 'Tamam', onPress: safeGoBack }]
      );
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Değişiklikleri Kaydetmediniz',
        'Değişiklikler kaydedilmeden çıkılsın mı?',
        [
          { text: 'Kal', style: 'cancel' },
          { text: 'Çık', style: 'destructive', onPress: safeGoBack },
        ]
      );
    } else {
      safeGoBack();
    }
  };

  const markAsChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const parentLabel = (name: string) => {
    const n = name.trim();
    if (!n) return 'Bebeğinizin ebeveyni';
    return `${n}'in ebeveyni`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Düzenle</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Avatarı */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {parentName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Ionicons name="camera" size={20} color={COLORS.primary} />
            <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
          </TouchableOpacity>
        </View>

        {/* Ebeveyn Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{parentLabel(childName)}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={parentName}
              onChangeText={(text) => {
                setParentName(text);
                markAsChanged();
              }}
              placeholder="Adınız Soyadınız"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                markAsChanged();
              }}
              placeholder="Kullanıcı Adınız"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                markAsChanged();
              }}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                markAsChanged();
              }}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Çocuk Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Çocuk Bilgileri</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad</Text>
            <TextInput
              style={styles.input}
              value={childName}
              onChangeText={(text) => {
                setChildName(text);
                markAsChanged();
              }}
              placeholder="Bebek Adı"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cinsiyet</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  childSex === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => {
                  setChildSex('male');
                  markAsChanged();
                }}
              >
                <Ionicons
                  name="male"
                  size={20}
                  color={childSex === 'male' ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.genderText,
                    childSex === 'male' && styles.genderTextActive,
                  ]}
                >
                  Erkek
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  childSex === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => {
                  setChildSex('female');
                  markAsChanged();
                }}
              >
                <Ionicons
                  name="female"
                  size={20}
                  color={childSex === 'female' ? COLORS.white : COLORS.error}
                />
                <Text
                  style={[
                    styles.genderText,
                    childSex === 'female' && styles.genderTextActive,
                  ]}
                >
                  Kız
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doğum Tarihi (GG/AA/YYYY)</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => {
                setBirthDate(text);
                markAsChanged();
              }}
              placeholder="15/03/2023"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Kilo (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(text) => {
                  setWeight(text);
                  markAsChanged();
                }}
                placeholder="12"
                keyboardType="number-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Boy (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={(text) => {
                  setHeight(text);
                  markAsChanged();
                }}
                placeholder="84"
                keyboardType="number-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kan Grubu</Text>
            <View style={styles.bloodTypeContainer}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeButton,
                    bloodType === type && styles.bloodTypeButtonActive,
                  ]}
                  onPress={() => {
                    setBloodType(type);
                    markAsChanged();
                  }}
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
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Kaydet Butonu */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.base,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
  },
  changePhotoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
    marginLeft: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  bloodTypeButton: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginHorizontal: '1.5%',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bloodTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bloodTypeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  bloodTypeTextActive: {
    color: COLORS.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
});

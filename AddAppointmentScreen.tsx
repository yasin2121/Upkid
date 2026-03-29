import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import type { RootStackParamList } from '../types';
import { userStorage } from '../storage/userStorage';
import { appointmentStorage } from '../storage/appointmentStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddAppointmentRouteProp = RouteProp<RootStackParamList, 'AddAppointment'>;
type EditAppointmentRouteProp = RouteProp<RootStackParamList, 'EditAppointment'>;

function parseDdMmYyyy(value: string): Date | null {
  const trimmed = value.trim();
  const match = /^\d{2}-\d{2}-\d{4}$/.test(trimmed);
  if (!match) return null;

  const [dStr, mStr, yStr] = trimmed.split('-');
  const d = Number(dStr);
  const m = Number(mStr);
  const y = Number(yStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function parseHhMm(value: string): Date | null {
  const trimmed = value.trim();
  const match = /^\d{2}:\d{2}$/.test(trimmed);
  if (!match) return null;
  const [hStr, mStr] = trimmed.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const dt = new Date();
  dt.setHours(h, m, 0, 0);
  return dt;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDdMmYyyy(date: Date): string {
  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function isValidDdMmYyyy(value: string): boolean {
  const trimmed = value.trim();
  const match = /^\d{2}-\d{2}-\d{4}$/.test(trimmed);
  if (!match) return false;

  const [dStr, mStr, yStr] = trimmed.split('-');
  const d = Number(dStr);
  const m = Number(mStr);
  const y = Number(yStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;

  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function formatHhMm(date: Date): string {
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${hh}:${mm}`;
}

function isValidHhMm(value: string): boolean {
  const trimmed = value.trim();
  const match = /^\d{2}:\d{2}$/.test(trimmed);
  if (!match) return false;
  const [hStr, mStr] = trimmed.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  return Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export default function AddAppointmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddAppointmentRouteProp | EditAppointmentRouteProp>();

  const isEdit = route.name === 'EditAppointment';
  const editingId = isEdit ? (route.params as any)?.appointmentId : undefined;

  const [doctorName, setDoctorName] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Appointments' });
  };

  useEffect(() => {
    if (!isEdit || !editingId) return;
    let mounted = true;

    (async () => {
      const user = await userStorage.getUser();
      const childId = user?.children?.[0]?.id ?? 'child-1';
      const items = await appointmentStorage.get(childId);
      const found = items.find((x) => x.id === editingId);
      if (!mounted || !found) return;

      setDoctorName(found.doctorName);
      setTitle(found.title);
      setDate(found.date);
      setTime(found.time);
      setLocation(found.location);
      setDetails(found.details);

      const parsedDate = parseDdMmYyyy(found.date);
      const parsedTime = parseHhMm(found.time);
      setSelectedDate(parsedDate);
      setSelectedTime(parsedTime);
    })();

    return () => {
      mounted = false;
    };
  }, [isEdit, editingId]);

  const canSave = useMemo(() => {
    return (
      !isSaving &&
      doctorName.trim().length > 0 &&
      title.trim().length > 0 &&
      isValidDdMmYyyy(date) &&
      isValidHhMm(time) &&
      location.trim().length > 0 &&
      details.trim().length > 0
    );
  }, [doctorName, title, date, time, location, details, isSaving]);

  const handleDateChange = (_event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (!picked) return;
    setSelectedDate(picked);
    setDate(formatDdMmYyyy(picked));
  };

  const handleTimeChange = (_event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (!picked) return;
    setSelectedTime(picked);
    setTime(formatHhMm(picked));
  };

  const handleSave = async () => {
    const trimmedDoctorName = doctorName.trim();
    const trimmedTitle = title.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedLocation = location.trim();
    const trimmedDetails = details.trim();

    if (!trimmedDoctorName) {
      Alert.alert('Hata', 'Lütfen doktor adını girin');
      return;
    }

    if (!trimmedTitle) {
      Alert.alert('Hata', 'Lütfen randevu adını girin');
      return;
    }

    if (!isValidDdMmYyyy(trimmedDate)) {
      Alert.alert('Hata', 'Tarihi GG-AA-YYYY formatında seçin (örn: 28-12-2025)');
      return;
    }

    if (!isValidHhMm(trimmedTime)) {
      Alert.alert('Hata', 'Lütfen saat seçin (örn: 14:30)');
      return;
    }

    if (!trimmedLocation) {
      Alert.alert('Hata', 'Lütfen konum girin');
      return;
    }

    if (!trimmedDetails) {
      Alert.alert('Hata', 'Lütfen randevu detayını girin');
      return;
    }

    try {
      setIsSaving(true);
      const user = await userStorage.getUser();
      const childId = user?.children?.[0]?.id ?? 'child-1';

      if (isEdit && editingId) {
        const prev = await appointmentStorage.get(childId);
        const existing = prev.find((x) => x.id === editingId);
        const next = prev.map((x) => {
          if (x.id !== editingId) return x;
          return {
            ...x,
            doctorName: trimmedDoctorName,
            title: trimmedTitle,
            date: trimmedDate,
            time: trimmedTime,
            location: trimmedLocation,
            details: trimmedDetails,
            createdAt: existing?.createdAt ?? x.createdAt,
          };
        });
        await appointmentStorage.save(childId, next);
      } else {
        await appointmentStorage.add(childId, {
          id: Date.now().toString(),
          doctorName: trimmedDoctorName,
          title: trimmedTitle,
          date: trimmedDate,
          time: trimmedTime,
          location: trimmedLocation,
          details: trimmedDetails,
        });
      }
    } catch {
      Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
      return;
    } finally {
      setIsSaving(false);
    }

    handleBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => {
            handleBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Randevu Düzenle' : 'Randevu Ekle'}</Text>
        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doktor Adı</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Örn: Dr. Ayşe Yılmaz"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Randevu Adı</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Kontrol Muayenesi"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tarih (GG-AA-YYYY)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.9}
            >
              <Text style={[styles.dateInputText, !date && styles.dateInputPlaceholder]}>
                {date || '28-12-2025'}
              </Text>
              <Ionicons name="calendar" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Saat (HH:mm)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.9}
            >
              <Text style={[styles.dateInputText, !time && styles.dateInputPlaceholder]}>
                {time || '14:30'}
              </Text>
              <Ionicons name="time" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime ?? new Date()}
                mode="time"
                display={Platform.OS === 'android' ? 'clock' : 'default'}
                onChange={handleTimeChange}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Konum</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Örn: İstanbul - Çocuk Hastanesi"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Randevu Detayı</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={details}
              onChangeText={setDetails}
              placeholder="Örn: Yapılacak işlemler, notlar vb."
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (!canSave || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.9}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.base,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...SHADOWS.sm,
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  dateInputPlaceholder: {
    color: COLORS.textSecondary,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.white,
  },
});

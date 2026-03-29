import React, { useMemo, useState } from 'react';
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
import { vaccinationStorage } from '../storage/vaccinationStorage';

export type AddedVaccinePayload = {
  id: string;
  name: string;
  date: string; // GG-AA-YYYY
  time: string; // HH:mm
  note: string;
  isDone: boolean;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'AddVaccinationAppointment'>;

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

export default function AddVaccinationAppointmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const childId = route.params.childId;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('VaccinationCalendar', { childId });
    }
  };

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => {
    return (
      !isSaving &&
      name.trim().length > 0 &&
      isValidDdMmYyyy(date) &&
      isValidHhMm(time) &&
      note.trim().length > 0
    );
  }, [name, date, time, note, isSaving]);

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
    const trimmedName = name.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedNote = note.trim();

    if (!trimmedName) {
      Alert.alert('Hata', 'Lütfen aşı adını girin');
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

    if (!trimmedNote) {
      Alert.alert('Hata', 'Lütfen not girin');
      return;
    }

    const payload: AddedVaccinePayload = {
      id: Date.now().toString(),
      name: trimmedName,
      date: trimmedDate,
      time: trimmedTime,
      note: trimmedNote,
      isDone: false,
    };

    try {
      setIsSaving(true);
      await vaccinationStorage.add(childId, payload);
    } catch {
      Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
      return;
    } finally {
      setIsSaving(false);
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('VaccinationCalendar', { childId });
    }
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
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aşı Randevusu Ekle</Text>
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
            <Text style={styles.label}>Aşı Adı</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Hepatit A (1. doz)"
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
            <Text style={styles.label}>Not</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Örn: Hastane, doktor, hatırlatma vb."
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

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import CustomHeader from '../components/CustomHeader';
import type { RootStackParamList } from '../types';
import { userStorage } from '../storage/userStorage';
import { appointmentStorage, type StoredAppointment } from '../storage/appointmentStorage';
import { vaccinationStorage, type StoredVaccineAppointment } from '../storage/vaccinationStorage';

type FilterType = 'all' | 'upcoming' | 'completed';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AppointmentListItem = {
  id: string;
  sourceId: string;
  kind: 'appointment' | 'vaccination';
  title: string;
  date: string; // GG-AA-YYYY
  time: string; // HH:mm
  location: string;
  notes?: string;
  reminderEnabled: boolean;
  status: 'upcoming' | 'completed';
  doctor: { name: string; specialty?: string };
};

function parseDdMmYyyy(value: string): Date | null {
  const trimmed = value.trim();
  const match = /^\d{2}-\d{2}-\d{4}$/.test(trimmed);
  if (!match) return null;
  const [dStr, mStr, yStr] = trimmed.split('-');
  const d = Number(dStr);
  const m = Number(mStr);
  const y = Number(yStr);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function toListItem(x: StoredAppointment): AppointmentListItem {
  const parsedDate = parseDdMmYyyy(x.date);
  const now = new Date();
  const isUpcoming = parsedDate ? parsedDate.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : true;
  return {
    id: `appointment:${x.id}`,
    sourceId: x.id,
    kind: 'appointment',
    title: x.title,
    date: x.date,
    time: x.time,
    location: x.location,
    notes: x.details,
    reminderEnabled: Boolean(x.reminderEnabled),
    status: isUpcoming ? 'upcoming' : 'completed',
    doctor: { name: x.doctorName },
  };
}

function toVaccineListItem(x: StoredVaccineAppointment): AppointmentListItem {
  const parsedDate = parseDdMmYyyy(x.date);
  const now = new Date();
  const isUpcomingByDate = parsedDate ? parsedDate.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : true;
  const status: AppointmentListItem['status'] = x.isDone ? 'completed' : isUpcomingByDate ? 'upcoming' : 'completed';

  return {
    id: `vaccination:${x.id}`,
    sourceId: x.id,
    kind: 'vaccination',
    title: `Aşı: ${x.name}`,
    date: x.date,
    time: x.time,
    location: 'Aşı Takvimi',
    notes: x.note,
    reminderEnabled: false,
    status,
    doctor: { name: 'Aşı', specialty: '' },
  };
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [childId, setChildId] = useState('child-1');
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        const user = await userStorage.getUser();
        const resolvedChildId = user?.children?.[0]?.id ?? 'child-1';
        setChildId(resolvedChildId);
        const [items, vaccines] = await Promise.all([
          appointmentStorage.get(resolvedChildId),
          vaccinationStorage.get(resolvedChildId),
        ]);
        if (!mounted) return;

        const toSortKey = (x: AppointmentListItem): number => {
          const parsed = parseDdMmYyyy(x.date);
          if (!parsed) return Number.POSITIVE_INFINITY;
          const [hh, mm] = String(x.time ?? '00:00').split(':');
          const hours = Number(hh);
          const minutes = Number(mm);
          const dt = new Date(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate(),
            Number.isFinite(hours) ? hours : 0,
            Number.isFinite(minutes) ? minutes : 0
          );
          return dt.getTime();
        };

        const combined = [...items.map(toListItem), ...vaccines.map(toVaccineListItem)]
          .sort((a, b) => toSortKey(a) - toSortKey(b));

        setAppointments(combined);
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  // Filtreleme
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filter === 'all') return true;
      return apt.status === filter;
    });
  }, [appointments, filter]);

  // Randevu durumuna göre renk
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return COLORS.info;
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  // Randevu durumuna göre metin
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Yaklaşan';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const renderAppointmentCard = ({ item }: { item: AppointmentListItem }) => {
    const handleDetail = () => {
      if (item.kind === 'vaccination') {
        const note = item.notes?.trim();
        Alert.alert(
          item.title,
          `${item.date} • ${item.time}${note ? `\n\nNot: ${note}` : ''}`,
          [{ text: 'Kapat' }, { text: 'Takvime Git', onPress: () => navigation.navigate('VaccinationCalendar', { childId }) }]
        );
        return;
      }

      navigation.navigate('AppointmentDetail', { appointmentId: item.sourceId });
    };

    const handleEdit = () => {
      if (item.kind === 'vaccination') {
        navigation.navigate('VaccinationCalendar', { childId });
        return;
      }

      navigation.navigate('EditAppointment', { appointmentId: item.sourceId });
    };

    const handleReminder = async () => {
      if (item.kind === 'vaccination') {
        Alert.alert('Bilgi', 'Aşı hatırlatıcısı şu an yok.');
        return;
      }

      const nextEnabled = !item.reminderEnabled;
      setAppointments((prev) =>
        prev.map((x) => (x.kind === 'appointment' && x.sourceId === item.sourceId ? { ...x, reminderEnabled: nextEnabled } : x))
      );

      try {
        const stored = await appointmentStorage.get(childId);
        const next = stored.map((x) => (x.id === item.sourceId ? { ...x, reminderEnabled: nextEnabled } : x));
        await appointmentStorage.save(childId, next);
        Alert.alert('Başarılı', nextEnabled ? 'Hatırlatıcı açıldı.' : 'Hatırlatıcı kapatıldı.');
      } catch {
        Alert.alert('Hata', 'Hatırlatıcı güncellenemedi.');
      }
    };

    return (
      <View style={styles.appointmentCard}>
        <TouchableOpacity onPress={handleDetail} activeOpacity={0.9}>
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateDay}>
                {parseDdMmYyyy(item.date)?.getDate() ?? '--'}
              </Text>
              <Text style={styles.dateMonth}>
                {parseDdMmYyyy(item.date)?.toLocaleDateString('tr-TR', { month: 'short' }) ?? '--'}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>{item.title}</Text>
              <View style={styles.doctorInfo}>
                <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.doctorName}>{item.doctor.name}</Text>
              </View>
              {item.doctor.specialty ? (
                <Text style={styles.specialty}>{item.doctor.specialty}</Text>
              ) : null}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooter}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.time}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleReminder}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Hatırlatıcı</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.detailButton]} onPress={handleDetail}>
            <Text style={styles.detailButtonText}>Detay</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {/* Header ile Filtreler */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader
          title="Randevularım"
          showBack={true}
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          }}
          rightComponent={
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddAppointment')}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.white} />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            Tümü ({appointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'upcoming' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'upcoming' && styles.filterTextActive,
            ]}
          >
            Yaklaşan (
            {appointments.filter((a) => a.status === 'upcoming').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && styles.filterTextActive,
            ]}
          >
            Geçmiş (
            {appointments.filter((a) => a.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Randevu Listesi */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.gray300} />
            <Text style={styles.emptyText}>Randevu bulunamadı</Text>
            <Text style={styles.emptySubText}>
              Yeni randevu eklemek için + butonuna tıklayın
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  addButton: {
    padding: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dateDay: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    lineHeight: FONTS.sizes.xxl * 1.2,
  },
  dateMonth: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  doctorName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  specialty: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  cardFooter: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardYellow,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  notesText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  detailButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    justifyContent: 'center',
  },
  detailButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
  },
  emptySubText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

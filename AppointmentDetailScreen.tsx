import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import type { RootStackParamList } from '../types';
import { userStorage } from '../storage/userStorage';
import { appointmentStorage } from '../storage/appointmentStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteProp = {
  key: string;
  name: 'AppointmentDetail';
  params: { appointmentId: string };
};

export default function AppointmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute() as unknown as RouteProp;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Appointments' });
    }
  };

  const [localAppointment, setLocalAppointment] = useState<any | null>(null);

  const appointment = useMemo(() => {
    return localAppointment;
  }, [route.params.appointmentId, localAppointment]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const user = await userStorage.getUser();
      const childId = user?.children?.[0]?.id ?? 'child-1';
      const items = await appointmentStorage.get(childId);
      const found = items.find((x) => x.id === route.params.appointmentId);
      if (!mounted) return;

      if (!found) {
        setLocalAppointment(null);
        return;
      }

      setLocalAppointment({
        id: found.id,
        childId,
        doctorId: 'local',
        doctor: {
          id: 'local',
          name: found.doctorName,
          specialty: '',
          hospital: '',
        },
        title: found.title,
        date: found.date,
        time: found.time,
        location: found.location,
        notes: found.details,
        status: 'upcoming',
        reminderEnabled: false,
      });
    })();

    return () => {
      mounted = false;
    };
  }, [route.params.appointmentId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Randevu Detayı</Text>
          </View>

          <View style={styles.headerIconButton} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!appointment ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
            <Text style={styles.emptyTitle}>Randevu bulunamadı</Text>
            <Text style={styles.emptySubtitle}>Lütfen tekrar deneyin.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{appointment.title}</Text>

            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.value}>{appointment.date} • {appointment.time}</Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.value}>{appointment.doctor.name} • {appointment.doctor.specialty}</Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.value}>{appointment.location}</Text>
            </View>

            {appointment.notes ? (
              <View style={styles.notes}>
                <Text style={styles.notesTitle}>Notlar</Text>
                <Text style={styles.notesText}>{appointment.notes}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBack}
            >
              <Text style={styles.primaryButtonText}>Geri Dön</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  value: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  notes: {
    marginTop: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  primaryButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.white,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.base,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

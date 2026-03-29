import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING } from '../constants';
import { userStorage } from '../storage/userStorage';
import { appointmentStorage } from '../storage/appointmentStorage';
import { vaccinationStorage } from '../storage/vaccinationStorage';
import { 
  CustomHeader, 
  SectionHeader, 
  AppointmentCard, 
  BlogCard, 
  QuickActionCard 
} from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [childName, setChildName] = useState('');
  const [childId, setChildId] = useState('child-1');
  const [appointments, setAppointments] = useState<any[]>([]);

  const parseDdMmYyyy = (value: string): Date | null => {
    const trimmed = (value ?? '').trim();
    const match = /^\d{2}-\d{2}-\d{4}$/.test(trimmed);
    if (!match) return null;
    const [dStr, mStr, yStr] = trimmed.split('-');
    const d = Number(dStr);
    const m = Number(mStr);
    const y = Number(yStr);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  };

  const toComparableDateTime = (dateStr: string, timeStr?: string): number => {
    const date = parseDdMmYyyy(dateStr);
    if (!date) return Number.POSITIVE_INFINITY;
    const [hh, mm] = String(timeStr ?? '00:00').split(':');
    const hours = Number(hh);
    const minutes = Number(mm);
    const safeHours = Number.isFinite(hours) ? hours : 0;
    const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
    const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), safeHours, safeMinutes);
    return dt.getTime();
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        const user = await userStorage.getUser();
        const firstChild = user?.children?.[0];
        if (mounted) {
          setChildName(firstChild?.name ?? '');
          setChildId(firstChild?.id ?? 'child-1');
        }

        const resolvedChildId = firstChild?.id ?? 'child-1';
        const [normalAppointments, vaccineAppointments] = await Promise.all([
          appointmentStorage.get(resolvedChildId),
          vaccinationStorage.get(resolvedChildId),
        ]);

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

        const upcomingCombined = [
          ...normalAppointments.map((x) => ({
            __kind: 'appointment' as const,
            __sort: toComparableDateTime(x.date, x.time),
            id: x.id,
            childId: resolvedChildId,
            doctorId: 'local',
            doctor: {
              id: 'local',
              name: x.doctorName,
              specialty: '',
              hospital: '',
            },
            title: x.title,
            date: x.date,
            time: x.time,
            location: x.location,
            notes: x.details,
            status: 'upcoming',
            reminderEnabled: false,
          })),
          ...vaccineAppointments.map((x) => ({
            __kind: 'vaccination' as const,
            __sort: toComparableDateTime(x.date, x.time),
            id: x.id,
            childId: resolvedChildId,
            doctorId: 'vaccination',
            doctor: {
              id: 'vaccination',
              name: '',
              specialty: 'Aşı',
              hospital: '',
            },
            title: `Aşı: ${x.name}`,
            date: x.date,
            time: x.time,
            location: 'Aşı Takvimi',
            notes: x.note,
            status: 'upcoming',
            reminderEnabled: false,
          })),
        ]
          .filter((x) => (Number.isFinite(x.__sort) ? x.__sort >= startOfToday : true))
          .sort((a, b) => a.__sort - b.__sort)
          .slice(0, 2);

        if (mounted) setAppointments(upcomingCombined);
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  // İlk 2 randevuyu göster (local)

  const blogPosts = [
    {
      id: '1',
      emoji: '👶',
      title: '0-3 Yaş Gelişim Dönemleri',
      time: '5 dk',
    },
  ];

  const quickActions = [
    { id: '1', title: 'Dadı Bul', icon: '👶', color: COLORS.cardBlue },
    { id: '2', title: 'Gelişim Takibi', icon: '📊', color: COLORS.cardPink },
    { id: '3', title: 'Aşı Takvimi', icon: '💉', color: COLORS.cardGreen },
    { id: '4', title: 'Tarifler', icon: '🍼', color: COLORS.cardYellow },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <CustomHeader 
          greeting="Hoş geldin"
          userName={`${childName || 'Bebeğiniz'}'in Ebeveyni`}
          onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Account' })}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Randevularım Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="Randevularım"
            actionText="Tamamını Gör"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'Appointments' })}
          />

          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              compact={true}
              onPress={() => {
                if (appointment.__kind === 'vaccination') {
                  navigation.navigate('VaccinationCalendar', { childId });
                  return;
                }
                navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
              }}
            />
          ))}
        </View>

        {/* Blog Yazıları Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="Bloğ Yazıları"
            actionText="Keşfet"
            onActionPress={() => navigation.navigate('BlogList')}
          />

          {blogPosts.map((post) => (
            <BlogCard
              key={post.id}
              emoji={post.emoji}
              title={post.title}
              time={post.time}
              status="Yayınlandı"
              onPress={() => navigation.navigate('BlogDetail', { postId: post.id })}
            />
          ))}
        </View>

        {/* Senin İçin Section */}
        <View style={styles.section}>
          <SectionHeader title="Senin İçin" />
          
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon={quickActions[0].icon}
              title={quickActions[0].title}
              color={quickActions[0].color}
              onPress={() => navigation.navigate('NannyFinder')}
            />
            <QuickActionCard
              icon={quickActions[1].icon}
              title={quickActions[1].title}
              color={quickActions[1].color}
              onPress={() => navigation.navigate('GrowthTracker')}
            />
            <QuickActionCard
              icon={quickActions[2].icon}
              title={quickActions[2].title}
              color={quickActions[2].color}
              onPress={() => navigation.navigate('VaccinationCalendar', { childId })}
            />
            <QuickActionCard
              icon={quickActions[3].icon}
              title={quickActions[3].title}
              color={quickActions[3].color}
              onPress={() => navigation.navigate('Nutrition')}
            />
          </View>
        </View>

        {/* Bottom Spacing */}
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
  headerWrapper: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
});

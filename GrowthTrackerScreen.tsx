import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import CustomHeader from '../components/CustomHeader';
import { userStorage } from '../storage/userStorage';

interface Measurement {
  id: string;
  date: string;
  height: number;
  weight: number;
  ageMonths: number;
}

const mockMeasurements: Measurement[] = [
  { id: '1', date: '2024-01-15', height: 84, weight: 12, ageMonths: 20 },
  { id: '2', date: '2023-11-15', height: 82, weight: 11, ageMonths: 18 },
  { id: '3', date: '2023-09-15', height: 80, weight: 11, ageMonths: 16 },
  { id: '4', date: '2023-07-15', height: 78, weight: 10, ageMonths: 14 },
  { id: '5', date: '2023-05-15', height: 76, weight: 10, ageMonths: 12 },
];

export default function GrowthTrackerScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [measurementDate, setMeasurementDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [childBirthDateISO, setChildBirthDateISO] = useState<string | null>(null);

  const [measurements, setMeasurements] = useState<Measurement[]>(mockMeasurements);

  const handleDeleteMeasurement = (id: string) => {
    Alert.alert('Ölçümü Sil', 'Bu ölçümü silmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          setMeasurements((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => b.date.localeCompare(a.date));
  }, [measurements]);

  const latestMeasurement = sortedMeasurements[0];
  const previousMeasurement = sortedMeasurements[1];
  const heightGrowth =
    latestMeasurement && previousMeasurement ? latestMeasurement.height - previousMeasurement.height : 0;
  const weightGrowth =
    latestMeasurement && previousMeasurement ? latestMeasurement.weight - previousMeasurement.weight : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    let isMounted = true;

    const loadBirthDate = async () => {
      const user = await userStorage.getUser();
      const firstChildBirthDate = user?.children?.[0]?.birthDate;
      if (!isMounted) return;
      setChildBirthDateISO(firstChildBirthDate ?? null);
    };

    loadBirthDate();
    return () => {
      isMounted = false;
    };
  }, []);

  const toLocalDate = (value: string) => {
    const match = /^\d{4}-\d{2}-\d{2}$/.exec(value);
    if (match) {
      const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
      return new Date(y, m - 1, d);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const signedMonthsBetweenDates = (from: Date, to: Date) => {
    const forward = to.getTime() >= from.getTime();
    const a = forward ? from : to;
    const b = forward ? to : from;

    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) months -= 1;
    return forward ? months : -months;
  };

  const getAgeMonthsForDate = (measurementDateISO: string, fallbackAgeMonths: number) => {
    if (!childBirthDateISO) return fallbackAgeMonths;

    const birth = toLocalDate(childBirthDateISO);
    const meas = toLocalDate(measurementDateISO);
    if (!birth || !meas) return fallbackAgeMonths;

    return Math.max(0, signedMonthsBetweenDates(birth, meas));
  };

  const signedMonthsBetween = (fromISO: string, toISO: string) => {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;

    const forward = to.getTime() >= from.getTime();
    const a = forward ? from : to;
    const b = forward ? to : from;

    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) months -= 1;
    return forward ? months : -months;
  };

  const todayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dateToISO = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const openAddModal = () => {
    setMeasurementDate(new Date());
    setShowDatePicker(false);
    setModalVisible(true);
  };

  const handleMeasurementDateChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') return;
    if (!picked) return;
    setMeasurementDate(picked);
  };

  const handleAddMeasurement = () => {
    const h = height.trim();
    const w = weight.trim();

    if (!h || !w) {
      Alert.alert('Hata', 'Lütfen boy ve kilo girin');
      return;
    }
    if (!/^\d+$/.test(h)) {
      Alert.alert('Hata', 'Boy sadece tam sayı olmalıdır');
      return;
    }
    if (!/^\d+$/.test(w)) {
      Alert.alert('Hata', 'Kilo sadece tam sayı olmalıdır');
      return;
    }

    const now = new Date();
    if (measurementDate.getTime() > now.getTime()) {
      Alert.alert('Hata', 'Tarih gelecekte olamaz');
      return;
    }

    const newDate = dateToISO(measurementDate);
    const heightValue = parseInt(h, 10);
    const weightValue = parseInt(w, 10);

    const base =
      sortedMeasurements.length === 0
        ? undefined
        : sortedMeasurements.reduce((best, cur) => {
            const bestDt = new Date(best.date).getTime();
            const curDt = new Date(cur.date).getTime();
            const target = new Date(newDate).getTime();
            return Math.abs(curDt - target) < Math.abs(bestDt - target) ? cur : best;
          });
            const fallbackAgeMonths = base ? Math.max(0, base.ageMonths + signedMonthsBetween(base.date, newDate)) : 0;
            const ageMonths = getAgeMonthsForDate(newDate, fallbackAgeMonths);

    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      date: newDate,
      height: heightValue,
      weight: weightValue,
      ageMonths,
    };

    setMeasurements((prev) => [newMeasurement, ...prev]);
    setModalVisible(false);
    setHeight('');
    setWeight('');
  };

  const Chart = ({ data }: { data: Measurement[] }) => {
    const [chartWidth, setChartWidth] = useState(0);
    const chartHeight = 160;
    const pad = SPACING.base;

    const pointsCount = Math.min(8, data.length);
    const recent = data.slice(0, pointsCount).reverse();
    const heights = recent.map((m) => m.height);
    const weights = recent.map((m) => m.weight);

    const range = (values: number[]) => {
      if (values.length === 0) return { min: 0, max: 1 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { min, max: max === min ? min + 1 : max };
    };

    const heightRange = range(heights);
    const weightRange = range(weights);

    const xForIndex = (idx: number) => {
      if (recent.length <= 1) return pad;
      const usable = Math.max(0, chartWidth - pad * 2);
      return pad + (usable * idx) / (recent.length - 1);
    };

    const yForValue = (value: number, min: number, max: number) => {
      const usableH = chartHeight - pad * 2;
      const t = (value - min) / (max - min);
      return pad + (1 - t) * usableH;
    };

    const buildSeries = (values: number[], min: number, max: number) =>
      values.map((v, idx) => ({ x: xForIndex(idx), y: yForValue(v, min, max) }));

    const heightSeries = chartWidth > 0 ? buildSeries(heights, heightRange.min, heightRange.max) : [];
    const weightSeries = chartWidth > 0 ? buildSeries(weights, weightRange.min, weightRange.max) : [];

    const renderLines = (series: { x: number; y: number }[], color: string) => {
      if (series.length < 2) return null;
      return series.slice(0, -1).map((p1, idx) => {
        const p2 = series[idx + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return (
          <View
            key={`${color}-line-${idx}`}
            style={{
              position: 'absolute',
              left: p1.x,
              top: p1.y,
              width: length,
              height: 2,
              backgroundColor: color,
              transform: [{ rotateZ: `${angle}rad` }],
              transformOrigin: '0px 0px',
            }}
          />
        );
      });
    };

    const renderDots = (series: { x: number; y: number }[], color: string) =>
      series.map((p, idx) => (
        <View
          key={`${color}-dot-${idx}`}
          style={{
            position: 'absolute',
            left: p.x - 4,
            top: p.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: COLORS.white,
          }}
        />
      ));

    if (data.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics" size={48} color={COLORS.gray300} />
          <Text style={styles.chartPlaceholderText}>Ölçüm ekleyince grafik oluşacak</Text>
        </View>
      );
    }

    return (
      <View
        style={styles.chartCanvas}
        onLayout={(e) => {
          setChartWidth(e.nativeEvent.layout.width);
        }}
      >
        {renderLines(heightSeries, COLORS.primary)}
        {renderLines(weightSeries, COLORS.cardPink)}
        {renderDots(heightSeries, COLORS.primary)}
        {renderDots(weightSeries, COLORS.cardPink)}
      </View>
    );
  };

  const MeasurementCard = ({ measurement }: { measurement: Measurement }) => (
    <View style={styles.measurementCard}>
      <View style={styles.measurementHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDate(measurement.date)}</Text>
        </View>
        <View style={styles.measurementHeaderRight}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMeasurement(measurement.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.measurementValues}>
        <View style={styles.valueItem}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.cardBlue }]}>
            <Ionicons name="resize" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.valueLabel}>Boy</Text>
            <Text style={styles.valueNumber}>{measurement.height} cm</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.valueItem}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.cardPink }]}>
            <Ionicons name="speedometer" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.valueLabel}>Kilo</Text>
            <Text style={styles.valueNumber}>{measurement.weight} kg</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader 
          title="Gelişim Takibi" 
          subtitle="Ege'nin büyüme ve gelişimi"
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Stats */}
        <View style={styles.currentStats}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="resize" size={24} color={COLORS.primary} />
              <Text style={styles.statTitle}>Boy</Text>
            </View>
            <Text style={styles.statValue}>{latestMeasurement ? `${latestMeasurement.height} cm` : '-'}</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color={COLORS.success} />
              <Text style={styles.growthText}>+{heightGrowth} cm son 2 ayda</Text>
            </View>
            <View style={styles.percentileContainer}>
              <Text style={styles.percentileText}>65. persentil</Text>
              <View style={styles.percentileBar}>
                <View style={[styles.percentileFill, { width: '65%', backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="speedometer" size={24} color={COLORS.primary} />
              <Text style={styles.statTitle}>Kilo</Text>
            </View>
            <Text style={styles.statValue}>{latestMeasurement ? `${latestMeasurement.weight} kg` : '-'}</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color={COLORS.success} />
              <Text style={styles.growthText}>+{weightGrowth} kg son 2 ayda</Text>
            </View>
            <View style={styles.percentileContainer}>
              <Text style={styles.percentileText}>58. persentil</Text>
              <View style={styles.percentileBar}>
                <View style={[styles.percentileFill, { width: '58%', backgroundColor: COLORS.warning }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Büyüme Grafiği</Text>
          <Chart data={sortedMeasurements} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Boy (cm)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.cardPink }]} />
              <Text style={styles.legendText}>Kilo (kg)</Text>
            </View>
          </View>
        </View>

        {/* Measurements History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ölçüm Geçmişi</Text>
          </View>

          {sortedMeasurements.length === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryText}>Henüz ölçüm yok</Text>
            </View>
          ) : (
            sortedMeasurements.map((measurement) => (
              <MeasurementCard key={measurement.id} measurement={measurement} />
            ))
          )}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Add Measurement FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Measurement Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Ölçüm Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tarih</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                activeOpacity={0.9}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
                <Text style={styles.dateTextInModal}>
                  {measurementDate.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={measurementDate}
                  mode="date"
                  display={Platform.OS === 'android' ? 'calendar' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleMeasurementDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Boy (cm)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="resize" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="örn: 84"
                  keyboardType="number-pad"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kilo (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="speedometer" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="örn: 12"
                  keyboardType="number-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                handleAddMeasurement();
              }}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  currentStats: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  statValue: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  growthText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    fontWeight: FONTS.weights.medium,
  },
  percentileContainer: {
    marginTop: SPACING.xs,
  },
  percentileText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  percentileBar: {
    height: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  percentileFill: {
    height: '100%',
    borderRadius: RADIUS.xs,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  chartTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.base,
  },
  chartCanvas: {
    height: 200,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.base,
    overflow: 'hidden',
  },
  chartPlaceholderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  historySection: {
    paddingHorizontal: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  measurementCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  measurementHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  ageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  deleteButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    fontWeight: FONTS.weights.medium,
  },
  measurementValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  valueNumber: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  emptyHistoryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  emptyHistoryText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.base,
    bottom: SPACING.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  dateTextInModal: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.base,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  progressTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  progressCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  progressCircleLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: COLORS.success,
  },
  progressPercentage: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
  },
  progressStats: {
    flex: 1,
    gap: SPACING.base,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressStatText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  milestonesSection: {
    padding: SPACING.base,
  },
  sectionTitleLarge: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  milestoneText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  milestoneAchieved: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
});

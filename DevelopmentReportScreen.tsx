import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';

const { width } = Dimensions.get('window');

interface Milestone {
  id: string;
  title: string;
  achieved: boolean;
  ageMonths: number;
  category: 'motor' | 'cognitive' | 'social' | 'language';
}

interface Report {
  month: number;
  height: number;
  weight: number;
  headCircumference: number;
}

const mockMilestones: Milestone[] = [
  { id: '1', title: 'Tek başına yürüyor', achieved: true, ageMonths: 18, category: 'motor' },
  { id: '2', title: '10+ kelime söylüyor', achieved: true, ageMonths: 20, category: 'language' },
  { id: '3', title: 'Basit yönergeleri anlıyor', achieved: true, ageMonths: 18, category: 'cognitive' },
  { id: '4', title: 'Kaşık kullanıyor', achieved: false, ageMonths: 22, category: 'motor' },
  { id: '5', title: 'İki kelimelik cümleler kuruyor', achieved: false, ageMonths: 24, category: 'language' },
];

const mockReports: Report[] = [
  { month: 14, height: 78, weight: 10.5, headCircumference: 46 },
  { month: 16, height: 80, weight: 11.0, headCircumference: 46.5 },
  { month: 18, height: 82, weight: 11.5, headCircumference: 47 },
  { month: 20, height: 84, weight: 12.0, headCircumference: 47.5 },
];

export default function DevelopmentReportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'motor' | 'cognitive' | 'social' | 'language'>('all');

  const categories = [
    { id: 'all', label: 'Tümü', icon: 'apps' },
    { id: 'motor', label: 'Motor', icon: 'walk' },
    { id: 'cognitive', label: 'Bilişsel', icon: 'bulb' },
    { id: 'social', label: 'Sosyal', icon: 'people' },
    { id: 'language', label: 'Dil', icon: 'chatbubbles' },
  ];

  const filteredMilestones = selectedCategory === 'all'
    ? mockMilestones
    : mockMilestones.filter(m => m.category === selectedCategory);

  const achievedCount = mockMilestones.filter(m => m.achieved).length;
  const totalCount = mockMilestones.length;
  const progressPercentage = Math.round((achievedCount / totalCount) * 100);

  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const categoryColors = {
      motor: COLORS.cardBlue,
      cognitive: COLORS.cardPink,
      social: COLORS.cardGreen,
      language: COLORS.cardYellow,
    };

    return (
      <View style={styles.milestoneCard}>
        <View style={styles.milestoneHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[milestone.category] }]}>
            <Text style={styles.categoryText}>
              {milestone.category === 'motor' && 'Motor'}
              {milestone.category === 'cognitive' && 'Bilişsel'}
              {milestone.category === 'social' && 'Sosyal'}
              {milestone.category === 'language' && 'Dil'}
            </Text>
          </View>
          <View style={styles.checkboxContainer}>
            {milestone.achieved ? (
              <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            ) : (
              <Ionicons name="ellipse-outline" size={28} color={COLORS.gray300} />
            )}
          </View>
        </View>
        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
        <Text style={styles.milestoneAge}>Beklenen yaş: {milestone.ageMonths} ay</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gelişim Raporu</Text>
        <Text style={styles.headerSubtitle}>Ege - 20 Ay</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Genel İlerleme</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.statRow}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.statText}>{achievedCount} Başarıldı</Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="ellipse-outline" size={20} color={COLORS.gray300} />
                <Text style={styles.statText}>{totalCount - achievedCount} Devam Ediyor</Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="star" size={20} color={COLORS.warning} />
                <Text style={styles.statText}>Yaşına Uygun</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBlue }]}>
            <Ionicons name="resize" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>84 cm</Text>
            <Text style={styles.statLabel}>Boy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardPink }]}>
            <Ionicons name="speedometer" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>12 kg</Text>
            <Text style={styles.statLabel}>Kilo</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardGreen }]}>
            <Ionicons name="fitness" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>47.5 cm</Text>
            <Text style={styles.statLabel}>Baş Çevresi</Text>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id as any)}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.id ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Gelişim Kilometre Taşları</Text>
          {filteredMilestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </View>

        {/* Report CTA */}
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.white} />
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Detaylı Rapor</Text>
            <Text style={styles.ctaSubtitle}>Aylık gelişim raporunu görüntüle</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>

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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
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
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  overviewTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  progressCircle: {
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
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: COLORS.white,
  },
  milestonesSection: {
    padding: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  milestoneCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  categoryText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.primary,
  },
  checkboxContainer: {
    width: 28,
    height: 28,
  },
  milestoneTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  milestoneAge: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  ctaText: {
    flex: 1,
    marginLeft: SPACING.base,
  },
  ctaTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  ctaSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
});

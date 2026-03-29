import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import { mockBlogPosts } from '../services/mockData';
import { RootStackParamList } from '../types';
import CustomHeader from '../components/CustomHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  { id: 'all', name: 'Tümü', icon: 'apps' },
  { id: 'health', name: 'Sağlık', icon: 'medical' },
  { id: 'nutrition', name: 'Beslenme', icon: 'restaurant' },
  { id: 'development', name: 'Gelişim', icon: 'trending-up' },
  { id: 'sleep', name: 'Uyku', icon: 'moon' },
  { id: 'education', name: 'Eğitim', icon: 'school' },
];

export default function BlogListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtreleme ve sıralama
  const filteredPosts = mockBlogPosts
    .filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const CategoryChip = ({ category }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === category.id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons
        name={category.icon as any}
        size={16}
        color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
      />
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === category.id && styles.categoryChipTextActive,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const BlogCard = ({ post }: any) => (
    <TouchableOpacity
      style={styles.blogCard}
      onPress={() => navigation.navigate('BlogDetail', { postId: post.id })}
    >
      <View style={styles.blogImage}>
        <Text style={styles.blogEmoji}>{post.coverImage}</Text>
      </View>
      <View style={styles.blogContent}>
        <View style={styles.blogHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {CATEGORIES.find(c => c.id === post.category)?.name || 'Diğer'}
            </Text>
          </View>
          <View style={styles.readTime}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.readTimeText}>{post.readTime} dk</Text>
          </View>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.blogExcerpt} numberOfLines={2}>
          {post.excerpt}
        </Text>
        <View style={styles.blogFooter}>
          <View style={styles.authorInfo}>
            <Ionicons name="person-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.authorName}>{post.author}</Text>
          </View>
          <Text style={styles.publishDate}>
            {new Date(post.publishedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader title="Blog Yazıları" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Blog ara..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(category => (
            <CategoryChip key={category.id} category={category} />
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={styles.resultCount}>{filteredPosts.length} yazı bulundu</Text>
        </View>

        {/* Blog List */}
        <View style={styles.blogList}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => <BlogCard key={post.id} post={post} />)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>Blog yazısı bulunamadı</Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    margin: SPACING.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  categoriesContainer: {
    marginBottom: SPACING.base,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  resultCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  sortButton: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  sortButtonTextActive: {
    color: COLORS.white,
  },
  blogList: {
    paddingHorizontal: SPACING.base,
  },
  blogCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  blogImage: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.cardBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blogEmoji: {
    fontSize: 48,
  },
  blogContent: {
    flex: 1,
    padding: SPACING.base,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryBadge: {
    backgroundColor: COLORS.cardBlue,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.primary,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  blogTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  blogExcerpt: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  blogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  publishDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
  },
});

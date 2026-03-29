import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import { mockBlogPosts } from '../services/mockData';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BlogDetailRouteProp = RouteProp<RootStackParamList, 'BlogDetail'>;

export default function BlogDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BlogDetailRouteProp>();
  const { postId } = route.params;

  const [isBookmarked, setIsBookmarked] = useState(false);

  // Blog yazısını bul
  const post = mockBlogPosts.find(p => p.id === postId);

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Blog yazısı bulunamadı</Text>
      </View>
    );
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      'Başarılı',
      isBookmarked ? 'Okunacaklardan çıkarıldı' : 'Okunacaklara eklendi'
    );
  };

  // Tam blog içeriği (örnek)
  const fullContent = `${post.excerpt}\n\nBu yazıda, bebeğinizin gelişimi için önemli bilgiler bulacaksınız. Uzman doktorlarımız tarafından hazırlanan bu içerik, ebeveynlere rehberlik etmek amacıyla yazılmıştır.\n\n## Önemli Noktalar\n\n1. Her bebeğin gelişimi kendine özgüdür\n2. Düzenli kontroller çok önemlidir\n3. Beslenme gelişimi etkiler\n4. Uyku düzeni sağlıklı gelişim için kritiktir\n\n## Sonuç\n\nBebeğinizin gelişimini yakından takip etmek, olası sorunları erken fark etmenizi sağlar. Herhangi bir endişeniz olduğunda mutlaka doktorunuza danışın.\n\n---\n\n*Bu yazı bilgilendirme amaçlıdır. Tıbbi tavsiye yerine geçmez.*`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBookmark}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverImage}>
          <Text style={styles.coverEmoji}>{post.coverImage}</Text>
        </View>

        {/* Article Header */}
        <View style={styles.articleHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{post.category}</Text>
          </View>
          <Text style={styles.title}>{post.title}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.authorInfo}>
              <Ionicons name="person-circle" size={20} color={COLORS.textSecondary} />
              <Text style={styles.authorName}>{post.author}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>
                {new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.readTimeInfo}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.readTimeText}>{post.readTime} dk okuma</Text>
            </View>
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.articleContent}>
          <Text style={styles.contentText}>{fullContent}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Bilgi', 'Yorum özelliği yakında eklenecek')}
          >
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Yorum Yap</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.cardBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 80,
  },
  articleHeader: {
    padding: SPACING.base,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.base,
  },
  categoryBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.white,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    lineHeight: 32,
    marginBottom: SPACING.base,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  authorName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  readTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  articleContent: {
    padding: SPACING.base,
  },
  contentText: {
    fontSize: FONTS.sizes.base,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
  },
  actionButtonActive: {
    backgroundColor: COLORS.cardPink,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
  },
  relatedSection: {
    padding: SPACING.base,
  },
  relatedTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  relatedCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  relatedImage: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedEmoji: {
    fontSize: 32,
  },
  relatedContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  relatedPostTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedReadTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
});

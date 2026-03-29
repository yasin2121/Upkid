import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants';
import CustomHeader from '../components/CustomHeader';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Merhaba! Ben UpKid AI asistanınızım. Çocuğunuzun sağlığı, gelişimi ve bakımı hakkında sorularınızı yanıtlayabilirim. Size nasıl yardımcı olabilirim? 🤖',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const normalizeText = (text: string) => {
    // Trim + çoklu boşlukları toparla (satır sonlarını koruyarak)
    const normalizedWhitespace = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .trim();

    // Aşırı tekrarlı karakterleri (spam) okunur hale getir:
    // - 5+ tekrar -> 2 tekrar (daha agresif)
    //   Örn: "wwwwww" -> "ww"
    const deDuped = normalizedWhitespace.replace(/(.)\1{4,}/g, '$1$1');

    // Hâlâ çok uzun tek-tip (boşluksuz) bloklar varsa kısalt (ör. 25+)
    // Örn: "wwwwwwwwwwwwwwwwwwwwwwwwww" -> "ww…"
    return deDuped
      .split(/(\s+)/)
      .map((part) => {
        if (/\s+/.test(part)) return part;
        if (part.length < 25) return part;
        // Eğer parçanın çoğu aynı karakterse kısalt
        const first = part[0];
        const sameRatio = part.split('').filter((c) => c === first).length / part.length;
        if (sameRatio >= 0.8) return `${first}${first}…`;
        return part;
      })
      .join('');
  };

  // Geçmiş mesajları bir kere sanitize et
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        text: normalizeText(m.text),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Önerilen sorular
  const suggestedQuestions = [
    '🍼 Bebeğim için beslenme önerileri',
    '💉 Aşı takvimi hakkında bilgi',
    '😴 Uyku düzeni nasıl olmalı?',
    '📊 Gelişim takibi nasıl yapılır?',
  ];

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (trimmed === '') return;

    const cleaned = normalizeText(trimmed);
    if (cleaned === '') return;

    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      text: cleaned,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // AI cevabını simüle et
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(cleaned),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Basit AI cevap simülasyonu
  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('beslenme') || q.includes('mama')) {
      return 'Bebeğinizin beslenmesi yaş grubuna göre farklılık gösterir. 0-6 ay arası sadece anne sütü veya mama, 6 ay sonrası ek gıdalara başlanabilir. Düzenli beslenme saatleri ve çeşitli besinler önemlidir. Detaylı beslenme planı için Blog bölümündeki yazıları inceleyebilir veya doktorunuza danışabilirsiniz.';
    }
    
    if (q.includes('aşı')) {
      return 'Çocuk aşıları Sağlık Bakanlığı tarafından belirlenen takvime göre yapılır. Ege\'nin aşı takvimine Şahıs Kart bölümünden ulaşabilirsiniz. Şu an %75 tamamlanmış durumda. Yaklaşan aşı randevuları için bildirim alabilirsiniz.';
    }
    
    if (q.includes('uyku')) {
      return 'Bebeklerde uyku düzeni yaşa göre değişir. Yenidoğanlar günde 16-18 saat, 3-6 ay arası 14-16 saat, 6-12 ay arası 12-14 saat uyurlar. Düzenli uyku rutini oluşturmak önemlidir. Gece uykusu öncesi sakin aktiviteler, karanlık ve sessiz ortam yardımcı olur.';
    }
    
    if (q.includes('gelişim') || q.includes('boy') || q.includes('kilo')) {
      return 'Ege\'nin güncel gelişim bilgilerine Şahıs Kart bölümünden ulaşabilirsiniz. Boy ve kilo persentil değerleri WHO standartlarına göre hesaplanır. Düzenli doktor kontrolleri ve ölçümler gelişim takibi için önemlidir.';
    }
    
    return 'Sorununuz hakkında size yardımcı olmak isterim. Daha spesifik bir soru sorabilir veya aşağıdaki önerilen sorulardan birini seçebilirsiniz. Acil sağlık durumları için lütfen doktorunuza başvurun.';
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question.replace(/[🍼💉😴📊]\s/, ''));
    Keyboard.dismiss();
  };

  // Çok uzun tek-parça metinlerde (örn. "wwwwww...") bazı cihazlarda ZWSP gibi
  // görünmez karakterler eklemek render'ı bozabiliyor. Bunun yerine,
  // boşluksuz aşırı uzun parçaları güvenli şekilde kısaltıyoruz.
  const shortenLongTokens = (text: string) => {
    return text
      .split(/(\s+)/)
      .map((part) => {
        if (/\s+/.test(part)) return part;
        if (part.length <= 32) return part;
        // Aşırı uzun tek-parça içerik bazı cihazlarda render'ı bozabiliyor.
        // Bu yüzden kısaltmak yerine tamamen maskele.
        return '[uzun metin]';
      })
      .join('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    (() => {
      const storedText = normalizeText(item.text);
      const displayText = shortenLongTokens(storedText);

      return (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="logo-android" size={20} color={COLORS.white} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
          textBreakStrategy="simple"
          allowFontScaling={false}
        >
          {displayText}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.aiTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {item.isUser && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color={COLORS.white} />
        </View>
      )}
    </View>
      );
    })()
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessageContainer]}>
      <View style={styles.aiAvatar}>
        <Ionicons name="logo-android" size={20} color={COLORS.white} />
      </View>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotDelay1]} />
          <View style={[styles.typingDot, styles.typingDotDelay2]} />
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    // Yeni mesaj geldiğinde scroll
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.base }]}>
        <CustomHeader 
          title="AI Asistan"
          subtitle="Her zaman yanınızda"
          showBack={false}
          rightComponent={
            <TouchableOpacity>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          }
        />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? renderTypingIndicator : null}
      />

      {/* Önerilen Sorular */}
      {messages.length === 1 && (
        <View style={styles.suggestedContainer}>
          <Text style={styles.suggestedTitle}>Önerilen Sorular:</Text>
          <View style={styles.suggestedGrid}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedButton}
                onPress={() => handleSuggestedQuestion(question)}
              >
                <Text style={styles.suggestedText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() === '' && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={inputText.trim() === ''}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() === '' ? COLORS.textSecondary : COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  infoButton: {
    padding: SPACING.xs,
  },
  messagesList: {
    padding: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minWidth: 0,
    overflow: 'hidden',
    // En stabil görünüm: gölgeyi tamamen kapat, border kullan.
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FONTS.sizes.base,
    // Android'de balon içi metinlerin "garip" görünmesi çoğunlukla
    // lineHeight + font padding kombinasyonundan kaynaklanır.
    // Sayısal bir lineHeight kullanmak daha stabil.
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
    // Android metin kutusundaki ekstra üst/alt padding'i kapat
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  aiMessageText: {
    color: COLORS.textPrimary,
  },
  userMessageText: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  aiTimestamp: {
    color: COLORS.textSecondary,
  },
  userTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  typingDotDelay1: {
    opacity: 0.4,
  },
  typingDotDelay2: {
    opacity: 0.2,
  },
  suggestedContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  suggestedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestedButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  suggestedText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.xs,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
});

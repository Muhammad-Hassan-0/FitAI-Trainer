import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  Animated, Dimensions, Image, Alert, ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { geminiAPI } from '../services/api';
import { C, SHADOW } from '../theme';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

// ── Language config ──────────────────────────────────────────────────────────
const LANGS = [
  { id: 'en', label: 'EN', name: 'English', flag: '🇺🇸' },
  { id: 'ur', label: 'UR', name: 'Urdu', flag: '🇵🇰' },
  { id: 'ar', label: 'AR', name: 'Arabic', flag: '🇸🇦' },
];

const WELCOME_TEXT = {
  en: "Hey! I'm **FitAI Coach** — your personal AI trainer 💪\n\nI can:\n• Answer any fitness or nutrition question\n• 📸 Analyze food photos for calorie counts\n• 🏋️ Check your exercise form from photos\n• Create personalized workout tips\n\nSend a message or tap 📷 to share an image!",
  ur: "ہیلو! میں FitAI Coach ہوں — آپ کا ذاتی AI ٹرینر 💪\n\nمیں یہ کر سکتا ہوں:\n• فٹنس یا غذائیت کے سوالات\n• 📸 کھانے کی تصاویر میں کیلوریز گننا\n• 🏋️ ورزش کی تصویر میں فارم چیک کرنا\n\nپیغام بھیجیں یا 📷 دبائیں!",
  ar: "مرحباً! أنا FitAI Coach — مدربك الشخصي 💪\n\nيمكنني:\n• الإجابة على أسئلة اللياقة والتغذية\n• 📸 تحليل صور الطعام لحساب السعرات\n• 🏋️ فحص شكل التمرين من الصور\n\nأرسل رسالة أو انقر 📷 لمشاركة صورة!",
};

const PLACEHOLDER_TEXT = {
  en: 'Ask me anything about fitness...',
  ur: 'فٹنس کے بارے میں کچھ بھی پوچھیں...',
  ar: 'اسألني أي شيء عن اللياقة البدنية...',
};

const THINKING_TEXT = {
  en: 'Analyzing...',
  ur: 'تجزیہ کر رہا ہے...',
  ar: 'جارٍ التحليل...',
};

// Image type prompts
const IMAGE_TYPES = [
  { id: 'food', label: 'Food & Calories', icon: '🍽️', color: C.teal, desc: 'Count calories & macros' },
  { id: 'exercise', label: 'Exercise Form', icon: '🏋️', color: C.brand, desc: 'Check my workout form' },
  { id: 'general', label: 'General Analysis', icon: '🔍', color: C.blue, desc: 'General fitness insight' },
];

const QUICK_SUGGESTIONS = {
  en: [
    { icon: '🔥', text: 'Best exercises for fat loss' },
    { icon: '💪', text: 'How to build muscle fast' },
    { icon: '🥗', text: 'High protein meal ideas' },
    { icon: '😴', text: 'Why rest days matter' },
    { icon: '🦵', text: 'Fix my squat form' },
    { icon: '⏱️', text: 'Workout plan for beginners' },
  ],
  ur: [
    { icon: '🔥', text: 'چربی کم کرنے کی بہترین ورزشیں' },
    { icon: '💪', text: 'تیزی سے پٹھے کیسے بنائیں' },
    { icon: '🥗', text: 'پروٹین سے بھرپور کھانے' },
    { icon: '😴', text: 'آرام کے دن کیوں ضروری ہیں' },
    { icon: '🦵', text: 'اسکواٹ کی تکنیک درست کریں' },
    { icon: '⏱️', text: 'ابتدائی افراد کے لیے ورزش کا منصوبہ' },
  ],
  ar: [
    { icon: '🔥', text: 'أفضل تمارين لحرق الدهون' },
    { icon: '💪', text: 'كيف تبني العضلات بسرعة' },
    { icon: '🥗', text: 'أفكار وجبات غنية بالبروتين' },
    { icon: '😴', text: 'لماذا أيام الراحة مهمة' },
    { icon: '🦵', text: 'تصحيح تمرين القرفصاء' },
    { icon: '⏱️', text: 'خطة تدريب للمبتدئين' },
  ],
};

// ── Typing animation ─────────────────────────────────────────────────────────
function TypingDots({ color = C.brand }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(160, dots.map(d =>
        Animated.sequence([
          Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ))
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: color, transform: [{ translateY: d }],
        }} />
      ))}
    </View>
  );
}

// ── Pulse indicator ──────────────────────────────────────────────────────────
function OnlinePulse() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 11, height: 11, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 11, height: 11, borderRadius: 6,
        backgroundColor: C.lime + '55', transform: [{ scale }],
      }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime }} />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AIChatScreen({ navigation }) {
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'ai', type: 'text',
      text: WELCOME_TEXT['en'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({});
  const [pendingImage, setPendingImage] = useState(null); // { uri, base64 }
  const [pendingImageType, setPendingImageType] = useState('food');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showImageTypes, setShowImageTypes] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const imagePreviewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('userProfile').then(p => { if (p) setProfile(JSON.parse(p)); }).catch(() => {});
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages, loading]);

  useEffect(() => {
    Animated.spring(imagePreviewAnim, {
      toValue: pendingImage ? 1 : 0,
      tension: 80, friction: 10, useNativeDriver: true,
    }).start();
  }, [pendingImage]);

  const switchLang = (l) => {
    setShowLangPicker(false);
    if (l === lang) return;
    setLang(l);
    addAIMessage(WELCOME_TEXT[l]);
  };

  const addAIMessage = (text, extra = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), role: 'ai', type: 'text', text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra,
    }]);
  };

  // ── Pick image ──────────────────────────────────────────────────────────────
  const pickImage = async (fromCamera = false) => {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.6, base64: true, allowsEditing: true, aspect: [4, 3],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery access is required.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.6, base64: true, allowsEditing: true, aspect: [4, 3],
        });
      }
      if (!result.canceled && result.assets?.[0]) {
        setPendingImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
        setShowImageTypes(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not access image. ' + e.message);
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'web') {
      pickImage(false);
      return;
    }
    Alert.alert('Choose Image Source', 'Where would you like to pick the image?', [
      { text: '📷 Camera', onPress: () => pickImage(true) },
      { text: '🖼️ Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const cancelImage = () => {
    setPendingImage(null);
    setShowImageTypes(false);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text = null) => {
    const msgText = text || input.trim();
    if ((!msgText && !pendingImage) || loading) return;

    setInput('');
    inputRef.current?.blur();
    setShowImageTypes(false);
    const langName = LANGS.find(l => l.id === lang)?.name || 'English';

    // Add user message to chat
    const userMsg = {
      id: Date.now(), role: 'user',
      type: pendingImage ? 'image' : 'text',
      text: msgText || '',
      imageUri: pendingImage?.uri || null,
      imageType: pendingImage ? pendingImageType : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    const capturedImage = pendingImage;
    const capturedType = pendingImageType;
    setPendingImage(null);
    setLoading(true);

    try {
      let reply;
      if (capturedImage) {
        // Image analysis via Gemini Vision
        const res = await geminiAPI.analyzeImage(capturedImage.base64, capturedType, msgText, langName);
        reply = res?.analysis || 'Could not analyze the image.';
      } else {
        // Text question
        const res = await geminiAPI.askAdvice(
          `[Language: Respond in ${langName} only]\n[Style: concise, to-the-point, actionable]\n${msgText}`,
          profile
        );
        reply = res?.reply || getFallback(msgText, lang);
      }
      addAIMessage(reply, { imageAnalysis: !!capturedImage, analysisType: capturedType });
    } catch {
      if (capturedImage) {
        addAIMessage(getImageFallback(capturedType, lang));
      } else {
        addAIMessage(getFallback(msgText, lang));
      }
    } finally {
      setLoading(false);
    }
  };

  const getImageFallback = (type, l) => {
    const fallbacks = {
      food: "Unable to analyze image right now. Keep portions moderate, prioritize protein, and retry in a moment. 🍽️",
      exercise: "Unable to check form right now. Keep spine neutral, core tight, and use controlled reps. Retry in a moment. 💪",
      general: "Image analysis is unavailable right now. Please retry shortly. 🔍",
    };
    return fallbacks[type] || fallbacks.general;
  };

  const getFallback = (q, l) => {
    const lower = q.toLowerCase();
    if (lower.includes('weight') || lower.includes('fat') || lower.includes('loss'))
      return 'Fat loss: 500 kcal deficit, 3-4 strength sessions, 2-3 cardio sessions, protein ~1.6 g/kg. Track weekly. 🔥';
    if (lower.includes('protein'))
      return 'Protein target: 1.6 g/kg (fat loss) or 2.0 g/kg (muscle gain). Split across 3-4 meals daily. 🥩';
    if (lower.includes('beginner'))
      return 'Beginner plan: 3 full-body sessions/week (squat, push-up, plank, lunge). Focus form first, then add reps/weight. 💪';
    if (lower.includes('muscle') || lower.includes('gain') || lower.includes('build'))
      return 'Muscle gain: progressive overload weekly, protein ~2.0 g/kg, sleep 7-9h, train 4-5x/week. 🏋️';
    return 'Keep it simple: train consistently, track progress weekly, and recover well. Ask a specific goal for a sharper plan. 🎯';
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(), role: 'ai', type: 'text', text: WELCOME_TEXT[lang],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setPendingImage(null);
    setShowImageTypes(false);
  };

  const currentLang = LANGS.find(l => l.id === lang);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient colors={[C.bg, '#0A0A0E', C.bg]} style={StyleSheet.absoluteFillObject} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.hBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>

        {/* Trainer identity */}
        <View style={s.hCenter}>
          <View style={s.trainerAvatar}>
            <LinearGradient colors={[C.brand, C.brandDark]} style={s.trainerAvatarGrad}>
              <Text style={s.trainerAvatarText}>AI</Text>
            </LinearGradient>
            <View style={s.onlineBadge}><OnlinePulse /></View>
          </View>
          <View>
            <Text style={s.hName}>FitAI Coach</Text>
            <View style={s.hStatusRow}>
              {loading
                ? <><TypingDots color={C.lime} /><Text style={s.hStatus}>{THINKING_TEXT[lang]}</Text></>
                : <><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.lime }} />
                  <Text style={s.hStatus}>Online · Gemini Vision ✦</Text></>
              }
            </View>
          </View>
        </View>

        <View style={s.hRight}>
          {/* Language selector */}
          <TouchableOpacity style={s.langPill} onPress={() => setShowLangPicker(p => !p)}>
            <Text style={s.langFlag}>{currentLang.flag}</Text>
            <Text style={s.langLabel}>{currentLang.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn} onPress={clearChat}>
            <Ionicons name="create-outline" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CAPABILITIES STRIP ── */}
      <View style={s.capStrip}>
        {[
          { icon: '💬', label: 'Ask Anything' },
          { icon: '📸', label: 'Food Calories' },
          { icon: '🏋️', label: 'Form Check' },
          { icon: '🌍', label: '3 Languages' },
        ].map((cap, i) => (
          <View key={i} style={s.capItem}>
            <Text style={s.capIcon}>{cap.icon}</Text>
            <Text style={s.capLabel}>{cap.label}</Text>
          </View>
        ))}
      </View>

      {/* ── LANG DROPDOWN ── */}
      {showLangPicker && (
        <View style={s.langDropdown}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[s.langOpt, lang === l.id && s.langOptActive]}
              onPress={() => switchLang(l.id)}
            >
              <Text style={s.langOptFlag}>{l.flag}</Text>
              <Text style={[s.langOptName, lang === l.id && { color: C.brand }]}>{l.name}</Text>
              {lang === l.id && <Ionicons name="checkmark-circle" size={16} color={C.brand} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── MESSAGES ── */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.msgList}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => { setShowLangPicker(false); setShowImageTypes(false); }}
        >

          {/* Date badge */}
          <View style={s.dateBadge}>
            <View style={s.dateLine} />
            <View style={s.datePill}><Text style={s.datePillText}>Today</Text></View>
            <View style={s.dateLine} />
          </View>

          {messages.map((msg) => (
            <View key={msg.id} style={[s.msgRow, msg.role === 'user' && s.msgRowUser]}>

              {/* AI avatar */}
              {msg.role === 'ai' && (
                <View style={s.botAvatarSmall}>
                  <LinearGradient colors={[C.brand, C.brandDark]} style={s.botAvatarGrad}>
                    <Text style={s.botAvatarTxt}>AI</Text>
                  </LinearGradient>
                </View>
              )}

              <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAI]}>

                {/* AI label */}
                {msg.role === 'ai' && (
                  <View style={s.bubbleAILabel}>
                    <Ionicons name="sparkles" size={10} color={C.brand} />
                    <Text style={s.bubbleAILabelText}>FitAI COACH</Text>
                    {msg.imageAnalysis && (
                      <View style={s.visionBadge}>
                        <Ionicons name="eye" size={9} color={C.teal} />
                        <Text style={s.visionBadgeText}>Vision AI</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Image message */}
                {msg.imageUri && (
                  <View style={s.imgMsgWrap}>
                    <Image source={{ uri: msg.imageUri }} style={s.imgMsg} resizeMode="cover" />
                    {msg.imageType && (
                      <View style={[s.imgTypeBadge, { backgroundColor: IMAGE_TYPES.find(t => t.id === msg.imageType)?.color + '30' }]}>
                        <Text style={[s.imgTypeBadgeText, { color: IMAGE_TYPES.find(t => t.id === msg.imageType)?.color }]}>
                          {IMAGE_TYPES.find(t => t.id === msg.imageType)?.icon} {IMAGE_TYPES.find(t => t.id === msg.imageType)?.label}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Text */}
                {(msg.text || '').length > 0 && (
                  <Text style={[s.bubbleTxt, msg.role === 'user' && s.bubbleTxtUser]}>
                    {msg.text}
                  </Text>
                )}

                {/* Footer */}
                <View style={s.bubbleFoot}>
                  <Text style={[s.bubbleTime, msg.role === 'user' && s.bubbleTimeUser]}>{msg.time}</Text>
                  {msg.role === 'user' && <Ionicons name="checkmark-done" size={11} color="#FFFFFF80" />}
                </View>
              </View>

              {/* User avatar */}
              {msg.role === 'user' && (
                <View style={s.userAvatarSmall}>
                  <Ionicons name="person" size={12} color={C.brand} />
                </View>
              )}
            </View>
          ))}

          {/* Typing bubble */}
          {loading && (
            <View style={s.msgRow}>
              <View style={s.botAvatarSmall}>
                <LinearGradient colors={[C.brand, C.brandDark]} style={s.botAvatarGrad}>
                  <Text style={s.botAvatarTxt}>AI</Text>
                </LinearGradient>
              </View>
              <View style={[s.bubble, s.bubbleAI, s.bubbleTyping]}>
                <View style={s.bubbleAILabel}>
                  <Ionicons name="sparkles" size={10} color={C.brand} />
                  <Text style={s.bubbleAILabelText}>FitAI COACH</Text>
                </View>
                <TypingDots />
              </View>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── IMAGE TYPE SELECTOR ── */}
        {showImageTypes && pendingImage && (
          <View style={s.imgTypePanel}>
            <View style={s.imgTypePanelHeader}>
              <Image source={{ uri: pendingImage.uri }} style={s.imgPreviewThumb} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={s.imgTypePanelTitle}>What should I analyze?</Text>
                <Text style={s.imgTypePanelSub}>Choose analysis type for best results</Text>
              </View>
              <TouchableOpacity onPress={cancelImage} style={s.cancelImgBtn}>
                <Ionicons name="close" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={s.imgTypeRow}>
              {IMAGE_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.imgTypeCard, pendingImageType === t.id && { borderColor: t.color, backgroundColor: t.color + '15' }]}
                  onPress={() => { setPendingImageType(t.id); setShowImageTypes(false); }}
                >
                  <Text style={s.imgTypeCardIcon}>{t.icon}</Text>
                  <Text style={[s.imgTypeCardLabel, pendingImageType === t.id && { color: t.color }]}>{t.label}</Text>
                  <Text style={s.imgTypeCardDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── QUICK SUGGESTIONS ── */}
        {!pendingImage && (
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickScroll}
            keyboardShouldPersistTaps="always"
          >
            {QUICK_SUGGESTIONS[lang].map((q, i) => (
              <TouchableOpacity key={i} style={s.quickChip} onPress={() => sendMessage(q.text)}>
                <Text style={s.quickChipIcon}>{q.icon}</Text>
                <Text style={s.quickChipText}>{q.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── INPUT BAR ── */}
        <View style={s.inputBar}>

          {/* Pending image preview */}
          {pendingImage && (
            <Animated.View style={[s.pendingImgWrap, { opacity: imagePreviewAnim, transform: [{ scale: imagePreviewAnim }] }]}>
              <Image source={{ uri: pendingImage.uri }} style={s.pendingImg} resizeMode="cover" />
              <View style={[s.pendingImgType, { backgroundColor: IMAGE_TYPES.find(t => t.id === pendingImageType)?.color }]}>
                <Text style={s.pendingImgTypeText}>{IMAGE_TYPES.find(t => t.id === pendingImageType)?.icon}</Text>
              </View>
              <TouchableOpacity style={s.cancelImgX} onPress={cancelImage}>
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={s.inputRow}>
            {/* Camera/Image button */}
            <TouchableOpacity style={s.imgBtn} onPress={showImagePicker}>
              <LinearGradient
                colors={pendingImage ? [C.brand, C.brandDark] : [C.surface2, C.surface2]}
                style={s.imgBtnGrad}
              >
                <Ionicons name={pendingImage ? 'image' : 'camera'} size={18} color={pendingImage ? '#FFF' : C.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder={pendingImage ? 'Add a note about this image...' : PLACEHOLDER_TEXT[lang]}
              placeholderTextColor={C.textDim}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={600}
              returnKeyType="default"
            />

            {/* Send button */}
            <TouchableOpacity
              style={[s.sendBtn, ((!input.trim() && !pendingImage) || loading) && s.sendBtnOff]}
              onPress={() => sendMessage()}
              disabled={(!input.trim() && !pendingImage) || loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={(input.trim() || pendingImage) && !loading ? [C.brand, C.brandDark] : [C.surface2, C.surface2]}
                style={s.sendBtnGrad}
              >
                <Ionicons
                  name={pendingImage && !input.trim() ? 'eye' : 'arrow-up'}
                  size={18}
                  color={(input.trim() || pendingImage) && !loading ? '#FFFFFF' : C.textDim}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  hBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center',
  },
  hCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10 },
  trainerAvatar: { position: 'relative', width: 42, height: 42 },
  trainerAvatarGrad: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  trainerAvatarText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  onlineBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: C.bg, padding: 1, borderRadius: 8,
  },
  hName: { fontSize: 15, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  hStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  hStatus: { fontSize: 10, color: C.lime, fontWeight: '600' },
  hRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.brand + '18', paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '35',
  },
  langFlag: { fontSize: 13 },
  langLabel: { fontSize: 10, fontWeight: '800', color: C.brand },

  // Capabilities strip
  capStrip: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  capItem: { alignItems: 'center', gap: 3 },
  capIcon: { fontSize: 16 },
  capLabel: { fontSize: 9, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Lang dropdown
  langDropdown: {
    position: 'absolute', top: 60, right: 54, zIndex: 200,
    backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, width: 160, ...SHADOW.card,
  },
  langOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  langOptActive: { backgroundColor: C.brand + '12' },
  langOptFlag: { fontSize: 18 },
  langOptName: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },

  // Messages
  msgList: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6, gap: 14 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dateLine: { flex: 1, height: 1, backgroundColor: C.border },
  datePill: {
    backgroundColor: C.surface2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  datePillText: { fontSize: 10, fontWeight: '700', color: C.textMuted },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },

  botAvatarSmall: { width: 30, height: 30, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 },
  botAvatarGrad: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  botAvatarTxt: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
  userAvatarSmall: {
    width: 30, height: 30, borderRadius: 9, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2,
    backgroundColor: C.brand + '18', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.brand + '35',
  },

  bubble: { maxWidth: IS_TABLET ? width * 0.64 : (IS_SMALL ? width * 0.83 : width * 0.76), borderRadius: 18, padding: IS_SMALL ? 10 : 12, gap: 4 },
  bubbleAI: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: C.brand, borderBottomRightRadius: 4, ...SHADOW.brand },
  bubbleTyping: { paddingVertical: 10 },

  bubbleAILabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  bubbleAILabelText: { fontSize: 9, fontWeight: '900', color: C.brand, letterSpacing: 0.8 },
  visionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.teal + '20', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: C.teal + '40',
  },
  visionBadgeText: { fontSize: 8, fontWeight: '800', color: C.teal },

  imgMsgWrap: { borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  imgMsg: { width: '100%', height: IS_SMALL ? 130 : 160, borderRadius: 10 },
  imgTypeBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4,
    alignSelf: 'flex-start',
  },
  imgTypeBadgeText: { fontSize: 11, fontWeight: '700' },

  bubbleTxt: { fontSize: IS_SMALL ? 13 : 14, color: C.textSub, lineHeight: IS_SMALL ? 19 : 21 },
  bubbleTxtUser: { color: '#FFFFFF', fontWeight: '500' },
  bubbleFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bubbleTime: { fontSize: 10, color: C.textDim },
  bubbleTimeUser: { color: '#FFFFFF70' },

  // Image type panel
  imgTypePanel: {
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    padding: 14, gap: 12,
  },
  imgTypePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imgPreviewThumb: { width: 52, height: 52, borderRadius: 10 },
  imgTypePanelTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 2 },
  imgTypePanelSub: { fontSize: 11, color: C.textMuted },
  cancelImgBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  imgTypeRow: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 8 },
  imgTypeCard: {
    flex: 1, backgroundColor: C.surface2, borderRadius: 14, padding: IS_SMALL ? 8 : 10,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: C.border,
  },
  imgTypeCardIcon: { fontSize: 20, marginBottom: 2 },
  imgTypeCardLabel: { fontSize: 11, fontWeight: '800', color: C.text, textAlign: 'center' },
  imgTypeCardDesc: { fontSize: 9, color: C.textMuted, textAlign: 'center' },

  // Quick chips
  quickScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '30',
  },
  quickChipIcon: { fontSize: 13 },
  quickChipText: { fontSize: 12, fontWeight: '600', color: C.brandLight },

  // Input bar
  inputBar: {
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: 12, paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  pendingImgWrap: {
    position: 'relative', alignSelf: 'flex-start',
    marginBottom: 8, borderRadius: 12, overflow: 'visible',
  },
  pendingImg: { width: 64, height: 64, borderRadius: 12 },
  pendingImgType: {
    position: 'absolute', bottom: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.surface,
  },
  pendingImgTypeText: { fontSize: 11 },
  cancelImgX: { position: 'absolute', top: -6, right: -6 },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: IS_SMALL ? 6 : 8 },
  imgBtn: { borderRadius: 14, overflow: 'hidden', flexShrink: 0 },
  imgBtnGrad: { width: IS_SMALL ? 40 : 44, height: IS_SMALL ? 40 : 44, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  input: {
    flex: 1, color: C.text, fontSize: IS_SMALL ? 13 : 14, lineHeight: IS_SMALL ? 18 : 20,
    backgroundColor: C.surface2, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10,
    maxHeight: IS_SMALL ? 96 : 110, minHeight: IS_SMALL ? 40 : 44,
  },
  sendBtn: { borderRadius: 14, overflow: 'hidden', flexShrink: 0, ...SHADOW.brand },
  sendBtnOff: { shadowColor: 'transparent', elevation: 0 },
  sendBtnGrad: { width: IS_SMALL ? 40 : 44, height: IS_SMALL ? 40 : 44, justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { planAPI } from '../services/api';
import { C } from '../theme';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

const QUESTIONS = [
  {
    id: 'goal',
    emoji: '🎯',
    title: 'What is Your Goal?',
    subtitle: 'Select your primary fitness goal',
    options: [
      { id: 'lose', label: 'Lose Weight', desc: 'Fat loss & body toning', icon: 'trending-down', color: C.blue },
      { id: 'gain', label: 'Build Muscle', desc: 'Strength & mass building', icon: 'trending-up', color: C.brand },
      { id: 'fit', label: 'Stay Fit', desc: 'Overall health & stamina', icon: 'heart', color: C.green },
      { id: 'sport', label: 'Sports Performance', desc: 'Athletic training', icon: 'trophy', color: C.gold },
    ],
  },
  {
    id: 'level',
    emoji: '💪',
    title: 'What is Your Fitness Level?',
    subtitle: 'Tell us your current experience',
    options: [
      { id: 'beginner', label: 'Beginner', desc: 'Just getting started', icon: 'leaf', color: C.green },
      { id: 'intermediate', label: 'Intermediate', desc: '6+ months experience', icon: 'flame', color: C.brand },
      { id: 'advanced', label: 'Advanced', desc: '2+ years of training', icon: 'rocket', color: C.brand },
      { id: 'athlete', label: 'Athlete', desc: 'Competition level', icon: 'medal', color: C.gold },
    ],
  },
  {
    id: 'bodytype',
    emoji: '🧬',
    title: 'What is Your Body Type?',
    subtitle: 'Select your natural body type',
    options: [
      { id: 'slim', label: 'Ectomorph (Slim)', desc: 'Lean build, hard to gain weight', icon: 'body', color: C.blue },
      { id: 'muscular', label: 'Mesomorph (Athletic)', desc: 'Balanced, gains muscle easily', icon: 'fitness', color: C.brand },
      { id: 'bulky', label: 'Endomorph (Stocky)', desc: 'Larger frame, gains fat easily', icon: 'barbell', color: C.brand },
    ],
  },
  {
    id: 'time',
    emoji: '⏱️',
    title: 'How Much Time Per Day?',
    subtitle: 'Available time for daily exercise',
    options: [
      { id: '15', label: '15–20 Minutes', desc: 'Quick & efficient', icon: 'flash', color: C.gold },
      { id: '30', label: '30–45 Minutes', desc: 'Standard session', icon: 'time', color: C.green },
      { id: '60', label: '1 Hour+', desc: 'Full workout session', icon: 'timer', color: C.brand },
      { id: '90', label: '90 Min+', desc: 'Intensive training', icon: 'calendar', color: C.red },
    ],
  },
  {
    id: 'health',
    emoji: '🩺',
    title: 'Any Health Issues?',
    subtitle: 'So we can build a safe plan for you',
    options: [
      { id: 'none', label: 'No Issues', desc: 'Perfectly healthy', icon: 'checkmark-circle', color: C.green },
      { id: 'knee', label: 'Knee Problem', desc: 'Knee pain or injury', icon: 'medical', color: C.red },
      { id: 'back', label: 'Back Pain', desc: 'Lower or upper back pain', icon: 'medical', color: C.brand },
      { id: 'heart', label: 'Heart / Blood Pressure', desc: 'Cardiac or BP conditions', icon: 'heart-dislike', color: C.teal },
    ],
  },
];

const GOAL_MAP = { lose: 'weight_loss', gain: 'muscle_gain', fit: 'stay_fit', sport: 'stay_fit' };
const BODYTYPE_MAP = { slim: 'ectomorph', muscular: 'mesomorph', bulky: 'endomorph' };
const TIME_MAP = { '15': '15min', '30': '30min', '60': '60min', '90': '60min' };
const HEALTH_MAP = { none: 'none', knee: 'knee', back: 'back', heart: 'none' };

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadPending = async () => {
      try {
        const pending = await AsyncStorage.getItem('onboardingPending');
        setOnboardingPending(pending === 'true');
      } catch (_) {}
    };
    loadPending();
  }, []);

  const STEP_IMAGES = [
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80&fit=crop',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop',
    'https://images.unsplash.com/photo-1434682966571-82fbecee4bab?w=600&q=80&fit=crop',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80&fit=crop',
  ];

  const q = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  const handleSelect = (optionId) => {
    setSelected(optionId);
  };

  const handleNext = async () => {
    if (!selected) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setStep(step + 1);
      setSelected(null);
    } else {
      await AsyncStorage.setItem('onboardingAnswers', JSON.stringify(newAnswers));
      await AsyncStorage.setItem('onboardingDone', 'true');
      if (onboardingPending) {
        try {
          const normalized = {
            goal: GOAL_MAP[newAnswers.goal] || 'stay_fit',
            level: newAnswers.level || 'beginner',
            body_type: BODYTYPE_MAP[newAnswers.bodytype] || 'mesomorph',
            time: TIME_MAP[newAnswers.time] || '30min',
            health_issue: HEALTH_MAP[newAnswers.health] || 'none',
          };
          const generated = await planAPI.generatePlan(normalized);
          if (generated?.success && generated?.plan) {
            const planPayload = {
              ...generated.plan,
              generatedAt: new Date().toISOString(),
              source: 'onboarding',
            };
            const versionsRaw = await AsyncStorage.getItem('generatedPlanVersions');
            const versions = versionsRaw ? JSON.parse(versionsRaw) : [];
            versions.push({
              id: `${Date.now()}`,
              generatedAt: planPayload.generatedAt,
              goal: planPayload.goal,
              level: planPayload.level,
              source: 'onboarding',
            });
            await AsyncStorage.setItem('generatedPlanVersions', JSON.stringify(versions.slice(-20)));
            await AsyncStorage.setItem(
              'planSummary',
              JSON.stringify({
                why: planPayload.ai_advice || `Plan selected for ${planPayload.goal} at ${planPayload.level} level.`,
                generatedAt: planPayload.generatedAt,
              })
            );
            await AsyncStorage.setItem('generatedPlan', JSON.stringify(planPayload));
          }
        } catch (_) {
          // Plan generation failure should not block app entry.
        } finally {
          await AsyncStorage.removeItem('onboardingPending');
        }
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setSelected(answers[QUESTIONS[step - 1].id] || null);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient colors={[C.bg, C.surface]} style={StyleSheet.absoluteFillObject} />
      <View style={[s.topBlob, { backgroundColor: C.brand + '30' }]} />

      {/* Header */}
      <View style={s.header}>
        {step > 0 ? (
          <TouchableOpacity style={s.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <Text style={s.stepCount}>{step + 1} / {QUESTIONS.length}</Text>
        <TouchableOpacity
          onPress={() => {
            if (onboardingPending) {
              Alert.alert('Complete Setup', 'Please complete the quiz first so we can build your personalized plan.');
              return;
            }
            navigation.replace('Auth');
          }}
        >
          <Text style={s.skipText}>{onboardingPending ? 'Required' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {/* Image + Title */}
        <View style={s.titleSection}>
          <View style={s.stepImgBox}>
            <Image source={{ uri: STEP_IMAGES[step] }} style={s.stepImg} resizeMode="cover" />
            <LinearGradient colors={['transparent', C.bg]} style={StyleSheet.absoluteFillObject} />
            <View style={s.emojiOverlay}>
              <Text style={s.emoji}>{q.emoji}</Text>
            </View>
          </View>
          <Text style={s.title}>{q.title}</Text>
          <Text style={s.subtitle}>{q.subtitle}</Text>
        </View>

        {/* Options */}
        <View style={s.optionsGrid}>
          {q.options.map((opt, i) => {
            const isSelected = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  s.optionCard,
                  q.options.length <= 3 && s.optionCardFull,
                  isSelected && s.optionCardSelected,
                  isSelected && { borderColor: opt.color },
                ]}
                onPress={() => handleSelect(opt.id)}
                activeOpacity={0.85}
              >
                {isSelected && (
                  <LinearGradient
                    colors={[opt.color + '25', opt.color + '10']}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={[s.optionIconBox, { backgroundColor: opt.color + '20' }]}>
                  <Ionicons name={opt.icon} size={22} color={opt.color} />
                </View>
                <View style={s.optionText}>
                  <Text style={s.optionLabel}>{opt.label}</Text>
                  <Text style={s.optionDesc}>{opt.desc}</Text>
                </View>
                {isSelected && (
                  <View style={[s.checkCircle, { backgroundColor: opt.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Next Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, !selected && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selected ? [C.brand, C.brandDark] : [C.surface2, C.surface]}
            style={s.nextBtnGrad}
          >
            <Text style={[s.nextBtnText, !selected && { color: C.textMuted }]}>
              {step === QUESTIONS.length - 1 ? 'Start My Journey' : 'Next'}
            </Text>
            <Ionicons
              name={step === QUESTIONS.length - 1 ? 'rocket' : 'arrow-forward'}
              size={18}
              color={selected ? '#FFFFFF' : C.textMuted}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Step dots */}
        <View style={s.dots}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBlob: {
    position: 'absolute', top: -80, right: -40,
    width: 200, height: 200, borderRadius: 100,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: IS_SMALL ? 10 : 16, paddingBottom: 12,
  },
  backBtn: {
    width: IS_SMALL ? 34 : 40, height: IS_SMALL ? 34 : 40, borderRadius: 12,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  stepCount: { fontSize: 14, fontWeight: '700', color: C.textSub },
  skipText: { fontSize: 14, color: C.textMuted, fontWeight: '600' },
  progressTrack: {
    height: 4, backgroundColor: C.surface2,
    marginHorizontal: IS_SMALL ? 12 : 20, borderRadius: 2, marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: C.brand, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: IS_SMALL ? 12 : 20 },
  titleSection: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  stepImgBox: {
    width: '100%', height: IS_TABLET ? 180 : (IS_SMALL ? 120 : 140), borderRadius: 20,
    overflow: 'hidden', marginBottom: 8, position: 'relative',
  },
  stepImg: { width: '100%', height: '100%' },
  emojiOverlay: {
    position: 'absolute', bottom: 10, right: 14,
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.bg + 'E0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emoji: { fontSize: 28 },
  title: { fontSize: IS_SMALL ? 19 : 22, fontWeight: '900', color: C.text, textAlign: 'center' },
  subtitle: { fontSize: IS_SMALL ? 12 : 13, color: C.textSub, textAlign: 'center' },
  optionsGrid: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 18, padding: IS_SMALL ? 12 : 16,
    borderWidth: 1.5, borderColor: C.border,
    overflow: 'hidden',
    width: '100%',
  },
  optionCardFull: { width: '100%' },
  optionCardSelected: { borderWidth: 1.5 },
  optionIconBox: {
    width: IS_SMALL ? 40 : 46, height: IS_SMALL ? 40 : 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  optionDesc: { fontSize: IS_SMALL ? 11 : 12, color: C.textMuted },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  footer: { paddingHorizontal: IS_SMALL ? 12 : 20, paddingBottom: 36, gap: 16 },
  nextBtn: { borderRadius: 18, overflow: 'hidden' },
  nextBtnDisabled: {},
  nextBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  nextBtnText: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '800', color: '#FFFFFF' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.border,
  },
  dotActive: { backgroundColor: C.brand, width: 24, borderRadius: 4 },
  dotDone: { backgroundColor: C.brandLight },
});


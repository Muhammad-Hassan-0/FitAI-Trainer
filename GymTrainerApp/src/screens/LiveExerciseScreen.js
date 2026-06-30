import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Alert, Vibration,
  ScrollView, Animated, Platform, DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiAPI, progressAPI, poseAPI } from '../services/api';
import * as Speech from 'expo-speech';
import { C } from '../theme';
import YouTubePlayer from '../components/YouTubePlayer';
import { getExerciseVideoId } from '../data/exerciseVideos';
import { createRepCounter, EXERCISE_TRACKING } from '../utils/repCounter';

const { width, height } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;
const FRAME_ANALYSIS_INTERVAL_MS = Platform.OS === 'android' ? 600 : 450;

// ── Per-exercise config with YouTube tutorials ──────────────────────────────
const EXERCISE_CONFIG = {
  squat: {
    joint: 'Knee Angle',
    downAngle: 90,
    upAngle: 160,
    downText: 'Drive up — push through heels!',
    upText:   'Squat down — full depth!',
    correctText: 'Perfect depth — hold!',
    targetReps: 10,
    tips: [
      'Keep chest tall and back straight',
      'Push knees out, in line with toes',
      'Drive hips back, not straight down',
    ],
    muscles: 'Quads · Glutes · Hamstrings',
    videoId: 'ultWZbUMPL8',
    videoTitle: 'Perfect Squat Form — Full Tutorial',
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=700&q=80',
    cues: ['🦵 Sit back into hips', '👁️ Eyes forward', '💨 Breathe in on the way down', '💪 Drive through heels coming up'],
  },
  pushup: {
    joint: 'Elbow Angle',
    downAngle: 90,
    upAngle: 160,
    downText: 'Lower chest to the floor!',
    upText:   'Push up — fully extend arms!',
    correctText: 'Great form — squeeze at top!',
    targetReps: 10,
    tips: [
      'Keep body in a rigid straight line',
      'Elbows at 45° — not flared wide',
      'Full range of motion every rep',
    ],
    muscles: 'Chest · Triceps · Shoulders',
    videoId: 'IODxDxX7oi4',
    videoTitle: 'Perfect Push-Up Form — Tutorial',
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=700&q=80',
    cues: ['🤜 Hands shoulder-width', '💪 Core braced tight', '📐 Elbows 45° angle', '🔽 Chest nearly touches floor'],
  },
  curl: {
    joint: 'Elbow Angle',
    downAngle: 160,
    upAngle: 40,
    downText: 'Lower slowly — feel the stretch!',
    upText:   'Curl up — squeeze the bicep!',
    correctText: 'Perfect contraction!',
    targetReps: 12,
    tips: [
      'Keep elbows locked at your sides',
      'Control the negative (lower slowly)',
      'Full extension at the bottom',
    ],
    muscles: 'Biceps · Brachialis',
    videoId: 'ykJmrZ5v0Oo',
    videoTitle: 'Perfect Bicep Curl Form — Tutorial',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=700&q=80',
    cues: ['🙅 No swinging', '⏱️ 2 sec up, 3 sec down', '💪 Full squeeze at top', '🔒 Elbows pinned to sides'],
  },
  plank: {
    joint: 'Back Angle',
    correctRange: [160, 180],
    targetDuration: 30,
    correctText: 'Hold strong — breathe!',
    wrongText: 'Fix your hips — level them out!',
    targetReps: 3,
    tips: [
      'Hips must be perfectly level',
      'Draw navel toward spine',
      'Look slightly ahead of hands',
    ],
    muscles: 'Core · Abs · Lower Back',
    videoId: 'pSHjTRCQxIw',
    videoTitle: 'Perfect Plank Form — Tutorial',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80',
    cues: ['📏 Body in a straight line', '🔥 Squeeze glutes too', '💨 Steady breathing', '⏱️ Build to 60 seconds'],
  },
  lunge: {
    joint: 'Front Knee',
    downAngle: 90,
    upAngle: 160,
    downText: 'Push back up — drive through heel!',
    upText:   'Step forward — lower the back knee!',
    correctText: '90° front knee — perfect!',
    targetReps: 10,
    tips: [
      'Front knee stays above ankle',
      'Back knee hovers just off floor',
      'Torso tall — do not lean forward',
    ],
    muscles: 'Quads · Glutes · Hip Flexors',
    videoId: 'QOVaHwm-Q6U',
    videoTitle: 'Perfect Lunge Form — Tutorial',
    image: 'https://images.unsplash.com/photo-1434682966571-82fbecee4bab?w=700&q=80',
    cues: ['👣 Long stride forward', '📐 90° both knees', '⬆️ Chest stays tall', '🦵 Equal weight both legs'],
  },
};

const STAGES = { IDLE: 'idle', UP: 'up', DOWN: 'down', CORRECT: 'correct', WRONG: 'wrong' };
const PHASES = { TUTORIAL: 'tutorial', COUNTDOWN: 'countdown', ACTIVE: 'active' };

// ── Animated rep flash ────────────────────────────────────────────────────────
function RepFlash({ count }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      prevCount.current = count;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 150, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [count]);

  return (
    <Animated.View style={[rf.badge, { transform: [{ scale }], opacity }]}>
      <Text style={rf.text}>+1 REP</Text>
    </Animated.View>
  );
}
const rf = StyleSheet.create({
  badge: {
    position: 'absolute', top: -50, alignSelf: 'center',
    backgroundColor: C.lime, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 30,
  },
  text: { fontSize: 14, fontWeight: '900', color: '#000000' },
});

export default function LiveExerciseScreen({ route, navigation }) {
  const exercise = route?.params?.exercise || { id: 'squat', name: 'Squats' };
  const config = { ...(EXERCISE_CONFIG[exercise.id] || EXERCISE_CONFIG.squat) };
  const initialTab = typeof route?.params?.initialTab === 'number' ? route.params.initialTab : 0;
  if (!config.videoId) config.videoId = getExerciseVideoId(exercise) || 'ultWZbUMPL8';
  if (!config.videoTitle) config.videoTitle = `${exercise.name} Tutorial`;
  if (route?.params?.forceVideoId) config.videoId = route.params.forceVideoId;
  if (route?.params?.forceVideoTitle) config.videoTitle = route.params.forceVideoTitle;
  const nextExercise = route?.params?.nextExercise || null;
  const completionKey = route?.params?.completionKey || null;

  const tracking = EXERCISE_TRACKING[exercise.id] || EXERCISE_TRACKING.squat;
  const cameraHint = tracking.cameraHint;

  const [permission, setPermission] = useState(null);
  const [phase, setPhase] = useState(PHASES.TUTORIAL);
  const [countdown, setCountdown] = useState(3);
  const [isStarted, setIsStarted] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState(STAGES.IDLE);
  const [feedback, setFeedback] = useState('Step in front of the camera');
  const [feedbackColor, setFeedbackColor] = useState(C.text);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [timer, setTimer] = useState(0);
  const [set, setSet] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [facing, setFacing] = useState(tracking.facing === 'front' ? 'front' : 'back');
  const [isTracking, setIsTracking] = useState(false);
  const [aiFeeback, setAiFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [skeletonPulse] = useState(new Animated.Value(1));
  const angleAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState(initialTab); // For tutorial tabs
  const [voiceCoaching, setVoiceCoaching] = useState(true);

  useEffect(() => {
    Camera.getCameraPermissionsAsync().then(r => setPermission(r));
    AsyncStorage.getItem('appPrefs')
      .then((raw) => {
        if (!raw) return;
        const prefs = JSON.parse(raw);
        setVoiceCoaching(prefs.voiceCoach !== false);
      })
      .catch(() => {});
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const requestPerm = async () => {
    const r = await Camera.requestCameraPermissionsAsync();
    setPermission(r);
    return r;
  };

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const isCapturingRef = useRef(false);
  const demoModeRef = useRef(false);
  const repCounterRef = useRef(null);
  const missedFramesRef = useRef(0);
  const lastPoseRef = useRef(null);
  const countdownRef = useRef(null);

  if (!repCounterRef.current) {
    repCounterRef.current = createRepCounter({
      inverted: tracking.inverted,
      downEnter: tracking.downEnter,
      upEnter: tracking.upEnter,
      bottomFramesRequired: exercise.id === 'curl' ? 1 : 2,
    });
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(captureIntervalRef.current);
      clearInterval(countdownRef.current);
      Speech.stop();
    };
  }, []);

  // ── Countdown ──────────────────────────────────────────────────────────────
  const startCountdown = async () => {
    demoModeRef.current = false;
    if (!permission?.granted) {
      const result = await requestPerm();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Allow camera access to monitor your exercise form in real time.', [
          { text: 'Cancel', onPress: () => setPhase(PHASES.TUTORIAL) },
          { text: 'Allow', onPress: () => requestPerm() },
        ]);
        return;
      }
    }
    setPhase(PHASES.COUNTDOWN);
    let count = 3;
    Speech.speak('Get ready!', { language: 'en', rate: 1.0 });
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownRef.current);
        Speech.speak('Go!', { language: 'en', rate: 1.0 });
        setTimeout(() => startExercise(), 300);
      }
    }, 1000);
  };

  const startExercise = () => {
    setPhase(PHASES.ACTIVE);
    setIsStarted(true);
    setRepCount(0);
    setGoodReps(0);
    setFormErrors([]);
    setTimer(0);
    setAccuracy(0);
    setIsTracking(false);
    setFeedback(cameraHint);
    setFeedbackColor(C.lime);
    repCounterRef.current?.reset();
    missedFramesRef.current = 0;
    lastPoseRef.current = null;
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    isCapturingRef.current = false;
    captureIntervalRef.current = setInterval(() => captureAndAnalyze(), FRAME_ANALYSIS_INTERVAL_MS);
  };

  const captureAndAnalyze = async () => {
    if (isCapturingRef.current) return;
    if (!demoModeRef.current && !cameraRef.current) return;

    isCapturingRef.current = true;
    try {
      let data;
      if (demoModeRef.current) {
        simulatePoseDetection();
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.55,
        skipProcessing: Platform.OS === 'android',
        exif: false,
      });

      data = await poseAPI.analyzeFrame(photo.base64, exercise.id);

      if (!data || data.detected === false || data.angle == null) {
        missedFramesRef.current += 1;
        setIsTracking(false);
        const hint = data?.camera_hint || data?.feedback || cameraHint;
        if (missedFramesRef.current >= 2) {
          setFeedback(hint);
          setFeedbackColor(C.gold);
          setFormErrors(data?.form_warnings || [{ message: hint }]);
        }
        if (lastPoseRef.current && missedFramesRef.current < 5) {
          handlePoseData(lastPoseRef.current, true);
        }
        return;
      }

      missedFramesRef.current = 0;
      lastPoseRef.current = data;
      setIsTracking(true);
      handlePoseData(data);
    } catch (_) {
      missedFramesRef.current += 1;
      if (missedFramesRef.current >= 3) {
        setFeedback('Cannot reach server — start backend: python app.py');
        setFeedbackColor(C.red);
      }
    } finally {
      isCapturingRef.current = false;
    }
  };

  const simulatePoseDetection = () => {
    const cycle = Math.floor(Date.now() / 2200) % 2;
    const angle = cycle === 0 ? 55 : 145;
    handlePoseData({
      angle,
      joint: config.joint,
      is_correct: true,
      detected: true,
      confidence: 85,
      form_errors: [],
      form_warnings: [],
      depth_ok: cycle === 0,
      position: cycle === 0 ? 'bottom' : 'top',
      thresholds: {
        down_enter: tracking.downEnter,
        up_enter: tracking.upEnter,
        inverted: tracking.inverted,
      },
    });
  };

  const speak = (text) => {
    if (!voiceCoaching) return;
    try { Speech.speak(text, { language: 'en', rate: 1.1, pitch: 1.0 }); } catch (_) {}
  };

  const handlePoseData = (data, isCached = false) => {
    const { angle } = data;
    if (angle == null || Number.isNaN(angle)) return;

    const roundedAngle = Math.round(angle);
    setCurrentAngle(roundedAngle);
    Animated.timing(angleAnim, { toValue: roundedAngle, duration: 200, useNativeDriver: false }).start();

    const conf = data.confidence ?? 0;
    if (!isCached) {
      setAccuracy(Math.round(conf));
      setIsTracking(conf >= 20);
    }

    const errors = data.form_errors || [];
    const warnings = data.form_warnings || [];
    const displayIssues = [...errors, ...warnings];
    if (!isCached) setFormErrors(displayIssues);

    if (exercise.id === 'plank') {
      const ok = warnings.length === 0 && errors.length === 0;
      setStage(ok ? STAGES.CORRECT : STAGES.WRONG);
      setFeedback(data.feedback || (ok ? config.correctText : config.wrongText));
      setFeedbackColor(ok ? C.lime : C.gold);
      return;
    }

    const result = repCounterRef.current?.process(angle, data);

    if (result?.event === 'rep') {
      setRepCount(prev => {
        const n = prev + 1;
        speak(`${n}`);
        if (n >= config.targetReps) {
          handleSetComplete();
          speak('Set complete! Great work!');
        }
        return n;
      });

      if (result.quality === 'good') {
        setGoodReps(g => g + 1);
        setAccuracy(prev => Math.min(100, Math.round(prev * 0.8 + 20)));
        Vibration.vibrate(50);
        setFeedback(`Rep counted! ${result.message || 'Good form!'}`);
        setFeedbackColor(C.lime);
      } else {
        setAccuracy(prev => Math.max(40, Math.round(prev * 0.85 + 8)));
        Vibration.vibrate([0, 35, 35, 35]);
        setFeedback(`Rep counted — ${result.message || 'watch your form'}`);
        setFeedbackColor(C.gold);
        speak('Rep counted, check form');
      }
      return;
    }

    if (result?.event === 'shallow') {
      Vibration.vibrate([0, 50, 50, 50]);
      setFeedback(result.message || 'Go deeper — rep not counted');
      setFeedbackColor(C.red);
      setStage(STAGES.WRONG);
      speak('Go deeper');
      return;
    }

    const primaryFeedback = data.feedback || config.correctText;
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    if (hasErrors) {
      setFeedback(primaryFeedback);
      setFeedbackColor(C.red);
      setStage(STAGES.WRONG);
    } else if (hasWarnings) {
      setFeedback(primaryFeedback);
      setFeedbackColor(C.gold);
      setStage(STAGES.WRONG);
    } else if (data.position === 'bottom') {
      setStage(STAGES.DOWN);
      setFeedback(primaryFeedback);
      setFeedbackColor(C.lime);
    } else if (data.position === 'top') {
      setStage(STAGES.UP);
      setFeedback(primaryFeedback);
      setFeedbackColor(C.brand);
    } else {
      setStage(STAGES.CORRECT);
      setFeedback(primaryFeedback);
      setFeedbackColor(C.text);
    }
  };

  const handleSetComplete = () => {
    clearInterval(captureIntervalRef.current);
    setIsStarted(false);
    Vibration.vibrate([0, 100, 100, 100]);
    setFeedback('Set Complete! 🎉');
    setFeedbackColor(C.gold);
  };

  const stopExercise = async () => {
    clearInterval(timerRef.current);
    clearInterval(captureIntervalRef.current);
    setIsStarted(false);
    saveSession();
    fetchAIFeedback();
  };

  const fetchAIFeedback = async () => {
    try {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const accuracy = Math.round(70 + Math.random() * 25);
      const result = await geminiAPI.getExerciseFeedback(exercise.name, repCount, accuracy, timer, profile);
      setAiFeedback(result?.feedback || `Great work! You completed ${repCount} reps in ${formatTime(timer)}. Your form is improving — stay consistent! 💪`);
      setShowFeedbackModal(true);
    } catch (_) {
      setAiFeedback(`Excellent! ${repCount} reps of ${exercise.name} done. Every rep counts — keep showing up! 💪`);
      setShowFeedbackModal(true);
    }
  };

  const saveSession = async () => {
    try {
      const sessions = JSON.parse(await AsyncStorage.getItem('sessions') || '[]');
      sessions.push({ exercise: exercise.name, reps: repCount, duration: timer, date: new Date().toISOString(), set });
      await AsyncStorage.setItem('sessions', JSON.stringify(sessions));

      // Persist on backend (real user progress) + sync latest stats.
      try {
        await progressAPI.saveSession({
          exercise: exercise.id || exercise.name,
          reps: repCount,
          accuracy,
          duration: timer,
          set,
          date: new Date().toISOString(),
        });
        const remote = await progressAPI.getStats();
        if (remote?.success && remote?.stats) {
          await AsyncStorage.setItem('userStats', JSON.stringify(remote.stats));
        }
      } catch (_) {
        const stats = JSON.parse(await AsyncStorage.getItem('userStats') || '{}');
        stats.totalSessions = (stats.totalSessions || 0) + 1;
        stats.totalReps = (stats.totalReps || 0) + repCount;
        await AsyncStorage.setItem('userStats', JSON.stringify(stats));
      }

      // Mark this exercise completed in programme context.
      if (completionKey) {
        const doneMap = JSON.parse(await AsyncStorage.getItem('completedExercises') || '{}');
        doneMap[completionKey] = true;
        await AsyncStorage.setItem('completedExercises', JSON.stringify(doneMap));
      }

      // Tell dashboard/progress screens to refresh instantly.
      DeviceEventEmitter.emit('progressUpdated', {
        exercise: exercise.id || exercise.name,
        reps: repCount,
      });
    } catch (_) {}
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── PHASE: TUTORIAL ─────────────────────────────────────────────────────────
  if (phase === PHASES.TUTORIAL) {
    const TABS = ['Overview', 'Tutorial Video', 'Tips & Cues'];
    return (
      <SafeAreaView style={styles.tutRoot} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.tutHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.tutHeaderTitle}>
            <Text style={styles.tutExName}>{exercise.name}</Text>
            <Text style={styles.tutMuscles}>{config.muscles}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabBtnText, activeTab === i && styles.tabBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tutScroll}>

          {activeTab === 0 && (
            /* ── OVERVIEW TAB ── */
            <View style={styles.tabContent}>
              {/* Hero image */}
              <View style={styles.heroImgWrap}>
                {Platform.OS === 'web' ? (
                  <img src={config.image} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
                <LinearGradient colors={['transparent', '#000000EE']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.heroOverlay}>
                  <View style={[styles.heroTag, { backgroundColor: C.brand + '30', borderColor: C.brand + '60' }]}>
                    <Ionicons name="barbell" size={11} color={C.brand} />
                    <Text style={[styles.heroTagText, { color: C.brand }]}>STRENGTH EXERCISE</Text>
                  </View>
                  <Text style={styles.heroTitle}>{exercise.name}</Text>
                  <Text style={styles.heroSub}>{config.muscles}</Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={styles.overviewStats}>
                {[
                  { icon: '🔁', label: 'Target Reps', val: `${config.targetReps}` },
                  { icon: '📦', label: 'Sets', val: '3–4' },
                  { icon: '⏱️', label: 'Rest', val: '60–90s' },
                  { icon: '🔥', label: 'Muscle', val: config.muscles.split('·')[0].trim() },
                ].map((s, i) => (
                  <View key={i} style={styles.overviewStat}>
                    <Text style={styles.overviewStatIcon}>{s.icon}</Text>
                    <Text style={styles.overviewStatVal}>{s.val}</Text>
                    <Text style={styles.overviewStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Common mistakes */}
              <View style={styles.overviewCard}>
                <View style={styles.overviewCardHeader}>
                  <Ionicons name="alert-circle" size={16} color={C.red} />
                  <Text style={styles.overviewCardTitle}>Common Mistakes to Avoid</Text>
                </View>
                {['Rushing through reps (slow down!)', 'Half reps — use full range of motion', 'Holding your breath — keep breathing steadily'].map((m, i) => (
                  <View key={i} style={styles.overviewMistake}>
                    <Ionicons name="close-circle" size={14} color={C.red} />
                    <Text style={styles.overviewMistakeText}>{m}</Text>
                  </View>
                ))}
              </View>

              {/* Go to video */}
              <TouchableOpacity style={styles.watchVideoBtn} onPress={() => setActiveTab(1)}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <Text style={styles.watchVideoBtnText}>Watch Tutorial Video</Text>
                <Ionicons name="arrow-forward" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 1 && (
            /* ── VIDEO TAB ── */
            <View style={styles.tabContent}>
              <View style={styles.videoCard}>
                <View style={styles.videoHeader}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  <View>
                    <Text style={styles.videoTitle}>Exercise Tutorial</Text>
                    <Text style={styles.videoSub}>Watch before you start — learn perfect form</Text>
                  </View>
                </View>
                <YouTubePlayer videoId={config.videoId} title={config.videoTitle} />
              </View>

              <View style={styles.videoNoteCard}>
                <Ionicons name="information-circle" size={18} color={C.blue} />
                <Text style={styles.videoNoteText}>
                  Watch the full video, paying attention to joint angles and body alignment. Then tap "Start Exercise" below.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 2 && (
            /* ── TIPS & CUES TAB ── */
            <View style={styles.tabContent}>
              <Text style={styles.cuesTitle}>Form Cues</Text>
              <Text style={styles.cuesSub}>Mental reminders to focus on during every rep</Text>
              {config.cues?.map((cue, i) => (
                <View key={i} style={[styles.cueCard, { borderLeftColor: i % 2 === 0 ? C.brand : C.lime }]}>
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}

              <Text style={[styles.cuesTitle, { marginTop: 20 }]}>Trainer Tips</Text>
              {config.tips?.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipNum}>
                    <Text style={styles.tipNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA Button */}
          <View style={styles.ctaArea}>
            <TouchableOpacity style={styles.ctaBtn} onPress={startCountdown} activeOpacity={0.88}>
              <LinearGradient colors={[C.brand, C.brandDark]} style={styles.ctaBtnGrad}>
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
                <Text style={styles.ctaBtnText}>Start Exercise with Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaBtnSecondary} onPress={() => {
              demoModeRef.current = true;
              setPhase(PHASES.ACTIVE);
              setIsStarted(true);
              setRepCount(0);
              setGoodReps(0);
              setTimer(0);
              repCounterRef.current?.reset();
              timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
              captureIntervalRef.current = setInterval(() => captureAndAnalyze(), FRAME_ANALYSIS_INTERVAL_MS);
            }}>
              <Text style={styles.ctaBtnSecondaryText}>Skip Camera — Use Demo Mode</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PHASE: COUNTDOWN ────────────────────────────────────────────────────────
  if (phase === PHASES.COUNTDOWN) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.bg, '#000000']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
          <Animated.Text style={styles.countdownNumber}>{countdown}</Animated.Text>
          <Text style={styles.countdownSub}>{exercise.name}</Text>
          <View style={styles.countdownCues}>
            {config.cues?.slice(0, 2).map((c, i) => (
              <Text key={i} style={styles.countdownCue}>{c}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── PHASE: ACTIVE ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* AI Feedback Modal */}
      {showFeedbackModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={[C.brand, C.brandDark]} style={styles.modalHeader}>
              <Ionicons name="hardware-chip" size={24} color="#FFFFFF" />
              <Text style={styles.modalTitle}>AI Trainer Feedback</Text>
              <Text style={styles.modalSubtitle}>Session analysis summary</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <View style={styles.modalStats}>
                {[
                  { val: repCount, lbl: 'Reps' },
                  { val: formatTime(timer), lbl: 'Time' },
                  { val: set, lbl: 'Sets' },
                  { val: `${accuracy}%`, lbl: 'Form' },
                ].map((s, i) => (
                  <View key={i} style={styles.modalStat}>
                    <Text style={[styles.modalStatVal, i === 3 && { color: accuracy > 80 ? C.lime : C.gold }]}>{s.val}</Text>
                    <Text style={styles.modalStatLbl}>{s.lbl}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.modalFeedback}>{aiFeeback}</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowFeedbackModal(false);
                  if (nextExercise) {
                    navigation.replace('LiveExercise', {
                      exercise: nextExercise,
                      nextExercise: route?.params?.nextNextExercise || null,
                      completionKey: route?.params?.nextCompletionKey || null,
                    });
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <LinearGradient colors={[C.brand, C.brandDark]} style={styles.modalCloseBtnGrad}>
                  <Text style={styles.modalCloseBtnText}>{nextExercise ? 'Next Exercise' : 'Back to Dashboard'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Camera */}
      {permission?.granted ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          type={facing === 'front' ? CameraType.front : CameraType.back}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.noCameraPlaceholder]}>
          <LinearGradient colors={['#0A0A14', '#000000']} style={StyleSheet.absoluteFillObject} />
          {/* Human body wireframe skeleton for demo mode */}
          <View style={styles.skeletonWrapper}>
            {/* Head */}
            <Animated.View style={[styles.skHead, { opacity: skeletonPulse, borderColor: feedbackColor }]} />
            {/* Neck */}
            <View style={[styles.skBone, { width: 2, height: 22, alignSelf: 'center', backgroundColor: feedbackColor + '80' }]} />
            {/* Shoulders */}
            <View style={[styles.skBone, { width: 100, height: 2, alignSelf: 'center', backgroundColor: feedbackColor + '80' }]} />
            {/* Upper arms */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 120, alignSelf: 'center' }}>
              <View style={[styles.skBone, { width: 2, height: 50, backgroundColor: feedbackColor + '80', transform: [{ rotate: '-20deg' }] }]} />
              <View style={[styles.skBone, { width: 2, height: 50, backgroundColor: feedbackColor + '80', transform: [{ rotate: '20deg' }] }]} />
            </View>
            {/* Torso */}
            <View style={[styles.skBone, { width: 2, height: 70, alignSelf: 'center', backgroundColor: feedbackColor + '90' }]} />
            {/* Hip */}
            <View style={[styles.skBone, { width: 70, height: 2, alignSelf: 'center', backgroundColor: feedbackColor + '80' }]} />
            {/* Legs */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: 100, alignSelf: 'center' }}>
              <View>
                <View style={[styles.skBone, { width: 2, height: 60, backgroundColor: feedbackColor + '90',
                  transform: [{ rotate: stage === STAGES.DOWN ? '15deg' : '-5deg' }] }]} />
                <View style={[styles.skBone, { width: 2, height: 55, backgroundColor: feedbackColor + '80',
                  transform: [{ rotate: stage === STAGES.DOWN ? '-10deg' : '5deg' }] }]} />
              </View>
              <View>
                <View style={[styles.skBone, { width: 2, height: 60, backgroundColor: feedbackColor + '90',
                  transform: [{ rotate: stage === STAGES.DOWN ? '-15deg' : '5deg' }] }]} />
                <View style={[styles.skBone, { width: 2, height: 55, backgroundColor: feedbackColor + '80',
                  transform: [{ rotate: stage === STAGES.DOWN ? '10deg' : '-5deg' }] }]} />
              </View>
            </View>
          </View>
          <View style={styles.noCameraContent}>
            <View style={[styles.demoModeBadge, { backgroundColor: feedbackColor + '20', borderColor: feedbackColor + '40' }]}>
              <View style={[styles.demoModeDot, { backgroundColor: feedbackColor }]} />
              <Text style={[styles.demoModeText, { color: feedbackColor }]}>DEMO MODE — AI Simulation Active</Text>
            </View>
          </View>
        </View>
      )}

      {/* Dark Overlay */}
      <LinearGradient
        colors={['#000000CC', 'transparent', 'transparent', '#000000EE']}
        locations={[0, 0.15, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top', 'left', 'right']}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => { stopExercise(); navigation.goBack(); }}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.exerciseNameBadge}>
          <Text style={styles.exerciseNameText}>{exercise.name}</Text>
        </View>

        <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Accuracy HUD — top left */}
      {isStarted && (
        <View style={styles.accuracyHUD}>
          <View style={[styles.accuracyRing, {
            borderColor: isTracking ? (accuracy > 60 ? C.lime : C.gold) : C.red,
          }]}>
            <Text style={[styles.accuracyVal, {
              color: isTracking ? (accuracy > 60 ? C.lime : C.gold) : C.red,
            }]}>
              {isTracking ? `${accuracy}%` : '—'}
            </Text>
          </View>
          <Text style={styles.accuracyLabel}>{isTracking ? 'Tracking' : 'No signal'}</Text>
        </View>
      )}

      {/* Angle Arc Indicator — top right */}
      {isStarted && currentAngle !== null && (
        <View style={styles.angleBox}>
          {/* Arc visualizer */}
          <View style={styles.angleArcWrap}>
            <View style={[styles.angleArcBg, { borderColor: C.surface2 }]} />
            <View style={[styles.angleArcFill, {
              borderColor: feedbackColor,
              transform: [{ rotate: `${-90 + (currentAngle / 180) * 180}deg` }],
            }]} />
            <View style={styles.angleCenter}>
              <Text style={[styles.angleValue, { color: feedbackColor }]}>{currentAngle}°</Text>
            </View>
          </View>
          <Text style={styles.angleLabel}>{config.joint?.toUpperCase()}</Text>
        </View>
      )}

      {/* Feedback Card */}
      <View style={[styles.feedbackCard, { borderColor: feedbackColor + '50' }]}>
        <Text style={[styles.feedbackText, { color: feedbackColor }]}>{feedback}</Text>
        {formErrors.length > 0 && (
          <View style={styles.errorList}>
            {formErrors.slice(0, 2).map((err, i) => (
              <View key={i} style={styles.errorRow}>
                <Ionicons
                  name={err.code?.startsWith('shallow') || err.code === 'incomplete_curl' ? 'close-circle' : 'warning'}
                  size={14}
                  color={err.code?.startsWith('shallow') ? C.red : C.gold}
                />
                <Text style={[styles.errorText, { color: err.code?.startsWith('shallow') ? C.red : C.gold }]}>
                  {err.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <Text style={styles.statValue}>{repCount}</Text>
              <RepFlash count={repCount} />
            </View>
            <Text style={styles.statLabel}>Reps</Text>
            <Text style={styles.statTarget}>/ {config.targetReps || 10}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{set}</Text>
            <Text style={styles.statLabel}>Set</Text>
            <Text style={styles.statTarget}>/ 3</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatTime(timer)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.repProgress}>
          <LinearGradient
            colors={[C.brand, C.lime]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.repProgressFill, { width: `${Math.min((repCount / (config.targetReps || 10)) * 100, 100)}%` }]}
          />
        </View>

        {/* Tip */}
        <Text style={styles.tipText}>
          💡 {config.tips?.[repCount % (config.tips?.length || 1)] || 'Focus on every rep — quality beats quantity!'}
        </Text>

        {/* Controls */}
        <View style={styles.controlRow}>
          {!isStarted ? (
            <TouchableOpacity style={styles.startBigBtn} onPress={startExercise} activeOpacity={0.85}>
              <LinearGradient colors={[C.brand, C.brandDark]} style={styles.startBigBtnGrad}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.startBigBtnText}>Start Exercise</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={styles.pauseBtn} onPress={stopExercise}>
                <Ionicons name="stop" size={22} color={C.red} />
                <Text style={styles.pauseBtnText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextSetBtn}
                onPress={() => { setRepCount(0); setSet(s => s + 1); }}
              >
                <LinearGradient colors={[C.lime, C.teal]} style={styles.nextSetBtnGrad}>
                  <Text style={styles.nextSetBtnText}>Next Set</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0A0A0A" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Tutorial Phase ──────────────────────────────────────────────────────────
  tutRoot: { flex: 1, backgroundColor: C.bg },
  tutHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: IS_SMALL ? 12 : 16,
    paddingVertical: IS_SMALL ? 10 : 12, gap: 12,
  },
  backBtn: {
    width: IS_SMALL ? 36 : 40, height: IS_SMALL ? 36 : 40, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  tutHeaderTitle: { flex: 1, alignItems: 'center' },
  tutExName: { fontSize: IS_SMALL ? 15 : 17, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  tutMuscles: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  tabBar: {
    flexDirection: 'row', paddingHorizontal: IS_SMALL ? 12 : 16, gap: 6, marginBottom: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabBtnText: { fontSize: IS_SMALL ? 10 : 11, fontWeight: '700', color: C.textMuted },
  tabBtnTextActive: { color: '#FFFFFF' },

  tutScroll: { paddingHorizontal: IS_SMALL ? 12 : 16, paddingTop: IS_SMALL ? 8 : 12 },
  tabContent: { gap: 14 },

  heroImgWrap: {
    height: IS_TABLET ? 240 : (IS_SMALL ? 176 : 200), borderRadius: 20, overflow: 'hidden',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'flex-end',
  },
  heroOverlay: { padding: 16 },
  heroTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, marginBottom: 8,
  },
  heroTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontSize: IS_SMALL ? 18 : 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  heroSub: { fontSize: 12, color: '#FFFFFFBB', marginTop: 2 },

  overviewStats: {
    flexDirection: 'row', backgroundColor: C.surface, flexWrap: 'wrap',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border,
  },
  overviewStat: { flex: IS_SMALL ? 0 : 1, width: IS_SMALL ? '50%' : undefined, alignItems: 'center', gap: 4, marginBottom: IS_SMALL ? 8 : 0 },
  overviewStatIcon: { fontSize: 20 },
  overviewStatVal: { fontSize: 16, fontWeight: '900', color: C.text },
  overviewStatLabel: { fontSize: 9, color: C.textMuted, fontWeight: '600' },

  overviewCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },
  overviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overviewCardTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  overviewMistake: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  overviewMistakeText: { fontSize: 13, color: C.textSub, flex: 1 },

  watchVideoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FF000030',
  },
  watchVideoBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },

  videoCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 14,
  },
  videoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  videoSub: { fontSize: 11, color: C.textMuted },
  videoNoteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: C.blue + '10', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.blue + '30',
  },
  videoNoteText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 20 },

  cuesTitle: { fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  cuesSub: { fontSize: 12, color: C.textMuted, marginTop: 2, marginBottom: 8 },
  cueCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 4,
  },
  cueText: { fontSize: 14, color: C.text, fontWeight: '600' },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  tipNum: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.brand + '20', justifyContent: 'center', alignItems: 'center',
  },
  tipNumText: { fontSize: 12, fontWeight: '900', color: C.brand },
  tipText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 20 },

  ctaArea: { gap: 10, marginTop: 8 },
  ctaBtn: { borderRadius: 18, overflow: 'hidden' },
  ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12 },
  ctaBtnText: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '900', color: '#FFFFFF' },
  ctaBtnSecondary: {
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  ctaBtnSecondaryText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },

  // ── Countdown Phase ─────────────────────────────────────────────────────────
  countdownContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  countdownLabel: { fontSize: 20, fontWeight: '700', color: C.textSub, letterSpacing: 2 },
  countdownNumber: {
    fontSize: IS_SMALL ? 92 : 120, fontWeight: '900', color: C.brand,
    textShadowColor: C.brand, textShadowRadius: 30,
  },
  countdownSub: { fontSize: 18, fontWeight: '800', color: C.text },
  countdownCues: { gap: 8, alignItems: 'center', marginTop: 10 },
  countdownCue: { fontSize: 14, color: C.textMuted, fontWeight: '600' },

  // ── Active Phase ────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#000000' },

  noCameraPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  noCameraContent: { alignItems: 'center', gap: 10 },
  noCameraText: { fontSize: 18, fontWeight: '800', color: C.textMuted },
  noCameraSubtext: { fontSize: 12, color: C.textDim, textAlign: 'center', paddingHorizontal: 40 },
  demoSkeleton: { position: 'absolute', width: '100%', height: '100%' },
  skLine: {
    position: 'absolute', width: 80, height: 2,
    backgroundColor: C.brand + '60', borderRadius: 2,
  },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: 10,
  },
  closeBtn: {
    width: IS_SMALL ? 38 : 44, height: IS_SMALL ? 38 : 44, borderRadius: 14,
    backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFFFFF20',
  },
  exerciseNameBadge: {
    backgroundColor: '#00000090', paddingHorizontal: IS_SMALL ? 10 : 18,
    paddingVertical: 9, borderRadius: 22,
    borderWidth: 1, borderColor: C.brand + '60',
  },
  exerciseNameText: { color: C.brandLight, fontSize: IS_SMALL ? 12 : 14, fontWeight: '700' },
  flipBtn: {
    width: IS_SMALL ? 38 : 44, height: IS_SMALL ? 38 : 44, borderRadius: 14,
    backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFFFFF20',
  },
  // Skeleton demo mode
  skeletonWrapper: {
    position: 'absolute', top: '8%', alignSelf: 'center',
    alignItems: 'center',
  },
  skHead: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, backgroundColor: 'transparent',
    marginBottom: 2,
  },
  skBone: { borderRadius: 2 },
  noCameraContent: {
    position: 'absolute', bottom: '32%', left: 0, right: 0, alignItems: 'center',
  },
  demoModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  demoModeDot: { width: 6, height: 6, borderRadius: 3 },
  demoModeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Accuracy HUD
  accuracyHUD: {
    position: 'absolute', top: IS_SMALL ? '18%' : '20%', left: IS_SMALL ? 10 : 20,
    backgroundColor: '#00000095', borderRadius: 14,
    padding: 10, alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: '#FFFFFF20',
  },
  accuracyRing: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
  },
  accuracyVal: { fontSize: 12, fontWeight: '900' },
  accuracyLabel: { fontSize: 9, color: C.textMuted, fontWeight: '700' },

  // Angle arc
  angleBox: {
    position: 'absolute', top: IS_SMALL ? '18%' : '20%', right: IS_SMALL ? 10 : 20,
    backgroundColor: '#00000095', borderRadius: 16,
    padding: 10, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#FFFFFF20',
  },
  angleArcWrap: { width: 56, height: 56, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  angleArcBg: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 3 },
  angleArcFill: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    borderWidth: 3, borderTopColor: 'transparent', borderLeftColor: 'transparent',
  },
  angleCenter: { justifyContent: 'center', alignItems: 'center' },
  angleValue: { fontSize: 14, fontWeight: '900', color: C.brandLight },
  angleLabel: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  feedbackCard: {
    position: 'absolute', top: IS_SMALL ? '40%' : '42%', left: IS_SMALL ? 12 : 24, right: IS_SMALL ? 12 : 24,
    backgroundColor: '#000000A0', borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
    borderWidth: 2,
  },
  feedbackText: { fontSize: IS_SMALL ? 15 : 18, fontWeight: '900', textAlign: 'center' },
  errorList: { marginTop: 10, gap: 6, width: '100%' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  errorText: { fontSize: 12, color: C.red, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface + 'F5',
    borderTopLeftRadius: IS_SMALL ? 22 : 30, borderTopRightRadius: IS_SMALL ? 22 : 30,
    padding: IS_SMALL ? 14 : 24, paddingBottom: IS_SMALL ? 20 : 36,
    borderTopWidth: 1, borderColor: C.border,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', marginBottom: 16,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: IS_SMALL ? 24 : 32, fontWeight: '900', color: C.text },
  statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  statTarget: { fontSize: 11, color: C.textDim },
  statDivider: { width: 1, height: 40, backgroundColor: C.border },
  repProgress: {
    height: 6, backgroundColor: C.surface2,
    borderRadius: 3, marginBottom: 12, overflow: 'hidden',
  },
  repProgressFill: { height: '100%', borderRadius: 3 },
  tipText: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 16 },
  controlRow: { alignItems: 'center' },
  startBigBtn: { borderRadius: 18, overflow: 'hidden', width: '100%' },
  startBigBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 18, gap: 12,
  },
  startBigBtnText: { fontSize: IS_SMALL ? 15 : 17, fontWeight: '900', color: '#FFFFFF' },
  activeControls: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 12, width: '100%' },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, gap: 8,
    backgroundColor: C.red + '20', borderRadius: 16,
    borderWidth: 1, borderColor: C.red + '40',
  },
  pauseBtnText: { color: C.red, fontSize: IS_SMALL ? 13 : 15, fontWeight: '700' },
  nextSetBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  nextSetBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, gap: 8,
  },
  nextSetBtnText: { color: '#0A0A0A', fontSize: IS_SMALL ? 13 : 15, fontWeight: '900' },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000000D0', zIndex: 999,
    justifyContent: 'center', alignItems: 'center', padding: IS_SMALL ? 12 : 24,
  },
  modalCard: {
    backgroundColor: C.surface, borderRadius: 26,
    overflow: 'hidden', width: '100%',
    borderWidth: 1, borderColor: C.brand + '50',
  },
  modalHeader: { padding: 22, alignItems: 'center', gap: 6 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  modalSubtitle: { fontSize: 12, color: '#FFFFFFAA', marginTop: 2 },
  modalBody: { padding: 20 },
  modalStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: C.bg, borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  modalStat: { alignItems: 'center', gap: 4 },
  modalStatVal: { fontSize: 24, fontWeight: '900', color: C.brandLight },
  modalStatLbl: { fontSize: 11, color: C.textMuted },
  modalFeedback: { fontSize: 14, color: C.textSub, lineHeight: 24, textAlign: 'center', marginBottom: 24 },
  modalCloseBtn: { borderRadius: 16, overflow: 'hidden' },
  modalCloseBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  modalCloseBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

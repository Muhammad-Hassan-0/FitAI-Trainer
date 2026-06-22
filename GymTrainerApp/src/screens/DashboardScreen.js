import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, Animated, DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, SHADOW } from '../theme';
import { progressAPI } from '../services/api';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

const FEATURED = {
  id: 'fullbody',
  name: 'Full Body Blast',
  subtitle: '5 exercises • 35 min • 420 cal',
  level: 'INTERMEDIATE',
  image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=900&q=80&fit=crop',
  exercises: ['Squats', 'Push-Ups', 'Plank', 'Lunges', 'Burpees'],
};

const QUICK = [
  {
    id: 'squat', label: 'Squats', cal: '85', time: '10m', icon: '🦵',
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=500&q=80',
    color: C.brand,
  },
  {
    id: 'pushup', label: 'Push-Ups', cal: '64', time: '8m', icon: '💪',
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=500&q=80',
    color: C.blue,
  },
  {
    id: 'plank', label: 'Plank', cal: '35', time: '5m', icon: '🔥',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80',
    color: C.lime,
  },
  {
    id: 'curl', label: 'Bicep Curls', cal: '50', time: '10m', icon: '🏋️',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80',
    color: C.teal,
  },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const ACTIVITY = [40, 70, 55, 90, 30, 85, 65];

export default function DashboardScreen({ navigation }) {
  const [userData, setUserData] = useState({ name: 'Athlete' });
  const [stats, setStats] = useState({ streak: 7, totalSessions: 24, calories: 1240 });
  const [planMeta, setPlanMeta] = useState(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    loadData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    const focusSub = navigation.addListener('focus', loadData);
    const progressSub = DeviceEventEmitter.addListener('progressUpdated', loadData);
    return () => {
      focusSub?.();
      progressSub?.remove();
    };
  }, []);

  const loadData = async () => {
    try {
      const u = await AsyncStorage.getItem('userData');
      const st = await AsyncStorage.getItem('userStats');
      if (u) setUserData(JSON.parse(u));
      if (st) setStats(prev => ({ ...prev, ...JSON.parse(st) }));
      const planRaw = await AsyncStorage.getItem('generatedPlan');
      const versionsRaw = await AsyncStorage.getItem('generatedPlanVersions');
      if (planRaw) {
        const p = JSON.parse(planRaw);
        const versions = versionsRaw ? JSON.parse(versionsRaw) : [];
        const why =
          p?.ai_advice ||
          `Goal: ${(p?.goal || 'stay fit').replace('_', ' ')} | Level: ${p?.level || 'beginner'} | Focus: ${(p?.health_issue || 'none').replace('_', ' ')}`;
        setPlanMeta({
          goal: p?.goal || 'stay_fit',
          level: p?.level || 'beginner',
          reason: why,
          versionCount: versions.length || 1,
        });
      }
      try {
        const remote = await progressAPI.getStats();
        if (remote?.success && remote?.stats) {
          setStats(prev => ({ ...prev, ...remote.stats }));
          await AsyncStorage.setItem('userStats', JSON.stringify(remote.stats));
        }
      } catch (_) {}
    } catch (_) {}
  };

  const firstName = (userData.name || 'Athlete').split(' ')[0];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{firstName[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.greetLine}>{greeting} 👋</Text>
              <Text style={s.nameLine}>{firstName}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications" size={18} color={C.text} />
              <View style={s.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: C.brand, borderColor: C.brand }]}
              onPress={() => navigation.navigate('AIChat')}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STREAK BANNER ── */}
        <View style={s.streakBanner}>
          <LinearGradient
            colors={[C.brand + '22', C.brandGlow, C.brand + '08']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.streakLeft}>
            <Animated.Text style={[s.streakFire, { transform: [{ scale: pulse }] }]}>🔥</Animated.Text>
            <View>
          <Text style={s.streakVal}>{stats.streak}-Day Streak</Text>
            <Text style={s.streakSub}>Keep it up — you're on fire! 🔥</Text>
            </View>
          </View>
          <View style={s.streakRight}>
            <Text style={s.streakCal}>{stats.calories}</Text>
            <Text style={s.streakCalLabel}>kcal / week</Text>
          </View>
        </View>

        {planMeta && (
          <TouchableOpacity style={s.planCard} activeOpacity={0.9} onPress={() => navigation.navigate('WeeklyPlan')}>
            <View style={s.planCardHead}>
              <Text style={s.planCardBadge}>PERSONAL PLAN</Text>
              <Text style={s.planCardVersion}>v{planMeta.versionCount}</Text>
            </View>
            <Text style={s.planCardTitle}>
              {(planMeta.goal || 'stay_fit').replace('_', ' ')} · {planMeta.level}
            </Text>
            <Text style={s.planCardReason} numberOfLines={3}>
              Why this plan: {planMeta.reason}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── FEATURED WORKOUT (full-bleed, diagonal) ── */}
        <TouchableOpacity
          style={s.featured}
          onPress={() => navigation.navigate('WeeklyPlan')}
          activeOpacity={0.92}
        >
          <Image source={{ uri: FEATURED.image }} style={s.featuredImg} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', '#000000AA', '#000000F0']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Level tag top-left */}
          <View style={s.featuredTag}>
            <View style={s.liveIndicator}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>START NOW</Text>
            </View>
            <Text style={s.featuredLevel}>{FEATURED.level}</Text>
          </View>

          {/* Content bottom */}
          <View style={s.featuredContent}>
            <Text style={s.featuredName}>{FEATURED.name}</Text>
            <Text style={s.featuredSub}>{FEATURED.subtitle}</Text>
            <View style={s.featuredExercises}>
              {FEATURED.exercises.map((e, i) => (
                <View key={i} style={s.exChip}>
                  <Text style={s.exChipText}>{e}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Big CTA button */}
          <TouchableOpacity
            style={s.featuredCTA}
            onPress={() => navigation.navigate('LiveExercise', { exercise: { id: 'squat', name: 'Squats' } })}
          >
            <LinearGradient colors={[C.brand, C.brandDark]} style={s.featuredCTAGrad}>
              <Ionicons name="play" size={22} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── WEEK ACTIVITY — horizontal bars ── */}
        <View style={s.section}>
          <View style={s.sRow}>
            <Text style={s.sTitle}>This Week</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Text style={s.sLink}>View Report →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.weekGrid}>
            {DAYS.map((d, i) => {
              const pct = ACTIVITY[i] / 100;
              const isToday = i === todayIdx;
              return (
                <View key={i} style={s.weekCol}>
                  <View style={s.weekBarTrack}>
                    <View
                      style={[
                        s.weekBarFill,
                        {
                          height: `${ACTIVITY[i]}%`,
                          backgroundColor: isToday ? C.brand : i < todayIdx ? C.lime : C.surface3,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.weekDay, isToday && { color: C.brand, fontWeight: '900' }]}>{d}</Text>
                  {isToday && <View style={s.weekDot} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={s.statsGrid}>
          <View style={[s.statBig, { backgroundColor: C.surface }]}>
            <Text style={s.statBigIcon}>🏆</Text>
            <Text style={s.statBigNum}>{stats.totalSessions || 24}</Text>
            <Text style={s.statBigLabel}>Sessions Done</Text>
          </View>
          <View style={s.statCol}>
            <View style={[s.statSmall, { backgroundColor: C.lime + '20', borderColor: C.lime + '40' }]}>
              <Text style={[s.statSmallNum, { color: C.lime }]}>{stats.streak || 7}</Text>
              <Text style={[s.statSmallLabel, { color: C.lime + 'AA' }]}>Day Streak</Text>
            </View>
            <View style={[s.statSmall, { backgroundColor: C.brand + '15', borderColor: C.brand + '35' }]}>
              <Text style={[s.statSmallNum, { color: C.brand }]}>{stats.calories || 1240}</Text>
              <Text style={[s.statSmallLabel, { color: C.brand + 'AA' }]}>Total Cal</Text>
            </View>
          </View>
        </View>

        {/* ── QUICK EXERCISES ── */}
        <View style={s.section}>
          <View style={s.sRow}>
            <Text style={s.sTitle}>Quick Start</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WeeklyPlan')}>
              <Text style={s.sLink}>See Program →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {QUICK.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={s.quickCard}
                onPress={() => navigation.navigate('LiveExercise', { exercise: { id: q.id, name: q.label } })}
                activeOpacity={0.88}
              >
                <Image source={{ uri: q.image }} style={s.quickImg} resizeMode="cover" />
                <LinearGradient colors={['transparent', '#000000E0']} style={StyleSheet.absoluteFillObject} />
                <View style={[s.quickColorBar, { backgroundColor: q.color }]} />
                <View style={s.quickContent}>
                  <Text style={s.quickIcon}>{q.icon}</Text>
                  <Text style={s.quickName}>{q.label}</Text>
                  <View style={s.quickMeta}>
                    <Text style={s.quickMetaText}>{q.time}</Text>
                    <Text style={s.quickMetaDot}>·</Text>
                    <Text style={s.quickMetaText}>{q.cal} cal</Text>
                  </View>
                </View>
                <View style={[s.quickPlay, { backgroundColor: q.color }]}>
                  <Ionicons name="play" size={12} color="#000" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── AI COACH CARD — different style ── */}
        <TouchableOpacity onPress={() => navigation.navigate('AIChat')} activeOpacity={0.9}>
          <View style={s.aiCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80' }}
              style={s.aiCardImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['#000000CC', '#000000EE']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Orange accent line */}
            <View style={s.aiAccentLine} />
            <View style={s.aiCardContent}>
              <View style={s.aiBadge}>
                <Ionicons name="sparkles" size={11} color={C.brand} />
              <Text style={s.aiBadgeText}>AI COACH</Text>
            </View>
            <Text style={s.aiCardTitle}>Got a question?{'\n'}Ask your coach.</Text>
            <Text style={s.aiCardSub}>English, Urdu or Arabic — answer in your language</Text>
            </View>
            <View style={s.aiArrow}>
              <Ionicons name="arrow-forward" size={20} color={C.brand} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : (IS_TABLET ? 24 : 18), paddingTop: IS_SMALL ? 10 : 12 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: IS_SMALL ? 12 : 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: IS_SMALL ? 40 : 44, height: IS_SMALL ? 40 : 44, borderRadius: IS_SMALL ? 12 : 14,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  greetLine: { fontSize: 12, color: C.textMuted, marginBottom: 2 },
  nameLine: { fontSize: IS_SMALL ? 18 : 20, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: IS_SMALL ? 36 : 40, height: IS_SMALL ? 36 : 40, borderRadius: IS_SMALL ? 10 : 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: 4, backgroundColor: C.red,
    borderWidth: 1.5, borderColor: C.bg,
  },

  // Streak Banner
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: IS_SMALL ? 14 : 16, padding: IS_SMALL ? 12 : 14, marginBottom: IS_SMALL ? 14 : 18,
    borderWidth: 1, borderColor: C.brand + '30', overflow: 'hidden',
    backgroundColor: C.surface,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: IS_SMALL ? 8 : 12, flex: 1 },
  streakFire: { fontSize: IS_SMALL ? 22 : 28 },
  streakVal: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '900', color: C.text },
  streakSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  streakRight: { alignItems: 'flex-end' },
  streakCal: { fontSize: IS_SMALL ? 18 : 22, fontWeight: '900', color: C.brand },
  streakCalLabel: { fontSize: 10, color: C.textMuted, marginTop: 1 },

  // Featured
  featured: {
    height: IS_TABLET ? 280 : (IS_SMALL ? 210 : 240), borderRadius: IS_SMALL ? 18 : 22, overflow: 'hidden',
    marginBottom: 20, position: 'relative', ...SHADOW.card,
  },
  featuredImg: { ...StyleSheet.absoluteFillObject },
  featuredTag: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg + 'CC', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '60',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand },
  liveText: { fontSize: 10, fontWeight: '800', color: C.brand, letterSpacing: 0.5 },
  featuredLevel: {
    fontSize: 10, fontWeight: '800', color: '#FFFFFF',
    backgroundColor: '#FFFFFF20', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, letterSpacing: 0.5,
  },
  featuredContent: {
    position: 'absolute', bottom: 0, left: 0, right: IS_SMALL ? 56 : 70,
    padding: IS_SMALL ? 12 : 16,
  },
  featuredName: { fontSize: IS_SMALL ? 19 : 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  featuredSub: { fontSize: 12, color: '#FFFFFFBB', marginBottom: 10 },
  featuredExercises: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  exChip: {
    backgroundColor: '#FFFFFF18', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: '#FFFFFF20',
  },
  exChipText: { fontSize: 10, color: '#FFFFFFCC', fontWeight: '600' },
  featuredCTA: {
    position: 'absolute', bottom: 16, right: 16,
    borderRadius: 20, overflow: 'hidden', ...SHADOW.brand,
  },
  featuredCTAGrad: {
    width: IS_SMALL ? 44 : 52, height: IS_SMALL ? 44 : 52, justifyContent: 'center', alignItems: 'center',
  },

  // Week Activity
  section: { marginBottom: 20 },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  sLink: { fontSize: 13, color: C.brand, fontWeight: '700' },

  weekGrid: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
  weekCol: { flex: 1, alignItems: 'center', gap: 6, height: 80, justifyContent: 'flex-end' },
  weekBarTrack: {
    width: '100%', height: 56, backgroundColor: C.surface2,
    borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end',
  },
  weekBarFill: { width: '100%', borderRadius: 10, minHeight: 4 },
  weekDay: { fontSize: 9, fontWeight: '700', color: C.textDim, marginTop: 2 },
  weekDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.brand },

  // Stats Grid — asymmetric
  statsGrid: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 10, marginBottom: 20 },
  statBig: {
    flex: IS_SMALL ? 0 : 1.3, borderRadius: 18, padding: IS_SMALL ? 14 : 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, gap: 6,
  },
  statBigIcon: { fontSize: 26, marginBottom: 2 },
  statBigNum: { fontSize: IS_SMALL ? 28 : 32, fontWeight: '900', color: C.text, letterSpacing: -1 },
  statBigLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  statCol: { flex: 1, gap: 10, flexDirection: IS_SMALL ? 'row' : 'column' },
  statSmall: {
    flex: 1, borderRadius: 14, padding: 12, justifyContent: 'center',
    borderWidth: 1,
  },
  statSmallNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statSmallLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Quick Cards
  hScroll: { gap: 10, paddingBottom: 2 },
  quickCard: {
    width: IS_SMALL ? 126 : 140, height: IS_SMALL ? 156 : 170, borderRadius: 18, overflow: 'hidden',
    position: 'relative', ...SHADOW.card,
  },
  quickImg: { ...StyleSheet.absoluteFillObject },
  quickColorBar: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%' },
  quickContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  quickIcon: { fontSize: 20, marginBottom: 4 },
  quickName: { fontSize: 13, fontWeight: '900', color: '#FFFFFF', marginBottom: 3 },
  quickMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickMetaText: { fontSize: 10, color: '#FFFFFFBB', fontWeight: '600' },
  quickMetaDot: { fontSize: 10, color: '#FFFFFF60' },
  quickPlay: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },

  // AI Coach Card
  aiCard: {
    height: IS_SMALL ? 126 : 140, borderRadius: 20, overflow: 'hidden',
    position: 'relative', borderWidth: 1, borderColor: C.brand + '30',
  },
  aiCardImg: { ...StyleSheet.absoluteFillObject },
  aiAccentLine: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: C.brand,
  },
  aiCardContent: { position: 'absolute', bottom: 0, left: 0, top: 0, padding: 18, justifyContent: 'center' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 8,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '900', color: C.brand, letterSpacing: 1 },
  aiCardTitle: { fontSize: IS_SMALL ? 15 : 17, fontWeight: '900', color: '#FFFFFF', lineHeight: IS_SMALL ? 20 : 22, marginBottom: 4 },
  aiCardSub: { fontSize: 11, color: '#FFFFFFAA' },
  aiArrow: { position: 'absolute', right: 18, bottom: 18 },
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.brand + '35',
    padding: 14,
    marginBottom: 14,
  },
  planCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planCardBadge: { fontSize: 10, fontWeight: '900', color: C.brand, letterSpacing: 1 },
  planCardVersion: { fontSize: 11, color: C.textMuted, fontWeight: '700' },
  planCardTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 4, textTransform: 'capitalize' },
  planCardReason: { fontSize: 12, color: C.textSub, lineHeight: 18 },
});

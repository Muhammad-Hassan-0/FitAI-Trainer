import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../theme';
import { getExerciseVideoId, getExerciseResolvedId } from '../data/exerciseVideos';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '⚡' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'core', label: 'Core', icon: '🔥' },
  { id: 'flexibility', label: 'Flex', icon: '🧘' },
];

const EXERCISES = [
  {
    id: 'squat', name: 'Squats', muscles: 'Legs & Glutes', cal: '85', duration: '10 min',
    sets: 3, reps: 12, color: C.brand, category: 'strength', diff: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&q=80&fit=crop',
    youtube: 'aclHkVaku9U', emoji: '🦵',
  },
  {
    id: 'pushup', name: 'Push-Ups', muscles: 'Chest & Triceps', cal: '64', duration: '8 min',
    sets: 3, reps: 10, color: C.blue, category: 'strength', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=600&q=80&fit=crop',
    youtube: 'IODxDxX7oi4', emoji: '💪',
  },
  {
    id: 'plank', name: 'Plank', muscles: 'Core & Back', cal: '35', duration: '5 min',
    sets: 3, reps: '30s', color: C.lime, category: 'core', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop',
    youtube: 'ASdvN_XEl_c', emoji: '🔥',
  },
  {
    id: 'curl', name: 'Bicep Curls', muscles: 'Biceps', cal: '50', duration: '10 min',
    sets: 3, reps: 12, color: C.teal, category: 'strength', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80&fit=crop',
    youtube: 'ykJmrZ5v0Oo', emoji: '🏋️',
  },
  {
    id: 'lunge', name: 'Lunges', muscles: 'Quads & Glutes', cal: '95', duration: '12 min',
    sets: 3, reps: 10, color: C.gold, category: 'strength', diff: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1434682966571-82fbecee4bab?w=600&q=80&fit=crop',
    youtube: 'QOVaHwm-Q6U', emoji: '🦶',
  },
  {
    id: 'jacks', name: 'Jumping Jacks', muscles: 'Full Body Cardio', cal: '120', duration: '8 min',
    sets: 3, reps: 20, color: C.brand, category: 'cardio', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&q=80&fit=crop',
    youtube: 'c4DAnQ6DtF8', emoji: '⚡',
  },
  {
    id: 'deadlift', name: 'Deadlift', muscles: 'Back & Legs', cal: '140', duration: '15 min',
    sets: 4, reps: 8, color: C.red, category: 'strength', diff: 'Advanced',
    image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=80&fit=crop',
    youtube: 'op9kVnSso6Q', emoji: '⚔️',
  },
  {
    id: 'crunch', name: 'Crunches', muscles: 'Abs & Core', cal: '45', duration: '7 min',
    sets: 3, reps: 15, color: C.lime, category: 'core', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&fit=crop',
    youtube: 'Xyd_fa5zoEU', emoji: '🎯',
  },
  {
    id: 'stretch', name: 'Full Body Stretch', muscles: 'Flexibility & Recovery', cal: '20', duration: '10 min',
    sets: 1, reps: '5 min', color: C.teal, category: 'flexibility', diff: 'Beginner',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop',
    youtube: 'qULTwquOuT4', emoji: '🧘',
  },
];

const DIFF_COLORS = { Beginner: C.lime, Intermediate: C.brand, Advanced: C.red };

export default function ExercisePlanScreen({ navigation }) {
  const [cat, setCat] = useState('all');

  const filtered = cat === 'all' ? EXERCISES : EXERCISES.filter(e => e.category === cat);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>YOUR PROGRAMME</Text>
            <Text style={s.title}>Exercise Plan</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[s.aiBtn, { backgroundColor: C.lime + '15', borderColor: C.lime + '35' }]}
              onPress={() => navigation.navigate('WeeklyPlan')}
            >
              <Ionicons name="calendar" size={14} color={C.lime} />
              <Text style={[s.aiBtnText, { color: C.lime }]}>4-Week Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.aiBtn}
              onPress={() => navigation.navigate('AIChat')}
            >
              <Ionicons name="sparkles" size={14} color={C.brand} />
              <Text style={s.aiBtnText}>AI Coach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PROGRESS BAR ── */}
        <View style={s.progressCard}>
          <View style={s.progressLeft}>
            <Text style={s.progressTitle}>Week 1 Progress</Text>
            <Text style={s.progressSub}>3 of 5 workouts completed</Text>
          </View>
          <View style={s.progressRight}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: '60%' }]} />
            </View>
            <Text style={s.progressPct}>60%</Text>
          </View>
        </View>

        {/* ── CATEGORY CHIPS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.catChip, cat === c.id && s.catChipActive]}
              onPress={() => setCat(c.id)}
            >
              <Text style={s.catEmoji}>{c.icon}</Text>
              <Text style={[s.catLabel, cat === c.id && s.catLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── FEATURED EXERCISE (large card) ── */}
        {featured && (
          <TouchableOpacity
            style={s.featCard}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: featured.id })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: featured.image }} style={s.featImg} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', '#000000CC', '#000000F5']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Colour accent left border */}
            <View style={[s.featAccent, { backgroundColor: featured.color }]} />

            <View style={s.featTag}>
              <Text style={s.featTagText}>⭐ FEATURED WORKOUT</Text>
            </View>

            <View style={s.featContent}>
              <View style={s.featTop}>
                <View style={[s.diffBadge, { backgroundColor: DIFF_COLORS[featured.diff] + '30', borderColor: DIFF_COLORS[featured.diff] + '60' }]}>
                  <Text style={[s.diffText, { color: DIFF_COLORS[featured.diff] }]}>{featured.diff}</Text>
                </View>
              </View>
              <Text style={s.featEmoji}>{featured.emoji}</Text>
              <Text style={s.featName}>{featured.name}</Text>
              <Text style={s.featMuscle}>{featured.muscles}</Text>
              <View style={s.featMeta}>
                {[
                  { icon: 'time', val: featured.duration },
                  { icon: 'flame', val: `${featured.cal} cal` },
                  { icon: 'repeat', val: `${featured.sets}×${featured.reps}` },
                ].map((m, i) => (
                  <View key={i} style={s.featMetaItem}>
                    <Ionicons name={m.icon} size={12} color="#FFFFFF90" />
                    <Text style={s.featMetaText}>{m.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[s.featPlay, { ...SHADOW.brand }]}
              onPress={() => navigation.navigate('LiveExercise', { exercise: featured })}
            >
              <LinearGradient colors={[C.brand, C.brandDark]} style={s.featPlayGrad}>
                <Ionicons name="play" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
            {!!getExerciseVideoId(featured) && (
              null
            )}
          </TouchableOpacity>
        )}

        {/* ── EXERCISES LIST — numbered ── */}
        <View style={s.listHeader}>
          <Text style={s.listTitle}>All Exercises</Text>
          <Text style={s.listCount}>{filtered.length} total</Text>
        </View>

        {rest.map((ex, idx) => (
          <TouchableOpacity
            key={ex.id}
            style={s.exRow}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
            activeOpacity={0.85}
          >
            {/* Number */}
            <View style={[s.exNum, { borderColor: ex.color + '50' }]}>
              <Text style={[s.exNumText, { color: ex.color }]}>{String(idx + 2).padStart(2, '0')}</Text>
            </View>

            {/* Thumbnail */}
            <View style={s.exThumbWrap}>
              <Image source={{ uri: ex.image }} style={s.exThumb} resizeMode="cover" />
              <View style={[s.exThumbBar, { backgroundColor: ex.color }]} />
            </View>

            {/* Info */}
            <View style={s.exInfo}>
              <View style={s.exInfoTop}>
                <Text style={s.exName}>{ex.name}</Text>
                <View style={[s.diffDot, { backgroundColor: DIFF_COLORS[ex.diff] }]} />
              </View>
              <Text style={s.exMuscle}>{ex.muscles}</Text>
              <View style={s.exStats}>
                <Text style={s.exStatText}>{ex.sets}×{ex.reps}</Text>
                <Text style={s.exDot}>·</Text>
                <Text style={s.exStatText}>{ex.cal} cal</Text>
                <Text style={s.exDot}>·</Text>
                <Text style={s.exStatText}>{ex.duration}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={s.exActions}>
              <TouchableOpacity
                style={[s.playBtn, { backgroundColor: ex.color + '20', borderColor: ex.color + '40' }]}
                onPress={() =>
                  navigation.navigate('LiveExercise', {
                    exercise: { id: getExerciseResolvedId(ex), name: ex.name },
                    initialTab: 0,
                    forceVideoId: getExerciseVideoId(ex),
                    forceVideoTitle: `${ex.name} Tutorial`,
                  })
                }
              >
                <Ionicons name="play" size={13} color={ex.color} />
              </TouchableOpacity>
              <TouchableOpacity style={s.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={15} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : (IS_TABLET ? 24 : 18), paddingTop: IS_SMALL ? 10 : 14 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 16,
  },
  eyebrow: { fontSize: 10, fontWeight: '900', color: C.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: IS_SMALL ? 22 : 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand + '18', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '40',
  },
  aiBtnText: { fontSize: IS_SMALL ? 11 : 12, fontWeight: '800', color: C.brand },

  progressCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  progressLeft: {},
  progressTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 3 },
  progressSub: { fontSize: 11, color: C.textMuted },
  progressRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { width: 90, height: 6, backgroundColor: C.surface3, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.brand, borderRadius: 6 },
  progressPct: { fontSize: 13, fontWeight: '900', color: C.brand },

  catScroll: { gap: 8, paddingBottom: 2, marginBottom: 18 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  catLabelActive: { color: '#FFFFFF' },

  // Featured Card
  featCard: {
    height: IS_TABLET ? 320 : (IS_SMALL ? 236 : 280), borderRadius: 22, overflow: 'hidden',
    marginBottom: 24, position: 'relative', ...SHADOW.card,
  },
  featImg: { ...StyleSheet.absoluteFillObject },
  featAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  featTag: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: '#FFFFFF18', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF30',
  },
  featTagText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  featContent: { position: 'absolute', bottom: 0, left: 0, right: IS_SMALL ? 56 : 70, padding: IS_SMALL ? 12 : 18 },
  featTop: { flexDirection: 'row', marginBottom: 6 },
  diffBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  diffText: { fontSize: 10, fontWeight: '800' },
  featEmoji: { fontSize: 28, marginBottom: 4 },
  featName: { fontSize: IS_SMALL ? 20 : 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 2 },
  featMuscle: { fontSize: 13, color: '#FFFFFFAA', marginBottom: 12 },
  featMeta: { flexDirection: 'row', gap: 12 },
  featMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featMetaText: { fontSize: 11, color: '#FFFFFFCC', fontWeight: '600' },
  featPlay: {
    position: 'absolute', bottom: 18, right: 18,
    borderRadius: 18, overflow: 'hidden',
  },
  featPlayGrad: { width: IS_SMALL ? 44 : 52, height: IS_SMALL ? 44 : 52, justifyContent: 'center', alignItems: 'center' },

  // List
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  listCount: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: IS_SMALL ? 8 : 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 10,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  exNum: {
    width: IS_SMALL ? 30 : 36, height: IS_SMALL ? 30 : 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  exNumText: { fontSize: 11, fontWeight: '900' },
  exThumbWrap: { width: IS_SMALL ? 48 : 60, height: IS_SMALL ? 48 : 60, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  exThumb: { width: '100%', height: '100%' },
  exThumbBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  exInfo: { flex: 1 },
  exInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  exName: { fontSize: IS_SMALL ? 12 : 14, fontWeight: '800', color: C.text },
  diffDot: { width: 7, height: 7, borderRadius: 4 },
  exMuscle: { fontSize: 11, color: C.textMuted, marginBottom: 5 },
  exStats: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  exStatText: { fontSize: 10, fontWeight: '700', color: C.textDim },
  exDot: { fontSize: 10, color: C.textDim },
  exActions: { gap: 6, alignItems: 'center' },
  playBtn: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  moreBtn: { width: 20, alignItems: 'center' },
});

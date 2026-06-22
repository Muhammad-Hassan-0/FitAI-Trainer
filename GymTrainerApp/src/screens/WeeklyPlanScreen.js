import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, Animated, DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, SHADOW } from '../theme';
import { getExerciseVideoId, getExerciseResolvedId } from '../data/exerciseVideos';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

// ── 4-Week Progressive Training Program ──────────────────────────────────────
const WEEKLY_PROGRAM = [
  {
    day: 'MON', dayFull: 'Monday',
    type: 'PUSH', typeLabel: 'Push Day',
    icon: '💪', color: C.brand,
    duration: '45 min', calories: 380,
    muscles: 'Chest · Shoulders · Triceps',
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=600&q=80',
    exercises: [
      { id: 'pushup', name: 'Push-Ups', sets: 3, reps: '12', rest: '60s', image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=300&q=80' },
      { name: 'Dumbbell Chest Press', sets: 3, reps: '10', rest: '90s', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
      { name: 'Shoulder Press', sets: 3, reps: '10', rest: '90s', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
      { name: 'Tricep Dips', sets: 3, reps: '12', rest: '60s', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&q=80' },
    ],
  },
  {
    day: 'TUE', dayFull: 'Tuesday',
    type: 'PULL', typeLabel: 'Pull Day',
    icon: '🔄', color: C.blue,
    duration: '45 min', calories: 360,
    muscles: 'Back · Biceps · Rear Delts',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    exercises: [
      { id: 'curl', name: 'Bicep Curls', sets: 3, reps: '12', rest: '60s', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
      { name: 'Lat Pulldown', sets: 3, reps: '10', rest: '90s', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
      { name: 'Seated Cable Row', sets: 3, reps: '10', rest: '90s', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&q=80' },
      { name: 'Dumbbell Shrugs', sets: 3, reps: '15', rest: '60s', image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&q=80' },
    ],
  },
  {
    day: 'WED', dayFull: 'Wednesday',
    type: 'LEGS', typeLabel: 'Legs Day',
    icon: '🦵', color: C.lime,
    duration: '50 min', calories: 450,
    muscles: 'Quads · Glutes · Hamstrings · Calves',
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&q=80',
    exercises: [
      { id: 'squat', name: 'Squats', sets: 4, reps: '12', rest: '90s', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&q=80' },
      { id: 'lunge', name: 'Lunges', sets: 3, reps: '10 each', rest: '60s', image: 'https://images.unsplash.com/photo-1434682966571-82fbecee4bab?w=300&q=80' },
      { name: 'Leg Press', sets: 3, reps: '12', rest: '90s', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
      { name: 'Calf Raises', sets: 4, reps: '20', rest: '45s', image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=300&q=80' },
    ],
  },
  {
    day: 'THU', dayFull: 'Thursday',
    type: 'CARDIO', typeLabel: 'Cardio Day',
    icon: '🏃', color: C.teal,
    duration: '30 min', calories: 280,
    muscles: 'Full Body · Cardiovascular',
    image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&q=80',
    exercises: [
      { id: 'jacks', name: 'Jumping Jacks', sets: 3, reps: '30', rest: '30s', image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=300&q=80' },
      { name: 'High Knees', sets: 3, reps: '30s', rest: '30s', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
      { name: 'Burpees', sets: 3, reps: '10', rest: '60s', image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&q=80' },
      { name: 'Mountain Climbers', sets: 3, reps: '20', rest: '30s', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&q=80' },
    ],
  },
  {
    day: 'FRI', dayFull: 'Friday',
    type: 'FULL', typeLabel: 'Full Body',
    icon: '⚡', color: C.gold,
    duration: '55 min', calories: 420,
    muscles: 'Full Body Compound Movements',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80',
    exercises: [
      { id: 'squat', name: 'Barbell Squats', sets: 4, reps: '8', rest: '2min', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&q=80' },
      { name: 'Deadlift', sets: 3, reps: '6', rest: '2min', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&q=80' },
      { id: 'pushup', name: 'Push-Ups', sets: 3, reps: '15', rest: '60s', image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=300&q=80' },
      { id: 'plank', name: 'Plank', sets: 3, reps: '45s', rest: '30s', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
    ],
  },
  {
    day: 'SAT', dayFull: 'Saturday',
    type: 'CORE', typeLabel: 'Core & Stretch',
    icon: '🔥', color: C.red,
    duration: '35 min', calories: 200,
    muscles: 'Abs · Core · Flexibility',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
    exercises: [
      { id: 'plank', name: 'Plank Hold', sets: 4, reps: '45s', rest: '30s', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
      { name: 'Crunches', sets: 3, reps: '20', rest: '45s', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
      { name: 'Leg Raises', sets: 3, reps: '15', rest: '45s', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&q=80' },
      { name: 'Full Body Stretch', sets: 1, reps: '10 min', rest: '-', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&q=80' },
    ],
  },
  {
    day: 'SUN', dayFull: 'Sunday',
    type: 'REST', typeLabel: 'Rest & Recovery',
    icon: '😴', color: C.textMuted,
    duration: '0 min', calories: 0,
    muscles: 'Full Recovery Day',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
    exercises: [],
  },
];

// ── 4-Week progression multipliers ───────────────────────────────────────────
const WEEK_CONFIG = [
  { week: 1, label: 'Foundation', desc: 'Learn the movements, build the habit', sets: '3', reps: '12', intensity: 'Light–Moderate', color: C.lime },
  { week: 2, label: 'Building', desc: 'Increase volume, find your limits', sets: '3', reps: '10', intensity: 'Moderate', color: C.teal },
  { week: 3, label: 'Strength', desc: 'Push hard, progressive overload', sets: '4', reps: '8', intensity: 'Heavy', color: C.brand },
  { week: 4, label: 'Deload', desc: 'Active recovery, consolidate gains', sets: '2', reps: '12', intensity: 'Light', color: C.blue },
];

const TYPE_COLORS = {
  PUSH: C.brand, PULL: C.blue, LEGS: C.lime, CARDIO: C.teal,
  FULL: C.gold, CORE: C.red, REST: C.textDim,
};

export default function WeeklyPlanScreen({ navigation }) {
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [activeWeek, setActiveWeek] = useState(0);
  const [view, setView] = useState('week'); // 'week' | 'month'
  const [completedDays, setCompletedDays] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  useEffect(() => {
    AsyncStorage.getItem('completedDays').then(v => { if (v) setCompletedDays(JSON.parse(v)); }).catch(() => {});
    AsyncStorage.getItem('completedExercises').then(v => { if (v) setCompletedExercises(JSON.parse(v)); }).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('progressUpdated', async () => {
      try {
        const exRaw = await AsyncStorage.getItem('completedExercises');
        const exMap = exRaw ? JSON.parse(exRaw) : {};
        setCompletedExercises(exMap);

        const dayMap = {};
        for (let w = 0; w < WEEK_CONFIG.length; w++) {
          for (let d = 0; d < WEEKLY_PROGRAM.length; d++) {
            const exLen = WEEKLY_PROGRAM[d].exercises.length;
            if (!exLen) {
              dayMap[`w${w}_d${d}`] = true;
              continue;
            }
            let allDone = true;
            for (let e = 0; e < exLen; e++) {
              if (!exMap[`w${w}_d${d}_e${e}`]) {
                allDone = false;
                break;
              }
            }
            dayMap[`w${w}_d${d}`] = allDone;
          }
        }
        setCompletedDays(dayMap);
        await AsyncStorage.setItem('completedDays', JSON.stringify(dayMap));
      } catch (_) {}
    });
    return () => sub?.remove();
  }, []);

  const markDayDone = async () => {
    const key = `w${activeWeek}_d${activeDay}`;
    const updated = { ...completedDays, [key]: true };
    setCompletedDays(updated);
    await AsyncStorage.setItem('completedDays', JSON.stringify(updated));
  };

  const openExercise = (ex, i) => {
    const resolved = { id: getExerciseResolvedId(ex), name: ex.name || 'Exercise' };
    const next = dayData.exercises[i + 1];
    const nextNext = dayData.exercises[i + 2];
    navigation.navigate('LiveExercise', {
      exercise: resolved,
      completionKey: `w${activeWeek}_d${activeDay}_e${i}`,
      nextExercise: next ? { id: getExerciseResolvedId(next), name: next.name } : null,
      nextCompletionKey: next ? `w${activeWeek}_d${activeDay}_e${i + 1}` : null,
      nextNextExercise: nextNext ? { id: getExerciseResolvedId(nextNext), name: nextNext.name } : null,
      forceVideoId: getExerciseVideoId(ex) || null,
      forceVideoTitle: `${ex.name} Tutorial`,
      initialTab: 0,
    });
  };

  const dayData = WEEKLY_PROGRAM[activeDay];
  const weekCfg = WEEK_CONFIG[activeWeek];
  const isDone = completedDays[`w${activeWeek}_d${activeDay}`];

  const weeklyCalories = WEEKLY_PROGRAM.reduce((a, d) => a + d.calories, 0);
  const completedThisWeek = Object.keys(completedDays)
    .filter(k => k.startsWith(`w${activeWeek}_`)).length;
  const weekProgressPct = Math.min(100, Math.round((completedThisWeek / WEEKLY_PROGRAM.length) * 100));

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>YOUR PROGRAMME</Text>
            <Text style={s.title}>Training Plan</Text>
          </View>
          <TouchableOpacity style={s.aiBtn} onPress={() => navigation.navigate('AIChat')}>
            <Ionicons name="sparkles" size={15} color={C.brand} />
            <Text style={s.aiBtnText}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* ── VIEW TOGGLE ── */}
        <View style={s.viewToggle}>
          {['week', 'month'].map(v => (
            <TouchableOpacity
              key={v} style={[s.toggleBtn, view === v && s.toggleBtnActive]}
              onPress={() => setView(v)}
            >
              <Text style={[s.toggleBtnText, view === v && s.toggleBtnTextActive]}>
                {v === 'week' ? '📅 Weekly' : '📆 Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── WEEK SELECTOR ── */}
        <View style={s.weekSelector}>
          {WEEK_CONFIG.map((wk, i) => (
            <TouchableOpacity
              key={i}
              style={[s.weekBtn, activeWeek === i && { borderColor: wk.color, backgroundColor: wk.color + '18' }]}
              onPress={() => setActiveWeek(i)}
            >
              <View style={[s.weekBtnDot, { backgroundColor: wk.color }]} />
              <Text style={[s.weekBtnLabel, activeWeek === i && { color: wk.color }]}>Wk {i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── WEEK SUMMARY CARD ── */}
        <LinearGradient
          colors={[weekCfg.color + '30', weekCfg.color + '10', 'transparent']}
          style={s.weekCard}
        >
          <View style={s.weekCardLeft}>
            <View style={[s.weekTypeBadge, { backgroundColor: weekCfg.color + '25', borderColor: weekCfg.color + '50' }]}>
              <Text style={[s.weekTypeBadgeText, { color: weekCfg.color }]}>WEEK {activeWeek + 1} — {weekCfg.label.toUpperCase()}</Text>
            </View>
            <Text style={s.weekCardDesc}>{weekCfg.desc}</Text>
            <View style={s.weekCardStats}>
              <View style={s.weekCardStat}>
                <Text style={[s.weekCardStatVal, { color: weekCfg.color }]}>{weekCfg.sets}</Text>
                <Text style={s.weekCardStatLabel}>Sets</Text>
              </View>
              <View style={s.weekCardStatDiv} />
              <View style={s.weekCardStat}>
                <Text style={[s.weekCardStatVal, { color: weekCfg.color }]}>{weekCfg.reps}</Text>
                <Text style={s.weekCardStatLabel}>Reps</Text>
              </View>
              <View style={s.weekCardStatDiv} />
              <View style={s.weekCardStat}>
                <Text style={[s.weekCardStatVal, { color: weekCfg.color }]}>{completedThisWeek}/{WEEKLY_PROGRAM.length}</Text>
                <Text style={s.weekCardStatLabel}>Done</Text>
              </View>
              <View style={s.weekCardStatDiv} />
              <View style={s.weekCardStat}>
                <Text style={[s.weekCardStatVal, { color: weekCfg.color }]}>{weekProgressPct}%</Text>
                <Text style={s.weekCardStatLabel}>Weekly %</Text>
              </View>
              <View style={s.weekCardStatDiv} />
              <View style={s.weekCardStat}>
                <Text style={[s.weekCardStatVal, { color: weekCfg.color }]}>{weeklyCalories}</Text>
                <Text style={s.weekCardStatLabel}>Cal/wk</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {view === 'week' ? (
          <>
            {/* ── DAY STRIP ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayStrip}>
              {WEEKLY_PROGRAM.map((d, i) => {
                const isToday = i === todayIdx;
                const isSelected = i === activeDay;
                const done = completedDays[`w${activeWeek}_d${i}`];
                const typeColor = TYPE_COLORS[d.type] || C.textMuted;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.dayPill,
                      isSelected && { borderColor: typeColor, backgroundColor: typeColor + '18' },
                      done && s.dayPillDone,
                    ]}
                    onPress={() => setActiveDay(i)}
                  >
                    {done && <View style={[s.dayDoneTick, { backgroundColor: typeColor }]}>
                      <Ionicons name="checkmark" size={8} color="#FFF" />
                    </View>}
                    {isToday && !done && <View style={[s.todayDot, { backgroundColor: typeColor }]} />}
                    <Text style={[s.dayPillDay, isSelected && { color: typeColor }]}>{d.day}</Text>
                    <Text style={s.dayPillIcon}>{d.icon}</Text>
                    <Text style={[s.dayPillType, isSelected && { color: typeColor }]}>{d.type}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── TODAY'S WORKOUT ── */}
            {dayData.type !== 'REST' ? (
              <View style={s.workoutCard}>
                {/* Hero image */}
                <View style={s.workoutHero}>
                  <Image source={{ uri: dayData.image }} style={s.workoutHeroImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', '#000000EE']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[s.workoutAccent, { backgroundColor: dayData.color }]} />
                  <View style={s.workoutHeroContent}>
                    <View style={[s.workoutTypeBadge, { backgroundColor: dayData.color + '30', borderColor: dayData.color + '60' }]}>
                      <Text style={[s.workoutTypeBadgeText, { color: dayData.color }]}>{dayData.typeLabel}</Text>
                    </View>
                    <Text style={s.workoutHeroTitle}>{dayData.dayFull}'s Workout</Text>
                    <Text style={s.workoutHeroMuscles}>{dayData.muscles}</Text>
                    <View style={s.workoutHeroMeta}>
                      <View style={s.workoutMetaChip}>
                        <Ionicons name="time" size={11} color="#FFFFFFBB" />
                        <Text style={s.workoutMetaChipText}>{dayData.duration}</Text>
                      </View>
                      <View style={s.workoutMetaChip}>
                        <Ionicons name="flame" size={11} color="#FFFFFFBB" />
                        <Text style={s.workoutMetaChipText}>{dayData.calories} cal</Text>
                      </View>
                      <View style={s.workoutMetaChip}>
                        <Ionicons name="barbell" size={11} color="#FFFFFFBB" />
                        <Text style={s.workoutMetaChipText}>{dayData.exercises.length} exercises</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Week progression note */}
                <View style={[s.progressionNote, { backgroundColor: weekCfg.color + '12', borderColor: weekCfg.color + '30' }]}>
                  <Ionicons name="trending-up" size={14} color={weekCfg.color} />
                  <Text style={[s.progressionNoteText, { color: weekCfg.color }]}>
                    Week {activeWeek + 1}: {weekCfg.sets} sets × {weekCfg.reps} reps · {weekCfg.intensity} intensity
                  </Text>
                </View>

                {/* Exercise list */}
                <View style={s.exList}>
                  <Text style={s.exListTitle}>Exercises</Text>
                  {dayData.exercises.map((ex, i) => (
                    <TouchableOpacity key={i} style={s.exItem} activeOpacity={0.9} onPress={() => openExercise(ex, i)}>
                      <View style={s.exItemNum}>
                        <Text style={[s.exItemNumText, { color: dayData.color }]}>{String(i + 1).padStart(2, '0')}</Text>
                      </View>
                      <Image source={{ uri: ex.image }} style={s.exItemThumb} resizeMode="cover" />
                      <View style={s.exItemInfo}>
                        <Text style={s.exItemName}>{ex.name}</Text>
                        <View style={s.exItemMeta}>
                          <View style={[s.exMetaChip, { backgroundColor: dayData.color + '18' }]}>
                            <Text style={[s.exMetaChipText, { color: dayData.color }]}>{weekCfg.sets} sets</Text>
                          </View>
                          <View style={[s.exMetaChip, { backgroundColor: C.surface2 }]}>
                            <Text style={s.exMetaChipText}>{weekCfg.reps} reps</Text>
                          </View>
                          <View style={[s.exMetaChip, { backgroundColor: C.surface2 }]}>
                            <Ionicons name="timer-outline" size={10} color={C.textMuted} />
                            <Text style={s.exMetaChipText}>{ex.rest} rest</Text>
                          </View>
                        </View>
                      </View>
                      {completedExercises[`w${activeWeek}_d${activeDay}_e${i}`] && (
                        <View style={[s.exDoneTick, { backgroundColor: C.lime }]}>
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        </View>
                      )}
                      <TouchableOpacity
                        style={[s.exPlayBtn, { backgroundColor: dayData.color + '20', borderColor: dayData.color + '40' }]}
                        onPress={() => openExercise(ex, i)}
                      >
                        <Ionicons name="play" size={13} color={dayData.color} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action buttons */}
                <View style={s.actionRow}>
                  {isDone ? (
                    <View style={s.doneBanner}>
                      <Ionicons name="checkmark-circle" size={20} color={C.lime} />
                      <Text style={s.doneBannerText}>Completed! Great work 💪</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={s.startBtn}
                        onPress={() => {
                          markDayDone();
                          openExercise(dayData.exercises[0] || { id: 'squat', name: dayData.typeLabel }, 0);
                        }}
                        activeOpacity={0.88}
                      >
                        <LinearGradient colors={[dayData.color, dayData.color + 'CC']} style={s.startBtnGrad}>
                          <Ionicons name="play" size={18} color="#000000" />
                          <Text style={s.startBtnText}>Start {dayData.typeLabel}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.doneBtn} onPress={markDayDone}>
                        <Ionicons name="checkmark-done" size={18} color={C.lime} />
                        <Text style={s.doneBtnText}>Mark Done</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ) : (
              /* Rest Day Card */
              <View style={s.restCard}>
                <Text style={s.restEmoji}>😴</Text>
                <Text style={s.restTitle}>Rest & Recovery Day</Text>
                <Text style={s.restDesc}>
                  Your muscles grow during rest, not during training. Take today off completely, stay hydrated, and get 7–8 hours of sleep.
                </Text>
                <View style={s.restTips}>
                  {[
                    { icon: '💧', text: 'Drink 3+ liters of water' },
                    { icon: '🛌', text: 'Sleep 7–8 hours tonight' },
                    { icon: '🧘', text: 'Light stretching is okay' },
                    { icon: '🥗', text: 'Eat your protein targets' },
                  ].map((tip, i) => (
                    <View key={i} style={s.restTip}>
                      <Text style={s.restTipIcon}>{tip.icon}</Text>
                      <Text style={s.restTipText}>{tip.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          /* ── MONTHLY VIEW ── */
          <View style={s.monthView}>
            <Text style={s.monthViewTitle}>4-Week Programme Overview</Text>
            {WEEK_CONFIG.map((wk, wi) => (
              <TouchableOpacity
                key={wi}
                style={[s.monthWeekCard, activeWeek === wi && { borderColor: wk.color + '60', backgroundColor: wk.color + '08' }]}
                onPress={() => { setActiveWeek(wi); setView('week'); }}
              >
                <LinearGradient colors={[wk.color + '25', 'transparent']} style={s.monthWeekGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <View style={s.monthWeekLeft}>
                    <Text style={[s.monthWeekNum, { color: wk.color }]}>Week {wi + 1}</Text>
                    <Text style={[s.monthWeekLabel, { color: wk.color }]}>{wk.label}</Text>
                    <Text style={s.monthWeekDesc}>{wk.desc}</Text>
                  </View>
                  <View style={s.monthWeekRight}>
                    <View style={s.monthWeekDays}>
                      {WEEKLY_PROGRAM.slice(0, 6).map((d, di) => (
                        <View
                          key={di}
                          style={[
                            s.monthDay,
                            { backgroundColor: completedDays[`w${wi}_d${di}`] ? TYPE_COLORS[d.type] : C.surface2 },
                          ]}
                        >
                          {completedDays[`w${wi}_d${di}`]
                            ? <Ionicons name="checkmark" size={8} color="#000" />
                            : <Text style={s.monthDayText}>{d.type[0]}</Text>
                          }
                        </View>
                      ))}
                    </View>
                    <Text style={s.monthWeekIntensity}>{wk.intensity}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            {/* Programme summary */}
            <View style={s.progSummary}>
              <Text style={s.progSummaryTitle}>Programme Summary</Text>
              {[
                { icon: '🏋️', label: '6 training days per week', color: C.brand },
                { icon: '😴', label: '1 full rest day (Sunday)', color: C.teal },
                { icon: '📈', label: 'Progressive overload each week', color: C.lime },
                { icon: '🔄', label: 'Deload in Week 4 for recovery', color: C.blue },
                { icon: '⏱️', label: '30–55 min workouts', color: C.gold },
                { icon: '🔥', label: '1,870+ calories burned per week', color: C.red },
              ].map((item, i) => (
                <View key={i} style={s.progSummaryItem}>
                  <Text style={s.progSummaryIcon}>{item.icon}</Text>
                  <Text style={s.progSummaryText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : (IS_TABLET ? 24 : 16), paddingTop: IS_SMALL ? 10 : 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: C.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: IS_SMALL ? 22 : 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand + '18', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '35',
  },
  aiBtnText: { fontSize: IS_SMALL ? 11 : 12, fontWeight: '800', color: C.brand },

  viewToggle: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12,
    padding: 4, marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: C.brand },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  toggleBtnTextActive: { color: '#FFFFFF', fontWeight: '900' },

  weekSelector: { flexDirection: 'row', gap: IS_SMALL ? 6 : 8, marginBottom: 14 },
  weekBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1.5, borderColor: C.border,
  },
  weekBtnDot: { width: 7, height: 7, borderRadius: 4 },
  weekBtnLabel: { fontSize: IS_SMALL ? 10 : 11, fontWeight: '700', color: C.textMuted },

  weekCard: {
    borderRadius: IS_SMALL ? 14 : 18, padding: IS_SMALL ? 12 : 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  weekCardLeft: { gap: 8 },
  weekTypeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  weekTypeBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  weekCardDesc: { fontSize: 13, color: C.textSub },
  weekCardStats: { flexDirection: 'row', alignItems: 'center', gap: 0, flexWrap: IS_SMALL ? 'wrap' : 'nowrap' },
  weekCardStat: { flex: IS_SMALL ? 0 : 1, alignItems: 'center', minWidth: IS_SMALL ? '33%' : undefined, marginBottom: IS_SMALL ? 8 : 0 },
  weekCardStatVal: { fontSize: IS_SMALL ? 16 : 20, fontWeight: '900', letterSpacing: -0.5 },
  weekCardStatLabel: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  weekCardStatDiv: { width: IS_SMALL ? 0 : 1, height: 30, backgroundColor: C.border },

  dayStrip: { gap: 8, paddingBottom: 4, marginBottom: 16 },
  dayPill: {
    width: IS_SMALL ? 60 : 66, alignItems: 'center', gap: 4,
    backgroundColor: C.surface, borderRadius: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: C.border, position: 'relative',
  },
  dayPillDone: { opacity: 0.75 },
  dayDoneTick: {
    position: 'absolute', top: -5, right: -5,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.bg,
  },
  todayDot: {
    position: 'absolute', top: 6, right: 6,
    width: 6, height: 6, borderRadius: 3,
  },
  dayPillDay: { fontSize: 11, fontWeight: '900', color: C.textMuted, letterSpacing: 0.5 },
  dayPillIcon: { fontSize: 18 },
  dayPillType: { fontSize: 9, fontWeight: '800', color: C.textDim, letterSpacing: 0.3 },

  workoutCard: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  workoutHero: { height: IS_SMALL ? 176 : 200, position: 'relative' },
  workoutHeroImg: { ...StyleSheet.absoluteFillObject },
  workoutAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  workoutHeroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  workoutTypeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, marginBottom: 6,
  },
  workoutTypeBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  workoutHeroTitle: { fontSize: IS_SMALL ? 18 : 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 2 },
  workoutHeroMuscles: { fontSize: 12, color: '#FFFFFFBB', marginBottom: 10 },
  workoutHeroMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  workoutMetaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  workoutMetaChipText: { fontSize: 10, color: '#FFFFFFCC', fontWeight: '600' },

  progressionNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  progressionNoteText: { fontSize: 11, fontWeight: '700' },

  exList: { padding: IS_SMALL ? 10 : 14, paddingTop: 4, gap: 10 },
  exListTitle: { fontSize: 14, fontWeight: '900', color: C.text, marginBottom: 4, letterSpacing: -0.2 },
  exItem: {
    flexDirection: 'row', alignItems: 'center', gap: IS_SMALL ? 8 : 10,
    backgroundColor: C.surface2, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  exItemNum: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg,
  },
  exItemNumText: { fontSize: 10, fontWeight: '900' },
  exItemThumb: { width: IS_SMALL ? 42 : 48, height: IS_SMALL ? 42 : 48, borderRadius: 10 },
  exItemInfo: { flex: 1, gap: 4 },
  exItemName: { fontSize: IS_SMALL ? 12 : 13, fontWeight: '800', color: C.text },
  exItemMeta: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  exMetaChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  exMetaChipText: { fontSize: 9, fontWeight: '700', color: C.textMuted },
  exPlayBtn: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  exDoneTick: {
    width: 20, height: 20, borderRadius: 10, marginRight: 4,
    justifyContent: 'center', alignItems: 'center',
  },

  actionRow: { padding: 14, paddingTop: 4, gap: 10 },
  startBtn: { borderRadius: 16, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  startBtnText: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '900', color: '#000000' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, backgroundColor: C.lime + '15',
    borderRadius: 14, borderWidth: 1, borderColor: C.lime + '35',
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.lime },
  doneBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, backgroundColor: C.lime + '15',
    borderRadius: 14, borderWidth: 1, borderColor: C.lime + '35',
  },
  doneBannerText: { fontSize: 14, fontWeight: '800', color: C.lime },

  restCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: IS_SMALL ? 16 : 24,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 12,
  },
  restEmoji: { fontSize: 52, marginBottom: 4 },
  restTitle: { fontSize: IS_SMALL ? 18 : 20, fontWeight: '900', color: C.text },
  restDesc: { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  restTips: { width: '100%', gap: 10, marginTop: 4 },
  restTip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface2, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  restTipIcon: { fontSize: 20 },
  restTipText: { fontSize: 13, color: C.textSub, fontWeight: '600' },

  // Month view
  monthView: { gap: 12 },
  monthViewTitle: { fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  monthWeekCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  monthWeekGrad: { padding: IS_SMALL ? 12 : 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthWeekLeft: { flex: 1, gap: 3 },
  monthWeekNum: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  monthWeekLabel: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  monthWeekDesc: { fontSize: 11, color: C.textMuted },
  monthWeekRight: { alignItems: 'flex-end', gap: 6 },
  monthWeekDays: { flexDirection: 'row', gap: 4 },
  monthDay: {
    width: 22, height: 22, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  monthDayText: { fontSize: 8, fontWeight: '800', color: C.textDim },
  monthWeekIntensity: { fontSize: 10, fontWeight: '700', color: C.textMuted },

  progSummary: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  progSummaryTitle: { fontSize: 15, fontWeight: '900', color: C.text, marginBottom: 4 },
  progSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progSummaryIcon: { fontSize: 18, width: 24 },
  progSummaryText: { fontSize: 13, color: C.textSub, fontWeight: '600' },
});

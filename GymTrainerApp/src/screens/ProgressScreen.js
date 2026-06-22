import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, DeviceEventEmitter, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme';
import { progressAPI } from '../services/api';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;

const WEEK_DATA = [
  { day: 'Mon', reps: 48, cal: 220 },
  { day: 'Tue', reps: 65, cal: 310 },
  { day: 'Wed', reps: 30, cal: 140 },
  { day: 'Thu', reps: 80, cal: 380 },
  { day: 'Fri', reps: 55, cal: 260 },
  { day: 'Sat', reps: 90, cal: 420 },
  { day: 'Sun', reps: 40, cal: 180 },
];

const ACHIEVEMENTS = [
  { icon: '🔥', label: '7-Day Streak', desc: '7 consecutive workout days!', earned: true },
  { icon: '💪', label: '100 Reps', desc: 'Hit 100 reps in one session!', earned: true },
  { icon: '⭐', label: 'Perfect Form', desc: '95%+ accuracy session', earned: true },
  { icon: '🏆', label: 'First Week', desc: 'Complete your first week!', earned: false },
  { icon: '🚀', label: '500 Reps', desc: 'Reach 500 total reps!', earned: false },
  { icon: '👑', label: '30-Day Streak', desc: '30 days in a row!', earned: false },
];

const EXERCISE_BREAKDOWN = [
  { name: 'Squats', reps: 186, pct: 38, color: C.brand },
  { name: 'Push-Ups', reps: 140, pct: 29, color: C.blue },
  { name: 'Plank', reps: 95, pct: 19, color: C.lime },
  { name: 'Curls', reps: 65, pct: 14, color: C.teal },
];

function BarChart({ data }) {
  const maxReps = Math.max(1, ...data.map(d => d.reps));
  return (
    <View style={bc.container}>
      {data.map((d, i) => {
        const h = (d.reps / maxReps) * 80;
        const isMax = d.reps === maxReps;
        return (
          <View key={i} style={bc.col}>
            {isMax && (
              <View style={bc.badge}>
                <Text style={bc.badgeText}>{d.reps}</Text>
              </View>
            )}
            <View style={bc.track}>
              <LinearGradient
                colors={isMax ? [C.brand, C.brandLight] : [C.surface2, C.borderHi]}
                style={[bc.fill, { height: h }]}
              />
            </View>
            <Text style={[bc.label, isMax && { color: C.brandLight }]}>{d.day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const bc = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  col: { alignItems: 'center', gap: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: -22,
    backgroundColor: C.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  track: {
    width: 32, height: 80, backgroundColor: C.surface2,
    borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end',
  },
  fill: { width: '100%', borderRadius: 10 },
  label: { fontSize: 11, fontWeight: '600', color: C.textMuted },
});

export default function ProgressScreen({ navigation }) {
  const [stats, setStats] = useState({
    streak: 7, totalSessions: 24, accuracy: 87, totalReps: 486, calories: 4260,
  });
  const [filter, setFilter] = useState('week');
  const [weekData, setWeekData] = useState(WEEK_DATA);
  const [exerciseBreakdown, setExerciseBreakdown] = useState(EXERCISE_BREAKDOWN);
  const [story, setStory] = useState({ delta: 0, sessionsThisWeek: 0, sessionsLastWeek: 0, milestone: 'Keep going' });

  useEffect(() => {
    loadProgress();
    const focusSub = navigation?.addListener?.('focus', loadProgress);
    const progressSub = DeviceEventEmitter.addListener('progressUpdated', loadProgress);
    return () => {
      focusSub?.();
      progressSub?.remove();
    };
  }, []);

  const loadProgress = async () => {
    try {
      const localRaw = await AsyncStorage.getItem('userStats');
      if (localRaw) setStats(prev => ({ ...prev, ...JSON.parse(localRaw) }));

      const remoteStats = await progressAPI.getStats();
      const remoteSessions = await progressAPI.getSessions();

      if (remoteStats?.success && remoteStats?.stats) {
        const merged = { ...stats, ...remoteStats.stats };
        setStats(prev => ({ ...prev, ...remoteStats.stats }));
        await AsyncStorage.setItem('userStats', JSON.stringify(merged));
      }

      if (remoteSessions?.success && Array.isArray(remoteSessions.sessions)) {
        const sessions = remoteSessions.sessions;
        const byDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const byExercise = {};
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        let sessionsThisWeek = 0;
        let sessionsLastWeek = 0;
        sessions.forEach((s) => {
          const d = new Date(s.created_at || s.date || Date.now());
          const age = now - d.getTime();
          if (age <= oneWeek) sessionsThisWeek += 1;
          else if (age <= oneWeek * 2) sessionsLastWeek += 1;
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
          byDay[day] = (byDay[day] || 0) + (s.reps || 0);
          const ex = String(s.exercise || 'Exercise');
          byExercise[ex] = (byExercise[ex] || 0) + (s.reps || 0);
        });
        setWeekData([
          { day: 'Mon', reps: byDay.Mon, cal: 0 },
          { day: 'Tue', reps: byDay.Tue, cal: 0 },
          { day: 'Wed', reps: byDay.Wed, cal: 0 },
          { day: 'Thu', reps: byDay.Thu, cal: 0 },
          { day: 'Fri', reps: byDay.Fri, cal: 0 },
          { day: 'Sat', reps: byDay.Sat, cal: 0 },
          { day: 'Sun', reps: byDay.Sun, cal: 0 },
        ]);
        const total = Object.values(byExercise).reduce((a, n) => a + n, 0) || 1;
        const top = Object.entries(byExercise)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, reps], i) => ({
            name,
            reps,
            pct: Math.max(1, Math.round((reps / total) * 100)),
            color: [C.brand, C.blue, C.lime, C.teal][i % 4],
          }));
        if (top.length) setExerciseBreakdown(top);
        const delta = sessionsThisWeek - sessionsLastWeek;
        const totalReps = sessions.reduce((acc, s) => acc + (s.reps || 0), 0);
        const milestone =
          totalReps >= 1000 ? '1,000 reps milestone unlocked' :
          totalReps >= 500 ? '500 reps milestone unlocked' :
          totalReps >= 100 ? '100 reps milestone unlocked' : 'First 100 reps in progress';
        setStory({ delta, sessionsThisWeek, sessionsLastWeek, milestone });
      }
    } catch (_) {}
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>My Progress</Text>
            <Text style={s.headerSub}>Your fitness journey 📈</Text>
          </View>
          <View style={s.filterRow}>
            {['week', 'month'].map(f => (
              <TouchableOpacity
                key={f}
                style={[s.filterChip, filter === f && s.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.filterText, filter === f && { color: '#FFFFFF' }]}>
                  {f === 'week' ? 'Week' : 'Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── MAIN STATS ── */}
        <View style={s.statsGrid}>
          {[
            { icon: 'flame', label: 'Day Streak', value: stats.streak, unit: 'days', color: C.brand, gradient: [C.brand + '30', C.brand + '10'] },
            { icon: 'star', label: 'Accuracy', value: stats.accuracy, unit: '%', color: C.lime, gradient: [C.lime + '30', C.lime + '10'] },
            { icon: 'barbell', label: 'Sessions', value: stats.totalSessions, unit: 'total', color: C.blue, gradient: [C.blue + '30', C.blue + '10'] },
            { icon: 'fitness', label: 'Total Reps', value: stats.totalReps, unit: 'reps', color: C.teal, gradient: [C.teal + '30', C.teal + '10'] },
          ].map((st, i) => (
            <LinearGradient key={i} colors={st.gradient} style={s.statCard}>
              <View style={[s.statIconBox, { backgroundColor: st.color + '25' }]}>
                <Ionicons name={st.icon} size={22} color={st.color} />
              </View>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statUnit}>{st.unit}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </LinearGradient>
          ))}
        </View>

        <View style={s.storyRow}>
          <View style={s.storyCard}>
            <Text style={s.storyLabel}>Week-over-week</Text>
            <Text style={[s.storyValue, { color: story.delta >= 0 ? C.lime : C.red }]}>
              {story.delta >= 0 ? '+' : ''}{story.delta} sessions
            </Text>
            <Text style={s.storySub}>
              This week {story.sessionsThisWeek} vs last week {story.sessionsLastWeek}
            </Text>
          </View>
          <View style={s.storyCard}>
            <Text style={s.storyLabel}>Milestone</Text>
            <Text style={s.storyValue}>{story.milestone}</Text>
            <Text style={s.storySub}>Keep training to unlock next badge</Text>
          </View>
        </View>

        {/* ── WEEKLY REPS CHART ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>Weekly Reps</Text>
              <Text style={s.cardSub}>This week's workout record</Text>
            </View>
            <View style={s.totalRepsBadge}>
              <Text style={s.totalRepsText}>{weekData.reduce((a, d) => a + d.reps, 0)} total</Text>
            </View>
          </View>
          {weekData.reduce((a, d) => a + d.reps, 0) > 0 ? (
            <BarChart data={weekData} />
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="bar-chart" size={22} color={C.textMuted} />
              <Text style={s.emptyStateText}>No workout data this week yet. Complete one session to start trends.</Text>
            </View>
          )}
        </View>

        {/* ── EXERCISE BREAKDOWN ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Exercise Breakdown</Text>
          {exerciseBreakdown.length ? exerciseBreakdown.map((ex, i) => (
            <View key={i} style={s.breakdownRow}>
              <Text style={s.breakdownName}>{ex.name}</Text>
              <View style={s.breakdownBarTrack}>
                <LinearGradient
                  colors={[ex.color, ex.color + 'AA']}
                  style={[s.breakdownBarFill, { width: `${ex.pct}%` }]}
                />
              </View>
              <Text style={s.breakdownReps}>{ex.reps}</Text>
              <Text style={[s.breakdownPct, { color: ex.color }]}>{ex.pct}%</Text>
            </View>
          )) : (
            <View style={s.emptyState}>
              <Ionicons name="fitness" size={22} color={C.textMuted} />
              <Text style={s.emptyStateText}>No exercises completed yet. Start a workout to build your breakdown.</Text>
            </View>
          )}
        </View>

        {/* ── CALORIES ── */}
        <LinearGradient colors={[C.brand + 'CC', C.brandDark]} style={s.calCard}>
          <View style={s.calLeft}>
            <Text style={s.calLabel}>Total Calories Burned</Text>
            <Text style={s.calVal}>{stats.calories.toLocaleString()}</Text>
            <Text style={s.calSub}>this week total</Text>
          </View>
          <Ionicons name="flame" size={60} color="#FFFFFF30" />
        </LinearGradient>

        {/* ── ACHIEVEMENTS ── */}
        <Text style={s.sectionTitle}>Achievements 🏅</Text>
        <View style={s.achGrid}>
          {ACHIEVEMENTS.map((a, i) => (
            <View key={i} style={[s.achCard, !a.earned && s.achCardLocked]}>
              <Text style={[s.achIcon, !a.earned && { opacity: 0.3 }]}>{a.icon}</Text>
              <Text style={[s.achLabel, !a.earned && { color: C.textDim }]}>{a.label}</Text>
              <Text style={[s.achDesc, !a.earned && { color: C.textDim }]}>{a.desc}</Text>
              {a.earned && (
                <View style={s.earnedDot} />
              )}
              {!a.earned && (
                <Ionicons name="lock-closed" size={14} color={C.textDim} style={{ marginTop: 4 }} />
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: IS_SMALL ? 12 : 16 },
  header: {
    flexDirection: IS_SMALL ? 'column' : 'row', justifyContent: 'space-between',
    alignItems: IS_SMALL ? 'flex-start' : 'center', marginBottom: 20, gap: IS_SMALL ? 10 : 0,
  },
  headerTitle: { fontSize: IS_SMALL ? 20 : 22, fontWeight: '900', color: C.text },
  headerSub: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border,
  },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  filterChipActive: { backgroundColor: C.brand },
  filterText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: IS_SMALL ? 8 : 12, marginBottom: 20 },
  statCard: {
    width: IS_SMALL ? '48%' : '47%', borderRadius: 20, padding: IS_SMALL ? 12 : 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.border,
  },
  statIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  statVal: { fontSize: IS_SMALL ? 22 : 28, fontWeight: '900' },
  statUnit: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  statLabel: { fontSize: 12, color: C.textSub, textAlign: 'center' },
  card: {
    backgroundColor: C.surface, borderRadius: 20, padding: IS_SMALL ? 14 : 18, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '800', color: C.text, marginBottom: 14 },
  cardSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  totalRepsBadge: {
    backgroundColor: C.brand + '25', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '40',
  },
  totalRepsText: { color: C.brandLight, fontSize: 12, fontWeight: '700' },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  breakdownName: { width: IS_SMALL ? 62 : 75, fontSize: IS_SMALL ? 12 : 13, color: C.textSub, fontWeight: '600' },
  breakdownBarTrack: {
    flex: 1, height: 8, backgroundColor: C.surface2,
    borderRadius: 4, overflow: 'hidden',
  },
  breakdownBarFill: { height: '100%', borderRadius: 4 },
  breakdownReps: { width: 36, fontSize: 12, color: C.text, fontWeight: '700', textAlign: 'right' },
  breakdownPct: { width: 34, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  calCard: {
    borderRadius: 22, padding: IS_SMALL ? 16 : 24, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  calLeft: { flex: 1 },
  calLabel: { fontSize: 13, color: '#FFFFFFCC', fontWeight: '600', marginBottom: 6 },
  calVal: { fontSize: IS_SMALL ? 28 : 36, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  calSub: { fontSize: 13, color: '#FFFFFFAA' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 14 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: IS_SMALL ? 8 : 12 },
  achCard: {
    width: IS_SMALL ? '48%' : '47%', backgroundColor: C.surface,
    borderRadius: 18, padding: IS_SMALL ? 12 : 16, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.border,
  },
  achCardLocked: { borderColor: C.border, opacity: 0.6 },
  achIcon: { fontSize: 28, marginBottom: 4 },
  achLabel: { fontSize: 13, fontWeight: '800', color: C.text, textAlign: 'center' },
  achDesc: { fontSize: 11, color: C.textMuted, textAlign: 'center' },
  earnedDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.teal, marginTop: 4,
  },
  storyRow: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 10, marginBottom: 16 },
  storyCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  storyLabel: { fontSize: 11, color: C.textMuted, fontWeight: '700', marginBottom: 6 },
  storyValue: { fontSize: 13, color: C.text, fontWeight: '800', marginBottom: 4 },
  storySub: { fontSize: 10, color: C.textSub, lineHeight: 14 },
  emptyState: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateText: { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
});

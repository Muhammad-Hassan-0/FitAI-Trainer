import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import YouTubePlayer from '../components/YouTubePlayer';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

const EXERCISE_DATA = {
  squat: {
    name: 'Squats',
    category: 'Leg Day — Compound',
    muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
    difficulty: 'Intermediate',
    calories: '8-12 cal/min',
    equipment: 'Bodyweight',
    color: C.brand,
    gradient: [C.brand, C.brandDark],
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&q=80&fit=crop',
    youtubeId: 'aclHkVaku9U',
    youtubeTitle: 'Perfect Squat Tutorial — Step by Step',
    description: 'Squat ek fundamental lower body compound exercise hai. Ye legs, glutes aur core ko ek saath target karta hai. Har beginner ke liye zaroori exercise hai.',
    steps: [
      'Paon shoulder-width apart rakho, toes thoda bahar ki taraf (30°)',
      'Seena upar, kamar seedhi — neutral spine maintain karo',
      'Arms aage stretch karo balance ke liye',
      'Dheere dheere neeche baitho jaise kursi pe baithna ho',
      'Ghutne paon ki unglion ke direction mein rakho — andar mat aane do',
      'Wazan ednion par rakho — agly paon pe mat aao',
      'Thigh floor ke parallel ya thoda neeche tak jao (parallel squat)',
      'Dheere dheere wapas upar aao, hips drive karo',
    ],
    commonMistakes: [
      '❌ Ghutne andar ki taraf aana (knee valgus/cave)',
      '❌ Ednion ka utha lena (heel rise)',
      '❌ Kamar ka aage jhukna (forward lean)',
      '❌ Poori depth tak na jana (half squat)',
      '❌ Goede se breathe na karna (hold breath)',
    ],
    proTips: [
      '✅ Warm-up mein dynamic stretches zaroor karein',
      '✅ Mirror ke samne practice karo form check ke liye',
      '✅ Pehle bodyweight perfect karo, tab weight add karo',
      '✅ "Knees out" cue yaad rakho har rep mein',
    ],
    sets: { Beginner: '2 × 10 reps', Intermediate: '3 × 12 reps', Advanced: '4 × 15 reps' },
    angles: { Knee: '80-100°', Hip: '90-110°', Ankle: '15-20°' },
  },
  pushup: {
    name: 'Push-Ups',
    category: 'Upper Body — Compound',
    muscles: ['Chest (Pectorals)', 'Triceps', 'Shoulders', 'Core'],
    difficulty: 'Beginner',
    calories: '7-10 cal/min',
    equipment: 'Bodyweight',
    color: C.blue,
    gradient: [C.blue, '#1D4ED8'],
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=800&q=80&fit=crop',
    youtubeId: 'IODxDxX7oi4',
    youtubeTitle: 'Perfect Push-Up Form — Complete Tutorial',
    description: 'Push-up ek classic upper body exercise hai jo chest, triceps aur shoulders ko strengthen karta hai. Kisi bhi jagah bina equipment ke kar sakte hain.',
    steps: [
      'Haath shoulder-width se thoda zyada door rakho (index fingers forward)',
      'Body head se heel tak seedhi line mein — plank position',
      'Core, glutes aur quads tight karo puri exercise mein',
      'Elbow 45° angle par body se (45-degree angle, not 90°)',
      'Dheere dheere neeche aao — chest floor ke qareeb',
      'Ek second pause karo bottom pe',
      'Explosive push up karo starting position par',
      'Poori tarah arms extend karo top pe',
    ],
    commonMistakes: [
      '❌ Hips utha lena ya girne dena (sagging hips)',
      '❌ Elbow 90° bahar nikalna (flaring elbows)',
      '❌ Poori range of motion use na karna',
      '❌ Gardan neeche girne dena (neck drop)',
      '❌ Bahut tezi se karna (no control)',
    ],
    proTips: [
      '✅ Beginners: Knee push-ups se shuru karein',
      '✅ Saans andar lo neeche jaate hue, bahar do upar jaate hue',
      '✅ Slow negative (3 sec down) strength ke liye better hai',
      '✅ Diamond push-up se triceps zyada work hote hain',
    ],
    sets: { Beginner: '2 × 8 reps', Intermediate: '3 × 12 reps', Advanced: '4 × 20 reps' },
    angles: { Elbow: '80-100°', Shoulder: '45°', Body: '180° (straight)' },
  },
  plank: {
    name: 'Plank',
    category: 'Core — Isometric',
    muscles: ['Core Abs', 'Lower Back', 'Shoulders', 'Glutes'],
    difficulty: 'Beginner',
    calories: '3-5 cal/min',
    equipment: 'Bodyweight',
    color: C.green,
    gradient: [C.green, C.teal],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop',
    youtubeId: 'ASdvN_XEl_c',
    youtubeTitle: 'Perfect Plank Form — Core Workout Tutorial',
    description: 'Plank ek isometric exercise hai jo core stability aur strength build karta hai. Reps nahi, duration matter karta hai — 30 seconds se shuru karein.',
    steps: [
      'Pet ke bal lait jao, forearms aur toes par support lo',
      'Elbows bilkul shoulders ke neeche rakho',
      'Body ek seedhi line mein — head se heel tak',
      'Core tight karo — navel ko spine ki taraf draw karo',
      'Glutes squeeze karo (important!)',
      'Nazar zameen ki taraf (neck neutral)',
      'Normal saans lete raho — rok ke mat rakho',
      'Target time tak hold karo, phir slowly release karo',
    ],
    commonMistakes: [
      '❌ Hips utha lena (pike/tent position)',
      '❌ Hips girne dena (sagging back)',
      '❌ Saans rok lena',
      '❌ Gardan upar ya neeche karna',
      '❌ Elbows shoulders se door rakhna',
    ],
    proTips: [
      '✅ 20 seconds se shuru karo, har roz 5 sec add karo',
      '✅ Side plank bhi karo obliques ke liye',
      '✅ 60 seconds = excellent for beginners',
      '✅ Plank rocks (forward-backward) variation try karo',
    ],
    sets: { Beginner: '3 × 20 seconds', Intermediate: '3 × 45 seconds', Advanced: '3 × 90 seconds' },
    angles: { Back: '160-180° (flat)', Hips: 'neutral', Neck: 'neutral' },
  },
  curl: {
    name: 'Bicep Curls',
    category: 'Arms — Isolation',
    muscles: ['Biceps Brachii', 'Brachialis', 'Forearms'],
    difficulty: 'Beginner',
    calories: '4-6 cal/min',
    equipment: 'Dumbbells (optional)',
    color: C.brand,
    gradient: [C.brand, '#C2410C'],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80&fit=crop',
    youtubeId: 'ykJmrZ5v0Oo',
    youtubeTitle: 'Bicep Curl Perfect Form — Build Big Arms',
    description: 'Bicep curl ek isolation exercise hai jo directly bicep muscles ko target karta hai. Dumbbell, barbell ya resistance band se kar sakte hain.',
    steps: [
      'Seedhe khade ho, haath sides pe, palms aage (supinated grip)',
      'Shoulders ko stable rakho — sirf elbow hila hoga',
      'Core tight, kamar seedhi rakho',
      'Dheere dheere haath curl karo — 2 seconds up',
      'Top pe ek second hold karo, bicep squeeze karo',
      'Dheere dheere wapas neeche aao — 3 seconds down (key!)',
      'Arms poori tarah extend ho neeche (full range)',
      'Ek waqt mein dono ya alternating — dono kaam karta hai',
    ],
    commonMistakes: [
      '❌ Elbow aage peechhe hilana (momentum swinging)',
      '❌ Bahut zyada weight — form toot jata hai',
      '❌ Poori range of motion use na karna',
      '❌ Back arch karna weight uthane ke liye',
      '❌ Slow negative ignore karna',
    ],
    proTips: [
      '✅ Slow negative (lowering) = most muscle growth',
      '✅ Hammer curls brachialis ke liye bhi karo',
      '✅ Concentration curl isolation ke liye best',
      '✅ Dono arms equally train karo (imbalance avoid)',
    ],
    sets: { Beginner: '2 × 10 reps', Intermediate: '3 × 12 reps', Advanced: '4 × 15 reps' },
    angles: { Elbow: '30-50° (top)', Forearm: '160° (bottom)' },
  },
  lunge: {
    name: 'Lunges',
    category: 'Leg Day — Compound',
    muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    difficulty: 'Intermediate',
    calories: '6-9 cal/min',
    equipment: 'Bodyweight',
    color: C.teal,
    gradient: [C.teal, '#BE185D'],
    image: 'https://images.unsplash.com/photo-1434682966571-82fbecee4bab?w=800&q=80&fit=crop',
    youtubeId: 'QOVaHwm-Q6U',
    youtubeTitle: 'Perfect Lunge Form — Legs & Glutes Tutorial',
    description: 'Lunge ek lower body compound exercise hai. Squats se alag — ek paon aage hota hai. Balance, coordination aur unilateral strength build karta hai.',
    steps: [
      'Seedhe khare ho, haath hips par ya sides pe',
      'Ek bada qadam aage lo (stride length important)',
      'Dono ghutne 90° angle par aayein',
      'Pichla ghutna zameen ke qareeb aaye — bilkul touch na kare',
      'Aage wala ghutna paon ki ungli se aage nahi jaana chahiye',
      'Torso bilkul seedha rakho — aage mat jhuko',
      'Wapas shuru ki position mein — dono paon ek line mein',
      'Dono legs alternate karo (same count)',
    ],
    commonMistakes: [
      '❌ Front knee toes se aage nikalna',
      '❌ Torso aage jhukna',
      '❌ Back knee zameen pe marjana (impact)',
      '❌ Chhoti steps lena (balance issue)',
      '❌ Ek side zyada karna (imbalance)',
    ],
    proTips: [
      '✅ Balance ke liye pehle wall ka sahara lo',
      '✅ Walking lunges cardio bhi deta hai',
      '✅ Reverse lunge knee ke liye safer hai',
      '✅ Bulgarian split squat advanced version try karo',
    ],
    sets: { Beginner: '2 × 8 each leg', Intermediate: '3 × 10 each leg', Advanced: '4 × 12 each leg' },
    angles: { 'Front Knee': '85-95°', 'Back Knee': '85-95°', Torso: 'upright (90°)' },
  },
};

export default function ExerciseDetailScreen({ route, navigation }) {
  const exerciseId = route?.params?.exerciseId || 'squat';
  const ex = EXERCISE_DATA[exerciseId] || EXERCISE_DATA.squat;
  const [activeTab, setActiveTab] = useState('steps');

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HERO IMAGE ── */}
        <View style={s.heroBox}>
          <Image source={{ uri: ex.image }} style={s.heroImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', '#0B0B0FF0']} style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.heroInfo}>
            <View style={[s.catBadge, { backgroundColor: ex.color }]}>
              <Text style={s.catBadgeText}>{ex.category}</Text>
            </View>
            <Text style={s.heroName}>{ex.name}</Text>
          </View>
        </View>

        {/* ── QUICK STATS ── */}
        <View style={s.quickStats}>
          {[
            { icon: 'fitness', label: 'Level', value: ex.difficulty, color: ex.color },
            { icon: 'flame', label: 'Calories', value: ex.calories, color: C.brand },
            { icon: 'barbell', label: 'Equipment', value: ex.equipment, color: C.blue },
          ].map((st, i) => (
            <View key={i} style={s.quickStatItem}>
              <View style={[s.quickStatIcon, { backgroundColor: st.color + '20' }]}>
                <Ionicons name={st.icon} size={16} color={st.color} />
              </View>
              <Text style={s.quickStatVal}>{st.value}</Text>
              <Text style={s.quickStatLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── TARGET MUSCLES ── */}
        <View style={s.musclesRow}>
          {ex.muscles.map((m, i) => (
            <View key={i} style={[s.muscleBadge, { borderColor: ex.color + '60', backgroundColor: ex.color + '15' }]}>
              <Text style={[s.muscleBadgeText, { color: ex.color }]}>{m}</Text>
            </View>
          ))}
        </View>

        {/* ── DESCRIPTION ── */}
        <Text style={s.description}>{ex.description}</Text>

        {/* ── YOUTUBE VIDEO ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          <Text style={s.sectionTitle}>Video Tutorial</Text>
        </View>
        <YouTubePlayer
          videoId={ex.youtubeId}
          title={ex.youtubeTitle}
        />

        {/* ── SETS/REPS BY LEVEL ── */}
        <View style={s.setsCard}>
          <Text style={s.cardTitle}>Sets & Reps — Level-wise</Text>
          {Object.entries(ex.sets).map(([level, val], i) => {
            const colors = { Beginner: C.green, Intermediate: C.brand, Advanced: C.red };
            return (
              <View key={i} style={s.setsRow}>
                <View style={[s.levelPill, { backgroundColor: colors[level] + '20' }]}>
                  <Text style={[s.levelText, { color: colors[level] }]}>{level}</Text>
                </View>
                <Text style={s.setsVal}>{val}</Text>
              </View>
            );
          })}
        </View>

        {/* ── ANGLE REFERENCE ── */}
        <View style={s.angleCard}>
          <View style={s.angleHeader}>
            <Ionicons name="analytics" size={16} color={ex.color} />
            <Text style={s.cardTitle}>AI Monitor — Joint Angles</Text>
          </View>
          {Object.entries(ex.angles).map(([joint, angle], i) => (
            <View key={i} style={s.angleRow}>
              <View style={s.angleDot} />
              <Text style={s.angleJoint}>{joint}</Text>
              <View style={[s.angleValBox, { backgroundColor: ex.color + '20' }]}>
                <Text style={[s.angleVal, { color: ex.color }]}>{angle}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── TABS: STEPS / MISTAKES / TIPS ── */}
        <View style={s.tabRow}>
          {[
            { id: 'steps', label: '📋 Steps', count: ex.steps.length },
            { id: 'mistakes', label: '⚠️ Mistakes', count: ex.commonMistakes.length },
            { id: 'tips', label: '💡 Pro Tips', count: ex.proTips.length },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tabBtn, activeTab === tab.id && s.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[s.tabBtnText, activeTab === tab.id && { color: C.text }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'steps' && ex.steps.map((step, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepNum, { backgroundColor: ex.color + '20', borderColor: ex.color + '40' }]}>
              <Text style={[s.stepNumText, { color: ex.color }]}>{i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}

        {activeTab === 'mistakes' && ex.commonMistakes.map((m, i) => (
          <View key={i} style={s.mistakeItem}>
            <Text style={s.listItemText}>{m}</Text>
          </View>
        ))}

        {activeTab === 'tips' && ex.proTips.map((tip, i) => (
          <View key={i} style={s.tipItem}>
            <Text style={s.listItemText}>{tip}</Text>
          </View>
        ))}

        {/* ── START BUTTON ── */}
        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate('LiveExercise', {
            exercise: { id: exerciseId, name: ex.name, color: ex.color, icon: 'barbell' }
          })}
          activeOpacity={0.88}
        >
          <LinearGradient colors={ex.gradient} style={s.startBtnGrad}>
            <Ionicons name="videocam" size={20} color="#FFFFFF" />
            <Text style={s.startBtnText}>AI Monitor ke saath Start Karein</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },
  heroBox: { height: IS_TABLET ? 340 : (IS_SMALL ? 230 : 280), position: 'relative', marginBottom: 0 },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backBtn: {
    position: 'absolute', top: IS_SMALL ? 44 : 56, left: IS_SMALL ? 12 : 20,
    width: IS_SMALL ? 34 : 40, height: IS_SMALL ? 34 : 40, borderRadius: 12,
    backgroundColor: '#00000070', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFFFFF30',
  },
  heroInfo: { position: 'absolute', bottom: IS_SMALL ? 12 : 20, left: IS_SMALL ? 12 : 20, right: IS_SMALL ? 12 : 20 },
  catBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  catBadgeText: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '700', color: '#FFFFFF' },
  heroName: { fontSize: IS_SMALL ? 24 : 32, fontWeight: '900', color: '#FFFFFF' },
  quickStats: {
    flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: IS_SMALL ? 12 : 20,
    borderRadius: 20, padding: IS_SMALL ? 12 : 16, gap: 0,
    borderWidth: 1, borderColor: C.border, marginTop: 16,
  },
  quickStatItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickStatIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickStatVal: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '800', color: C.text, textAlign: 'center' },
  quickStatLabel: { fontSize: 10, color: C.textMuted },
  musclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: IS_SMALL ? 12 : 20, marginTop: 16 },
  muscleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  muscleBadgeText: { fontSize: 12, fontWeight: '600' },
  description: {
    fontSize: 14, color: C.textSub, lineHeight: 22,
    paddingHorizontal: IS_SMALL ? 12 : 20, marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: IS_SMALL ? 12 : 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  setsCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.textSub, marginBottom: 14 },
  setsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  levelPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontSize: 13, fontWeight: '700' },
  setsVal: { fontSize: 15, fontWeight: '800', color: C.text },
  angleCard: {
    backgroundColor: C.surface2, borderRadius: 18, padding: 16,
    marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  angleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  angleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  angleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand },
  angleJoint: { flex: 1, fontSize: 13, color: C.textSub, fontWeight: '600' },
  angleValBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  angleVal: { fontSize: 13, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 14,
    backgroundColor: C.surface, borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: C.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C.surface2 },
  tabBtnText: { fontSize: IS_SMALL ? 10 : 11, fontWeight: '700', color: C.textMuted },
  stepItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.surface, borderRadius: 14, padding: 12,
    marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  stepNum: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  stepNumText: { fontSize: 14, fontWeight: '900' },
  stepText: { flex: 1, color: C.textSub, fontSize: IS_SMALL ? 12 : 14, lineHeight: 20 },
  mistakeItem: {
    backgroundColor: '#1A0A0A', borderRadius: 14, padding: 14,
    marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 8,
    borderWidth: 1, borderColor: C.red + '30',
  },
  tipItem: {
    backgroundColor: '#0A1A10', borderRadius: 14, padding: 14,
    marginHorizontal: IS_SMALL ? 12 : 20, marginBottom: 8,
    borderWidth: 1, borderColor: C.green + '30',
  },
  listItemText: { color: C.textSub, fontSize: 14, lineHeight: 21 },
  startBtn: {
    borderRadius: 18, overflow: 'hidden',
    marginHorizontal: IS_SMALL ? 12 : 20, marginTop: 20,
  },
  startBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  startBtnText: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '800', color: '#FFFFFF' },
});



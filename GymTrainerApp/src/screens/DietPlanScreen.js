import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Dimensions, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;
const TODAY_KEY = `dietLog_${new Date().toDateString()}`;
const CHECKIN_KEY = `bodyCheckin_${new Date().toDateString()}`;

// ── Common foods database ────────────────────────────────────────────────────
const FOOD_DB = [
  // Grains / Carbs
  { name: 'White Rice (1 cup cooked)', kcal: 206, p: 4, c: 45, f: 0, cat: '🍚 Grains', icon: '🍚' },
  { name: 'Brown Rice (1 cup cooked)', kcal: 215, p: 5, c: 45, f: 2, cat: '🍚 Grains', icon: '🍚' },
  { name: 'Roti / Chapati (1 piece)', kcal: 120, p: 3, c: 24, f: 2, cat: '🍚 Grains', icon: '🫓' },
  { name: 'Paratha (1 piece)', kcal: 200, p: 4, c: 28, f: 9, cat: '🍚 Grains', icon: '🫓' },
  { name: 'Oatmeal (1 cup)', kcal: 154, p: 6, c: 28, f: 3, cat: '🍚 Grains', icon: '🥣' },
  { name: 'Bread (1 slice)', kcal: 79, p: 3, c: 15, f: 1, cat: '🍚 Grains', icon: '🍞' },
  // Proteins
  { name: 'Chicken Breast (100g)', kcal: 165, p: 31, c: 0, f: 4, cat: '🥩 Protein', icon: '🍗' },
  { name: 'Chicken Curry (1 serving)', kcal: 280, p: 30, c: 8, f: 14, cat: '🥩 Protein', icon: '🍗' },
  { name: 'Boiled Egg (1 whole)', kcal: 78, p: 6, c: 1, f: 5, cat: '🥩 Protein', icon: '🥚' },
  { name: 'Egg Omelette (2 eggs)', kcal: 190, p: 14, c: 2, f: 14, cat: '🥩 Protein', icon: '🥚' },
  { name: 'Daal (1 cup)', kcal: 230, p: 18, c: 40, f: 1, cat: '🥩 Protein', icon: '🍲' },
  { name: 'Fish (100g grilled)', kcal: 136, p: 26, c: 0, f: 3, cat: '🥩 Protein', icon: '🐟' },
  { name: 'Mutton Curry (1 serving)', kcal: 320, p: 28, c: 5, f: 20, cat: '🥩 Protein', icon: '🍖' },
  { name: 'Beef Keema (100g)', kcal: 215, p: 26, c: 3, f: 11, cat: '🥩 Protein', icon: '🍖' },
  { name: 'Whey Protein Shake', kcal: 120, p: 25, c: 5, f: 2, cat: '🥩 Protein', icon: '💪' },
  // Dairy
  { name: 'Milk (1 glass 250ml)', kcal: 149, p: 8, c: 12, f: 8, cat: '🥛 Dairy', icon: '🥛' },
  { name: 'Greek Yogurt (1 cup)', kcal: 100, p: 17, c: 6, f: 1, cat: '🥛 Dairy', icon: '🥛' },
  { name: 'Lassi (1 glass)', kcal: 180, p: 7, c: 26, f: 5, cat: '🥛 Dairy', icon: '🥛' },
  { name: 'Cheese (1 slice 28g)', kcal: 113, p: 7, c: 0, f: 9, cat: '🥛 Dairy', icon: '🧀' },
  // Fruits
  { name: 'Banana (1 medium)', kcal: 105, p: 1, c: 27, f: 0, cat: '🍎 Fruits', icon: '🍌' },
  { name: 'Apple (1 medium)', kcal: 95, p: 0, c: 25, f: 0, cat: '🍎 Fruits', icon: '🍎' },
  { name: 'Mango (1 cup)', kcal: 107, p: 1, c: 28, f: 0, cat: '🍎 Fruits', icon: '🥭' },
  { name: 'Orange (1 medium)', kcal: 62, p: 1, c: 15, f: 0, cat: '🍎 Fruits', icon: '🍊' },
  // Veggies
  { name: 'Mixed Salad (1 bowl)', kcal: 45, p: 2, c: 8, f: 1, cat: '🥗 Veggies', icon: '🥗' },
  { name: 'Sabzi / Vegetable Curry', kcal: 120, p: 3, c: 18, f: 4, cat: '🥗 Veggies', icon: '🥦' },
  // Snacks
  { name: 'Mixed Nuts (30g)', kcal: 170, p: 5, c: 6, f: 15, cat: '🍿 Snacks', icon: '🥜' },
  { name: 'Samosa (1 piece)', kcal: 262, p: 5, c: 26, f: 16, cat: '🍿 Snacks', icon: '🥟' },
  { name: 'Biryani (1 plate)', kcal: 450, p: 22, c: 55, f: 14, cat: '🍿 Snacks', icon: '🍛' },
  // Drinks
  { name: 'Chai with Milk (1 cup)', kcal: 55, p: 2, c: 8, f: 2, cat: '☕ Drinks', icon: '🍵' },
  { name: 'Juice (1 glass)', kcal: 110, p: 1, c: 26, f: 0, cat: '☕ Drinks', icon: '🧃' },
  { name: 'Water (1 glass)', kcal: 0, p: 0, c: 0, f: 0, cat: '☕ Drinks', icon: '💧' },
];

const FOOD_CATS = ['All', '🍚 Grains', '🥩 Protein', '🥛 Dairy', '🍎 Fruits', '🥗 Veggies', '🍿 Snacks', '☕ Drinks'];

const TARGETS = { kcal: 2200, p: 150, c: 250, f: 60 };

// ── Meal plan for display ────────────────────────────────────────────────────
const PLAN_MEALS = [
  {
    id: 'breakfast', label: 'Breakfast', time: '7:00 AM', icon: '🌅', kcal: 620,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
    color: C.gold, tag: 'HIGH PROTEIN',
    items: [
      { name: 'Oatmeal with Berries', kcal: 280, p: 10, c: 50, f: 6 },
      { name: 'Scrambled Eggs (3 whole)', kcal: 220, p: 18, c: 2, f: 15 },
      { name: 'Whole Milk (1 glass)', kcal: 120, p: 8, c: 12, f: 5 },
    ],
  },
  {
    id: 'snack1', label: 'Pre-Workout', time: '10:30 AM', icon: '⚡', kcal: 280,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
    color: C.brand, tag: 'ENERGY',
    items: [
      { name: 'Banana (2 medium)', kcal: 180, p: 2, c: 46, f: 1 },
      { name: 'Almond Butter (1 tbsp)', kcal: 100, p: 3, c: 3, f: 9 },
    ],
  },
  {
    id: 'lunch', label: 'Lunch', time: '1:00 PM', icon: '🍛', kcal: 720,
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80',
    color: C.teal, tag: 'BALANCED',
    items: [
      { name: 'Grilled Chicken (200g)', kcal: 330, p: 62, c: 0, f: 7 },
      { name: 'Brown Rice (1.5 cups)', kcal: 320, p: 7, c: 66, f: 3 },
      { name: 'Mixed Vegetables', kcal: 70, p: 3, c: 14, f: 1 },
    ],
  },
  {
    id: 'postworkout', label: 'Post-Workout', time: '4:30 PM', icon: '💪', kcal: 350,
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80',
    color: C.lime, tag: 'RECOVERY',
    items: [
      { name: 'Whey Protein Shake', kcal: 150, p: 28, c: 8, f: 3 },
      { name: 'Greek Yogurt (1 cup)', kcal: 100, p: 17, c: 6, f: 1 },
      { name: 'Mixed Nuts (30g)', kcal: 100, p: 3, c: 4, f: 9 },
    ],
  },
  {
    id: 'dinner', label: 'Dinner', time: '7:30 PM', icon: '🌙', kcal: 580,
    image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80',
    color: C.blue, tag: 'NIGHTTIME',
    items: [
      { name: 'Salmon Fillet (180g)', kcal: 280, p: 38, c: 0, f: 14 },
      { name: 'Sweet Potato (1 medium)', kcal: 180, p: 3, c: 41, f: 0 },
      { name: 'Steamed Broccoli', kcal: 120, p: 8, c: 20, f: 1 },
    ],
  },
];

// ── Add Food Modal ───────────────────────────────────────────────────────────
function AddFoodModal({ visible, onClose, onAdd }) {
  const [tab, setTab] = useState('quick'); // 'quick' | 'custom'
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');
  const [meal, setMeal] = useState('Lunch');

  const filtered = FOOD_DB.filter(f =>
    (cat === 'All' || f.cat === cat) &&
    (search === '' || f.name.toLowerCase().includes(search.toLowerCase()))
  );

  const addQuick = (food) => {
    onAdd({ ...food, meal, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    onClose();
  };

  const addCustom = () => {
    if (!customName || !customKcal) { Alert.alert('Required', 'Please enter food name and calories.'); return; }
    onAdd({
      name: customName, icon: '🍽️',
      kcal: parseInt(customKcal) || 0,
      p: parseInt(customP) || 0,
      c: parseInt(customC) || 0,
      f: parseInt(customF) || 0,
      meal, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setCustomName(''); setCustomKcal(''); setCustomP(''); setCustomC(''); setCustomF('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            {/* Handle bar */}
            <View style={m.handle} />
            <View style={m.sheetHeader}>
              <Text style={m.sheetTitle}>Log Food</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Meal selector */}
            <View style={m.mealRow}>
              <Text style={m.mealRowLabel}>Add to:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['Breakfast', 'Snack', 'Lunch', 'Dinner', 'Other'].map(ml => (
                  <TouchableOpacity
                    key={ml}
                    style={[m.mealChip, meal === ml && m.mealChipActive]}
                    onPress={() => setMeal(ml)}
                  >
                    <Text style={[m.mealChipText, meal === ml && { color: C.brand, fontWeight: '800' }]}>{ml}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab toggle */}
            <View style={m.tabRow}>
              {[{ id: 'quick', label: '⚡ Quick Add' }, { id: 'custom', label: '✏️ Custom Entry' }].map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[m.tab, tab === t.id && m.tabActive]}
                  onPress={() => setTab(t.id)}
                >
                  <Text style={[m.tabText, tab === t.id && m.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'quick' ? (
              <>
                {/* Search */}
                <View style={m.searchWrap}>
                  <Ionicons name="search" size={16} color={C.textMuted} />
                  <TextInput
                    style={m.searchInput}
                    placeholder="Search food (e.g. roti, chicken, rice...)"
                    placeholderTextColor={C.textDim}
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color={C.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.catScroll}>
                  {FOOD_CATS.map(c => (
                    <TouchableOpacity key={c} style={[m.catChip, cat === c && m.catChipActive]} onPress={() => setCat(c)}>
                      <Text style={[m.catChipText, cat === c && m.catChipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Food list */}
                <ScrollView style={m.foodList} showsVerticalScrollIndicator={false}>
                  {filtered.map((food, i) => (
                    <TouchableOpacity key={i} style={m.foodRow} onPress={() => addQuick(food)}>
                      <Text style={m.foodIcon}>{food.icon}</Text>
                      <View style={m.foodInfo}>
                        <Text style={m.foodName}>{food.name}</Text>
                        <View style={m.foodMacros}>
                          <Text style={[m.macroChip, { color: C.blue }]}>P: {food.p}g</Text>
                          <Text style={[m.macroChip, { color: C.gold }]}>C: {food.c}g</Text>
                          <Text style={[m.macroChip, { color: C.brand }]}>F: {food.f}g</Text>
                        </View>
                      </View>
                      <View style={m.foodKcal}>
                        <Text style={m.foodKcalVal}>{food.kcal}</Text>
                        <Text style={m.foodKcalUnit}>kcal</Text>
                      </View>
                      <Ionicons name="add-circle" size={22} color={C.brand} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              /* Custom entry */
              <ScrollView>
                <View style={m.customForm}>
                  <View style={m.customField}>
                    <Text style={m.customLabel}>Food Name *</Text>
                    <TextInput
                      style={m.customInput}
                      placeholder="e.g. Chicken Karahi"
                      placeholderTextColor={C.textDim}
                      value={customName}
                      onChangeText={setCustomName}
                    />
                  </View>
                  <View style={m.customRow}>
                    <View style={[m.customField, { flex: 1 }]}>
                      <Text style={m.customLabel}>Calories *</Text>
                      <TextInput style={m.customInput} placeholder="e.g. 350" placeholderTextColor={C.textDim} value={customKcal} onChangeText={setCustomKcal} keyboardType="numeric" />
                    </View>
                    <View style={[m.customField, { flex: 1 }]}>
                      <Text style={m.customLabel}>Protein (g)</Text>
                      <TextInput style={m.customInput} placeholder="0" placeholderTextColor={C.textDim} value={customP} onChangeText={setCustomP} keyboardType="numeric" />
                    </View>
                  </View>
                  <View style={m.customRow}>
                    <View style={[m.customField, { flex: 1 }]}>
                      <Text style={m.customLabel}>Carbs (g)</Text>
                      <TextInput style={m.customInput} placeholder="0" placeholderTextColor={C.textDim} value={customC} onChangeText={setCustomC} keyboardType="numeric" />
                    </View>
                    <View style={[m.customField, { flex: 1 }]}>
                      <Text style={m.customLabel}>Fats (g)</Text>
                      <TextInput style={m.customInput} placeholder="0" placeholderTextColor={C.textDim} value={customF} onChangeText={setCustomF} keyboardType="numeric" />
                    </View>
                  </View>
                  <TouchableOpacity style={m.addCustomBtn} onPress={addCustom}>
                    <LinearGradient colors={[C.brand, C.brandDark]} style={m.addCustomBtnGrad}>
                      <Ionicons name="add" size={18} color="#FFF" />
                      <Text style={m.addCustomBtnText}>Add to Log</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', paddingTop: 12, borderWidth: 1, borderBottomWidth: 0, borderColor: C.border,
  },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  mealRowLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  mealChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
  },
  mealChipActive: { backgroundColor: C.brand + '18', borderColor: C.brand + '40' },
  mealChipText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  tabTextActive: { color: '#FFF', fontWeight: '900' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bg, borderRadius: 12, marginHorizontal: 16,
    paddingHorizontal: 12, height: 44, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  catScroll: { paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  catChipActive: { backgroundColor: C.brand + '18', borderColor: C.brand + '40' },
  catChipText: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  catChipTextActive: { color: C.brand, fontWeight: '800' },
  foodList: { maxHeight: 320, paddingHorizontal: 16 },
  foodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border,
  },
  foodIcon: { fontSize: 22, width: 30 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  foodMacros: { flexDirection: 'row', gap: 8 },
  macroChip: { fontSize: 10, fontWeight: '700' },
  foodKcal: { alignItems: 'center', marginRight: 4 },
  foodKcalVal: { fontSize: 15, fontWeight: '900', color: C.text },
  foodKcalUnit: { fontSize: 9, color: C.textMuted },
  customForm: { padding: 16, gap: 14 },
  customField: { gap: 5 },
  customLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted },
  customInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    height: 46, paddingHorizontal: 14, color: C.text, fontSize: 14,
  },
  customRow: { flexDirection: 'row', gap: 12 },
  addCustomBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 6 },
  addCustomBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  addCustomBtnText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});

// ── Body Check-In Modal ──────────────────────────────────────────────────────
function BodyCheckInModal({ visible, onClose, onSave, existing }) {
  const [energy, setEnergy] = useState(existing?.energy || 3);
  const [mood, setMood] = useState(existing?.mood || 3);
  const [sleep, setSleep] = useState(existing?.sleep || 7);
  const [weight, setWeight] = useState(existing?.weight || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const save = () => {
    onSave({ energy, mood, sleep, weight, notes, time: new Date().toISOString() });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={ci.overlay}>
          <View style={ci.sheet}>
            <View style={ci.handle} />
            <View style={ci.header}>
              <Text style={ci.title}>📊 Daily Body Check-In</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Energy Level */}
              <View style={ci.section}>
                <Text style={ci.sectionTitle}>⚡ Energy Level</Text>
                <View style={ci.ratingRow}>
                  {[1,2,3,4,5].map(v => (
                    <TouchableOpacity key={v} style={[ci.ratingBtn, energy === v && ci.ratingBtnActive]} onPress={() => setEnergy(v)}>
                      <Text style={ci.ratingEmoji}>{['😴','😐','🙂','😀','🔥'][v-1]}</Text>
                      <Text style={[ci.ratingLabel, energy === v && { color: C.brand, fontWeight: '800' }]}>{['Low','Fair','Good','High','Max'][v-1]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Mood */}
              <View style={ci.section}>
                <Text style={ci.sectionTitle}>😊 Mood Today</Text>
                <View style={ci.ratingRow}>
                  {[1,2,3,4,5].map(v => (
                    <TouchableOpacity key={v} style={[ci.ratingBtn, mood === v && ci.ratingBtnActive]} onPress={() => setMood(v)}>
                      <Text style={ci.ratingEmoji}>{['😢','😕','😐','🙂','😄'][v-1]}</Text>
                      <Text style={[ci.ratingLabel, mood === v && { color: C.teal, fontWeight: '800' }]}>{['Bad','Poor','Okay','Good','Great'][v-1]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Sleep + Weight row */}
              <View style={[ci.section, { flexDirection: 'row', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={ci.sectionTitle}>🛌 Sleep (hours)</Text>
                  <View style={ci.numberRow}>
                    <TouchableOpacity style={ci.numBtn} onPress={() => setSleep(s => Math.max(0, s - 0.5))}>
                      <Ionicons name="remove" size={18} color={C.text} />
                    </TouchableOpacity>
                    <Text style={ci.numVal}>{sleep}h</Text>
                    <TouchableOpacity style={ci.numBtn} onPress={() => setSleep(s => Math.min(12, s + 0.5))}>
                      <Ionicons name="add" size={18} color={C.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ci.sectionTitle}>⚖️ Weight (kg)</Text>
                  <View style={ci.inputWrap}>
                    <TextInput
                      style={ci.input}
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="e.g. 75.5"
                      placeholderTextColor={C.textDim}
                      keyboardType="numeric"
                    />
                    <Text style={ci.inputUnit}>kg</Text>
                  </View>
                </View>
              </View>
              {/* Notes */}
              <View style={ci.section}>
                <Text style={ci.sectionTitle}>📝 How do you feel today?</Text>
                <TextInput
                  style={ci.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any pain, soreness, stress... (optional)"
                  placeholderTextColor={C.textDim}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity style={ci.saveBtn} onPress={save}>
                <LinearGradient colors={[C.teal, C.blue]} style={ci.saveBtnGrad}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={ci.saveBtnText}>Save Today's Check-In</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ci = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '85%', paddingTop: 12, borderWidth: 1, borderBottomWidth: 0, borderColor: C.border,
  },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '900', color: C.text },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', gap: 6 },
  ratingBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, gap: 4,
  },
  ratingBtnActive: { backgroundColor: C.brand + '18', borderColor: C.brand + '50' },
  ratingEmoji: { fontSize: 22 },
  ratingLabel: { fontSize: 9, fontWeight: '600', color: C.textMuted },
  numberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface2, borderRadius: 12, padding: 8,
    borderWidth: 1, borderColor: C.border,
  },
  numBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  numVal: { fontSize: 18, fontWeight: '900', color: C.text },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, height: 48, paddingHorizontal: 12,
  },
  input: { flex: 1, color: C.text, fontSize: 16, fontWeight: '700' },
  inputUnit: { fontSize: 12, color: C.textMuted, fontWeight: '700' },
  notesInput: {
    backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 12, color: C.text, fontSize: 13, textAlignVertical: 'top', minHeight: 80,
  },
  saveBtn: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function DietPlanScreen({ navigation }) {
  const [foodLog, setFoodLog] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [water, setWater] = useState(0);
  const [checkIn, setCheckIn] = useState(null);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [activeView, setActiveView] = useState('log'); // 'log' | 'plan'
  const tipAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadAll();
    Animated.loop(
      Animated.sequence([
        Animated.timing(tipAnim, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
        Animated.timing(tipAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadAll = async () => {
    try {
      const log = await AsyncStorage.getItem(TODAY_KEY);
      const ci = await AsyncStorage.getItem(CHECKIN_KEY);
      const prefs = await AsyncStorage.getItem('dietPrefs');
      if (log) setFoodLog(JSON.parse(log));
      if (ci) setCheckIn(JSON.parse(ci));
      if (prefs) { const p = JSON.parse(prefs); setCompleted(p.completed || []); setWater(p.water || 0); }
    } catch (_) {}
  };

  const saveLog = async (newLog) => {
    await AsyncStorage.setItem(TODAY_KEY, JSON.stringify(newLog));
  };

  const addFood = async (food) => {
    const newLog = [...foodLog, { ...food, id: Date.now() }];
    setFoodLog(newLog);
    saveLog(newLog);
  };

  const removeFood = (id) => {
    Alert.alert('Remove', 'Remove this food entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const newLog = foodLog.filter(f => f.id !== id);
        setFoodLog(newLog);
        saveLog(newLog);
      }},
    ]);
  };

  const saveCheckIn = async (data) => {
    setCheckIn(data);
    await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(data));
  };

  const toggleMeal = async (id) => {
    const next = completed.includes(id) ? completed.filter(x => x !== id) : [...completed, id];
    setCompleted(next);
    await AsyncStorage.setItem('dietPrefs', JSON.stringify({ completed: next, water }));
  };

  const addWater = async () => {
    const next = Math.min(water + 1, 12);
    setWater(next);
    await AsyncStorage.setItem('dietPrefs', JSON.stringify({ completed, water: next }));
  };

  const removeWater = async () => {
    const next = Math.max(water - 1, 0);
    setWater(next);
    await AsyncStorage.setItem('dietPrefs', JSON.stringify({ completed, water: next }));
  };

  // ── Totals from food log ─────────────────────────────────────────────────
  const logTotals = foodLog.reduce((acc, f) => ({
    kcal: acc.kcal + (f.kcal || 0),
    p: acc.p + (f.p || 0),
    c: acc.c + (f.c || 0),
    f: acc.f + (f.f || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 });

  const calPct = Math.min(logTotals.kcal / TARGETS.kcal, 1);
  const remaining = Math.max(TARGETS.kcal - logTotals.kcal, 0);

  const ENERGY_EMOJIS = ['😴', '😐', '🙂', '😀', '🔥'];
  const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😄'];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <AddFoodModal visible={showAddFood} onClose={() => setShowAddFood(false)} onAdd={addFood} />
      <BodyCheckInModal visible={showCheckIn} onClose={() => setShowCheckIn(false)} onSave={saveCheckIn} existing={checkIn} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>{new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}</Text>
            <Text style={s.title}>Nutrition Log</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[s.headerBtn, { borderColor: C.teal + '40', backgroundColor: C.teal + '12' }]} onPress={() => setShowCheckIn(true)}>
              <Ionicons name="body" size={16} color={C.teal} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.headerBtn, { borderColor: C.brand + '40', backgroundColor: C.brand + '12' }]} onPress={() => setShowAddFood(true)}>
              <Ionicons name="add" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BODY CHECK-IN CARD ── */}
        {checkIn ? (
          <TouchableOpacity style={s.checkInCard} onPress={() => setShowCheckIn(true)}>
            <View style={s.checkInLeft}>
              <Text style={s.checkInLabel}>Today's Body Status</Text>
              <View style={s.checkInRow}>
                <View style={s.checkInItem}>
                  <Text style={s.checkInEmoji}>{ENERGY_EMOJIS[(checkIn.energy || 3) - 1]}</Text>
                  <Text style={s.checkInSub}>Energy</Text>
                </View>
                <View style={s.checkInItem}>
                  <Text style={s.checkInEmoji}>{MOOD_EMOJIS[(checkIn.mood || 3) - 1]}</Text>
                  <Text style={s.checkInSub}>Mood</Text>
                </View>
                <View style={s.checkInItem}>
                  <Text style={s.checkInEmoji}>🛌</Text>
                  <Text style={s.checkInSub}>{checkIn.sleep}h sleep</Text>
                </View>
                {checkIn.weight ? (
                  <View style={s.checkInItem}>
                    <Text style={s.checkInEmoji}>⚖️</Text>
                    <Text style={s.checkInSub}>{checkIn.weight} kg</Text>
                  </View>
                ) : null}
              </View>
              {checkIn.notes ? <Text style={s.checkInNotes} numberOfLines={1}>💬 {checkIn.notes}</Text> : null}
            </View>
            <Ionicons name="create-outline" size={16} color={C.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.checkInPrompt} onPress={() => setShowCheckIn(true)}>
            <Ionicons name="body" size={20} color={C.teal} />
            <View style={{ flex: 1 }}>
              <Text style={s.checkInPromptTitle}>How's your body today?</Text>
              <Text style={s.checkInPromptSub}>Log energy, mood, sleep & weight</Text>
            </View>
            <View style={[s.checkInPromptBtn, { backgroundColor: C.teal }]}>
              <Text style={s.checkInPromptBtnText}>Check In</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── CALORIE RING SUMMARY ── */}
        <View style={s.calSummaryCard}>
          <View style={s.calRingWrap}>
            {/* Ring simulation */}
            <View style={[s.calRingOuter, { borderColor: C.surface2 }]}>
              <View style={[s.calRingFill, {
                borderColor: calPct > 0.9 ? C.red : calPct > 0.6 ? C.gold : C.teal,
                borderTopColor: 'transparent',
                transform: [{ rotate: `${-90 + calPct * 360}deg` }],
              }]} />
              <View style={s.calRingCenter}>
                <Text style={s.calRingVal}>{logTotals.kcal}</Text>
                <Text style={s.calRingLabel}>eaten</Text>
              </View>
            </View>
          </View>
          <View style={s.calSummaryRight}>
            <View style={s.calSumRow}>
              <View style={[s.calSumDot, { backgroundColor: calPct > 0.9 ? C.red : C.teal }]} />
              <Text style={s.calSumLabel}>Consumed</Text>
              <Text style={[s.calSumVal, { color: calPct > 0.9 ? C.red : C.teal }]}>{logTotals.kcal} kcal</Text>
            </View>
            <View style={s.calSumRow}>
              <View style={[s.calSumDot, { backgroundColor: C.textDim }]} />
              <Text style={s.calSumLabel}>Target</Text>
              <Text style={s.calSumVal}>{TARGETS.kcal} kcal</Text>
            </View>
            <View style={s.calSumRow}>
              <View style={[s.calSumDot, { backgroundColor: remaining > 0 ? C.lime : C.red }]} />
              <Text style={s.calSumLabel}>{remaining > 0 ? 'Remaining' : 'Over by'}</Text>
              <Text style={[s.calSumVal, { color: remaining > 0 ? C.lime : C.red }]}>{Math.abs(remaining)} kcal</Text>
            </View>
            <View style={s.calBar}>
              <LinearGradient
                colors={calPct > 0.9 ? [C.red, C.gold] : [C.teal, C.lime]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.calBarFill, { width: `${Math.min(calPct * 100, 100)}%` }]}
              />
            </View>
          </View>
        </View>

        {/* ── MACRO SUMMARY ── */}
        <View style={s.macroRow}>
          {[
            { label: 'Protein', val: logTotals.p, target: TARGETS.p, unit: 'g', color: C.blue, icon: '💪' },
            { label: 'Carbs', val: logTotals.c, target: TARGETS.c, unit: 'g', color: C.gold, icon: '⚡' },
            { label: 'Fats', val: logTotals.f, target: TARGETS.f, unit: 'g', color: C.brand, icon: '🥑' },
          ].map((macro, i) => (
            <View key={i} style={s.macroCard}>
              <Text style={s.macroCardIcon}>{macro.icon}</Text>
              <Text style={[s.macroCardVal, { color: macro.color }]}>{macro.val}<Text style={s.macroUnit}>g</Text></Text>
              <Text style={s.macroCardLabel}>{macro.label}</Text>
              <View style={s.macroTrack}>
                <View style={[s.macroFill, { width: `${Math.min((macro.val / macro.target) * 100, 100)}%`, backgroundColor: macro.color }]} />
              </View>
              <Text style={s.macroTarget}>{macro.val}/{macro.target}g</Text>
            </View>
          ))}
        </View>

        {/* ── WATER ── */}
        <View style={s.waterCard}>
          <View style={s.waterHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Animated.Text style={[{ fontSize: 20 }, { opacity: tipAnim }]}>💧</Animated.Text>
              <Text style={s.waterTitle}>Hydration</Text>
            </View>
            <View style={s.waterControls}>
              <TouchableOpacity onPress={removeWater} style={s.waterBtn}>
                <Ionicons name="remove" size={16} color={C.textMuted} />
              </TouchableOpacity>
              <Text style={s.waterCount}>{water} <Text style={s.waterUnit}>/ 8 glasses</Text></Text>
              <TouchableOpacity onPress={addWater} style={[s.waterBtn, { backgroundColor: C.blue + '20', borderColor: C.blue + '40' }]}>
                <Ionicons name="add" size={16} color={C.blue} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.waterGlasses}>
            {[...Array(8)].map((_, i) => (
              <TouchableOpacity key={i} onPress={() => { setWater(i + 1); AsyncStorage.setItem('dietPrefs', JSON.stringify({ completed, water: i + 1 })); }}>
                <View style={[s.glass, i < water && s.glassFull]}>
                  <Ionicons name={i < water ? 'water' : 'water-outline'} size={18} color={i < water ? '#FFFFFF' : C.textDim} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── VIEW TOGGLE ── */}
        <View style={s.viewToggle}>
          {[{ id: 'log', label: '📋 My Log', sub: `${foodLog.length} items` }, { id: 'plan', label: '🥗 Meal Plan', sub: 'Suggested' }].map(v => (
            <TouchableOpacity key={v.id} style={[s.viewBtn, activeView === v.id && s.viewBtnActive]} onPress={() => setActiveView(v.id)}>
              <Text style={[s.viewBtnLabel, activeView === v.id && s.viewBtnLabelActive]}>{v.label}</Text>
              <Text style={s.viewBtnSub}>{v.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeView === 'log' ? (
          /* ── TODAY'S FOOD LOG ── */
          <>
            {foodLog.length === 0 ? (
              <View style={s.emptyLog}>
                <Text style={s.emptyEmoji}>🍽️</Text>
                <Text style={s.emptyTitle}>No food logged yet</Text>
                <Text style={s.emptySub}>Tap the + button to log your first meal of the day</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAddFood(true)}>
                  <LinearGradient colors={[C.brand, C.brandDark]} style={s.emptyBtnGrad}>
                    <Ionicons name="add" size={16} color="#FFF" />
                    <Text style={s.emptyBtnText}>Log First Meal</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.logList}>
                {/* Group by meal */}
                {['Breakfast', 'Snack', 'Lunch', 'Dinner', 'Other'].map(mealGroup => {
                  const items = foodLog.filter(f => f.meal === mealGroup);
                  if (items.length === 0) return null;
                  const groupKcal = items.reduce((a, f) => a + f.kcal, 0);
                  return (
                    <View key={mealGroup} style={s.logGroup}>
                      <View style={s.logGroupHeader}>
                        <Text style={s.logGroupTitle}>
                          {mealGroup === 'Breakfast' ? '🌅' : mealGroup === 'Lunch' ? '🍛' : mealGroup === 'Dinner' ? '🌙' : mealGroup === 'Snack' ? '🍌' : '🍽️'} {mealGroup}
                        </Text>
                        <Text style={s.logGroupKcal}>{groupKcal} kcal</Text>
                      </View>
                      {items.map((food) => (
                        <View key={food.id} style={s.logItem}>
                          <Text style={s.logItemIcon}>{food.icon || '🍽️'}</Text>
                          <View style={s.logItemInfo}>
                            <Text style={s.logItemName}>{food.name}</Text>
                            <View style={s.logItemMacros}>
                              <Text style={[s.logMacro, { color: C.blue }]}>P:{food.p}g</Text>
                              <Text style={[s.logMacro, { color: C.gold }]}>C:{food.c}g</Text>
                              <Text style={[s.logMacro, { color: C.brand }]}>F:{food.f}g</Text>
                              <Text style={s.logItemTime}>{food.time}</Text>
                            </View>
                          </View>
                          <Text style={s.logItemKcal}>{food.kcal} <Text style={s.logItemKcalUnit}>kcal</Text></Text>
                          <TouchableOpacity onPress={() => removeFood(food.id)}>
                            <Ionicons name="trash-outline" size={16} color={C.textDim} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  );
                })}
                {/* Daily total */}
                <View style={s.logTotal}>
                  <Text style={s.logTotalLabel}>Today's Total</Text>
                  <Text style={[s.logTotalVal, { color: calPct > 1 ? C.red : C.teal }]}>{logTotals.kcal} kcal</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={s.addMoreBtn} onPress={() => setShowAddFood(true)}>
              <Ionicons name="add-circle-outline" size={18} color={C.brand} />
              <Text style={s.addMoreBtnText}>Add More Food</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── SUGGESTED MEAL PLAN ── */
          <View style={s.planList}>
            {PLAN_MEALS.map((meal, idx) => {
              const isOpen = expandedMeal === meal.id;
              const isDone = completed.includes(meal.id);
              return (
                <View key={meal.id} style={[s.mealCard, isDone && { opacity: 0.8 }]}>
                  <TouchableOpacity style={s.mealHeader} onPress={() => setExpandedMeal(isOpen ? null : meal.id)} activeOpacity={0.85}>
                    <View style={s.mealImgWrap}>
                      <Image source={{ uri: meal.image }} style={s.mealImg} resizeMode="cover" />
                      <View style={[s.mealAccent, { backgroundColor: meal.color }]} />
                    </View>
                    <View style={s.mealMeta}>
                      <View style={[s.mealTag, { backgroundColor: meal.color + '20', borderColor: meal.color + '40' }]}>
                        <Text style={[s.mealTagText, { color: meal.color }]}>{meal.tag}</Text>
                      </View>
                      <Text style={s.mealLabel}>{meal.icon} {meal.label}</Text>
                      <View style={s.mealMetaRow}>
                        <Text style={s.mealTime}>{meal.time}</Text>
                        <Text style={[s.mealKcal, { color: meal.color }]}>{meal.kcal} kcal</Text>
                      </View>
                    </View>
                    <View style={s.mealRight}>
                      <TouchableOpacity
                        style={[s.checkBtn, isDone && { backgroundColor: C.lime + '20', borderColor: C.lime + '40' }]}
                        onPress={() => toggleMeal(meal.id)}
                      >
                        <Ionicons name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={isDone ? C.lime : C.textDim} />
                      </TouchableOpacity>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
                    </View>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={s.mealBody}>
                      <View style={s.mealDivider} />
                      {meal.items.map((item, i) => (
                        <View key={i} style={s.foodRow}>
                          <View style={[s.foodDot, { backgroundColor: meal.color }]} />
                          <Text style={s.foodName}>{item.name}</Text>
                          <Text style={s.foodCal}>{item.kcal} kcal</Text>
                        </View>
                      ))}
                      <TouchableOpacity style={s.logMealBtn} onPress={() => {
                        meal.items.forEach(item => addFood({ ...item, meal: meal.label, icon: meal.icon, time: meal.time }));
                        toggleMeal(meal.id);
                        setActiveView('log');
                      }}>
                        <Ionicons name="add-circle" size={14} color={C.teal} />
                        <Text style={s.logMealBtnText}>Log this entire meal</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── AI NUTRITION COACH ── */}
        <TouchableOpacity style={s.aiCard} onPress={() => navigation?.navigate('AIChat')} activeOpacity={0.9}>
          <LinearGradient colors={[C.teal + '20', C.blue + '10']} style={StyleSheet.absoluteFillObject} />
          <View style={s.aiCardLeft}>
            <View style={s.aiIcon}><Ionicons name="sparkles" size={18} color={C.teal} /></View>
            <View>
              <Text style={s.aiCardTitle}>AI Nutrition Coach</Text>
              <Text style={s.aiCardSub}>Ask about calories, macros, meal timing</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={C.teal} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={s.fab} onPress={() => setShowAddFood(true)} activeOpacity={0.85}>
        <LinearGradient colors={[C.brand, C.brandDark]} style={s.fabGrad}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : (IS_TABLET ? 24 : 16), paddingTop: IS_SMALL ? 10 : 14, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: C.teal, letterSpacing: 2, marginBottom: 3 },
  title: { fontSize: IS_SMALL ? 22 : 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },

  // Check-in
  checkInCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.teal + '40', marginBottom: 14, gap: 10,
  },
  checkInLeft: { flex: 1, gap: 6 },
  checkInLabel: { fontSize: 11, fontWeight: '700', color: C.teal, letterSpacing: 0.5 },
  checkInRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  checkInItem: { alignItems: 'center', gap: 2 },
  checkInEmoji: { fontSize: 22 },
  checkInSub: { fontSize: 9, color: C.textMuted, fontWeight: '600' },
  checkInNotes: { fontSize: 11, color: C.textMuted, fontStyle: 'italic' },
  checkInPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.teal + '40', marginBottom: 14,
    borderStyle: 'dashed',
  },
  checkInPromptTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  checkInPromptSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  checkInPromptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  checkInPromptBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  // Calorie Ring
  calSummaryCard: {
    flexDirection: IS_SMALL ? 'column' : 'row', alignItems: IS_SMALL ? 'flex-start' : 'center',
    backgroundColor: C.surface, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12, gap: 16,
  },
  calRingWrap: { justifyContent: 'center', alignItems: 'center' },
  calRingOuter: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 8,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  calRingFill: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    borderWidth: 8, borderColor: C.teal,
  },
  calRingCenter: { alignItems: 'center' },
  calRingVal: { fontSize: 18, fontWeight: '900', color: C.text },
  calRingLabel: { fontSize: 9, color: C.textMuted },
  calSummaryRight: { flex: 1, gap: 6 },
  calSumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calSumDot: { width: 8, height: 8, borderRadius: 4 },
  calSumLabel: { flex: 1, fontSize: 12, color: C.textSub, fontWeight: '600' },
  calSumVal: { fontSize: 13, fontWeight: '800', color: C.text },
  calBar: { height: 5, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  calBarFill: { height: '100%', borderRadius: 3 },

  // Macros
  macroRow: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 10, marginBottom: 12 },
  macroCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 4,
  },
  macroCardIcon: { fontSize: 18 },
  macroCardVal: { fontSize: 20, fontWeight: '900' },
  macroUnit: { fontSize: 11, color: C.textMuted },
  macroCardLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700' },
  macroTrack: { width: '100%', height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 2 },
  macroTarget: { fontSize: 9, color: C.textDim },

  // Water
  waterCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.blue + '30', marginBottom: 14, gap: 12,
  },
  waterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  waterControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterBtn: {
    width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
  },
  waterCount: { fontSize: 16, fontWeight: '900', color: C.blue },
  waterUnit: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  waterGlasses: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  glass: {
    flex: 1, minWidth: IS_SMALL ? '22%' : undefined, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.surface2, borderWidth: 1.5, borderColor: C.border,
  },
  glassFull: { backgroundColor: C.blue, borderColor: C.blue },

  // View Toggle
  viewToggle: {
    flexDirection: IS_SMALL ? 'column' : 'row', gap: 10, marginBottom: 14,
  },
  viewBtn: {
    flex: 1, padding: 14, borderRadius: 16,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 2,
  },
  viewBtnActive: { borderColor: C.brand + '50', backgroundColor: C.brand + '10' },
  viewBtnLabel: { fontSize: 13, fontWeight: '800', color: C.textMuted },
  viewBtnLabelActive: { color: C.brand },
  viewBtnSub: { fontSize: 10, color: C.textDim },

  // Food Log
  emptyLog: {
    alignItems: 'center', padding: 36, backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border, gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: IS_SMALL ? 15 : 17, fontWeight: '900', color: C.text },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 6, width: '80%' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF' },

  logList: { gap: 12 },
  logGroup: {
    backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  logGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.surface2,
  },
  logGroupTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  logGroupKcal: { fontSize: 12, fontWeight: '800', color: C.teal },
  logItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderColor: C.border,
  },
  logItemIcon: { fontSize: 20, width: 28 },
  logItemInfo: { flex: 1 },
  logItemName: { fontSize: 13, fontWeight: '700', color: C.text },
  logItemMacros: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  logMacro: { fontSize: 10, fontWeight: '700' },
  logItemTime: { fontSize: 10, color: C.textDim },
  logItemKcal: { fontSize: 15, fontWeight: '900', color: C.text },
  logItemKcalUnit: { fontSize: 10, color: C.textMuted, fontWeight: '600' },

  logTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.teal + '40',
  },
  logTotalLabel: { fontSize: 14, fontWeight: '800', color: C.text },
  logTotalVal: { fontSize: 20, fontWeight: '900' },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, backgroundColor: C.brand + '10',
    borderRadius: 14, borderWidth: 1, borderColor: C.brand + '30', marginTop: 10,
  },
  addMoreBtnText: { fontSize: 14, fontWeight: '700', color: C.brand },

  // Plan meals
  planList: { gap: 10 },
  mealCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', padding: IS_SMALL ? 10 : 12, gap: IS_SMALL ? 8 : 12 },
  mealImgWrap: { width: IS_SMALL ? 48 : 56, height: IS_SMALL ? 48 : 56, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  mealImg: { width: '100%', height: '100%' },
  mealAccent: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%' },
  mealMeta: { flex: 1, gap: 3 },
  mealTag: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  mealTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  mealLabel: { fontSize: IS_SMALL ? 12 : 14, fontWeight: '800', color: C.text },
  mealMetaRow: { flexDirection: 'row', gap: 10 },
  mealTime: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  mealKcal: { fontSize: 11, fontWeight: '700' },
  mealRight: { alignItems: 'center', gap: 6 },
  checkBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  mealBody: { paddingHorizontal: 14, paddingBottom: 14 },
  mealDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  foodDot: { width: 6, height: 6, borderRadius: 3 },
  foodName: { flex: 1, fontSize: 13, color: C.textSub, fontWeight: '600' },
  foodCal: { fontSize: 13, fontWeight: '700', color: C.text },
  logMealBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.teal + '12', borderRadius: 10, borderWidth: 1, borderColor: C.teal + '30',
  },
  logMealBtnText: { fontSize: 12, fontWeight: '700', color: C.teal },

  // AI Card
  aiCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, marginTop: 14,
    borderWidth: 1, borderColor: C.teal + '30', overflow: 'hidden',
    backgroundColor: C.surface,
  },
  aiCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.teal + '20', justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  aiCardSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  fabGrad: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;

const MOTIVATIONAL_QUOTES = [
  { quote: 'Success belongs to those who never give up! 💪', author: 'Unknown' },
  { quote: 'Every workout is one step closer to your goal. Keep going!', author: 'Fitness Wisdom' },
  { quote: 'Those who work hard today see results tomorrow.', author: 'Unknown' },
  { quote: 'Consistency is the key — 30 min daily beats 1 hour gym randomly!', author: 'Trainer Tip' },
  { quote: 'Pain is temporary, achievement is permanent!', author: 'Gym Motivation' },
  { quote: 'Compete with yourself — not with others!', author: 'Fitness Mindset' },
  { quote: 'Rest days are part of your workout — muscles grow when you rest!', author: 'Science' },
];

const FITNESS_TIPS = [
  { icon: 'water', color: '#00B4D8', title: 'Hydration', tip: 'Drink water before, during and after exercise. Minimum 2–3 liters daily for optimal performance.' },
  { icon: 'bed', color: '#7B2FBE', title: 'Sleep Quality', tip: '7–9 hours of sleep is essential for muscle recovery. Growth hormone is released during deep sleep.' },
  { icon: 'nutrition', color: '#2ECC71', title: 'Pre-Workout Meal', tip: 'Eat carbs + protein 1–2 hours before exercise. Banana with peanut butter is ideal.' },
  { icon: 'flame', color: '#FF6B35', title: 'Warm-Up', tip: 'A 5–10 minute warm-up is critical to prevent injury. Cold muscles are prone to tears.' },
  { icon: 'body', color: '#FFD700', title: 'Form Over Weight', tip: 'Always prioritize form over heavy weight. Poor technique leads to injuries. Learn technique first.' },
  { icon: 'heart', color: '#FF4757', title: 'Recovery', tip: 'Muscle soreness is normal. Sharp pain is not. If you feel pain beyond normal soreness, see a doctor.' },
];

const REMINDER_SCHEDULE = [
  { id: 'morning', time: '7:00 AM', title: 'Morning Workout Reminder', desc: "Time to crush today's workout!", icon: 'sunny', color: '#FFD700' },
  { id: 'lunch', time: '1:00 PM', title: 'Lunch Meal Reminder', desc: "Don't skip your nutrition goals!", icon: 'restaurant', color: '#2ECC71' },
  { id: 'water', time: '3:00 PM', title: 'Drink Water', desc: 'Stay hydrated for peak performance!', icon: 'water', color: '#00B4D8' },
  { id: 'evening', time: '6:00 PM', title: 'Evening Exercise', desc: 'Evening workout time — let\'s go!', icon: 'moon', color: '#7B2FBE' },
  { id: 'sleep', time: '10:00 PM', title: 'Bedtime Reminder', desc: 'Rest is essential for muscle recovery!', icon: 'bed', color: '#FF6B35' },
];

export default function NotificationsScreen({ navigation }) {
  const [enabledReminders, setEnabledReminders] = useState({
    morning: true, lunch: true, water: true, evening: false, sleep: true,
  });
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [todayQuote] = useState(MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length]);
  const [expandedTip, setExpandedTip] = useState(null);
  const [reminderTime, setReminderTime] = useState('7:00 PM');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const r = await AsyncStorage.getItem('reminderSettings');
      if (r) setEnabledReminders(JSON.parse(r));
      const prefsRaw = await AsyncStorage.getItem('appPrefs');
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        setNotifEnabled(prefs.notifications !== false);
        if (prefs.reminderTime) setReminderTime(prefs.reminderTime);
      }
    } catch (e) {}
  };

  const toggleReminder = async (id) => {
    const updated = { ...enabledReminders, [id]: !enabledReminders[id] };
    setEnabledReminders(updated);
    await AsyncStorage.setItem('reminderSettings', JSON.stringify(updated));
  };

  const toggleAllNotifications = async (value) => {
    setNotifEnabled(value);
    try {
      const prefsRaw = await AsyncStorage.getItem('appPrefs');
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      await AsyncStorage.setItem('appPrefs', JSON.stringify({ ...prefs, notifications: value }));
    } catch (_) {}
  };

  const testNotification = (title) => {
    Alert.alert('🔔 Notification Set', `"${title}" reminder has been activated!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient colors={[C.bg, C.surface2]} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications & Tips</Text>
        <View />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Aaj ka Quote */}
        <LinearGradient colors={['#00FF8820', '#00FF8808']} style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.quoteHeaderText}>Today's Motivation</Text>
          </View>
          <Text style={styles.quoteText}>"{todayQuote.quote}"</Text>
          <Text style={styles.quoteAuthor}>— {todayQuote.author}</Text>
        </LinearGradient>

        {/* Master Toggle */}
        <View style={styles.masterToggle}>
          <View style={styles.masterLeft}>
            <Ionicons name="notifications" size={20} color="#00FF88" />
            <View>
              <Text style={styles.masterTitle}>All Notifications</Text>
            <Text style={styles.masterSub}>{notifEnabled ? `Enabled · ${reminderTime}` : 'Disabled'}</Text>
            </View>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={toggleAllNotifications}
            trackColor={{ false: C.surface2, true: C.brand + '60' }}
            thumbColor={notifEnabled ? C.brand : C.textDim}
          />
        </View>

        {/* Reminders */}
        <Text style={styles.sectionTitle}>Daily Reminders ⏰</Text>
        {REMINDER_SCHEDULE.map((r) => (
          <View key={r.id} style={styles.reminderCard}>
            <View style={[styles.reminderIcon, { backgroundColor: r.color + '20' }]}>
              <Ionicons name={r.icon} size={20} color={r.color} />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>{r.title}</Text>
              <Text style={styles.reminderTime}>{r.time} • {r.desc}</Text>
            </View>
            <View style={styles.reminderRight}>
              <Switch
                value={enabledReminders[r.id] && notifEnabled}
                onValueChange={() => toggleReminder(r.id)}
                trackColor={{ false: C.surface2, true: r.color + '60' }}
                thumbColor={enabledReminders[r.id] ? r.color : C.textDim}
                disabled={!notifEnabled}
              />
            </View>
          </View>
        ))}

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => testNotification('Morning Workout')}
        >
          <View style={styles.testBtnInner}>
            <Ionicons name="send" size={16} color="#00FF88" />
            <Text style={styles.testBtnText}>Send Test Notification</Text>
          </View>
        </TouchableOpacity>

        {/* Fitness Tips */}
        <Text style={styles.sectionTitle}>Fitness Tips 💡</Text>
        {FITNESS_TIPS.map((tip, i) => (
          <TouchableOpacity
            key={i}
            style={styles.tipCard}
            onPress={() => setExpandedTip(expandedTip === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.tipHeader}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color + '20' }]}>
                <Ionicons name={tip.icon} size={18} color={tip.color} />
              </View>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Ionicons
                name={expandedTip === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#444444"
              />
            </View>
            {expandedTip === i && (
              <Text style={styles.tipBody}>{tip.tip}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* All Quotes */}
        <Text style={styles.sectionTitle}>Motivational Quotes 🚀</Text>
        {MOTIVATIONAL_QUOTES.map((q, i) => (
          <View key={i} style={styles.quoteItem}>
            <Text style={styles.quoteItemNum}>{i + 1}</Text>
            <Text style={styles.quoteItemText}>{q.quote}</Text>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: IS_SMALL ? 12 : 20, paddingVertical: IS_SMALL ? 10 : 14,
  },
  backBtn: {
    width: IS_SMALL ? 34 : 38, height: IS_SMALL ? 34 : 38, borderRadius: 19,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: '800', color: C.text },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: 8 },
  quoteCard: {
    borderRadius: 18, padding: IS_SMALL ? 14 : 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#00FF8830',
  },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  quoteHeaderText: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  quoteText: { fontSize: IS_SMALL ? 14 : 16, color: C.text, lineHeight: IS_SMALL ? 21 : 24, fontStyle: 'italic', marginBottom: 8 },
  quoteAuthor: { fontSize: 12, color: C.textMuted },
  masterToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 16, padding: IS_SMALL ? 12 : 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masterTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  masterSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '700', color: C.textSub, marginBottom: 12 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', gap: IS_SMALL ? 8 : 12,
    backgroundColor: C.surface, borderRadius: 14, padding: IS_SMALL ? 10 : 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  reminderIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: IS_SMALL ? 12 : 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  reminderTime: { fontSize: IS_SMALL ? 11 : 12, color: C.textMuted },
  reminderRight: {},
  testBtn: {
    borderWidth: 1, borderColor: '#00FF8840',
    borderRadius: 14, marginBottom: 24,
  },
  testBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  testBtnText: { color: '#00FF88', fontSize: 14, fontWeight: '600' },
  tipCard: {
    backgroundColor: C.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  tipTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  tipBody: { color: C.textSub, fontSize: 13, lineHeight: 20, marginTop: 12, paddingLeft: 50 },
  quoteItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  quoteItemNum: {
    fontSize: 18, fontWeight: '900', color: '#00FF8840', width: 24,
  },
  quoteItemText: { flex: 1, color: C.textSub, fontSize: 13, lineHeight: 20 },
});


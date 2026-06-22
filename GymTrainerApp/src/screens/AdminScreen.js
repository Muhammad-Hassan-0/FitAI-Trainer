import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;

const ADMIN_PASSWORD = 'admin123';

const DEFAULT_EXERCISES = [
  { id: 'squat', name: 'Squats', muscles: 'Legs & Glutes', difficulty: 'Intermediate', sets: 3, reps: 12, active: true },
  { id: 'pushup', name: 'Push-Ups', muscles: 'Chest & Arms', difficulty: 'Beginner', sets: 3, reps: 10, active: true },
  { id: 'plank', name: 'Plank', muscles: 'Core', difficulty: 'Beginner', sets: 3, reps: '30s', active: true },
  { id: 'curl', name: 'Bicep Curls', muscles: 'Biceps', difficulty: 'Beginner', sets: 3, reps: 12, active: true },
  { id: 'lunge', name: 'Lunges', muscles: 'Legs', difficulty: 'Intermediate', sets: 3, reps: 10, active: true },
];

export default function AdminScreen({ navigation }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscles: '', difficulty: 'Beginner', sets: 3, reps: 10 });

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const s = await AsyncStorage.getItem('sessions');
      const st = await AsyncStorage.getItem('userStats');
      const ex = await AsyncStorage.getItem('adminExercises');
      if (s) setSessions(JSON.parse(s));
      if (st) setStats(JSON.parse(st));
      if (ex) setExercises(JSON.parse(ex));
    } catch (e) {}
  };

  const saveExercises = async (list) => {
    setExercises(list);
    await AsyncStorage.setItem('adminExercises', JSON.stringify(list));
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      Alert.alert('Wrong Password', 'Admin password galat hai!');
    }
  };

  const toggleExercise = (id) => {
    const updated = exercises.map(ex =>
      ex.id === id ? { ...ex, active: !ex.active } : ex
    );
    saveExercises(updated);
  };

  const deleteExercise = (id) => {
    Alert.alert('Delete', 'Ye exercise delete karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveExercises(exercises.filter(e => e.id !== id)) },
    ]);
  };

  const addExercise = () => {
    if (!newExercise.name) { Alert.alert('Error', 'Exercise ka naam likhen!'); return; }
    const ex = { ...newExercise, id: newExercise.name.toLowerCase().replace(' ', '_'), active: true };
    saveExercises([...exercises, ex]);
    setShowAddModal(false);
    setNewExercise({ name: '', muscles: '', difficulty: 'Beginner', sets: 3, reps: 10 });
  };

  const generateReport = () => {
    const totalReps = sessions.reduce((a, s) => a + (s.reps || 0), 0);
    const totalSessions = sessions.length;
    const avgReps = totalSessions > 0 ? Math.round(totalReps / totalSessions) : 0;
    Alert.alert(
      '📊 System Report',
      `Total Sessions: ${totalSessions}\nTotal Reps: ${totalReps}\nAvg Reps/Session: ${avgReps}\nActive Exercises: ${exercises.filter(e => e.active).length}\n\nReport generated successfully!`
    );
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <LinearGradient colors={['#0A0A0A', '#1A0A0A']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loginBox}>
          <View style={styles.adminIconBox}>
            <Ionicons name="shield-checkmark" size={42} color="#FF6B35" />
          </View>
          <Text style={styles.loginTitle}>Admin Panel</Text>
          <Text style={styles.loginSub}>Admin credentials enter karein</Text>
          <View style={styles.passBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#555555" />
            <TextInput
              style={styles.passInput}
              placeholder="Admin Password"
              placeholderTextColor="#444444"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
            <LinearGradient colors={['#FF6B35', '#FF4500']} style={styles.loginBtnGrad}>
              <Text style={styles.loginBtnText}>Login as Admin</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: '#555555' }}>← Wapas Jao</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Default password: admin123</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN ADMIN PANEL ──────────────────────────────────────────────────────
  const totalReps = sessions.reduce((a, s) => a + (s.reps || 0), 0);
  const activeEx = exercises.filter(e => e.active).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient colors={['#0A0A0A', '#1A0A00']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#FF6B35" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { id: 'exercises', label: 'Exercises', icon: 'barbell' },
          { id: 'users', label: 'Users', icon: 'people' },
          { id: 'reports', label: 'Reports', icon: 'stats-chart' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={15} color={activeTab === tab.id ? '#FF6B35' : '#555555'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <View style={styles.statsGrid}>
              {[
                { icon: 'barbell', label: 'Total Sessions', value: sessions.length || 0, color: '#FF6B35' },
                { icon: 'fitness', label: 'Total Reps', value: totalReps, color: '#00FF88' },
                { icon: 'checkmark-circle', label: 'Active Exercises', value: activeEx, color: '#00B4D8' },
                { icon: 'people', label: 'Total Users', value: 1, color: '#FFD700' },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {(sessions.slice(-5).reverse()).map((s, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>{s.exercise} — {s.reps} reps</Text>
                  <Text style={styles.activityTime}>{new Date(s.date).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            {sessions.length === 0 && <Text style={styles.emptyText}>Koi activity nahi abhi tak</Text>}

            <TouchableOpacity style={styles.reportBtn} onPress={generateReport}>
              <LinearGradient colors={['#FF6B35', '#FF4500']} style={styles.reportBtnGrad}>
                <Ionicons name="document-text" size={18} color="#FFFFFF" />
                <Text style={styles.reportBtnText}>Generate System Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* EXERCISES TAB */}
        {activeTab === 'exercises' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <LinearGradient colors={['#FF6B35', '#FF4500']} style={styles.addBtnGrad}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Exercise Add Karein</Text>
              </LinearGradient>
            </TouchableOpacity>

            {exercises.map((ex, i) => (
              <View key={i} style={[styles.exCard, !ex.active && styles.exCardInactive]}>
                <View style={styles.exCardLeft}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMeta}>{ex.muscles} • {ex.difficulty}</Text>
                  <Text style={styles.exMeta2}>{ex.sets} sets × {ex.reps} reps</Text>
                </View>
                <View style={styles.exActions}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, ex.active ? styles.toggleBtnOn : styles.toggleBtnOff]}
                    onPress={() => toggleExercise(ex.id)}
                  >
                    <Text style={styles.toggleBtnText}>{ex.active ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteExercise(ex.id)}>
                    <Ionicons name="trash-outline" size={16} color="#FF4757" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <Text style={styles.sectionTitle}>Registered Users</Text>
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>U</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>Active User</Text>
                <Text style={styles.userMeta}>{sessions.length} sessions • {totalReps} total reps</Text>
                <Text style={styles.userMeta}>Last active: {sessions.length > 0 ? new Date(sessions[sessions.length-1]?.date).toLocaleDateString() : 'N/A'}</Text>
              </View>
              <View style={styles.userActiveBadge}>
                <Text style={styles.userActiveText}>Active</Text>
              </View>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color="#00B4D8" />
              <Text style={styles.infoText}>Full user management (block/delete) production backend mein available hoga.</Text>
            </View>
          </>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <>
            <Text style={styles.sectionTitle}>Exercise Statistics</Text>
            {exercises.map((ex, i) => {
              const exSessions = sessions.filter(s => s.exercise?.toLowerCase().includes(ex.name.toLowerCase()));
              const exReps = exSessions.reduce((a, s) => a + (s.reps || 0), 0);
              return (
                <View key={i} style={styles.reportItem}>
                  <Text style={styles.reportExName}>{ex.name}</Text>
                  <View style={styles.reportBar}>
                    <View style={[styles.reportBarFill, {
                      width: `${Math.min((exReps / Math.max(totalReps, 1)) * 100, 100)}%`
                    }]} />
                  </View>
                  <Text style={styles.reportReps}>{exReps} reps</Text>
                </View>
              );
            })}

            <TouchableOpacity style={[styles.reportBtn, { marginTop: 16 }]} onPress={generateReport}>
              <LinearGradient colors={['#FF6B35', '#FF4500']} style={styles.reportBtnGrad}>
                <Ionicons name="download" size={18} color="#FFFFFF" />
                <Text style={styles.reportBtnText}>Full Report Export</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Naya Exercise Add Karein</Text>
            {[
              { label: 'Exercise Name', key: 'name', placeholder: 'e.g. Deadlift' },
              { label: 'Target Muscles', key: 'muscles', placeholder: 'e.g. Back & Legs' },
            ].map((field, i) => (
              <View key={i} style={styles.modalInput}>
                <Text style={styles.modalLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder={field.placeholder}
                  placeholderTextColor="#444444"
                  value={newExercise[field.key]}
                  onChangeText={v => setNewExercise(prev => ({ ...prev, [field.key]: v }))}
                />
              </View>
            ))}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={addExercise}>
                <LinearGradient colors={['#FF6B35', '#FF4500']} style={styles.modalAddGrad}>
                  <Text style={styles.modalAddText}>Add Karein</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loginBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, gap: 16 },
  adminIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF6B3520', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FF6B3540',
  },
  loginTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  loginSub: { fontSize: 14, color: '#555555' },
  passBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#111111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1E1E2E',
    paddingHorizontal: 16, height: 52, width: '100%',
  },
  passInput: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  loginBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
  loginBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  hint: { fontSize: 12, color: '#333333', marginTop: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: IS_SMALL ? 12 : 20, paddingVertical: IS_SMALL ? 10 : 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: '800', color: '#FFFFFF' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FF6B3520', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#FF6B3540',
  },
  adminBadgeText: { color: '#FF6B35', fontSize: 12, fontWeight: '700' },
  tabRow: { paddingHorizontal: IS_SMALL ? 12 : 20, gap: 10, paddingBottom: 12 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111111', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#1E1E2E',
  },
  tabActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B3510' },
  tabText: { color: '#555555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FF6B35' },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: IS_SMALL ? 8 : 12, marginBottom: 24 },
  statCard: {
    width: IS_SMALL ? '48%' : '47%', backgroundColor: '#111111', borderRadius: 16,
    padding: IS_SMALL ? 12 : 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#1E1E2E',
  },
  statValue: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#555555', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#888888', marginBottom: 12 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111111', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#1E1E2E',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
  activityText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  activityTime: { fontSize: 11, color: '#444444', marginTop: 2 },
  emptyText: { color: '#444444', textAlign: 'center', marginVertical: 20 },
  reportBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  reportBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  reportBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  addBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  exCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111111', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1E1E2E',
  },
  exCardInactive: { opacity: 0.5 },
  exCardLeft: { flex: 1 },
  exName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  exMeta: { fontSize: 12, color: '#555555' },
  exMeta2: { fontSize: 11, color: '#444444', marginTop: 2 },
  exActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  toggleBtnOn: { backgroundColor: '#00FF8830', borderWidth: 1, borderColor: '#00FF8860' },
  toggleBtnOff: { backgroundColor: '#FF475720', borderWidth: 1, borderColor: '#FF475740' },
  toggleBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FF475715', justifyContent: 'center', alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#111111', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1E1E2E',
  },
  userAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#FF6B3530', justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { fontSize: 18, fontWeight: '800', color: '#FF6B35' },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  userMeta: { fontSize: 12, color: '#555555' },
  userActiveBadge: {
    backgroundColor: '#00FF8820', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: '#00FF8840',
  },
  userActiveText: { color: '#00FF88', fontSize: 11, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#001A20', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#00B4D830',
  },
  infoText: { flex: 1, color: '#00B4D8', fontSize: 13, lineHeight: 18 },
  reportItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  reportExName: { width: IS_SMALL ? 76 : 90, fontSize: IS_SMALL ? 12 : 13, color: '#AAAAAA' },
  reportBar: { flex: 1, height: 8, backgroundColor: '#1E1E2E', borderRadius: 4 },
  reportBarFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 4 },
  reportReps: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', width: 55, textAlign: 'right' },
  modalOverlay: {
    flex: 1, backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#111111', borderRadius: 24,
    padding: 24, borderWidth: 1, borderColor: '#1E1E2E',
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 20 },
  modalInput: { marginBottom: 14 },
  modalLabel: { fontSize: 13, color: '#666666', marginBottom: 6 },
  modalTextInput: {
    backgroundColor: '#0A0A0A', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E2E',
    paddingHorizontal: 14, height: 48, color: '#FFFFFF', fontSize: 15,
  },
  modalRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#555555', fontSize: 14, fontWeight: '600' },
  modalAddBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  modalAddGrad: { paddingVertical: 14, alignItems: 'center' },
  modalAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});


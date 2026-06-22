import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, TextInput, Modal, Platform,
  Vibration, DeviceEventEmitter, Dimensions, DevSettings,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '../services/firebase';
import { C, applyTheme } from '../theme';

const { width } = Dimensions.get('window');
const IS_SMALL = width < 360;

const GOAL_OPTIONS = [
  { key: 'lose',  label: 'Lose Weight',        icon: '🔥', desc: 'Burn fat, reduce body weight' },
  { key: 'gain',  label: 'Build Muscle',        icon: '💪', desc: 'Increase muscle mass and strength' },
  { key: 'fit',   label: 'Stay Fit',            icon: '🏃', desc: 'Maintain general fitness and health' },
  { key: 'sport', label: 'Sports Performance',  icon: '⚡', desc: 'Improve athletic performance' },
];
const LEVEL_OPTIONS = [
  { key: 'beginner',     label: 'Beginner',      icon: '🌱', desc: 'New to working out (< 6 months)' },
  { key: 'intermediate', label: 'Intermediate',  icon: '🏋️', desc: 'Training for 6–24 months' },
  { key: 'advanced',     label: 'Advanced',      icon: '🔥', desc: 'Consistent training 2+ years' },
  { key: 'athlete',      label: 'Athlete',        icon: '⚡', desc: 'Competitive or professional' },
];
const BODYTYPE_OPTIONS = [
  { key: 'slim',     label: 'Slim / Ectomorph',    icon: '🦴', desc: 'Naturally lean, hard to gain weight' },
  { key: 'muscular', label: 'Athletic / Mesomorph', icon: '💪', desc: 'Naturally muscular, gains/loses easily' },
  { key: 'bulky',    label: 'Stocky / Endomorph',  icon: '🏋️', desc: 'Tends to store fat, gains easily' },
];
const TIME_OPTIONS = [
  { key: '15',  label: '15 minutes', icon: '⏱️', desc: 'Quick daily workout' },
  { key: '20',  label: '20 minutes', icon: '⏱️', desc: 'Short focused session' },
  { key: '30',  label: '30 minutes', icon: '⏱️', desc: 'Standard session' },
  { key: '45',  label: '45 minutes', icon: '⏱️', desc: 'Full workout' },
  { key: '60',  label: '60 minutes', icon: '⏱️', desc: 'Extended training' },
  { key: '90',  label: '90 minutes', icon: '⏱️', desc: 'Serious athlete session' },
];
const HEALTH_OPTIONS = [
  { key: 'none',        label: 'No Issues',       icon: '✅', desc: 'Fully healthy' },
  { key: 'back',        label: 'Back Pain',        icon: '🦴', desc: 'Lower or upper back problems' },
  { key: 'knee',        label: 'Knee Problems',    icon: '🦵', desc: 'Knee pain or injury' },
  { key: 'shoulder',    label: 'Shoulder Issues',  icon: '💪', desc: 'Shoulder pain or injury' },
  { key: 'diabetes',    label: 'Diabetes',         icon: '🩸', desc: 'Type 1 or Type 2 diabetes' },
  { key: 'hypertension',label: 'High Blood Pressure', icon: '❤️', desc: 'Hypertension' },
  { key: 'heart',       label: 'Heart Condition',  icon: '🏥', desc: 'Cardiac-related condition' },
];
const NOTIF_TIME_OPTIONS = [
  { key: '06:00', label: '6:00 AM — Early Bird' },
  { key: '07:00', label: '7:00 AM — Morning' },
  { key: '08:00', label: '8:00 AM — Morning' },
  { key: '12:00', label: '12:00 PM — Midday' },
  { key: '17:00', label: '5:00 PM — Evening' },
  { key: '18:00', label: '6:00 PM — Evening' },
  { key: '19:00', label: '7:00 PM — Night' },
  { key: '20:00', label: '8:00 PM — Night' },
];

// ── Option Picker Modal ───────────────────────────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <View style={pm.header}>
            <Text style={pm.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[pm.option, selected === opt.key && pm.optionActive]}
                onPress={() => { onSelect(opt.key); onClose(); }}
                activeOpacity={0.75}
              >
                <Text style={pm.optIcon}>{opt.icon}</Text>
                <View style={pm.optInfo}>
                  <Text style={[pm.optLabel, selected === opt.key && { color: C.brand }]}>{opt.label}</Text>
                  {opt.desc && <Text style={pm.optDesc}>{opt.desc}</Text>}
                </View>
                {selected === opt.key && (
                  <View style={pm.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '75%', paddingTop: 12,
    borderWidth: 1, borderBottomWidth: 0, borderColor: C.border,
  },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '900', color: C.text },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderColor: C.border,
  },
  optionActive: { backgroundColor: C.brand + '10' },
  optIcon: { fontSize: 22, width: 32 },
  optInfo: { flex: 1 },
  optLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  optDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
  },
});

// ── Menu components ───────────────────────────────────────────────────────────
function MenuItem({ icon, iconColor, label, value, onPress, danger, toggle, toggleVal, onToggle, badge }) {
  const body = (
    <>
      <View style={[mi.iconBox, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[mi.label, danger && { color: C.red }]}>{label}</Text>
      <View style={mi.right}>
        {badge && (
          <View style={[mi.badge, { backgroundColor: badge.color + '20', borderColor: badge.color + '40' }]}>
            <Text style={[mi.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        )}
        {value && !toggle && <Text style={mi.value}>{value}</Text>}
        {toggle && (
          <Switch
            value={toggleVal}
            onValueChange={onToggle}
            trackColor={{ false: C.border, true: C.brand + '80' }}
            thumbColor={toggleVal ? C.brand : C.textDim}
          />
        )}
        {!toggle && <Ionicons name="chevron-forward" size={16} color={C.textDim} />}
      </View>
    </>
  );

  // Android (Samsung etc.): Switch inside TouchableOpacity steals touches — toggles feel "dead".
  if (toggle) {
    return <View style={mi.row}>{body}</View>;
  }

  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      {body}
    </TouchableOpacity>
  );
}
const mi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

function MenuSection({ title, children }) {
  return (
    <View style={ms.container}>
      {title && <Text style={ms.title}>{title}</Text>}
      <View style={ms.card}>
        {React.Children.map(children, (child, i) => (
          <>
            {child}
            {i < React.Children.count(children) - 1 && <View style={ms.divider} />}
          </>
        ))}
      </View>
    </View>
  );
}
const ms = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 11, fontWeight: '900', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, paddingLeft: 4 },
  card: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border },
  divider: { height: 1, backgroundColor: C.border },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({ name: 'User', email: 'user@fitai.com', weight: '', height: '' });
  const [answers, setAnswers] = useState({});
  const [stats, setStats] = useState({ streak: 0, totalSessions: 0, totalReps: 0 });
  const [notifs, setNotifs] = useState(true);
  const [notifTime, setNotifTime] = useState('07:00');
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  // Picker modal state
  const [picker, setPicker] = useState({ visible: false, type: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, a, st, prefs] = await AsyncStorage.multiGet(['userData', 'onboardingAnswers', 'userStats', 'appPrefs']);
      if (u[1]) setUserData(JSON.parse(u[1]));
      if (a[1]) setAnswers(JSON.parse(a[1]));
      if (st[1]) setStats(prev => ({ ...prev, ...JSON.parse(st[1]) }));
      if (prefs[1]) {
        const p = JSON.parse(prefs[1]);
        if (p.notifications !== undefined) setNotifs(!!p.notifications);
        else if (p.notifs !== undefined) setNotifs(!!p.notifs);
        if (p.notifTime) setNotifTime(p.notifTime);
        if (p.voiceCoach !== undefined) setSound(!!p.voiceCoach);
        else if (p.sound !== undefined) setSound(!!p.sound);
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
      }
    } catch (_) {}
  };

  const savePrefs = async (updates) => {
    try {
      const raw = await AsyncStorage.getItem('appPrefs');
      const prefs = raw ? JSON.parse(raw) : {};
      const merged = { ...prefs, ...updates };
      await AsyncStorage.setItem('appPrefs', JSON.stringify(merged));
    } catch (_) {}
  };

  // Save a fitness profile answer
  const saveAnswer = async (key, value) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    await AsyncStorage.setItem('onboardingAnswers', JSON.stringify(updated));
    flash(`${key.charAt(0).toUpperCase() + key.slice(1)} updated ✓`);
    Vibration.vibrate(40);
  };

  const flash = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const openPicker = (type) => setPicker({ visible: true, type });
  const closePicker = () => setPicker({ visible: false, type: null });

  const handleNotifToggle = (v) => {
    setNotifs(v);
    savePrefs({ notifs: v, notifications: v });
    if (v) {
      flash('Notifications enabled ✓');
      Vibration.vibrate(30);
    } else {
      flash('Notifications disabled');
    }
  };

  const handleSoundToggle = (v) => {
    setSound(v);
    savePrefs({ sound: v, voiceCoach: v });
    flash(v ? 'Voice coaching ON ✓' : 'Voice coaching OFF');
    Vibration.vibrate(30);
  };

  const handleDarkToggle = async (v) => {
    setDarkMode(v);
    await savePrefs({ darkMode: v });
    applyTheme(v);
    DeviceEventEmitter.emit('themeChanged', { darkMode: v });
    flash(v ? 'Dark mode enabled ✓' : 'Light mode enabled ✓');
    // StyleSheet colors are captured at module load; full reload applies new palette everywhere.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => window.location.reload(), 180);
      return;
    }
    // Expo Go / dev: Updates.reloadAsync() usually does nothing; JS reload reapplies all StyleSheets.
    if (__DEV__) {
      setTimeout(() => DevSettings.reload(), 200);
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch (_) {}
  };

  const openEditModal = () => {
    setEditName(userData.name || '');
    setEditEmail(userData.email || '');
    setEditWeight(userData.weight || '');
    setEditHeight(userData.height || '');
    setEditModal(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
    const updated = { ...userData, name: editName.trim(), email: editEmail.trim(), weight: editWeight, height: editHeight };
    setUserData(updated);
    await AsyncStorage.setItem('userData', JSON.stringify(updated));
    setEditModal(false);
    flash('Profile saved ✓');
    Vibration.vibrate(40);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      if (firebaseAuth.isAvailable()) await firebaseAuth.logout();
      else await AsyncStorage.multiRemove(['userToken', 'userData']);

      // In nested navigators, replace may exist on parent stack.
      const rootNav = navigation.getParent?.() || navigation;
      if (rootNav.replace) rootNav.replace('Auth');
      else navigation.navigate('Auth');
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('Are you sure you want to logout?');
      if (ok) doLogout();
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: doLogout },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Reset All Data', 'This clears ALL app data and restarts setup. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Everything', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            'onboardingDone', 'userToken', 'userData', 'userStats',
            'sessions', 'completedDays', 'dietProgress', 'onboardingAnswers', 'appPrefs',
          ]);
          navigation.replace('Splash');
        },
      },
    ]);
  };

  const handleClearWorkouts = () => {
    Alert.alert('Clear Workout History', 'Delete all workout records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['sessions', 'completedDays', 'userStats']);
          setStats({ streak: 0, totalSessions: 0, totalReps: 0 });
          flash('Workout history cleared ✓');
        },
      },
    ]);
  };

  // ── Picker config ─────────────────────────────────────────────────────────
  const PICKER_CONFIG = {
    goal:     { title: 'Change Your Goal',          options: GOAL_OPTIONS,     key: 'goal' },
    level:    { title: 'Change Fitness Level',       options: LEVEL_OPTIONS,    key: 'level' },
    bodytype: { title: 'Change Body Type',           options: BODYTYPE_OPTIONS, key: 'bodytype' },
    time:     { title: 'Daily Workout Time',         options: TIME_OPTIONS,     key: 'time' },
    health:   { title: 'Health Condition',           options: HEALTH_OPTIONS,   key: 'health' },
    notifTime:{ title: 'Reminder Time',              options: NOTIF_TIME_OPTIONS.map(o => ({ ...o, icon: '🔔', desc: '' })), key: 'notifTime' },
  };
  const currentPicker = picker.type ? PICKER_CONFIG[picker.type] : null;

  const getGoalLabel     = () => GOAL_OPTIONS.find(o => o.key === answers.goal)?.label || 'Stay Fit';
  const getLevelLabel    = () => LEVEL_OPTIONS.find(o => o.key === answers.level)?.label || 'Beginner';
  const getBodyLabel     = () => BODYTYPE_OPTIONS.find(o => o.key === answers.bodytype)?.label || 'Not Set';
  const getHealthLabel   = () => HEALTH_OPTIONS.find(o => o.key === answers.health)?.label || 'No Issues';
  const getTimeLabel     = () => (answers.time ? `${answers.time} min` : '30 min');
  const getNotifTimeLabel= () => NOTIF_TIME_OPTIONS.find(o => o.key === notifTime)?.label || '7:00 AM';

  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>

      {/* ── PICKER MODAL ── */}
      {currentPicker && (
        <PickerModal
          visible={picker.visible}
          title={currentPicker.title}
          options={currentPicker.options}
          selected={picker.type === 'notifTime' ? notifTime : answers[currentPicker.key]}
          onSelect={(val) => {
            if (picker.type === 'notifTime') {
              setNotifTime(val);
              savePrefs({ notifTime: val });
              flash(`Reminder set for ${NOTIF_TIME_OPTIONS.find(o => o.key === val)?.label} ✓`);
            } else {
              saveAnswer(currentPicker.key, val);
            }
          }}
          onClose={closePicker}
        />
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Full Name *', val: editName, set: setEditName, placeholder: 'Your full name', icon: 'person', type: 'default' },
              { label: 'Email', val: editEmail, set: setEditEmail, placeholder: 'email@example.com', icon: 'mail', type: 'email-address' },
              { label: 'Weight (kg)', val: editWeight, set: setEditWeight, placeholder: 'e.g. 75', icon: 'fitness', type: 'numeric' },
              { label: 'Height (cm)', val: editHeight, set: setEditHeight, placeholder: 'e.g. 175', icon: 'body', type: 'numeric' },
            ].map((f, i) => (
              <View key={i} style={s.inputGroup}>
                <Text style={s.inputLabel}>{f.label}</Text>
                <View style={s.inputWrap}>
                  <Ionicons name={f.icon} size={16} color={C.textMuted} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={s.input}
                    value={f.val}
                    onChangeText={f.set}
                    placeholder={f.placeholder}
                    placeholderTextColor={C.textDim}
                    keyboardType={f.type}
                    autoCapitalize={f.type === 'default' ? 'words' : 'none'}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.saveBtn} onPress={saveProfile}>
              <LinearGradient colors={[C.brand, C.brandDark]} style={s.saveBtnGrad}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={s.saveBtnText}>Save Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {savedMsg !== '' && (
              <View style={s.savedBadge}>
                <Ionicons name="checkmark-circle" size={13} color={C.lime} />
                <Text style={s.savedBadgeText}>{savedMsg}</Text>
              </View>
            )}
            <TouchableOpacity style={s.adminBtn} onPress={() => navigation.navigate('Admin')}>
              <Ionicons name="shield-checkmark-outline" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AVATAR CARD ── */}
        <LinearGradient colors={[C.brandDark + '40', C.brand + '20']} style={s.avatarCard}>
          <View style={s.avatarGradWrap}>
            <LinearGradient colors={[C.brand, C.brandDark]} style={s.avatarGrad}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={s.avatarName}>{userData.name}</Text>
          <Text style={s.avatarEmail}>{userData.email}</Text>

          {(userData.weight || userData.height) && (
            <View style={s.avatarBioRow}>
              {userData.weight ? (
                <View style={s.avatarBioChip}>
                  <Text style={s.avatarBioText}>⚖️ {userData.weight} kg</Text>
                </View>
              ) : null}
              {userData.height ? (
                <View style={s.avatarBioChip}>
                  <Text style={s.avatarBioText}>📏 {userData.height} cm</Text>
                </View>
              ) : null}
              {userData.weight && userData.height ? (
                <View style={s.avatarBioChip}>
                  <Text style={s.avatarBioText}>
                    BMI: {(parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2)).toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={s.avatarStats}>
            {[
              { icon: 'flame',     val: stats.streak || 0,        label: 'Streak',   color: C.brand },
              { icon: 'barbell',   val: stats.totalSessions || 0, label: 'Sessions', color: C.lime },
              { icon: 'trophy',    val: stats.totalReps || 0,     label: 'Reps',     color: C.gold },
            ].map((st, i) => (
              <View key={i} style={s.avatarStat}>
                <Ionicons name={st.icon} size={14} color={st.color} />
                <Text style={s.avatarStatVal}>{st.val}</Text>
                <Text style={s.avatarStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.editBtn} onPress={openEditModal}>
            <Ionicons name="create-outline" size={14} color={C.brand} />
            <Text style={s.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── FITNESS PROFILE — fully editable ── */}
        <MenuSection title="Fitness Profile">
          <MenuItem
            icon="flag" iconColor={C.blue}
            label="Fitness Goal"
            value={getGoalLabel()}
            onPress={() => openPicker('goal')}
          />
          <MenuItem
            icon="barbell" iconColor={C.brand}
            label="Training Level"
            value={getLevelLabel()}
            onPress={() => openPicker('level')}
          />
          <MenuItem
            icon="body" iconColor={C.teal}
            label="Body Type"
            value={getBodyLabel()}
            onPress={() => openPicker('bodytype')}
          />
          <MenuItem
            icon="time" iconColor={C.gold}
            label="Daily Workout Time"
            value={getTimeLabel()}
            onPress={() => openPicker('time')}
          />
          <MenuItem
            icon="medical" iconColor={C.red}
            label="Health Condition"
            value={getHealthLabel()}
            onPress={() => openPicker('health')}
          />
        </MenuSection>

        {/* ── APP SETTINGS — all functional ── */}
        <MenuSection title="App Settings">
          <MenuItem
            icon="notifications" iconColor={C.blue}
            label="Push Notifications"
            toggle toggleVal={notifs} onToggle={handleNotifToggle}
            badge={notifs ? { text: 'ON', color: C.lime } : null}
          />
          {notifs && (
            <MenuItem
              icon="alarm" iconColor={C.teal}
              label="Reminder Time"
              value={getNotifTimeLabel()}
              onPress={() => openPicker('notifTime')}
            />
          )}
          <MenuItem
            icon="volume-high" iconColor={C.brand}
            label="Voice Coaching"
            toggle toggleVal={sound} onToggle={handleSoundToggle}
            badge={sound ? { text: 'ON', color: C.lime } : null}
          />
          <MenuItem
            icon="moon" iconColor={C.teal}
            label="Dark Mode"
            toggle toggleVal={darkMode} onToggle={handleDarkToggle}
          />
          <MenuItem
            icon="language" iconColor={C.lime}
            label="Chat Language"
            value="EN / اردو / العربية"
            onPress={() => navigation.navigate('AIChat')}
          />
        </MenuSection>

        {/* ── QUICK ACTIONS ── */}
        <MenuSection title="Quick Actions">
          <MenuItem
            icon="hardware-chip" iconColor={C.brandLight}
            label="AI Fitness Coach"
            onPress={() => navigation.navigate('AIChat')}
          />
          <MenuItem
            icon="calendar" iconColor={C.lime}
            label="Weekly Programme"
            onPress={() => navigation.navigate('WeeklyPlan')}
          />
          <MenuItem
            icon="notifications-circle" iconColor={C.gold}
            label="Reminders & Tips"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="stats-chart" iconColor={C.blue}
            label="Progress Report"
            onPress={() => navigation.navigate('Progress')}
          />
        </MenuSection>

        {/* ── ABOUT (no Gemini mention) ── */}
        <MenuSection title="About">
          <MenuItem icon="information-circle" iconColor={C.blue} label="App Version" value="v1.0.0" />
          <MenuItem icon="code-slash" iconColor={C.teal} label="Build" value="React Native + Expo" />
          <MenuItem icon="shield-checkmark" iconColor={C.lime} label="Privacy Policy" onPress={() => {
            Alert.alert('Privacy Policy', 'Your data is stored locally on this device. No personal data is sent to third-party servers without your consent. AI features use secure API connections.');
          }} />
          <MenuItem icon="help-circle" iconColor={C.gold} label="Help & Support" onPress={() => {
            Alert.alert('Help', 'For support, contact us via the AI Coach chat or email support@fitaitrainer.app');
          }} />
        </MenuSection>

        {/* ── ACCOUNT ── */}
        <MenuSection title="Account">
          <MenuItem
            icon="trash-bin" iconColor={C.gold}
            label="Clear Workout History"
            onPress={handleClearWorkouts}
          />
          <MenuItem
            icon="refresh-circle" iconColor={C.teal}
            label="Reset App & Setup"
            onPress={handleReset}
          />
          <MenuItem
            icon="log-out" iconColor={C.red}
            label="Logout"
            onPress={handleLogout}
            danger
          />
        </MenuSection>

        {/* App footer */}
        <View style={s.footer}>
          <View style={s.footerLogo}>
            <Ionicons name="barbell" size={16} color="#FFFFFF" />
          </View>
          <Text style={s.footerName}>FitAI Trainer</Text>
          <Text style={s.footerVer}>v1.0.0</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: IS_SMALL ? 12 : 20, paddingTop: IS_SMALL ? 10 : 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: IS_SMALL ? 20 : 24, fontWeight: '900', color: C.text, letterSpacing: -0.4 },
  adminBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.brand + '15', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.brand + '30',
  },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.lime + '15', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.lime + '30',
  },
  savedBadgeText: { fontSize: 11, color: C.lime, fontWeight: '700' },

  avatarCard: {
    borderRadius: IS_SMALL ? 18 : 24, padding: IS_SMALL ? 14 : 22, alignItems: 'center',
    marginBottom: 22, borderWidth: 1, borderColor: C.brand + '30',
  },
  avatarGradWrap: { marginBottom: 12 },
  avatarGrad: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  avatarInitials: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  avatarName: { fontSize: IS_SMALL ? 17 : 20, fontWeight: '900', color: C.text, marginBottom: 4 },
  avatarEmail: { fontSize: IS_SMALL ? 12 : 13, color: C.textMuted },
  avatarBioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4, justifyContent: 'center' },
  avatarBioChip: {
    backgroundColor: C.white10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: C.white20,
  },
  avatarBioText: { fontSize: 11, color: C.textSub, fontWeight: '600' },
  avatarStats: { flexDirection: 'row', gap: 0, width: '100%', marginTop: 14 },
  avatarStat: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 12, borderWidth: 1, borderColor: C.white10,
    borderRadius: 16, marginHorizontal: 4, backgroundColor: C.white10,
  },
  avatarStatVal: { fontSize: 18, fontWeight: '900', color: C.text },
  avatarStatLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand + '18', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.brand + '35', marginTop: 14,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: C.brand },

  // Edit Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: C.border, gap: 14, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  inputGroup: { gap: 5 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, paddingLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface2, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, height: 48,
  },
  input: { flex: 1, color: C.text, fontSize: 14, paddingRight: 14 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },

  // Footer
  footer: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  footerLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
  },
  footerName: { fontSize: 14, fontWeight: '800', color: C.text },
  footerVer: { fontSize: 11, color: C.textDim },
});

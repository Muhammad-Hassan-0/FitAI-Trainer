import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image,
  Animated, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { authAPI } from '../services/api';
import { C, SHADOW } from '../theme';

function authErrorMessage(codeOrMsg) {
  const m = String(codeOrMsg || '');
  if (m.includes('Email already registered')) return 'This email is already registered. Try signing in.';
  if (m.includes('Invalid credentials')) return 'Invalid email or password.';
  if (m.includes('HTTP 401')) return 'Invalid email or password.';
  if (m.includes('HTTP 409')) return 'This email is already registered. Try signing in.';
  if (m.includes('HTTP 500')) return 'Server error. Please try again in a moment.';
  if (m.includes('HTTP 503')) return 'Server is temporarily unavailable.';
  if (m.includes('Network request failed')) return 'Cannot reach server. Check internet/backend and try again.';
  if (m.includes('The user aborted a request')) return 'Request timed out. Try again.';
  if (m.includes('Request timeout')) return 'Server did not respond in time. Try again.';
  if (m.includes('undefined is not a function')) return 'Temporary app-network compatibility issue occurred. Please try again.';
  if (m.includes('email-already-in-use')) return 'This email is already registered. Try signing in.';
  if (m.includes('invalid-email')) return 'Please enter a valid email address.';
  if (m.includes('weak-password')) return 'Password is too weak. Use at least 6 characters.';
  if (m.includes('user-not-found') || m.includes('wrong-password') || m.includes('invalid-credential'))
    return 'Invalid email or password.';
  if (m.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  return m.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)\.?$/, '') || 'Something went wrong. Try again.';
}

const { width, height } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('signin');   // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (m) => {
    setError('');
    Animated.spring(slideAnim, {
      toValue: m === 'signin' ? 0 : 1,
      tension: 80, friction: 12, useNativeDriver: false,
    }).start();
    setMode(m);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const authWithRetry = async (fn, retries = 1) => {
    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || '');
        const retryable =
          msg.includes('Network request failed') ||
          msg.includes('The user aborted a request') ||
          msg.includes('Request timeout') ||
          msg.includes('undefined is not a function') ||
          msg.includes('HTTP 503');
        if (!retryable || attempt === retries) break;
        await sleep(500);
      }
    }
    throw lastErr;
  };

  const handle = async () => {
    setError('');
    const { name, email, password } = form;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authWithRetry(() => (
        mode === 'signup'
          ? authAPI.register(name.trim(), normalizedEmail, password)
          : authAPI.login(normalizedEmail, password)
      ), 1);

      if (!res?.success || !res?.token) {
        setError(authErrorMessage(res?.error || 'Authentication failed.'));
        return;
      }

      const userData = {
        id: res.user?.id,
        name: res.user?.name || name.trim(),
        email: res.user?.email || normalizedEmail,
        joinDate: new Date().toISOString(),
        isGuest: false,
      };

      await AsyncStorage.setItem('userToken', res.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      if (mode === 'signup') {
        await AsyncStorage.setItem('onboardingPending', 'true');
        await AsyncStorage.removeItem('onboardingAnswers');
        await AsyncStorage.removeItem('generatedPlan');
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Main');
      }
    } catch (e) {
      setError(authErrorMessage(e?.message || 'Unable to reach server.'));
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = () => {
    Alert.alert(
      'Guest Mode',
      'Guest mode is for quick demo only. Your progress will not be saved to a real account. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue as Guest',
          onPress: async () => {
            await AsyncStorage.setItem('userToken', 'guest_token');
            await AsyncStorage.setItem('userData', JSON.stringify({
              name: 'Guest User',
              email: 'guest@fitai.app',
              isGuest: true,
            }));
            navigation.replace('Main');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}>

        {/* ── HERO TOP ── */}
        <View style={s.heroBlock}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&fit=crop' }}
            style={s.heroImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#090909EE', '#090909']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Orange left accent */}
          <View style={s.leftAccent} />

          {/* Back button */}
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              // Always hard-reset auth flow back to Splash.
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                })
              );
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.heroLogo}>
            <LinearGradient colors={[C.brand, C.brandDark]} style={s.heroLogoIcon}>
              <Ionicons name="barbell" size={13} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.heroLogoText}>FitAI Trainer</Text>
          </View>

          {/* Hero text */}
          <View style={s.heroText}>
            <Text style={s.heroEyebrow}>YOUR FITNESS JOURNEY</Text>
            <Text style={s.heroTitle}>
              {mode === 'signin' ? 'Welcome\nBack! 💪' : 'Create Your\nAccount ✨'}
            </Text>
          </View>
        </View>

        {/* ── FORM CARD ── */}
        <View style={s.formCard}>

          {/* Mode Toggle — pill style */}
          <View style={s.toggle}>
            <Animated.View
              style={[
                s.toggleIndicator,
                {
                  left: slideAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '50%'] }),
                },
              ]}
            />
            <TouchableOpacity style={s.toggleBtn} onPress={() => switchMode('signin')}>
              <Text style={[s.toggleText, mode === 'signin' && s.toggleActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.toggleBtn} onPress={() => switchMode('signup')}>
              <Text style={[s.toggleText, mode === 'signup' && s.toggleActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={s.fields}>
            {mode === 'signup' && (
              <View style={s.inputWrap}>
                <View style={s.inputIcon}>
                  <Ionicons name="person" size={16} color={C.textDim} />
                </View>
                <TextInput
                  style={s.input}
                  placeholder="Full Name"
                  placeholderTextColor={C.textDim}
                  value={form.name}
                  onChangeText={v => setForm(p => ({ ...p, name: v }))}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={s.inputWrap}>
              <View style={s.inputIcon}>
                <Ionicons name="mail" size={16} color={C.textDim} />
              </View>
              <TextInput
                style={s.input}
                placeholder="Email Address"
                placeholderTextColor={C.textDim}
                value={form.email}
                onChangeText={v => setForm(p => ({ ...p, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputWrap}>
              <View style={s.inputIcon}>
                <Ionicons name="lock-closed" size={16} color={C.textDim} />
              </View>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={C.textDim}
                value={form.password}
                onChangeText={v => setForm(p => ({ ...p, password: v }))}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={s.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={14} color={C.red} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'signin' && (
              <TouchableOpacity style={s.forgotBtn}>
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Main CTA */}
            <TouchableOpacity onPress={handle} disabled={loading} style={s.mainCTA} activeOpacity={0.88}>
              <LinearGradient
                colors={loading ? [C.textDim, C.textDim] : [C.brand, C.brandDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.mainCTAGrad}
              >
                {loading ? (
                  <Text style={s.mainCTAText}>Please wait...</Text>
                ) : (
                  <>
                    <Text style={s.mainCTAText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
                    <View style={s.ctaArrow}>
                      <Ionicons name="arrow-forward" size={16} color={C.brand} />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or continue with</Text>
              <View style={s.orLine} />
            </View>

            {/* Social / Guest */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={guestLogin}>
                <Ionicons name="person-outline" size={18} color={C.text} />
                <Text style={s.socialBtnText}>Guest Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn}>
                <Ionicons name="logo-google" size={18} color={C.text} />
                <Text style={s.socialBtnText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom note */}
          <Text style={s.footerNote}>
            {mode === 'signin'
              ? "Don't have an account? "
              : 'Already registered? '}
            <Text
              style={{ color: C.brand, fontWeight: '800' }}
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Hero
  heroBlock: { height: IS_TABLET ? height * 0.38 : (IS_SMALL ? height * 0.40 : height * 0.44), position: 'relative' },
  heroImg: { ...StyleSheet.absoluteFillObject },
  leftAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: C.brand,
  },
  backBtn: {
    position: 'absolute', top: 10, left: IS_SMALL ? 12 : 18,
    width: IS_SMALL ? 34 : 38, height: IS_SMALL ? 34 : 38, borderRadius: 12,
    backgroundColor: '#00000060', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFFFFF20',
  },
  heroLogo: {
    position: 'absolute', top: 14, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8, left: 0, right: 0,
    justifyContent: 'center',
  },
  heroLogoIcon: {
    width: 26, height: 26, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  heroLogoText: { fontSize: IS_SMALL ? 13 : 14, fontWeight: '900', color: '#FFFFFF' },
  heroText: {
    position: 'absolute', bottom: IS_SMALL ? 20 : 28, left: IS_SMALL ? 16 : 24,
  },
  heroEyebrow: { fontSize: IS_SMALL ? 9 : 10, fontWeight: '900', color: C.brand, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  heroTitle: { fontSize: IS_TABLET ? 40 : (IS_SMALL ? 28 : 34), fontWeight: '900', color: '#FFFFFF', lineHeight: IS_SMALL ? 34 : 40, letterSpacing: -0.5 },

  // Form card
  formCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: IS_SMALL ? 24 : 30, borderTopRightRadius: IS_SMALL ? 24 : 30,
    marginTop: IS_SMALL ? -18 : -24, padding: IS_SMALL ? 16 : 24, paddingBottom: IS_SMALL ? 24 : 40,
    borderTopWidth: 1, borderTopColor: C.border,
  },

  // Toggle
  toggle: {
    flexDirection: 'row', backgroundColor: C.surface2,
    borderRadius: 14, padding: 4, marginBottom: IS_SMALL ? 16 : 24,
    position: 'relative', borderWidth: 1, borderColor: C.border,
  },
  toggleIndicator: {
    position: 'absolute', top: 4, bottom: 4,
    width: '48%', backgroundColor: C.brand,
    borderRadius: 11,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', zIndex: 1 },
  toggleText: { fontSize: IS_SMALL ? 13 : 14, fontWeight: '700', color: C.textMuted },
  toggleActive: { color: '#FFFFFF', fontWeight: '900' },

  // Fields
  fields: { gap: IS_SMALL ? 10 : 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface2, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  inputIcon: {
    width: IS_SMALL ? 40 : 44, height: IS_SMALL ? 46 : 50, justifyContent: 'center', alignItems: 'center',
  },
  input: {
    flex: 1, height: IS_SMALL ? 46 : 50, fontSize: IS_SMALL ? 13 : 14,
    color: C.text, paddingRight: 14,
  },
  eyeBtn: { padding: 14 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.red + '15', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.red + '30',
  },
  errorText: { fontSize: 12, color: C.red, flex: 1 },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, color: C.brand, fontWeight: '700' },

  mainCTA: { borderRadius: 16, overflow: 'hidden', marginTop: 4, ...SHADOW.brand },
  mainCTAGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 22,
  },
  mainCTAText: { fontSize: IS_SMALL ? 14 : 15, fontWeight: '900', color: '#FFFFFF' },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontSize: 12, color: C.textMuted },

  socialRow: { flexDirection: IS_SMALL ? 'column' : 'row', gap: 10 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.surface2, borderRadius: 14,
    paddingVertical: 12, borderWidth: 1, borderColor: C.border,
  },
  socialBtnText: { fontSize: 13, fontWeight: '700', color: C.text },

  footerNote: { fontSize: IS_SMALL ? 12 : 13, color: C.textMuted, textAlign: 'center', marginTop: IS_SMALL ? 14 : 20 },
});

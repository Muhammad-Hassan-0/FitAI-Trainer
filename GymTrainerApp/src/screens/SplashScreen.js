import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../theme';

const { width, height } = Dimensions.get('window');
const IS_SMALL = width < 360;
const IS_TABLET = width >= 768;

const STATS = [
  { val: '10K+', label: 'Active Users' },
  { val: '200+', label: 'Exercises' },
  { val: '4.9★', label: 'Rating' },
];

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(60)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;
  const btnFade  = useRef(new Animated.Value(0)).current;
  const imgPan   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle Ken Burns on image
    Animated.timing(imgPan, {
      toValue: -20, duration: 6000, useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(slideUp, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btnSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      {/* ── Full-bleed hero image with subtle zoom ── */}
      <Animated.Image
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&fit=crop' }}
        style={[s.bgImage, { transform: [{ translateY: imgPan }] }]}
        resizeMode="cover"
      />

      {/* Multi-stop gradient — darker at bottom for readability */}
      <LinearGradient
        colors={['#00000050', '#00000030', '#090909CC', '#090909']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Top bar ── */}
      <Animated.View style={[s.topBar, { opacity: fadeIn, top: insets.top + 6 }]}>
        <View style={s.logoMark}>
          <LinearGradient colors={[C.brand, C.brandDark]} style={s.logoGrad}>
            <Ionicons name="barbell" size={15} color="#FFFFFF" />
          </LinearGradient>
          <Text style={s.logoName}>FitAI</Text>
          <View style={s.logoDivider} />
          <Text style={s.logoTagline}>TRAINER</Text>
        </View>
        <View style={s.aiBadge}>
          <View style={s.aiBadgeDot} />
          <Text style={s.aiBadgeText}>AI Powered</Text>
        </View>
      </Animated.View>

      {/* ── Floating stat pills ── */}
      <Animated.View style={[s.statPill, s.statPillLeft, { opacity: fadeIn, top: insets.top + (IS_SMALL ? height * 0.20 : height * 0.24) }]}>
        <Ionicons name="flame" size={14} color={C.brand} />
        <Text style={s.statPillText}>Live Pose Detection</Text>
      </Animated.View>

      <Animated.View style={[s.statPill, s.statPillRight, { opacity: fadeIn, top: insets.top + (IS_SMALL ? height * 0.28 : height * 0.34) }]}>
        <Ionicons name="trophy" size={14} color={C.gold} />
        <Text style={s.statPillText}>7-Day Streak 🔥</Text>
      </Animated.View>

      {/* ── Bottom Sheet ── */}
      <Animated.View style={[s.sheet, { opacity: fadeIn, transform: [{ translateY: slideUp }], paddingBottom: (IS_SMALL ? 24 : 42) + insets.bottom }]}>

        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map((st, i) => (
            <React.Fragment key={i}>
              <View style={s.statItem}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={s.divider} />

        {/* Headline */}
        <View style={s.headlineBlock}>
          <Text style={s.eyebrow}>AI-POWERED FITNESS</Text>
          <Text style={s.headline}>
            Train Smart.{'\n'}
            <Text style={s.headlineAccent}>Get Results.</Text>
          </Text>
          <Text style={s.subtext}>
            Real-time pose detection, personalized plans, and{'\n'}
            AI coaching — all in one place.
          </Text>
        </View>

        {/* Feature icons */}
        <View style={s.featureRow}>
          {[
            { icon: 'camera', label: 'Live Pose', color: C.brand },
            { icon: 'sparkles', label: 'AI Plans', color: C.lime },
            { icon: 'nutrition', label: 'Diet Guide', color: C.teal },
            { icon: 'stats-chart', label: 'Progress', color: C.blue },
          ].map((f, i) => (
            <View key={i} style={s.featureItem}>
              <View style={[s.featureIcon, { backgroundColor: f.color + '22', borderColor: f.color + '44' }]}>
                <Ionicons name={f.icon} size={16} color={f.color} />
              </View>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <Animated.View style={[s.ctaGroup, { opacity: btnFade, transform: [{ translateY: btnSlide }] }]}>
          <TouchableOpacity
            onPress={() => navigation.replace('Auth')}
            activeOpacity={0.88}
            style={s.primaryCTA}
          >
            <LinearGradient colors={[C.brand, C.brandDark]} style={s.primaryCTAGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryCTAText}>Start My Journey</Text>
              <View style={s.ctaArrow}>
                <Ionicons name="arrow-forward" size={16} color={C.brand} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace('Auth')}
            style={s.secondaryCTA}
            activeOpacity={0.8}
          >
            <Text style={s.secondaryCTAText}>I already have an account </Text>
            <Text style={[s.secondaryCTAText, { color: C.brand, fontWeight: '800' }]}>Sign In →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bgImage: {
    position: 'absolute', top: -20, left: 0, right: 0,
    height: IS_TABLET ? height * 0.54 : (IS_SMALL ? height * 0.56 : height * 0.62), width: '100%',
  },

  // Top bar
  topBar: {
    position: 'absolute', top: IS_SMALL ? 40 : 52, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: IS_SMALL ? 12 : 22,
  },
  logoMark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoGrad: {
    width: 32, height: 32, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  logoName: { fontSize: IS_SMALL ? 15 : 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  logoDivider: { width: 1, height: 14, backgroundColor: '#FFFFFF40', marginHorizontal: 2 },
  logoTagline: { fontSize: 10, fontWeight: '700', color: '#FFFFFF70', letterSpacing: 1.5 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF18', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF28',
  },
  aiBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.lime },
  aiBadgeText: { fontSize: IS_SMALL ? 10 : 11, fontWeight: '700', color: '#FFFFFF' },

  // Floating pills
  statPill: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.bg + 'EE', paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 24, borderWidth: 1, borderColor: C.border,
  },
  statPillLeft: { top: IS_SMALL ? height * 0.24 : height * 0.29, left: IS_SMALL ? 10 : 18 },
  statPillRight: { top: IS_SMALL ? height * 0.33 : height * 0.4, right: IS_SMALL ? 10 : 18 },
  statPillText: { fontSize: IS_SMALL ? 11 : 12, fontWeight: '700', color: C.text },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: IS_SMALL ? 24 : 34, borderTopRightRadius: IS_SMALL ? 24 : 34,
    paddingHorizontal: IS_SMALL ? 14 : 24, paddingTop: IS_SMALL ? 18 : 28, paddingBottom: IS_SMALL ? 24 : 42,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: IS_SMALL ? 12 : 18,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: IS_SMALL ? 18 : 22, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  divider: { height: 1, backgroundColor: C.border },

  // Headline
  headlineBlock: { gap: 8 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: C.brand, letterSpacing: 2 },
  headline: { fontSize: IS_TABLET ? 40 : (IS_SMALL ? 26 : 34), fontWeight: '900', color: C.text, lineHeight: IS_SMALL ? 32 : 40, letterSpacing: -0.8 },
  headlineAccent: { color: C.brand },
  subtext: { fontSize: IS_SMALL ? 12 : 13, color: C.textMuted, lineHeight: IS_SMALL ? 18 : 20, textAlign: 'left' },

  // Features
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: IS_SMALL ? 'wrap' : 'nowrap', rowGap: IS_SMALL ? 10 : 0 },
  featureItem: { alignItems: 'center', gap: 7, flex: 1 },
  featureIcon: {
    width: IS_SMALL ? 38 : 44, height: IS_SMALL ? 38 : 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  featureLabel: { fontSize: IS_SMALL ? 9 : 10, color: C.textSub, fontWeight: '700', textAlign: 'center' },

  // Buttons
  ctaGroup: { gap: 12 },
  primaryCTA: { borderRadius: 18, overflow: 'hidden', ...SHADOW.brand },
  primaryCTAGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 17, paddingHorizontal: 22,
  },
  primaryCTAText: { fontSize: IS_SMALL ? 14 : 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
  ctaArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  secondaryCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  secondaryCTAText: { fontSize: IS_SMALL ? 12 : 14, color: C.textMuted },
});

/**
 * Firebase Configuration & Database Service
 *
 * Setup steps:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project called "FitAI Trainer"
 * 3. Add a Web app, copy the config below and replace the placeholder values
 * 4. Enable Authentication (Email/Password) in Firebase Console
 * 5. Enable Firestore Database in Firebase Console (start in test mode)
 *
 * Replace the values below with your actual Firebase project config:
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Firebase Config — synced from google-services.json (Android) ────────────
// authDomain follows projectId; storageBucket matches Firebase console.
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAi5PsIrQtNoxqxRUYdzRCgTHHY8Im3Les',
  authDomain:        'fitai-trainer-1b398.firebaseapp.com',
  projectId:         'fitai-trainer-1b398',
  storageBucket:     'fitai-trainer-1b398.firebasestorage.app',
  messagingSenderId: '586940717107',
  appId:             '1:586940717107:android:b24b127073371d50dcab46',
};

// ── Initialize Firebase (avoid re-init) ──────────────────────────────────────
let app;
let db;
let auth;
let isConfigured = false;

try {
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId) {
    app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  }
} catch (e) {
  console.warn('Firebase init failed — running in offline mode', e?.message || e);
}

// ── Auth Service ──────────────────────────────────────────────────────────────
export const firebaseAuth = {
  isAvailable: () => isConfigured,

  /** Register a new user */
  register: async (name, email, password) => {
    if (!isConfigured) return { success: false, error: 'Firebase not configured' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid:       cred.user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
        plan:      'free',
      });
      await AsyncStorage.setItem('userToken', cred.user.uid);
      await AsyncStorage.setItem('userData', JSON.stringify({ name, email, uid: cred.user.uid }));
      return { success: true, uid: cred.user.uid, name, email };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /** Login existing user */
  login: async (email, password) => {
    if (!isConfigured) return { success: false, error: 'Firebase not configured' };
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await firebaseDB.getUserProfile(cred.user.uid);
      await AsyncStorage.setItem('userToken', cred.user.uid);
      const displayName = cred.user.displayName || (cred.user.email || email).split('@')[0];
      const userPayload = profile
        ? { uid: cred.user.uid, ...profile }
        : { uid: cred.user.uid, name: displayName, email: cred.user.email || email };
      await AsyncStorage.setItem('userData', JSON.stringify(userPayload));
      return { success: true, ...userPayload };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /** Logout */
  logout: async () => {
    // Always clear local session even if Firebase signOut fails
    // (important for guest/offline flows).
    try {
      if (isConfigured && auth?.currentUser) {
        await signOut(auth);
      }
    } catch (_) {
      // ignore signOut failures; local cleanup happens below
    } finally {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    }
  },

  /** Get current user UID */
  getCurrentUID: () => auth?.currentUser?.uid || null,

  /** Listen to auth state */
  onAuthChange: (callback) => {
    if (!isConfigured) return () => {};
    return onAuthStateChanged(auth, callback);
  },
};

// ── Firestore Database Service ────────────────────────────────────────────────
export const firebaseDB = {
  isAvailable: () => isConfigured,

  // ── User Profile ────────────────────────────────────────────────────────────
  getUserProfile: async (uid) => {
    if (!isConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch (_) { return null; }
  },

  updateUserProfile: async (uid, data) => {
    if (!isConfigured || !uid) return false;
    try {
      await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
      return true;
    } catch (_) { return false; }
  },

  // ── Onboarding Answers / Fitness Profile ────────────────────────────────────
  saveOnboardingAnswers: async (uid, answers) => {
    if (!isConfigured || !uid) return false;
    try {
      await setDoc(doc(db, 'users', uid, 'profile', 'fitness'), {
        ...answers,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (_) { return false; }
  },

  getOnboardingAnswers: async (uid) => {
    if (!isConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'profile', 'fitness'));
      return snap.exists() ? snap.data() : null;
    } catch (_) { return null; }
  },

  // ── Workout Sessions ────────────────────────────────────────────────────────
  saveWorkoutSession: async (uid, session) => {
    if (!isConfigured || !uid) return false;
    try {
      await addDoc(collection(db, 'users', uid, 'sessions'), {
        ...session,
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (_) { return false; }
  },

  getWorkoutSessions: async (uid, limitCount = 30) => {
    if (!isConfigured || !uid) return [];
    try {
      const q = query(
        collection(db, 'users', uid, 'sessions'),
        orderBy('timestamp', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (_) { return []; }
  },

  // ── User Stats ──────────────────────────────────────────────────────────────
  saveUserStats: async (uid, stats) => {
    if (!isConfigured || !uid) return false;
    try {
      await setDoc(doc(db, 'users', uid, 'stats', 'main'), {
        ...stats,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (_) { return false; }
  },

  getUserStats: async (uid) => {
    if (!isConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'stats', 'main'));
      return snap.exists() ? snap.data() : null;
    } catch (_) { return null; }
  },

  // ── Diet Log ────────────────────────────────────────────────────────────────
  saveDietLog: async (uid, date, log) => {
    if (!isConfigured || !uid) return false;
    try {
      await setDoc(doc(db, 'users', uid, 'dietLog', date), {
        items:     log,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (_) { return false; }
  },

  getDietLog: async (uid, date) => {
    if (!isConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'dietLog', date));
      return snap.exists() ? snap.data().items : null;
    } catch (_) { return null; }
  },

  // ── Completed Workout Days ──────────────────────────────────────────────────
  saveCompletedDays: async (uid, completedDays) => {
    if (!isConfigured || !uid) return false;
    try {
      await setDoc(doc(db, 'users', uid, 'progress', 'completedDays'), {
        days:      completedDays,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (_) { return false; }
  },

  getCompletedDays: async (uid) => {
    if (!isConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'progress', 'completedDays'));
      return snap.exists() ? snap.data().days : null;
    } catch (_) { return null; }
  },

  // ── App Preferences ─────────────────────────────────────────────────────────
  savePreferences: async (uid, prefs) => {
    if (!isConfigured || !uid) return false;
    try {
      await setDoc(doc(db, 'users', uid, 'prefs', 'app'), {
        ...prefs,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (_) { return false; }
  },
};

/**
 * ── HYBRID STORAGE HELPER ───────────────────────────────────────────────────
 * Saves to both AsyncStorage (offline) and Firestore (cloud) simultaneously.
 * This ensures the app works offline and syncs when online.
 */
export const storage = {
  /**
   * Save data: stores locally + syncs to Firebase if configured
   * @param {string} key - AsyncStorage key
   * @param {*} data - Data to save (will be JSON serialized)
   * @param {string|null} uid - Firebase user UID (optional, for cloud sync)
   * @param {function|null} firebaseSaveFn - Optional Firestore save function
   */
  set: async (key, data, uid = null, firebaseSaveFn = null) => {
    // Always save locally first
    await AsyncStorage.setItem(key, JSON.stringify(data));
    // Sync to Firebase if user is logged in and configured
    if (uid && firebaseSaveFn && isConfigured) {
      firebaseSaveFn(uid, data).catch(() => {});
    }
  },

  get: async (key) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  },
};

export { isConfigured as isFirebaseConfigured };
export default { firebaseAuth, firebaseDB, storage, isConfigured };

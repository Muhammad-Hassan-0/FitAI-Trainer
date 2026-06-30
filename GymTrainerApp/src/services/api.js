import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend URL:
// - Web / iOS simulator: localhost
// - Android emulator: 10.0.2.2
// - Physical device: set EXPO_PUBLIC_API_URL to your PC LAN IP (e.g., http://192.168.x.x:5000/api)
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:5000/api`;
const SESSION_SYNC_QUEUE_KEY = 'sessionSyncQueue';
const REQUEST_TIMEOUT_MS = 12000;
const REQUEST_RETRY_COUNT = 1;

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (method, endpoint, body = null) => {
  const url = `${BASE_URL}${endpoint}`;
  let lastError = null;
  for (let attempt = 0; attempt <= REQUEST_RETRY_COUNT; attempt += 1) {
    try {
      const headers = await getHeaders();
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);

      let response;
      // AbortSignal.timeout is not available on some Android runtimes.
      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          response = await fetch(url, { ...options, signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
      } else {
        response = await Promise.race([
          fetch(url, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)),
        ]);
      }

      if (!response.ok) {
        const text = await response.text();
        let body = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch (_) {}
        const err = new Error(body.error || `HTTP ${response.status}`);
        err.httpStatus = response.status;
        throw err;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || '');
      const retryable =
        msg.includes('Network request failed') ||
        msg.includes('The user aborted a request') ||
        msg.includes('Request timeout') ||
        msg.includes('HTTP 503');
      if (!retryable || attempt === REQUEST_RETRY_COUNT) {
        console.warn(`API Error [${endpoint}] @ ${url}:`, msg || String(error));
        throw error;
      }
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError || new Error('Unknown request error');
};

const getSyncQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const setSyncQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(SESSION_SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (_) {}
};

const enqueueSessionForSync = async (sessionData) => {
  const queue = await getSyncQueue();
  queue.push({
    ...sessionData,
    clientSavedAt: new Date().toISOString(),
  });
  await setSyncQueue(queue);
};

const flushSessionSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (!queue.length) return { flushed: 0, failed: 0 };
  const failed = [];
  let flushed = 0;

  for (const payload of queue) {
    try {
      // Conflict rule: keep the most recent client snapshot for retries.
      await request('POST', '/sessions', payload);
      flushed += 1;
    } catch (_) {
      failed.push(payload);
    }
  }
  await setSyncQueue(failed);
  return { flushed, failed: failed.length };
};

export const authAPI = {
  register: (name, email, password) =>
    request('POST', '/auth/register', { name, email: email.trim().toLowerCase(), password }),
  login: (email, password) =>
    request('POST', '/auth/login', { email: email.trim().toLowerCase(), password }),
  me: () => request('GET', '/auth/me'),
};

export const poseAPI = {
  analyzeFrame: (base64Image, exerciseId) =>
    request('POST', '/analyze-pose', { image: base64Image, exercise: exerciseId }),
};

export const planAPI = {
  generatePlan: (profile) =>
    request('POST', '/generate-plan', profile),
  getPlan: () =>
    request('GET', '/plan'),
};

export const progressAPI = {
  saveSession: async (sessionData) => {
    try {
      const res = await request('POST', '/sessions', sessionData);
      await flushSessionSyncQueue();
      return res;
    } catch (e) {
      await enqueueSessionForSync(sessionData);
      throw e;
    }
  },
  getSessions: async () => {
    await flushSessionSyncQueue();
    return request('GET', '/sessions');
  },
  getStats: async () => {
    await flushSessionSyncQueue();
    return request('GET', '/stats');
  },
  flushPendingSessions: flushSessionSyncQueue,
};

export const geminiAPI = {
  askAdvice: (message, profile = {}) =>
    request('POST', '/ai-advice', { message, profile }),

  getExerciseFeedback: (exercise, reps, accuracy, duration, profile = {}) =>
    request('POST', '/analyze-exercise-feedback', {
      exercise, reps, accuracy, duration, profile,
    }),

  analyzeImage: (imageBase64, type = 'general', note = '', language = 'English') =>
    request('POST', '/analyze-image', { image: imageBase64, type, note, language }),
};

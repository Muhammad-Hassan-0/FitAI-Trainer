import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform, Text, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExercisePlanScreen from '../screens/ExercisePlanScreen';
import LiveExerciseScreen from '../screens/LiveExerciseScreen';
import ProgressScreen from '../screens/ProgressScreen';
import DietPlanScreen from '../screens/DietPlanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import WeeklyPlanScreen from '../screens/WeeklyPlanScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  Dashboard:  { icon: 'home',        label: 'Home'     },
  WeeklyPlan: { icon: 'calendar',    label: 'Program'  },
  Diet:       { icon: 'nutrition',   label: 'Diet'     },
  Progress:   { icon: 'stats-chart', label: 'Progress' },
  Profile:    { icon: 'person',      label: 'Profile'  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadPrefs = async () => {
      try {
        const raw = await AsyncStorage.getItem('appPrefs');
        if (!mounted) return;
        if (raw) {
          const p = JSON.parse(raw);
          if (p.darkMode !== undefined) setIsDarkMode(!!p.darkMode);
        }
      } catch (_) {}
    };
    loadPrefs();
    const sub = DeviceEventEmitter.addListener('themeChanged', ({ darkMode }) => {
      setIsDarkMode(!!darkMode);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const tabBg = isDarkMode ? '#111111' : '#F8FAFF';
  const tabBorder = isDarkMode ? '#282828' : '#D7DEE9';
  const activeTint = isDarkMode ? '#FF5C2B' : '#D94010';
  const inactiveTint = isDarkMode ? '#555555' : '#6D7683';
  const activePill = isDarkMode ? '#FF5C2B20' : '#FF5C2B30';
  const tabPadBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10);
  const tabBarHeight = 52 + 8 + tabPadBottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: 1,
          paddingBottom: tabPadBottom,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const cfg = TAB_CONFIG[route.name];
          return (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? activePill : 'transparent',
              borderRadius: 10, width: 38, height: 30,
            }}>
              <Ionicons
                name={focused ? cfg.icon : `${cfg.icon}-outline`}
                size={focused ? 22 : 20}
                color={color}
              />
            </View>
          );
        },
        tabBarLabel: ({ color, focused }) => (
          <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '600', color, marginTop: 1 }}>
            {TAB_CONFIG[route.name].label}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  />
      <Tab.Screen name="WeeklyPlan" component={WeeklyPlanScreen} />
      <Tab.Screen name="Diet"       component={DietPlanScreen}   />
      <Tab.Screen name="Progress"   component={ProgressScreen}   />
      <Tab.Screen name="Profile"    component={ProfileScreen}    />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    checkInitialRoute();
    const loadPrefs = async () => {
      try {
        const raw = await AsyncStorage.getItem('appPrefs');
        if (raw) {
          const p = JSON.parse(raw);
          if (p.darkMode !== undefined) setIsDarkMode(!!p.darkMode);
        }
      } catch (_) {}
    };
    loadPrefs();
    const sub = DeviceEventEmitter.addListener('themeChanged', ({ darkMode }) => {
      setIsDarkMode(!!darkMode);
    });
    return () => sub.remove();
  }, []);

  const checkInitialRoute = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const onboardingDone = await AsyncStorage.getItem('onboardingDone');
      if (token) {
        setInitialRoute('Main');
      } else if (onboardingDone) {
        setInitialRoute('Auth');
      } else {
        setInitialRoute('Splash');
      }
    } catch {
      setInitialRoute('Splash');
    }
  };

  if (!initialRoute) {
    return (
      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDarkMode ? '#0A0A0A' : '#F1F5FB',
      }}>
        <ActivityIndicator color="#00FF88" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />

      {/* Main App */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Detail Screens */}
      <Stack.Screen
        name="ExercisePlan"
        component={ExercisePlanScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="LiveExercise"
        component={LiveExerciseScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

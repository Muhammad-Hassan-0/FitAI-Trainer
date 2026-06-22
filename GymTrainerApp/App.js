import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { applyTheme } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [NavigatorComponent, setNavigatorComponent] = useState(null);

  useEffect(() => {
    const boot = async () => {
      try {
        const raw = await AsyncStorage.getItem('appPrefs');
        const prefs = raw ? JSON.parse(raw) : {};
        const dark = prefs.darkMode !== undefined ? !!prefs.darkMode : false;
        applyTheme(dark);
        setIsDarkMode(dark);
      } catch (_) {
        applyTheme(false);
        setIsDarkMode(false);
      } finally {
        const mod = require('./src/navigation/AppNavigator');
        setNavigatorComponent(() => mod.default);
        setReady(true);
      }
    };
    boot();
  }, []);

  if (!ready || !NavigatorComponent) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? '#0A0A0A' : '#F5F7FB' }}>
        <ActivityIndicator size="large" color="#FF5C2B" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={isDarkMode ? '#0A0A0A' : '#F5F7FB'} />
        <NavigatorComponent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

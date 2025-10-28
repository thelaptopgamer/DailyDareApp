// App.js

// Ensure Firebase modules are registered early
import 'firebase/auth'; 
import 'firebase/firestore'; 

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthStack from './src/AuthStack';
import AppTabs from './src/AppTabs';
import { auth } from './src/firebaseConfig';
import { seedDares } from './src/firestoreUtils.js';
import { assignDailyDare } from './src/dailyDareUtils.js';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes (sets the user object on login/signup/relaunch)
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    // 1. Seed Dares on Startup (runs only once ever)
    seedDares();

    // 2. Set up the Firebase Auth state listener (runs on every app launch)
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    
    // Unsubscribe listener on unmount
    return subscriber; 
  }, []);

  // Assign Dare after the user logs in
  useEffect(() => {
    // This hook runs whenever the 'user' object changes or is set
    if (user) {
        // Assigns a new dare if none is assigned for today, or returns the existing one
        assignDailyDare();
    }
  }, [user]); // Dependency array: runs when 'user'

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Switch between Auth Stack and App Tabs based on user state */}
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
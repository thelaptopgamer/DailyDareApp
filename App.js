// App.js
// This file is the root component. It handles the initial connection to Firebase 
// and decides whether to show the Login/Signup screen or the Main App screens.

import 'firebase/auth'; 
import 'firebase/firestore'; 

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthStack from './src/AuthStack';
import AppTabs from './src/AppTabs';
import { auth } from './src/firebaseConfig';
import { seedDares } from './src/firestoreUtils.js'; // Used in DareHubScreen (Delayed Seeding Fix)

export default function App() {
  // 1. STATE MANAGEMENT (useState hook - IAT359_Week3, Page 54)
  const [initializing, setInitializing] = useState(true); // Tracks initial Firebase loading
  const [user, setUser] = useState(null); // Stores the user object (null if logged out)

  // Callback function for when Firebase status changes (login/logout)
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  // 2. SIDE EFFECTS (useEffect hook - IAT359_Week3, Page 46)
  useEffect(() => {
    // We use onAuthStateChanged (Firebase method) to listen for user status changes.
    // This runs after the initial render only (empty dependency array).
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    
    // Cleanup function (Important for memory management)
    return subscriber; 
  }, []);

  // 3. CONDITIONAL RENDERING (JSX)
  if (initializing) {
    // Show a loading screen while Firebase checks the user's login status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render the main navigation structure
  return (
    <NavigationContainer>
      {/* Ternary Operator (IAT359_Week3, Page 10): Switches between stacks */}
      {/* If 'user' exists, show AppTabs; otherwise, show AuthStack */}
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
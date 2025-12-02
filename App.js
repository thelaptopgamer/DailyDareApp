// App.js
// Purpose: Root component. Handles Firebase connection and switches between Auth and Main App tabs.

import 'firebase/auth';
import 'firebase/firestore';

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native'; // Removed ActivityIndicator import
import AuthStack from './src/AuthStack.js'; 
import AppTabs from './src/AppTabs.js'; 
import LoadingScreen from './src/screens/LoadingScreen.js'; // Import the new screen
import { auth } from './src/firebaseConfig.js';
import { seedDares } from './src/firestoreUtils.js';

export default function App() {
  // Tracks user's login status
  const [initializing, setInitializing] = useState(true); 
  const [user, setUser] = useState(null); 

  //Callback function for when Firebase status changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) {
        // Optional: Add a small delay so the logo doesn't just flash for 100ms
        setTimeout(() => setInitializing(false), 1500); 
    }
  }

  //Sets up the initial authentication listener
  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);


  // Show the Polished Loading Screen during initial check
  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {/* If 'user' exists, show AppTabs; otherwise, show AuthStack */}
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // No styles needed here anymore as LoadingScreen handles it
});
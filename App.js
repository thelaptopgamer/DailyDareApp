// App.js
// Purpose: Root component. Handles Firebase connection and switches between Auth and Main App tabs.

import 'firebase/auth';
import 'firebase/firestore';

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthStack from './src/AuthStack.js'; 
import AppTabs from './src/AppTabs.js'; 
import { auth } from './src/firebaseConfig.js';
import { seedDares } from './src/firestoreUtils.js';

export default function App() {
  // Tracks user's login status
  const [initializing, setInitializing] = useState(true); 
  const [user, setUser] = useState(null); 

  //Callback function for when Firebase status changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  //Sets up the initial authentication listener
  useEffect(() => {
    //onAuthStateChanged listens for user status changes
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    
    return subscriber;
  }, []);

  //Show loading screen during initial check
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
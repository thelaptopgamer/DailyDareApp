import 'firebase/auth'; 
import 'firebase/firestore'; 

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthStack from './src/AuthStack';
import AppTabs from './src/AppTabs';
import { auth } from './src/firebaseConfig';
import { seedDares } from './src/firestoreUtils.js';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {

    //Set up the Firebase Auth
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    
    return subscriber; 
  }, []);

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
//App.js
//Purpose: Root component. Wraps the app in necessary providers (like SafeAreaProvider)
//and handles authentication routing.

import 'firebase/auth';
import 'firebase/firestore';

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';

//Import custom navigation stacks and initial screen
import AuthStack from './src/AuthStack.js'; 
import AppTabs from './src/AppTabs.js'; 
import LoadingScreen from './src/screens/LoadingScreen.js'; 

//Import Firebase auth instance
import { auth } from './src/firebaseConfig.js';
import { seedDares } from './src/firestoreUtils.js';

export default function App() {
  //State to control initial loading/splash screen display
  const [initializing, setInitializing] = useState(true); 
  //State to hold the current authenticated Firebase user object
  const [user, setUser] = useState(null); 

  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) {
        setTimeout(() => setInitializing(false), 1500); 
    }
  }

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    //Wrap the entire application in SafeAreaProvider
    <SafeAreaProvider>
        <NavigationContainer>
        {/* Conditional rendering based on authentication status */}
        {user ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
});
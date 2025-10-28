// src/firebaseConfig.js
// Import the core Firebase App initialization
import 'firebase/auth';

import { initializeApp } from 'firebase/app';
// Use the specific initialization for React Native Auth
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 

// Import other services
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; 

// Your unique web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPsItrAaf-oYTj7QuUAvnvfqwhFkCBUOI",
  authDomain: "daily-dare-app-c6173.firebaseapp.com",
  projectId: "daily-dare-app-c6173",
  storageBucket: "daily-dare-app-c6173.firebasestorage.app",
  messagingSenderId: "67669187415",
  appId: "1:67669187415:web:f4bfd1e1acf09508bb3c12",
  measurementId: "G-ZW0QM3RNY7" 
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL FIX: Initialize Auth using the React Native method with AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}); 

// Initialize other Firebase services
const db = getFirestore(app); 
const storage = getStorage(app); 

// Export all services
export { app, auth, db, storage };
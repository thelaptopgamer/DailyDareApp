// src/firebaseConfig.js
// Purpose: This file initializes all necessary Firebase services for the application, 
// including Authentication, Firestore, and Cloud Storage.

// CRITICAL FIX: Explicitly import Auth functions for the modular SDK
import 'firebase/auth'; 

import { initializeApp } from 'firebase/app'; // Core app initialization
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Auth setup
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Needed for local persistence (Lecture 5)
import { getFirestore } from 'firebase/firestore'; // Firestore (Complex Data - Lecture 6)
import { getStorage } from 'firebase/storage'; // Cloud Storage (Needed for Proof of Completion media)

// Firebase configuration object (do not share these keys publicly)
const firebaseConfig = {
    // These keys are generated from the Firebase Console (Web App registration)
  apiKey: "AIzaSyCPsItrAaf-oYTj7QuUAvnvfqwhFkCBUOI",
  authDomain: "daily-dare-app-c6173.firebaseapp.com",
  projectId: "daily-dare-app-c6173",
  storageBucket: "daily-dare-app-c6173.firebasestorage.app",
  messagingSenderId: "67669187415",
  appId: "1:67669187415:web:f4bfd1e1acf09508bb3c12",
  measurementId: "G-ZW0QM3RNY7" 
};

// 1. Initialize the core Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Authentication (using the RN-specific persistence method)
const auth = initializeAuth(app, {
    // This uses AsyncStorage (Lecture 5) to keep the user logged in across app launches
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}); 

// 3. Initialize other Firebase services
const db = getFirestore(app); // Provides access to the Firestore Database
const storage = getStorage(app); // Provides access to Cloud Storage for large files (e.g., photos)

// Export all services so they can be used by screens (e.g., Login, DareHub)
export { app, auth, db, storage };
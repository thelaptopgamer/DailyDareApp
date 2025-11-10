// src/firebaseConfig.js
// Purpose: This file initializes all necessary Firebase services for the application,

import 'firebase/auth'; 

import { initializeApp } from 'firebase/app'; //Core app initialization
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; //Auth setup
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; //Needed for local persistence
import { getFirestore } from 'firebase/firestore'; //Firestore
import { getStorage } from 'firebase/storage'; //Cloud Storage

//Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCPsItrAaf-oYTj7QuUAvnvfqwhFkCBUOI",
  authDomain: "daily-dare-app-c6173.firebaseapp.com",
  projectId: "daily-dare-app-c6173",
  storageBucket: "daily-dare-app-c6173.firebasestorage.app",
  messagingSenderId: "67669187415",
  appId: "1:67669187415:web:f4bfd1e1acf09508bb3c12",
  measurementId: "G-ZW0QM3RNY7" 
};

//Initialize the core Firebase App
const app = initializeApp(firebaseConfig);

//Initialize Authentication
const auth = initializeAuth(app, {
    //Keep user logged in across restarts
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}); 

//Initialize other Firebase services
const db = getFirestore(app); //Provides access to the Firestore Database
const storage = getStorage(app); //Provides access to Cloud Storage for large files like photos

//Export all services so they can be used by our screens
export { app, auth, db, storage };
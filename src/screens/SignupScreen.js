// src/screens/SignupScreen.js
// Purpose: Handles user sign-up, creates the Firebase Auth record, and initializes the user's Firestore profile.

import React, { useState } from 'react'; // Imports React and the useState hook (IAT359_Week3, Page 36)
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator 
} from 'react-native'; // Imports core components (IAT359_Week3, Page 51-52)
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase Auth method (IAT359_Lecture6, Page 24)
import { doc, setDoc } from 'firebase/firestore'; // Firestore CRUD methods (IAT359_Lecture6, Page 30)
import { auth, db } from '../firebaseConfig'; // Your Firebase connection objects
import { useNavigation } from '@react-navigation/native'; // Hook for navigation
import { assignDailyDare } from '../dailyDareUtils'; // Function to assign the 3 daily dares

const SignupScreen = () => {
    // STATE: Manages user input and UI loading status
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    // ASYNC FUNCTION: Handles the entire sign-up process (IAT359_Week3, Page 45)
    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        // TRY/CATCH: Used for robust error handling of async operations (IAT359_Lecture7, Page 13)
        try {
            // 1. FIREBASE AUTHENTICATION: Creates the user's secure login record
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. FIRESTORE: Creates the user's data document (Collections/Documents - IAT359_Lecture6, Page 30)
            const userDocRef = doc(db, 'Users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                score: 0,
                rerollTokens: 2, 
                daresCompletedCount: 0,
                createdAt: new Date().toISOString(),
                dailyDares: [],
                onboardingComplete: false, // User must go through FTUE
            });
            
            // 3. FINAL SETUP: Assigns the 3 unique dares (Required for first-time signups)
            await assignDailyDare(); 
            
            console.log("User signed up and profile initialized.");

        } catch (error) {
            Alert.alert("Signup Failed", error.message);
            console.error("Signup error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        // FLEXBOX: ScrollView allows content to scroll and uses flexGrow: 1
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Your DareHub Account</Text>

            {/* EMAIL INPUT (Core Component - IAT359_Week3, Page 51-52) */}
            <TextInput
                style={styles.input}
                placeholder="Email" 
                value={email}
                onChangeText={setEmail} // Updates 'email' state
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
            />

            {/* PASSWORD INPUT */}
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword} // Updates 'password' state
                secureTextEntry
                placeholderTextColor="#A0A0A0"
            />

            {/* SIGN UP BUTTON */}
            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                {/* Ternary Operator: Show spinner if loading */}
                <Text style={styles.buttonText}>{loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}</Text>
            </TouchableOpacity>
            
            {/* NAVIGATION LINK */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// STYLESHEET: Centralized styling using JavaScript objects (IAT359_Week3, Page 22)
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    button: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    loginText: {
        marginTop: 10,
        color: '#007AFF',
        fontSize: 16,
    }
});

export default SignupScreen;
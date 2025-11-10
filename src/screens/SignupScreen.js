//src/screens/SignupScreen.js
//Purpose: Handles user sign-up, creates the Firebase Auth record, and initializes the user's Firestore profile.

import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { assignDailyDare } from '../dailyDareUtils'; //Function to assign the 3 daily dares

const SignupScreen = () => {
    //Manages user input and UI loading status
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    //Handles the entire sign-up process
    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            //FIREBASE AUTHENTICATION: Creates the user's secure login record
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            //FIRESTORE: Creates the user's data document
            const userDocRef = doc(db, 'Users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                score: 0,
                rerollTokens: 2, 
                daresCompletedCount: 0,
                createdAt: new Date().toISOString(),
                dailyDares: [],
                onboardingComplete: false,
            });
            
            //FINAL SETUP: Assigns the 3 unique dares
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
        //ScrollView allows content to scroll
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Your DareHub Account</Text>

            {/* EMAIL INPUT */}
            <TextInput
                style={styles.input}
                placeholder="Email" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
            />

            {/* PASSWORD INPUT */}
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#A0A0A0"
            />

            {/* SIGN UP BUTTON */}
            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                {/* Show spinner if loading */}
                <Text style={styles.buttonText}>{loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}</Text>
            </TouchableOpacity>
            
            {/* NAVIGATION LINK */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// STYLESHEET
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
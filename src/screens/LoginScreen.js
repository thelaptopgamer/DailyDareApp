// src/screens/LoginScreen.js
// This screen handles user sign-in using Firebase Authentication.

import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
    //Manages user input and UI loading status
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    //Handles the sign-in process
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in both Email and Password.");
            return;
        }
        setLoading(true);
        try {
            //FIREBASE AUTHENTICATION: Signs the user in
            await signInWithEmailAndPassword(auth, email, password);
            
            console.log("User logged in successfully.");
            //Navigation to the main app is handled in App.js

        } catch (error) {
            Alert.alert("Login Error", error.message);
            console.error("Login Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Daily Dare App</Text>

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

            {/* LOGIN BUTTON */}
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? <ActivityIndicator color="#fff" /> : 'Log In'}</Text>
            </TouchableOpacity>

            {/* GO TO SIGNUP */}
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupText}>New User?</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

//STYLESHEET
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
    signupText: {
        marginTop: 10,
        color: '#007AFF',
        fontSize: 16,
    }
});

export default LoginScreen;
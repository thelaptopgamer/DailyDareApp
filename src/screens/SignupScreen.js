// src/screens/SignupScreen.js
// Purpose: High-Fidelity Signup Screen matching the Login style.

import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { assignDailyDare } from '../dailyDareUtils';

const SignupScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

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
            
            await assignDailyDare(); 
            console.log("User signed up.");
        } catch (error) {
            Alert.alert("Signup Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                <View style={styles.headerContainer}>
                    <Text style={styles.appTitle}>Join the Challenge</Text>
                    <Text style={styles.tagline}>Start your daily dare journey today.</Text>
                </View>

                <View style={styles.card}>
                    {/* EMAIL */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* PASSWORD */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* SIGN UP BUTTON */}
                    <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* NAVIGATION LINK */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#007AFF' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    
    headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
    appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
    tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: '100%', color: '#333', fontSize: 16 },

    signupButton: {
        backgroundColor: '#4CAF50', // Green for Signup
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
    loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 5, textDecorationLine: 'underline' },
});

export default SignupScreen;
//src/screens/LoginScreen.js
//Handles user authentication via Firebase Auth.
//Features a high-fidelity UI with consistent branding and error handling.

import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    //Processes the login request
    const handleLogin = async () => {
        //Validation
        if (!email || !password) {
            Alert.alert("Missing Info", "Please fill in both Email and Password.");
            return;
        }
        
        setLoading(true);
        
        //Authentication Attempt
        try {
            await signInWithEmailAndPassword(auth, email, password);
            //On success, the onAuthStateChanged listener in App.js will handle redirection.
            console.log("User logged in successfully.");
        } catch (error) {
            Alert.alert("Login Failed", "Incorrect email or password.");
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
                
                {/* Branding Section: Logo and Tagline */}
                <View style={styles.headerContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="flash" size={50} color="#007AFF" />
                    </View>
                    <Text style={styles.appTitle}>IGNITE</Text>
                    <Text style={styles.tagline}>Challenge Your Limits</Text>
                </View>

                {/* Login Form Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Welcome Back</Text>

                    {/* Email Input */}
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

                    {/* Password Input */}
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

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Log In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer: Navigation to Signup */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.signupText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#007AFF' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    
    headerContainer: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
    iconCircle: {
        backgroundColor: '#fff',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    appTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
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
    cardHeader: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    
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

    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
    signupText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 5, textDecorationLine: 'underline' },
});

export default LoginScreen;
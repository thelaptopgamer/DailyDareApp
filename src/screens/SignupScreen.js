// src/screens/SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

export default function SignupScreen({ navigation }) {
  // Step 6: Implement State for User Input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 14: Define the sign-up function using Firebase
  const handleSignUp = async () => {
    if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long.");
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match!");
        return;
    }

    try {
        // 1. Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;
        
        // 2. Step 17 requirement: Create initial user data in Firestore (Users Collection)
        await setDoc(doc(db, "Users", user.uid), {
            uid: user.uid,
            email: user.email,
            points: 0,
            streak: 0,
            hard_dares_completed: 0,
            achievements: [],
            // Add other initial gamification/profile fields here
        });

        console.log("User account created and profile saved:", user.email);
        // The App.js listener (Step 15) handles the navigation to the main tabs automatically.
        
    } catch (error) {
        // Display any Firebase errors (e.g., email already in use, invalid email format)
        Alert.alert("Signup Error", error.message);
        console.error("Signup Error:", error.message);
    }
  };

  return (
    // Step 7: Basic Flexbox Styling
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {/* Confirm Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Main Sign Up Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Navigation back to Login Screen (Your decision applied) */}
      <TouchableOpacity 
        style={styles.navLink} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.navLinkText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  navLink: {
    marginTop: 10,
  },
  navLinkText: {
    color: '#007AFF',
    fontSize: 16,
  }
});
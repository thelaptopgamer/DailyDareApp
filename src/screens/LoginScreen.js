// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebaseConfig'; // Import the Firebase auth object
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import the Firebase sign-in function

export default function LoginScreen({ navigation }) {
  // Step 6: Implement State for User Input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 14: Define the sign-in function using Firebase
  const handleLogin = async () => {
    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        console.log("User logged in:", email);
        // The App.js listener (Step 15) handles the navigation switch automatically.
    } catch (error) {
        // Display any Firebase errors (e.g., wrong password, user not found)
        Alert.alert("Login Error", error.message);
        console.error("Login Error:", error.message);
    }
  };

  return (
    // Step 7: Basic Flexbox Styling
    <View style={styles.container}>
      <Text style={styles.title}>Daily Dare App</Text>

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
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Main Login Button (Your decision: "Log In") */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {/* Navigation to Signup Screen (Your decision: "New User?") */}
      <TouchableOpacity 
        style={styles.navLink} 
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={styles.navLinkText}>New User?</Text>
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
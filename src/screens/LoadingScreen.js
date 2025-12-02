//src/screens/LoadingScreen.js
//Displays the initial branding and loading state while the app initializes authentication.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

const LoadingScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Brand Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="flash" size={80} color="#fff" />
                </View>

                {/* App Name and Tagline */}
                <Text style={styles.title}>IGNITE</Text>
                <Text style={styles.subtitle}>Challenge Your Limits</Text>

                {/* Loading Indicator */}
                <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
                
                <Text style={styles.loadingText}>Igniting...</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#007AFF', //Primary brand color
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.2)', //Semi-transparent white backing
        borderRadius: 50,
        padding: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2, 
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 50,
        marginTop: 5,
        fontStyle: 'italic',
    },
    spinner: {
        marginBottom: 20,
    },
    loadingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoadingScreen;
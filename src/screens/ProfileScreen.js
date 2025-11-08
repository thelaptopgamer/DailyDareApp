// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ProfileScreen = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const userEmail = auth.currentUser?.email;

    //Get user data
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'Users', user.uid);

        //Sets up a real-time listener for the user's document
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                setUserData(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setLoading(false);
            Alert.alert("Error", "Could not fetch profile data.");
        });

        return () => unsubscribe();
    }, []);

    //Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Logout Failed", "There was an issue logging you out.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Your Profile</Text>

                {/* Account Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userEmail || 'N/A'}</Text>
                </View>

                {/* Score Card */}
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Total Points Earned</Text>
                    <Text style={styles.scoreValue}>🏆 {userData?.score || 0}</Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    //Info Card
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    infoLabel: {
        fontSize: 14,
        color: '#777',
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    //Score Card
    scoreCard: {
        backgroundColor: '#E6F0FF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    scoreLabel: {
        fontSize: 16,
        color: '#007AFF',
        marginBottom: 5,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    scoreValue: {
        fontSize: 40,
        fontWeight: '900',
        color: '#333',
    },
    //Logout Button
    logoutButton: {
        marginTop: 'auto',
        backgroundColor: '#FF6347',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default ProfileScreen;
// src/screens/ProfileScreen.js
// Purpose: Displays the user's profile information, score, and handles logout functionality.

import React, { useState, useEffect } from 'react'; // Imports React and core hooks
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore'; // Firestore Real-Time Listener (Lecture 6)
import { signOut } from 'firebase/auth'; // Firebase Auth method (Lecture 6)

const ProfileScreen = () => {
    // STATE: Manages user data and UI loading status (useState hook)
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const userEmail = auth.currentUser?.email;
    const displayName = userEmail ? userEmail.split('@')[0] : 'Guest'; // Simple display name fallback

    // SIDE EFFECT: Gets and listens for real-time updates to user data (useEffect hook)
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'Users', user.uid);

        // onSnapshot: Sets up a real-time listener (Data sync - Lecture 6)
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // Update state when data changes (triggers re-render)
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

        // CLEANUP: Stop listening when the component unmounts (memory management)
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs once on mount

    // ASYNC FUNCTION: Handles user logout (async/await - Lecture 6)
    const handleLogout = async () => {
        try {
            await signOut(auth); // Firebase Auth sign-out method
        } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Logout Failed", "There was an issue logging you out.");
        }
    };

    // CONDITIONAL RENDERING: Shows spinner if data is still loading
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // TERNARY OPERATOR: Safely read stats from userData or default to 0
    const userScore = userData?.score || 0;
    const rerollCount = userData?.rerollTokens || 0;
    const daresCompletedCount = userData?.daresCompletedCount || 0;


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                <View style={styles.headerContainer}>
                    <Text style={styles.profileHeader}>My Profile</Text>
                    <Text style={styles.usernameText}>{displayName}</Text>
                </View>

                <View style={styles.statsContainer}>
                    {/* STAT BLOCK 1: TOTAL SCORE */}
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userScore}</Text>
                        <Text style={styles.statLabel}>Total Points</Text>
                    </View>
                    
                    {/* STAT BLOCK 2: REROLLS */}
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{rerollCount}</Text>
                        <Text style={styles.statLabel}>Rerolls Available</Text>
                    </View>
                    
                    {/* STAT BLOCK 3: COMPLETED DARES */}
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{daresCompletedCount}</Text>
                        <Text style={styles.statLabel}>Dares Completed</Text>
                    </View>
                </View>

                {/* LOGOUT BUTTON */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// STYLESHEET: Centralized styling (IAT359_Week3, Page 22)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    profileHeader: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    usernameText: {
        fontSize: 18,
        color: '#777',
        marginTop: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 50,
    },
    statBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%', 
        aspectRatio: 1, 
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#555',
        marginTop: 5,
        textAlign: 'center',
    },
    logoutButton: {
        width: '90%',
        backgroundColor: '#FF3B30', 
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default ProfileScreen;
// src/screens/DareHubScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics'; // <-- NEW IMPORT
import { completeDailyDare, rerollDailyDare, useSkipToGainReroll } from '../dailyDareUtils'; 

const DareHubScreen = () => {
    const [dailyDares, setDailyDares] = useState([]); 
    const [score, setScore] = useState(0); 
    const [rerollCount, setRerollCount] = useState(0); 
    const [loading, setLoading] = useState(true);
    
    // ... (useEffect remains the same) ...
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'Users', user.uid);
        
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                setDailyDares(userData.dailyDares || []); 
                setScore(userData.score || 0); 
                setRerollCount(userData.rerollCount || 0); 
            } else {
                setDailyDares([]);
                setScore(0);
                setRerollCount(0);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
            Alert.alert("Error", "Could not fetch your daily dare data.");
        });

        return () => unsubscribe();
    }, []); 

    // Completion handler is updated to pass ID and Points
    const handleComplete = (dareId, points) => async () => {
         Alert.alert(
            "Confirm Completion", 
            `Are you ready to claim ${points} points for this dare?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Complete", 
                    onPress: async () => {
                        const success = await completeDailyDare(dareId, points);
                        
                        if (success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // <-- HAPTIC SUCCESS
                            Alert.alert("Dare Completed!", `You earned ${points} points!`);
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // <-- HAPTIC ERROR
                            Alert.alert("Error", "Could not mark dare as complete or it was already completed.");
                        }
                    },
                    style: 'default'
                }
            ]
        );
    };

    // Reroll handler is updated to pass the specific dare's ID
    const handleReroll = (dareId) => async () => {
        
        if (rerollCount <= 0) {
            Alert.alert("Reroll Failed", "You have no rerolls left today.");
            return;
        }

        Alert.alert(
            "Confirm Reroll", 
            `Are you sure you want to use 1 reroll? You have ${rerollCount} left.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reroll", 
                    onPress: async () => {
                        const result = await rerollDailyDare(dareId);
                        
                        if (result.success) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // <-- HAPTIC IMPACT
                            Alert.alert("Success!", result.message);
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // <-- HAPTIC ERROR
                            Alert.alert("Reroll Failed", result.message);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // Skip/Reroll Exchange Handler
    const handleSkip = async () => {
        Alert.alert(
            "Use Skip Token", 
            "Use one Skip Token to gain one extra Reroll?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Confirm", 
                    onPress: async () => {
                        const result = await useSkipToGainReroll();
                        if (result.success) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // <-- HAPTIC IMPACT
                            Alert.alert("Success!", result.message);
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert("Failed", result.message);
                        }
                    },
                    style: 'default'
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }
    
    if (dailyDares.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>No dares assigned for today. Please check back later.</Text>
            </View>
        );
    }

    // ... (The rest of the component remains the same) ...
    return (
        <SafeAreaView style={styles.safeArea}> 
            <ScrollView style={styles.scrollViewContainer}>
                
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Total Score</Text>
                    <Text style={styles.scoreValue}>🏆 {score} Points</Text>
                </View>
                
                <Text style={styles.header}>Today's Challenges ({dailyDares.length})</Text>

                {/* RENDER DARE CARDS FROM ARRAY */}
                {dailyDares.map((dare, index) => (
                    <View 
                        key={dare.dareId}
                        style={[styles.dareCard, dare.completed && styles.dareCompleted]}
                    >
                        <Text style={styles.dareTitle}>Dare #{index + 1}: {dare.title}</Text>
                        <Text style={styles.dareDescription}>{dare.description}</Text>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.darePoints}>
                                + {dare.points} Points
                            </Text>
                            <Text style={styles.dareStatus}>
                                Status: {dare.completed ? '✅ Completed' : '⏳ Pending'}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        {!dare.completed && (
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity 
                                    style={styles.completeButton} 
                                    onPress={handleComplete(dare.dareId, dare.points)} 
                                >
                                    <Text style={styles.buttonText}>Complete Dare</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.rerollButton, rerollCount === 0 && styles.rerollDisabled]} 
                                    onPress={handleReroll(dare.dareId)} 
                                    disabled={rerollCount === 0}
                                >
                                    <Text style={styles.rerollText}>Reroll ({rerollCount})</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
                
                {/* Skip/Reroll Info */}
                <View style={styles.localInfo}>
                    <Text style={styles.localInfoText}>You currently have {rerollCount} rerolls available.</Text>
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipButton}>Use a Skip (+1 Reroll)</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView> 
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollViewContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreCard: {
        backgroundColor: '#E6F0FF', 
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 10, 
        marginBottom: 25,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1, 
        borderColor: '#007AFF', 
    },
    scoreLabel: {
        fontSize: 14,
        color: '#007AFF', 
        marginBottom: 5,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#333',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    dareCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF',
    },
    dareCompleted: {
        borderLeftColor: '#4CAF50',
    },
    dareTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    dareDescription: {
        fontSize: 16,
        color: '#555',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    darePoints: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007AFF',
    },
    dareStatus: {
        fontSize: 14,
        color: '#777',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    completeButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    rerollButton: {
        backgroundColor: '#FF6347',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    rerollDisabled: { 
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rerollText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    localInfo: {
        padding: 15,
        backgroundColor: '#eee',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    localInfoText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    skipButton: {
        fontSize: 14,
        color: '#007AFF',
        textDecorationLine: 'underline',
    }
});

export default DareHubScreen;
// src/screens/OnboardingScreen.js
// Purpose: Implements the First Time User Experience (FTUE) with a multi-step questionnaire and overview.
// This screen runs conditionally, based on the 'onboardingComplete' field in Firestore.

import React, { useState } from 'react'; // Imports React and useState hook (Lecture 3)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore'; // Firestore write method (Lecture 6)

const OnboardingScreen = () => {
    // STATE: Tracks the current step in the questionnaire flow
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const totalSteps = 3; 

    // ASYNC FUNCTION: Marks onboarding as complete in the user's Firestore profile
    const finishOnboarding = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        const userDocRef = doc(db, 'Users', user.uid);
        
        try {
            // FIRESTORE UPDATE: Sets the 'onboardingComplete' flag to true
            await updateDoc(userDocRef, {
                onboardingComplete: true,
            });
            console.log("Onboarding marked complete for user.");
        } catch (error) {
            console.error("Error marking onboarding complete:", error);
            Alert.alert("Error", "Could not save your preferences.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Content Based on Step (Conditional Rendering) ---
    const renderQuestionnaire = () => {
        if (step === 1) {
            return (
                <View style={styles.card}>
                    <Text style={styles.stepTitle}>Step 1: Your Focus (Personalization)</Text>
                    <Text style={styles.stepText}>What area of growth interests you most? This is used to suggest personalized dares.</Text>
                    
                    <Text style={styles.tipText}>[Selection buttons (Social, Fitness, Creative) will go here. Click Next to proceed.]</Text>
                </View>
            );
        } else if (step === 2) {
            return (
                <View style={styles.card}>
                    <Text style={styles.stepTitle}>Step 2: App Overview & Rules</Text>
                    <Text style={styles.stepText}>The Daily Dare App works by providing 3 balanced challenges (Easy/Medium/Hard) per day to disrupt monotony.</Text>
                    <Text style={styles.stepDetail}>- Max daily score potential is **300 points** (50 + 100 + 150).</Text>
                    <Text style={styles.stepDetail}>- You receive **2 free rerolls** daily. Extra rerolls cost 50 points.</Text>
                </View>
            );
        } else if (step === totalSteps) {
            return (
                <View style={styles.card}>
                    <Text style={styles.stepTitle}>Final Step: Ready to Start?</Text>
                    <Text style={styles.stepText}>Your account is set up and your first three personalized dares are waiting!</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Welcome to Daily Dare App!</Text>
                
                {renderQuestionnaire()}

                <View style={styles.buttonRow}>
                    {/* BACK Button */}
                    {step > 1 && (
                        <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)} disabled={loading}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* NEXT Button (Disabled on final step) */}
                    {step < totalSteps && (
                        <TouchableOpacity style={[styles.nextButton, step === 1 && { width: '100%' }]} onPress={() => setStep(step + 1)} disabled={loading}>
                            <Text style={styles.nextButtonText}>Next ({step}/{totalSteps})</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* START DARING Button (Only shows on final step) */}
                    {step === totalSteps && (
                        <TouchableOpacity style={[styles.startButton, { width: '80%' }]} onPress={finishOnboarding} disabled={loading}>
                            <Text style={styles.buttonText}>{loading ? <ActivityIndicator color="#fff" /> : 'Start Daring!'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// STYLESHEET: Uses Flexbox properties for centering and layout (Lecture 3)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f4f7' },
    scrollContainer: { flexGrow: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#007AFF' },
    card: { backgroundColor: '#fff', padding: 25, borderRadius: 10, width: '100%', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    stepText: { fontSize: 16, marginBottom: 10, lineHeight: 24, color: '#555' },
    stepDetail: { fontSize: 14, marginLeft: 15, color: '#777', marginBottom: 5 },
    tipText: { fontSize: 14, color: '#FF6347', marginTop: 10, fontStyle: 'italic' },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 20 }, 
    
    // Button Styles
    nextButton: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
    nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    backButton: { backgroundColor: '#ccc', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 15 },
    backButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
    startButton: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default OnboardingScreen;
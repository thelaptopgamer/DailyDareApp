//src/screens/OnboardingScreen.js
//Handles the initial user setup wizard.
//Collects user interests and explains the game rules before entering the main app.

import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

//Available interest tags for personalization logic
const INTEREST_TAGS = [
    "Social", "Fitness", "Creative", "Health", 
    "Habit", "Productivity", "Discomfort", "Environment",
    "Knowledge", "Discipline"
];

const OnboardingScreen = () => {
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]); 
    const totalSteps = 3; 

    //Toggles a tag in the selected array
    const toggleInterest = (tag) => {
        if (selectedInterests.includes(tag)) {
            setSelectedInterests(selectedInterests.filter(t => t !== tag));
        } else {
            setSelectedInterests([...selectedInterests, tag]);
        }
    };

    //Finalizes setup: Saves preferences to Firestore and marks onboarding as complete
    const finishOnboarding = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        const userDocRef = doc(db, 'Users', user.uid);
        
        try {
            await updateDoc(userDocRef, {
                onboardingComplete: true, //Triggers the App.js listener to switch stacks
                interests: selectedInterests, 
            });
        } catch (error) {
            console.error("Onboarding Error:", error);
            Alert.alert("Error", "Could not save your preferences. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    //Renders the specific content for the current step
    const renderContent = () => {
        //Interest Selection
        if (step === 1) {
            return (
                <View>
                    <Text style={styles.cardHeader}>Step 1: Your Focus</Text>
                    <Text style={styles.cardText}>
                        Select areas you want to improve. We'll prioritize dares that match these tags.
                    </Text>
                    
                    <View style={styles.tagContainer}>
                        {INTEREST_TAGS.map((tag) => {
                            const isSelected = selectedInterests.includes(tag);
                            return (
                                <TouchableOpacity 
                                    key={tag} 
                                    style={[styles.tagButton, isSelected && styles.tagButtonSelected]}
                                    onPress={() => toggleInterest(tag)}
                                >
                                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                        {tag}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            );
        } 
        //Rules & Mechanics
        else if (step === 2) {
            return (
                <View>
                    <Text style={styles.cardHeader}>Step 2: How it Works</Text>
                    <Text style={styles.cardText}>
                        You get 3 balanced challenges every day (Easy, Medium, Hard).
                    </Text>
                    
                    {/* Feature: Points */}
                    <View style={styles.ruleBox}>
                        <View style={[styles.iconBox, {backgroundColor: '#FFF8E1'}]}>
                            <Ionicons name="trophy" size={24} color="#FFD700" />
                        </View>
                        <View>
                            <Text style={styles.ruleTitle}>Earn Points</Text>
                            <Text style={styles.ruleDesc}>Max 300 points daily.</Text>
                        </View>
                    </View>

                    {/* Feature: Rerolls */}
                    <View style={styles.ruleBox}>
                        <View style={[styles.iconBox, {backgroundColor: '#E6F0FF'}]}>
                            <Ionicons name="dice" size={24} color="#007AFF" />
                        </View>
                        <View>
                            <Text style={styles.ruleTitle}>Rerolls</Text>
                            <Text style={styles.ruleDesc}>2 Free swaps per day.</Text>
                        </View>
                    </View>

                    {/* Feature: Community */}
                    <View style={styles.ruleBox}>
                        <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                            <Ionicons name="people" size={24} color="#4CAF50" />
                        </View>
                        <View>
                            <Text style={styles.ruleTitle}>Community</Text>
                            <Text style={styles.ruleDesc}>Compete on the leaderboard.</Text>
                        </View>
                    </View>
                </View>
            );
        } 
        //Completion
        else if (step === totalSteps) {
            return (
                <View style={{alignItems: 'center'}}>
                    <Ionicons name="rocket" size={60} color="#007AFF" style={{marginBottom: 20}} />
                    <Text style={styles.cardHeader}>All Set!</Text>
                    <Text style={styles.cardText}>
                        Your profile is ready. Your first set of dares is waiting for you on the Dashboard.
                    </Text>
                    <Text style={[styles.cardText, {fontWeight: 'bold', color: '#333'}]}>
                        "Growth happens outside your comfort zone."
                    </Text>
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                {/* Header Branding */}
                <View style={styles.headerContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="flash" size={40} color="#007AFF" />
                    </View>
                    <Text style={styles.appTitle}>Welcome Aboard</Text>
                    <Text style={styles.tagline}>Let's personalize your experience.</Text>
                </View>

                {/* Main Content Card */}
                <View style={styles.card}>
                    {renderContent()}

                    {/* Navigation Buttons (Back / Next / Finish) */}
                    <View style={styles.buttonRow}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)} disabled={loading}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        
                        {step < totalSteps ? (
                            <TouchableOpacity 
                                style={[styles.actionButton, step === 1 && { width: '100%' }]} 
                                onPress={() => setStep(step + 1)} 
                                disabled={loading}
                            >
                                <Text style={styles.actionButtonText}>Next Step</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.startButton, { width: '100%' }]} 
                                onPress={finishOnboarding} 
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Start Daring!</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Step Indicators */}
                <View style={styles.dotsContainer}>
                    {[1, 2, 3].map((s) => (
                        <View key={s} style={[styles.dot, step === s && styles.activeDot]} />
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#007AFF' },
    scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },

    headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
    iconCircle: {
        backgroundColor: '#fff',
        width: 70, height: 70, borderRadius: 35,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 5,
    },
    appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },

    // Card Styling
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
        marginBottom: 30,
    },
    cardHeader: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
    cardText: { fontSize: 16, color: '#666', lineHeight: 24, textAlign: 'center', marginBottom: 20 },

    // Tag Selection
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    tagButton: { 
        backgroundColor: '#f5f5f5', 
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25, 
        borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center'
    },
    tagButtonSelected: { backgroundColor: '#007AFF', borderColor: '#0056b3' },
    tagText: { color: '#555', fontWeight: '600', fontSize: 14 },
    tagTextSelected: { color: '#fff' },

    //Rules Styling
    ruleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    iconBox: { padding: 10, borderRadius: 10, marginRight: 15 },
    ruleTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    ruleDesc: { fontSize: 14, color: '#777' },

    //Buttons
    buttonRow: { flexDirection: 'row', marginTop: 20, gap: 15, justifyContent: 'center' },
    actionButton: { flex: 1, backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    startButton: { flex: 1, backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
    backButton: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 12, alignItems: 'center', minWidth: 80 },
    
    actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    backButtonText: { color: '#555', fontWeight: 'bold', fontSize: 16 },

    //Progress Dots
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
    activeDot: { backgroundColor: '#fff', width: 25 },
});

export default OnboardingScreen;
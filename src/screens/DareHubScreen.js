// src/screens/DareHubScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

// --- IMPORTS ---
import DareGenerator from '../DareGenerator'; 
import { rerollDailyDare, useSkipToGainReroll } from '../dailyDareUtils';

const DareHubScreen = ({ navigation }) => {
  const [dailyDares, setDailyDares] = useState([]);
  const [score, setScore] = useState(0);
  const [rerollTokens, setRerollTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- FIRESTORE LISTENER ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'Users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setDailyDares(userData.dailyDares || []);
          setScore(userData.score || 0);
          setRerollTokens(userData.rerollTokens || 0);
        } else {
          setDailyDares([]);
          setScore(0);
          setRerollTokens(0);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user document:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not fetch your daily dare data.');
      }
    );
    return () => unsubscribe();
  }, []);

  // --- HANDLERS ---
  const navigateToDetail = (dare) => {
    navigation.navigate('DareDetail', { dare: dare });
  };

  const handleReroll = async (dareIdToReroll) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (rerollTokens <= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Error);
      Alert.alert('No Reroll Tokens', 'You are out of free reroll tokens.');
      return;
    }

    const result = await rerollDailyDare(dareIdToReroll);
    if (result.success) {
      Alert.alert('Reroll Success!', result.message);
    } else {
      Alert.alert('Reroll Failed', result.message);
    }
  };

  const handlePurchaseReroll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (score < 50) {
      Alert.alert('Not Enough Points', 'You need 50 points.');
      return;
    }
    Alert.alert(
      'Confirm Purchase',
      'Spend 50 points for a token?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spend 50',
          onPress: async () => {
            await useSkipToGainReroll();
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContainer}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Total Score</Text>
          <Text style={styles.scoreValue}>{score} Points</Text>
        </View>

        <Text style={styles.header}>Today's Challenges</Text>

        {/* 1. DAILY DARES LIST */}
        {dailyDares.map((dare, index) => (
          <View key={index} style={[styles.dareCard, dare.completed && styles.dareCompleted]}>
            <Text style={styles.dareTitle}>Dare #{index + 1}: {dare.title}</Text>
            <Text style={styles.dareDescription}>{dare.description}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.darePoints}>+ {dare.points} Points</Text>
              <Text style={styles.dareStatus}>{dare.completed ? 'Completed' : 'Pending'}</Text>
            </View>

            {!dare.completed && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.completeButton} onPress={() => navigateToDetail(dare)}>
                  <Text style={styles.buttonText}>View & Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.rerollButton, rerollTokens === 0 && styles.rerollDisabled]}
                  onPress={() => handleReroll(dare.dareId)}
                  disabled={rerollTokens === 0}
                >
                  <Text style={styles.rerollText}>Reroll ({rerollTokens})</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* 2. AI GENERATOR SECTION (Fixed Position) */}
        <View style={styles.aiSection}>
            <Text style={styles.subHeader}>✨ AI Challenge Generator</Text>
            <Text style={styles.aiDescription}>Need something fresh? Ask Gemini for a dare.</Text>
            <DareGenerator /> 
        </View>

        {/* 3. PURCHASE BUTTON */}
        <TouchableOpacity 
          style={[styles.purchaseButton, score < 50 && styles.purchaseButtonDisabled]}
          onPress={handlePurchaseReroll}
          disabled={score < 50}
        >
          <Text style={styles.purchaseButtonText}>Purchase Reroll Token</Text>
          <Text style={styles.purchaseButtonSubText}>Cost: 50 Points</Text>
        </TouchableOpacity>
        
        <View style={{height: 40}} /> 
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5ff' },
  scrollViewContainer: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreCard: { backgroundColor: '#E6F0FF', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10, marginBottom: 25, borderWidth: 1, borderColor: '#007AFF' },
  scoreLabel: { fontSize: 14, color: '#007AFF', fontWeight: '700' },
  scoreValue: { fontSize: 32, fontWeight: '900', color: '#333' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  
  // AI Section Styles
  aiSection: { marginVertical: 30, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 20 },
  subHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  aiDescription: { fontSize: 14, color: '#666', marginBottom: 15 },

  dareCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#007AFF', elevation: 3 },
  dareCompleted: { borderLeftColor: '#4CAF50', opacity: 0.7 },
  dareTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  dareDescription: { fontSize: 16, color: '#555', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  darePoints: { fontSize: 18, fontWeight: '600', color: '#007AFF' },
  dareStatus: { fontSize: 14, color: '#777', fontStyle: 'italic' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  completeButton: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  rerollButton: { backgroundColor: '#FF6347', padding: 15, borderRadius: 8, alignItems: 'center' },
  rerollDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  rerollText: { color: '#fff', fontWeight: 'bold' },
  purchaseButton: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  purchaseButtonDisabled: { backgroundColor: '#ccc' },
  purchaseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  purchaseButtonSubText: { color: '#fff', fontSize: 14, opacity: 0.8, marginTop: 5 },
});

export default DareHubScreen;
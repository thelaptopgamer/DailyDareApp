//DareHubScreen.js
//Purpose: Displays the daily dares, score, and initiates the Proof Submission navigation path.

import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,Alert,ActivityIndicator,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

//Import logic functions
import {rerollDailyDare,useSkipToGainReroll,} from '../dailyDareUtils';

const DareHubScreen = ({ navigation }) => {
  const [dailyDares, setDailyDares] = useState([]);
  const [score, setScore] = useState(0);
  const [rerollTokens, setRerollTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  //Listens to Firestore for user data changes
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

  //Function to navigate to the Dare Detail screen
  const navigateToDetail = (dare) => {
    navigation.navigate('DareDetail', { dare: dare });
  };

  //Checks for tokens before calling the utility
  const handleReroll = async (dareIdToReroll) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (rerollTokens <= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Error);
      Alert.alert(
        'No Reroll Tokens',
        'You are out of free reroll tokens. Please purchase one using your points.'
      );
      return;
    }

    const result = await rerollDailyDare(dareIdToReroll);

    if (result.success) {
      Alert.alert('Reroll Success!', result.message);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Error);
      Alert.alert('Reroll Failed', result.message);
    }
  };

  //Shows confirmation alert before purchasing
  const handlePurchaseReroll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    //Check if user can afford it first
    if (score < 50) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Error);
      Alert.alert(
        'Not Enough Points',
        'You need at least 50 points to purchase a reroll token.'
      );
      return;
    }

    //Show confirmation alert
    Alert.alert(
      'Confirm Purchase',
      'Are you sure you want to spend 50 points to buy one reroll token?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Spend 50 Points',
          style: 'default',
          onPress: async () => {
            //Purchase Logic
            const result = await useSkipToGainReroll();
            if (result.success) {
              Alert.alert('Purchase Success!', result.message);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Error);
              Alert.alert('Purchase Failed', result.message);
            }
          },
        },
      ],
      { cancelable: true }
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

  //Main Dashboard Content
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContainer}>
        {/* Score Card Display */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Total Score</Text>
          <Text style={styles.scoreValue}>{score} Points</Text>
        </View>

        <Text style={styles.header}>
          Today's Challenges ({dailyDares.length})
        </Text>

        {/* RENDER DARE CARDS FROM ARRAY */}
        {dailyDares.map((dare, index) => (
          <View
            key={index}
            style={[styles.dareCard, dare.completed && styles.dareCompleted]}
          >
            <Text style={styles.dareTitle}>
              Dare #{index + 1}: {dare.title}
            </Text>
            <Text style={styles.dareDescription}>{dare.description}</Text>

            {/* Point and Status Row */}
            <View style={styles.infoRow}>
              <Text style={styles.darePoints}>+ {dare.points} Points</Text>
              <Text style={styles.dareStatus}>
                Status: {dare.completed ? 'Completed' : 'Pending'}
              </Text>
            </View>

            {/* Action Buttons */}
            {!dare.completed && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => navigateToDetail(dare)}
                >
                  <Text style={styles.buttonText}>View & Complete</Text>
                </TouchableOpacity>

                {/* REROLL BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.rerollButton,
                    rerollTokens === 0 && styles.rerollDisabled,
                  ]}
                  onPress={() => handleReroll(dare.dareId)}
                  disabled={rerollTokens === 0}
                >
                  <Text style={styles.rerollText}>Reroll ({rerollTokens})</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Purchase Button Section */}
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            score < 50 && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchaseReroll}
          disabled={score < 50}
        >
          <Text style={styles.purchaseButtonText}>Purchase Reroll Token</Text>
          <Text style={styles.purchaseButtonSubText}>Cost: 50 Points</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

//STYLESHEET
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5ff',
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
    opacity: 0.7,
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
  tokenInfoContainer: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
 
  tokenInfoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
 
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  purchaseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  purchaseButtonSubText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
});

export default DareHubScreen;
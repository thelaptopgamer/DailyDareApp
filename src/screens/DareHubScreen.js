//src/screens/DareHubScreen.js
//Purpose: The main dashboard where users see their daily dares, score, and weather.
//Also serves as the gateway to the "Overtime" mode once daily tasks are complete.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location'; 
import { Ionicons } from '@expo/vector-icons';

//Core logic imports
import { rerollDailyDare, useSkipToGainReroll, assignDailyDare } from '../dailyDareUtils';

const DareHubScreen = ({ navigation }) => {
  const [dailyDares, setDailyDares] = useState([]);
  const [score, setScore] = useState(0);
  const [rerollTokens, setRerollTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  //Checks if all 3 daily dares are marked as 'completed'
  const allDaresCompleted = dailyDares.length > 0 && dailyDares.every(dare => dare.completed);

  //Daily Assignment Check
  //Runs on mount to see if it's a new day and new dares need to be generated.
  useEffect(() => {
    const checkDailyDares = async () => {
        const user = auth.currentUser;
        if (user) {
            await assignDailyDare();
        }
    };
    checkDailyDares();
  }, []);

  //Real-time User Data Listener
  //Automatically updates the UI when points, tokens, or dare status changes in Firestore.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    const userDocRef = doc(db, 'Users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setDailyDares(userData.dailyDares || []);
          setScore(userData.score || 0);
          setRerollTokens(userData.rerollTokens || 0);
        }
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  //Weather API Integration
  //Fetches local weather to help users decide if they can do outdoor dares.
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLoadingWeather(false); return; }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const data = await response.json();
        setWeather(data.current_weather);
      } catch (error) {
        console.error("Weather API Error:", error);
      } finally {
        setLoadingWeather(false);
      }
    })();
  }, []);

  //HANDLERS

  const navigateToDetail = (dare) => {
    navigation.navigate('DareDetail', { dare: dare });
  };

  const handleReroll = async (dareIdToReroll) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (rerollTokens <= 0) {
      Alert.alert('No Reroll Tokens', 'Purchase more using your points.');
      return;
    }
    const result = await rerollDailyDare(dareIdToReroll);
    if (result.success) Alert.alert('Reroll Success!', result.message);
    else Alert.alert('Reroll Failed', result.message);
  };

  const handlePurchaseReroll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (score < 50) {
      Alert.alert('Not Enough Points', 'You need 50 points to buy a token.');
      return;
    }
    Alert.alert('Confirm Purchase', 'Spend 50 points for 1 Reroll?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: async () => { await useSkipToGainReroll(); } },
    ]);
  };

  const getWeatherIcon = (code) => {
     if (code <= 3) return "sunny";
     if (code <= 48) return "cloudy";
     if (code <= 67) return "rainy";
     if (code <= 77) return "snow";
     return "partly-sunny";
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#007AFF" /></View>;

  //RENDER
  return (
    <View style={styles.mainContainer}>
      
      {/* Dashboard Header */}
      <View style={styles.headerBackground}>
        <SafeAreaView>
            <View style={styles.headerContent}>
                <View>
                    <Text style={styles.greetingText}>Welcome Back,</Text>
                    <Text style={styles.headerTitle}>Daily Dashboard</Text>
                </View>
                <View style={styles.scorePill}>
                    <Ionicons name="trophy" size={16} color="#FFD700" style={{marginRight:5}} />
                    <Text style={styles.scoreText}>{score} PTS</Text>
                </View>
            </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{paddingBottom: 40}}>
        
        {/* Weather Widget */}
        <View style={styles.weatherCard}>
            {loadingWeather ? (
                <ActivityIndicator color="#007AFF" />
            ) : weather ? (
                <View style={styles.weatherRow}>
                    <View>
                        <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                        <Text style={styles.weatherDesc}>Wind: {weather.windspeed} km/h</Text>
                    </View>
                    <View style={styles.weatherIconBox}>
                        <Ionicons name={getWeatherIcon(weather.weathercode)} size={32} color="#fff" />
                    </View>
                </View>
            ) : (
                <Text style={styles.weatherDesc}>Weather Unavailable</Text>
            )}
        </View>

        <Text style={styles.sectionTitle}>Today's Challenges</Text>

        {/* Daily Dares List */}
        {dailyDares.map((dare, index) => (
          <View key={index} style={[styles.dareCard, dare.completed && styles.dareCompleted]}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    <View style={[styles.difficultyDot, 
                        dare.difficulty === 'Easy' ? {backgroundColor:'#4CAF50'} : 
                        dare.difficulty === 'Medium' ? {backgroundColor:'#FF9500'} : {backgroundColor:'#FF3B30'}
                    ]} />
                    <Text style={styles.difficultyText}>{dare.difficulty}</Text>
                </View>
                <Text style={styles.pointsTag}>+{dare.points} PTS</Text>
            </View>
            
            <Text style={styles.dareTitle}>{dare.title}</Text>
            <Text style={styles.dareDesc}>{dare.description}</Text>

            {/* Action Buttons: Only show if not completed */}
            {!dare.completed ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.startButton} onPress={() => navigateToDetail(dare)}>
                  <Text style={styles.startButtonText}>Start Dare</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.rerollBtn, rerollTokens === 0 && {backgroundColor:'#eee'}]}
                    onPress={() => handleReroll(dare.dareId)}
                    disabled={rerollTokens === 0}
                >
                  <Ionicons name="dice" size={20} color={rerollTokens > 0 ? "#FF9500" : "#ccc"} />
                </TouchableOpacity>
              </View>
            ) : (
                <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.completedText}>COMPLETED</Text>
                </View>
            )}
          </View>
        ))}

        {/* Overtime Portal (Locked until daily tasks are done) */}
        <TouchableOpacity 
            style={[styles.overtimeContainer, !allDaresCompleted && styles.overtimeLocked]}
            onPress={() => {
                if (allDaresCompleted) {
                    navigation.navigate('AIDareScreen');
                } else {
                    Alert.alert("Locked", "Complete your 3 daily dares to unlock Overtime Mode!");
                }
            }}
            activeOpacity={0.8}
        >
              <View style={styles.overtimeHeader}>
                 <Ionicons name={allDaresCompleted ? "sparkles" : "lock-closed"} size={24} color={allDaresCompleted ? "#9C27B0" : "#666"} />
                 <View style={{marginLeft: 10, flex: 1}}>
                     <Text style={[styles.overtimeTitle, !allDaresCompleted && {color: '#666'}]}>
                        {allDaresCompleted ? "Enter Overtime Mode" : "Overtime Locked"}
                     </Text>
                     <Text style={styles.overtimeDesc}>
                        {allDaresCompleted ? "Unlimited dares. 50% pts. Grind time." : "Finish daily tasks to unlock."}
                     </Text>
                 </View>
                 {allDaresCompleted && <Ionicons name="chevron-forward" size={24} color="#9C27B0" />}
              </View>
        </TouchableOpacity>

        {/* Shop Section */}
        <View style={styles.shopCard}>
             <View style={styles.shopIcon}>
                <Ionicons name="cart" size={24} color="#007AFF" />
             </View>
             <View style={{flex:1}}>
                <Text style={styles.shopTitle}>Reroll Shop</Text>
                <Text style={styles.shopDesc}>{rerollTokens} Free Tokens Available</Text>
             </View>
             <TouchableOpacity 
                style={[styles.buyButton, score < 50 && {backgroundColor:'#ccc'}]}
                onPress={handlePurchaseReroll}
                disabled={score < 50}
            >
                <Text style={styles.buyText}>Buy (50)</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F2F4F7' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerBackground: { backgroundColor: '#007AFF', paddingBottom: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  greetingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  scorePill: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  scrollContainer: { flex: 1, paddingHorizontal: 20, marginTop: -20 }, 

  weatherCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherTemp: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  weatherDesc: { color: '#666', fontSize: 14 },
  weatherIconBox: { backgroundColor: '#FF9500', padding: 10, borderRadius: 50 },

  //Overtime Container
  overtimeContainer: { backgroundColor: '#F3E5F5', borderRadius: 16, padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#9C27B0' },
  overtimeLocked: { backgroundColor: '#e0e0e0', borderLeftColor: '#999' },
  overtimeHeader: { flexDirection: 'row', alignItems: 'center' },
  overtimeTitle: { fontWeight: 'bold', color: '#6A1B9A', fontSize: 16 },
  overtimeDesc: { color: '#666', fontSize: 12, marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },

  dareCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  dareCompleted: { opacity: 0.7, backgroundColor: '#f9f9f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  difficultyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  difficultyText: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  pointsTag: { fontWeight: 'bold', color: '#007AFF', fontSize: 14 },
  
  dareTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  dareDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },

  actionRow: { flexDirection: 'row', gap: 10 },
  startButton: { flex: 1, backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rerollBtn: { width: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#FFF3E0' },

  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  completedText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },

  shopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginTop: 10, marginBottom: 30 },
  shopIcon: { backgroundColor: '#E6F0FF', padding: 10, borderRadius: 10, marginRight: 15 },
  shopTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  shopDesc: { color: '#666', fontSize: 12 },
  buyButton: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});

export default DareHubScreen;
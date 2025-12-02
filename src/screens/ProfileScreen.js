//src/screens/ProfileScreen.js
//Purpose: Displays the user's profile, total score, progress statistics, and logout option.
//Data is fetched and updated in real-time via Firestore listeners.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore'; //Used for real-time data fetching
import { signOut } from 'firebase/auth'; 
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const userEmail = auth.currentUser?.email;
    //Derive display name from email (e.g., 'coope' from 'coope@sfu.ca')
    const displayName = userEmail ? userEmail.split('@')[0] : 'Guest';

    //Real-time Firestore Listener
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }
        
        //Subscribe to the user's document for live score/token updates
        const unsubscribe = onSnapshot(doc(db, 'Users', user.uid), (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
            setLoading(false);
        });
        
        //Cleanup function runs when the component unmounts
        return () => unsubscribe();
    }, []); 

    const handleLogout = async () => {
        try { await signOut(auth); } catch (e) { Alert.alert("Error", "Logout failed"); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

    //Data points derived from user document
    const userScore = userData?.score || 0;
    const rerollCount = userData?.rerollTokens || 0;
    const interests = userData?.interests || [];
    
    //Tracks total dares completed (including Overtime dares)
    const completedCount = userData?.daresCompletedCount || 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* User Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.nameText}>{displayName}</Text>
                <Text style={styles.emailText}>{userEmail}</Text>
                
                {/* Display user interests/tags */}
                <View style={styles.tagsRow}>
                    {interests.slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tagBadge}><Text style={styles.tagText}>{tag}</Text></View>
                    ))}
                </View>
            </View>

            {/* Stats Grid: Points, Completed Dares, Rerolls */}
            <View style={styles.statsContainer}>
                {/* Total Points */}
                <View style={styles.statBox}>
                    <View style={[styles.iconBox, {backgroundColor:'#E6F0FF'}]}>
                        <Ionicons name="trophy" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.statNum}>{userScore}</Text>
                    <Text style={styles.statLabel}>Total Points</Text>
                </View>
                
                {/* Dares Completed */}
                <View style={styles.statBox}>
                     <View style={[styles.iconBox, {backgroundColor:'#E8F5E9'}]}>
                        <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.statNum}>{completedCount}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>

                {/* Reroll Tokens */}
                <View style={styles.statBox}>
                     <View style={[styles.iconBox, {backgroundColor:'#FFF3E0'}]}>
                        <Ionicons name="dice" size={24} color="#FF9500" />
                    </View>
                    <Text style={styles.statNum}>{rerollCount}</Text>
                    <Text style={styles.statLabel}>Rerolls</Text>
                </View>
            </View>

            {/* Menu Options */}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                    <Text style={[styles.menuText, {color: '#FF3B30'}]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerCard: { backgroundColor: '#fff', alignItems: 'center', padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOpacity: 0.05, elevation: 5 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#007AFF', shadowOpacity: 0.3, elevation: 5 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    nameText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    emailText: { fontSize: 14, color: '#999', marginBottom: 15 },
    tagsRow: { flexDirection: 'row', gap: 8 },
    tagBadge: { backgroundColor: '#F2F4F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tagText: { fontSize: 12, color: '#555', fontWeight: '600' },

    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 10 },
    statBox: { backgroundColor: '#fff', flex: 1, marginHorizontal: 5, padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    iconBox: { padding: 10, borderRadius: 50, marginBottom: 10 },
    statNum: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#999', marginTop: 2 },

    menuContainer: { padding: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
    menuText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500', color: '#333' },
});

export default ProfileScreen;
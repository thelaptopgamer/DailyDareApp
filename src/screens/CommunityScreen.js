// src/screens/CommunityScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const CommunityScreen = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Create a Firestore query:
            // - Target the 'Users' collection.
            // - Order results by 'score' in descending order (highest score first).
            // - Limit the results to the top 50 (a reasonable leaderboard size).
            const q = query(
                collection(db, 'Users'),
                orderBy('score', 'desc'),
                limit(50)
            );

            // 2. Execute the query
            const querySnapshot = await getDocs(q);
            const leaders = [];
            let rank = 1;
            
            // 3. Process the results
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Exclude users with zero score from the ranking display (optional cleanup)
                if (userData.score > 0) {
                    // Extract email (or user ID if email is sensitive) for display
                    const emailParts = userData.email ? userData.email.split('@') : [doc.id.substring(0, 8), ''];
                    
                    leaders.push({
                        id: doc.id,
                        rank: rank++, // Assign sequential rank
                        displayName: emailParts[0], // Use username part of email
                        score: userData.score,
                    });
                }
            });

            setLeaderboard(leaders);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch the leaderboard once when the component loads
    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Component for a single leaderboard item
    const renderLeaderItem = ({ item }) => {
        const isCurrentUser = auth.currentUser.uid === item.id;
        
        return (
            <View style={[styles.itemContainer, isCurrentUser && styles.currentUserItem]}>
                <Text style={styles.rankText}>{item.rank}.</Text>
                <Text style={styles.nameText}>{item.displayName}</Text>
                <Text style={styles.scoreText}>{item.score} pts</Text>
            </View>
        );
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10 }}>Loading Leaderboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Global Leaderboard</Text>

                <View style={styles.listHeader}>
                    <Text style={[styles.rankText, { fontWeight: 'bold' }]}>Rank</Text>
                    <Text style={[styles.nameText, { fontWeight: 'bold' }]}>Player</Text>
                    <Text style={[styles.scoreText, { fontWeight: 'bold' }]}>Score</Text>
                </View>

                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No players on the leaderboard yet. Start earning points!</Text>}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        backgroundColor: '#eee',
        borderRadius: 8,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingHorizontal: 15,
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        paddingHorizontal: 15,
    },
    currentUserItem: {
        backgroundColor: '#E6F0FF',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    rankText: {
        fontSize: 16,
        color: '#333',
        width: 50,
    },
    nameText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF', // Primary color scores
        minWidth: 80,
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#777',
    }
});

export default CommunityScreen;
// src/screens/SocialFeedScreen.js
// Purpose: A social feed where users view proof photos and "Double Dare" (challenge) others.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, doc, runTransaction, increment } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

const SocialFeedScreen = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    //Fetching the Feed
    const fetchPosts = useCallback(async () => {
        try {
            // Query the "Posts" collection, ordered by newest first
            const q = query(
                collection(db, 'Posts'),
                orderBy('timestamp', 'desc'),
                limit(20) // Limit to 20 posts for now (Infinite scroll can be added later)
            );
            
            const querySnapshot = await getDocs(q);
            const fetchedPosts = [];
            
            querySnapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() });
            });

            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    //Double-Dare
    //"High Stakes Like", it costs 50 points to click
    const handleDoubleDare = async (post) => {
        const user = auth.currentUser;
        if (!user) return;

        // Tactile Feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Run a Firestore Transaction 
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "Users", user.uid);
                const postRef = doc(db, "Posts", post.id);

                // Get current user data to check balance
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw "User does not exist!";
                
                const currentScore = userDoc.data().score || 0;
                const COST = 50;

                // Check if user has enough points
                if (currentScore < COST) {
                    throw "Not enough points!";
                }

                // EXECUTION
                // Deduct points from current user
                transaction.update(userRef, { score: increment(-COST) });
                
                // Increment "Double Dare" counter on the post
                transaction.update(postRef, { doubleDares: increment(1) });
            });

            
            Alert.alert("Double Dared!", `You challenged ${post.userDisplayName} for 50 points!`);
            onRefresh(); 

        } catch (error) {
            // Handle "Not enough points" or other errors
            if (error === "Not enough points!") {
                Alert.alert("Insufficient Funds", "You need 50 points to Double Dare someone.");
            } else {
                console.error("Double Dare Error:", error);
                Alert.alert("Error", "Could not process the dare.");
            }
        }
    };

    // ---  The Post Card ---
    const renderPost = ({ item }) => (
        <View style={styles.card}>
            {/* Header: User & Dare Info */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.username}>@{item.userDisplayName}</Text>
                    <Text style={styles.dareTitle}>Completed: {item.dareTitle}</Text>
                </View>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{item.pointsAwarded}</Text>
                </View>
            </View>

            {/* Proof Image */}
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />

            {/* Footer: Double Dare  */}
            <View style={styles.cardFooter}>
                <TouchableOpacity 
                    style={styles.doubleDareButton}
                    onPress={() => handleDoubleDare(item)}
                >
                    <Ionicons name="flash" size={20} color="#FFD700" />
                    <Text style={styles.ddText}>DOUBLE DARE</Text>
                </TouchableOpacity>
                
                <Text style={styles.counterText}>
                    {item.doubleDares || 0} Challenges
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Community Feed</Text>
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.empty}>No proofs uploaded yet. Be the first!</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#333' },
    listContent: { paddingHorizontal: 15 },
    
    // Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardHeader: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    username: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    dareTitle: { color: '#666', fontSize: 14, marginTop: 2 },
    pointsBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    pointsText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
    
    postImage: { width: '100%', height: 300, backgroundColor: '#eee' },
    
    cardFooter: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    doubleDareButton: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
    },
    ddText: { color: '#FFD700', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
    counterText: { color: '#888', fontSize: 14 },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default SocialFeedScreen;
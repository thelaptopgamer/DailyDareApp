// src/screens/CommunityScreen.js
// Purpose: Fetches user scores, ranks them for the Global Leaderboard, and implements search functionality (Step 47).

import React, { useState, useEffect, useCallback } from 'react'; // Imports React and essential hooks
import { View, Text, TextInput, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native'; // Imports core components (IAT359_Week3)
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; // Firestore read methods (Lecture 6)
import { Ionicons } from '@expo/vector-icons'; // Vector icons

// Debouncing Logic: Utility hook to delay search filtering until user stops typing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Reruns when 'value' changes
    return debouncedValue;
};


const CommunityScreen = () => {
    // STATE: Stores the current leaderboard display and the full list of users
    const [leaderboard, setLeaderboard] = useState([]);
    const [allUsers, setAllUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    
    const debouncedSearchText = useDebounce(searchText, 500); 

    // ASYNC FUNCTION: Fetches the top users from Firestore for the leaderboard
    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            // FIRESTORE QUERY: Gets users ordered by score (orderBy, limit - Lecture 6)
            const q = query(
                collection(db, 'Users'),
                orderBy('score', 'desc'),
                limit(200) // Fetches a wide range for searching
            );

            const querySnapshot = await getDocs(q); // Await the data fetch
            const users = [];
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Logic: Use email prefix as the display name (simple fallback)
                let displayName; 
                const emailParts = userData.email ? userData.email.split('@') : [doc.id.substring(0, 8), ''];
                displayName = emailParts[0]; 
                
                // Only include users with points
                if (userData.score > 0) {
                    users.push({
                        id: doc.id,
                        displayName: displayName, 
                        score: userData.score,
                    });
                }
            });

            // Update state: Store all users and display the initial top 50
            setAllUsers(users);
            setLeaderboard(users.slice(0, 50).map((user, index) => ({ ...user, rank: index + 1 })));

        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Function to apply the search filter (Runs locally, reducing Firestore calls)
    const filterAndRankUsers = useCallback((query) => {
        if (!query) {
            return allUsers.slice(0, 50).map((user, index) => ({ ...user, rank: index + 1 }));
        }

        const lowerCaseQuery = query.toLowerCase();
        
        // JAVASCRIPT ARRAY METHOD: Filter users based on display name
        const filteredUsers = allUsers.filter(user => 
            user.displayName.toLowerCase().includes(lowerCaseQuery)
        );

        // Re-rank the filtered users starting from 1
        return filteredUsers.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    }, [allUsers]);

    // SIDE EFFECT: Runs the search filter whenever the debounced search text changes
    useEffect(() => {
        const filteredList = filterAndRankUsers(debouncedSearchText);
        setLeaderboard(filteredList);
    }, [debouncedSearchText, filterAndRankUsers]);


    // SIDE EFFECT: Initial data load (Runs once on mount - empty dependency array logic)
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);
    
    // Component for a single leaderboard item (used by FlatList)
    const renderLeaderItem = ({ item }) => {
        const isCurrentUser = auth.currentUser.uid === item.id;
        
        return (
            <TouchableOpacity 
                style={[styles.itemContainer, isCurrentUser && styles.currentUserItem]}
                onPress={() => console.log(`Viewing profile for: ${item.displayName}`)} 
            >
                <Text style={styles.rankText}>{item.rank}.</Text>
                <Text style={styles.nameText}>{item.displayName}</Text>
                <Text style={styles.scoreText}>{item.score} pts</Text>
            </TouchableOpacity>
        );
    };

    // CONDITIONAL RENDERING: Shows loading state
    if (loading && allUsers.length === 0) {
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
                
                {/* SEARCH INPUT (Core Component: TextInput) */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#777" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users by name..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                {/* List Headers */}
                <View style={styles.listHeader}>
                    <Text style={[styles.rankText, { fontWeight: 'bold' }]}>Rank</Text>
                    <Text style={[styles.nameText, { fontWeight: 'bold' }]}>Player</Text>
                    <Text style={[styles.scoreText, { fontWeight: 'bold' }]}>Score</Text>
                </View>

                {/* FLATLIST: Performant list rendering (IAT359_Week3, Page 33) */}
                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No matching users found.</Text>}
                />
            </View>
        </SafeAreaView>
    );
};

// STYLESHEET: Uses Flexbox properties for layout (IAT359_Week3, Page 27-30)
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
    // STYLES FOR SEARCH INPUT
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    // END SEARCH STYLES
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
        color: '#007AFF', 
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
// src/screens/CommunityScreen.js
import React, { useState, useEffect, useCallback } from 'react'; 
import { View, Text, TextInput, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; 

// Simple debouncing function to limit fetching/filtering while typing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const CommunityScreen = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [allUsers, setAllUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    
    const debouncedSearchText = useDebounce(searchText, 500); 

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'Users'),
                orderBy('score', 'desc'),
                limit(200) // Fetch a wide range of users for search
            );

            const querySnapshot = await getDocs(q);
            const users = [];
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Reverted Logic: Use email prefix as the display name
                let displayName; 
                const emailParts = userData.email ? userData.email.split('@') : [doc.id.substring(0, 8), ''];
                displayName = emailParts[0]; 
                
                // Only include users with points (score > 0)
                if (userData.score > 0) {
                    users.push({
                        id: doc.id,
                        displayName: displayName, 
                        score: userData.score,
                    });
                }
            });

            // Set all users and calculate the initial leaderboard (top 50)
            setAllUsers(users);
            setLeaderboard(users.slice(0, 50).map((user, index) => ({ ...user, rank: index + 1 })));

        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Function to apply the search filter
    const filterAndRankUsers = useCallback((query) => {
        if (!query) {
            return allUsers.slice(0, 50).map((user, index) => ({ ...user, rank: index + 1 }));
        }

        const lowerCaseQuery = query.toLowerCase();
        
        // Filter users based on display name containing the search query
        const filteredUsers = allUsers.filter(user => 
            user.displayName.toLowerCase().includes(lowerCaseQuery)
        );

        // Re-rank the filtered users starting from 1
        return filteredUsers.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    }, [allUsers]);

    // Effect to run the search when the debounced search text changes
    useEffect(() => {
        const filteredList = filterAndRankUsers(debouncedSearchText);
        setLeaderboard(filteredList);
    }, [debouncedSearchText, filterAndRankUsers]);


    // Initial data load effect
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);
    
    // Component for a single leaderboard item
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
                
                {/* SEARCH INPUT */}
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
                    ListEmptyComponent={<Text style={styles.emptyText}>No matching users found.</Text>}
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
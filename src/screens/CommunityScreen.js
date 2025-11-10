//CommunityScreen.js
//Purpose: Fetches user scores and ranks them for the Global Leaderboard.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const CommunityScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  //ASYNC FUNCTION: Fetches the initial list of users from Firestore
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      //FIRESTORE QUERY get top 50 users by score
      const q = query(
        collection(db, 'Users'),
        orderBy('score', 'desc'),
        limit(50) // Only fetch the top 50
      );
      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        //Uses email prefix as the temporary display  (august add usernames later for signup and show it for displayname)
        let displayName;
        const emailParts = userData.email
          ? userData.email.split('@')
          : [doc.id.substring(0, 8), ''];
        displayName = emailParts[0];

        //Leaderboard only shows users with score > 0
        if (userData.score > 0) {
          users.push({
            id: doc.id,
            displayName: displayName,
            score: userData.score,
          });
        }
      });

      //Adds ranks to users based on their score
      setLeaderboard(
        users.map((user, index) => ({
          ...user,
          rank: index + 1,
        }))
      );
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  //Initial data load
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  //Component for a single leaderboard item (used by FlatList)
  const renderLeaderItem = ({ item }) => {
    //Highlights the current user's entry in the list
    const isCurrentUser = auth.currentUser.uid === item.id;
    return (
      <TouchableOpacity
        style={[styles.itemContainer, isCurrentUser && styles.currentUserItem]}
        onPress={() => console.log('Viewing profile for: ' + item.displayName)}
      >
        <Text style={styles.rankText}>{item.rank}.</Text>
        <Text style={styles.nameText}>{item.displayName}</Text>
        <Text style={styles.scoreText}>{item.score} pts</Text>
      </TouchableOpacity>
    );
  };

  //Shows that the leaderboard is loading
  if (loading && leaderboard.length === 0) {
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

        {/* Titles for each column */}
        <View style={styles.listHeader}>
          <Text style={[styles.rankText, { fontWeight: 'bold' }]}>Rank</Text>
          <Text style={[styles.nameText, { fontWeight: 'bold' }]}>Player</Text>
          <Text style={[styles.scoreText, { fontWeight: 'bold' }]}>Score</Text>
        </View>

        {/* Performance list for each user */}
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Leaderboard is empty.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

//STYLESHEET
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
    color: '#007AFF',
    minWidth: 80,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
});

export default CommunityScreen;
//src/screens/CommunityScreen.js
//Purpose: The primary social feed where users can view proofs, like posts, and award points.
//Implements complex data handling including atomic transactions for the award economy.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, RefreshControl, TextInput, Alert, Modal, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import MapView, { Marker } from 'react-native-maps'; 
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, runTransaction, increment, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

//Configuration for the award system economy
const AWARDS = [
    { id: 'clap', icon: '👏', name: 'Applause', cost: 10 },
    { id: 'fire', icon: '🔥', name: 'Hype', cost: 25 },
    { id: 'muscle', icon: '💪', name: 'Strong', cost: 50 },
    { id: 'diamond', icon: '💎', name: 'Gem', cost: 100 },
    { id: 'goat', icon: '👑', name: 'GOAT', cost: 200 },
];

const CommunityScreen = () => {
  const [activeTab, setActiveTab] = useState('feed'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed, setFeed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [postToAward, setPostToAward] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  //Fetch initial data for both the Feed and Leaderboard
  const loadData = useCallback(async () => {
    try {
        //Fetch Top 50 Users for Leaderboard
        const qLeader = query(collection(db, 'Users'), orderBy('score', 'desc'), limit(50));
        const snapLeader = await getDocs(qLeader);
        const users = [];
        snapLeader.forEach((doc) => {
            const d = doc.data();
            if (d.score > 0) users.push({ id: doc.id, displayName: d.email ? d.email.split('@')[0] : 'User', score: d.score });
        });
        
        //Calculate ranks locally
        const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }));
        setLeaderboard(ranked);
        setFilteredLeaderboard(ranked);

        //Fetch Top 50 Recent Posts for Feed
        const qFeed = query(collection(db, 'CommunityPosts'), orderBy('timestamp', 'desc'), limit(50));
        const snapFeed = await getDocs(qFeed);
        const posts = [];
        snapFeed.forEach((doc) => {
            const d = doc.data();
            //Convert Firestore Timestamp to JS Date object for rendering
            posts.push({ id: doc.id, ...d, createdAt: d.timestamp ? d.timestamp.toDate() : new Date() });
        });
        setFeed(posts);

    } catch (e) { console.error("Data load error:", e); }
  }, []);

  useEffect(() => {
    loadData().then(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  //Local filtering for the leaderboard search bar
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) setFilteredLeaderboard(leaderboard);
    else setFilteredLeaderboard(leaderboard.filter(u => u.displayName.toLowerCase().includes(text.toLowerCase())));
  };

  const handleDeletePost = async (postId) => {
      Alert.alert("Delete Post", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: async () => {
              try { await deleteDoc(doc(db, "CommunityPosts", postId)); handleRefresh(); Alert.alert("Deleted", "Post removed."); }
              catch (error) { Alert.alert("Error", "Could not delete post."); }
          }}
      ]);
  };

  //Handles simple Likes. Uses arrayUnion to ensure unique likes per user.
  const handleLike = async (post) => {
     const user = auth.currentUser;
     if(!user) return;
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

     const postRef = doc(db, 'CommunityPosts', post.id);
     const isLiked = post.likedBy && post.likedBy.includes(user.uid);

     try {
         if (isLiked) {
             await updateDoc(postRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) });
         } else {
             await updateDoc(postRef, { likedBy: arrayUnion(user.uid), likes: increment(1) });
         }
         handleRefresh(); 
     } catch(e) { console.error("Like error", e); }
  };

  //Award Modal Triggers
  const openAwardMenu = (post) => {
      setPostToAward(post);
      setAwardModalVisible(true);
  };

  //Core Economy Logic: Processes the transaction for buying awards
  const giveAward = async (award) => {
    const user = auth.currentUser;
    if (!user || !postToAward) return;

    if (postToAward.userId === user.uid) {
        Alert.alert("Nice Try", "You can't award your own post!");
        return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAwardModalVisible(false); 

    try {
        //Use a Transaction to ensure atomic updates (prevent spending points if update fails)
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "Users", user.uid);
            const postRef = doc(db, "CommunityPosts", postToAward.id);

            //Read current state first
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist!";
            const currentScore = userDoc.data().score || 0;

            //Verify funds
            if (currentScore < award.cost) {
                throw "Not enough points!";
            }

            //Execute both writes simultaneously
            transaction.update(userRef, { score: increment(-award.cost) });
            const fieldName = `awards.${award.id}`; //Dynamic field update for specific award type
            transaction.update(postRef, { [fieldName]: increment(1) });
        });

        Alert.alert("Award Sent!", `You gave a ${award.name} for ${award.cost} points.`);
        handleRefresh(); 

    } catch (error) {
        if (error === "Not enough points!") {
            Alert.alert("Insufficient Funds", `You need ${award.cost} points for this award.`);
        } else {
            console.error("Award Transaction Error:", error);
            Alert.alert("Error", "Could not send award.");
        }
    }
  };

  const getDiffColor = (diff) => {
      if(diff === 'Easy') return '#4CAF50';
      if(diff === 'Hard') return '#FF3B30';
      return '#FF9500'; 
  };

  //RENDER FUNCTIONS

  const renderLeaderItem = ({ item }) => {
    const isMe = auth.currentUser?.uid === item.id;
    
    //Style top 3 ranks distinctly
    let rankColor = '#fff';
    let borderColor = 'transparent';
    if (item.rank === 1) { rankColor = '#FFFDE7'; borderColor = '#FFD700'; }
    else if (item.rank === 2) { rankColor = '#FAFAFA'; borderColor = '#C0C0C0'; }
    else if (item.rank === 3) { rankColor = '#FFF3E0'; borderColor = '#CD7F32'; }
    
    if (isMe) borderColor = '#007AFF';

    return (
      <View style={[styles.leaderCard, { backgroundColor: rankColor, borderColor: borderColor, borderWidth: borderColor !== 'transparent' ? 2 : 0 }]}>
        <View style={styles.rankBadge}>
            {item.rank <= 3 ? <Ionicons name="trophy" size={18} color={item.rank===1?'#D4AF37':item.rank===2?'#7F7F7F':'#A0522D'} /> : <Text style={styles.rankNum}>{item.rank}</Text>}
        </View>
        <Text style={[styles.leaderName, isMe && {color:'#007AFF'}]}>{item.displayName} {isMe && '(You)'}</Text>
        <Text style={styles.scoreText}>{item.score} pts</Text>
      </View>
    );
  };

  const renderFeedItem = ({ item }) => {
    const isMyPost = auth.currentUser?.uid === item.userId;
    const diff = item.dareDifficulty || 'Challenge'; 
    const isLiked = item.likedBy && item.likedBy.includes(auth.currentUser?.uid);
    const awards = item.awards || {}; 

    return (
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.postCard} 
            onPress={() => setSelectedPost(item)} 
        >
            <View style={styles.postHeader}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.userDisplayName ? item.userDisplayName[0].toUpperCase() : '?'}</Text></View>
                <View style={{flex: 1}}>
                    <Text style={styles.postUser}>{item.userDisplayName}</Text>
                    <Text style={styles.postTime}>{item.createdAt.toLocaleDateString()}</Text>
                </View>
                {isMyPost && (
                    <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.postContext}>
                <Text style={{fontWeight:'bold', color: getDiffColor(diff), marginRight: 5}}>[{diff}]</Text>
                {item.isAI && (
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI DARE</Text>
                    </View>
                )}
                <Text style={styles.postTitle}>{item.dareTitle}</Text>
            </View>
            
            <Image source={{ uri: item.imageURL }} style={styles.postImage} resizeMode="cover" />
            
            {/* Dare Description */}
            {item.dareDescription && (
                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{item.dareDescription}</Text>
                </View>
            )}

            {/* Footer: Social Actions */}
            <View style={styles.socialBar}>
                <TouchableOpacity style={styles.socialBtn} onPress={() => handleLike(item)}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF3B30" : "#333"} />
                    <Text style={styles.socialText}>{item.likes || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn} onPress={() => openAwardMenu(item)}>
                    <Ionicons name="gift-outline" size={24} color="#9C27B0" />
                    <Text style={[styles.socialText, {color: '#9C27B0'}]}>Gift</Text>
                </TouchableOpacity>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginLeft: 10}}>
                    {AWARDS.map(a => {
                        const count = awards[a.id] || 0;
                        if (count === 0) return null;
                        return (
                            <View key={a.id} style={styles.awardBadge}>
                                <Text style={{fontSize: 12}}>{a.icon} {count}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Community</Text>
        </View>

        <Modal visible={awardModalVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setAwardModalVisible(false)}>
                <View style={styles.awardMenu}>
                    <Text style={styles.awardMenuTitle}>Give an Award</Text>
                    <Text style={styles.awardMenuSub}>Support this dare!</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.awardRow}>
                        {AWARDS.map((award) => (
                            <TouchableOpacity key={award.id} style={styles.awardOption} onPress={() => giveAward(award)}>
                                <Text style={styles.bigIcon}>{award.icon}</Text>
                                <Text style={styles.awardName}>{award.name}</Text>
                                <Text style={styles.awardCost}>{award.cost} pts</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setAwardModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>

        {/* POST DETAIL MODAL */}
        <Modal visible={!!selectedPost} animationType="slide" presentationStyle="formSheet">
            {selectedPost && (
                <View style={styles.detailContainer}>
                    <View style={styles.detailTopBar}>
                        <Text style={styles.detailHeaderTitle}>Post Details</Text>
                        <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setSelectedPost(null)}>
                            <Ionicons name="close-circle" size={30} color="#e0e0e0" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.detailScroll}>
                        <View style={styles.detailImageContainer}>
                            <Image 
                                source={{ uri: selectedPost.imageURL }} 
                                style={styles.detailImageFull} 
                                resizeMode="contain" 
                            />
                        </View>

                        <View style={styles.detailBody}>
                            <View style={styles.userInfoRow}>
                                <View style={[styles.avatarPlaceholder, {width: 50, height: 50, borderRadius: 25}]}>
                                    <Text style={{fontSize: 20, fontWeight:'bold', color:'#fff'}}>
                                        {selectedPost.userDisplayName ? selectedPost.userDisplayName[0].toUpperCase() : '?'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.detailUsername}>{selectedPost.userDisplayName}</Text>
                                    <Text style={styles.detailDate}>{selectedPost.createdAt.toDateString()} • {selectedPost.createdAt.toLocaleTimeString()}</Text>
                                </View>
                            </View>

                            <View style={styles.detailContext}>
                                <Text style={styles.detailDareTitle}>
                                    {selectedPost.dareTitle}
                                </Text>
                                <View style={styles.badgeRow}>
                                    <View style={[styles.diffBadge, {backgroundColor: getDiffColor(selectedPost.dareDifficulty)}]}>
                                        <Text style={styles.badgeText}>{selectedPost.dareDifficulty || 'Medium'}</Text>
                                    </View>
                                    {selectedPost.isAI && (
                                        <View style={styles.aiBadgeDetail}>
                                            <Text style={styles.aiBadgeTextDetail}>AI GENERATED</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.detailDescription}>{selectedPost.dareDescription}</Text>
                            </View>

                            {/* LOCATION CARD (Only in Detail View) */}
                            {selectedPost.location && (
                                <View style={styles.detailMapCard}>
                                    <MapView
                                        style={styles.detailMap}
                                        initialRegion={{
                                            latitude: selectedPost.location.latitude,
                                            longitude: selectedPost.location.longitude,
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        }}
                                        scrollEnabled={false}
                                    >
                                        <Marker coordinate={selectedPost.location} />
                                    </MapView>
                                    <View style={styles.detailAddressBox}>
                                        <Ionicons name="location-sharp" size={16} color="#007AFF" />
                                        <Text style={styles.detailAddressText}>{selectedPost.location.address || "Unknown"}</Text>
                                    </View>
                                </View>
                            )}
                            
                            <View style={{height: 50}} />
                        </View>
                    </ScrollView>
                </View>
            )}
        </Modal>

        <View style={styles.tabWrapper}>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'feed' && styles.activeTab]} onPress={() => setActiveTab('feed')}>
                    <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Social Feed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'leaderboard' && styles.activeTab]} onPress={() => setActiveTab('leaderboard')}>
                    <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>Leaderboard</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.contentContainer}>
            {activeTab === 'leaderboard' && (
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput style={styles.input} placeholder="Find friends..." value={searchQuery} onChangeText={handleSearch} />
                </View>
            )}

            {loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop:50}} /> : (
                <FlatList
                    data={activeTab === 'feed' ? feed : filteredLeaderboard}
                    renderItem={activeTab === 'feed' ? renderFeedItem : renderLeaderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{paddingBottom: 20}}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {activeTab === 'feed' ? "The feed is empty. Post a dare!" : "No scores found."}
                        </Text>
                    }
                />
            )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F4F7' },
  headerContainer: { padding: 15, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  //AWARD STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  awardMenu: { width: '90%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 10 },
  awardMenuTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  awardMenuSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  awardRow: { flexDirection: 'row', marginBottom: 10, paddingVertical: 10, paddingHorizontal: 5 }, 
  awardOption: { alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f9f9f9', marginHorizontal: 5, width: 80, borderWidth: 1, borderColor: '#eee' },
  bigIcon: { fontSize: 32, marginBottom: 5 },
  awardName: { fontWeight: 'bold', color: '#333', fontSize: 12 },
  awardCost: { color: '#007AFF', fontSize: 10, fontWeight: 'bold' },
  cancelBtn: { padding: 10, width: '100%', alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#FF3B30', fontSize: 16 },

  //HIGH FIDELITY DETAIL STYLES
  detailContainer: { flex: 1, backgroundColor: '#000' }, // Black BG for immersive feel
  detailTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 20, backgroundColor: '#000' },
  detailHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeDetailBtn: { padding: 5 },
  detailScroll: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', minHeight: '100%' },
  
  detailImageContainer: { width: '100%', backgroundColor: '#000' },
  detailImageFull: { width: '100%', height: width * 1.25, backgroundColor: '#000' }, // 4:5 Aspect Ratio
  
  detailBody: { padding: 20 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailUsername: { fontSize: 20, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  detailDate: { fontSize: 14, color: '#888', marginLeft: 10 },
  
  detailContext: { marginBottom: 25 },
  detailDareTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  aiBadgeDetail: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#9C27B0' },
  aiBadgeTextDetail: { color: '#9C27B0', fontWeight: 'bold', fontSize: 12 },

  //Detail Map
  detailMapCard: { borderRadius: 15, overflow: 'hidden', height: 200, borderWidth: 1, borderColor: '#eee', marginTop: 20 },
  detailMap: { flex: 1 },
  detailAddressBox: { flexDirection: 'row', padding: 10, backgroundColor: '#f9f9f9', alignItems: 'center', gap: 5 },
  detailAddressText: { color: '#555', fontSize: 14, fontWeight: '600' },

  //FEED CARD STYLES
  postCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  postUser: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  postTime: { color: '#999', fontSize: 12 },
  deleteBtn: { padding: 5 },
  
  postContext: { paddingHorizontal: 15, marginBottom: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  postTitle: { color: '#444', fontWeight: 'bold' },
  aiBadge: { backgroundColor: '#F3E5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 5, borderWidth: 1, borderColor: '#CE93D8' },
  aiBadgeText: { color: '#9C27B0', fontSize: 10, fontWeight: 'bold' },
  
  descriptionBox: { paddingHorizontal: 15, marginBottom: 10 },
  descriptionText: { fontSize: 14, color: '#666', lineHeight: 20 },

  postImage: { width: '100%', height: 350 },

  socialBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 10, alignItems: 'center' },
  socialBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 15, padding: 5 },
  socialText: { marginLeft: 5, fontSize: 14, color: '#333', fontWeight: 'bold' },
  awardBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginRight: 4, borderWidth: 1, borderColor: '#ddd' },

  tabWrapper: { backgroundColor: '#fff', padding: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F2F4F7', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  tabText: { fontWeight: '600', color: '#999' },
  activeTabText: { color: '#007AFF' },

  contentContainer: { flex: 1, padding: 15 },
  searchBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  input: { marginLeft: 10, flex: 1, fontSize: 16 },

  leaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  rankBadge: { width: 30, alignItems: 'center' },
  rankNum: { fontWeight: 'bold', color: '#666' },
  leaderName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 10 },
  scoreText: { fontWeight: 'bold', color: '#007AFF' },
  
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 16 },
});

export default CommunityScreen;
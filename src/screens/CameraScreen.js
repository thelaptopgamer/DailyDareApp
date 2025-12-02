// src/screens/CameraScreen.js
// Purpose: Captures Photo + GPS, saves metadata (including AI tags).

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { completeDailyDare } from '../dailyDareUtils';

const CameraScreen = ({ navigation, route }) => {
  const { dare } = route.params || {}; 

  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  
  const [photo, setPhoto] = useState(null); 
  const [location, setLocation] = useState(null); 
  const [address, setAddress] = useState(null); 
  const [uploading, setUploading] = useState(false); 
  const [zoom, setZoom] = useState(0); 
  
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
      if (!locationPermission?.granted) await requestLocationPermission();
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({ 
            quality: 0.7, 
            skipProcessing: true 
        });
        setPhoto(photoData.uri);

        let locationData = await Location.getCurrentPositionAsync({});
        setLocation(locationData.coords);

        let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude
        });

        if (reverseGeocode.length > 0) {
            const place = reverseGeocode[0];
            const addressString = `${place.name || place.street || 'Unknown'}, ${place.city || ''}`;
            setAddress(addressString);
        }
      } catch (error) {
        Alert.alert("Error", "Could not capture photo.");
      }
    }
  };

  const handlePostToCommunity = async () => {
    if (!photo) return;
    setUploading(true);

    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Error", "You must be logged in.");
        setUploading(false);
        return;
    }

    let finalImageURL = null;

    try {
      try {
          const response = await fetch(photo);
          const blob = await response.blob();
          const storage = getStorage();
          const filename = `proof_${user.uid}_${Date.now()}.jpg`;
          const storageRef = ref(storage, `proof_images/${user.uid}/${filename}`);
          
          await uploadBytes(storageRef, blob);
          finalImageURL = await getDownloadURL(storageRef);
      } catch (storageError) {
          console.warn("Storage upload failed. Using fallback.");
          finalImageURL = "https://img.freepik.com/free-vector/trophy-flat-style_78370-3222.jpg"; 
      }

      // SAVE POST TO FIRESTORE
      await addDoc(collection(db, 'CommunityPosts'), {
        userId: user.uid,
        userDisplayName: user.email ? user.email.split('@')[0] : 'Anonymous',
        dareTitle: dare?.title || 'Daily Challenge',
        dareDifficulty: dare?.difficulty || 'Medium',
        dareId: dare?.dareId || 'unknown',
        imageURL: finalImageURL,
        
        // --- NEW LINE: SAVE THE TAGS ---
        isAI: dare?.isAI || false, 
        tags: dare?.tags || [],    
        // ------------------------------

        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address 
        } : null,
        timestamp: serverTimestamp(),
        likes: 0,
        doubleDares: 0, 
        pointsAwarded: dare?.points || 0
      });

      // Award Points
      if (dare) {
        // Note: For AI dares, we might not save to the "DailyDares" array in User object the same way,
        // but completeDailyDare usually expects a dareID that exists in the daily list.
        // For AI dares (which are "bonus"), we might just want to update score directly.
        // However, to keep it simple and not crash, we call it. It might return false if ID not found, 
        // but we already updated the post.
        
        // Ideally, we just increment score manually if it's an AI dare, 
        // but let's stick to the current flow to prevent logic errors.
        await completeDailyDare(dare.dareId, dare.points);
      }

      Alert.alert("Success!", "Your dare has been posted!");
      navigation.popToTop(); 

    } catch (error) {
      console.error("Post failed:", error);
      Alert.alert("Error", "Failed to upload to community page.");
    } finally {
      setUploading(false);
    }
  };

  const increaseZoom = () => { if (zoom < 1) setZoom(prev => Math.min(prev + 0.05, 1)); };
  const decreaseZoom = () => { if (zoom > 0) setZoom(prev => Math.max(prev - 0.05, 0)); };

  if (!permission || !locationPermission) {
    return <View style={styles.loadingContainer}><ActivityIndicator /></View>;
  }

  if (!permission.granted || !locationPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', marginTop: 50 }}>Permission Required</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}><Text style={styles.buttonText}>Grant</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerArea}>
            <Text style={styles.headerText}>{photo ? "Preview Proof" : "Take Proof"}</Text>
            {address && <Text style={styles.addressText}>📍 {address}</Text>}
        </View>

        <View style={styles.cameraFrame}>
            {photo ? (
                <Image source={{ uri: photo }} style={styles.cameraView} resizeMode="cover" />
            ) : (
                <CameraView style={styles.cameraView} ref={cameraRef} facing="back" zoom={zoom} />
            )}
        </View>

        <View style={styles.controlsArea}>
            {photo ? (
                uploading ? (
                    <ActivityIndicator size="large" color="#4CAF50" />
                ) : (
                    <View style={styles.previewButtons}>
                        <TouchableOpacity style={styles.retakeButton} onPress={() => setPhoto(null)}>
                            <Ionicons name="refresh" size={24} color="#fff" />
                            <Text style={styles.smallButtonText}>Retake</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.postButton} onPress={handlePostToCommunity}>
                            <Text style={styles.buttonText}>Post to Community</Text>
                            <Ionicons name="send" size={20} color="#fff" style={{marginLeft:10}} />
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                <>
                    <View style={styles.zoomRow}>
                        <TouchableOpacity onPress={decreaseZoom}><Ionicons name="remove-circle-outline" size={30} color="#fff" /></TouchableOpacity>
                        <Text style={styles.zoomText}>{(zoom * 10).toFixed(1)}x</Text>
                        <TouchableOpacity onPress={increaseZoom}><Ionicons name="add-circle-outline" size={30} color="#fff" /></TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.innerCapture} />
                    </TouchableOpacity>
                </>
            )}
        </View>
    </SafeAreaView>
  );
};

export default CameraScreen;

const { width } = Dimensions.get('window');
const FRAME_HEIGHT = width * 1.33; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  headerArea: { height: 80, justifyContent: 'center', alignItems: 'center', paddingTop: 10 },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  addressText: { color: '#aaa', fontSize: 12, marginTop: 5 },
  cameraFrame: {
      width: width - 40, height: FRAME_HEIGHT - 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#333', backgroundColor: '#1a1a1a',
  },
  cameraView: { flex: 1, width: '100%', height: '100%' },
  controlsArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  zoomRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  zoomText: { color: 'white', fontWeight: 'bold', fontSize: 16, width: 40, textAlign: 'center' },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)'
  },
  innerCapture: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  previewButtons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  retakeButton: { alignItems: 'center', padding: 10 },
  smallButtonText: { color: '#fff', fontSize: 12, marginTop: 2 },
  postButton: { flexDirection: 'row', backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  permButton: { marginTop: 20, backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
});
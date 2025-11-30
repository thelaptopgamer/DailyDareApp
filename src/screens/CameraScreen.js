// src/screens/CameraScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { auth, storage, db } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { completeDailyDare } from '../dailyDareUtils';

const CameraScreen = ({ navigation, route }) => {
  const { dare } = route.params; // retrieve the dare
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false); // Loading state for image uploading
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Compress image to save data/speed
        skipProcessing: true 
      });
      setPhoto(data.uri);
    }
  };

  //Upload, Post, and Score
  const handleUploadAndComplete = async () => {
    if (!photo) return;
    setUploading(true);

    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Error", "You must be logged in.");
        setUploading(false);
        return;
    }

    try {
        //Prepare the file
        const response = await fetch(photo);
        const blob = await response.blob();
        const filename = `proof_${user.uid}_${Date.now()}.jpg`;
        
        //Upload to Firebase Storage
        const storageRef = ref(storage, `proof_images/${filename}`);
        await uploadBytes(storageRef, blob);
        
        // Get the public link to the photo we just uploaded
        const downloadURL = await getDownloadURL(storageRef);

        // Create a "Post" in Firestore
        // This is what will show up in the Social Feed
        await addDoc(collection(db, "Posts"), {
            userId: user.uid,
            userDisplayName: user.email.split('@')[0], // Simple username from email
            dareId: dare.dareId,
            dareTitle: dare.title,
            imageUrl: downloadURL,
            timestamp: serverTimestamp(),
            doubleDares: 0, // Initialize double dare counter
            pointsAwarded: dare.points
        });

        //Award Points (The Game Logic)
        const success = await completeDailyDare(dare.dareId, dare.points);
        
        setUploading(false);

        if (success) {
            Alert.alert("Dare Complete!", "Proof uploaded and points added to your score.", [
                { text: "Awesome", onPress: () => navigation.popToTop() } // Go back to Dashboard
            ]);
        } else {
            // Edge case: Maybe they already completed it today but uploaded again?
            Alert.alert("Proof Uploaded", "Your proof is live on the feed!");
            navigation.popToTop();
        }

    } catch (error) {
        console.error("Submission Error:", error);
        Alert.alert("Error", "Failed to upload proof. Please try again.");
        setUploading(false);
    }
  };

  // render

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {photo ? (
        // PREVIEW MODE
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.image} />
          
          {uploading ? (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Posting Proof...</Text>
            </View>
          ) : (
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.buttonAlt} onPress={() => setPhoto(null)}>
                    <Text style={styles.buttonTextAlt}>Retake</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={handleUploadAndComplete}>
                    <Text style={styles.buttonText}>Post & Complete</Text>
                </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        // CAMERA MODE
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.controls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
               <View style={styles.innerCircle} />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  controls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  preview: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'black' 
  },
  image: { 
    width: '100%', 
    height: '80%', 
    resizeMode: 'contain' 
  },
  actionRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    width: '100%',
    justifyContent: 'space-evenly',
  },
  button: { 
    backgroundColor: '#4CAF50', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 30 
  },
  buttonAlt: { 
    backgroundColor: '#FF5252', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 30 
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  buttonTextAlt: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loadingOverlay: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  }
});
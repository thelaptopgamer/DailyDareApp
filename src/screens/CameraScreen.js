// src/screens/CameraScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const CameraScreen = ({ navigation, route }) => {
  const { dare } = route.params; // retrieve dare object
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync();
      setPhoto(data.uri);
    }
  };

  const handleSubmit = () => {
    console.log('Captured Photo URI:', photo);
    navigation.goBack(); // Replace later with logic to send proof
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera.</Text>;
  }

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.image} />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonAlt} onPress={() => setPhoto(null)}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Ionicons name="camera" size={40} color="white" />
          </TouchableOpacity>
        </CameraView>
      )}
    </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },  
  camera: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  captureButton: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 30,
  },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  image: { width: '90%', height: '70%', marginBottom: 30, borderRadius: 10 },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, margin: 10 },
  buttonAlt: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, margin: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

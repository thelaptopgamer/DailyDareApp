//NOT sure about this so keep it first
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { auth } from './firebaseConfig.js'; // Assuming auth is imported correctly

export default function CameraScreen() {
    const [imageUri, setImageUri] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        // request permissions for the camera 
        const { status } = await ImagePicker.requestCameraPermissionsAsync(); 
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to take proof photos.');
            return;
        }

        // Launch the device's native camera interface
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaType.Image,
            allowsEditing: false, 
            quality: 0.5, 
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Convert to Blob and Upload to Firebase
    const uploadImage = async () => {
        if (!imageUri) {
            Alert.alert('Error', 'Please take a photo first.');
            return;
        }

        setUploading(true);
        const storage = getStorage();
        const userId = auth.currentUser.uid;
        
        try {
            // AWAIT fetch to get the local file data
            const response = await fetch(imageUri);
            // AWAIT conversion to Blob
            const blob = await response.blob(); 
            
            // Create a storage reference path
            const storageRef = ref(
                storage, 
                `proof_images/${userId}/${Date.now()}.jpg`
            );

            // AWAIT the upload of the Blob data
            await uploadBytes(storageRef, blob);

            Alert.alert('Success', 'Proof photo uploaded to Firebase Storage!');
            setImageUri(null); 

        } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert('Upload Error', error.message || 'Photo upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Proof of Dare</Text>
            
            {/* Show image preview if available */}
            {imageUri && 
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            }

            {/* Show Uploading Spinner */}
            {uploading && 
                <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            }

            <Button
                title={imageUri ? "RE-TAKE PHOTO" : "TAKE PHOTO"}
                onPress={pickImage}
                color="#007AFF"
            />
            
            {/* Button to trigger the ADVANCED asynchronous upload */}
            {imageUri && !uploading && 
                <View style={styles.uploadButton}>
                    <Button
                        title="UPLOAD PROOF TO FIREBASE"
                        onPress={uploadImage}
                        color="#4CAF50"
                    />
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center', 
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 15,
    },
    previewImage: {
        width: '90%',
        height: 300,
        backgroundColor: '#eee',
        marginBottom: 20,
        borderRadius: 8,
    },
    uploadButton: {
        marginTop: 15,
        width: '100%',
    }
});
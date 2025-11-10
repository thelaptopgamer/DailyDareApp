//src/screens/DareDetailScreen.js
//Purpose: Displays the full dare details, Camera/GPS placeholders, and triggers the completion logic.

import React from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { completeDailyDare } from '../dailyDareUtils'; // To finalize scoring

const DareDetailScreen = ({ navigation, route }) => {
    //Retrieves the dare object passed from the Dashboard
    const { dare } = route.params;

    const navigateToProof = () => {
        //Navigates to the proof screen, passing the dare object
        navigation.navigate('ProofSubmission', { dare: dare });
    };
    
    //Final Completion Logic (Simulates score update after proof)
    const finalizeDareCompletion = async () => {
        //This function is the placeholder where the final score update will happen
        const success = await completeDailyDare(dare.dareId, dare.points); 
        
        if (success) {
            Alert.alert("Success!", `${dare.points} points awarded. Final submission complete.`);
            navigation.popToTop(); //Navigates back to Dashboard
        } else {
            Alert.alert("Error", "Could not complete dare.");
        }
    };

    //Placeholder function for the camera button click (Native Feature)
    const handleCameraClick = () => {
        Alert.alert("Camera logic will be implemented here for final project.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Dare Overview</Text>
                <Text style={styles.title}>{dare.title}</Text>
                <Text style={styles.description}>{dare.description}</Text>
                
                <Text style={styles.points}>Reward: {dare.points} Points</Text>
                
                {/* LOCATION PLACEHOLDER (API/Sensor Integration) */}
                <Text style={[styles.locationText, styles.locationInvalid]}>
                    GPS Location Status: Out of Range (Placeholder)
                </Text>

                <View style={styles.buttonContainer}>
                    {/* CAMERA BUTTON PLACEHOLDER */}
                    <TouchableOpacity style={styles.cameraButton} onPress={handleCameraClick}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.buttonText}>Proof (Camera)</Text>
                    </TouchableOpacity>

                    {/* SUBMIT BUTTON (Triggers score update) */}
                    <Button 
                        title="Submit Dare & Score Points" 
                        onPress={finalizeDareCompletion}
                        color="#4CAF50"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
    container: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'flex-start' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
    points: { fontSize: 20, color: '#4CAF50', marginBottom: 40, fontWeight: '700' },

    //Buttons
    buttonContainer: { width: '90%', marginTop: 30, alignItems: 'center' },
    cameraButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
    },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
    
    //Location Placeholder Styles
    locationText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    locationInvalid: { color: '#FF3B30' }, // Red for Placeholder/Invalid.. will change to green when user is in range of dare location later on
});

export default DareDetailScreen;
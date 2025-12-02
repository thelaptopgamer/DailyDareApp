//src/screens/DareDetailScreen.js
//Purpose: Displays dare details, a live GPS map of the user's location, and submission options.

import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Alert, 
    TouchableOpacity, 
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { completeDailyDare } from '../dailyDareUtils'; 

const DareDetailScreen = ({ navigation, route }) => {
    // Retrieves the dare object passed from the Dashboard
    const { dare } = route.params;

    // State for Location and Map
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    // FETCH LOCATION ON MOUNT
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoadingLocation(false);
                return;
            }

            try {
                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
            } catch (error) {
                setErrorMsg('Could not fetch location');
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    // Final Completion Logic (Simulates score update after proof)
    const finalizeDareCompletion = async () => {
        const success = await completeDailyDare(dare.dareId, dare.points); 
        
        if (success) {
            Alert.alert("Success!", `${dare.points} points awarded. Dare completed!`);
            navigation.popToTop(); // Navigates back to Dashboard
        } else {
            Alert.alert("Error", "Could not complete dare.");
        }
    };

    const handleCameraClick = () => {
        // Navigates to the Camera Screen to take a photo for the feed
        navigation.navigate('CameraScreen', { dare });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>{dare.title}</Text>
                <Text style={styles.description}>{dare.description}</Text>
                
                <Text style={styles.points}>Reward: {dare.points} Points</Text>
                
                {/* --- MAP SECTION (VISUAL GPS) --- */}
                <View style={styles.mapContainer}>
                    {loadingLocation ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text>Locating you...</Text>
                        </View>
                    ) : location ? (
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                                latitudeDelta: 0.005, // Zoom level (smaller is closer)
                                longitudeDelta: 0.005,
                            }}
                            showsUserLocation={true} // Shows the blue dot
                        >
                            <Marker
                                coordinate={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                }}
                                title="You are here"
                                description="Current Location"
                            />
                        </MapView>
                    ) : (
                        <View style={styles.errorBox}>
                            <Ionicons name="location-outline" size={40} color="#FF3B30" />
                            <Text style={styles.errorText}>{errorMsg || "Map unavailable"}</Text>
                        </View>
                    )}
                </View>
                {/* -------------------------------- */}

                <View style={styles.buttonContainer}>
                    {/* OPTIONAL CAMERA / SHARE BUTTON */}
                    <TouchableOpacity style={styles.cameraButton} onPress={handleCameraClick}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.buttonText}>Share a Photo (Optional)</Text>
                    </TouchableOpacity>

                    {/* COMPLETE DARE BUTTON (Now a full styled button) */}
                    <TouchableOpacity style={styles.completeButton} onPress={finalizeDareCompletion}>
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                        <Text style={styles.buttonText}>Complete Dare</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
    container: { flex: 1, padding: 20, alignItems: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    title: { fontSize: 22, fontWeight: '600', marginBottom: 5, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555' },
    points: { fontSize: 20, color: '#4CAF50', marginBottom: 20, fontWeight: '700' },

    // Map Styles
    mapContainer: {
        width: '100%',
        height: 200, // Fixed height for the map card
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: '#eee'
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffe6e6'
    },
    errorText: {
        color: '#FF3B30',
        marginTop: 5,
    },

    // Buttons
    buttonContainer: { width: '100%', alignItems: 'center' },
    
    // Blue "Camera" Button
    cameraButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF', // Blue
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    
    // Green "Complete" Button
    completeButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50', // Green
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 2,
    },

    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
});

export default DareDetailScreen;
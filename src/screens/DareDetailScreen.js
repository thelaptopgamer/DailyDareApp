//src/screens/DareDetailScreen.js
//Purpose: Displays the full details of a specific dare, including its GPS requirements.
//Allows users to initiate the camera flow to submit proof.

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
    //Extract the dare object from navigation parameters
    const { dare } = route.params;

    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    //Fetch user's current location on mount to show context on the map
    useEffect(() => {
        (async () => {
            //Request permissions first
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoadingLocation(false);
                return;
            }

            try {
                //Get high-accuracy location
                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
            } catch (error) {
                setErrorMsg('Could not fetch location');
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    //Handles the manual completion logic
    const finalizeDareCompletion = async () => {
        const success = await completeDailyDare(dare.dareId, dare.points); 
        
        if (success) {
            Alert.alert("Success!", `${dare.points} points awarded. Dare completed!`);
            navigation.popToTop(); // Return to Dashboard
        } else {
            Alert.alert("Error", "Could not complete dare. Please try again.");
        }
    };

    //Navigates to the Camera screen, passing the current dare object
    const handleCameraClick = () => {
        navigation.navigate('CameraScreen', { dare });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>{dare.title}</Text>
                <Text style={styles.description}>{dare.description}</Text>
                
                <Text style={styles.points}>Reward: {dare.points} Points</Text>
                
                {/* Visual GPS Confirmation */}
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
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            showsUserLocation={true}
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

                <View style={styles.buttonContainer}>
                    {/* Primary Action: Take Proof Photo */}
                    <TouchableOpacity style={styles.cameraButton} onPress={handleCameraClick}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.buttonText}>Share a Photo (Optional)</Text>
                    </TouchableOpacity>

                    {/* Secondary Action: Manual Completion */}
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

    //Map Styling
    mapContainer: {
        width: '100%',
        height: 200, 
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

    buttonContainer: { width: '100%', alignItems: 'center' },
    
    //Button Styles
    cameraButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF', 
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
    
    completeButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50', 
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
// src/AppTabs.js
// Purpose: This navigator checks the user's onboarding status before deciding whether 
// to show the questionnaire (OnboardingScreen) or the main app tabs.

import React, { useState, useEffect } from 'react'; // useState and useEffect (IAT359_Week3, Page 46)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Tab Navigator
import { Ionicons } from '@expo/vector-icons'; // Vector icons for the tab bar
import { db, auth } from './firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore'; // Real-time listener for user data (Lecture 6)
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screen Imports
import DareHubScreen from './screens/DareHubScreen'; 
import ProfileScreen from './screens/ProfileScreen';
import CommunityScreen from './screens/CommunityScreen'; 
import OnboardingScreen from './screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

const AppTabs = () => {
    // STATE: Tracks the user's completion status for the initial questionnaire
    const [onboardingStatus, setOnboardingStatus] = useState(null); 
    
    // SIDE EFFECT: Checks onboarding status in real-time using onSnapshot
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return; // Exit if user somehow logged out

        const userDocRef = doc(db, 'Users', user.uid);
        
        // FIRESTORE LISTENER: Monitors the user's profile document for changes
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // If onboardingComplete is true, status is true. Otherwise, it's false.
                const status = docSnap.data().onboardingComplete === true;
                setOnboardingStatus(status);
            }
        }, (error) => {
            console.error("Error checking onboarding status:", error);
        });

        // CLEANUP: Stop listening when the component is removed
        return () => unsubscribe();
    }, []); // Runs once on mount

    // CONDITIONAL RENDERING (1): Show loading spinner while fetching status
    if (onboardingStatus === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        ); 
    }

    // CONDITIONAL RENDERING (2 - IAT359_Week3, Page 23): If onboarding is NOT complete, 
    // show the Onboarding screen instead of the tabs.
    if (onboardingStatus === false) {
        return <OnboardingScreen />;
    }

    // FINAL RENDER: If onboarding is complete (true), show the main tabs.
    return (
        <Tab.Navigator
            initialRouteName="DareHub"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    // TERNARY OPERATOR: Used to switch between active/inactive icon states
                    if (route.name === 'DareHub') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Community') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }
                    // Uses Ionicons library for vector icons
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF', 
                tabBarInactiveTintColor: 'gray',
            })}
        >
            {/* Tab Screens (IAT359_Lecture4, Page 28) */}
            <Tab.Screen name="DareHub" component={DareHubScreen} />
            <Tab.Screen name="Community" component={CommunityScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AppTabs;
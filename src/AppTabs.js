// src/AppTabs.js
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from './firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import DareHubScreen from './screens/DareHubScreen'; 
import ProfileScreen from './screens/ProfileScreen';
import CommunityScreen from './screens/CommunityScreen'; 
import OnboardingScreen from './screens/OnboardingScreen'; // <-- NEW IMPORT

const Tab = createBottomTabNavigator();

const AppTabs = () => {
    const [onboardingStatus, setOnboardingStatus] = useState(null); 
    
    // Check onboarding status in real-time
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, 'Users', user.uid);
        
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // If onboardingComplete is false or undefined (new user), the status is false
                const status = docSnap.data().onboardingComplete === true;
                setOnboardingStatus(status);
            }
        }, (error) => {
            console.error("Error checking onboarding status:", error);
        });

        return () => unsubscribe();
    }, []);

    // Show loading spinner while checking status
    if (onboardingStatus === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        ); 
    }

    // CRITICAL: If onboarding is NOT complete, show the Onboarding screen instead of the tabs
    if (onboardingStatus === false) {
        return <OnboardingScreen />;
    }

    // If onboarding is complete (true), show the main tabs
    return (
        <Tab.Navigator
            initialRouteName="DareHub"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'DareHub') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Community') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF', 
                tabBarInactiveTintColor: 'gray',
            })}
        >
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
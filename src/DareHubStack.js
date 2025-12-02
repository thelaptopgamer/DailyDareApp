//src/DareHubStack.js
//Purpose: Defines the Stack Navigator for the main 'DareHub' flow.
//This handles the hierarchical navigation from the Dashboard into specific dare actions.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DareHubScreen from './screens/DareHubScreen';
import DareDetailScreen from './screens/DareDetailScreen'; 
import CameraScreen from './screens/CameraScreen'; 
import AIDareScreen from './screens/AIDareScreen'; //Screen for AI generated dares

//Initialize the stack navigator instance
const Stack = createNativeStackNavigator();

const DareHubStack = () => {
    return (
        <Stack.Navigator 
            initialRouteName="Dashboard" //The entry screen for this specific stack
            screenOptions={{ headerBackTitleVisible: false }} //Standard UX setting
        >
            {/* Dashboard - Main Hub */}
            <Stack.Screen 
                name="Dashboard" 
                component={DareHubScreen} 
                options={{ headerShown: false }} //We use a custom header in DareHubScreen
            />
            
            {/* Dare Details - Displays mission/reward summary */}
            <Stack.Screen 
                name="DareDetail" 
                component={DareDetailScreen} 
                options={{ title: 'Dare Overview' }}
            />
            
            {/* Camera Screen - Native feature for proof capture */}
            <Stack.Screen 
                name="CameraScreen" 
                component={CameraScreen} 
                options={{ 
                    title: 'Take Proof',
                    headerShown: false //Hide header for full-screen camera view
                }}
            />

            {/* AI Bonus Round - Overtime challenge generation */}
            <Stack.Screen 
                name="AIDareScreen" 
                component={AIDareScreen} 
                options={{ headerShown: false }} //Uses a custom header within the screen
            />

        </Stack.Navigator>
    );
};

export default DareHubStack;
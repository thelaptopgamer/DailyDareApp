//src/DareHubStack.js
//Purpose: Handles navigation for Dashboard -> Detail -> Camera -> AI Screen

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DareHubScreen from './screens/DareHubScreen';
import DareDetailScreen from './screens/DareDetailScreen'; 
import CameraScreen from './screens/CameraScreen'; 
import AIDareScreen from './screens/AIDareScreen'; // IMPORT NEW SCREEN

const Stack = createNativeStackNavigator();

const DareHubStack = () => {
    return (
        <Stack.Navigator 
            initialRouteName="Dashboard"
            screenOptions={{ headerBackTitleVisible: false }} 
        >
            {/* 1. Dashboard */}
            <Stack.Screen 
                name="Dashboard" 
                component={DareHubScreen} 
                options={{ headerShown: false }}
            />
            
            {/* 2. Dare Details */}
            <Stack.Screen 
                name="DareDetail" 
                component={DareDetailScreen} 
                options={{ title: 'Dare Overview' }}
            />
            
            {/* 3. Camera Screen */}
            <Stack.Screen 
                name="CameraScreen" 
                component={CameraScreen} 
                options={{ 
                    title: 'Take Proof',
                    headerShown: false 
                }}
            />

            {/* 4. AI Bonus Round */}
            <Stack.Screen 
                name="AIDareScreen" 
                component={AIDareScreen} 
                options={{ headerShown: false }} 
            />

        </Stack.Navigator>
    );
};

export default DareHubStack;
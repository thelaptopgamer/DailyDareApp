//src/DareHubStack.js
//Purpose: Defines the Stack Navigator for the DareHub flow: Dashboard -> Detail -> Proof.
//This implements the Stack Navigation structure

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DareHubScreen from './screens/DareHubScreen';
import DareDetailScreen from './screens/DareDetailScreen'; 
import ProofSubmissionScreen from './screens/ProofSubmissionScreen'; 
import CameraScreen from './screens/CameraScreen';



const Stack = createNativeStackNavigator();

const DareHubStack = () => {
    return (
        <Stack.Navigator 
            initialRouteName="Dashboard"
            screenOptions={{ headerBackTitleVisible: false }} 
        >
            <Stack.Screen 
                name="Dashboard" 
                component={DareHubScreen} 
                options={{ headerShown: false }}
            />
            {/* DareDetailScreen: The step where users view full instructions of the app */}
            <Stack.Screen 
                name="DareDetail" 
                component={DareDetailScreen} 
                options={{ title: 'Dare Overview' }}
            />
            {/* ProofSubmissionScreen: The placeholder for the Native Feature implementation */}
            <Stack.Screen 
                name="ProofSubmission" 
                component={ProofSubmissionScreen} 
                options={{ title: 'Submit Proof' }}
            />
            {/* Camera */}
            <Stack.Screen 
                name="CameraScreen" 
                component={CameraScreen} 
                options={{ title: 'Camera' }}
            />

        </Stack.Navigator>
    );
};

export default DareHubStack;
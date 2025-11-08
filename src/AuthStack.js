// src/AuthStack.js
// Purpose: Defines the linear flow for unauthenticated users (Login and Signup screens).
// This component is the Authentication Stack Navigator (IAT359_Lecture4, Page 9).

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Stack Navigator method
import LoginScreen from './screens/LoginScreen.js';
import SignupScreen from './screens/SignupScreen.js';

// Get the navigator object
const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
     <Stack.Navigator 
       initialRouteName="Login" // Sets the first screen to display
     screenOptions={{ headerShown: false }} // Removes the default header bar
 >
      {/* The stack organizes screens linearly (IAT359_Lecture4, Page 10) */}
    <Stack.Screen name="Login" component={LoginScreen} />
     <Stack.Screen name="Signup" component={SignupScreen} />
     </Stack.Navigator>
   );
}
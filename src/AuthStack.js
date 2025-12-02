//src/AuthStack.js
//Purpose: Defines the linear flow for unauthenticated users.
//This Stack Navigator handles navigation between Login and Signup screens.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; //Stack Navigator method
import LoginScreen from './screens/LoginScreen.js';
import SignupScreen from './screens/SignupScreen.js';

//Get the navigator object
const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
      <Stack.Navigator 
        initialRouteName="Login" //Sets the entry point for unauthenticated users
        screenOptions={{ headerShown: false }} //Hides the navigation header bar across all screens in this stack
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
}
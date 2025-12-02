// src/NotificationScheduler.js

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage for persistence

//storing the notification ID in AsyncStorage
const NOTIFICATION_ID_KEY = '@DailyDareNotificationId';

export default function NotificationScheduler() {
    const [isLoading, setIsLoading] = useState(false);

    // Request system permission for notifications
    const registerForPushNotificationsAsync = async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission Denied', 'Cannot schedule reminders without notification permission.');
            return false;
        }
        
        // For Android: Set up a notification channel 
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Daily Dare Reminders',
                importance: Notifications.Android.Importance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
        return true;
    };


    // schedule and persist the ID 
    const scheduleDailyDare = async () => {
        setIsLoading(true);

        const permissionGranted = await registerForPushNotificationsAsync();
        if (!permissionGranted) {
            setIsLoading(false);
            return;
        }

        try {
            //Check if a reminder is already scheduled and cancel it first
            const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
            if (existingId) {
                await Notifications.cancelScheduledNotificationAsync(existingId);
            }

            //AWAIT the scheduling method which returns the unique ID (a string)
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "⏰ Daily Dare Time!",
                    body: "Your daily challenge is ready. Check the DareHub!",
                },
                trigger: { 
                    //scheduling every day at 9:00 AM
                    hour: 9, 
                    minute: 0, 
                    repeats: true 
                },
            });

            // Save the returned ID locally using AsyncStorage
            await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId); 
            
            Alert.alert(
                'Reminder Set!',
                `Reminder scheduled daily at 9:00 AM. ID saved for later cancellation: ${notificationId}`
            );

        } catch (error) {
            console.error("Scheduling Error:", error);
            Alert.alert('Error', 'Failed to schedule the reminder.');
        } finally {
            setIsLoading(false);
        }
    };

    //cancel the scheduled notification 
    const cancelDailyDare = async () => {
        const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
        if (existingId) {
            await Notifications.cancelScheduledNotificationAsync(existingId);
            await AsyncStorage.removeItem(NOTIFICATION_ID_KEY); 
            Alert.alert('Cancelled', 'Daily Dare reminder has been cancelled.');
        } else {
            Alert.alert('Info', 'No daily reminder is currently scheduled.');
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Daily Dare Reminder</Text>
            {isLoading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <View>
                    <Button 
                        title="Schedule Daily Dare (9:00 AM)" 
                        onPress={scheduleDailyDare} 
                        color="#4CAF50" // Green
                    />
                    <View style={{ height: 10 }} />
                    <Button 
                        title="Cancel Daily Dare Reminder" 
                        onPress={cancelDailyDare} 
                        color="#F44336" // Red
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
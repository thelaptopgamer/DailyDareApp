//src/screens/ProofSubmissionScreen.js
//Purpose: Placeholder screen demonstrating Camera/GPS Native Feature Integration (Milestone 2 Requirement).

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProofSubmissionScreen = ({ navigation, route }) => {
    const { dare } = route.params;

    const finalizeCompletion = () => {
        //Simulates returning to the Dashboard after submission
        navigation.popToTop(); 
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Proof Submission System</Text>
                <Text style={styles.title}>Dare: {dare.title}</Text>
                
                <View style={styles.statusBox}>
                    <Text style={styles.statusText}>📸 Native Feature Status (Milestone 2):</Text>
                    <Text style={styles.statusDetail}>This screen is structured to access **Camera** and **GPS** (Mandatory Features).</Text>
                    <Text style={styles.statusDetail}>The logic will be integrated with **Firebase Cloud Storage** for file upload in Milestone 3.</Text>
                    <Text style={styles.statusDetail}>The system relies on the **{dare.proof_required ? 'Camera/GPS' : 'Self-Report'}** for verification.</Text>
                </View>

                <Button 
                    title="Simulate Submission (Go Back)" 
                    onPress={finalizeCompletion}
                    color="#4CAF50"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    container: { flex: 1, padding: 30, alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    title: { fontSize: 18, marginBottom: 40, textAlign: 'center' },
    statusBox: {
        backgroundColor: '#E6F0FF', 
        padding: 20,
        borderRadius: 10,
        marginBottom: 50,
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF',
    },
    statusText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    statusDetail: { fontSize: 16, marginBottom: 5 },
});

export default ProofSubmissionScreen;
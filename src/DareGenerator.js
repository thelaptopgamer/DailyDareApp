import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// 1. SECURE ACCESS: Load the key from the .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

const DareGenerator = () => {
  const [dare, setDare] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Gemini with the secure key
  const genAI = new GoogleGenerativeAI(API_KEY);

  const generateDare = async () => {
    if (!API_KEY) {
      Alert.alert("Configuration Error", "API Key not found. Please check your .env file.");
      return;
    }

    setLoading(true);
    setDare(null);

    try {
      // 2. MODEL CONFIGURATION: Fast & Cheap model
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        // 3. ETHICAL GUARDRAILS (System Instructions)
        systemInstruction: `
          You are a fun, party-game assistant for a mobile app. 
          Your goal is to generate "Dares" for users to perform.
          
          CRITICAL SAFETY RULES:
          1. NEVER generate dares that are illegal, sexually explicit, dangerous, or physically harmful.
          2. NEVER generate dares that involve harassment, bullying, or hate speech.
          3. Dares should be fun, social, and embarrassing but harmless (e.g., singing, dancing, acting).
          
          OUTPUT FORMAT:
          Return ONLY a JSON object with this structure:
          {
            "title": "Short title of the dare",
            "description": "Detailed instructions on what to do",
            "difficulty": "Easy" | "Medium" | "Hard"
          }
        `,
      });

      // 4. HARD FILTERS: Block bad content immediately
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      ];

      const generationConfig = { responseMimeType: "application/json" };

      // 5. TRIGGER GENERATION
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Generate a random dare." }] }],
        safetySettings,
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const dareData = JSON.parse(text);
      
      setDare(dareData);

    } catch (error) {
      console.error("AI Error:", error);
      Alert.alert("AI Error", "The AI could not generate a dare. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Dare Generator</Text>
      
      {dare && (
        <View style={styles.card}>
          <Text style={styles.difficulty}>{dare.difficulty}</Text>
          <Text style={styles.title}>{dare.title}</Text>
          <Text style={styles.description}>{dare.description}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={generateDare} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate New Dare</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', marginVertical: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 3 },
  difficulty: { color: '#007AFF', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, marginBottom: 5 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  description: { fontSize: 16, color: '#555', lineHeight: 22 },
  button: { backgroundColor: '#6200ea', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, elevation: 2 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default DareGenerator;
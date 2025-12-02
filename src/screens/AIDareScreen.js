//src/screens/AIDareScreen.js
//Handles the "Overtime" mode where users can generate infinite dares using Google Gemini.
//Implements a self-healing API call to handle model versioning automatically.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

//Access the API key securely from the environment file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

const AIDareScreen = ({ navigation }) => {
  const [dare, setDare] = useState(null);
  const [loading, setLoading] = useState(false);
  
  //Stores the specific model name detected for this key
  const [workingModel, setWorkingModel] = useState(null); 
  
  //Tracks generated dares in this session to prevent duplicates
  const [history, setHistory] = useState([]);

  //On mount, query Google to find which model is currently active for our API key
  useEffect(() => {
    findWorkingModel();
  }, []);

  const findWorkingModel = async () => {
    if (!API_KEY) return;
    try {
        //Fetch the list of available models directly from the API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.models) {
            //Filter for models that support content generation
            const validModels = data.models.filter(m => 
                m.supportedGenerationMethods.includes("generateContent")
            );
            
            //Prioritize Flash for speed, fallback to Pro if necessary
            const preferred = validModels.find(m => m.name.includes("flash")) || 
                              validModels.find(m => m.name.includes("pro")) || 
                              validModels[0];

            if (preferred) {
                setWorkingModel(preferred.name); 
            } else {
                Alert.alert("Configuration Error", "No compatible AI models found for this API key.");
            }
        }
    } catch (e) {
        console.error("Failed to retrieve model list:", e);
    }
  };

  const generateDare = async () => {
    if (!API_KEY) { 
        Alert.alert("Error", "API Key missing. Please check your .env file."); 
        return; 
    }
    
    //Ensure we have a valid model before attempting generation
    if (!workingModel) {
        Alert.alert("Initializing", "Connecting to AI service. Please try again in a moment.");
        findWorkingModel();
        return;
    }
    
    setLoading(true);
    setDare(null);

    //Randomize difficulty to ensure variety (Easy/Medium/Hard)
    const difficulties = ["Easy", "Medium", "Hard"];
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];

    //Build a prompt that excludes previously generated dares to avoid repetition
    const exclusionList = history.length > 0 ? `Do NOT generate these dares again: ${history.join(', ')}.` : "";

    try {
      //Use direct REST fetch to avoid SDK version conflicts
      const url = `https://generativelanguage.googleapis.com/v1beta/${workingModel}:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                //Prompt engineering: Force JSON output and specific structure
                text: `Generate a fun, social, or physical dare with ${randomDiff} difficulty. 
                       ${exclusionList}
                       Return ONLY a raw JSON object: { "title": "...", "description": "...", "difficulty": "${randomDiff}" }. 
                       Do not use Markdown formatting.`
              }]
            }]
          })
        }
      );

      const result = await response.json();

      if (result.error) {
          throw new Error(result.error.message || "API Request Failed");
      }

      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from AI");

      //Remove Markdown code blocks if the AI adds them
      const firstChar = text.indexOf('{');
      const lastChar = text.lastIndexOf('}');
      if (firstChar !== -1 && lastChar !== -1) {
          text = text.substring(firstChar, lastChar + 1);
      }

      const dareData = JSON.parse(text);
      
      //Ensure the difficulty matches our request
      dareData.difficulty = randomDiff; 
      
      setDare(dareData);
      
      //Add title to history for next exclusion check
      setHistory(prev => [...prev, dareData.title]);

    } catch (error) {
      console.error("AI Generation Error:", error);
      Alert.alert("AI Error", "Could not generate a dare. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //Determine points based on difficulty (50% value of standard daily dares)
  const getPoints = (difficulty) => {
      switch(difficulty) {
          case 'Easy': return 25;   
          case 'Medium': return 50; 
          case 'Hard': return 75;   
          default: return 25;
      }
  };

  //Package the dare object and navigate to the Camera screen
  const handleAccept = () => {
      if (!dare) return;
      
      const fullDare = {
          dareId: `ai_${Date.now()}`, //Unique ID based on timestamp
          title: dare.title,
          description: dare.description,
          difficulty: dare.difficulty,
          points: getPoints(dare.difficulty), 
          isAI: true, //Flag to identify this as a generated dare
          tags: ['AI Dare', 'Overtime'] 
      };

      navigation.navigate('CameraScreen', { dare: fullDare });
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Overtime Challenge</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.introBox}>
                <Ionicons name="sparkles" size={40} color="#9C27B0" style={{marginBottom: 10}} />
                <Text style={styles.introText}>
                    Welcome to Overtime! The daily limit is lifted.
                </Text>
                <Text style={styles.warningText}>
                    Earn unlimited extra points at a 50% rate.
                </Text>
            </View>

            {dare ? (
                //Display the generated dare card
                <View style={styles.dareCard}>
                    <View style={styles.badgeRow}>
                        <View style={styles.diffBadge}>
                            <Text style={styles.diffText}>{dare.difficulty}</Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>+{getPoints(dare.difficulty)} PTS</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.dareTitle}>{dare.title}</Text>
                    <Text style={styles.dareDesc}>{dare.description}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.refuseBtn} onPress={generateDare}>
                            <Ionicons name="refresh" size={20} color="#FF3B30" />
                            <Text style={styles.refuseText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.acceptText}>Accept & Start</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                //Show generate button
                <TouchableOpacity style={styles.generateBtn} onPress={generateDare} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.genText}>Start Overtime Shift</Text>
                    )}
                </TouchableOpacity>
            )}
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3E5F5' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A148C' },
    content: { padding: 20, alignItems: 'center' },
    
    introBox: { alignItems: 'center', marginBottom: 30 },
    introText: { textAlign: 'center', fontSize: 16, color: '#6A1B9A', marginBottom: 5, fontWeight: '600' },
    warningText: { textAlign: 'center', fontSize: 12, color: '#888', fontStyle: 'italic' },

    dareCard: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    diffBadge: { backgroundColor: '#E1BEE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    diffText: { fontWeight: 'bold', color: '#4A148C' },
    pointsBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    pointsText: { fontWeight: 'bold', color: '#4CAF50' },

    dareTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    dareDesc: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 25 },

    actionRow: { flexDirection: 'row', gap: 15 },
    refuseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30' },
    refuseText: { color: '#FF3B30', fontWeight: 'bold', marginLeft: 5 },
    acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9C27B0', padding: 15, borderRadius: 12 },
    acceptText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },

    generateBtn: { backgroundColor: '#9C27B0', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginTop: 50 },
    genText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default AIDareScreen;
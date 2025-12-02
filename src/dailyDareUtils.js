// src/dailyDareUtils.js
// Purpose: Logic for assigning dares, rerolling, and COMPLETING them (Auto-detects AI).

import { db, auth } from './firebaseConfig.js';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, query, where } from 'firebase/firestore'; 

//Config
const DARES_PER_DAY = 3; 
const FREE_REROLLS_PER_DAY = 2; 
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard']; 
const REROLL_COST = 50;

const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

// --- CORE FUNCTION: Assigns Dares based on User Interests ---
const assignDailyDare = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const todayDate = getTodayDate();
    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        if (!userDoc.exists()) {
            userData = {
                score: 0, rerollTokens: FREE_REROLLS_PER_DAY, daresCompletedCount: 0,
                createdAt: new Date().toISOString(), dailyDares: [], onboardingComplete: false,
                interests: []
            };
            await setDoc(userDocRef, userData);
        } else {
             if (userData.lastDareAssignment !== todayDate) {
                 await updateDoc(userDocRef, { rerollTokens: FREE_REROLLS_PER_DAY });
             }
        }

        if (userData?.dailyDares?.length > 0 && userData.dailyDares[0].assignedDate === todayDate) {
            return userData.dailyDares;
        }

        // SELECTION LOGIC
        const newDailyDares = [];
        const userInterests = userData.interests || [];
        const assignedDareIds = new Set();
        
        for (const level of DIFFICULTY_LEVELS) {
            const q = query(collection(db, "Dares"), where("difficulty", "==", level));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const availableDares = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const preferredDares = availableDares.filter(dare => {
                    if (!dare.tags) return false;
                    return dare.tags.some(tag => userInterests.includes(tag));
                });

                const fallbackDares = availableDares.filter(dare => !assignedDareIds.has(dare.id));
                let selectedDare = null;

                const uniquePreferred = preferredDares.filter(d => !assignedDareIds.has(d.id));
                
                if (uniquePreferred.length > 0) {
                    selectedDare = uniquePreferred[Math.floor(Math.random() * uniquePreferred.length)];
                } else if (fallbackDares.length > 0) {
                    selectedDare = fallbackDares[Math.floor(Math.random() * fallbackDares.length)];
                }

                if (selectedDare) {
                    newDailyDares.push({
                        dareId: selectedDare.id, assignedDate: todayDate, completed: false, 
                        title: selectedDare.title, description: selectedDare.description,
                        points: selectedDare.points, difficulty: selectedDare.difficulty,
                    });
                    assignedDareIds.add(selectedDare.id);
                }
            }
        }
        
        await updateDoc(userDocRef, { dailyDares: newDailyDares, lastDareAssignment: todayDate });
        return newDailyDares;

    } catch (error) {
        console.error("Error assigning daily dares:", error);
        return null;
    }
};

// --- FIX: UPDATED COMPLETION LOGIC ---
const completeDailyDare = async (dareId, points, isAI = false) => {
    const user = auth.currentUser;
    if (!user || !dareId) return false;

    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        let currentScore = userData?.score || 0;
        let daresCompletedCount = userData?.daresCompletedCount || 0;
        let dares = userData?.dailyDares || [];
        
        // AUTO-DETECT AI: Check if explicitly 'isAI' OR if the ID starts with 'ai_'
        const isAIDare = isAI || (typeof dareId === 'string' && dareId.startsWith('ai_'));

        if (isAIDare) {
            console.log("Completing AI/Overtime Dare. Adding points directly.");
            currentScore += points;
            daresCompletedCount += 1;
        } else {
            console.log("Completing Regular Dare. Updating list.");
            const dareIndex = dares.findIndex(d => d.dareId === dareId);
            
            // Not found in daily list? Exit.
            if (dareIndex === -1) {
                console.warn("Dare ID not found in daily list:", dareId);
                return false; 
            }
            
            // Already done? Exit.
            if (dares[dareIndex].completed) return false;

            dares[dareIndex].completed = true;
            currentScore += points;
            daresCompletedCount += 1;
        }

        // Save changes to Firestore
        await updateDoc(userDocRef, {
            dailyDares: dares, 
            score: currentScore, 
            daresCompletedCount: daresCompletedCount, 
        });
        
        return true;
    } catch (error) {
        console.error("Error completing dare:", error);
        return false;
    }
};

const rerollDailyDare = async (currentDareId) => {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "User not logged in." };

    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        let availableTokens = userData?.rerollTokens || 0;
        let currentScore = userData?.score || 0;
        let dares = userData?.dailyDares || [];
        let userInterests = userData?.interests || [];

        if (availableTokens > 0) {
            availableTokens -= 1; 
        } else if (currentScore >= REROLL_COST) {
            currentScore -= REROLL_COST; 
        } else {
            return { success: false, message: `Not enough points or free tokens. Reroll costs ${REROLL_COST} points.` };
        }
        
        const dareIndex = dares.findIndex(d => d.dareId === currentDareId);
        if (dareIndex === -1) { return { success: false, message: "Dare to reroll not found." }; }

        const originalDareDifficulty = dares[dareIndex].difficulty;
        const daresRef = collection(db, "Dares");
        const dareSnapshot = await getDocs(daresRef);
        
        const availableDares = dareSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(dare => dare.id !== currentDareId && dare.difficulty === originalDareDifficulty); 

        let newDare = null;
        const preferred = availableDares.filter(d => d.tags && d.tags.some(t => userInterests.includes(t)));
        
        if (preferred.length > 0) {
             newDare = preferred[Math.floor(Math.random() * preferred.length)];
        } else if (availableDares.length > 0) {
             newDare = availableDares[Math.floor(Math.random() * availableDares.length)];
        } else {
             return { success: false, message: "No unique dares available." };
        }
        
        const todayDate = getTodayDate();
        const newDareObject = {
            dareId: newDare.id, assignedDate: todayDate, completed: false, 
            title: newDare.title, description: newDare.description,
            points: newDare.points, difficulty: newDare.difficulty,
        };
        
        dares[dareIndex] = newDareObject;

        await updateDoc(userDocRef, { dailyDares: dares, rerollTokens: availableTokens, score: currentScore });

        return { success: true, message: `Rerolled to: ${newDare.title}.`, newDare: newDareObject, newRerollCount: availableTokens };

    } catch (error) {
        console.error("Error rerolling:", error);
        return { success: false, message: "Error during reroll." };
    }
};

const useSkipToGainReroll = async () => {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "User not logged in." };

    const userDocRef = doc(db, 'Users', user.uid);
    const SKIP_COST = 50; 

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const currentRerolls = userData?.rerollTokens || 0;
        const currentScore = userData?.score || 0;

        if (currentScore < SKIP_COST) {
             return { success: false, message: `Not enough points! Cost: ${SKIP_COST}.` };
        }

        const newRerolls = currentRerolls + 1;
        const newScore = currentScore - SKIP_COST; 

        await updateDoc(userDocRef, { rerollTokens: newRerolls, score: newScore });

        return { success: true, message: `Exchanged 50pts for 1 Token.`, newRerollCount: newRerolls };

    } catch (error) {
        console.error("Error using skip:", error);
        return { success: false, message: "Error during exchange." };
    }
};

export { assignDailyDare, getTodayDate, completeDailyDare, rerollDailyDare, useSkipToGainReroll };
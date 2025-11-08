// src/dailyDareUtils.js
// Purpose: Contains all core asynchronous logic for assigning dares, tracking progress, 
// and handling the reroll economy.

import { db, auth } from './firebaseConfig';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, query, where } from 'firebase/firestore'; 

// --- Configuration Constants ---
const DARES_PER_DAY = 3; 
const FREE_REROLLS_PER_DAY = 2; 
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard']; 
const REROLL_COST = 50; // Points charged for purchasing a reroll

// Helper function to format today's date (YYYY-MM-DD)
const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

/**
 * Assigns 1 Easy, 1 Medium, and 1 Hard dare to the user, and handles new user initialization.
 * This is an ASYNC function because it performs remote data fetching (Lecture 7).
 */
const assignDailyDare = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const todayDate = getTodayDate();
    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        // 1. Check & Initialize User Profile (Firestore Write: setDoc)
        if (!userDoc.exists()) {
            // Document does not exist: Create it with default values
            userData = {
                score: 0,
                rerollTokens: FREE_REROLLS_PER_DAY, 
                daresCompletedCount: 0,
                createdAt: new Date().toISOString(),
                dailyDares: [],
                onboardingComplete: false, 
            };
            await setDoc(userDocRef, userData);
            console.log(`Created new user document for ${user.email}`);
        } else {
             // Existing user logic: Ensure fields are initialized (Score, Tokens, Onboarding Status)
             // This uses updateDoc to patch any missing fields from old accounts
             let shouldUpdate = false;
             if (userData.rerollTokens === undefined) { userData.rerollTokens = FREE_REROLLS_PER_DAY; shouldUpdate = true; }
             if (userData.score === undefined) { userData.score = 0; shouldUpdate = true; }
             if (userData.daresCompletedCount === undefined) { userData.daresCompletedCount = 0; shouldUpdate = true; }
             if (userData.onboardingComplete === undefined) { userData.onboardingComplete = true; shouldUpdate = true; }
             
             if (shouldUpdate) { await updateDoc(userDocRef, userData); }
        }

        // 2. Check for Daily Assignment (Avoid re-assigning if already done today)
        if (userData?.dailyDares?.length > 0 && userData.dailyDares[0].assignedDate === todayDate) {
            console.log("3 Daily Dares already assigned for today.");
            return userData.dailyDares;
        }

        // 3. Reset Tokens and Fetch 3 New Dares (1 of each difficulty)
        await updateDoc(userDocRef, { rerollTokens: FREE_REROLLS_PER_DAY });
        
        const newDailyDares = [];
        const assignedDareIds = new Set();
        
        for (const level of DIFFICULTY_LEVELS) {
            // FIRESTORE QUERY: Filter by 'difficulty' field (where - IAT359_Lecture6)
            const q = query(collection(db, "Dares"), where("difficulty", "==", level));
            const snapshot = await getDocs(q); // await getDocs reads data
            
            if (!snapshot.empty) {
                const availableDares = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // MAP/FILTER: Uses JS array methods (IAT359_Week3, Page 16, 18)
                const unassignedDares = availableDares.filter(dare => !assignedDareIds.has(dare.id));

                if (unassignedDares.length > 0) {
                    const randomIndex = Math.floor(Math.random() * unassignedDares.length);
                    const newDare = unassignedDares[randomIndex];
                    
                    newDailyDares.push({
                        dareId: newDare.id, assignedDate: todayDate, completed: false, 
                        title: newDare.title, description: newDare.description,
                        points: newDare.points, difficulty: newDare.difficulty,
                    });
                    assignedDareIds.add(newDare.id);
                }
            }
        }
        
        // 4. Update the user's document in Firestore with the new array
        await updateDoc(userDocRef, { dailyDares: newDailyDares, lastDareAssignment: todayDate, });
        
        console.log(`Assigned ${newDailyDares.length} Daily Dares: 1 Easy, 1 Medium, 1 Hard.`);
        return newDailyDares;

    } catch (error) {
        console.error("Error assigning daily dares:", error);
        return null;
    }
};

/**
 * Marks a specific dare as completed and updates points and total completion count.
 */
const completeDailyDare = async (dareId, points) => {
    const user = auth.currentUser;
    if (!user || !dareId) return false;

    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        let currentScore = userData?.score || 0;
        let daresCompletedCount = userData?.daresCompletedCount || 0;
        let dares = userData?.dailyDares || [];
        
        // Find dare by ID and prevent double completion
        const dareIndex = dares.findIndex(d => d.dareId === dareId);
        if (dareIndex === -1) return false;
        if (dares[dareIndex].completed) return false;

        // Perform score calculation and update array
        dares[dareIndex].completed = true;
        currentScore += points;
        daresCompletedCount += 1;

        // Firestore Write: Update three fields simultaneously
        await updateDoc(userDocRef, {
            dailyDares: dares, 
            score: currentScore, 
            daresCompletedCount: daresCompletedCount, 
        });

        console.log(`Dare completed! Added ${points} points. New score: ${currentScore}`);
        return true;

    } catch (error) {
        console.error("Error completing daily dare:", error);
        return false;
    }
};

/**
 * Handles reroll logic: uses a free token OR deducts 50 points for a purchase.
 */
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

        // 1. Check token/point cost logic
        if (availableTokens > 0) {
            availableTokens -= 1; // Use free token
        } else if (currentScore >= REROLL_COST) {
            currentScore -= REROLL_COST; // Deduct cost
        } else {
            return { success: false, message: `Not enough points or free tokens. Reroll costs ${REROLL_COST} points.` };
        }
        
        const dareIndex = dares.findIndex(d => d.dareId === currentDareId);
        if (dareIndex === -1) { return { success: false, message: "Dare to reroll not found in the list." }; }

        const originalDareDifficulty = dares[dareIndex].difficulty;
        
        // 2. Fetch all dares and find replacement of the SAME difficulty
        const daresRef = collection(db, "Dares");
        const dareSnapshot = await getDocs(daresRef);
        
        const availableDares = dareSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(dare => 
                dare.id !== currentDareId && 
                dare.difficulty === originalDareDifficulty
            ); 

        if (availableDares.length === 0) {
             return { success: false, message: "No unique dares available for reroll in this difficulty category." };
        }
        
        const randomIndex = Math.floor(Math.random() * availableDares.length);
        const newDare = availableDares[randomIndex];
        
        const todayDate = getTodayDate();

        // 3. Create new dare object and update document
        const newDareObject = {
            dareId: newDare.id, assignedDate: todayDate, completed: false, 
            title: newDare.title, description: newDare.description,
            points: newDare.points, difficulty: newDare.difficulty,
        };
        
        dares[dareIndex] = newDareObject;

        await updateDoc(userDocRef, {
            dailyDares: dares,
            rerollTokens: availableTokens,
            score: currentScore,
        });

        return { 
            success: true, 
            message: `Rerolled to: ${newDare.title}. ${availableTokens} free tokens remaining.`,
            newDare: newDareObject,
            newRerollCount: availableTokens
        };

    } catch (error) {
        console.error("Error rerolling daily dare:", error);
        return { success: false, message: "An error occurred during reroll." };
    }
};

/**
 * Uses a Skip (which now costs points) to gain one Reroll Token.
 */
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

        // Check score before purchasing skip token
        if (currentScore < SKIP_COST) {
             return { 
                 success: false, 
                 message: `Not enough points! Exchange costs ${SKIP_COST} points. You have ${currentScore}.`
             };
        }

        const newRerolls = currentRerolls + 1;
        const newScore = currentScore - SKIP_COST; 

        // Firestore Write
        await updateDoc(userDocRef, {
            rerollTokens: newRerolls, 
            score: newScore,
        });

        return { 
            success: true, 
            message: `You exchanged a Skip for a Reroll Token, costing ${SKIP_COST} points! You now have ${newRerolls} rerolls.`,
            newRerollCount: newRerolls
        };

    } catch (error) {
        console.error("Error using skip:", error);
        return { success: false, message: "An error occurred during the skip exchange." };
    }
};


// EXPORT: Makes all functions available for use in screens
export { assignDailyDare, getTodayDate, completeDailyDare, rerollDailyDare, useSkipToGainReroll };
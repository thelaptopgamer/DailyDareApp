//src/dailyDareUtils.js
//Purpose: Core game economy logic. Handles daily dare assignment, rerolls, and scoring.
//Implements personalization and manages user data integrity in Firestore.

import { db, auth } from './firebaseConfig.js';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, query, where } from 'firebase/firestore'; 

//Game Configuration Constants
const DARES_PER_DAY = 3; 
const FREE_REROLLS_PER_DAY = 2; 
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard']; 
const REROLL_COST = 50;

/**
 * Gets today's date in YYYY-MM-DD format for database comparison.
 * @returns {string} Today's date string.
 */
const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

/**
 * Core function to assign 3 unique, difficulty-balanced dares to the user.
 * Prioritizes dares based on user interests if called on a new day.
 */
const assignDailyDare = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const todayDate = getTodayDate();
    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        //Initialize user document if it doesn't exist (e.g., during sign-up)
        if (!userDoc.exists()) {
            userData = {
                score: 0, rerollTokens: FREE_REROLLS_PER_DAY, daresCompletedCount: 0,
                createdAt: new Date().toISOString(), dailyDares: [], onboardingComplete: false,
                interests: []
            };
            await setDoc(userDocRef, userData);
        } else {
             //Daily reset of reroll tokens
             if (userData.lastDareAssignment !== todayDate) {
                 await updateDoc(userDocRef, { rerollTokens: FREE_REROLLS_PER_DAY });
             }
        }

        //If dares are already assigned for today, return existing list
        if (userData?.dailyDares?.length > 0 && userData.dailyDares[0].assignedDate === todayDate) {
            return userData.dailyDares;
        }

        //DARE SELECTION LOGIC
        const newDailyDares = [];
        const userInterests = userData.interests || [];
        const assignedDareIds = new Set();
        
        //Loop through Easy, Medium, Hard difficulty levels
        for (const level of DIFFICULTY_LEVELS) {
            //Query master 'Dares' collection for current difficulty level
            const q = query(collection(db, "Dares"), where("difficulty", "==", level));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const availableDares = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                //Personalization: Filter for dares matching user interests (tags)
                const preferredDares = availableDares.filter(dare => {
                    if (!dare.tags) return false;
                    return dare.tags.some(tag => userInterests.includes(tag));
                });

                const fallbackDares = availableDares.filter(dare => !assignedDareIds.has(dare.id));
                let selectedDare = null;

                const uniquePreferred = preferredDares.filter(d => !assignedDareIds.has(d.id));
                
                //Selection Strategy: Prioritize personalized dares over random ones
                if (uniquePreferred.length > 0) {
                    selectedDare = uniquePreferred[Math.floor(Math.random() * uniquePreferred.length)];
                } else if (fallbackDares.length > 0) {
                    selectedDare = fallbackDares[Math.floor(Math.random() * fallbackDares.length)];
                }

                if (selectedDare) {
                    //Build the compact dare object for the user's daily list
                    newDailyDares.push({
                        dareId: selectedDare.id, assignedDate: todayDate, completed: false, 
                        title: selectedDare.title, description: selectedDare.description,
                        points: selectedDare.points, difficulty: selectedDare.difficulty,
                    });
                    assignedDareIds.add(selectedDare.id);
                }
            }
        }
        
        //Update the user document with the new dare list and today's date stamp
        await updateDoc(userDocRef, { dailyDares: newDailyDares, lastDareAssignment: todayDate });
        return newDailyDares;

    } catch (error) {
        console.error("Error assigning daily dares:", error);
        return null;
    }
};

/**
 * Marks a dare as complete and updates the user's score and completion count.
 * Handles both regular scheduled dares and dynamically generated AI dares.
 * @param {string} dareId The ID of the dare to complete.
 * @param {number} points The points awarded.
 * @param {boolean} [isAI=false] Flag indicating if this is an AI-generated dare.
 */
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
        
        //Safety check: Auto-detect AI dare by ID prefix as a backup if flag is missing
        const isAIDare = isAI || (typeof dareId === 'string' && dareId.startsWith('ai_'));

        if (isAIDare) {
            //OPTION A: AI/Overtime Dare.
            //Update score and count directly without touching the daily schedule array.
            console.log("Completing AI/Overtime Dare. Adding points directly.");
            currentScore += points;
            daresCompletedCount += 1;
        } else {
            //OPTION B: Regular Scheduled Dare.
            //Find the dare in the daily list and mark its status as complete.
            const dareIndex = dares.findIndex(d => d.dareId === dareId);
            
            if (dareIndex === -1) { 
                console.warn("Dare ID not found in daily list:", dareId);
                return false; 
            } 
            if (dares[dareIndex].completed) return false; //Prevent double completion

            dares[dareIndex].completed = true;
            currentScore += points;
            daresCompletedCount += 1;
        }

        //Save changes to Firestore
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

/**
 * Handles the logic for rerolling a dare (swapping it out for a new one).
 * Deducts a token or points based on availability.
 * @param {string} currentDareId The ID of the dare to be replaced.
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
        let userInterests = userData?.interests || [];

        //Cost calculation (Tokens > Points)
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
        
        //Find available dares of the same difficulty that aren't the current one
        const availableDares = dareSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(dare => dare.id !== currentDareId && dare.difficulty === originalDareDifficulty); 

        //Reroll Personalization Logic: Prioritize personalized dares
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
        //Construct the new dare object
        const newDareObject = {
            dareId: newDare.id, assignedDate: todayDate, completed: false, 
            title: newDare.title, description: newDare.description,
            points: newDare.points, difficulty: newDare.difficulty,
        };
        
        //Replace the old dare with the new one in the user's array
        dares[dareIndex] = newDareObject;

        await updateDoc(userDocRef, { dailyDares: dares, rerollTokens: availableTokens, score: currentScore });

        return { success: true, message: `Rerolled to: ${newDare.title}.`, newDare: newDareObject, newRerollCount: availableTokens };

    } catch (error) {
        console.error("Error rerolling:", error);
        return { success: false, message: "Error during reroll." };
    }
};

//Allows the user to buy a reroll token using points (used in the shop).

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

        //Perform the transaction
        await updateDoc(userDocRef, { rerollTokens: newRerolls, score: newScore });

        return { success: true, message: `Exchanged 50pts for 1 Token.`, newRerollCount: newRerolls };

    } catch (error) {
        console.error("Error using skip:", error);
        return { success: false, message: "An error occurred during the skip exchange." };
    }
};

export { assignDailyDare, getTodayDate, completeDailyDare, rerollDailyDare, useSkipToGainReroll };
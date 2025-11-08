// src/dailyDareUtils.js
import { db, auth } from './firebaseConfig';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, query, where } from 'firebase/firestore'; 

// --- Configuration ---
const DARES_PER_DAY = 3; 
const FREE_REROLLS_PER_DAY = 2; 
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard']; 
const REROLL_COST = 50;

// Helper function to format today's date (YYYY-MM-DD)
const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

// Main function to assign daily dares and free tokens
const assignDailyDare = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const todayDate = getTodayDate();
    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        // --- Initialize user document if it doesn't exist (Fixes multi-account login) ---
        if (!userDoc.exists()) {
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
             // Ensure fields are initialized if missing (handles old users)
             let shouldUpdate = false;
             if (userData.rerollTokens === undefined) {
                 userData.rerollTokens = FREE_REROLLS_PER_DAY;
                 shouldUpdate = true;
             }
             if (userData.score === undefined) {
                 userData.score = 0;
                 shouldUpdate = true;
             }
             if (userData.daresCompletedCount === undefined) {
                 userData.daresCompletedCount = 0;
                 shouldUpdate = true;
             }
             if (userData.onboardingComplete === undefined) {
                 userData.onboardingComplete = true; 
                 shouldUpdate = true;
             }
             
             if (shouldUpdate) {
                 await updateDoc(userDocRef, { 
                     rerollTokens: userData.rerollTokens, 
                     score: userData.score,
                     daresCompletedCount: userData.daresCompletedCount,
                     onboardingComplete: userData.onboardingComplete,
                 });
             }
        }

        // 1. Check if dares are already assigned for today
        if (userData?.dailyDares?.length > 0 && userData.dailyDares[0].assignedDate === todayDate) {
            console.log("3 Daily Dares already assigned for today.");
            return userData.dailyDares;
        }

        // 2. Assign Free Daily Tokens (Resets daily)
        await updateDoc(userDocRef, {
            rerollTokens: FREE_REROLLS_PER_DAY, 
        });
        
        // --- 3. Fetch and Assign 1 Easy, 1 Medium, 1 Hard Dare ---
        const newDailyDares = [];
        const assignedDareIds = new Set();
        
        for (const level of DIFFICULTY_LEVELS) {
            const q = query(collection(db, "Dares"), where("difficulty", "==", level));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const availableDares = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const unassignedDares = availableDares.filter(dare => !assignedDareIds.has(dare.id));

                if (unassignedDares.length > 0) {
                    const randomIndex = Math.floor(Math.random() * unassignedDares.length);
                    const newDare = unassignedDares[randomIndex];
                    
                    newDailyDares.push({
                        dareId: newDare.id,
                        assignedDate: todayDate,
                        completed: false, 
                        title: newDare.title, 
                        description: newDare.description,
                        points: newDare.points,
                        difficulty: newDare.difficulty,
                    });
                    assignedDareIds.add(newDare.id);
                }
            }
        }
        
        // 4. Update the user's document in Firestore with the new array
        await updateDoc(userDocRef, {
            dailyDares: newDailyDares, 
            lastDareAssignment: todayDate,
        });
        
        console.log(`Assigned ${newDailyDares.length} Daily Dares: 1 Easy, 1 Medium, 1 Hard.`);
        return newDailyDares;

    } catch (error) {
        console.error("Error assigning daily dares:", error);
        return null;
    }
};

// Marks a specific dare as completed and updates points
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
        
        const dareIndex = dares.findIndex(d => d.dareId === dareId);

        if (dareIndex === -1) return false;
        if (dares[dareIndex].completed) return false;

        dares[dareIndex].completed = true;
        const pointsToAdd = points;
        currentScore += pointsToAdd;
        daresCompletedCount += 1;

        await updateDoc(userDocRef, {
            dailyDares: dares, 
            score: currentScore, 
            daresCompletedCount: daresCompletedCount, 
        });

        console.log(`Dare completed! Added ${pointsToAdd} points. New score: ${currentScore}`);
        return true;

    } catch (error) {
        console.error("Error completing daily dare:", error);
        return false;
    }
};

// Reroll function updated for cost display and fixed difficulty
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

        // 1. Check token/point cost
        if (availableTokens > 0) {
            availableTokens -= 1; 
        } else if (currentScore >= REROLL_COST) {
            currentScore -= REROLL_COST;
        } else {
            return { success: false, message: `Not enough points or free tokens. Reroll costs ${REROLL_COST} points.` };
        }
        
        const dareIndex = dares.findIndex(d => d.dareId === currentDareId);
        if (dareIndex === -1) {
             return { success: false, message: "Dare to reroll not found in the list." };
        }

        const originalDareDifficulty = dares[dareIndex].difficulty;
        
        // 2. Fetch all dares and find replacement of the same difficulty
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

        // 3. Create new dare object and replace the old one
        const newDareObject = {
            dareId: newDare.id,
            assignedDate: todayDate,
            completed: false, 
            title: newDare.title, 
            description: newDare.description,
            points: newDare.points,
            difficulty: newDare.difficulty,
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

// Skip functionality: Use a Skip to gain one Reroll Token (no cost needed yet)
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
             return { 
                 success: false, 
                 message: `Not enough points! Exchange costs ${SKIP_COST} points. You have ${currentScore}.`
             };
        }

        const newRerolls = currentRerolls + 1;
        const newScore = currentScore - SKIP_COST; 

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


export { assignDailyDare, getTodayDate, completeDailyDare, rerollDailyDare, useSkipToGainReroll };
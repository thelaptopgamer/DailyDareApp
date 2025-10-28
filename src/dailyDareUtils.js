// src/dailyDareUtils.js
import { db, auth } from './firebaseConfig';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc } from 'firebase/firestore'; 

// --- Configuration ---
const DARES_PER_DAY = 3; 

// Helper function to format today's date (YYYY-MM-DD)
const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

// Main function to assign multiple daily dares
const assignDailyDare = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const todayDate = getTodayDate();
    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        // --- FIX FOR MULTI-ACCOUNT LOGIN ERROR ---
        if (!userDoc.exists()) {
            // Document does not exist: Create it now with defaults
            userData = {
                score: 0,
                rerollCount: 3, 
                createdAt: new Date().toISOString(),
                dailyDares: [], // Initial empty array
            };
            
            await setDoc(userDocRef, userData);
            console.log(`Created new user document for ${user.email}`);
        } else {
             // Document exists: Ensure all necessary fields are initialized if missing
             let shouldUpdate = false;
             if (userData.rerollCount === undefined) {
                 userData.rerollCount = 3;
                 shouldUpdate = true;
             }
             if (userData.score === undefined) {
                 userData.score = 0;
                 shouldUpdate = true;
             }
             if (shouldUpdate) {
                 await updateDoc(userDocRef, { 
                     rerollCount: userData.rerollCount, 
                     score: userData.score 
                 });
             }
        }
        // --- END FIX ---


        // 1. Check if dares are already assigned for today
        if (userData?.dailyDares?.length > 0 && userData.dailyDares[0].assignedDate === todayDate) {
            console.log("3 Daily Dares already assigned for today.");
            return userData.dailyDares;
        }

        // 2. Fetch all available dares
        const daresRef = collection(db, "Dares");
        const dareSnapshot = await getDocs(daresRef);

        if (dareSnapshot.empty) {
            console.error("No dares found in the Dares collection!");
            return null;
        }

        const allDares = dareSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Select 3 unique random dares
        const newDailyDares = [];
        const selectedIndices = new Set();
        
        while (newDailyDares.length < DARES_PER_DAY && newDailyDares.length < allDares.length) {
            const randomIndex = Math.floor(Math.random() * allDares.length);
            
            if (!selectedIndices.has(randomIndex)) {
                const dare = allDares[randomIndex];
                newDailyDares.push({
                    dareId: dare.id,
                    assignedDate: todayDate,
                    completed: false, 
                    title: dare.title, 
                    description: dare.description,
                    points: dare.points,
                });
                selectedIndices.add(randomIndex);
            }
        }

        // 4. Update the user's document in Firestore with the new array
        await updateDoc(userDocRef, {
            dailyDares: newDailyDares, 
            lastDareAssignment: todayDate,
        });
        
        console.log(`Assigned ${newDailyDares.length} Daily Dares for ${todayDate}`);
        return newDailyDares;

    } catch (error) {
        console.error("Error assigning daily dares:", error);
        return null;
    }
};

// ... (completeDailyDare, rerollDailyDare, useSkipToGainReroll remain the same) ...
const completeDailyDare = async (dareId, points) => {
    const user = auth.currentUser;
    if (!user || !dareId) return false;

    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        let currentScore = userData?.score || 0;
        let dares = userData?.dailyDares || [];
        
        const dareIndex = dares.findIndex(d => d.dareId === dareId);

        if (dareIndex === -1) return false;
        if (dares[dareIndex].completed) return false;

        dares[dareIndex].completed = true;
        const pointsToAdd = points;
        currentScore += pointsToAdd;

        await updateDoc(userDocRef, {
            dailyDares: dares, 
            score: currentScore, 
        });

        console.log(`Dare completed! Added ${pointsToAdd} points. New score: ${currentScore}`);
        return true;

    } catch (error) {
        console.error("Error completing daily dare:", error);
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
        
        const rerolls = userData?.rerollCount || 0;
        let dares = userData?.dailyDares || [];

        if (rerolls <= 0) {
            return { success: false, message: "No rerolls left today." };
        }
        
        const dareIndex = dares.findIndex(d => d.dareId === currentDareId);
        if (dareIndex === -1) {
             return { success: false, message: "Dare to reroll not found in the list." };
        }

        const daresRef = collection(db, "Dares");
        const dareSnapshot = await getDocs(daresRef);
        
        const currentDareIds = dares.map(d => d.dareId);
        
        const availableDares = dareSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(dare => !currentDareIds.includes(dare.id)); 

        if (availableDares.length === 0) {
             return { success: false, message: "No unique dares available for reroll." };
        }

        const randomIndex = Math.floor(Math.random() * availableDares.length);
        const newDare = availableDares[randomIndex];
        
        const todayDate = getTodayDate();

        const newDareObject = {
            dareId: newDare.id,
            assignedDate: todayDate,
            completed: false, 
            title: newDare.title, 
            description: newDare.description,
            points: newDare.points,
        };
        
        dares[dareIndex] = newDareObject;

        await updateDoc(userDocRef, {
            dailyDares: dares,
            rerollCount: rerolls - 1,
        });

        return { 
            success: true, 
            message: `Rerolled dare: ${newDare.title}`,
            newDare: newDareObject,
            newRerollCount: rerolls - 1
        };

    } catch (error) {
        console.error("Error rerolling daily dare:", error);
        return { success: false, message: "An error occurred during reroll." };
    }
};

const useSkipToGainReroll = async () => {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "User not logged in." };

    const userDocRef = doc(db, 'Users', user.uid);

    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        const currentRerolls = userData?.rerollCount || 0;
        const newRerolls = currentRerolls + 1;

        await updateDoc(userDocRef, {
            rerollCount: newRerolls,
        });

        return { 
            success: true, 
            message: `You exchanged a Skip for a Reroll! You now have ${newRerolls} rerolls.`,
            newRerollCount: newRerolls
        };

    } catch (error) {
        console.error("Error using skip:", error);
        return { success: false, message: "An error occurred during the skip exchange." };
    }
};


export { assignDailyDare, getTodayDate, completeDailyDare, rerollDailyDare, useSkipToGainReroll };
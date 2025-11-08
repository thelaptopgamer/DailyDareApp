// src/firestoreUtils.js
// Purpose: Contains the utility function to check and seed the master list of Dares into Firestore.
// This ensures that the app always has the latest and correct Dares data available.

import { db } from './firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'; // Firestore methods (IAT359_Lecture6, Page 30)
import initialDares from './initialDares.js';

// Configuration constant based on the total number of dares defined in the local file.
const EXPECTED_DARE_COUNT = initialDares.length; 

/**
 * Checks if the Dares collection is outdated or empty and performs a non-destructive re-seeding.
 * This ensures the Dare structure (points, difficulty) is always correct without deleting user data.
 */
const seedDares = async () => {
    // ASYNC FUNCTION: Required because we are performing database operations (IAT359_Week3, Page 45)
    try {
        const daresRef = collection(db, "Dares");
        
        // 1. READ: Get the current number of dares in the database
        const snapshot = await getDocs(daresRef);

        // CONDITIONAL CHECK: If the current count is less than the expected count (15), re-seed.
        if (snapshot.size < EXPECTED_DARE_COUNT) {
            console.log(`Dares collection found ${snapshot.size} dares (Expected ${EXPECTED_DARE_COUNT}). Re-seeding necessary.`);
            
            // BATCH WRITE: Used to perform multiple delete/add operations efficiently
            const batch = writeBatch(db);
            
            // 2. CLEANUP: Delete all existing dare documents (Non-destructive to other collections)
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // 3. CREATE: Add all the new/updated dare documents
            initialDares.forEach(dare => {
                const newDareRef = doc(daresRef); // Generate a new unique ID for the document
                batch.set(newDareRef, dare); // Set the new dare document
            });

            // 4. COMMIT: Execute all batch operations
            await batch.commit();
            console.log(`Successfully deleted ${snapshot.size} old dares and uploaded ${EXPECTED_DARE_COUNT} new dares into Firestore.`);
            return true;
        } else {
            console.log(`Dares collection contains ${snapshot.size} dares. Seeding skipped.`);
            return false;
        }

    } catch (error) {
        // ERROR HANDLING: Prevents app crash if network fails or permissions are denied
        console.error("Error seeding initial dares:", error);
        return false;
    }
};

// EXPORT: Makes the function available to App.js (or DareHubScreen.js)
export { seedDares };
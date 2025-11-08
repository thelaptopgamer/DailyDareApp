// src/firestoreUtils.js
import { db } from './firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import initialDares from './initialDares.js';

// --- Configuration ---
const EXPECTED_DARE_COUNT = initialDares.length; // Will be 15

// Seeds the Dares collection if it is outdated or currently empty.
const seedDares = async () => {
    try {
        const daresRef = collection(db, "Dares");
        const snapshot = await getDocs(daresRef);

        // CRITICAL CHECK: Check if the collection count is less than the expected count (15)
        if (snapshot.size < EXPECTED_DARE_COUNT) {
            console.log(`Dares collection found ${snapshot.size} dares (Expected ${EXPECTED_DARE_COUNT}). Re-seeding necessary.`);
            
            const batch = writeBatch(db);
            
            // 1. NON-DESTRUCTIVE CLEANUP: Delete all existing dare documents first
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // 2. Add all the new/updated dare documents
            initialDares.forEach(dare => {
                const newDareRef = doc(daresRef); 
                batch.set(newDareRef, dare);
            });

            await batch.commit();
            console.log(`Successfully deleted ${snapshot.size} old dares and uploaded ${EXPECTED_DARE_COUNT} new dares into Firestore.`);
            return true;
        } else {
            console.log(`Dares collection contains ${snapshot.size} dares. Seeding skipped.`);
            return false;
        }

    } catch (error) {
        console.error("Error seeding initial dares:", error);
        return false;
    }
};

export { seedDares };
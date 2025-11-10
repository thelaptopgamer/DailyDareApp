//src/firestoreUtils.js
//Purpose: Contains the utility function to check and seed the master list of Dares into Firestore.
//This ensures that the app always has the latest and correct Dares data available.

import { db } from './firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import initialDares from './initialDares.js';

//Constant based on the total number of dares defined in the file
const EXPECTED_DARE_COUNT = initialDares.length; 

// Checks if the Dares collection is outdated
const seedDares = async () => {
    try {
        const daresRef = collection(db, "Dares");
        
        //Get the current number of dares in the database
        const snapshot = await getDocs(daresRef);

        //If the current count is less than the expected count, re-seed.
        if (snapshot.size < EXPECTED_DARE_COUNT) {
            console.log(`Dares collection found ${snapshot.size} dares (Expected ${EXPECTED_DARE_COUNT}). Re-seeding necessary.`);
            
            //Used to perform multiple delete/add operations efficiently
            const batch = writeBatch(db);
            
            //Delete all existing dare documents
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            //Add all the new/updated dare documents
            initialDares.forEach(dare => {
                const newDareRef = doc(daresRef); // Generate ID for the document
                batch.set(newDareRef, dare); // Set the new dare document
            });

            await batch.commit();
            console.log(`Successfully deleted ${snapshot.size} old dares and uploaded ${EXPECTED_DARE_COUNT} new dares into Firestore.`);
            return true;
        } else {
            console.log(`Dares collection contains ${snapshot.size} dares. Seeding skipped.`);
            return false;
        }

    } catch (error) {
        //ERROR HANDLING
        console.error("Error seeding initial dares:", error);
        return false;
    }
};

export { seedDares };
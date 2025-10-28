// src/firestoreUtils.js
import { db } from './firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import initialDares from './initialDares.js';

// Seeds the Dares collection if it is currently empty.
const seedDares = async () => {
    try {
        const daresRef = collection(db, "Dares");
        const snapshot = await getDocs(daresRef);

        // Check if the collection is empty
        if (snapshot.empty) {
            console.log("Dares collection is empty. Seeding initial data...");
            
            const batch = writeBatch(db);
            
            initialDares.forEach(dare => {
                // Creates a new document reference with an auto-generated ID
                const newDareRef = doc(daresRef); 
                batch.set(newDareRef, dare);
            });

            await batch.commit();
            console.log("Successfully seeded 6 initial dares into Firestore.");
            return true;
        } else {
            console.log(`Dares collection already contains ${snapshot.size} dares. Skipping seed.`);
            return false;
        }

    } catch (error) {
        console.error("Error seeding initial dares:", error);
        return false;
    }
};

export { seedDares };
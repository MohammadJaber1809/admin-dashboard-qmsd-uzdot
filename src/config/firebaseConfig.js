// Import the necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDmIo4SbOsRrct5VfeT2wk-Rr5yfwJgyo0",
    authDomain: "uzdotdatabase.firebaseapp.com",
    projectId: "uzdotdatabase",
    storageBucket: "uzdotdatabase.appspot.com",
    messagingSenderId: "596682274221",
    appId: "1:596682274221:web:76db4304a28d315a051d24",
    measurementId: "G-98J3BRV8X4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized:", app.name);  // "[DEFAULT]"

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Export the auth, db, and storage instances to use in other files
export { auth, db, storage };

// Example of using Firestore with error handling
const fetchDocuments = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'documents'));
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched documents:", docs);
    } catch (error) {
        console.error("Error fetching documents:", error);
    }
};

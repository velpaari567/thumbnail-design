import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCfFjo_t7aCAzFoZXSuDtyBapeDu1-q2CY",
    authDomain: "thumbcraftai-94cdd.firebaseapp.com",
    projectId: "thumbcraftai-94cdd",
    storageBucket: "thumbcraftai-94cdd.firebasestorage.app",
    messagingSenderId: "473093241825",
    appId: "1:473093241825:web:17befeddbf321f5b48b0a0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;

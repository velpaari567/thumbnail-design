import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCfFjo_t7aCAzFoZXSuDtyBapeDu1-q2CY",
    authDomain: "thumbcraftai-94cdd.firebaseapp.com",
    projectId: "thumbcraftai-94cdd",
    storageBucket: "thumbcraftai-94cdd.firebasestorage.app",
    messagingSenderId: "473093241825",
    appId: "1:473093241825:web:17befeddbf321f5b48b0a0"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testUpload() {
    try {
        const storageRef = ref(storage, `requests/templates/test_upload_${Date.now()}.txt`);
        await uploadString(storageRef, "Test Content");
        console.log("Upload Success!");
    } catch (error) {
        console.error("Upload Error Dump:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
    process.exit(0);
}

testUpload();

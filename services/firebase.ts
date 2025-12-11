import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDdD7pAb3IPgitSYWY5JVv8QPA15a9gooU",
  authDomain: "wisecrypto-7891c.firebaseapp.com",
  databaseURL: "https://wisecrypto-7891c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wisecrypto-7891c",
  storageBucket: "wisecrypto-7891c.firebasestorage.app",
  messagingSenderId: "567977490141",
  appId: "1:567977490141:web:303ec4b8ceb6b100f4cd34",
  measurementId: "G-2Y9NPJMEV8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const storage = getStorage(app);

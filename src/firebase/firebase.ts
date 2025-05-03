// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBe4C_rgu-ghsPA1XuBM7rrw1dmKJxQqLM",
  authDomain: "sol-buster.firebaseapp.com",
  projectId: "sol-buster",
  storageBucket: "sol-buster.firebasestorage.app",
  messagingSenderId: "409418931489",
  appId: "1:409418931489:web:600a342afe45aa96c9f260",
  measurementId: "G-EH4J9GVREX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
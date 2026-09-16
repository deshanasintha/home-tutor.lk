// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMe-oEgfgy0c2O6o6IXar6vF-hTawjssI",
  authDomain: "home-tutor-8924e.firebaseapp.com",
  projectId: "home-tutor-8924e",
  storageBucket: "home-tutor-8924e.firebasestorage.app",
  messagingSenderId: "83540447256",
  appId: "1:83540447256:web:a112a3b9b606ff0c86b36d",
  measurementId: "G-ND6T0HX49C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for the team to use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
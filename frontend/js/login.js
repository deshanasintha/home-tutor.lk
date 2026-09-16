import { auth, db } from './firebase-config.js';

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const form = document.getElementById('loginForm');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Check empty fields
        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {

            // Login using Firebase Authentication
            const userCredential =
                await signInWithEmailAndPassword(auth, email, password);

            const user = userCredential.user;

            // Get user information from Firestore
            const userDoc =
                await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {

                const userData = userDoc.data();
                const role = userData.role;

                alert("Login Successful!");

                // Redirect according to user role
                if (role === "tutor") {

                    window.location.href = "tutor-dashboard.html";

                } else if (role === "parent" || role === "student") {

                    window.location.href = "parent-dashboard.html";

                } else if (role === "admin") {

                    window.location.href = "admin-dashboard.html";

                } else {

                    window.location.href = "index.html";
                }

            } else {

                alert("User record not found in Firestore.");

            }

        } catch (error) {

            console.error("Login Error:", error);

            // User-friendly error messages
            if (error.code === "auth/invalid-credential") {

                alert("Invalid email or password.");

            } else if (error.code === "auth/user-not-found") {

                alert("No account found with this email.");

            } else if (error.code === "auth/wrong-password") {

                alert("Incorrect password.");

            } else if (error.code === "auth/invalid-email") {

                alert("Please enter a valid email address.");

            } else if (error.code === "auth/too-many-requests") {

                alert("Too many login attempts. Please try again later.");

            } else {

                alert("Login Error: " + error.message);
            }
        }
    });
}
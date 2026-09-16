import { auth } from './firebase-config.js';

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


const form = document.getElementById('forgotPasswordForm');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const email =
            document.getElementById('resetEmail').value.trim();

        // Check email field
        if (!email) {

            alert("Please enter your email address.");
            return;
        }

        try {

            // Send password reset email
            await sendPasswordResetEmail(auth, email);

            alert("Password reset link has been sent to your email!");

            // Go back to login page
            window.location.href = "login.html";

        } catch (error) {

            console.error("Password Reset Error:", error);

            if (error.code === "auth/invalid-email") {

                alert("Please enter a valid email address.");

            } else if (error.code === "auth/user-not-found") {

                alert("No account found with this email.");

            } else if (error.code === "auth/too-many-requests") {

                alert("Too many requests. Please try again later.");

            } else {

                alert("Error: " + error.message);
            }
        }
    });
}
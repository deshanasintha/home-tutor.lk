console.log("LOGIN JS LOADED");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyDMe-oEgfgy0c2O6o6IXar6vF-hTawjssI",
    authDomain: "home-tutor-8924e.firebaseapp.com",
    projectId: "home-tutor-8924e",
    storageBucket: "home-tutor-8924e.firebasestorage.app",
    messagingSenderId: "83540447256",
    appId: "1:83540447256:web:a112a3b9b606ff0c86b36d",
    measurementId: "G-ND6T0HX49C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================================
// SWEET ALERT / MESSAGE FUNCTION
// =====================================================

const showMessage = (options) => {

    if (typeof Swal !== 'undefined') {
        return Swal.fire(options);
    }

    window.alert(
        options.text ||
        options.title ||
        'An unexpected error occurred.'
    );

    return Promise.resolve();
};


// =====================================================
// NORMAL EMAIL / PASSWORD LOGIN
// =====================================================

const form = document.getElementById('loginForm');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitBtn =
            form.querySelector('button[type="submit"]');

        const originalBtnText =
            submitBtn ? submitBtn.innerText : '';

        const email =
            document.getElementById('loginEmail')?.value.trim() || '';

        const password =
            document.getElementById('loginPassword')?.value || '';


        // Check empty fields
        if (!email || !password) {

            await showMessage({
                icon: 'warning',
                title: 'Missing details',
                text: 'Please enter your email and password.'
            });

            return;
        }


        try {

            // Disable button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Logging in...";
            }


            // Firebase Email Login
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            // Get user profile from Firestore
            const userDoc =
                await getDoc(
                    doc(db, 'users', user.uid)
                );


            // Profile not found
            if (!userDoc.exists()) {

                await showMessage({
                    icon: 'error',
                    title: 'Profile not found',
                    text: 'Your account profile could not be found.'
                });

                return;
            }


            // Get role
            const role = userDoc.data().role;


            // Dashboard destinations
            const destinations = {

                tutor: 'tutor-dashboard.html',

                parent: 'parent-dashboard.html',

                student: 'parent-dashboard.html',

                admin: 'admin-dashboard.html'

            };


            // Success message
            await showMessage({

                icon: 'success',

                title: 'Login successful',

                timer: 1000,

                showConfirmButton: false

            });


            // Redirect
            window.location.href =
                destinations[role] || 'index.html';


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            const messages = {

                'auth/invalid-credential':
                    'Invalid email or password.',

                'auth/user-not-found':
                    'No account was found with this email.',

                'auth/wrong-password':
                    'Incorrect password.',

                'auth/invalid-email':
                    'Please enter a valid email address.',

                'auth/too-many-requests':
                    'Too many login attempts. Please try again later.'

            };


            await showMessage({

                icon: 'error',

                title: 'Login failed',

                text:
                    messages[error.code] ||
                    error.message

            });


        } finally {

            // Enable button again
            if (submitBtn) {

                submitBtn.disabled = false;

                submitBtn.innerText =
                    originalBtnText;

            }

        }

    });

}


// =====================================================
// GOOGLE LOGIN
// =====================================================

const googleLoginBtn =
    document.getElementById('googleLoginBtn');


// NEW: save the original button content (keeps the "G" icon)
const googleBtnOriginalHTML =
    googleLoginBtn ? googleLoginBtn.innerHTML : '';


if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        'click',
        async () => {

            console.log("GOOGLE BUTTON CLICKED");


            try {

                // Disable Google button
                googleLoginBtn.disabled = true;

                googleLoginBtn.innerText =
                    "Signing in with Google...";


                console.log("Creating Google Provider...");


                // Create Google provider
                const provider =
                    new GoogleAuthProvider();


                // NEW: always show the Google account chooser popup
                provider.setCustomParameters({
                    prompt: 'select_account'
                });


                console.log("BEFORE POPUP");


                // Open Google login popup
                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                console.log("AFTER POPUP");


                // Get Google user
                const user = result.user;


                console.log(
                    "Google User:",
                    user
                );


                // Get TutorLink profile
                const userDoc =
                    await getDoc(
                        doc(db, 'users', user.uid)
                    );


                // Profile doesn't exist
                if (!userDoc.exists()) {

                    await showMessage({

                        icon: 'warning',

                        title: 'Profile not found',

                        text:
                            'Your Google account is authenticated, but no TutorLink LK profile was found. Please register first.'

                    });

                    return;
                }


                // Get role
                const role =
                    userDoc.data().role;


                // Dashboard destinations
                const destinations = {

                    tutor: 'tutor-dashboard.html',

                    parent: 'parent-dashboard.html',

                    student: 'parent-dashboard.html',

                    admin: 'admin-dashboard.html'

                };


                // Success message
                await showMessage({

                    icon: 'success',

                    title: 'Google login successful',

                    timer: 1000,

                    showConfirmButton: false

                });


                // Redirect
                window.location.href =
                    destinations[role] || 'index.html';


            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                const messages = {

                    'auth/popup-closed-by-user':
                        'Google login was cancelled.',

                    'auth/popup-blocked':
                        'The Google login popup was blocked by your browser.',

                    'auth/cancelled-popup-request':
                        'Another Google login request is already in progress.',

                    'auth/account-exists-with-different-credential':
                        'An account already exists with this email using a different login method.',

                    'auth/network-request-failed':
                        'Network error. Please check your internet connection.',

                    'auth/unauthorized-domain':
                        'This website domain is not authorized in Firebase.',

                    'auth/operation-not-allowed':
                        'Google sign-in is not enabled in Firebase Authentication.'

                };


                await showMessage({

                    icon: 'error',

                    title: 'Google Login Failed',

                    text:
                        messages[error.code] ||
                        error.message

                });


            } finally {

                // Enable Google button again
                googleLoginBtn.disabled = false;

                // NEW: restore the original button (with the "G" icon)
                googleLoginBtn.innerHTML =
                    googleBtnOriginalHTML;

            }

        }
    );

}
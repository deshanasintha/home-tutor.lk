import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('loginForm');

const showMessage = (options) => {
    if (typeof Swal !== 'undefined') return Swal.fire(options);
    window.alert(options.text || options.title || 'An unexpected error occurred.');
    return Promise.resolve();
};

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerText : '';

        const email = document.getElementById('loginEmail')?.value.trim() || '';
        const password = document.getElementById('loginPassword')?.value || '';

        if (!email || !password) {
            await showMessage({
                icon: 'warning',
                title: 'Missing details',
                text: 'Please enter your email and password.'
            });
            return;
        }

        try {
            // Button Disable කිරීම සහ Loading State පෙන්වීම
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Logging in...";
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                await showMessage({
                    icon: 'error',
                    title: 'Profile not found',
                    text: 'Your account profile could not be found.'
                });
                return;
            }

            const role = userDoc.data().role;
            const destinations = {
                tutor: 'tutor-dashboard.html',
                parent: 'parent-dashboard.html',
                student: 'parent-dashboard.html',
                admin: 'admin-dashboard.html'
            };

            await showMessage({
                icon: 'success',
                title: 'Login successful',
                timer: 1000,
                showConfirmButton: false
            });

            // Role එක අනුව Destination එකට යැවීම
            window.location.href = destinations[role] || 'index.html';

        } catch (error) {
            console.error("Login Error:", error);
            const messages = {
                'auth/invalid-credential': 'Invalid email or password.',
                'auth/user-not-found': 'No account was found with this email.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/too-many-requests': 'Too many login attempts. Please try again later.'
            };
            await showMessage({
                icon: 'error',
                title: 'Login failed',
                text: messages[error.code] || error.message
            });
        } finally {
            // Error එකක් ආවොත් Submit Button එක නැවත සක්‍රීය කිරීම
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        }
    });
}
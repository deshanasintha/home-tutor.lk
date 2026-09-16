import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        alert(`Welcome back, ${userData.name || 'User'}!`);

        if (userData.role === 'tutor') {
          window.location.href = 'tutor-dashboard.html';
        } else if (userData.role === 'student' || userData.role === 'parent') {
          window.location.href = 'parent-dashboard.html';
        } else if (userData.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'index.html';
        }
      } else {
        alert("User details not found in database!");
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert("Login Failed: " + error.message);
    }
  });
}
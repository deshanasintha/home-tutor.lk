
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('parentRegisterForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('parentName').value.trim();
    const email = document.getElementById('parentEmail').value.trim();
    const password = document.getElementById('parentPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save to Firestore as parent
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: document.getElementById('parentPhone').value.trim(),
        district: document.getElementById('district').value,
        city: document.getElementById('city').value.trim(),
        grade: document.getElementById('grade').value,
        mode: document.getElementById('mode').value,
        subjects: document.getElementById('subjects').value.trim(),
        role: "parent",
        createdAt: new Date().toISOString()
      });

      alert("Parent Registration Successful!");
      window.location.href = "parent-dashboard.html";
    } catch (error) {
      alert("Registration Error: " + error.message);
    }
  });
}
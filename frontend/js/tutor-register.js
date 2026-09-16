import { auth, db } from './firebase-config.js';
// Replace hardcoded CDN URLs with standard modular imports or mirror your firebase-config setup
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const form = document.getElementById('tutorRegisterForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('tutorName').value.trim();
    const email = document.getElementById('tutorEmail').value.trim();
    const password = document.getElementById('tutorPassword').value;
    const subject = document.getElementById('tutorSubject')?.value || '';
    const hourlyRate = document.getElementById('tutorRate')?.value || 0;

    try {
      // 1. Create authentication record
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save tutor profile document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        subject: subject,
        hourlyRate: Number(hourlyRate),
        role: "tutor",
        createdAt: serverTimestamp()
      });

      alert("Tutor Registration Successful!");
      window.location.href = "tutor-dashboard.html";
    } catch (error) {
      console.error("Registration Error:", error);
      alert("Registration Error: " + error.message);
    }
  });
}
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('tutorRegisterForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const subjects = document.getElementById('subjects').value.trim();
    const hourlyRate = document.getElementById('hourlyRate').value || 0;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // 1. Create authentication record
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save tutor profile document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: document.getElementById('phone').value.trim(),
        district: document.getElementById('district').value,
        city: document.getElementById('city').value.trim(),
        qualification: document.getElementById('qualification').value,
        institution: document.getElementById('institution').value.trim(),
        subjects: subjects,
        gradeLevels: document.getElementById('gradeLevels').value,
        experience: document.getElementById('experience').value,
        bio: document.getElementById('bio').value.trim(),
        languages: document.getElementById('languages').value.trim(),
        days: Array.from(form.querySelectorAll('input[name="days"]:checked'), (input) => input.value),
        availableTime: document.getElementById('availableTime').value,
        teachingMode: document.getElementById('teachingMode').value,
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
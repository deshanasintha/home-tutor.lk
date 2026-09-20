import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('tutorRegisterForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const subjects = document.getElementById('subjects').value.trim();
    const hourlyRate = document.getElementById('hourlyRate').value || 0;

    // Password සැසඳීම පරීක්ෂා කිරීම
    if (password !== confirmPassword) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Passwords Do Not Match',
          text: 'කරුණාකර ඇතුළත් කළ මුරපද දෙක එක සමානදැයි නැවත පරීක්ෂා කරන්න.'
        });
      } else {
        alert("Passwords do not match.");
      }
      return;
    }

    try {
      // 1. Submit Button එක Disable කර Loading State එකක් පෙන්වීම
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Profile...";
      }

      // Popup එකකින් Process වෙන බව පෙන්වීම
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Creating Profile...',
          text: 'කරුණාකර මොහොතක් රැඳී සිටින්න',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }

      // 2. Firebase Authentication හරහා User සාදාගැනීම
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Firestore Database එකේ Tutorගේ දත්ත Save කිරීම
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

      // 4. Success Response
      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'ඔබගේ Tutor Profile එක සාර්ථකව සාදන ලදී.',
          confirmButtonText: 'Go to Dashboard'
        });
      } else {
        alert("Tutor Registration Successful!");
      }

      // Dashboard එකට Redirect කිරීම
      window.location.href = "tutor-dashboard.html";

    } catch (error) {
      console.error("Registration Error:", error);

      // Error Messages Sinhala/English වලින්
      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "මෙම ඊමේල් ලිපිනය (Email) දැනටමත් භාවිතයේ පවතී. කරුණාකර Log in වන්න.";
      } else if (error.code === 'auth/weak-password') {
        errorMsg = "මුරපදය අවම වශයෙන් අකුරු 6ක්වත් විය යුතුය (At least 6 characters).";
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Registration Error',
          text: errorMsg
        });
      } else {
        alert("Registration Error: " + errorMsg);
      }

    } finally {
      // Button එක නැවත සක්‍රීය කිරීම
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Create Profile";
      }
    }
  });
}
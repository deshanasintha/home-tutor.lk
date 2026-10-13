import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('parentRegisterForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');

    // Input values ආරක්ෂිතව ලබා ගැනීම (Null safety යොදා ඇත)
    const name = document.getElementById('parentName')?.value.trim() || '';
    const email = document.getElementById('parentEmail')?.value.trim() || '';
    const phone = document.getElementById('parentPhone')?.value.trim() || '';
    const password = document.getElementById('parentPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const district = document.getElementById('district')?.value || '';
    const city = document.getElementById('city')?.value.trim() || '';
    const grade = document.getElementById('grade')?.value || '';
    const mode = document.getElementById('mode')?.value || '';
    const subjects = document.getElementById('subjects')?.value.trim() || '';

    // 1. Passwords සමානදැයි පරීක්ෂා කිරීම
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

    // 2. Phone Number Validation (Sri Lankan Format: 07XXXXXXXX)
    const phoneRegex = /^07[0-8,9][0-9]{7}$/;
    if (!phoneRegex.test(phone)) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'වැරදි දුරකථන අංකයක්!',
          text: 'කරුණාකර නිවැරදි Sri Lankan දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0712345678).'
        });
      } else {
        alert("කරුණාකර නිවැරදි Sri Lankan දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0712345678).");
      }
      return;
    }

    try {
      // 1. Submit Button එක Disable කිරීම සහ Loading Popup එකක් පෙන්වීම
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Registering...";
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Creating Account...',
          text: 'කරුණාකර මොහොතක් රැඳී සිටින්න',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }

      // 2. Firebase Authentication හරහා Account එක සැකසීම
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. 📧 Email එකට Verification Link එක යැවීම
      await sendEmailVerification(user);

      // 4. Firestore Database එකේ Parent Data Save කිරීම
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        district: district,
        city: city,
        grade: grade,
        mode: mode,
        subjects: subjects,
        role: "parent",
        isEmailVerified: false, // ඊමේල් එක verify කර නැති බවට status එකක් තැබීම
        createdAt: serverTimestamp()
      });

      // 5. Sign out active session (Verify කරනකන් login වීම වැළැක්වීමට)
      await signOut(auth);

      // 6. Success Alert & Redirect to login
      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'සාර්ථකයි! Verification Link එකක් ඔබගේ ඊමේල් ලිපිනයට (Inbox / Spam) එවා ඇත. කරුණාකර එය Click කර Verify කරගන්න.',
          confirmButtonText: 'Go to login'
        });
        window.location.href = "login.html";
      } else {
        alert("Registration Successful! Please check your email and login.");
        window.location.href = "login.html";
      }

    } catch (error) {
      console.error("Parent Registration Error:", error);

      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "මෙම ඊමේල් ලිපිනය (Email) දැනටමත් භාවිතයේ පවතී. කරුණාකර Log in වන්න.";
      } else if (error.code === 'auth/weak-password') {
        errorMsg = "මුරපදය අවම වශයෙන් අකුරු 6ක්වත් විය යුතුය (At least 6 characters).";
      }

      if (typeof Swal !== 'undefined') {
        Swal.close(); // Loading popup එක අයින් කිරීමට
        Swal.fire({
          icon: 'error',
          title: 'Registration Error',
          text: errorMsg
        });
      } else {
        alert("Registration Error: " + errorMsg);
      }

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Register";
      }
    }
  });
}
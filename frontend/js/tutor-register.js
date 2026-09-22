import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById('tutorRegisterForm');
const showMessage = (options) => {
  if (typeof Swal !== 'undefined') return Swal.fire(options);
  window.alert(options.text || options.title || 'An unexpected error occurred.');
  return Promise.resolve();
};

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');

    const name = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const rawSubjects = document.getElementById('subjects')?.value.trim() || '';
    const hourlyRate = document.getElementById('hourlyRate')?.value || 0;

    if (password !== confirmPassword) {
      await showMessage({ icon: 'error', title: 'Passwords do not match', text: 'Please check both password fields.' });
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Profile...";
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Creating profile...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const subjectsArray = rawSubjects
        ? rawSubjects.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];

      const selectedDays = Array.from(
        form.querySelectorAll('input[name="days"]:checked'),
        (input) => input.value
      );

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: document.getElementById('phone')?.value.trim() || '',
        district: document.getElementById('district')?.value || '',
        city: document.getElementById('city')?.value.trim() || '',
        qualification: document.getElementById('qualification')?.value || '',
        institution: document.getElementById('institution')?.value.trim() || '',
        subjects: rawSubjects,
        subjectsArray,
        gradeLevels: document.getElementById('gradeLevels')?.value || '',
        experience: document.getElementById('experience')?.value || '',
        bio: document.getElementById('bio')?.value.trim() || '',
        languages: document.getElementById('languages')?.value.trim() || '',
        days: selectedDays,
        availableTime: document.getElementById('availableTime')?.value || '',
        teachingMode: document.getElementById('teachingMode')?.value || '',
        hourlyRate: Number(hourlyRate),
        role: "tutor",
        rating: 5.0,
        reviewCount: 0,
        status: "pending",
        createdAt: serverTimestamp()
      });

      await showMessage({ icon: 'success', title: 'Registration successful', text: 'Your tutor profile has been created.', confirmButtonText: 'Go to dashboard' });
      window.location.href = "tutor-dashboard.html";
    } catch (error) {
      console.error("Registration Error:", error);
      const messages = {
        'auth/email-already-in-use': 'This email is already registered. Please log in.',
        'auth/weak-password': 'Password must contain at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.'
      };
      if (typeof Swal !== 'undefined') Swal.close();
      await showMessage({ icon: 'error', title: 'Registration failed', text: messages[error.code] || error.message });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Create Profile";
      }
    }
  });
}
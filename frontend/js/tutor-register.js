import { auth, db } from './firebase-config.js';

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

// Firebase Storage
const storage = getStorage(auth.app);

const form = document.getElementById('tutorRegisterForm');

// Display messages
const showMessage = (options) => {
  if (typeof Swal !== 'undefined') {
    return Swal.fire(options);
  }

  window.alert(options.text || options.title || 'An unexpected error occurred.');
  return Promise.resolve();
};

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');

    // Get form values
    const name = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const phone = document.getElementById('phone')?.value.trim() || '';

    const rawSubjects =
      document.getElementById('subjects')?.value.trim() || '';

    const hourlyRate =
      document.getElementById('hourlyRate')?.value || 0;

    // Selected profile photo
    const profilePicFile =
      document.getElementById('profilePic')?.files[0] || null;

    const linkedinUrl =
      document.getElementById('linkedinUrl')?.value.trim() || '';

    // Check passwords
    if (password !== confirmPassword) {
      await showMessage({
        icon: 'error',
        title: 'Passwords do not match',
        text: 'Please check both password fields.'
      });
      return;
    }

    // Validate phone number
    const phoneRegex = /^07[0-9]{8}$/;

    if (!phoneRegex.test(phone)) {
      await showMessage({
        icon: 'error',
        title: 'වැරදි දුරකථන අංකයක්!',
        text: 'කරුණාකර නිවැරදි Sri Lankan දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0712345678).'
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      await showMessage({
        icon: 'error',
        title: 'වැරදි ඊමේල් ලිපිනයක්!',
        text: 'කරුණාකර නිවැරදි ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.'
      });
      return;
    }

    // Validate profile photo type
    if (
      profilePicFile &&
      !['image/jpeg', 'image/png'].includes(profilePicFile.type)
    ) {
      await showMessage({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select a JPG or PNG profile photo.'
      });
      return;
    }

    try {
      // Disable submit button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Profile...';
      }

      // Show loading message
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Creating profile & uploading files...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
      }

      // Create Firebase Authentication account
      const userCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Upload profile photo to Firebase Storage
      let photoURL = '';

      if (profilePicFile) {
        const photoPath =
          `tutors/${user.uid}/profile_${Date.now()}_${profilePicFile.name}`;

        const photoRef = ref(storage, photoPath);

        await uploadBytes(photoRef, profilePicFile);

        // Get uploaded photo URL
        photoURL = await getDownloadURL(photoRef);
      }

      // Convert subjects into an array
      const subjectsArray = rawSubjects
        ? rawSubjects
            .split(',')
            .map((subject) => subject.trim().toLowerCase())
            .filter(Boolean)
        : [];

      // Get selected available days
      const selectedDays = Array.from(
        form.querySelectorAll('input[name="days"]:checked'),
        (input) => input.value
      );

      // Save tutor details and photo URL in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,

        district: document.getElementById('district')?.value || '',
        city: document.getElementById('city')?.value.trim() || '',

        qualification:
          document.getElementById('qualification')?.value || '',

        institution:
          document.getElementById('institution')?.value.trim() || '',

        subjects: rawSubjects,
        subjectsArray: subjectsArray,

        gradeLevels:
          document.getElementById('gradeLevels')?.value || '',

        experience:
          document.getElementById('experience')?.value || '',

        bio: document.getElementById('bio')?.value.trim() || '',

        languages:
          document.getElementById('languages')?.value.trim() || '',

        days: selectedDays,

        availableTime:
          document.getElementById('availableTime')?.value || '',

        teachingMode:
          document.getElementById('teachingMode')?.value || '',

        hourlyRate: Number(hourlyRate),

        // Firebase Storage photo URL
        photoURL: photoURL,

        linkedinUrl: linkedinUrl,

        role: 'tutor',
        isEmailVerified: false,
        rating: 5.0,
        reviewCount: 0,
        status: 'pending',

        createdAt: serverTimestamp()
      });

      // Sign out after registration
      await signOut(auth);

      // Show success message
      await showMessage({
        icon: 'success',
        title: 'Registration successful',
        text: 'ඔබගේ Tutor Account එක සාර්ථකව සාදන ලදී. Verification Link එකක් ඔබගේ ඊමේල් ලිපිනයට (Inbox / Spam) එවා ඇත. කරුණාකර එය verify කර login වන්න.',
        confirmButtonText: 'Go to login'
      });

      // Redirect to login page
      window.location.href = 'login.html';

    } catch (error) {
      console.error('Registration Error:', error);

      const messages = {
        'auth/email-already-in-use':
          'This email is already registered. Please log in.',

        'auth/weak-password':
          'Password must contain at least 6 characters.',

        'auth/invalid-email':
          'Please enter a valid email address.',

        'storage/unauthorized':
          'Photo upload permission denied. Please check Firebase Storage Rules.',

        'storage/unknown':
          'The photo could not be uploaded. Please check Firebase Storage configuration and try again.'
      };

      if (typeof Swal !== 'undefined') {
        Swal.close();
      }

      await showMessage({
        icon: 'error',
        title: 'Registration failed',
        text: messages[error.code] || error.message ||
          'An unexpected error occurred.'
      });

    } finally {
      // Enable submit button again
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Profile';
      }
    }
  });
}
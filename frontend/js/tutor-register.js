
import { auth, db } from './firebase-config.js';

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

import {
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';

// Firebase Storage
const storage = getStorage(auth.app);

const form = document.getElementById('tutorRegisterForm');

const showMessage = (options) => {
  if (typeof Swal !== 'undefined') {
    return Swal.fire(options);
  }

  alert(options.text || options.title || 'An unexpected error occurred.');
  return Promise.resolve();
};

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');

    // Personal details
    const name = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword =
      document.getElementById('confirmPassword')?.value || '';
    const phone = document.getElementById('phone')?.value.trim() || '';

    // Optional LinkedIn URL
    const linkedinUrl =
      document.getElementById('linkedinUrl')?.value.trim() || '';

    // Optional files
    const profilePicFile =
      document.getElementById('profilePic')?.files?.[0] || null;

    // Certificate input is optional.
    // This works when an input with id="certificateDoc" exists in HTML.
    const certificateFile =
      document.getElementById('certificateDoc')?.files?.[0] || null;

    // Password validation
    if (password !== confirmPassword) {
      await showMessage({
        icon: 'error',
        title: 'Passwords do not match',
        text: 'Please check both password fields.'
      });
      return;
    }

    // Sri Lankan mobile number validation
    if (!/^07[0-9]{8}$/.test(phone)) {
      await showMessage({
        icon: 'error',
        title: 'Invalid phone number',
        text: 'Enter a valid 10-digit Sri Lankan mobile number.'
      });
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await showMessage({
        icon: 'error',
        title: 'Invalid email address',
        text: 'Please enter a valid email address.'
      });
      return;
    }

    // LinkedIn URL is optional, but validate it if provided.
    if (linkedinUrl) {
      try {
        const parsedUrl = new URL(linkedinUrl);

        if (
          parsedUrl.protocol !== 'https:' ||
          parsedUrl.hostname.toLowerCase() !== 'www.linkedin.com' &&
          parsedUrl.hostname.toLowerCase() !== 'linkedin.com'
        ) {
          throw new Error('Invalid LinkedIn URL');
        }
      } catch {
        await showMessage({
          icon: 'error',
          title: 'Invalid LinkedIn URL',
          text: 'Enter a valid LinkedIn profile URL or leave it empty.'
        });
        return;
      }
    }

    // Validate optional profile photo
    if (
      profilePicFile &&
      !['image/jpeg', 'image/png'].includes(profilePicFile.type)
    ) {
      await showMessage({
        icon: 'error',
        title: 'Invalid profile photo',
        text: 'Please select a JPG or PNG image.'
      });
      return;
    }

    // Validate optional certificate
    if (
      certificateFile &&
      ![
        'image/jpeg',
        'image/png',
        'application/pdf'
      ].includes(certificateFile.type)
    ) {
      await showMessage({
        icon: 'error',
        title: 'Invalid certificate',
        text: 'Please select a JPG, PNG or PDF certificate.'
      });
      return;
    }

    let user = null;
    let accountCreated = false;

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Profile...';
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Creating tutor profile...',
          text: 'Please wait while your information is saved.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
      }

      // 1. Create Firebase Authentication account
      const userCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      user = userCredential.user;
      accountCreated = true;

      // 2. Send email verification
      await sendEmailVerification(user);

      // 3. Upload optional profile photo
      let photoURL = '';

      if (profilePicFile) {
        const photoPath =
          `tutors/${user.uid}/profile_${Date.now()}_${profilePicFile.name}`;

        const photoRef = ref(storage, photoPath);

        await uploadBytes(photoRef, profilePicFile);

        photoURL = await getDownloadURL(photoRef);
      }

      // 4. Upload optional certificate
      let certificateURL = '';

      if (certificateFile) {
        const certificatePath =
          `tutors/${user.uid}/certificates/${Date.now()}_${certificateFile.name}`;

        const certificateRef = ref(storage, certificatePath);

        await uploadBytes(certificateRef, certificateFile);

        certificateURL = await getDownloadURL(certificateRef);
      }

      // 5. Convert subjects to an array
      const rawSubjects =
        document.getElementById('subjects')?.value.trim() || '';

      const subjectsArray = rawSubjects
        ? rawSubjects
            .split(',')
            .map(subject => subject.trim().toLowerCase())
            .filter(Boolean)
        : [];

      // 6. Get available days
      const selectedDays = Array.from(
        form.querySelectorAll('input[name="days"]:checked'),
        input => input.value
      );

      // 7. Save tutor details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phone,

        district:
          document.getElementById('district')?.value || '',

        city:
          document.getElementById('city')?.value.trim() || '',

        qualification:
          document.getElementById('qualification')?.value || '',

        institution:
          document.getElementById('institution')?.value.trim() || '',

        subjects: rawSubjects,
        subjectsArray,

        gradeLevels:
          document.getElementById('gradeLevels')?.value || '',

        experience:
          document.getElementById('experience')?.value || '',

        bio:
          document.getElementById('bio')?.value.trim() || '',

        languages:
          document.getElementById('languages')?.value.trim() || '',

        days: selectedDays,

        availableTime:
          document.getElementById('availableTime')?.value || '',

        teachingMode:
          document.getElementById('teachingMode')?.value || '',

        hourlyRate: Number(
          document.getElementById('hourlyRate')?.value || 0
        ),

        // Optional uploaded file URLs
        photoURL,
        certificateURL,

        // Optional LinkedIn URL
        linkedinUrl,

        role: 'tutor',
        isEmailVerified: false,
        rating: 5.0,
        reviewCount: 0,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 8. Sign out after registration
      await signOut(auth);

      if (typeof Swal !== 'undefined') {
        Swal.close();
      }

      // 9. Show success message
      await showMessage({
        icon: 'success',
        title: 'Registration successful',
        text: 'Your tutor account has been created. Please verify your email before logging in.',
        confirmButtonText: 'Go to login'
      });

      // 10. Redirect to login
      window.location.href = 'login.html';

    } catch (error) {
      console.error('Registration Error:', error);

      // If registration fails after account creation,
      // sign out so the user is not left signed in.
      if (accountCreated && auth.currentUser) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Sign-out error:', signOutError);
        }
      }

      if (typeof Swal !== 'undefined') {
        Swal.close();
      }

      const messages = {
        'auth/email-already-in-use':
          'This email is already registered. Please log in.',

        'auth/weak-password':
          'Password must contain at least 6 characters.',

        'auth/invalid-email':
          'Please enter a valid email address.',

        'storage/unauthorized':
          'Upload permission denied. Check your Firebase Storage Rules.',

        'storage/object-not-found':
          'The uploaded file could not be found.',

        'storage/quota-exceeded':
          'Firebase Storage quota has been exceeded.'
      };

      await showMessage({
        icon: 'error',
        title: 'Registration failed',
        text: messages[error.code] ||
          error.message ||
          'An unexpected error occurred.'
      });

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Profile';
      }
    }
  });
}

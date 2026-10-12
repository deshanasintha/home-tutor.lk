import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const form = document.getElementById('bookingForm');
if (!form) throw new Error('Booking form was not found.');

const submitButton = form.querySelector('button[type="submit"]');
const statusElement = document.getElementById('tutorLoadStatus');
const showStatus = (message, isError = false) => {
  statusElement.textContent = message;
  statusElement.setAttribute('role', isError ? 'alert' : 'status');
};

let currentUser = null;
let currentProfile = null;
let selectedTutor = null;
if (submitButton) submitButton.disabled = true;

const setValue = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value || 'Not provided';
};

const tutorId = new URLSearchParams(window.location.search).get('tutorId');
if (!tutorId) {
  showStatus('Select a tutor from the tutor search page before requesting a session.', true);
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showStatus('Please log in before submitting a booking request.', true);
      window.location.href = 'login.html';
      return;
    }

    currentUser = user;
    try {
      const [profileSnapshot, tutorSnapshot] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'users', tutorId))
      ]);

      if (!profileSnapshot.exists()) {
        throw new Error('Your user profile could not be found.');
      }
      currentProfile = profileSnapshot.data();
      if (!['parent', 'student'].includes(currentProfile.role)) {
        throw new Error('Only parent and student accounts can request a tutor.');
      }
      if (!tutorSnapshot.exists() || tutorSnapshot.data().role !== 'tutor') {
        throw new Error('The selected tutor profile could not be found.');
      }

      selectedTutor = { id: tutorSnapshot.id, ...tutorSnapshot.data() };
      const tutorName = typeof selectedTutor.name === 'string' ? selectedTutor.name : '';
      const subjects = typeof selectedTutor.subjects === 'string' ? selectedTutor.subjects : '';
      const grades = typeof selectedTutor.gradeLevels === 'string' ? selectedTutor.gradeLevels : '';
      const rate = Number(selectedTutor.hourlyRate);

      document.getElementById('tutorId').value = selectedTutor.id;
      document.getElementById('tutorName').value = tutorName;
      document.getElementById('subject').value = subjects;
      document.getElementById('grade').value = grades;
      document.getElementById('parentName').value = currentProfile.name || '';
      document.getElementById('parentContact').value = currentProfile.phone || '';

      setValue('tutorSummaryName', tutorName || 'Tutor name not provided');
      setValue('tutorSummaryQualification', selectedTutor.qualification || selectedTutor.institution);
      setValue('tutorSummarySubject', subjects);
      setValue('tutorSummaryGrades', grades);
      setValue('tutorSummaryDistrict', selectedTutor.district);
      setValue('tutorSummaryExperience', selectedTutor.experience);
      setValue('tutorSummaryMode', selectedTutor.teachingMode);
      setValue('tutorSummaryRate', Number.isFinite(rate) && rate > 0 ? `Rs. ${rate.toLocaleString()}` : 'Not set');
      setValue('tutorSummaryAvatar', tutorName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase());
      showStatus('Tutor profile loaded.');
      if (submitButton) submitButton.disabled = false;
    } catch (error) {
      console.error('Error preparing booking request:', error);
      showStatus(error.message || 'Unable to load the selected tutor. Please try again later.', true);
    }
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser || !currentProfile || !selectedTutor) {
    showStatus('A valid signed-in parent account and selected tutor are required.', true);
    return;
  }

  if (!form.reportValidity()) return;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
  }

  try {
    await addDoc(collection(db, 'bookings'), {
      parentId: currentUser.uid,
      parentName: document.getElementById('parentName').value.trim() || currentProfile.name || currentUser.email || '',
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name || '',
      subject: selectedTutor.subjects || '',
      grade: selectedTutor.gradeLevels || '',
      preferredDate: document.getElementById('date').value,
      preferredTime: document.getElementById('time').value,
      location: document.getElementById('location').value.trim(),
      message: document.getElementById('message').value.trim(),
      status: 'pending',
      createdAt: serverTimestamp()
    });

    showStatus('Booking request submitted successfully. Redirecting to your dashboard.');
    window.location.href = 'parent-dashboard.html';
  } catch (error) {
    console.error('Booking request failed:', error);
    showStatus('Unable to submit your booking request. Please try again later.', true);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Request';
    }
  }
});

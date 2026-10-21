import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const byId = (id) => document.getElementById(id);
const statusElement = byId('dashboardStatus');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  if (statusElement) statusElement.textContent = 'Dashboard loaded successfully.';
  loadTutorAvailability(user.uid);
});

// Availability Save කිරීම
const availabilityForm = byId('tutorAvailabilityForm');
if (availabilityForm) {
  availabilityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = byId('availDate').value;
    const startTime = byId('availStartTime').value;
    const endTime = byId('availEndTime').value;
    const user = auth.currentUser;

    if (!user) return;

    try {
      await addDoc(collection(db, 'availability'), {
        tutorId: user.uid,
        date: date,
        startTime: startTime,
        endTime: endTime,
        createdAt: new Date()
      });
      alert('Availability slot added successfully!');
      availabilityForm.reset();
      loadTutorAvailability(user.uid);
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('Failed to save slot.');
    }
  });
}

// Availability Slots Load කිරීම
async function loadTutorAvailability(tutorId) {
  const listContainer = byId('savedAvailabilityList');
  if (!listContainer) return;

  try {
    const q = query(collection(db, 'availability'), where('tutorId', '==', tutorId));
    const querySnapshot = await getDocs(q);

    listContainer.replaceChildren();
    if (querySnapshot.empty) {
      listContainer.innerHTML = '<div class="empty-state">No availability slots added yet.</div>';
      return;
    }

    querySnapshot.forEach((slotDoc) => {
      const data = slotDoc.data();
      const item = document.createElement('div');
      item.className = 'booking-entry';
      
      item.innerHTML = `
        <div>
          <strong>Date: ${data.date}</strong>
          <p style="font-size: 13px; color: #64748b;">Time: ${data.startTime} - ${data.endTime}</p>
        </div>
      `;
      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading availability:', error);
    listContainer.innerHTML = '<div class="empty-state">Error loading slots.</div>';
  }
}
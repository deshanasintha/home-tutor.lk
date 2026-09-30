import { auth, db } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const filterForm = document.querySelector('[data-results-filters]');
  const resultsCount = document.querySelector('[data-results-count]');
  const sortSelect = document.querySelector('[data-filter="sort"]');
  const feeRangeInput = document.querySelector('input[data-filter="price"]');
  const feeOutput = document.querySelector('[data-fee-output]');
  const resetButton = document.querySelector('.filter-reset');
  const formResetBtn = filterForm ? filterForm.querySelector('button[type="reset"]') : null;
  const parentContainer = document.getElementById('tutors-container') || document.querySelector('.tutor-grid');

  let tutorCards = [];

  // 1. Firestore එකෙන් Tutors ලා Load කර Card Render කිරීම
  async function loadTutorsFromFirestore() {
    if (!parentContainer) return;

    try {
      const querySnapshot = await getDocs(collection(db, "users"));
     
      // Clear Existing HTML Static Cards
      parentContainer.innerHTML = '';

      querySnapshot.forEach((docSnap) => {
        const tutor = docSnap.data();

        // Tutor Role එක ඇති අය පමණක් Render කිරීම
        if (tutor.role === 'tutor') {
          const card = document.createElement('article');
          card.className = 'tutor-card card';
          card.setAttribute('data-tutor-card', '');
          card.setAttribute('data-subject', tutor.subjects || '');
          card.setAttribute('data-district', tutor.district || '');
          card.setAttribute('data-grade', tutor.gradeLevels || '');
          card.setAttribute('data-price', tutor.hourlyRate || 0);
          card.setAttribute('data-rating', tutor.rating || 5.0);
          card.setAttribute('data-availability', (tutor.days || []).join(' '));

          const initials = tutor.name ? tutor.name.split(' ').map(n => n[0]).join('') : 'T';
          const imageHTML = tutor.photoURL
            ? `<img src="${tutor.photoURL}" alt="${tutor.name}" class="tutor-avatar-img">`
            : `<div class="tutor-avatar">${initials}</div>`;

          card.innerHTML = `
            <div class="tutor-card-top">
              ${imageHTML}
              <span class="rating">★ ${tutor.rating || '5.0'}</span>
            </div>
            <h3>${tutor.name || 'Anonymous Tutor'}</h3>
            <p class="tutor-subject">${tutor.subjects || 'Not specified'}</p>
            <div class="tutor-meta">
              <span>📍 ${tutor.district || 'Islandwide'}</span>
              <span>🎓 ${tutor.gradeLevels || 'All Grades'}</span>
            </div>
            <div class="tutor-footer">
              <strong class="price">LKR ${Number(tutor.hourlyRate || 0).toLocaleString()}<span>/hr</span></strong>
              <button type="button" class="btn btn-primary" onclick="handleBookTutor('${tutor.uid}', '${tutor.name}', '${tutor.subjects}', ${tutor.hourlyRate})">Book Now</button>
            </div>
          `;

          parentContainer.appendChild(card);
        }
      });

      // Render වූ පසු Card List එක Update කිරීම
      tutorCards = Array.from(document.querySelectorAll('[data-tutor-card]'));
     
      // Filter & Sort පළමු වරට Execute කිරීම
      applyFiltersAndSort();

    } catch (error) {
      console.error("Firestore Error:", error);
    }
  }

  // 2. Fee Range Slider Value Update
  if (feeRangeInput && feeOutput) {
    feeRangeInput.addEventListener('input', (e) => {
      feeOutput.textContent = `Rs. ${parseInt(e.target.value, 10).toLocaleString()}`;
      applyFiltersAndSort();
    });
  }

  // 3. Dynamic Filter Logic
  function applyFiltersAndSort() {
    if (!filterForm || tutorCards.length === 0) return;

    const formData = new FormData(filterForm);
    const selectedSubject = formData.get('subject') || '';
    const selectedGrade = formData.get('grade') || '';
    const selectedDistrict = formData.get('district') || '';
    const selectedPriceMax = parseFloat(feeRangeInput ? feeRangeInput.value : Infinity);
    const selectedRating = parseFloat(formData.get('rating') || '0');
   
    const selectedAvailabilities = Array.from(
      filterForm.querySelectorAll('input[name="availability"]:checked')
    ).map(cb => cb.value);

    let visibleCount = 0;

    tutorCards.forEach(card => {
      const subject = card.dataset.subject || '';
      const district = card.dataset.district || '';
      const grade = card.dataset.grade || '';
      const price = parseFloat(card.dataset.price || '0');
      const rating = parseFloat(card.dataset.rating || '0');
      const availability = card.dataset.availability || '';

      const matchesSubject = !selectedSubject || subject.toLowerCase().includes(selectedSubject.toLowerCase());
      const matchesDistrict = !selectedDistrict || district.toLowerCase().includes(selectedDistrict.toLowerCase());
      const matchesGrade = !selectedGrade || grade.toLowerCase().includes(selectedGrade.toLowerCase());
      const matchesPrice = price <= selectedPriceMax;
      const matchesRating = rating >= selectedRating;

      const matchesAvailability = selectedAvailabilities.length === 0 ||
        selectedAvailabilities.some(avail => availability.includes(avail));

      if (matchesSubject && matchesDistrict && matchesGrade && matchesPrice && matchesRating && matchesAvailability) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (resultsCount) {
      resultsCount.textContent = visibleCount;
    }

    sortCards();
  }

  // 4. Sorting Logic
  function sortCards() {
    if (!sortSelect || tutorCards.length === 0) return;
    const sortValue = sortSelect.value;
    const container = tutorCards[0].parentNode;

    const sortedCards = [...tutorCards].sort((a, b) => {
      const priceA = parseFloat(a.dataset.price || '0');
      const priceB = parseFloat(b.dataset.price || '0');
      const ratingA = parseFloat(a.dataset.rating || '0');
      const ratingB = parseFloat(b.dataset.rating || '0');

      if (sortValue === 'Highest rated') {
        return ratingB - ratingA;
      } else if (sortValue === 'Lowest fee') {
        return priceA - priceB;
      }
      return 0;
    });

    sortedCards.forEach(card => container.appendChild(card));
  }

  // Filter Listeners
  if (filterForm) filterForm.addEventListener('change', applyFiltersAndSort);
  if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);

  // Reset Listeners
  const resetFilters = () => {
    setTimeout(() => {
      if (feeRangeInput && feeOutput) {
        feeOutput.textContent = `Rs. ${parseInt(feeRangeInput.value, 10).toLocaleString()}`;
      }
      applyFiltersAndSort();
    }, 10);
  };

  if (resetButton) resetButton.addEventListener('click', resetFilters);
  if (formResetBtn) formResetBtn.addEventListener('click', resetFilters);

  // Load Firestore Data
  await loadTutorsFromFirestore();
});

// 5. Global Booking Function (Book Now Button එකට)
window.handleBookTutor = async function(tutorUid, tutorName, subject, hourlyRate) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    alert("Booking එකක් දාන්න කලින් කරුණාකර Login වන්න.");
    window.location.href = "login.html";
    return;
  }

  try {
    await addDoc(collection(db, "bookings"), {
      parentId: currentUser.uid,
      parentEmail: currentUser.email,
      tutorId: tutorUid,
      tutorName: tutorName,
      subject: subject,
      hourlyRate: Number(hourlyRate),
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Booking Request එක සාර්ථකව යැව්වා!");
  } catch (error) {
    console.error("Booking Error:", error);
    alert("Request එක යැවීමට නොහැකි විය: " + error.message);
  }
};
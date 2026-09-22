document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.querySelector('[data-results-filters]');
  const tutorCards = Array.from(document.querySelectorAll('[data-tutor-card]'));
  const resultsCount = document.querySelector('[data-results-count]');
  const sortSelect = document.querySelector('[data-filter="sort"]');
  const feeRangeInput = document.querySelector('input[data-filter="price"]');
  const feeOutput = document.querySelector('[data-fee-output]');
  const resetButton = document.querySelector('.filter-reset');
  const formResetBtn = filterForm ? filterForm.querySelector('button[type="reset"]') : null;

  if (!filterForm || tutorCards.length === 0) return;

  // 1. Fee Range Slider Value Update
  if (feeRangeInput && feeOutput) {
    feeRangeInput.addEventListener('input', (e) => {
      feeOutput.textContent = `Rs. ${parseInt(e.target.value, 10).toLocaleString()}`;
      applyFiltersAndSort();
    });
  }

  // 2. Filter Logic
  function applyFiltersAndSort() {
    const formData = new FormData(filterForm);
    const selectedSubject = formData.get('subject') || '';
    const selectedGrade = formData.get('grade') || '';
    const selectedDistrict = formData.get('district') || '';
    const selectedPriceMax = parseFloat(feeRangeInput ? feeRangeInput.value : Infinity);
    const selectedRating = parseFloat(formData.get('rating') || '0');
    
    // Checked availability values
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

      // Check Match
      const matchesSubject = !selectedSubject || subject.includes(selectedSubject);
      const matchesDistrict = !selectedDistrict || district.includes(selectedDistrict);
      const matchesGrade = !selectedGrade || grade.includes(selectedGrade);
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

    // Update results count label
    if (resultsCount) {
      resultsCount.textContent = visibleCount;
    }

    // Sort visible cards
    sortCards();
  }

  // 3. Sorting Logic
  function sortCards() {
    if (!sortSelect) return;
    const sortValue = sortSelect.value;
    const parentContainer = tutorCards[0].parentNode;

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
      return 0; // Default order
    });

    sortedCards.forEach(card => parentContainer.appendChild(card));
  }

  // Event Listeners for Filter inputs
  filterForm.addEventListener('change', applyFiltersAndSort);
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFiltersAndSort);
  }

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
});
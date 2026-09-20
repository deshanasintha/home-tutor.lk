(() => {
	const search = document.querySelector('[data-tutor-filter]');
	const cards = [...document.querySelectorAll('[data-tutor-card]')];

	search?.addEventListener('input', () => {
		const query = search.value.trim().toLowerCase();
		cards.forEach((card) => {
			const matches = card.textContent.toLowerCase().includes(query);
			card.hidden = !matches;
		});
	});

	document.querySelectorAll('.nav-links a, .nav-actions a').forEach((link) => {
		link.addEventListener('click', () => {
			const menu = document.querySelector('#nav-toggle');
			if (menu) menu.checked = false;
		});
	});
})();

document.addEventListener('DOMContentLoaded', function() {
  // ===== MENU SPA =====
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('main section');

  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); // blokujemy domyślny link
      const targetId = link.getAttribute('data-target'); // pobieramy ID sekcji

      // jeśli kliknięto 'dashboard' — pokaż tylko dashboard
      // w przeciwnym razie pokaż tylko docelową sekcję i ukryj dashboard
      sections.forEach(sec => {
        if (targetId === 'dashboard') {
          if (sec.id === 'dashboard') sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        } else {
          if (sec.id === targetId) sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        }
      });
    });
  });

  // ===== MODAL DODAWANIA POMIARU =====
  const openModalBtn = document.getElementById('open-add-measurement');
  const modal = document.getElementById('add-measurement-modal');
  const closeModal = document.getElementById('close-modal');

  // otwieranie modala
  openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));

  // zamykanie modala po kliknięciu X
  closeModal.addEventListener('click', () => modal.classList.add('hidden'));

  // zamykanie modala po kliknięciu poza modal
  window.addEventListener('click', e => {
    if(e.target === modal) modal.classList.add('hidden');
  });
});

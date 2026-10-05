document.querySelectorAll('.carta-teste').forEach((carta) => {
  carta.addEventListener('click', () => carta.classList.toggle('aberta'));
});

/* =======================================================
   Homenagem aos Professores — comportamento compartilhado
   Envio de recados, galeria com "ver mais", carrossel e
   menu mobile. As fotos agora são imagens fixas no código
   (pasta /fotos), não upload por clique.
   ======================================================= */

function renderNote(grid, text, from, atStart){
  const el = document.createElement('div');
  el.className = 'note';
  const safeText = text.replace(/</g, '&lt;');
  const safeFrom = from ? from.replace(/</g, '&lt;') : '';
  el.innerHTML = `&ldquo;${safeText}&rdquo;` + (safeFrom ? `<span class="from">&mdash; ${safeFrom}</span>` : '');
  if(atStart && grid.firstChild){ grid.insertBefore(el, grid.firstChild); }
  else{ grid.appendChild(el); }
  return el;
}

/* ---- Persistência dos recados novos no navegador (localStorage) ----
   Cada grid de recados tem um id (ex.: "notesAna"). Os recados
   escritos pelos visitantes ficam guardados sob a chave
   "recados:<id-do-grid>" e são recarregados sempre que a página
   é aberta de novo NESSE MESMO navegador/computador. */

function storageKeyFor(grid){ return 'recados:' + grid.id; }

function loadSavedNotes(grid){
  if(!grid.id) return;
  try{
    const saved = JSON.parse(localStorage.getItem(storageKeyFor(grid)) || '[]');
    saved.forEach(n => renderNote(grid, n.text, n.from, false));
  }catch(e){
    console.error('Não foi possível carregar os recados salvos.', e);
  }
}

function saveNote(grid, text, from){
  if(!grid.id) return;
  try{
    const key = storageKeyFor(grid);
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    saved.unshift({ text, from });
    localStorage.setItem(key, JSON.stringify(saved));
  }catch(e){
    console.error('Não foi possível salvar o recado.', e);
  }
}

function initNoteForm(form){
  const gridId = form.dataset.targetGrid;
  const grid = gridId ? document.getElementById(gridId) : form.parentElement.querySelector('.notes-grid');
  if(!grid) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const textField = form.querySelector('textarea');
    const fromField = form.querySelector('input[type="text"]');
    const text = textField.value.trim();
    const from = fromField ? fromField.value.trim() : '';
    if(!text) return;
    const el = renderNote(grid, text, from, true);
    saveNote(grid, text, from);
    form.reset();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function initNavToggle(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---- Galeria com limite: mostra só as primeiras fotos e revela
   o resto ao clicar no card "Ver mais fotos". ---- */
function initGalleryLimit(card){
  card.addEventListener('click', () => {
    const grid = card.closest('.frame-grid');
    if(!grid) return;
    grid.querySelectorAll('.extra.hidden').forEach(el => el.classList.remove('hidden'));
    card.remove();
  });
}

/* ---- Carrossel de fotos: rolagem nativa (ótimo no toque do
   celular) + botões, indicadores e avanço automático. ---- */
function initCarousel(root){
  const track = root.querySelector('.carousel-track');
  const dotsWrap = root.querySelector('.carousel-dots');
  const prevBtn = root.querySelector('.carousel-btn.prev');
  const nextBtn = root.querySelector('.carousel-btn.next');
  if(!track) return;
  const slides = Array.from(track.children);
  if(slides.length === 0) return;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Ir para a foto ' + (i + 1));
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => scrollToSlide(i));
    dotsWrap && dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  function currentIndex(){
    const trackLeft = track.scrollLeft;
    let closest = 0;
    let closestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - trackLeft);
      if(dist < closestDist){ closestDist = dist; closest = i; }
    });
    return closest;
  }

  function updateDots(){
    const i = currentIndex();
    dots.forEach((d, di) => d.classList.toggle('active', di === i));
  }

  function scrollToSlide(i){
    const clamped = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[clamped].offsetLeft, behavior: 'smooth' });
  }

  prevBtn && prevBtn.addEventListener('click', () => scrollToSlide(currentIndex() - 1));
  nextBtn && nextBtn.addEventListener('click', () => scrollToSlide(currentIndex() + 1));
  track.addEventListener('scroll', () => { window.requestAnimationFrame(updateDots); });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReducedMotion){
    let timer = setInterval(() => scrollToSlide(currentIndex() + 1), 4500);
    const pause = () => { clearInterval(timer); };
    const resume = () => { clearInterval(timer); timer = setInterval(() => scrollToSlide(currentIndex() + 1), 4500); };
    track.addEventListener('pointerdown', pause);
    track.addEventListener('pointerup', resume);
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.notes-grid').forEach(loadSavedNotes);
  document.querySelectorAll('.note-form').forEach(initNoteForm);
  document.querySelectorAll('.more-card').forEach(initGalleryLimit);
  document.querySelectorAll('.carousel').forEach(initCarousel);
  initNavToggle();
});

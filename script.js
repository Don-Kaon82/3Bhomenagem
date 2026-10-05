/* Interações compartilhadas. Os dados do visitante permanecem locais. */
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function readNotes(key) {
  const value = JSON.parse(localStorage.getItem(key) || '[]');
  if (!Array.isArray(value)) throw new Error('Formato de recados inválido');
  return value.filter(n => n && typeof n.text === 'string' && (!n.from || typeof n.from === 'string'));
}
function renderNote(grid, text, from) {
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = '“' + text + '”';
  if (from) { const author = document.createElement('span'); author.className = 'from'; author.textContent = '— ' + from; note.append(author); }
  grid.prepend(note);
  return note;
}
function initNoteForm(form) {
  const grid = document.getElementById(form.dataset.targetGrid);
  if (!grid) return;
  const key = 'recados:' + grid.id;
  const status = document.createElement('p'); status.className = 'form-status'; status.setAttribute('role', 'status'); form.append(status);
  try { readNotes(key).slice().reverse().forEach(n => renderNote(grid, n.text, n.from)); }
  catch { status.textContent = 'Não foi possível ler os recados salvos. Seus dados foram preservados.'; }
  const message = form.querySelector('textarea');
  const author = form.querySelector('input[type="text"]');
  [message, author].forEach((field, i) => { if (!field) return; field.id = grid.id + '-field-' + i; field.maxLength = i ? 100 : 2000; const label = field.previousElementSibling; if (label?.tagName === 'LABEL') label.htmlFor = field.id; });
  message.addEventListener('input', () => message.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = message.value.trim(), from = author?.value.trim() || '';
    if (!text) { message.setCustomValidity('Escreva uma mensagem antes de salvar.'); message.reportValidity(); return; }
    try { const notes = readNotes(key); notes.unshift({text, from}); localStorage.setItem(key, JSON.stringify(notes)); }
    catch { status.textContent = 'Não foi possível salvar neste navegador. Copie sua mensagem para não perdê-la e tente novamente.'; return; }
    renderNote(grid, text, from); form.reset(); status.textContent = 'Recado salvo com carinho! Ele estará aqui quando você voltar neste navegador.';
  });
}
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle'), links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  links.id = 'menu-principal'; toggle.setAttribute('aria-controls', links.id);
  function setOpen(open) { links.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); }
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  links.addEventListener('click', e => {if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('click', e => { if (!e.target.closest('.site-nav')) setOpen(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); } });
  window.matchMedia('(min-width: 721px)').addEventListener('change', () => setOpen(false));
  links.querySelector('a.active')?.setAttribute('aria-current', 'page');
}
function initCarousel(root) {
  const track = root.querySelector('.carousel-track'), dotsWrap = root.querySelector('.carousel-dots');
  if (!track || !dotsWrap) return;
  const slides = [...track.children]; let targets = [], dots = [];
  root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Momentos com os professores');
  track.tabIndex = 0; track.setAttribute('aria-label', 'Fotos da turma; use as setas para navegar');
  function currentIndex() { return targets.reduce((best, target, i) => Math.abs(target-track.scrollLeft) < Math.abs(targets[best]-track.scrollLeft) ? i : best, 0); }
  function update() { const active = currentIndex(); dots.forEach((dot,i) => { dot.classList.toggle('active',i===active); dot.setAttribute('aria-current',String(i===active)); }); }
  function go(i) { if(!targets.length)return; track.scrollTo({left:targets[(i+targets.length)%targets.length],behavior:reducedMotion()?'instant':'smooth'}); }
  function rebuild() {
    const max = Math.max(0, track.scrollWidth-track.clientWidth);
    const origin = slides[0]?.offsetLeft || 0;
    targets = [...new Set(slides.map(s=>Math.min(max,Math.max(0,s.offsetLeft-origin))))];
    dotsWrap.replaceChildren(); dots = targets.map((_,i)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label','Ir para o grupo de fotos '+(i+1));dot.addEventListener('click',()=>go(i));dotsWrap.append(dot);return dot;});
    root.querySelector('.carousel-controls').hidden = max <= 1; update();
  }
  root.querySelector('.prev')?.addEventListener('click',()=>go(currentIndex()-1));
  root.querySelector('.next')?.addEventListener('click',()=>go(currentIndex()+1));
  track.addEventListener('keydown',e=>{if(e.target!==track)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?targets.length-1:currentIndex()+(e.key==='ArrowLeft'?-1:1));}});
  track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
  new ResizeObserver(rebuild).observe(track); rebuild();
}
function initEdits() {
  const fields = document.querySelectorAll('.caption, [contenteditable="true"]');
  if (!fields.length) return;
  const status = document.createElement('p'); status.className='edit-status'; status.setAttribute('role','status'); status.textContent='Legendas e textos editáveis são salvos apenas neste navegador.'; document.querySelector('footer .wrap')?.append(status);
  let captionNumber = 0;
  fields.forEach((field,i)=>{
    const key='homenagem:edit:'+location.pathname.replace(/%20(2)/g,'')+':'+i;
    const isInput=field.tagName==='INPUT';
    field.setAttribute('aria-label',isInput?'Legenda da foto '+(++captionNumber):'Texto da homenagem (editável)');
    if(isInput)field.maxLength=180;
    else {field.setAttribute('role','textbox');field.setAttribute('aria-multiline','true');}
    try{const saved=localStorage.getItem(key);if(saved!==null){if(isInput)field.value=saved;else field.textContent=saved;}}catch{}
    field.addEventListener('input',()=>{try{localStorage.setItem(key,isInput?field.value:field.textContent);status.textContent='Alterações salvas neste navegador.';}catch{status.textContent='Não foi possível salvar suas alterações. Copie o texto antes de sair.';}});
  });
}
function normalize(str) { return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function initTeacherFilter() {
  const toggle = document.getElementById('filterToggle');
  const label = document.getElementById('filterToggleLabel');
  const panel = document.getElementById('filterPanel');
  const chipsWrap = document.getElementById('subjectChips');
  const grid = document.getElementById('teacherGrid');
  const noResults = document.getElementById('noResults');
  const searchToggle = document.getElementById('searchToggle');
  const searchField = document.getElementById('searchField');
  if (!toggle || !panel || !grid) return;
  const cards = Array.from(grid.querySelectorAll('.plaque'));
  let activeSubject = 'all';
  function applyFilter() {
    const query = searchField ? normalize(searchField.value.trim()) : '';
    let visibleCount = 0;
    cards.forEach(card => {
      const name = normalize(card.dataset.name || '');
      const subject = card.dataset.subject || '';
      const show = (activeSubject === 'all' || subject === activeSubject) && (!query || name.includes(query));
      card.classList.toggle('filtered-out', !show);
      if (show) visibleCount++;
    });
    if (noResults) noResults.classList.toggle('visible', visibleCount === 0);
  }
  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  if (chipsWrap) chipsWrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active'); activeSubject = chip.dataset.subject;
      if (label) label.textContent = activeSubject === 'all' ? 'Filtro' : activeSubject;
      toggle.classList.toggle('has-active', activeSubject !== 'all');
      applyFilter(); panel.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
    });
  });
  if (searchToggle && searchField) {
    searchToggle.addEventListener('click', () => {
      const isOpen = searchField.classList.toggle('open');
      searchToggle.classList.toggle('active', isOpen);
      searchToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) searchField.focus(); else { searchField.value = ''; applyFilter(); }
    });
    searchField.addEventListener('input', applyFilter);
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.note-form').forEach(initNoteForm);
  document.querySelectorAll('.more-card').forEach(card=>{
    function reveal(){const extra=[...card.closest('.frame-grid').querySelectorAll('.extra.hidden')];extra.forEach(el=>el.classList.remove('hidden'));extra[0]?.querySelector('input')?.focus({preventScroll:true});card.remove();}
    card.addEventListener('click',reveal);
    if(card.tagName!=='BUTTON'){card.setAttribute('role','button');card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reveal();}});}
  });
  document.querySelectorAll('img').forEach(img=>{img.decoding='async'; const fallback=()=>{const label=document.createElement('span');label.className='photo-fallback';label.textContent='Uma lembrança em breve';img.replaceWith(label);};img.addEventListener('error',fallback,{once:true});if(img.complete&&!img.naturalWidth)fallback();});
  document.querySelectorAll('.carousel').forEach(initCarousel);
  initNavToggle(); initEdits(); initTeacherFilter();
});

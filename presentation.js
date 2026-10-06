/* Present the same rendered report pages without changing data or print layout. */
(() => {
  'use strict';
  const preview = document.getElementById('reportPreview');
  const dialog = document.createElement('dialog');
  dialog.id = 'reportPresentation';
  dialog.setAttribute('aria-label', 'Report presentation');
  dialog.innerHTML = `<header class="present-toolbar"><div><strong id="presentTitle"></strong><span id="presentPeriod"></span></div><div class="present-controls"><button type="button" id="presentPrevious" aria-label="Previous page">← Previous</button><span id="presentCount" role="status" aria-live="polite"></span><button type="button" id="presentNext" aria-label="Next page">Next →</button><label class="present-fit-label">View <select id="presentFit"><option value="page">Fit page</option><option value="width">Fit width</option><option value="actual">100%</option></select></label><button type="button" id="presentFullscreen">Full screen</button><button type="button" id="presentClose">✕ Exit</button></div></header><div class="present-viewport" tabindex="0" aria-label="Report page; scroll to read when zoomed"><div class="present-frame"></div></div><footer class="present-help">← → Previous / next page · Home / End First / last page · Esc Exit · Use Fit width to read portrait pages</footer>`;
  document.body.append(dialog);
  const find = id => dialog.querySelector(id);
  const viewport = find('.present-viewport'), frame = find('.present-frame');
  let slides = [], index = 0, opener = null, ownsFullscreen = false;
  const buttons = [];
  for (const [anchor, id] of [['#topPrint', 'topPresent'], ['#reportPrint', 'reportPresent']]) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn present-launch'; button.id = id;
    button.textContent = '▶ Present report'; button.addEventListener('click', open);
    document.querySelector(anchor).before(button); buttons.push(button);
  }
  function layout() {
    if (!dialog.open || !slides.length) return;
    const slide = slides[index], mode = find('#presentFit').value;
    const width = Math.max(1, viewport.clientWidth - 32), height = Math.max(1, viewport.clientHeight - 32);
    const scale = mode === 'actual' ? 1 : mode === 'width' ? width / slide.width : Math.min(width / slide.width, height / slide.height);
    frame.style.width = `${slide.width * scale}px`;
    frame.style.height = `${slide.height * scale}px`;
    const page = frame.firstElementChild;
    page.style.transform = `scale(${scale})`;
    frame.style.marginTop = `${Math.max(16, (viewport.clientHeight - slide.height * scale) / 2)}px`;
  }
  function show(next) {
    index = Math.max(0, Math.min(next, slides.length - 1));
    const slide = slides[index], page = slide.node.cloneNode(true);
    page.classList.add('present-page');
    page.style.width = `${slide.width}px`; page.style.height = `${slide.height}px`;
    frame.replaceChildren(page);
    find('#presentCount').textContent = `Page ${index + 1} of ${slides.length}`;
    find('#presentPrevious').disabled = index === 0;
    find('#presentNext').disabled = index === slides.length - 1;
    layout(); viewport.scrollTo(0, 0);
  }
  function fullScreen() {
    if (!dialog.requestFullscreen || document.fullscreenElement) return;
    // Request synchronously from the click so the browser retains user activation.
    dialog.requestFullscreen().then(() => {
      if (!dialog.open) { document.exitFullscreen().catch(() => {}); return; }
      ownsFullscreen = true; layout();
    }).catch(() => { /* Full-window presentation still works when fullscreen is unavailable. */ });
  }
  function open(event) {
    opener = event.currentTarget;
    document.querySelector('[data-view="report"]').click();
    // View switching renders the latest selected disease, year and week first.
    if (!document.getElementById('reportView').classList.contains('active')) return;
    slides = [...preview.children].filter(el => el.matches('.source-page,.dengue-page,.dengue-detail-page')).map(el => {
      const rect = el.getBoundingClientRect(), node = el.cloneNode(true);
      node.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
      return { node, width: rect.width, height: Math.max(rect.height, el.scrollHeight) };
    });
    if (!slides.length) return;
    const disease = document.getElementById('diseaseSelect');
    find('#presentTitle').textContent = `${disease.selectedOptions[0].text} report`;
    find('#presentPeriod').textContent = `Binangonan · ${document.getElementById('reportYear').value} · MW 1–${document.getElementById('reportWeek').value}`;
    find('#presentFit').value = 'page';
    document.body.classList.add('presenting-report'); dialog.showModal(); show(0);
    viewport.focus(); fullScreen();
  }
  function close() {
    if (!dialog.open) return;
    dialog.close(); document.body.classList.remove('presenting-report');
    if (document.fullscreenElement === dialog) document.exitFullscreen().catch(() => {});
    ownsFullscreen = false; frame.replaceChildren(); slides = [];
    opener?.focus();
  }
  find('#presentPrevious').onclick = () => show(index - 1);
  find('#presentNext').onclick = () => show(index + 1);
  find('#presentClose').onclick = close;
  find('#presentFullscreen').onclick = fullScreen;
  find('#presentFit').onchange = () => { layout(); viewport.scrollTo(0, 0); };
  find('#presentFullscreen').hidden = !document.fullscreenEnabled;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.target.tagName === 'SELECT' || event.ctrlKey || event.altKey || event.metaKey) return;
    const next = { ArrowRight: index + 1, PageDown: index + 1, ArrowLeft: index - 1, PageUp: index - 1, Home: 0, End: slides.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); show(next); }
  });
  document.addEventListener('fullscreenchange', () => {
    if (ownsFullscreen && document.fullscreenElement !== dialog) close();
    find('#presentFullscreen').hidden = !document.fullscreenEnabled || document.fullscreenElement === dialog;
    layout();
  });
  new ResizeObserver(layout).observe(viewport);
  window.addEventListener('beforeprint', close);
})();

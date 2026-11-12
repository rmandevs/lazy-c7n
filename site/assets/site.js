// lazy-c7n site: app-like keys, copy buttons, active tab. The page works without this file.
(function () {
  'use strict';

  var GITHUB = 'https://github.com/rmandevs/lazy-c7n';
  var ids = ['why', 'status', 'install', 'principles'];
  var sections = ids.map(function (id) { return document.getElementById(id); });
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var help = document.getElementById('help');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = -1; // -1 = hero

  document.documentElement.classList.add('js');

  // Controls that only make sense with JS are hidden in the HTML.
  ['[data-hints]', '[data-help-open]', '[data-copy]'].forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.hidden = false; });
  });

  // ----- active tab -----
  function setCurrent(i) {
    if (i === current) return;
    current = i;
    tabs.forEach(function (tab, n) {
      if (n === i) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    sections.forEach(function (sec, n) { sec.classList.toggle('is-active', n === i); });
  }

  function updateCurrent() {
    // The active section is the last one whose top has passed a line 40% down the viewport.
    var line = window.innerHeight * 0.4;
    var found = -1;
    sections.forEach(function (sec, n) {
      if (sec.getBoundingClientRect().top <= line) found = n;
    });
    // At the very bottom of the page the last section wins.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      found = sections.length - 1;
    }
    setCurrent(found);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; updateCurrent(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateCurrent();

  // ----- jumping -----
  function jump(i) {
    var behavior = reduced.matches ? 'auto' : 'smooth';
    if (i < 0) {
      window.scrollTo({ top: 0, behavior: behavior });
      if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    var sec = sections[i];
    sec.scrollIntoView({ behavior: behavior, block: 'start' });
    var title = sec.querySelector('.panel-title');
    if (title) title.focus({ preventScroll: true });
    if (window.history.replaceState) window.history.replaceState(null, '', '#' + ids[i]);
  }

  // ----- help overlay -----
  function toggleHelp() {
    if (!help || typeof help.showModal !== 'function') return;
    if (help.open) help.close();
    else help.showModal();
  }
  var helpBtn = document.querySelector('[data-help-open]');
  if (helpBtn) helpBtn.addEventListener('click', toggleHelp);
  if (help) {
    // Click on the backdrop closes.
    help.addEventListener('click', function (e) { if (e.target === help) help.close(); });
  }

  // ----- keys -----
  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (isTyping(e.target)) return;

    if (e.key === '?') { e.preventDefault(); toggleHelp(); return; }
    if (help && help.open) return; // Esc is handled by the dialog itself.

    switch (e.key) {
      case '1': case '2': case '3': case '4':
        e.preventDefault();
        jump(Number(e.key) - 1);
        break;
      case '0':
        e.preventDefault();
        jump(-1);
        break;
      case 'l':
        e.preventDefault();
        jump(Math.min(current + 1, sections.length - 1));
        break;
      case 'h':
        e.preventDefault();
        jump(current <= 0 ? -1 : current - 1);
        break;
      case 'g':
        e.preventDefault();
        window.location.href = GITHUB;
        break;
    }
  });

  // ----- copy buttons -----
  function commandText(block) {
    var code = block.querySelector('pre code').cloneNode(true);
    Array.prototype.forEach.call(code.querySelectorAll('.prompt'), function (p) { p.remove(); });
    return code.textContent.replace(/\s+$/, '') + '\n';
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var block = btn.closest('[data-copy-block]');
    var timer = null;
    function flash(label, cls) {
      btn.textContent = label;
      btn.classList.toggle('is-ok', cls === 'ok');
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        btn.textContent = 'copy';
        btn.classList.remove('is-ok');
      }, 1600);
    }
    btn.setAttribute('aria-live', 'polite');
    btn.addEventListener('click', function () {
      var text = commandText(block);
      function done(ok) { flash(ok ? 'copied' : 'select it', ok ? 'ok' : ''); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { done(true); },
          function () { done(fallbackCopy(text)); }
        );
      } else {
        done(fallbackCopy(text));
      }
    });
  });
})();

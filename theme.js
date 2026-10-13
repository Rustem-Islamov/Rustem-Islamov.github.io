/* Shared by every page: dark-mode toggle + current-page highlighting in the header.
   Loaded synchronously in <head> so the saved theme is applied before first paint. */
(function () {
  var root = document.documentElement;
  var KEY = 'theme';

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function systemDark() { return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function current() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function apply(t) { root.setAttribute('data-theme', t); }

  apply(saved() || (systemDark() ? 'dark' : 'light'));

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/></svg>';

  function paint(btn) {
    var dark = current() === 'dark';
    btn.innerHTML = dark ? SUN : MOON;                       /* show the mode you would switch to */
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = dark ? 'Light mode' : 'Dark mode';
  }

  function addToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    paint(btn);
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next); save(next); paint(btn);
    });

    var topnav = document.querySelector('.topnav');          /* home page */
    var list = document.querySelector('#navbar-main .navbar-nav.mr-auto'); /* all other pages */
    if (topnav) {
      topnav.appendChild(btn);
    } else if (list) {
      var li = document.createElement('li');
      li.className = 'nav-item theme-toggle-item';
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function links() {
    return Array.prototype.slice.call(document.querySelectorAll('.topnav a, #navbar-main .nav-link'));
  }
  function setActive(a) {
    links().forEach(function (l) { l.classList.toggle('is-active', l === a); });
  }

  /* pages other than home: mark the section of the site you are in */
  function markCurrentPage() {
    var path = location.pathname.replace(/index\.html$/, '');
    var want = null;
    if (path.indexOf('/publication/') === 0) want = '/publication/';
    else if (path.indexOf('/research/') === 0) want = '/research/';
    if (!want) return;
    links().forEach(function (l) {
      var h = l.getAttribute('href');
      if (h && h.replace(/\/$/, '') === want.replace(/\/$/, '')) setActive(l);
    });
  }

  /* home page: the header only has page links now, so Home is the current one */
  function markHome() {
    var home = document.querySelector('.topnav a[href="#about"]');
    if (home) setActive(home);
  }

  document.addEventListener('DOMContentLoaded', function () {
    addToggle();
    if (document.querySelector('.topnav')) markHome(); else markCurrentPage();
  });

  /* ---------- Cite buttons: copy the BibTeX straight to the clipboard ---------- */
  function flash(btn) {
    if (!btn.__citeLabel) btn.__citeLabel = btn.innerHTML;
    btn.style.minWidth = btn.offsetWidth + 'px';              /* keep the button from jumping */
    btn.classList.add('is-copied');
    btn.textContent = 'Copied \u2713';
    clearTimeout(btn.__citeTimer);
    btn.__citeTimer = setTimeout(function () {
      btn.classList.remove('is-copied');
      btn.innerHTML = btn.__citeLabel; btn.style.minWidth = '';
    }, 1800);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); return ok;
  }
  function openPopup(btn) {                                    /* fallback: the page's own Cite window */
    btn.__citeFallback = true; btn.click(); btn.__citeFallback = false;
  }
  function copyBib(btn) {
    var file = btn.getAttribute('data-filename');
    var text = fetch(file, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('bib'); return r.text(); })
      .then(function (t) { return t.trim(); });
    var viaItem = window.ClipboardItem && navigator.clipboard && navigator.clipboard.write
      ? navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then(function (t) { return new Blob([t], { type: 'text/plain' }); }) })])
      : Promise.reject();
    viaItem.catch(function () {                                /* e.g. Firefox: write after the download finishes */
      return text.then(function (t) {
        return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject())
          .catch(function () { if (!legacyCopy(t)) throw new Error('copy'); });
      });
    }).then(function () { flash(btn); }, function () { openPopup(btn); });
  }
  document.addEventListener('click', function (e) {            /* capture phase: runs before the page's own handlers */
    var btn = e.target && e.target.closest ? e.target.closest('.js-cite-modal') : null;
    if (!btn || btn.__citeFallback || !btn.getAttribute('data-filename')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    copyBib(btn);
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.js-cite-modal'), function (b) { b.title = 'Copy BibTeX to clipboard'; });
  });

  /* keep every open page in sync: tabs, and pages restored from the back/forward cache */
  function sync() {
    var t = saved() || (systemDark() ? 'dark' : 'light');
    if (t !== current()) apply(t);
    var b = document.querySelector('.theme-toggle'); if (b) paint(b);
  }
  window.addEventListener('pageshow', sync);
  window.addEventListener('storage', function (e) { if (e.key === KEY) sync(); });

  /* follow the system setting until the visitor makes a choice */
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!saved()) { apply(e.matches ? 'dark' : 'light'); var b = document.querySelector('.theme-toggle'); if (b) paint(b); } };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
})();

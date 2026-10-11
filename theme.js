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

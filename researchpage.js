/* Contributions timeline: the filled circle marks the active item.
   It follows the mouse; when the mouse is elsewhere it follows the item nearest the middle of the screen. */
(function () {
  var tl = document.querySelector('.ct-tl');
  if (!tl) return;
  var items = Array.prototype.slice.call(tl.querySelectorAll('.ct'));
  if (!items.length) return;
  var hovered = null, active = null;
  function set(el) {
    if (el === active) return;
    active = el;
    items.forEach(function (it) { it.classList.toggle('is-on', it === el); });
  }
  function byScroll() {
    var mid = window.innerHeight * 0.5, best = items[0], bd = Infinity;
    items.forEach(function (it) {
      var r = it.getBoundingClientRect(), c = (r.top + r.bottom) / 2, d = Math.abs(c - mid);
      if (d < bd) { bd = d; best = it; }
    });
    var tr = tl.getBoundingClientRect();
    if (tr.bottom < 0 || tr.top > window.innerHeight) best = items[0];
    return best;
  }
  function update() { set(hovered || byScroll()); }
  items.forEach(function (it) {
    it.addEventListener('mouseenter', function () { hovered = it; update(); });
    it.addEventListener('mouseleave', function () { if (hovered === it) hovered = null; update(); });
  });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

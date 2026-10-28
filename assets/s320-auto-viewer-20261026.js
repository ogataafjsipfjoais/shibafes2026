/* Activate the existing viewer when visible, including after client-side navigation. */
(function () {
  'use strict';
  if (!window.IntersectionObserver || !window.MutationObserver) return;
  var root = document.getElementById('root');
  if (!root) return;
  var section = null, visible = false, activated = false, observer = null;
  function activate() {
    if (!section || !visible || activated) return;
    var button = section.querySelector('.viewer-activate');
    if (!button) return;
    activated = true;
    observer.disconnect();
    button.click();
  }
  function watch() {
    var next = document.getElementById('s320');
    if (next !== section) {
      if (observer) observer.disconnect();
      section = next; visible = false; activated = false;
      if (section) {
        var target = section;
        observer = new IntersectionObserver(function (entries) {
          if (section !== target) return;
          visible = entries.some(function (entry) { return entry.isIntersecting; });
          activate();
        }, { rootMargin: '100px 0px', threshold: 0 });
        observer.observe(section);
      }
    }
    activate();
  }
  new MutationObserver(watch).observe(root, { childList: true, subtree: true });
  watch();
})();
